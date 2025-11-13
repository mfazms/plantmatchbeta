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

export type MBTIInfo = {
  type: string;           // contoh: "ISFJ"
  notes?: string;         // deskripsi singkat
};

// ========================================
//  PLANT TYPE — updated sesuai JSON terbaru
// ========================================
export type Plant = {
  id: number;
  latin: string;
  family: string;
  common: string[];

  category: string;
  origin: string;
  climate: string;

  tempmax: Temperature;
  tempmin: Temperature;

  ideallight: string;
  toleratedlight: string;
  watering: string;

  insects?: string[];
  diseases?: string[];

  // array (Table top, Potted plant, dll)
  use?: string[];

  watering_frequency?: WateringFrequency;
  care_tips?: string[];

  // tipe MBTI & catatan
  mbti?: MBTIInfo;
};

// ===========================
//  USER FILTER TYPE (UI panel)
// ===========================
export type UserFilter = {
  light?: string;
  climate?: string;
  aesthetic?: string;
  category?: string;
  watering?: string;

  // filter tambahan (database baru)
  mbti?: string;
};

// --------------------------------
// 🌸 Helper: displayName(Plant)
// --------------------------------
// Pilih nama yang paling "nyaman dibaca":
// 1. Kalau ada common[1] → pakai itu (biasanya nama panggilan lebih catchy)
// 2. Kalau nggak ada → pakai common[0]
// 3. Kalau tetap nggak ada → fallback ke nama latin
export const displayName = (plant: Plant): string => {
  const common = Array.isArray(plant.common) ? plant.common : [];
  return common[1] ?? common[0] ?? plant.latin;
};
