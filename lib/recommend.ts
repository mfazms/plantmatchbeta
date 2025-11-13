// ================================================
// 📘 lib/recommend.ts
// Modul utama sistem rekomendasi tanaman
// ================================================

import type { Plant, UserFilter, RecommendationWeights } from "./types";
import { DEFAULT_WEIGHTS } from "./types";

// Tipe data hasil rekomendasi
export type ScoredPlant = Plant & { score: number; normalizedScore: number };

// Fungsi bantu: membersihkan input teks user
const cleanInput = (input: string | null | undefined): string | undefined => {
  const trimmed = input?.trim();
  if (!trimmed || trimmed === "") return undefined;
  return trimmed.toLowerCase();
};

// 🌿 Fungsi utama rekomendasi
export function recommend(
  all: Plant[],
  f: UserFilter,
  weights: RecommendationWeights = DEFAULT_WEIGHTS
): ScoredPlant[] {
  // 1️⃣ Hitung skor maksimum total
  const MAX_SCORE = Object.values(weights).reduce((sum, val) => sum + val, 0);

  // 2️⃣ Bersihkan input user
  const cleaned = {
    light: cleanInput(f.light),
    climate: cleanInput(f.climate),
    aesthetic: cleanInput(f.aesthetic),
    category: cleanInput(f.category),
    watering: cleanInput(f.watering),
  };

  // 3️⃣ Hitung skor untuk setiap tanaman
  const results: ScoredPlant[] = all.map((p) => {
    let s = 0;

    // --- Kategori ---
    if (cleaned.category) {
      const cat = (p.category ?? "").toLowerCase();
      if (cat.includes(cleaned.category)) s += weights.category;
    }

    // --- Iklim ---
    if (cleaned.climate) {
      const climate = (p.climate ?? "").toLowerCase();
      if (climate.includes(cleaned.climate)) s += weights.climate;
    }

    // --- Cahaya ---
    if (cleaned.light) {
      const ideal = (p.ideallight ?? "").toLowerCase();
      const tolerated = (p.toleratedlight ?? "").toLowerCase();
      if (ideal.includes(cleaned.light)) s += weights.lightIdeal;
      else if (tolerated.includes(cleaned.light)) s += weights.lightTolerated;
    }

    // --- Estetika / Kegunaan ---
    if (cleaned.aesthetic) {
      const uses = Array.isArray(p.use)
        ? p.use.map((u) => String(u).toLowerCase())
        : [];
      if (uses.some((u) => u.includes(cleaned.aesthetic!))) s += weights.aesthetic;
    }

    // --- Penyiraman ---
    if (cleaned.watering) {
      const w = String(p.watering ?? "").toLowerCase();
      if (w.includes(cleaned.watering)) s += weights.watering;
    }

    // --- Normalisasi skor (0–1) ---
    const normalizedScore = MAX_SCORE > 0 ? s / MAX_SCORE : 0;

    // Gabungkan skor ke data tanaman
    return { ...p, score: s, normalizedScore };
  });

  // 4️⃣ Urutkan dari skor tertinggi
  return results.sort(
    (a, b) => b.score - a.score || a.latin.localeCompare(b.latin)
  );
}
