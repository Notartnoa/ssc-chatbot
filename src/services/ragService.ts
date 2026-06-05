import { supabase } from "./supabaseClient";
import { embedText, generateAnswer } from "./llmService";
import type { Source } from "../types/Message";

export async function askQuestion(
  question: string
): Promise<{ answer: string; sources: Source[] }> {
  try {
    // 1. Ubah pertanyaan mahasiswa jadi vektor angka
    const queryVector = await embedText(question);

    // 2. Panggil fungsi pencarian pintar (RPC) di Supabase
    const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryVector,
      match_threshold: 0.5, // 0.5 = minimal 50% kemiripan dokumen
      match_count: 3,       // Ambil 3 referensi dokumen terbaik
    });

    if (error) throw error;

    // 3. Jika tidak ada dokumen yang cocok di Supabase
    if (!chunks || chunks.length === 0) {
      return {
        answer: "Maaf, informasi mengenai hal tersebut belum tersedia di dokumen SSC. Silakan hubungi pihak akademik secara langsung.",
        sources: [],
      };
    }

    // 4. Susun hasil pencarian ke dalam format yang dimengerti UI Chatbot
    const sources: Source[] = chunks.map((chunk: any) => ({
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      url: chunk.url,
    }));

    // 5. Gabungkan teks referensi untuk dikirim ke Gemini
    const contextText = sources
      .map((s) => {
        const urlNote = s.url ? `\nURL: ${s.url}` : "";
        return `[${s.source}]\n${s.text}${urlNote}`;
      })
      .join("\n\n");

    // 6. Gemini menyusun jawaban akhir
    const answer = await generateAnswer(question, contextText);

    return { answer, sources };
  } catch (error) {
    console.error("Gagal memproses RAG:", error);
    throw error;
  }
}