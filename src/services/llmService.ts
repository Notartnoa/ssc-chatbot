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
// 2. Simpan instruksi sistem ke variabel agar bisa dipakai oleh Gemini dan Groq
const systemInstructionText = 
  "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
  "Tugasmu menjawab pertanyaan mahasiswa secara akurat berdasarkan informasi yang diberikan. " +
  "ATURAN PENTING: " +
  "1. Gunakan bahasa yang ramah, solutif, dan natural. " +
  "2. FORMATTING & MARKDOWN (SANGAT WAJIB): " +
  "- Selalu gunakan list angka (1. 2. 3.) untuk urutan langkah-langkah. " +
  "- Gunakan bullet points (-) untuk daftar opsi atau syarat. " +
  "- WAJIB gunakan huruf tebal (**tebal**) untuk menyoroti nama menu, tombol, status, atau kata kunci krusial (contoh: menu **Layanan**, tombol **Simpan**, status **Waiting**). " +
  "- JIKA ADA TAUTAN ATAU URL, WAJIB ubah menjadi clickable link dengan format Markdown [Teks Tampilan](URL yang lengkap dengan https://). JANGAN biarkan URL tampil sebagai teks biasa. " +
  "3. JANGAN PERNAH menyebutkan kata 'dokumen', 'konteks', 'database', atau 'sistem' dalam jawabanmu. Bersikaplah seolah-olah kamu memang mengetahui informasi tersebut secara langsung. " +
  "4. Jika informasi yang ditanyakan tidak tersedia, JANGAN mengarang jawaban. Arahkan mahasiswa untuk menghubungi SSC secara langsung via Instagram @akademik.telkomsby atau email akademik@ittelkom-sby.ac.id.";
    
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
    console.warn("Gemini limit/error, otomatis beralih ke Groq...", error.message);

    // === OPSI B: Kalau Gemini gagal/limit, otomatis panggil Groq ===
    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // <-- Menggunakan model dari referensi praktikum!
          messages: [
            { role: "system", content: systemInstructionText },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      });

      // CCTV Error: Tangkap alasan spesifik dari Groq jika gagal
      if (!groqResponse.ok) {
        const errDetail = await groqResponse.json();
        console.error("Detail Error dari Groq:", errDetail);
        throw new Error(`Groq menolak request: ${errDetail.error?.message || "Bad Request"}`);
      }

      const groqData = await groqResponse.json();
      return groqData.choices[0].message.content;

    } catch (backupError) {
      console.error("Semua layanan AI gagal merespons:", backupError);
      return "Mohon maaf, layanan chatbot kami sedang sibuk. Silakan coba beberapa saat lagi atau hubungi langsung via Instagram @akademik.telkomsby.";
    }
  }
}