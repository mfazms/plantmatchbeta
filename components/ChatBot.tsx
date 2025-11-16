"use client";
import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  plantIds?: number[]; // ID tanaman yang direkomendasikan
};

type ChatBotProps = {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  plantName?: string;
};

// Render markdown sederhana
function renderMarkdown(text: string) {
  let html = text;
  
  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Code: `text`
  html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>');
  
  // Numbered list
  html = html.replace(/^\d+\.\s(.+)$/gm, '<li class="ml-4">$1</li>');
  
  // Bullet points
  html = html.replace(/^[-•]\s(.+)$/gm, '<li class="ml-4">• $1</li>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  
  return html;
}

// Extract plant IDs dan names dari response
function extractPlantInfo(text: string): Array<{id: number, name: string}> {
  // Format berbagai kemungkinan:
  // 1. **Nama Tanaman** (ID: 123)
  // 2. **1. Nama Tanaman** (ID: 123)
  // 3. 1. **Nama Tanaman** (ID: 123)
  
  const patterns = [
    /\*\*(?:\d+\.\s*)?(.+?)\*\*\s*\(ID:\s*(\d+)\)/g,  // **Nama** (ID: 123)
    /(?:\d+\.\s*)?\*\*(.+?)\*\*\s*\(ID:\s*(\d+)\)/g,  // 1. **Nama** (ID: 123)
  ];
  
  const plants: Array<{id: number, name: string}> = [];
  const seenIds = new Set<number>();
  
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern);
    
    while ((match = regex.exec(text)) !== null) {
      const name = match[1].trim().replace(/^\d+\.\s*/, ''); // Hapus nomor di depan
      const id = parseInt(match[2]);
      
      // Hindari duplikat
      if (!seenIds.has(id)) {
        plants.push({ name, id });
        seenIds.add(id);
      }
    }
  }
  
  return plants;
}

export default function ChatBot({ isOpen, onClose, context, plantName }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Load chat history from Firestore
  useEffect(() => {
    if (!userId || !isOpen) return;

    const messagesRef = collection(db, `users/${userId}/chatHistory`);
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          plantIds: data.plantIds || [],
        });
      });

      // Jika belum ada history, tambahkan welcome message
      if (loadedMessages.length === 0) {
        const welcomeMsg: Message = {
          role: "assistant",
          content: plantName
            ? `Halo! Saya PlantMatch Assistant. Ada yang ingin kamu tanyakan tentang **${plantName}**? 🌱`
            : "Halo! Saya PlantMatch Assistant. Ada yang bisa saya bantu tentang tanaman? 🌱\n\nKamu bisa tanya tentang:\n• Rekomendasi tanaman berdasarkan MBTI\n• Tips perawatan tanaman\n• Tanaman untuk pemula\n• Dan masih banyak lagi!",
          timestamp: new Date(),
        };
        loadedMessages.push(welcomeMsg);
      }

      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [userId, isOpen, plantName]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessageToFirestore = async (message: Message) => {
    if (!userId) return;

    try {
      const messagesRef = collection(db, `users/${userId}/chatHistory`);
      await addDoc(messagesRef, {
        role: message.role,
        content: message.content,
        timestamp: serverTimestamp(),
        plantIds: message.plantIds || [],
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessageToFirestore(userMessage);
    
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: context,
          history: messages.slice(-10),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const plantInfo = extractPlantInfo(data.reply);
        const plantIds = plantInfo.map(p => p.id);
        
        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
          plantIds: plantIds,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        await saveMessageToFirestore(assistantMessage);
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.error || "Maaf, terjadi kesalahan. Coba lagi ya! 😅",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        await saveMessageToFirestore(assistantMessage);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Tidak bisa terhubung ke server. Coba lagi ya! 😅",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessageToFirestore(errorMessage);
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
      <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[400px] h-[85vh] sm:h-[600px] max-h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-emerald-100">
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => {
            const plantInfo = msg.role === "assistant" ? extractPlantInfo(msg.content) : [];
            
            return (
              <div key={idx}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div 
                        className="text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    
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

                {/* Plant recommendation cards */}
                {msg.role === "assistant" && plantInfo.length > 0 && (
                  <div className="space-y-3 mt-3 ml-2">
                    {plantInfo.map((plant) => (
                      <Link
                        key={plant.id}
                        href={`/tanaman/${plant.id}`}
                        target="_blank"
                        className="block group"
                      >
                        <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm hover:shadow-md transition-all hover:border-emerald-300">
                          <div className="flex gap-3">
                            {/* Plant Image */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={`/api/plant-image?id=${plant.id}`}
                                alt={plant.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  // Fallback jika gambar tidak ada
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2310b981" font-size="24"%3E🌿%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>

                            {/* Plant Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-emerald-800 text-sm group-hover:text-emerald-600 transition-colors line-clamp-1">
                                {plant.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                ID: {plant.id}
                              </p>
                              
                              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium group-hover:gap-2 transition-all">
                                <span>Lihat Detail</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}