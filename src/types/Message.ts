export interface Source {
  id: string;
  source: string;
  text: string;
  url?: string; // untuk tipe link — diteruskan ke chatbot UI
}

export interface Message {
  role: "user" | "model";
  content: string;
  sources?: Source[];
}

// Tipe dokumen di knowledge base admin (localStorage)
export interface AdminDocument {
  id: string;
  title: string;
  content: string;       // teks dokumen / deskripsi link
  url?: string;          // hanya untuk tipe "link"
  type: "text" | "pdf" | "link";
  uploadedAt: string;
}