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
    
    // PERBAIKAN: Mapping 'created_at' dari Supabase menjadi 'uploadedAt' untuk UI
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
    // A. Insert ke tabel master 'documents'
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert([{ title: title.trim(), content: content.trim(), type, url }])
      .select()
      .single();

    if (docError) throw docError;
    const newDoc = docData as AdminDocument;

    // B. Logika pemecahan teks (Chunking)
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
        .map((p) => p.trim())
        .filter((p) => p.length > 30);

      if (paragraphs.length === 0) {
        chunks.push({ source: newDoc.title, text: newDoc.content });
      } else {
        paragraphs.forEach((p) => {
          chunks.push({ source: newDoc.title, text: p });
        });
      }
    }

    // C. Ubah setiap chunk jadi vektor dan siapkan data untuk di-insert
    const chunkInserts = await Promise.all(
      chunks.map(async (chunk) => {
        const embeddingVector = await embedText(chunk.text);
        return {
          document_id: newDoc.id, // Relasi ke tabel master
          source: chunk.source,
          text: chunk.text,
          url: chunk.url,
          embedding: embeddingVector, 
        };
      })
    );

    // D. Insert semua chunks + vektor ke tabel 'document_chunks'
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

// 3. Hapus dokumen (Otomatis menghapus chunks berkat "ON DELETE CASCADE" di SQL)
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

// 4. Update dokumen (Update master -> Hapus chunks lama -> Buat chunks baru)
export async function updateDocument(
  id: string,
  patch: { title?: string; content?: string; url?: string; type?: "text" | "pdf" | "link" }
): Promise<AdminDocument | null> {
  try {
    // Ambil data lama dulu untuk referensi jika ada field yang tidak di-patch
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

    // A. Update tabel master
    const { data: updatedData, error: updateError } = await supabase
      .from("documents")
      .update({ title: updatedTitle, content: updatedContent, type: updatedType, url: updatedUrl })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // B. Hapus chunks lama (karena konten/judul berubah, vektornya sudah tidak valid)
    const { error: deleteChunkError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", id);

    if (deleteChunkError) throw deleteChunkError;

    // C. Buat ulang chunking dari teks yang baru (logika sama dengan saveDocument)
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
        .map((p) => p.trim())
        .filter((p) => p.length > 30);

      if (paragraphs.length === 0) {
        chunks.push({ source: updatedTitle, text: updatedContent });
      } else {
        paragraphs.forEach((p) => {
          chunks.push({ source: updatedTitle, text: p });
        });
      }
    }

    // D. Embed & Insert chunks baru
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