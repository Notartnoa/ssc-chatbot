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

// 1. Model embedding: WAJIB pakai Gemini
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-2",
});

// 2. FEW-SHOT PROMPTING: Kita beri "Mockup" teks agar AI meniru persis gaya formatnya
const systemInstructionText = 
  "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
  "ATURAN FORMATTING (SANGAT WAJIB):\n" +
  "1. Wajib tebalkan nama menu, nama tombol, atau status menggunakan bintang ganda. Contoh: klik tombol **Ajukan Surat**, pilih menu **Layanan**.\n" +
  "2. Jika ada URL, WAJIB ubah menjadi format markdown link yang bisa diklik. Contoh: [Panduan SSC](https://linktr.ee/laa.upps.sby).\n" +
  "3. Gunakan list angka (1. 2. 3.) dan bullet (-).\n\n" +
  "CONTOH JAWABAN YANG BENAR:\n" +
  "Berikut langkah-langkahnya:\n" +
  "1. Buka menu **Surat Keterangan**.\n" +
  "2. Klik tombol **Ajukan Surat**.\n" +
  "Untuk info lebih lanjut, silakan cek [Tautan Panduan Ini](https://linktr.ee/laa.upps.sby).\n\n" +
  "ATURAN LAIN:\n" +
  "JANGAN sebutkan kata 'dokumen', 'database', atau 'sistem'. Jika tidak tahu, arahkan ke IG @akademik.telkomsby.";

// 3. Model chat utama: Gemini 2.5 Flash
const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: systemInstructionText,
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
    
    // Log di console browser untuk debugging
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
            { role: "system", content: systemInstructionText },
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

      // WATERMARK UI: Menambahkan teks kecil di akhir chat supaya mahasiswa/developer tahu
      return answer + "\n\n*(⚡ Fallback: Dijawab oleh Llama-3)*";

    } catch (backupError) {
      console.error("Semua layanan AI gagal merespons:", backupError);
      return "Mohon maaf, layanan chatbot kami sedang sibuk. Silakan coba beberapa saat lagi atau hubungi IG @akademik.telkomsby.";
    }
  }
}