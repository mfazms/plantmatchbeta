// ================================================
// 📘 lib/recommend.ts
// Sistem rekomendasi PlantMatch v3 - Fair Scoring
// ================================================

import type { Plant, UserFilter } from "./types";

// Hasil rekomendasi: Plant + skor + info tambahan
export type ScoredPlant = Plant & {
  score: number;           // skor mentah
  normalizedScore: number; // 0–1, untuk "Kesesuaian: xx%"
  mbtiMatch?: boolean;     // true kalau MBTI cocok
  hasActiveFilter?: boolean; // ⭐ PENTING: untuk UI filtering
  matchedFactors?: string[]; // Faktor apa saja yang cocok
};

// Fungsi bantu: bersihkan input teks user
const cleanInput = (input: string | null | undefined): string | undefined => {
  const trimmed = input?.trim();
  if (!trimmed) return undefined;
  return trimmed.toLowerCase();
};

// Bobot dasar tiap faktor
const WEIGHTS = {
  climate: 3,
  lightIdeal: 2,
  lightTolerated: 1,
  aesthetic: 1,
  watering: 1,
  mbti: 3, // bobot tinggi, tapi TIDAK diprioritaskan di sorting
} as const;

// 🌿 Fungsi utama rekomendasi
export function recommend(all: Plant[], f: UserFilter): ScoredPlant[] {
  if (!Array.isArray(all) || all.length === 0) return [];

  // 1️⃣ Bersihkan input user
  const cleaned = {
    light: cleanInput(f.light),
    climate: cleanInput(f.climate),
    aesthetic: cleanInput(f.aesthetic),
    watering: cleanInput(f.watering as string | undefined),
    mbti: cleanInput(f.mbti),
  };

  // 2️⃣ Hitung "maksimal skor yang mungkin" berdasarkan filter YANG DIISI
  let activeMaxScore = 0;
  if (cleaned.climate) activeMaxScore += WEIGHTS.climate;
  if (cleaned.light) activeMaxScore += WEIGHTS.lightIdeal;
  if (cleaned.aesthetic) activeMaxScore += WEIGHTS.aesthetic;
  if (cleaned.watering) activeMaxScore += WEIGHTS.watering;
  if (cleaned.mbti) activeMaxScore += WEIGHTS.mbti;

  const noActiveFilter = activeMaxScore === 0;

  // 3️⃣ Hitung skor untuk setiap tanaman
  const results: ScoredPlant[] = all.map((plant) => {
    let score = 0;
    let mbtiMatch = false;
    const matchedFactors: string[] = [];

    // --- Iklim ---
    if (cleaned.climate) {
      const climate = (plant.climate ?? "").toLowerCase();
      if (climate.includes(cleaned.climate)) {
        score += WEIGHTS.climate;
        matchedFactors.push("Iklim");
      }
    }

    // --- Cahaya (ideal & tolerated) ---
    if (cleaned.light) {
      const ideal = (plant.ideallight ?? "").toLowerCase();
      const tolerated = (plant.toleratedlight ?? "").toLowerCase();

      if (ideal.includes(cleaned.light)) {
        score += WEIGHTS.lightIdeal;
        matchedFactors.push("Cahaya Ideal");
      } else if (tolerated.includes(cleaned.light)) {
        score += WEIGHTS.lightTolerated;
        matchedFactors.push("Cahaya Toleran");
      }
    }

    // --- Estetika / Kegunaan (use) ---
    if (cleaned.aesthetic) {
      const aestheticFilter = cleaned.aesthetic;
      const uses: string[] = [];

      const value = plant.use;

      if (Array.isArray(value)) {
        for (const u of value) {
          if (u == null) continue;
          uses.push(String(u).toLowerCase());
        }
      } else if (value != null) {
        uses.push(String(value).toLowerCase());
      }

      if (uses.some((u) => u.includes(aestheticFilter))) {
        score += WEIGHTS.aesthetic;
        matchedFactors.push("Estetika");
      }
    }

    // --- Penyiraman ---
    if (cleaned.watering) {
      const wateringText = (plant.watering ?? "").toLowerCase();

      if (wateringText.includes(cleaned.watering)) {
        score += WEIGHTS.watering;
        matchedFactors.push("Penyiraman");
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
          matchedFactors.push("Penyiraman");
        }
      }
    }

    // --- MBTI (opsional) ---
    if (cleaned.mbti) {
      // Support both string and object format
      const plantMbti = typeof plant.mbti === 'string' 
        ? plant.mbti.toLowerCase() 
        : (plant.mbti as any)?.type?.toLowerCase() || '';

      if (plantMbti === cleaned.mbti) {
        score += WEIGHTS.mbti;
        mbtiMatch = true;
        matchedFactors.push("MBTI");
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
      matchedFactors,
      hasActiveFilter: !noActiveFilter, // ⭐ Flag penting untuk UI
    };

    return scored;
  });

  // 5️⃣ Sorting: FAIR by normalized score (NO MBTI PRIORITY)
  //    Semua tanaman diurutkan murni berdasarkan persentase kesesuaian
  return results.sort((a, b) => {
    // Sort by normalized score (descending)
    if (b.normalizedScore !== a.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }

    // Tiebreaker: raw score
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Final tiebreaker: alphabetical
    return a.latin.localeCompare(b.latin);
  });
}

// 🎯 Fungsi grouping untuk UI
export type PlantGroup = {
  perfect: ScoredPlant[];      // 80-100%
  great: ScoredPlant[];         // 60-79%
  good: ScoredPlant[];          // 40-59%
  acceptable: ScoredPlant[];    // 20-39%
  poor: ScoredPlant[];          // 1-19%
};

export function groupPlantsByScore(plants: ScoredPlant[]): PlantGroup {
  const groups: PlantGroup = {
    perfect: [],
    great: [],
    good: [],
    acceptable: [],
    poor: [],
  };

  plants.forEach(plant => {
    const pct = plant.normalizedScore * 100;
    
    if (pct >= 80) {
      groups.perfect.push(plant);
    } else if (pct >= 60) {
      groups.great.push(plant);
    } else if (pct >= 40) {
      groups.good.push(plant);
    } else if (pct >= 20) {
      groups.acceptable.push(plant);
    } else if (pct > 0) {
      groups.poor.push(plant);
    }
  });

  return groups;
}

// 📊 Helper: Get group label and emoji
export function getGroupInfo(groupKey: keyof PlantGroup) {
  const info = {
    perfect: {
      label: "Sangat Cocok",
      emoji: "🌟",
      color: "emerald",
      description: "Tanaman ini sangat sesuai dengan semua kriteria Anda!",
      range: "80-100%"
    },
    great: {
      label: "Cocok",
      emoji: "✅",
      color: "green",
      description: "Tanaman ini cocok dengan sebagian besar kriteria Anda",
      range: "60-79%"
    },
    good: {
      label: "Cukup Cocok",
      emoji: "👍",
      color: "lime",
      description: "Tanaman ini memenuhi beberapa kriteria Anda",
      range: "40-59%"
    },
    acceptable: {
      label: "Bisa Dipertimbangkan",
      emoji: "💡",
      color: "yellow",
      description: "Tanaman ini memiliki beberapa kecocokan dengan kriteria Anda",
      range: "20-39%"
    },
    poor: {
      label: "Kurang Cocok",
      emoji: "⚠️",
      color: "orange",
      description: "Tanaman ini kurang sesuai dengan kriteria Anda",
      range: "1-19%"
    }
  };

  return info[groupKey];
}