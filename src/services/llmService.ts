import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY as string;

if (!geminiApiKey) console.warn("VITE_GEMINI_API_KEY belum diisi di file .env");
if (!groqApiKey) console.warn("VITE_GROQ_API_KEY belum diisi di file .env");

const genAI = new GoogleGenerativeAI(geminiApiKey);

const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-2",
});

const geminiSystemInstruction = 
  "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
  "Tugasmu menjawab pertanyaan mahasiswa secara akurat berdasarkan informasi yang diberikan. " +
  "ATURAN PENTING: " +
  "1. Gunakan bahasa yang ramah, solutif, dan natural. Berikan formatting Markdown yang rapi (bold untuk menu/tombol, dan link yang bisa diklik) jika diperlukan. " +
  "2. JANGAN PERNAH menyebutkan kata 'dokumen', 'konteks', 'database', atau 'sistem' dalam jawabanmu. " +
  "3. Jika informasi tidak tersedia, arahkan ke IG @akademik.telkomsby atau email akademik@ittelkom-sby.ac.id.";

const groqSystemInstruction = 
  "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
  "ATURAN FORMATTING:\n" +
  "- Wajib tebalkan nama menu/tombol (**teks**).\n" +
  "- Ubah URL menjadi tautan klik [Teks](URL).\n" +
  "- Gunakan list (1. 2. 3.) dan bullet (-).\n\n" +
  "ALUR KEPUTUSAN LOGIKA (DECISION TREE) WAJIB:\n" +
  "IF (Pengguna menanyakan topik yang TIDAK ADA sama sekali di teks, misal: KRS, SLA, error sistem, dsb):\n" +
  "THEN: JANGAN menebak, JANGAN berasumsi, dan JANGAN menyuruh pengguna mencari sendiri di sistem. Langsung jawab: 'Mohon maaf, saya belum memiliki informasi detail mengenai hal tersebut. Silakan hubungi IG @akademik.telkomsby atau email akademik@ittelkom-sby.ac.id.'\n\n" +
  "IF (Pengguna mengajukan cara alternatif atau format buatan sendiri seperti MS Word, YANG BERTENTANGAN dengan prosedur di teks):\n" +
  "THEN: TOLAK permintaan tersebut dengan sopan. Tegaskan bahwa mereka WAJIB mengikuti prosedur di teks (misal: wajib mengunduh format resmi yang sudah disediakan).\n\n" +
  "IF (Informasi tersedia di teks dan sesuai prosedur):\n" +
  "THEN: Jawab pertanyaan dengan ramah dan solutif. JANGAN PERNAH menyebutkan kata 'dokumen', 'teks', 'database', atau 'konteks'.";
   
const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: geminiSystemInstruction, 
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
    const result = await chatModel.generateContent(prompt);
    console.log("🟢 STATUS AI: Dijawab oleh GEMINI");
    return result.response.text();

  } catch (error: any) {
    console.warn("Gemini limit/error, otomatis beralih ke Groq...", error.message);

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
            { role: "system", content: groqSystemInstruction }, 
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