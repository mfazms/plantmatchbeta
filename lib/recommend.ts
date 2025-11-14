// ================================================
// 📘 lib/recommend.ts
// Sistem rekomendasi PlantMatch (tanpa filter Category)
// ================================================

import type { Plant, UserFilter } from "./types";

// Hasil rekomendasi: Plant + skor + info apakah cocok MBTI
export type ScoredPlant = Plant & {
  score: number;            // skor mentah
  normalizedScore: number;  // 0–1, dipakai untuk "Kesesuaian: xx%"
  mbtiMatch?: boolean;      // true kalau mbti tanaman = mbti user
};

// Fungsi bantu: bersihkan input teks user
const cleanInput = (input: string | null | undefined): string | undefined => {
  const trimmed = input?.trim();
  if (!trimmed) return undefined;
  return trimmed.toLowerCase();
};

// Plant dengan field tambahan yang ada di dataset asli.
type PlantWithExtras = Plant & {
  climate?: string;
  ideallight?: string;
  toleratedlight?: string;
  use?: string[] | string;
  watering?: string;
  watering_frequency?: { value?: number | null };
  mbti?: { type?: string };
};

// Bobot dasar tiap faktor (SUDAH TANPA CATEGORY)
const WEIGHTS = {
  climate: 3,
  lightIdeal: 2,
  lightTolerated: 1,
  aesthetic: 1,
  watering: 1,
  mbti: 3, // bobot tinggi, plus diprioritaskan di sorting
} as const;

// 🌿 Fungsi utama rekomendasi
export function recommend(all: Plant[], f: UserFilter): ScoredPlant[] {
  if (!Array.isArray(all) || all.length === 0) return [];

  // 1️⃣ Bersihkan input user
  const cleaned = {
    light: cleanInput(f.light),
    climate: cleanInput(f.climate),
    aesthetic: cleanInput(f.aesthetic),
    // category diabaikan
    watering: cleanInput(f.watering as string | undefined),
    mbti: cleanInput(f.mbti),
  };

  // 2️⃣ Hitung "maksimal skor yang mungkin" berdasarkan filter YANG DIISI
  let activeMaxScore = 0;
  if (cleaned.climate) activeMaxScore += WEIGHTS.climate;
  if (cleaned.light) activeMaxScore += WEIGHTS.lightIdeal; // tolerated = bonus
  if (cleaned.aesthetic) activeMaxScore += WEIGHTS.aesthetic;
  if (cleaned.watering) activeMaxScore += WEIGHTS.watering;
  if (cleaned.mbti) activeMaxScore += WEIGHTS.mbti;

  const noActiveFilter = activeMaxScore === 0;

  // 3️⃣ Hitung skor untuk setiap tanaman
  const results: ScoredPlant[] = all.map((p) => {
    const plant: PlantWithExtras = p;

    let score = 0;
    let mbtiMatch = false;

    // --- Iklim ---
    if (cleaned.climate) {
      const climate = (plant.climate ?? "").toLowerCase();
      if (climate.includes(cleaned.climate)) {
        score += WEIGHTS.climate;
      }
    }

    // --- Cahaya (ideal & tolerated) ---
    if (cleaned.light) {
      const ideal = (plant.ideallight ?? "").toLowerCase();
      const tolerated = (plant.toleratedlight ?? "").toLowerCase();

      if (ideal.includes(cleaned.light)) {
        score += WEIGHTS.lightIdeal;
      } else if (tolerated.includes(cleaned.light)) {
        score += WEIGHTS.lightTolerated;
      }
    }

    // --- Estetika / Kegunaan (use) ---
    if (cleaned.aesthetic) {
      const aestheticFilter = cleaned.aesthetic;
      const uses: string[] = [];

      const value = plant.use;

      // case: array of use
      if (Array.isArray(value)) {
        for (const u of value) {
          if (u == null) continue;
          uses.push(String(u).toLowerCase());
        }
      }
      // case: single value (string / number / dll)
      else if (value != null) {
        uses.push(String(value).toLowerCase());
      }

      if (uses.some((u) => u.includes(aestheticFilter))) {
        score += WEIGHTS.aesthetic;
      }
    }

    // --- Penyiraman ---
    if (cleaned.watering) {
      const wateringText = (plant.watering ?? "").toLowerCase();

      if (wateringText.includes(cleaned.watering)) {
        score += WEIGHTS.watering;
      } else if (!wateringText && plant.watering_frequency?.value != null) {
        const val = Number(plant.watering_frequency.value);
        let freqLabel = "light";

        if (val >= 3) {
          freqLabel = "frequent";
        } else if (val === 2) {
          freqLabel = "moderate";
        }

        if (freqLabel.includes(cleaned.watering)) {
          score += WEIGHTS.watering;
        }
      }
    }

    // --- MBTI (opsional, prioritas kuat) ---
    if (cleaned.mbti) {
      const mbtiType = (plant.mbti?.type ?? "").toLowerCase();
      if (mbtiType === cleaned.mbti) {
        score += WEIGHTS.mbti;
        mbtiMatch = true;
      }
    }

    // 4️⃣ Normalisasi skor (0–1) terhadap FILTER YANG AKTIF
    const normalizedScore = noActiveFilter
      ? 1
      : activeMaxScore > 0
      ? score / activeMaxScore
      : 0;

    const scored: ScoredPlant = {
      ...plant,
      score,
      normalizedScore,
      mbtiMatch,
    };

    return scored;
  });

  // 5️⃣ Sorting multilayer:
  //    a. Kalau user pilih MBTI → semua yg mbtiMatch=true SELALU di atas
  //    b. Di dalam grup yang sama → urutkan by normalizedScore desc
  //    c. Kalau sama persis → fallback skor mentah lalu nama latin
  return results.sort((a, b) => {
    if (cleaned.mbti) {
      const mbtiWeightA = a.mbtiMatch ? 1 : 0;
      const mbtiWeightB = b.mbtiMatch ? 1 : 0;
      if (mbtiWeightB !== mbtiWeightA) {
        return mbtiWeightB - mbtiWeightA;
      }
    }

    if (b.normalizedScore !== a.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.latin.localeCompare(b.latin);
  });
}
