import { supabase } from "./supabaseClient";
import { embedText, generateAnswer } from "./llmService";
import type { Source } from "../types/Message";

export async function askQuestion(
  question: string
): Promise<{ answer: string; sources: Source[] }> {
  try {
    const queryVector = await embedText(question);
    const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryVector,
      match_threshold: 0.5, 
      match_count: 3,       
    });

    if (error) throw error;

    if (!chunks || chunks.length === 0) {
      return {
        answer: "Maaf, informasi mengenai hal tersebut belum tersedia di dokumen SSC. Silakan hubungi pihak akademik secara langsung.",
        sources: [],
      };
    }

    const sources: Source[] = chunks.map((chunk: any) => ({
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      url: chunk.url,
    }));

    const contextText = sources
      .map((s) => {
        const urlNote = s.url ? `\nURL: ${s.url}` : "";
        return `[${s.source}]\n${s.text}${urlNote}`;
      })
      .join("\n\n");

    const answer = await generateAnswer(question, contextText);

    return { answer, sources };
  } catch (error) {
    console.error("Gagal memproses RAG:", error);
    throw error;
  }
}