import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY as string;

if (!geminiApiKey) console.warn("VITE_GEMINI_API_KEY belum diisi di file .env");
if (!groqApiKey) console.warn("VITE_GROQ_API_KEY belum diisi di file .env");

const genAI = new GoogleGenerativeAI(geminiApiKey);

// 1. Model embedding: WAJIB pakai Gemini
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-2",
});

// ============================================================================
// 2A. PROMPT GEMINI (Natural & Bebas) - Kita kembalikan ke versi awal yang bagus
// ============================================================================
const geminiSystemInstruction = 
  "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
  "Tugasmu menjawab pertanyaan mahasiswa secara akurat berdasarkan informasi yang diberikan. " +
  "ATURAN PENTING: " +
  "1. Gunakan bahasa yang ramah, solutif, dan natural. Berikan formatting Markdown yang rapi (bold untuk menu/tombol, dan link yang bisa diklik) jika diperlukan. " +
  "2. JANGAN PERNAH menyebutkan kata 'dokumen', 'konteks', 'database', atau 'sistem' dalam jawabanmu. " +
  "3. Jika informasi tidak tersedia, arahkan ke IG @akademik.telkomsby atau email akademik@ittelkom-sby.ac.id.";

// ============================================================================
// 2B. PROMPT GROQ / LLAMA (Kaku & Cerewet) - Karena Llama butuh ancaman
// ============================================================================
const groqSystemInstruction = 
  "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
  "ATURAN FORMATTING (SANGAT WAJIB):\n" +
  "1. Wajib tebalkan nama menu, nama tombol, atau status menggunakan bintang ganda (**teks**).\n" +
  "2. Jika ada URL, WAJIB ubah menjadi format markdown link yang bisa diklik. Contoh: [Panduan SSC](https://linktr.ee/laa.upps.sby).\n" +
  "3. Gunakan list angka (1. 2. 3.) dan bullet (-).\n\n" +
  "ATURAN ANTI-HALUSINASI (HARGA MATI):\n" +
  "1. JANGAN PERNAH menyebutkan kata 'dokumen', 'database', atau 'sistem'.\n" +
  "2. Jika informasi yang ditanyakan (misalnya soal KRS, SLA/lama waktu verifikasi, dll) TIDAK TERTULIS SECARA EKSPLISIT di dalam teks konteks, kamu DILARANG KERAS memberikan asumsi, tebakan logis, atau alasan karangan (seperti beralasan soal beban kerja admin, atau menyuruh mahasiswa mencari menu sendiri). " +
  "3. Jika informasi tidak ada, cukup katakan dengan tegas dan sopan bahwa kamu belum memiliki informasi detail mengenai hal tersebut, lalu langsung arahkan mahasiswa ke IG @akademik.telkomsby atau email akademik@ittelkom-sby.ac.id.";
  
// 3. Model chat utama: Gemini 2.5 Flash
const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: geminiSystemInstruction, // <-- Pakai prompt yang natural
});

export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function generateAnswer(
  question: string,
  contextText: string
): Promise<string> {
  const prompt = `Konteks:\n${contextText}\n\nPertanyaan: ${question}`;

  try {
    // === OPSI A: Coba gunakan Gemini ===
    const result = await chatModel.generateContent(prompt);
    console.log("🟢 STATUS AI: Dijawab oleh GEMINI");
    return result.response.text();

  } catch (error: any) {
    console.warn("Gemini limit/error, otomatis beralih ke Groq...", error.message);

    // === OPSI B: Kalau Gemini limit, panggil Groq ===
    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: groqSystemInstruction }, // <-- Pakai prompt yang cerewet
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!groqResponse.ok) {
        throw new Error("Groq API gagal merespons.");
      }

      const groqData = await groqResponse.json();
      const answer = groqData.choices[0].message.content;
      
      console.log("🟠 STATUS AI: Dijawab oleh GROQ (LLAMA-3.3)");
      return answer + "\n\n*(⚡ Fallback: Dijawab oleh Llama-3)*";

    } catch (backupError) {
      console.error("Semua layanan AI gagal merespons:", backupError);
      return "Mohon maaf, layanan chatbot kami sedang sibuk. Silakan coba beberapa saat lagi atau hubungi IG @akademik.telkomsby.";
    }
  }
}