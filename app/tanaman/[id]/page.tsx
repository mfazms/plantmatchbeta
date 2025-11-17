import Image from "next/image";
import { fetchPlants } from "@/lib/loadData";
import { displayName } from "@/lib/types";
import PlantImage from "@/components/PlantImage";
import ExportPDFButton from "@/components/ExportPDFButton";
import MulaiMenanamButton from "@/components/MulaiMenanamButton";
import ChatButton from "@/components/ChatButton";

const toList = (v: unknown) =>
  Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)];

export default async function PlantDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const plants = await fetchPlants();
  const plant = plants.find((p) => p.id === Number(id));

  if (!plant)
    return (
      <main className="max-w-3xl mx-auto p-8 bg-white text-gray-900">
        Tanaman tidak ditemukan.
      </main>
    );

  const plantForPdf = { ...plant, image: `/api/plant-image?id=${plant.id}` };

  // Konteks untuk chatbot
  const mbtiInfo = typeof plant.mbti === 'string' 
    ? plant.mbti 
    : (plant.mbti as any)?.type || '';
  
  const chatContext = `User sedang melihat tanaman: ${displayName(plant)} (${plant.latin})
Family: ${plant.family}
Kategori: ${plant.category}
Asal: ${plant.origin}
Iklim: ${plant.climate}
Suhu ideal: ${plant.tempmin?.celsius}°C - ${plant.tempmax?.celsius}°C
Cahaya ideal: ${plant.ideallight}
Cahaya toleran: ${plant.toleratedlight}
Penyiraman: ${plant.watering || (plant.watering_frequency ? `${plant.watering_frequency.value} kali per ${plant.watering_frequency.period}` : "-")}
${plant.watering_frequency?.notes ? `Catatan penyiraman: ${plant.watering_frequency.notes}` : ""}
Hama: ${toList(plant.insects).join(", ") || "-"}
Penyakit: ${toList(plant.diseases).join(", ") || "-"}
${plant.care_tips ? `Tips perawatan: ${plant.care_tips.join(", ")}` : ""}
${mbtiInfo ? `MBTI Personality: ${mbtiInfo}` : ""}`;

  return (
    <main className="min-h-[100dvh] bg-white text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header actions */}
        <div className="flex items-center justify-between gap-4">
          <a
            href="/rekomendasi"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <span aria-hidden>←</span> Kembali
          </a>

          <ExportPDFButton
            plants={[plantForPdf]}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
            label="Export PDF"
            icon
          />
        </div>

        {/* Konten */}
        <div className="mt-6 grid md:grid-cols-2 gap-8">
          <div className="w-full">
            {/* ⭐ FIXED: Image container dengan flexible height */}
            <div className="relative w-full rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white flex items-center justify-center min-h-[300px]">
              <PlantImage
                id={plant.id}
                alt={plant.latin}
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>

            {/* Tombol client */}
            {plant ? (
              <MulaiMenanamButton plant={plant} />
            ) : (
              <p className="text-red-600 font-semibold mt-4">
                Tanaman tidak ditemukan.
              </p>
            )}
          </div>

          {/* Detail tanaman */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Image
                src="/hero1.png"
                alt="PlantMatch"
                width={56}
                height={56}
                className="h-10 w-10 object-contain"
                priority
              />
              <span className="text-sm font-medium text-emerald-700/80">
                PlantMatch
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-800">
              {displayName(plant)}
            </h1>
            <p className="mt-1 text-lg md:text-xl italic text-emerald-700/80">
              {plant.latin}
            </p>

            <dl className="mt-6 space-y-3 text-base md:text-lg leading-7">
              <div>
                <dt className="font-semibold text-emerald-900 inline">Family:</dt>{" "}
                <dd className="inline text-gray-800">{plant.family ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Kategori:</dt>{" "}
                <dd className="inline text-gray-800">{plant.category ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Asal/Origin:</dt>{" "}
                <dd className="inline text-gray-800">{plant.origin ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Iklim:</dt>{" "}
                <dd className="inline text-gray-800">{plant.climate ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Suhu ideal:</dt>{" "}
                <dd className="inline text-gray-800">
                  {plant.tempmin?.celsius ?? "-"}°C – {plant.tempmax?.celsius ?? "-"}°C
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Cahaya ideal:</dt>{" "}
                <dd className="inline text-gray-800">{plant.ideallight ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Cahaya toleran:</dt>{" "}
                <dd className="inline text-gray-800">{plant.toleratedlight ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Penyiraman:</dt>{" "}
                <dd className="inline text-gray-800">
                  {plant.watering || 
                    (plant.watering_frequency 
                      ? `${plant.watering_frequency.value} kali per ${plant.watering_frequency.period}`
                      : "-"
                    )
                  }
                </dd>
              </div>
              
              {/* Frekuensi & Catatan Penyiraman */}
              {plant.watering_frequency?.notes && (
                <div>
                  <dt className="font-semibold text-emerald-900 inline">Catatan Penyiraman:</dt>{" "}
                  <dd className="inline text-gray-800">{plant.watering_frequency.notes}</dd>
                </div>
              )}

              <div>
                <dt className="font-semibold text-emerald-900 inline">Hama:</dt>{" "}
                <dd className="inline text-gray-800">
                  {toList(plant.insects).join(", ") || "-"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Penyakit:</dt>{" "}
                <dd className="inline text-gray-800">
                  {toList(plant.diseases).join(", ") || "-"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-900 inline">Penggunaan:</dt>{" "}
                <dd className="inline text-gray-800">
                  {toList(plant.use).join(", ") || "-"}
                </dd>
              </div>

              {/* Tips Perawatan */}
              {plant.care_tips && plant.care_tips.length > 0 && (
                <div>
                  <dt className="font-semibold text-emerald-900">Tips Perawatan:</dt>
                  <dd className="mt-2 text-gray-800">
                    <ul className="list-disc list-inside space-y-1">
                      {plant.care_tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}

              {/* MBTI Personality */}
              {plant.mbti && (
                <div className="mt-4 pt-4 border-t border-emerald-100">
                  <dt className="font-semibold text-emerald-900 inline">Kepribadian MBTI:</dt>{" "}
                  <dd className="inline text-gray-800">
                    <span className="font-bold text-emerald-700">
                      {typeof plant.mbti === 'string' 
                        ? plant.mbti 
                        : (plant.mbti as any).type || '-'}
                    </span>
                    {typeof plant.mbti === 'object' && (plant.mbti as any).notes && 
                      ` – ${(plant.mbti as any).notes}`}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          © 2025 <span className="text-emerald-700 font-semibold">PlantMatch</span> – Find the Plant That Fits You
        </div>
      </div>

      {/* Floating Chat Button */}
      <ChatButton context={chatContext} plantName={displayName(plant)} />
    </main>
  );
}