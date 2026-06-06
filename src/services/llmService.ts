import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY as string;

if (!geminiApiKey) {
  console.warn("VITE_GEMINI_API_KEY belum diisi di file .env");
}
if (!groqApiKey) {
  console.warn("VITE_GROQ_API_KEY belum diisi di file .env");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

// 1. Model embedding: WAJIB pakai Gemini agar dimensi vektor (3072) tetap cocok dengan database
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-2",
});

// 2. Simpan instruksi sistem ke variabel agar bisa dipakai oleh Gemini dan Groq
const systemInstructionText = 
  "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
  "Tugasmu menjawab pertanyaan mahasiswa secara akurat berdasarkan informasi yang diberikan. " +
  "ATURAN PENTING: " +
  "1. Gunakan bahasa yang ramah, solutif, dan natural. " +
  "2. JANGAN PERNAH menyebutkan kata 'dokumen', 'konteks', 'database', atau 'sistem' dalam jawabanmu. Bersikaplah seolah-olah kamu memang mengetahui informasi tersebut secara langsung. " +
  "3. Jika informasi yang ditanyakan tidak tersedia, JANGAN mengarang jawaban. Sampaikan dengan sopan bahwa kamu belum memiliki informasi detail mengenai hal tersebut, lalu arahkan mahasiswa untuk menghubungi SSC secara langsung via Instagram @akademik.telkomsby atau email akademik@ittelkom-sby.ac.id.";

// 3. Model chat utama: Gemini 2.5 Flash
const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: systemInstructionText,
});

// Ubah satu potongan teks menjadi vektor (TETAP GEMINI)
export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

// Susun jawaban berdasarkan pertanyaan + konteks dokumen relevan (DENGAN FALLBACK GROQ)
export async function generateAnswer(
  question: string,
  contextText: string
): Promise<string> {
  // Susun prompt yang menggabungkan konteks dan pertanyaan
  const prompt = `Konteks:\n${contextText}\n\nPertanyaan: ${question}`;

  try {
    // === OPSI A: Coba gunakan Gemini ===
    const result = await chatModel.generateContent(prompt);
    return result.response.text();

  } catch (error: any) {
    console.warn("Gemini limit/error, otomatis beralih ke Groq (Llama-3)...", error.message);

    // === OPSI B: Kalau Gemini gagal/limit, otomatis panggil Groq ===
    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", 
          messages: [
            // Kirim aturan SSC ke Groq
            { role: "system", content: systemInstructionText },
            // Kirim konteks dan pertanyaan user
            { role: "user", content: prompt }
          ],
          temperature: 0.3 // Supaya jawabannya tidak terlalu halusinasi
        })
      });

      if (!groqResponse.ok) {
        throw new Error("Groq API juga gagal merespons.");
      }

      const groqData = await groqResponse.json();
      return groqData.choices[0].message.content;

    } catch (backupError) {
      console.error("Semua layanan AI gagal merespons:", backupError);
      return "Mohon maaf, layanan chatbot kami sedang sibuk. Silakan coba beberapa saat lagi atau hubungi langsung via Instagram @akademik.telkomsby.";
    }
  }
}