import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { getDocuments, saveDocument, deleteDocument, updateDocument } from "../services/documentService";
import type { AdminDocument } from "../types/Message";
import "./admin.css";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str ?? "").join(" ").replace(/\s+/g, " ").trim();
    if (text) pages.push(text);
  }
  return pages.join("\n\n");
}

type UploadMode = "doc" | "link";

const IcDocumentUpload = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 11V17L11 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 17L7 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcLink2 = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M13.23 10.77L10.77 13.23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.7 13.71L17.76 11.65C19.71 9.7 19.71 6.53 17.76 4.58C15.81 2.63 12.64 2.63 10.69 4.58L8.63 6.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.3 10.29L6.24 12.35C4.29 14.3 4.29 17.47 6.24 19.42C8.19 21.37 11.36 21.37 13.31 19.42L15.37 17.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcUploadCloud = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M12 16V9M12 9L9.5 11.5M12 9L14.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 22H16C21 22 23 20 23 15V14C23 9 21 7 16 7H8C3 7 1 9 1 14V15C1 20 3 22 8 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 7C17 4.24 14.76 2 12 2C9.24 2 7 4.24 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcTickCircle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcInfoCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11.99 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IcDocument = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2V8.5C14.5 9.33 15.17 10 16 10H21" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 13H12M8 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcLinkSmall = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M13.23 10.77L10.77 13.23M15.7 13.71L17.76 11.65C19.71 9.7 19.71 6.53 17.76 4.58C15.81 2.63 12.64 2.63 10.69 4.58L8.63 6.64M8.3 10.29L6.24 12.35C4.29 14.3 4.29 17.47 6.24 19.42C8.19 21.37 11.36 21.37 13.31 19.42L15.37 17.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M21 5.98C17.67 5.65 14.32 5.48 10.98 5.48C9 5.48 7.02 5.58 5.04 5.78L3 5.98M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97M18.85 9.14L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.04 3.02L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96C22.34 6.6 22.98 5.02 20.98 3.02C18.98 1.02 17.4 1.66 16.04 3.02Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.91 4.15C15.58 6.54 17.45 8.41 19.85 9.09" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcAdd = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M8 12H16M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcFolderOpen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M22 11V17C22 21 21 22 17 22H7C3 22 2 21 2 17V7C2 3 3 2 7 2H8.5C10 2 10.33 2.44 10.9 3.2L12.4 5.2C12.78 5.7 13 6 14 6H17C21 6 22 7 22 11Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
    <path d="M8 2H17C21 2 22 4 22 7V8.38" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
  </svg>
);
const IcGlobal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.99998 3H9C7.05 8.84 7.05 15.16 9 21H7.99998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 3C16.95 8.84 16.95 15.16 15 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 16V15C8.84 16.95 15.16 16.95 21 15V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 9C8.84 7.05 15.16 7.05 21 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcSave = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M6 2H14.75C15.61 2 16.44 2.34 17.06 2.94L20.31 6.19C20.9 6.78 21.25 7.58 21.25 8.41V19C21.25 20.66 19.91 22 18.25 22H6C4.34 22 3 20.66 3 19V5C3 3.34 4.34 2 6 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.25 2V6.25C15.25 6.8 14.8 7.25 14.25 7.25H8.75C8.2 7.25 7.75 6.8 7.75 6.25V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.75 13H12.25M7.75 17H16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>("doc");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [docFileType, setDocFileType] = useState<"text" | "pdf">("text");
  const [isParsing, setIsParsing] = useState(false);

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDesc, setLinkDesc] = useState("");

  const [editDoc, setEditDoc] = useState<AdminDocument | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "documents">("upload");

  useEffect(() => {
    if (sessionStorage.getItem("ssc_admin_auth") !== "true") navigate("/admin");
    
    const fetchDocs = async () => {
      const docs = await getDocuments();
      setDocuments(docs);
    };
    fetchDocs();

    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
    const root = document.getElementById("root");
    if (root) { root.style.height = "auto"; root.style.overflowY = "auto"; }
    return () => {
      document.documentElement.style.overflowY = "";
      document.body.style.overflowY = "";
      if (root) { root.style.height = ""; root.style.overflowY = ""; }
    };
  }, [navigate]);

  useEffect(() => {
    if (editDoc) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [editDoc]);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3500); };
  const showError   = (msg: string) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(""),   5000); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isTxt = file.name.toLowerCase().endsWith(".txt");
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    if (!isTxt && !isPdf) {
      showError("Hanya file .txt atau .pdf yang didukung.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFileName(file.name);
    if (!title) {
      const cleanName = file.name
        .replace(/\.(txt|pdf)$/i, "")
        .replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, "")
        .replace(/^\d{10,}_/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      setTitle(cleanName || file.name.replace(/\.(txt|pdf)$/i, ""));
    }
    if (isTxt) {
      setDocFileType("text");
      const reader = new FileReader();
      reader.onload = (ev) => setContent((ev.target?.result as string) || "");
      reader.readAsText(file);
    } else {
      setDocFileType("pdf");
      setIsParsing(true);
      setContent("");
      try {
        const text = await extractTextFromPdf(file);
        if (!text || text.length < 10) {
          showError("Teks tidak ditemukan — PDF ini mungkin berupa scan/gambar.");
          setFileName(""); setDocFileType("text");
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          setContent(text);
          showSuccess(`PDF berhasil dibaca! ${text.split(/\s+/).length.toLocaleString()} kata ditemukan.`);
        }
      } catch (err: any) {
        showError(`Gagal membaca PDF: ${err?.message ?? "Error tidak dikenal"}.`);
        setFileName(""); setDocFileType("text");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleUploadDoc = async () => {
    if (!title.trim())               { showError("Judul dokumen tidak boleh kosong."); return; }
    if (!content.trim())             { showError("Konten dokumen tidak boleh kosong."); return; }
    if (content.trim().length < 50)  { showError("Konten terlalu pendek (minimal 50 karakter)."); return; }
    
    setIsUploading(true);
    
    const result = await saveDocument(title, content, docFileType);
    
    if (!result) {
      showError("Gagal menyimpan ke database! Cek console/inspect element.");
      setIsUploading(false);
      return;
    }

    const updatedDocs = await getDocuments();
    setDocuments(updatedDocs);
    
    setTitle(""); setContent(""); setFileName(""); setDocFileType("text");
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    setIsUploading(false);
    setActiveTab("documents");
    showSuccess("Dokumen berhasil disimpan ke knowledge base!");
  };

  const handleSaveLink = async () => {
    if (!linkTitle.trim()) { showError("Nama link tidak boleh kosong."); return; }
    if (!linkUrl.trim())   { showError("URL tidak boleh kosong."); return; }
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try { new URL(url); } catch { showError("Format URL tidak valid."); return; }
    
    setIsUploading(true);
    
    const result = await saveDocument(linkTitle, linkDesc.trim() || `Link menuju ${linkTitle}`, "link", url);
    
    if (!result) {
      showError("Gagal menyimpan link ke database!");
      setIsUploading(false);
      return;
    }

    const updatedDocs = await getDocuments();
    setDocuments(updatedDocs);
    
    setLinkTitle(""); setLinkUrl(""); setLinkDesc("");
    
    setIsUploading(false);
    setActiveTab("documents");
    showSuccess("Link berhasil disimpan ke knowledge base!");
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    const updatedDocs = await getDocuments();
    setDocuments(updatedDocs);
    setDeleteConfirm(null);
    showSuccess("Berhasil dihapus.");
  };

  const handleOpenEdit = (doc: AdminDocument) => {
    setEditDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditUrl(doc.url ?? "");
  };

  const handleCloseEdit = () => {
    setEditDoc(null);
    setEditTitle("");
    setEditContent("");
    setEditUrl("");
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;
    if (!editTitle.trim()) { showError("Judul tidak boleh kosong."); return; }
    if (editDoc.type !== "link" && !editContent.trim()) { showError("Konten tidak boleh kosong."); return; }
    if (editDoc.type !== "link" && editContent.trim().length < 20) { showError("Konten terlalu pendek."); return; }
    if (editDoc.type === "link" && editUrl.trim()) {
      let url = editUrl.trim();
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      try { new URL(url); } catch { showError("Format URL tidak valid."); return; }
    }

    setIsSavingEdit(true);
    
    await updateDocument(editDoc.id, {
      title:   editTitle,
      content: editDoc.type === "link"
        ? (editContent || `Link menuju ${editTitle}`)
        : editContent,
      url: editDoc.type === "link" ? editUrl : undefined,
    });
    
    const updatedDocs = await getDocuments();
    setDocuments(updatedDocs);
    
    setIsSavingEdit(false);
    handleCloseEdit();
    showSuccess("Dokumen berhasil diperbarui!");
  };

  const handleLogout = () => { sessionStorage.removeItem("ssc_admin_auth"); navigate("/admin"); };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const wordCount     = content.trim() ? content.trim().split(/\s+/).length : 0;
  const editWordCount = editContent.trim() ? editContent.trim().split(/\s+/).length : 0;
  const docCount      = documents.filter((d) => d.type !== "link").length;
  const linkCount     = documents.filter((d) => d.type === "link").length;

  const typeBadge = (type: AdminDocument["type"]) => {
    if (type === "pdf")  return <span className="type-badge type-pdf">PDF</span>;
    if (type === "link") return <span className="type-badge type-link">LINK</span>;
    return <span className="type-badge type-txt">TXT</span>;
  };

  return (
    <div className="admin-page dashboard">

      <div className="chat-header-minimal">
        <div className="header-brand">
          <span className="brand-text">TANYA</span>
          <span className="brand-divider">//</span>
          <span className="brand-sub">SSC</span>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span className="status-text">Admin Online</span>
          </div>
        </div>
        <div className="header-actions">
          <a href="/" className="icon-btn" title="Lihat Chatbot">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.02 2.84L3.63 7.04C2.73 7.74 2 9.23 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.3 21.19 7.74 20.2 7.05L14.02 2.72C12.62 1.74 10.37 1.79 9.02 2.84Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17.99V14.99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <button className="icon-btn" onClick={handleLogout} title="Logout">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12H3.62M5.85 8.65L2.5 12L5.85 15.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="toast toast-success"><IcTickCircle />{successMsg}</div>
      )}
      {errorMsg && (
        <div className="toast toast-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8V13M11.99 16H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {errorMsg}
        </div>
      )}

      <main className="admin-main">

        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-number">{docCount}</span>
            <span className="stat-label">Dokumen Aktif</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{linkCount}</span>
            <span className="stat-label">Link Aktif</span>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>
            <IcAdd /> Tambah Konten
          </button>
          <button className={`admin-tab ${activeTab === "documents" ? "active" : ""}`} onClick={() => setActiveTab("documents")}>
            <IcFolderOpen /> Knowledge Base
            {documents.length > 0 && <span className="tab-badge">{documents.length}</span>}
          </button>
        </div>

        {activeTab === "upload" && (
          <div className="admin-card">
            <div className="card-header">
              <h2>Tambah ke Knowledge Base</h2>
              <p>Pilih jenis konten yang ingin kamu tambahkan ke chatbot.</p>
            </div>

            <div className="mode-cards">
              <button className={`mode-card ${uploadMode === "doc" ? "active" : ""}`} onClick={() => setUploadMode("doc")}>
                <div className="mode-card-left">
                  <div className="mode-card-icon"><IcDocumentUpload size={22} /></div>
                  <div>
                    <p className="mode-card-title">Upload Dokumen</p>
                    <p className="mode-card-sub">PDF atau TXT — panduan, prosedur, kebijakan</p>
                  </div>
                </div>
                <div className={`mode-radio ${uploadMode === "doc" ? "checked" : ""}`}>
                  {uploadMode === "doc" && <div className="mode-radio-dot" />}
                </div>
              </button>
              <button className={`mode-card ${uploadMode === "link" ? "active" : ""}`} onClick={() => setUploadMode("link")}>
                <div className="mode-card-left">
                  <div className="mode-card-icon"><IcLink2 size={22} /></div>
                  <div>
                    <p className="mode-card-title">Tambah Link</p>
                    <p className="mode-card-sub">URL website atau portal — chatbot bisa kasih ke mahasiswa</p>
                  </div>
                </div>
                <div className={`mode-radio ${uploadMode === "link" ? "checked" : ""}`}>
                  {uploadMode === "link" && <div className="mode-radio-dot" />}
                </div>
              </button>
            </div>

            <div className="mode-separator" />

            {uploadMode === "doc" && (
              <div className="mode-form">
                <div
                  className={`file-drop-zone ${isParsing ? "parsing" : fileName ? "has-file" : ""}`}
                  onClick={() => !isParsing && fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileChange} style={{ display: "none" }} disabled={isParsing} />
                  {isParsing ? (
                    <><div className="parsing-spinner" /><p className="drop-status">Membaca isi PDF...</p><p className="drop-hint">Harap tunggu sebentar</p></>
                  ) : fileName ? (
                    <>
                      <div className="drop-file-icon">
                        <IcDocument size={28} />
                      </div>
                      <p className="drop-status" style={{ color: "#22C55E" }}>{fileName}</p>
                      <p className="drop-hint">Klik untuk ganti file</p>
                    </>
                  ) : (
                    <>
                      <div className="drop-upload-icon"><IcUploadCloud /></div>
                      <p className="drop-status">Klik atau seret file ke sini</p>
                      <div className="drop-formats">
                        <span className="format-chip">PDF</span>
                        <span className="format-chip">TXT</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label>Judul Dokumen <span className="required">*</span></label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth: Panduan Pengajuan Surat Keterangan Aktif 2024" disabled={isUploading} />
                </div>

                <div className="form-group">
                  <label>
                    Konten Dokumen <span className="required">*</span>
                    {wordCount > 0 && <span className="word-count">{wordCount.toLocaleString()} kata</span>}
                  </label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Konten otomatis terisi setelah upload file, atau bisa diketik/tempel manual di sini..." rows={9} disabled={isUploading || isParsing} />
                </div>

                <button className="submit-btn" onClick={handleUploadDoc} disabled={isUploading || isParsing || !title.trim() || !content.trim()}>
                  {isUploading ? <span className="btn-dots"><span className="login-dot" /><span className="login-dot" /><span className="login-dot" /></span>
                    : <><IcDocumentUpload size={17} />Simpan ke Knowledge Base</>}
                </button>
              </div>
            )}

            {uploadMode === "link" && (
              <div className="mode-form">
                <div className="link-info-box">
                  <IcInfoCircle />
                  <span>Chatbot akan menyebut dan memberikan link ini ketika mahasiswa menanyakan hal yang relevan. Deskripsi yang detail = RAG lebih akurat.</span>
                </div>

                <div className="form-group">
                  <label>URL / Link <span className="required">*</span></label>
                  <div className="input-icon-wrap">
                    <span className="input-prefix-icon"><IcGlobal /></span>
                    <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://toss.telkomuniversity.ac.id" disabled={isUploading} className="has-prefix-icon" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nama / Judul Link <span className="required">*</span></label>
                  <input type="text" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="cth: TOSS Telkom University, Unit Akademik..." disabled={isUploading} />
                </div>

                <div className="form-group">
                  <label>Deskripsi <span className="word-count">opsional — sangat disarankan</span></label>
                  <textarea value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} placeholder="Jelaskan fungsi atau isi dari link ini..." rows={4} disabled={isUploading} />
                </div>

                <button className="submit-btn submit-btn-link" onClick={handleSaveLink} disabled={isUploading || !linkTitle.trim() || !linkUrl.trim()}>
                  {isUploading ? <span className="btn-dots"><span className="login-dot" /><span className="login-dot" /><span className="login-dot" /></span>
                    : <><IcLink2 size={17} />Simpan Link ke Knowledge Base</>}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="admin-card">
            <div className="card-header">
              <h2>Knowledge Base</h2>
              <p>Semua dokumen dan link yang aktif di chatbot SSC.</p>
            </div>

            {documents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><IcFolderOpen /></div>
                <p className="empty-title">Knowledge base masih kosong</p>
                <p className="empty-sub">Upload dokumen atau tambahkan link untuk memulai</p>
                <button className="empty-btn" onClick={() => setActiveTab("upload")}>+ Tambah Konten Pertama</button>
              </div>
            ) : (
              <div className="doc-list">
                {documents.map((doc) => (
                  <div key={doc.id} className={`doc-item ${doc.type === "link" ? "doc-item-link" : ""}`}>

                    <div className="doc-item-top">
                      <div className="doc-icon">
                        {doc.type === "link" ? <IcLinkSmall /> : <IcDocument />}
                      </div>

                      <div className="doc-title-area">
                        <div className="doc-title-row">
                          <h3 className="doc-title">{doc.title}</h3>
                          {typeBadge(doc.type ?? "text")}
                        </div>
                        <p className="doc-meta">
                          {doc.type !== "link" && `${doc.content.trim().split(/\s+/).length.toLocaleString()} kata · `}
                          {formatDate(doc.uploadedAt)}
                        </p>
                      </div>

                      <div className="doc-actions">
                        {deleteConfirm === doc.id ? (
                          <div className="delete-confirm">
                            <span>Hapus?</span>
                            <button className="confirm-yes" onClick={() => handleDelete(doc.id)}>Ya</button>
                            <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>Batal</button>
                          </div>
                        ) : (
                          <div className="doc-action-btns">
                            <button className="edit-btn" onClick={() => handleOpenEdit(doc)}>
                              <IcEdit /> Edit
                            </button>
                            <button className="delete-btn" onClick={() => setDeleteConfirm(doc.id)}>
                              <IcTrash /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {doc.type === "link" && doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-url">
                        {doc.url}
                      </a>
                    )}

                    {doc.content && doc.content !== `Link menuju ${doc.title}` && (
                      <p className="doc-preview">{doc.content}</p>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {editDoc && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCloseEdit()}>
          <div className="modal-card">

            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon">
                  {editDoc.type === "link" ? <IcLinkSmall size={18} /> : <IcDocument size={18} />}
                </div>
                <div>
                  <h3 className="modal-title">Edit {editDoc.type === "link" ? "Link" : "Dokumen"}</h3>
                  <p className="modal-sub">{typeBadge(editDoc.type ?? "text")}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={handleCloseEdit}><IcClose /></button>
            </div>

            <div className="modal-body">

              {editDoc.type === "link" && (
                <div className="form-group">
                  <label>URL / Link</label>
                  <div className="input-icon-wrap">
                    <span className="input-prefix-icon"><IcGlobal /></span>
                    <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className="has-prefix-icon" disabled={isSavingEdit} />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Judul <span className="required">*</span></label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Judul dokumen atau link" disabled={isSavingEdit} />
              </div>

              <div className="form-group">
                <label>
                  {editDoc.type === "link" ? "Deskripsi" : "Konten Dokumen"}
                  {editDoc.type !== "link" && <span className="required"> *</span>}
                  {editWordCount > 0 && <span className="word-count">{editWordCount.toLocaleString()} kata</span>}
                </label>
                {editDoc.type !== "link" && (
                  <p className="edit-content-tip">
                    💡 Kamu bisa perbaiki atau tambahkan teks yang tidak terbaca dari hasil ekstraksi PDF di sini.
                  </p>
                )}
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder={editDoc.type === "link" ? "Deskripsi fungsi atau isi link ini..." : "Isi atau perbaiki konten dokumen di sini..."}
                  rows={editDoc.type === "link" ? 4 : 14}
                  disabled={isSavingEdit}
                  className="edit-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={handleCloseEdit} disabled={isSavingEdit}>
                Batal
              </button>
              <button className="modal-save-btn" onClick={handleSaveEdit} disabled={isSavingEdit || !editTitle.trim()}>
                {isSavingEdit
                  ? <span className="btn-dots"><span className="login-dot" /><span className="login-dot" /><span className="login-dot" /></span>
                  : <><IcSave /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;