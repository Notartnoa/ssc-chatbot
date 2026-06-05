import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY belum diisi di file .env");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Model embedding: ubah teks jadi vektor (untuk pencarian dokumen)
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-2",
});

// Model chat: menyusun jawaban berdasarkan konteks dokumen
const chatModel = genAI.getGenerativeModel({
  model: "gemini-pro",
  systemInstruction:
    "Kamu adalah asisten layanan akademik Student Service Center (SSC) Telkom University Surabaya. " +
    "Tugasmu menjawab pertanyaan mahasiswa secara akurat berdasarkan informasi yang diberikan. " +
    "ATURAN PENTING: " +
    "1. Gunakan bahasa yang ramah, solutif, dan natural. " +
    "2. JANGAN PERNAH menyebutkan kata 'dokumen', 'konteks', 'database', atau 'sistem' dalam jawabanmu. Bersikaplah seolah-olah kamu memang mengetahui informasi tersebut secara langsung. " +
    "3. Jika informasi yang ditanyakan tidak tersedia, JANGAN mengarang jawaban. Sampaikan dengan sopan bahwa kamu belum memiliki informasi detail mengenai hal tersebut, lalu arahkan mahasiswa untuk menghubungi SSC secara langsung via Instagram @akademik.telkomsby atau email akademik@ittelkom-sby.ac.id.",
});

// Ubah satu potongan teks menjadi vektor.
export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

// Susun jawaban berdasarkan pertanyaan + konteks dokumen relevan.
export async function generateAnswer(
  question: string,
  contextText: string
): Promise<string> {
  const prompt = `Konteks:\n${contextText}\n\nPertanyaan: ${question}`;
  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}