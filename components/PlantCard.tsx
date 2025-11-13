"use client";

import Link from "next/link";
import type { Plant } from "@/lib/types";

/** Ambil nama umum (prioritaskan common[1] bila ada) */
const preferredCommon = (p: Plant) => {
  const commons: string[] = Array.isArray(p.common) ? p.common : [];
  return commons[1] ?? commons[0] ?? p.latin;
};

export default function PlantCard({
  plant,
  selected = false,
  onToggleSelect,
  rank,
  showScore = false, // hanya true untuk Top 10
}: {
  plant: Plant & { normalizedScore?: number };
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  rank?: number;
  showScore?: boolean;
}) {
  const title = preferredCommon(plant);
  const subtitle = plant.latin;

  /** Format nilai kesesuaian ke persen, misal 0.92 → 92% */
  const formattedScore =
    typeof plant.normalizedScore === "number"
      ? `${(plant.normalizedScore * 100).toFixed(0)}%`
      : null;

  return (
    <div
      className="
        group relative rounded-2xl bg-slate-50 ring-1 ring-emerald-100
        shadow-sm hover:shadow-[0_6px_20px_rgba(16,185,129,0.12)]
        transition
      "
    >
      {/* Badge Ranking di pojok kanan atas (untuk Top 10) */}
      {typeof rank === "number" && (
        <div
          className="
            absolute top-3 right-3 z-20
            bg-emerald-600 text-white text-xs font-bold
            px-2 py-1 rounded-md shadow-md
          "
        >
          {rank + 1}
        </div>
      )}

      {/* Checkbox pilih */}
      {onToggleSelect && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSelect?.(plant.id);
          }}
          className="
            absolute top-3 left-3 z-10
            flex items-center justify-center w-5 h-5 rounded-md
            bg-white/90 hover:bg-emerald-50 border border-emerald-300
            text-emerald-700 focus:outline-none
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

      <Link href={`/tanaman/${plant.id}`} className="block p-4">
        {/* Area gambar (aspect 4:3) */}
        <div className="relative mb-4 rounded-xl overflow-hidden bg-white ring-1 ring-gray-100 flex items-center justify-center">
          <div className="relative w-full">
            <div className="pt-[75%]" />
            <img
              src={`/api/plant-image?id=${plant.id}`}
              alt={title}
              className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.05]"
              loading="lazy"
            />
          </div>
        </div>

        {/* Nama tanaman */}
        <div className="font-semibold text-lg text-emerald-800 leading-tight text-left">
          {title}
        </div>

        {/* Nama latin */}
        <div className="text-sm text-gray-500 italic mt-0.5 text-left">
          {subtitle}
        </div>

        {/* Kesesuaian hasil rekomendasi */}
        {showScore && formattedScore && (
          <div className="mt-2 text-base font-bold text-emerald-700 text-left">
            Kesesuaian: {formattedScore}
          </div>
        )}
      </Link>
    </div>
  );
}
