import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Inisialisasi client Gemini
const ai = new GoogleGenAI(
  GEMINI_API_KEY
    ? { apiKey: GEMINI_API_KEY }
    : { apiKey: "" } // nanti dicek lagi di handler
);

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY belum diset di server. Cek file .env.local dan restart dev server.",
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

    // System instruction / persona bot
    let systemContext = `Kamu adalah PlantMatch Assistant, asisten virtual yang ahli dalam tanaman hias dan perawatannya. 
    
Tugasmu adalah:
- Menjawab pertanyaan tentang perawatan tanaman dengan jelas dan praktis
- Memberikan tips dan saran yang mudah dipahami
- Ramah, helpful, dan menggunakan bahasa Indonesia yang natural
- Jika tidak yakin, jujur mengakui keterbatasan
- Fokus pada informasi yang akurat dan bermanfaat

Selalu jawab dalam bahasa Indonesia dengan gaya yang ramah dan conversational.`;

    if (context) {
      systemContext += `\n\nKonteks saat ini:\n${context}`;
    }

    const chatHistory: any[] = Array.isArray(history) ? history : [];

    const contents: any[] = [];

    // Masukkan system context sebagai pesan awal
    contents.push({
      role: "user",
      parts: [{ text: systemContext }],
    });

    // Tambahkan history (opsional)
    for (const turn of chatHistory) {
      if (!turn || !turn.role || !turn.content) continue;

      contents.push({
        role: turn.role, // "user" / "assistant" di frontend kita kirim sebagai "user"/"assistant"
        parts: [{ text: String(turn.content) }],
      });
    }

    // Pesan user sekarang
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Panggil Gemini
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

    let userMessage =
      "Terjadi kesalahan saat menghubungi Gemini. Coba beberapa saat lagi ya! 😅";

    // Tangani khusus kalau kuota habis / rate limit
    if (
      error?.status === 429 ||
      error?.code === 429 ||
      /quota/i.test(error?.message ?? "")
    ) {
      userMessage =
        "Kuota Gemini API kamu sudah habis atau belum diaktifkan.\n" +
        "Coba cek Google AI Studio (ai.google.dev) → Usage / Quotas atau aktifkan billing di project tersebut. 🌱";
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
      },
      { status: 200 } // tetap 200 supaya frontend gampang konsumsi
    );
  }
}
