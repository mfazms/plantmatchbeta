"use client";

import { useState } from "react";
import ChatBot from "./ChatBot";

type ChatButtonProps = {
  context?: string;
  plantName?: string;
};

export default function ChatButton({ context, plantName }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-30 group"
        aria-label="Open chat"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:scale-110 transition-transform"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
        </svg>

        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-20" />
      </button>

      {/* ChatBot */}
      <ChatBot
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
        plantName={plantName}
      />
    </>
  );
}
