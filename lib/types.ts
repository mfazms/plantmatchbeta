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

  // Kategori tanaman (indoor, outdoor, succulent, dll)
  category?: string;

  // Habitat / iklim
  climate?: string;

  // Asal / origin
  origin?: string;

  // Suhu maksimum & minimum yang direkomendasikan
  tempmax?: Temperature;
  tempmin?: Temperature;

  // Cahaya
  ideallight?: string;
  toleratedlight?: string;

  // Estetika / kegunaan
  use?: string[] | string;

  // Penyiraman
  watering?: string;
  watering_frequency?: WateringFrequency;

  // Hama & penyakit yang umum
  insects?: any[];   // dibuat longgar biar cocok dengan komponen
  diseases?: any[];  // idem

  // Tips perawatan
  care_tips?: any[]; // <— ini yang tadinya string | string[]

  // MBTI cocokannya (sudah dikonversi jadi string di loadData.ts / route.ts)
  mbti?: string;

  // Gambar (dipakai di loadData.ts → normalize)
  image?: string;
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
