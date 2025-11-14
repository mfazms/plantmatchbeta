import { NextResponse } from "next/server";
import type { Plant } from "@/lib/types";

export async function GET() {
  try {
    // Ambil data mentah dari JSON (tipe any[])
    const raw = (await import("@/public/data/PlantsData.json")).default as any[];

    // Mapping ke tipe Plant (sesuai lib/types.ts)
    const data: Plant[] = raw.map((p) => ({
      id: p.id,
      latin: p.latin,
      family: p.family,
      common: p.common ?? [],

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

      insects: p.insects,
      diseases: p.diseases,
      care_tips: p.care_tips,

      // 🔑 convert object → string (hanya ambil type)
      mbti: p.mbti?.type ?? undefined,

      // fallback image kalau nggak ada di JSON
      image: p.image ?? `/images/plants/${p.id}.jpg`,
    }));

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[GET /api/plants] error:", err);
    return NextResponse.json(
      { error: "Failed to load plants" },
      { status: 500 },
    );
  }
}
