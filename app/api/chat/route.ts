// app/api/chat/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { fetchPlants } from "@/lib/loadData";
import type { Plant } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI(
  GEMINI_API_KEY ? { apiKey: GEMINI_API_KEY } : { apiKey: "" }
);

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY belum diset di server.",
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    const { message, context, history } = body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 200 }
      );
    }

    // Load database tanaman
    let plantDbDetail = "";
    try {
      const plants: Plant[] = await fetchPlants();

      const plantsFormatted = plants.map((p) => {
        const common = Array.isArray(p.common) && p.common.length > 0
          ? p.common.join(" / ")
          : p.latin;

        const mbtiType = typeof p.mbti === 'string' 
          ? p.mbti 
          : (p.mbti as any)?.type || '-';

        return {
          id: p.id,
          nama: common,
          latin: p.latin,
          kategori: p.category || "-",
          cahaya_ideal: p.ideallight || "-",
          cahaya_toleran: p.toleratedlight || "-",
          iklim: p.climate || "-",
          suhu_min: p.tempmin?.celsius || "-",
          suhu_max: p.tempmax?.celsius || "-",
          penyiraman: p.watering || 
            (p.watering_frequency 
              ? `${p.watering_frequency.value}x per ${p.watering_frequency.period}`
              : "-"),
          mbti: mbtiType,
          asal: p.origin || "-",
        };
      });

      plantDbDetail = JSON.stringify(plantsFormatted, null, 2);
    } catch (err) {
      console.error("[/api/chat] Error loading plants:", err);
    }

    // System instruction
    let systemContext = `Kamu adalah **PlantMatch Assistant**, asisten virtual yang ahli dalam tanaman hias dan perawatannya.

**TUGAS UTAMA:**
- Memberikan rekomendasi tanaman yang **AKURAT** berdasarkan database internal PlantMatch
- Menjawab pertanyaan tentang perawatan tanaman dengan jelas dan praktis
- Memberikan tips yang mudah dipahami dengan emoji yang relevan 🌱
- Ramah, helpful, dan menggunakan bahasa Indonesia natural
- Format jawaban dengan markdown: **bold**, *italic*, dan list untuk readability

**ATURAN PENTING REKOMENDASI TANAMAN:**

1. **SELALU CEK MBTI dengan TELITI!** 
   - Jika user menyebut MBTI (contoh: "aku INFJ"), HANYA rekomendasikan tanaman dengan field \`mbti\` yang **PERSIS SAMA**
   - Jangan asal rekomendasikan tanaman dengan MBTI berbeda!
   - Contoh: User INFJ → HANYA rekomendasikan tanaman dengan mbti: "INFJ"

2. **Format Rekomendasi yang WAJIB:**
   Setiap rekomendasi HARUS ditulis PERSIS seperti ini (tanpa nomor di dalam bold):
   
   **1. Nama Lengkap Tanaman** (ID: 123)
   - *Nama Latin:* [latin]
   - *Kepribadian MBTI:* [mbti]
   - *Cahaya:* [cahaya_ideal]
   - *Penyiraman:* [penyiraman]
   - *Kenapa cocok:* [penjelasan]
   
   PENTING: 
   - Nomor urut (1., 2., 3.) di LUAR tanda **bold**
   - Nama tanaman LENGKAP di dalam **bold**
   - Format (ID: 123) HARUS ADA setelah nama

3. **Jika tidak ada tanaman yang cocok** dengan kriteria user (misalnya MBTI tidak ada):
   - Jujur bilang "Maaf, saat ini database PlantMatch belum memiliki tanaman dengan MBTI [X]"
   - Tawarkan tanaman dengan karakteristik perawatan yang mirip
   - Jelaskan bahwa rekomendasi alternatif tidak berdasarkan MBTI

4. **Gunakan emoji yang relevan:** 🌱 💧 ☀️ 🌿 🪴 untuk membuat jawaban lebih friendly

5. **Prioritas matching:**
   - MBTI (jika disebutkan) - **PALING PENTING**
   - Cahaya (bright/low light)
   - Kesibukan (tanaman low maintenance)
   - Iklim/suhu ruangan
   - Estetika (indoor/outdoor, ukuran)

**DATABASE TANAMAN PLANTMATCH:**

\`\`\`json
${plantDbDetail}
\`\`\`

**CONTOH INTERAKSI:**

User: "Aku INFJ, rekomendasiin tanaman dong"
❌ SALAH: Merekomendasikan Snake plant (ISTP)
✅ BENAR: Cek database, cari tanaman dengan mbti: "INFJ", lalu rekomendasikan

User: "Tanaman yang gampang dirawat untuk pemula"
✅ Filter tanaman dengan penyiraman jarang, toleran cahaya rendah, lalu rekomendasikan`;

    if (context) {
      systemContext += `\n\n**Konteks halaman:**\n${context}`;
    }

    const chatHistory: any[] = Array.isArray(history) ? history : [];
    const contents: any[] = [];

    // System context
    contents.push({
      role: "user",
      parts: [{ text: systemContext }],
    });

    // Chat history
    for (const turn of chatHistory) {
      if (!turn || !turn.role || !turn.content) continue;
      contents.push({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: String(turn.content) }],
      });
    }

    // Current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Call Gemini
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
    });

    const text = result.text ?? "";

    return NextResponse.json({
      success: true,
      reply: text,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    let userMessage = "Terjadi kesalahan saat menghubungi AI. Coba lagi ya! 😅";

    if (
      error?.status === 429 ||
      error?.code === 429 ||
      /quota/i.test(error?.message ?? "")
    ) {
      userMessage =
        "Kuota Gemini API sudah habis atau belum diaktifkan.\n" +
        "Cek Google AI Studio (ai.google.dev) untuk info lebih lanjut. 🌱";
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
      },
      { status: 200 }
    );
  }
}