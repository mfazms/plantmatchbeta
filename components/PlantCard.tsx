"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plant } from "@/lib/types";

/** Ambil nama umum (prioritaskan common[1] bila ada) */
const preferredCommon = (p: Plant) => {
  const commons: string[] = Array.isArray(p.common) ? p.common : [];
  return commons[1] ?? commons[0] ?? p.latin;
};

// ⭐ Extended type with new features
type PlantWithScore = Plant & {
  normalizedScore?: number;
  hasActiveFilter?: boolean;
  mbtiMatch?: boolean;
  matchedFactors?: string[];
};

export default function PlantCard({
  plant,
  selected = false,
  onToggleSelect,
  rank,
  showScore = false,
}: {
  plant: PlantWithScore;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  rank?: number;
  showScore?: boolean;
}) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const title = preferredCommon(plant);
  const subtitle = plant.latin;

  const hasScore =
    plant.hasActiveFilter &&
    typeof plant.normalizedScore === "number" &&
    plant.normalizedScore > 0;

  const formattedScore = hasScore
    ? `${(plant.normalizedScore! * 100).toFixed(0)}%`
    : null;

  const scorePercentage = plant.normalizedScore 
    ? Math.round(plant.normalizedScore * 100) 
    : 0;

  const getProgressBarColor = (pct: number) => {
    if (pct >= 80) return "bg-gradient-to-r from-emerald-500 to-emerald-600";
    if (pct >= 60) return "bg-gradient-to-r from-green-500 to-green-600";
    if (pct >= 40) return "bg-gradient-to-r from-lime-500 to-lime-600";
    if (pct >= 20) return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    return "bg-gradient-to-r from-orange-500 to-orange-600";
  };

  // ⭐ Handle navigation dengan loading animation
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    setIsNavigating(true);
    
    // Small delay untuk show animation
    setTimeout(() => {
      router.push(`/tanaman/${plant.id}`);
    }, 300);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        group relative rounded-2xl bg-slate-50 ring-1 ring-emerald-100
        shadow-sm hover:shadow-[0_6px_20px_rgba(16,185,129,0.12)]
        transition-all duration-300 cursor-pointer
        ${isNavigating ? "scale-95 opacity-50" : ""}
        hover:scale-[1.02] active:scale-[0.98]
      `}
    >
      {/* ⭐ Loading overlay saat navigating */}
      {isNavigating && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl animate-fadeIn">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin h-8 w-8 text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-xs text-emerald-700 font-medium">Memuat...</span>
          </div>
        </div>
      )}

      {/* Badge Ranking di pojok kanan atas */}
      {typeof rank === "number" && (
        <div
          className="
            absolute top-3 right-3 z-20
            bg-emerald-600 text-white text-xs font-bold
            px-2 py-1 rounded-md shadow-md
            animate-pulse-scale
          "
        >
          {rank + 1}
        </div>
      )}

      {/* ⭐ MBTI Badge */}
      {plant.mbtiMatch && (
        <div
          className={`
            absolute right-3 z-20
            px-2.5 py-1 rounded-full
            bg-gradient-to-r from-purple-500 to-indigo-500
            text-white text-xs font-semibold shadow-md
            flex items-center gap-1
            ${typeof rank === "number" ? "top-14" : "top-3"}
            animate-fadeIn
          `}
        >
          <span>🧠</span>
          <span>MBTI</span>
        </div>
      )}

      {/* Checkbox pilih */}
      {onToggleSelect && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect?.(plant.id);
          }}
          className="
            absolute top-3 left-3 z-10
            flex items-center justify-center w-5 h-5 rounded-md
            bg-white/90 hover:bg-emerald-50 border border-emerald-300
            text-emerald-700 focus:outline-none
            transition-all duration-200
            hover:scale-110 active:scale-95
          "
          title={selected ? "Hapus dari pilihan" : "Pilih tanaman ini"}
        >
          {selected ? (
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.5 13.5L3.5 9.5L4.91 8.09L7.5 10.67L15.09 3.09L16.5 4.5L7.5 13.5Z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect
                x="3.5"
                y="3.5"
                width="13"
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </button>
      )}

      <div className="block p-4">
        {/* ⭐ FIXED: Area gambar dengan aspect ratio flexible */}
        <div className="relative mb-4 rounded-xl overflow-hidden bg-white ring-1 ring-gray-100 flex items-center justify-center min-h-[200px]">
          <img
            src={`/api/plant-image?id=${plant.id}`}
            alt={title}
            className="w-full h-auto max-h-[280px] object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Nama tanaman */}
        <div className="font-semibold text-lg text-emerald-800 leading-tight text-left">
          {title}
        </div>

        {/* Nama latin */}
        <div className="text-sm text-gray-500 italic mt-0.5 text-left">
          {subtitle}
        </div>

        {/* ⭐ ENHANCED: Kesesuaian dengan progress bar */}
        {showScore && formattedScore && (
          <div className="mt-3">
            {/* Score text */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-700">
                Kesesuaian
              </span>
              <span className="text-sm font-bold text-emerald-700">
                {formattedScore}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${getProgressBarColor(scorePercentage)}`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* ⭐ Matched Factors Tags */}
        {plant.matchedFactors && plant.matchedFactors.length > 0 && showScore && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {plant.matchedFactors.map((factor, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium
                         animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {factor}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}