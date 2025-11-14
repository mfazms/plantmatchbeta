"use client";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ChatBotProps = {
  isOpen: boolean;
  onClose: () => void;
  context?: string; // Konteks untuk halaman detail tanaman
  plantName?: string; // Nama tanaman untuk title
};

export default function ChatBot({ isOpen, onClose, context, plantName }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: plantName
        ? `Halo! Saya PlantMatch Assistant. Ada yang ingin kamu tanyakan tentang ${plantName}? 🌱`
        : "Halo! Saya PlantMatch Assistant. Ada yang bisa saya bantu tentang tanaman? 🌱",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage: Message = {
    role: "user",
    content: input,
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        context: context,
        history: messages.slice(-6), // Kirim 6 pesan terakhir untuk konteks
      }),
    });

    const data = await response.json();

    if (data.success) {
      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      // Tampilkan pesan error dari backend (misal: kuota habis)
      const assistantMessage: Message = {
        role: "assistant",
        content:
          data.error ||
          "Maaf, terjadi kesalahan di server. Coba lagi nanti ya! 😅",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  } catch (error) {
    const errorMessage: Message = {
      role: "assistant",
      content:
        "Tidak bisa terhubung ke server. Coba beberapa saat lagi ya! 😅",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Container */}
      <div className="fixed bottom-4 right-4 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-emerald-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              🌿
            </div>
            <div>
              <h3 className="font-bold text-lg">PlantMatch Assistant</h3>
              <p className="text-xs text-emerald-100">
                {plantName ? `Tanya tentang ${plantName}` : "Tanya tentang tanaman"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <span
                  className={`text-xs mt-1 block ${
                    msg.role === "user" ? "text-emerald-100" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pertanyaan..."
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 text-white rounded-xl px-4 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}