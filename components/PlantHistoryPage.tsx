"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { 
  getPlantHistory, 
  clearPlantHistory, 
  PlantHistoryEntry,
  getUserGarden
} from "@/lib/garden";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPlants } from "@/lib/loadData";
import type { Plant } from "@/lib/types";
import ChatButton from "@/components/ChatButton";

import NavigationTabs from "./NavigationTabs";
import AnimatedCard, { AnimatedButton } from "./AnimatedCard";

type CombinedPlantEntry = {
  id: string;
  plantId: number;
  plantName: string;
  plantLatin?: string;
  image?: string;
  plantedAt: any;
  stoppedAt: any;
  reason?: "active" | "died" | "notSuitable";
  totalWateringDays?: number;
  isActive: boolean;
  userId?: string;
};

export default function PlantHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<CombinedPlantEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "died" | "notSuitable">("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [historyData, activePlantsData, plantsData] = await Promise.all([
          getPlantHistory(user.uid),
          getUserGarden(user.uid),
          fetchPlants(),
        ]);
        
        const combinedHistory: CombinedPlantEntry[] = [
          ...activePlantsData.map(plant => ({
            id: plant.id,
            plantId: plant.plantId,
            plantName: plant.plantName,
            plantLatin: (plant as any).plantLatin || undefined,
            image: plant.image,
            plantedAt: plant.plantedAt,
            stoppedAt: null,
            reason: "active" as const,
            totalWateringDays: (plant as any).totalWateringDays || 0,
            isActive: true,
            userId: user.uid,
          })),
          ...historyData.map(h => ({
            id: h.id,
            plantId: h.plantId,
            plantName: h.plantName,
            plantLatin: (h as any).plantLatin || undefined,
            image: (h as any).image,
            plantedAt: h.plantedAt,
            stoppedAt: h.stoppedAt,
            reason: h.reason,
            totalWateringDays: h.totalWateringDays,
            isActive: false,
            userId: h.userId,
          })),
        ];
        
        setHistory(combinedHistory);
        setPlants(plantsData);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  const handleClearHistory = async () => {
    if (!user) return;

    setClearing(true);
    try {
      await clearPlantHistory(user.uid);
      setHistory(history.filter(h => h.isActive));
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Error clearing history:", error);
      alert("Gagal menghapus history. Coba lagi ya!");
    } finally {
      setClearing(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return item.isActive === true;
    return item.reason === activeTab;
  });

  const getPlantDetails = (plantId: number) => {
    return plants.find((p) => p.id === plantId);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === "string") {
      d = new Date(date);
    } else if (date?.toDate) {
      d = date.toDate();
    } else {
      return "-";
    }

    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDuration = (startDate: any, endDate: any) => {
    if (!startDate) return "0 hari";
    if (!endDate) {
      const now = new Date();
      let start: Date;
      
      if (startDate instanceof Date) {
        start = startDate;
      } else if (typeof startDate === "string") {
        start = new Date(startDate);
      } else if (startDate?.toDate) {
        start = startDate.toDate();
      } else {
        return "0 hari";
      }

      const diff = now.getTime() - start.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return "< 1 hari";
      if (days === 1) return "1 hari";
      return `${days} hari`;
    }
    
    let start: Date, end: Date;
    
    if (startDate instanceof Date) {
      start = startDate;
    } else if (typeof startDate === "string") {
      start = new Date(startDate);
    } else if (startDate?.toDate) {
      start = startDate.toDate();
    } else {
      return "0 hari";
    }

    if (endDate instanceof Date) {
      end = endDate;
    } else if (typeof endDate === "string") {
      end = new Date(endDate);
    } else if (endDate?.toDate) {
      end = endDate.toDate();
    } else {
      return "0 hari";
    }

    const diff = end.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "< 1 hari";
    if (days === 1) return "1 hari";
    return `${days} hari`;
  };

  const getUserName = () => {
    if (!user) return "Tamu";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "Pengguna";
  };

  const stats = {
    total: history.length,
    active: history.filter(h => h.isActive).length,
    died: history.filter(h => h.reason === "died").length,
    notSuitable: history.filter(h => h.reason === "notSuitable").length,
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-emerald-900 text-white flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <p className="mb-4">Silakan login dulu untuk melihat history tanamanmu.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition hover:scale-105 active:scale-95"
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
          <NavigationTabs 
            tabs={[
              { label: "All Plants", href: "/rekomendasi" },
              { label: "My Garden", href: "/kebunku" },
              { label: "History", href: "/riwayat-tanaman" }
            ]}
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 animate-fadeIn">
          📚 Riwayat Tanaman {getUserName()}
        </h1>
        <p className="text-center text-emerald-200 mb-8 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          Semua tanaman yang pernah kamu tanam
        </p>

        {history.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <AnimatedCard 
              delay={0}
              className="bg-emerald-800/50 rounded-lg p-4 text-center hover:bg-emerald-800/60"
            >
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-emerald-200">Total</div>
            </AnimatedCard>
            
            <AnimatedCard 
              delay={50}
              className="bg-green-600/30 rounded-lg p-4 text-center hover:bg-green-600/40"
            >
              <div className="text-2xl font-bold text-green-300">{stats.active}</div>
              <div className="text-sm text-emerald-200">Aktif</div>
            </AnimatedCard>
            
            <AnimatedCard 
              delay={100}
              className="bg-red-600/30 rounded-lg p-4 text-center hover:bg-red-600/40"
            >
              <div className="text-2xl font-bold text-red-300">{stats.died}</div>
              <div className="text-sm text-emerald-200">Mati</div>
            </AnimatedCard>

            <AnimatedCard 
              delay={150}
              className="bg-amber-600/30 rounded-lg p-4 text-center hover:bg-amber-600/40"
            >
              <div className="text-2xl font-bold text-amber-300">{stats.notSuitable}</div>
              <div className="text-sm text-emerald-200">Tidak Cocok</div>
            </AnimatedCard>
          </div>
        )}

        {history.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                activeTab === "all"
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
              }`}
            >
              Semua ({stats.total})
            </button>
            
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                activeTab === "active"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
              }`}
            >
              🌱 Aktif ({stats.active})
            </button>
            
            <button
              onClick={() => setActiveTab("died")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                activeTab === "died"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
              }`}
            >
              💀 Mati ({stats.died})
            </button>
            
            <button
              onClick={() => setActiveTab("notSuitable")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                activeTab === "notSuitable"
                  ? "bg-amber-600 text-white shadow-lg"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
              }`}
            >
              🤔 Tidak Cocok ({stats.notSuitable})
            </button>
          </div>
        )}

        {history.some(h => !h.isActive) && (
          <div className="flex justify-end mb-6 animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <AnimatedButton
              onClick={() => setShowClearConfirm(true)}
              variant="danger"
              className="px-4 py-2"
            >
              🗑️ Hapus Semua History
            </AnimatedButton>
          </div>
        )}

        {loading ? (
          <div className="text-center text-emerald-200 py-12">
            <div className="inline-flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p>Loading history...</p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center bg-emerald-800/30 rounded-lg p-8 animate-fadeIn">
            <p className="text-emerald-200 mb-4">
              {activeTab === "all"
                ? "Belum ada history tanaman. Mulai menanam tanaman pertamamu!"
                : activeTab === "active"
                ? "Tidak ada tanaman yang aktif saat ini. Mulai menanam yuk!"
                : activeTab === "died"
                ? "Tidak ada tanaman yang mati. Kamu hebat! 🌟"
                : "Tidak ada tanaman yang tidak cocok. Good job! ✨"}
            </p>
            {(activeTab === "all" || activeTab === "active") && (
              <Link
                href="/rekomendasi"
                className="inline-block px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition hover:scale-105 active:scale-95"
              >
                Lihat Rekomendasi Tanaman
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredHistory.map((item, idx) => {
              const plant = getPlantDetails(item.plantId);
              
              return (
                <AnimatedCard
                  key={item.id}
                  delay={idx * 50}
                  className={`rounded-xl p-4 transition-all duration-300 group ${
                    item.isActive 
                      ? "bg-green-600/20 hover:bg-green-600/30 border-2 border-green-500/30" 
                      : "bg-emerald-800/50 hover:bg-emerald-800/60"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* ⭐ RESPONSIVE IMAGE FIX - Flexible container for different aspect ratios */}
                    <Link 
                      href={`/tanaman/${item.plantId}`}
                      className="w-32 min-h-[8rem] rounded-lg bg-white/10 flex-shrink-0 hover:ring-2 hover:ring-emerald-400 transition-all duration-300 p-3 flex items-center justify-center"
                    >
                      {item.image || plant?.image ? (
                        <img
                          src={item.image || plant?.image || ""}
                          alt={item.plantName}
                          className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-300 text-2xl">
                          🌿
                        </div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <Link 
                        href={`/tanaman/${item.plantId}`}
                        className="block hover:text-emerald-200 transition"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {item.plantName}
                          </h3>
                          {item.isActive && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold animate-pulse">
                              ✓ Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-emerald-200 italic">
                          {item.plantLatin || plant?.latin || "Nama latin tidak diketahui"}
                        </p>
                      </Link>

                      <div className="mt-2 text-xs text-emerald-100 space-y-1">
                        <p>
                          <span className="font-semibold">Ditanam:</span>{" "}
                          {formatDate(item.plantedAt)}
                        </p>
                        
                        {!item.isActive && item.stoppedAt && (
                          <p>
                            <span className="font-semibold">Dihentikan:</span>{" "}
                            {formatDate(item.stoppedAt)}
                          </p>
                        )}
                        
                        <p>
                          <span className="font-semibold">Durasi:</span>{" "}
                          {getDuration(item.plantedAt, item.stoppedAt)}
                          {item.isActive && " (berlangsung)"}
                        </p>
                        
                        <p>
                          <span className="font-semibold">Status:</span>{" "}
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              item.isActive
                                ? "bg-green-500/30 text-green-200"
                                : item.reason === "died"
                                ? "bg-red-500/30 text-red-200"
                                : "bg-amber-500/30 text-amber-200"
                            }`}
                          >
                            {item.isActive 
                              ? "🌱 Masih dipelihara" 
                              : item.reason === "died" 
                              ? "😢 Tanaman mati" 
                              : "🤔 Tidak cocok"}
                          </span>
                        </p>
                        
                        <p>
                          <span className="font-semibold">Total penyiraman:</span>{" "}
                          {item.totalWateringDays || 0} hari
                        </p>
                      </div>

                      <Link
                        href={`/tanaman/${item.plantId}`}
                        className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-300 hover:text-emerald-200 font-semibold transition-all duration-200 hover:gap-2"
                      >
                        📖 Lihat Detail Tanaman
                        <svg 
                          className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        )}

        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slideUp">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Hapus Semua History? 🗑️
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Semua riwayat tanaman yang sudah selesai akan dihapus permanen. 
                Tanaman yang masih aktif tidak akan terhapus.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                  Batal
                </button>
                <AnimatedButton
                  onClick={handleClearHistory}
                  loading={clearing}
                  variant="danger"
                  className="flex-1"
                >
                  {clearing ? "Menghapus..." : "Ya, Hapus"}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ⭐ Floating Chat Button - PRESERVED FROM ORIGINAL */}
      <ChatButton context="Halaman My Garden - bantu user merawat tanaman yang sudah ditanam, tracking penyiraman, dan tips perawatan tanaman hias." />
      
    </main>
  );
}