// ================================================
// components/LoadingAnimations.tsx
// Beautiful loading animations untuk UI yang aesthetic
// ================================================

"use client";

import { useState, useEffect } from "react";

// 🌸 Loading Spinner - Elegant rotating flower
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg viewBox="0 0 24 24" fill="none" className="text-current">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="40"
          className="opacity-25"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="40"
        />
      </svg>
    </div>
  );
}

// 🌺 Button Loading State - Shimmer effect
export function ButtonLoading({ children, loading, onClick, className = "", disabled = false }: {
  children: React.ReactNode;
  loading: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden
        ${className}
        ${loading ? "cursor-wait" : ""}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
      `}
    >
      {/* Shimmer effect saat loading */}
      {loading && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      )}
      
      <span className={`flex items-center justify-center gap-2 ${loading ? "opacity-70" : ""}`}>
        {loading && <LoadingSpinner size="sm" />}
        {children}
      </span>
    </button>
  );
}

// 🌼 Page Transition Overlay - Smooth fade
export function PageTransition({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-fadeIn">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 animate-spin-slow">
              <div className="h-20 w-20 rounded-full border-4 border-transparent border-t-emerald-500 border-r-emerald-400"></div>
            </div>
            
            {/* Inner pulsing circle */}
            <div className="flex h-20 w-20 items-center justify-center">
              <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-lg font-semibold text-emerald-700 animate-pulse">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}

// 🌻 Card Skeleton - Untuk loading grid tanaman
export function PlantCardSkeleton() {
  return (
    <div className="group relative rounded-2xl bg-slate-50 ring-1 ring-emerald-100 shadow-sm overflow-hidden">
      <div className="p-4 animate-pulse">
        {/* Image skeleton */}
        <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-200">
          <div className="pt-[75%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
        </div>

        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded-lg mb-2 w-3/4" />
        
        {/* Subtitle skeleton */}
        <div className="h-4 bg-gray-200 rounded-lg mb-3 w-1/2" />
        
        {/* Score skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded-full w-full" />
        </div>
      </div>
    </div>
  );
}

// 🌸 Generate Results Loading - Full section with message
export function GenerateLoading() {
  const messages = [
    "Menganalisis preferensi Anda... 🌱",
    "Mencocokkan dengan database tanaman... 🌿",
    "Menghitung skor kesesuaian... 📊",
    "Menyusun rekomendasi terbaik... ✨",
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animated plant icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping">
          <div className="h-24 w-24 rounded-full bg-emerald-200 opacity-20"></div>
        </div>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50">
          <span className="text-5xl animate-bounce">🌿</span>
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center max-w-md">
        <h3 className="text-xl font-bold text-emerald-800 mb-2">
          Sedang Memproses...
        </h3>
        <p className="text-emerald-600 animate-pulse transition-all duration-300">
          {messages[currentMessage]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// 🌺 PDF Export Loading - With progress
export function PDFExportLoading({ progress = 0 }: { progress?: number }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Membuat PDF
          </h3>
          <p className="text-gray-600 mb-6">
            Mohon tunggu sebentar...
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{progress}%</p>
        </div>
      </div>
    </div>
  );
}

// Add custom animations to tailwind config
// Add to tailwind.config.ts:
/*
theme: {
  extend: {
    keyframes: {
      shimmer: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      'spin-slow': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    },
    animation: {
      shimmer: 'shimmer 1.5s infinite',
      fadeIn: 'fadeIn 0.3s ease-in-out',
      'spin-slow': 'spin-slow 2s linear infinite',
    },
  },
}
*/