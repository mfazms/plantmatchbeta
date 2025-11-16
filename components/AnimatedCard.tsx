// components/AnimatedCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AnimatedCardProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
};

export default function AnimatedCard({ 
  children, 
  href, 
  onClick,
  className = "",
  delay = 0
}: AnimatedCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (href) {
      setIsNavigating(true);
      setTimeout(() => {
        router.push(href);
      }, 300);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        ${className}
        relative
        transition-all duration-300
        ${href || onClick ? 'cursor-pointer' : ''}
        ${isNavigating ? 'scale-95 opacity-50' : 'hover:scale-[1.02] active:scale-[0.98]'}
        ${href || onClick ? 'hover:shadow-lg' : ''}
        animate-fadeIn
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Loading overlay */}
      {isNavigating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
          <svg
            className="animate-spin h-8 w-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {children}
    </div>
  );
}

// Animated button component
export function AnimatedButton({
  children,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  variant = "primary"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
}) {
  const variantClasses = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${className}
        ${variantClasses[variant]}
        px-4 py-2 rounded-lg font-semibold
        transition-all duration-200
        ${disabled || loading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:scale-105 active:scale-95 hover:shadow-lg'
        }
        disabled:cursor-not-allowed
        relative overflow-hidden
      `}
    >
      {/* Shimmer effect saat loading */}
      {loading && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      )}

      <span className="inline-flex items-center gap-2 relative z-10">
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </span>
    </button>
  );
}