import { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import { askQuestion } from "./services/ragService";
import type { Message } from "./types/Message";
import "./App.css";

const GREETING =
  "Halo! Saya asisten layanan akademik **SSC** (Student Service Center). " +
  "Silakan tanya seputar UKT, KRS, cuti akademik, tugas akhir, kelulusan, " +
  "atau layanan administrasi lainnya. Saya akan menjawab berdasarkan dokumen resmi SSC.";

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: GREETING },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string) => {
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { answer, sources } = await askQuestion(text);
      const botMessage: Message = {
        role: "model",
        content: answer,
        sources, // ← dokumen yang dipakai untuk menjawab
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        role: "model",
        content: "Maaf, terjadi kendala saat memproses pertanyaan. Silakan coba lagi.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{ role: "model", content: GREETING }]);
  };

  return (
    <div className="app-fullscreen">
      <main className="main-area-fullscreen">

        {/* Header */}
        <div className="chat-header-minimal">
          <div className="header-brand">
            <span className="brand-text">TANYA</span>
            <span className="brand-divider">//</span>
            <span className="brand-sub">SSC</span>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">Online</span>
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn" onClick={handleClear} title="Reset Percakapan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.33 16.5H13.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button className="icon-btn" title="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 10C3.9 10 3 10.9 3 12C3 13.1 3.9 14 5 14C6.1 14 7 13.1 7 12C7 10.9 6.1 10 5 10Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M19 10C17.9 10 17 10.9 17 12C17 13.1 17.9 14 19 14C20.1 14 21 13.1 21 12C21 10.9 20.1 10 19 10Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="chat-container-centered">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>

        <div className="chat-input-wrapper">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>

      </main>
    </div>
  );
}

export default App;