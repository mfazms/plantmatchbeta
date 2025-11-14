// =======================
//  TYPES FOR PLANT DATA
// =======================

export type Temperature = {
  celsius: number;
  fahrenheit: number;
};

// Periode penyiraman yang diizinkan
export type WateringPeriod = "day" | "week" | "month";

export type WateringFrequency = {
  value: number;          // contoh: 2
  period: WateringPeriod; // contoh: "week"
  notes?: string;         // catatan opsional
};

// =======================
// 🌱 PLANT TYPE UTAMA
// =======================

export type Plant = {
  id: number;

  latin: string;
  family: string;

  // Nama umum (common name)
  common: string[]; // array 1–3 nama

  // Habitat / iklim
  climate?: string;

  // Cahaya
  ideallight?: string;
  toleratedlight?: string;

  // Estetika / kegunaan
  use?: string[] | string;

  // Penyiraman
  watering?: string;
  watering_frequency?: WateringFrequency;

  // MBTI cocokannya
  // Di JSON kamu: "mbti": { "type": "...", "notes": "..." }
  // tapi bisa juga suatu saat kamu simpan langsung string.
  mbti?:
    | string
    | {
        type: string;
        notes?: string;
      };

  // Gambar (dipakai di loadData.ts → normalize)
  image?: string;

  // Kalau kamu punya field lain (category, origin, tempmax, dst)
  // aman ditambahkan sebagai optional di sini:
  // category?: string;
  // origin?: string;
  // tempmax?: Temperature;
  // tempmin?: Temperature;
};

// =======================
// 🎛 USER FILTER TYPE
// =======================
//
// Dipakai untuk state filter di halaman rekomendasi & FiltersPanel
// (light, climate, aesthetic, watering, mbti, dll).
//
export type UserFilter = {
  light?: string;
  climate?: string;
  aesthetic?: string;
  category?: string;
  watering?: string;
  mbti?: string;
};

// --------------------------------
// 🌸 Helper: displayName(Plant)
// --------------------------------
// Pilih nama yang paling "nyaman dibaca":
// 1. Kalau ada common[1] → pakai itu
// 2. Kalau tidak ada → pakai common[0]
// 3. Kalau tetap tidak ada → fallback latin
export const displayName = (plant: Plant): string => {
  const common = Array.isArray(plant.common) ? plant.common : [];
  return common[1] ?? common[0] ?? plant.latin;
};
