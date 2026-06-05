import { supabase } from "./supabaseClient";
import { embedText } from "./llmService";
import type { AdminDocument } from "../types/Message";

// 1. Ambil semua dokumen dari Supabase
export async function getDocuments(): Promise<AdminDocument[]> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Mapping 'created_at' dari Supabase menjadi 'uploadedAt' untuk UI
    return data.map((doc: any) => ({
      ...doc,
      uploadedAt: doc.created_at 
    })) as AdminDocument[];
    
  } catch (error) {
    console.error("Gagal mengambil dokumen:", error);
    return [];
  }
}

// 2. Simpan dokumen baru + Chunking + Embedding
export async function saveDocument(
  title: string,
  content: string,
  type: "text" | "pdf" | "link" = "text",
  url?: string
): Promise<AdminDocument | null> {
  try {
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert([{ title: title.trim(), content: content.trim(), type, url }])
      .select()
      .single();

    if (docError) throw docError;
    const newDoc = docData as AdminDocument;

    const chunks: { source: string; text: string; url?: string }[] = [];

    if (type === "link") {
      const text = [
        `${newDoc.title}.`,
        `URL / Link: ${newDoc.url}`,
        newDoc.content && newDoc.content !== `Link menuju ${newDoc.title}`
          ? `Keterangan: ${newDoc.content}`
          : "",
      ].filter(Boolean).join(" ");
      
      chunks.push({ source: newDoc.title, text, url: newDoc.url });
    } else {
      const paragraphs = newDoc.content
        .split(/\n\n+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 30);

      if (paragraphs.length === 0) {
        chunks.push({ source: newDoc.title, text: newDoc.content });
      } else {
        paragraphs.forEach((p: string) => {
          chunks.push({ source: newDoc.title, text: p });
        });
      }
    }

    const chunkInserts = await Promise.all(
      chunks.map(async (chunk) => {
        const embeddingVector = await embedText(chunk.text);
        return {
          document_id: newDoc.id,
          source: chunk.source,
          text: chunk.text,
          url: chunk.url,
          embedding: embeddingVector, 
        };
      })
    );

    const { error: chunkError } = await supabase
      .from("document_chunks")
      .insert(chunkInserts);

    if (chunkError) throw chunkError;

    return newDoc;
  } catch (error) {
    console.error("Gagal menyimpan dokumen & embedding:", error);
    return null;
  }
}

// 3. Hapus dokumen
export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Gagal menghapus dokumen:", error);
    return false;
  }
}

// 4. Update dokumen
export async function updateDocument(
  id: string,
  patch: { title?: string; content?: string; url?: string; type?: "text" | "pdf" | "link" }
): Promise<AdminDocument | null> {
  try {
    const { data: oldDoc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
      
    if (fetchError) throw fetchError;

    const updatedTitle = patch.title !== undefined ? patch.title.trim() : oldDoc.title;
    const updatedContent = patch.content !== undefined ? patch.content.trim() : oldDoc.content;
    const updatedType = patch.type !== undefined ? patch.type : oldDoc.type;
    const updatedUrl = patch.url !== undefined ? patch.url.trim() : oldDoc.url;

    const { data: updatedData, error: updateError } = await supabase
      .from("documents")
      .update({ title: updatedTitle, content: updatedContent, type: updatedType, url: updatedUrl })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    const { error: deleteChunkError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", id);

    if (deleteChunkError) throw deleteChunkError;

    const chunks: { source: string; text: string; url?: string }[] = [];

    if (updatedType === "link") {
      const text = [
        `${updatedTitle}.`,
        `URL / Link: ${updatedUrl}`,
        updatedContent && updatedContent !== `Link menuju ${updatedTitle}`
          ? `Keterangan: ${updatedContent}`
          : "",
      ].filter(Boolean).join(" ");
      chunks.push({ source: updatedTitle, text, url: updatedUrl });
    } else {
      const paragraphs = updatedContent
        .split(/\n\n+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 30);

      if (paragraphs.length === 0) {
        chunks.push({ source: updatedTitle, text: updatedContent });
      } else {
        paragraphs.forEach((p: string) => {
          chunks.push({ source: updatedTitle, text: p });
        });
      }
    }

    const chunkInserts = await Promise.all(
      chunks.map(async (chunk) => {
        const embeddingVector = await embedText(chunk.text);
        return {
          document_id: id,
          source: chunk.source,
          text: chunk.text,
          url: chunk.url,
          embedding: embeddingVector,
        };
      })
    );

    const { error: insertChunkError } = await supabase
      .from("document_chunks")
      .insert(chunkInserts);

    if (insertChunkError) throw insertChunkError;

    return updatedData as AdminDocument;
  } catch (error) {
    console.error("Gagal mengupdate dokumen:", error);
    return null;
  }
}