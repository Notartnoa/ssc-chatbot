export interface Source {
  id: string;
  source: string;
  text: string;
  url?: string; 
}

export interface Message {
  role: "user" | "model";
  content: string;
  sources?: Source[];
}

export interface AdminDocument {
  id: string;
  title: string;
  content: string;       
  url?: string;          
  type: "text" | "pdf" | "link";
  uploadedAt: string;
}