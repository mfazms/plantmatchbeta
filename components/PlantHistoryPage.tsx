"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { getPlantHistory, clearPlantHistory, PlantHistoryEntry } from "@/lib/garden";
import Link from "next/link";
import { fetchPlants } from "@/lib/loadData";
import type { Plant } from "@/lib/types";

export default function PlantHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<PlantHistoryEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "died" | "notSuitable">("all");

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
        const [historyData, plantsData] = await Promise.all([
          getPlantHistory(user.uid),
          fetchPlants(),
        ]);
        
        setHistory(historyData);
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
      setHistory([]);
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
    if (!startDate || !endDate) return "0 hari";
    
    let start: Date, end: Date;
    
    // Parse start date
    if (startDate instanceof Date) {
      start = startDate;
    } else if (typeof startDate === "string") {
      start = new Date(startDate);
    } else if (startDate?.toDate) {
      start = startDate.toDate();
    } else {
      return "0 hari";
    }

    // Parse end date
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

  // ⭐ TAMBAHAN BARU: Fungsi untuk mendapatkan nama user
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
          <p className="mb-4">Silakan login dulu untuk melihat history tanamanmu.</p>
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
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-emerald-800/80 px-2 py-2 text-sm font-medium gap-2">
            <Link
              href="/rekomendasi"
              className="px-4 py-1 rounded-full hover:bg-emerald-700 transition"
            >
              All Plants
            </Link>
            <Link
              href="/kebunku"
              className="px-4 py-1 rounded-full hover:bg-emerald-700 transition"
            >
              My Garden
            </Link>
            <button className="px-4 py-1 bg-white text-emerald-800 rounded-full">
              History
            </button>
          </div>
        </div>

        {/* ⭐ UBAH DISINI: Tambahkan nama user */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          📚 Riwayat Tanaman {getUserName()}
        </h1>
        <p className="text-center text-emerald-200 mb-8">
          Semua tanaman yang pernah kamu tanam
        </p>

        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-emerald-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{history.length}</div>
              <div className="text-sm text-emerald-200">Total Tanaman</div>
            </div>
            <div className="bg-emerald-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {history.filter((h) => h.reason === "died").length}
              </div>
              <div className="text-sm text-emerald-200">Tanaman Mati</div>
            </div>
            <div className="bg-emerald-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {history.filter((h) => h.reason === "notSuitable").length}
              </div>
              <div className="text-sm text-emerald-200">Tidak Cocok</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {history.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
              }`}
            >
              Semua ({history.length})
            </button>
            <button
              onClick={() => setActiveTab("died")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "died"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
              }`}
            >
              Mati ({history.filter((h) => h.reason === "died").length})
            </button>
            <button
              onClick={() => setActiveTab("notSuitable")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "notSuitable"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700"
              }`}
            >
              Tidak Cocok ({history.filter((h) => h.reason === "notSuitable").length})
            </button>
          </div>
        )}

        {/* Clear History Button */}
        {history.length > 0 && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg font-semibold transition"
            >
              🗑️ Hapus Semua History
            </button>
          </div>
        )}

        {/* History List */}
        {loading ? (
          <p className="text-center text-emerald-200">Loading history...</p>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center bg-emerald-800/30 rounded-lg p-8">
            <p className="text-emerald-200 mb-4">
              {activeTab === "all"
                ? "Belum ada history tanaman. Mulai menanam tanaman pertamamu!"
                : activeTab === "died"
                ? "Tidak ada tanaman yang mati. Kamu hebat! 🌟"
                : "Tidak ada tanaman yang tidak cocok. Good job! ✨"}
            </p>
            {activeTab === "all" && (
              <Link
                href="/rekomendasi"
                className="inline-block px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition"
              >
                Lihat Rekomendasi Tanaman
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredHistory.map((item) => {
              const plant = getPlantDetails(item.plantId);
              
              return (
                <div
                  key={item.id}
                  className="bg-emerald-800/50 rounded-xl p-4 hover:bg-emerald-800/60 transition group"
                >
                  <div className="flex gap-4">
                    {/* Image - Clickable */}
                    <Link 
                      href={`/tanaman/${item.plantId}`}
                      className="w-24 h-24 rounded-lg bg-white/10 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-emerald-400 transition"
                    >
                      {item.image || plant?.image ? (
                        <img
                          src={item.image || plant?.image || ""}
                          alt={item.plantName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-300">
                          🌿
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1">
                      {/* Plant Name - Clickable */}
                      <Link 
                        href={`/tanaman/${item.plantId}`}
                        className="block hover:text-emerald-200 transition"
                      >
                        <h3 className="font-semibold text-lg">
                          {item.plantName}
                        </h3>
                        <p className="text-sm text-emerald-200 italic">
                          {plant?.latin || "Nama latin tidak diketahui"}
                        </p>
                      </Link>

                      <div className="mt-2 text-xs text-emerald-100 space-y-1">
                        <p>
                          <span className="font-semibold">Ditanam:</span>{" "}
                          {formatDate(item.plantedAt)}
                        </p>
                        <p>
                          <span className="font-semibold">Dihentikan:</span>{" "}
                          {formatDate(item.stoppedAt)}
                        </p>
                        <p>
                          <span className="font-semibold">Durasi:</span>{" "}
                          {getDuration(item.plantedAt, item.stoppedAt)}
                        </p>
                        <p>
                          <span className="font-semibold">Alasan:</span>{" "}
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              item.reason === "died"
                                ? "bg-red-500/30 text-red-200"
                                : "bg-amber-500/30 text-amber-200"
                            }`}
                          >
                            {item.reason === "died" ? "😢 Tanaman mati" : "🤔 Tidak cocok"}
                          </span>
                        </p>
                        {/* PERBAIKAN: Tampilkan total penyiraman bahkan jika 0 */}
                        <p>
                          <span className="font-semibold">Total penyiraman:</span>{" "}
                          {item.totalWateringDays !== undefined ? item.totalWateringDays : 0} hari
                        </p>
                      </div>

                      {/* Link to Detail */}
                      <Link
                        href={`/tanaman/${item.plantId}`}
                        className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-300 hover:text-emerald-200 font-semibold transition"
                      >
                        📖 Lihat Detail Tanaman
                        <svg 
                          className="w-3 h-3 transition-transform group-hover:translate-x-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 5l7 7-7 7" 
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clear Confirmation Dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Hapus Semua History? 🗑️
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Semua riwayat tanaman akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleClearHistory}
                  disabled={clearing}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
                >
                  {clearing ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}