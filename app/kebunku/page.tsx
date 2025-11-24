"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { fetchPlants } from "@/lib/loadData";
import type { Plant } from "@/lib/types";
import {
  getUserGarden,
  isWateredToday,
  markWateredToday,
  type GardenWithPlant,
} from "@/lib/garden";
import Link from "next/link";
import ChatButton from "@/components/ChatButton";
import StopPlantingDialog from "@/components/StopPlantingDialog";

const formatDuration = (dateValue: any) => {
  let planted: Date;
  
  if (dateValue instanceof Date) {
    planted = dateValue;
  } else if (typeof dateValue === 'string') {
    planted = new Date(dateValue);
  } else if (dateValue?.toDate) {
    planted = dateValue.toDate();
  } else {
    return "Baru ditanam";
  }

  const now = new Date();
  const diffMs = now.getTime() - planted.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  if (minutes > 0) return `${minutes} menit lalu`;
  return "Baru saja";
};

const formatDate = (dateValue: any) => {
  if (!dateValue) return "-";
  
  let d: Date;
  if (dateValue instanceof Date) {
    d = dateValue;
  } else if (typeof dateValue === 'string') {
    d = new Date(dateValue);
  } else if (dateValue?.toDate) {
    d = dateValue.toDate();
  } else {
    return "-";
  }

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getLastWateredDiff = (entry: any) => {
  if (!entry.lastWateredAt) return "Belum pernah disiram";
  
  let last: Date;
  if (entry.lastWateredAt instanceof Date) {
    last = entry.lastWateredAt;
  } else if (typeof entry.lastWateredAt === 'string') {
    last = new Date(entry.lastWateredAt);
  } else if (entry.lastWateredAt?.toDate) {
    last = entry.lastWateredAt.toDate();
  } else {
    return "Belum pernah disiram";
  }

  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Hari ini";
  if (days === 1) return "1 hari lalu";
  return `${days} hari lalu`;
};

// 7 hari terakhir termasuk hari ini
const buildLast7Days = () => {
  const days: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.getDate().toString(),
    });
  }
  return days;
};

const last7Days = buildLast7Days();

