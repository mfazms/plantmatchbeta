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

  // Kalau user nggak isi filter apa pun → semua tanaman sama, normalizedScore = 1
  const noActiveFilter = activeMaxScore === 0;

  // 3️⃣ Hitung skor untuk setiap tanaman
  const results: ScoredPlant[] = all.map((p: Plant) => {
    let s = 0;
    let mbtiMatch = false;

    // --- Iklim ---
    if (cleaned.climate) {
      const climate = String((p as any).climate ?? "").toLowerCase();
      if (climate.includes(cleaned.climate)) s += WEIGHTS.climate;
    }

    // --- Cahaya (ideal & tolerated) ---
    if (cleaned.light) {
      const ideal = String((p as any).ideallight ?? "").toLowerCase();
      const tolerated = String((p as any).toleratedlight ?? "").toLowerCase();

      if (ideal.includes(cleaned.light)) {
        s += WEIGHTS.lightIdeal;
      } else if (tolerated.includes(cleaned.light)) {
        s += WEIGHTS.lightTolerated;
      }
    }

    // --- Estetika / Kegunaan ---
    if (cleaned.aesthetic) {
      const uses: string[] = Array.isArray((p as any).use)
        ? (p as any).use.map((u: unknown) => String(u).toLowerCase())
        : [];

      if (uses.some((u: string) => u.includes(cleaned.aesthetic!))) {
        s += WEIGHTS.aesthetic;
      }
    }

    // --- Penyiraman ---
    if (cleaned.watering) {
      const w = String((p as any).watering ?? "").toLowerCase();

      if (w.includes(cleaned.watering)) {
        s += WEIGHTS.watering;
      } else if (!w && (p as any).watering_frequency?.value) {
        // fallback: kalau string watering kosong, pakai watering_frequency.value
        const val = Number((p as any).watering_frequency.value);
        // semakin sering disiram, semakin mirip "frequent"
        const freqLabel: string =
          val >= 3 ? "frequent" : val === 2 ? "moderate" : "light";

        if (freqLabel.includes(cleaned.watering)) {
          s += WEIGHTS.watering;
        }
      }
    }

    // --- MBTI (opsional, prioritas kuat) ---
    if (cleaned.mbti) {
      const mbtiType = String((p as any).mbti?.type ?? "").toLowerCase();
      if (mbtiType === cleaned.mbti) {
        s += WEIGHTS.mbti;
        mbtiMatch = true;
      }
    }

    // 4️⃣ Normalisasi skor (0–1) terhadap FILTER YANG AKTIF
    const normalizedScore = noActiveFilter
      ? 1 // kalau nggak ada filter, semua 100%
      : activeMaxScore > 0
      ? s / activeMaxScore
      : 0;

    return {
      ...(p as any),
      score: s,
      normalizedScore,
      mbtiMatch,
    };
  });

  // 5️⃣ Sorting multilayer:
  //    a. Kalau user pilih MBTI → semua yg mbtiMatch=true SELALU di atas
  //    b. Di dalam grup yang sama → urut berdasarkan normalizedScore
  //    c. Kalau sama persis → fallback skor mentah lalu nama latin
  return results.sort((a, b) => {
    // a) Prioritas MBTI (hanya kalau user memang mengisi mbti)
    if (cleaned.mbti) {
      const mbtiDiff =
        Number(b.mbtiMatch === true) - Number(a.mbtiMatch === true);
      if (mbtiDiff !== 0) return mbtiDiff;
    }

    // b) Urutkan berdasarkan normalizedScore (semakin tinggi semakin atas)
    if (b.normalizedScore !== a.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }

    // c) fallback: skor mentah lalu nama latin
    if (b.score !== a.score) return b.score - a.score;
    return a.latin.localeCompare(b.latin);
  });
}
