import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types/Message";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const MAX_VISIBLE_SOURCES = 3;

function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Panggil URL Supabase dari file .env
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // Nama bucket sudah disesuaikan dengan Supabase milikmu
  const bucketName = "documents"; 

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const formatTime = () => {
    return new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="chat-content">
        {messages.length === 0 && (
          <div className="welcome-card">
            <div className="welcome-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 2H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Ada yang bisa dibantu?</h2>
            <p>TANYA // SSC siap menjawab pertanyaan akademik kamu kapan saja, berdasarkan dokumen resmi Student Service Center.</p>
            <div className="welcome-suggestions">
              <span>Topik Populer:</span>
              <div className="suggestion-chips">
                <button className="chip">Kapan batas pembayaran UKT?</button>
                <button className="chip">Cara mengisi KRS</button>
                <button className="chip">Syarat cuti akademik</button>
              </div>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="date-divider">
            <span>Sesi Hari Ini</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message-group ${msg.role}`}>
            {msg.role === "model" && (
              <div className="message-sender-label">TANYA // SSC</div>
            )}
            <div className="message-row">
              {msg.role === "model" && (
                <div className="message-avatar bot">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="bubble-wrap">
                <div className="message-bubble">
                  {msg.role === "model" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p style={{ margin: "0 0 8px 0", lineHeight: "1.6" }}>{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ color: "#E60012", fontWeight: 700 }}>{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em style={{ color: "#A1A1AA" }}>{children}</em>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ paddingLeft: "18px", margin: "3px 0" }}>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ paddingLeft: "18px", margin: "3px 0" }}>{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li style={{ marginBottom: "2px", lineHeight: "1.55" }}>{children}</li>
                        ),
                        h1: ({ children }) => (
                          <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#F8FAFC", margin: "10px 0 4px" }}>{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC", margin: "8px 0 3px" }}>{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#A1A1AA", margin: "6px 0 3px" }}>{children}</h3>
                        ),
                        code: ({ children }) => (
                          <code style={{
                            background: "rgba(230,0,18,0.1)",
                            color: "#E60012",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontFamily: "monospace"
                          }}>{children}</code>
                        ),
                        hr: () => (
                          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}

                  {msg.role === "model" && msg.sources && msg.sources.length > 0 && (() => {
                    
                    // 1. DEDUPLIKASI: Filter agar nama sumber yang sama tidak di-print berulang kali
                    const uniqueSources = msg.sources.filter((val, index, self) =>
                      index === self.findIndex((t) => t.source === val.source)
                    );

                    const visible = uniqueSources.slice(0, MAX_VISIBLE_SOURCES);
                    const hidden = uniqueSources.length - visible.length;

                    return (
                      <div className="sources-block">
                        <span className="sources-title">Sumber:</span>
                        <div className="sources-chips">
                          {visible.map((src) => {
                            const sourceName = src.source;
                            
                            // 2. LOGIKA PINTAR: Cek apakah ini PDF atau Artikel Web biasa
                            // Asumsinya, file PDF kamu mengandung kata "panduan", "surat", atau berakhiran ".pdf"
                            const isPdfDocument = 
                              sourceName.toLowerCase().includes('panduan') || 
                              sourceName.toLowerCase().includes('surat') || 
                              sourceName.toLowerCase().endsWith('.pdf');

                            if (isPdfDocument) {
                              // Jika ini PDF, rakit link Supabase-nya
                              let fileName = sourceName;
                              if (!fileName.toLowerCase().endsWith('.pdf')) {
                                fileName += '.pdf';
                              }
                              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${encodeURIComponent(fileName)}`;

                              return (
                                <a
                                  key={src.id}
                                  href={publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="source-chip"
                                  title={`Buka Dokumen: ${fileName}`}
                                  style={{ textDecoration: "none" }}
                                >
                                  <span className="source-chip-label">{sourceName}</span>
                                </a>
                              );
                            } else {
                              // Jika ini BUKAN PDF (misal: "TOSS..."), jadikan label biasa yang tidak bisa diklik
                              return (
                                <span
                                  key={src.id}
                                  className="source-chip"
                                  title={`Sumber Artikel/Link: ${sourceName}`}
                                  style={{ cursor: "default", opacity: 0.85, borderStyle: "dashed" }}
                                >
                                  <span className="source-chip-label">{sourceName}</span>
                                </span>
                              );
                            }
                          })}
                          {hidden > 0 && (
                            <span
                              className="source-chip source-chip-more"
                              title={uniqueSources.slice(MAX_VISIBLE_SOURCES).map(s => s.source).join(", ")}
                            >
                              +{hidden}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="message-meta">{formatTime()}</div>
              </div>
              {msg.role === "user" && (
                <div className="message-avatar user">R</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-group model">
            <div className="message-sender-label">TANYA // SSC</div>
            <div className="message-row">
              <div className="message-avatar bot">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ float: "left", clear: "both" }} />
      </div>
    </>
  );
}

export default ChatWindow;