export default function KebunkuPage() {
  const [user, setUser] = useState<User | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [garden, setGarden] = useState<GardenWithPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [wateringLoadingId, setWateringLoadingId] = useState<string | null>(null);
  const [stopDialogData, setStopDialogData] = useState<{
    isOpen: boolean;
    entryId: string;
    plantName: string;
  }>({ isOpen: false, entryId: "", plantName: "" });

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Fetch plants + garden
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const allPlants = await fetchPlants();
        setPlants(allPlants);

        if (user) {
          const entries = await getUserGarden(user.uid);
          const byId = new Map<number, Plant>();
          
          for (const p of allPlants) {
            byId.set(p.id, p);
          }

          const joined: GardenWithPlant[] = entries.map((e) => ({
            ...e,
            plant: byId.get(e.plantId),
          }));
          
          setGarden(joined);
        } else {
          setGarden([]);
        }
      } catch (err) {
        console.error("Gagal memuat kebun:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const unwateredTodayCount = useMemo(
    () => garden.filter((g) => !isWateredToday(g)).length,
    [garden]
  );

  const handleWaterToday = async (entryId: string) => {
    try {
      setWateringLoadingId(entryId);
      await markWateredToday(entryId);

      // Update state lokal
      setGarden((prev) =>
        prev.map((g) =>
          g.id === entryId
            ? {
                ...g,
                lastWateredAt: new Date(),
                wateringHistory: [
                  ...(g.wateringHistory ?? []),
                  new Date().toISOString().slice(0, 10),
                ],
              }
            : g
        )
      );
    } catch (err) {
      console.error("Gagal update penyiraman:", err);
      alert("Gagal menandai penyiraman. Coba lagi ya.");
    } finally {
      setWateringLoadingId(null);
    }
  };

  const handleStop = (entryId: string, plantName: string) => {
    setStopDialogData({
      isOpen: true,
      entryId,
      plantName,
    });
  };

  const handleStopSuccess = () => {
    setGarden((prev) => prev.filter((g) => g.id !== stopDialogData.entryId));
    setStopDialogData({ isOpen: false, entryId: "", plantName: "" });
  };

  // ⭐ Dapatkan nama user
  const getUserName = () => {
    if (!user) return "Tamu";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "Pengguna";
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-emerald-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Silakan login dulu untuk melihat kebunmu.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-emerald-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-emerald-800/80 px-2 py-2 text-sm font-medium gap-2">
            <Link
              href="/rekomendasi"
              className="px-4 py-1 rounded-full hover:bg-emerald-700 transition"
            >
              All Plants
            </Link>
            <button className="px-4 py-1 bg-white text-emerald-800 rounded-full">
              My Garden
            </button>
            <Link
              href="/riwayat-tanaman"
              className="px-4 py-1 rounded-full hover:bg-emerald-700 transition"
            >
              History
            </Link>
            <Link
              href="/wishlist"
              className="px-4 py-1 rounded-full hover:bg-emerald-700 transition"
            >
              Wishlist
            </Link>
          </div>
        </div>

        {/* ⭐ UBAH: Tambahkan nama user */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          {getUserName()}'s Garden
        </h1>

        {unwateredTodayCount > 0 && (
          <div className="mt-6 mb-6 rounded-lg bg-amber-100 text-amber-900 px-4 py-3 text-sm">
            ⚠️ Kamu punya{" "}
            <span className="font-semibold">{unwateredTodayCount}</span>{" "}
            tanaman yang <span className="font-semibold">belum disiram</span>{" "}
            hari ini.
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-center text-emerald-100">Loading kebun...</p>
        ) : garden.length === 0 ? (
          <div className="mt-10 text-center text-emerald-100">
            <p className="mb-4">
              Kamu belum menanam tanaman apapun. Coba mulai dari halaman
              rekomendasi ya 🌿
            </p>
            <Link
              href="/rekomendasi"
              className="inline-block px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition"
            >
              Lihat Rekomendasi Tanaman
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {garden.map((entry) => {
              const plant = entry.plant;
              const wateredToday = isWateredToday(entry);
              const plantName = entry.plantName || plant?.common?.[0] || plant?.latin || "Tanaman Tak Dikenal";

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-emerald-800/70 p-4 md:p-6 flex flex-col md:flex-row gap-4 shadow-lg group hover:bg-emerald-800/80 transition"
                >
                  {/* Gambar - Clickable ke detail */}
                  <Link 
                    href={`/tanaman/${entry.plantId}`}
                    className="md:w-1/3 block"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-white group-hover:ring-2 group-hover:ring-emerald-400 transition">
                      {entry.image || plant?.image ? (
                        <img
                          src={entry.image || plant?.image || ""}
                          alt={plant?.latin ?? "Plant"}
                          className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-44 w-full flex items-center justify-center text-emerald-500 text-sm">
                          No image
                        </div>
                      )}
                      <div className="absolute top-2 right-2 rounded-full bg-emerald-600 text-xs px-3 py-1 font-semibold">
                        {formatDuration(entry.plantedAt || entry.startedAt)}
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="md:flex-1 flex flex-col justify-between">
                    <div>
                      {/* Nama tanaman - Clickable ke detail */}
                      <Link 
                        href={`/tanaman/${entry.plantId}`}
                        className="block hover:text-emerald-200 transition"
                      >
                        <h2 className="text-lg font-semibold">{plantName}</h2>
                        <p className="text-sm text-emerald-200 italic">
                          {plant?.latin ?? "Nama latin tidak diketahui"}
                        </p>
                      </Link>

                      <div className="mt-3 text-xs text-emerald-100 space-y-1">
                        <p>
                          <span className="font-semibold">Mulai menanam:</span>{" "}
                          {formatDate(entry.plantedAt || entry.startedAt)}
                        </p>
                        <p>
                          <span className="font-semibold">Terakhir disiram:</span>{" "}
                          {getLastWateredDiff(entry)}
                        </p>
                        <p className="mt-1">
                          {wateredToday ? (
                            <span className="inline-flex items-center gap-1 text-emerald-200">
                              <span className="h-2 w-2 rounded-full bg-emerald-300" />
                              Hari ini sudah disiram ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-200">
                              <span className="h-2 w-2 rounded-full bg-amber-300" />
                              Belum disiram hari ini
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Kalender mini 7 hari */}
                      <div className="mt-4">
                        <p className="text-xs font-semibold mb-1">
                          Riwayat penyiraman (7 hari terakhir)
                        </p>
                        <div className="flex gap-1">
                          {last7Days.map((d) => {
                            const hit = entry.wateringHistory?.includes(d.key) ?? false;
                            return (
                              <div
                                key={d.key}
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${
                                  hit
                                    ? "bg-emerald-400 text-emerald-900 font-bold"
                                    : "bg-emerald-700 text-emerald-200"
                                }`}
                                title={d.key}
                              >
                                {d.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {/* Link ke detail tanaman */}
                      <Link
                        href={`/tanaman/${entry.plantId}`}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                      >
                      Lihat Detail
                      </Link>

                      <button
                        onClick={() => handleWaterToday(entry.id)}
                        disabled={wateringLoadingId === entry.id}
                        className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          wateredToday
                            ? "bg-emerald-400 text-emerald-900 cursor-not-allowed"
                            : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                        }`}
                      >
                        {wateringLoadingId === entry.id
                          ? "Menyimpan..."
                          : wateredToday
                          ? "✓ Sudah disiram hari ini"
                          : "Tandai sudah disiram"}
                      </button>

                      <button
                        onClick={() => handleStop(entry.id, plantName)}
                        className="inline-flex items-center justify-center rounded-md bg-red-500/90 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
                      >
                        Berhenti menanam
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stop Planting Dialog */}
      <StopPlantingDialog
        isOpen={stopDialogData.isOpen}
        onClose={() => setStopDialogData({ isOpen: false, entryId: "", plantName: "" })}
        entryId={stopDialogData.entryId}
        plantName={stopDialogData.plantName}
        onSuccess={handleStopSuccess}
      />

      {/* Floating Chat Button */}
      <ChatButton context="Halaman My Garden - bantu user merawat tanaman yang sudah ditanam, tracking penyiraman, dan tips perawatan tanaman hias." />
    </main>
  );
}