// lib/loadData.ts
import type { Plant } from "./types";

/**
 * Helper: pastikan nilai jadi array.
 * - kalau sudah array  -> balikin apa adanya
 * - kalau null / undefined -> []
 * - kalau single value -> [value]
 */
const toArray = (v: unknown): any[] => {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
};

/**
 * Normalisasi 1 record tanaman dari bentuk mentah JSON → Plant (tipe TS kita).
 */
const normalize = (p: any): Plant => {
  const commonArray = Array.isArray(p.common)
    ? p.common.map(String)
    : p.common
    ? [String(p.common)]
    : [];

  return {
    id: p.id,
    latin: p.latin,
    family: p.family,
    common: commonArray,

    category: p.category,
    origin: p.origin,
    climate: p.climate,

    tempmax: p.tempmax,
    tempmin: p.tempmin,

    ideallight: p.ideallight,
    toleratedlight: p.toleratedlight,

    use: p.use,

    watering: p.watering,
    watering_frequency: p.watering_frequency,

    insects: toArray(p.insects),
    diseases: toArray(p.diseases),
    care_tips: toArray(p.care_tips),

    // JSON: mbti bisa { type, notes } atau string.
    // Tipe Plant: mbti?: string
    mbti: p.mbti?.type ?? (typeof p.mbti === "string" ? p.mbti : undefined),

    // fallback gambar default kalau tidak ada di JSON
    image: p.image ?? `/images/plants/${p.id}.jpg`,
  };
};

/**
 * Baca data tanaman.
 * - SSR (server): langsung import JSON dan normalisasi → TANPA network
 * - Client: fetch ke /api/plants
 */
export async function fetchPlants(): Promise<Plant[]> {
  // Server (SSR / RSC / Route Handlers)
  if (typeof window === "undefined") {
    try {
      const raw = (await import("@/public/data/PlantsData.json"))
        .default as any[];
      return raw.map(normalize);
    } catch (err) {
      console.error("[fetchPlants][SSR] gagal import JSON:", err);
      throw new Error("Gagal memuat data tanaman (SSR)");
    }
  }

  // Client
  const res = await fetch("/api/plants", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Gagal memuat data tanaman (Client)`);
  }

  // /api/plants sudah mengembalikan Plant[] yang sudah dibersihkan
  const data = (await res.json()) as Plant[];
  return data;
}
