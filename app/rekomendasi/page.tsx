"use client";

import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { Plant, UserFilter } from "@/lib/types";
import { fetchPlants } from "@/lib/loadData";
import { recommend, type ScoredPlant } from "@/lib/recommend";

import FiltersPanel from "@/components/FiltersPanel";
import PlantCard from "@/components/PlantCard";
import ExportPDFButton from "@/components/ExportPDFButton";
import ChatButton from "@/components/ChatButton";

// Firebase
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

// Garden summary (untuk notif belum disiram)
import { getGardenSummary } from "@/lib/garden";

type GardenSummary = {
  total: number;
  unwateredToday: number;
  overdue: number;
};

export default function RekomendasiPage() {
  const [all, setAll] = useState<Plant[]>([]);
  const [scored, setScored] = useState<ScoredPlant[]>([]);
  const [filter, setFilter] = useState<UserFilter>({});
  const [appliedHasFilter, setAppliedHasFilter] = useState(false);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [gardenSummary, setGardenSummary] = useState<GardenSummary | null>(
    null
  );

  // 🔹 Cek status login Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // 🔹 Kalau sudah tahu user → ambil ringkasan kebun (buat notif belum disiram)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const summary = await getGardenSummary(user.uid);
        if (!cancelled) setGardenSummary(summary);
      } catch (err) {
        console.error("Gagal mengambil ringkasan kebun:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // 🔹 Ambil data tanaman & inisialisasi skor (tanpa filter)
  useEffect(() => {
    fetchPlants().then((data) => {
      setAll(data);
      const initial = recommend(data, {});
      setScored(initial);
      setAppliedHasFilter(false);
    });
  }, []);

  // 🔹 Scroll blur / shadow effect utk header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ➕ Helper: apakah filter saat ini diisi?
  const hasCurrentFilter = !!(
    filter.light ||
    filter.climate ||
    filter.aesthetic ||
    filter.watering ||
    filter.mbti
  );

  // 🔹 Generate rekomendasi tanaman (apply filter sekarang)
  const onGenerate = () => {
    const next = recommend(all, filter);
    setScored(next);
    setAppliedHasFilter(hasCurrentFilter);
    setSelected([]);
  };

  // 🔹 Search input
  const onSearchChange = (val: string) => setQuery(val);

  // 🔹 Basis list untuk ditampilkan:
  //     - Kalau filter sudah diaplikasikan → hanya yang skor-nya > 0
  //     - Kalau belum → semua hasil recommend
  const baseList = useMemo(() => {
    if (!appliedHasFilter) return scored;
    return scored.filter((p) => (p.normalizedScore ?? 0) > 0);
  }, [scored, appliedHasFilter]);

  // 🔹 Search engine (Fuse.js) di atas baseList
  const fuse = useMemo(
    () =>
      new Fuse<ScoredPlant>(baseList, {
        includeScore: false,
        threshold: 0.3,
        keys: ["latin", "common", "category", "climate", "use"],
      }),
    [baseList]
  );

  // 🔹 Hasil akhir yang benar-benar ditampilkan (baseList + search)
  const visiblePlants = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return baseList;

    const results = fuse.search(trimmed);
    const ids = new Set(results.map((r) => r.item.id));

    // Pertahankan urutan baseList, tapi hanya yg match search
    return baseList.filter((p) => ids.has(p.id));
  }, [baseList, fuse, query]);

  // 🔹 Pilih tanaman (checkbox)
  const toggleSelect = (id: number) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  const selectedPlants = visiblePlants.filter((p) => selected.includes(p.id));

  // 🔹 Top 10 hanya kalau filter sudah diaplikasikan
  const top10Ids = useMemo(() => {
    if (!appliedHasFilter) return [];
    return visiblePlants
      .filter((p) => typeof p.normalizedScore === "number")
      .slice()
      .sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0))
      .slice(0, 10)
      .map((p) => p.id);
  }, [visiblePlants, appliedHasFilter]);

  const getRank = (id: number) => top10Ids.indexOf(id);

  // 🔹 Hitung jumlah alert siraman (overdue + belum disiram hari ini)
  const alertCount =
    (gardenSummary?.overdue ?? 0) + (gardenSummary?.unwateredToday ?? 0);

  // 🔹 Dapatkan nama user dari Firebase Auth
  const getUserName = () => {
    if (!user) return "Tamu";
    
    // Prioritas: displayName > email username > "Pengguna"
    if (user.displayName) {
      return user.displayName;
    }
    
    if (user.email) {
      // Ambil bagian sebelum @ dari email
      return user.email.split("@")[0];
    }
    
    return "Pengguna";
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-800">
        <p className="text-lg font-medium">Memuat...</p>
      </main>
    );
  }

  if (!user) return null;

  // Style aktif untuk tab
  const activeClass = "bg-emerald-600 text-white border-emerald-600";
  const inactiveClass =
    "border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition";

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-[340px_1fr]">
        {/* SIDEBAR */}
        <aside className="bg-emerald-800 text-white p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
                         bg-white/10 hover:bg-white/20 transition text-sm font-medium"
            >
              ← Logout
            </Link>

            {/* Welcome Message dengan nama user */}
            <div className="text-right">
              <p className="text-sm text-white">Selamat datang,</p>
              <p className="text-lg font-bold text-white truncate max-w-[160px]" title={getUserName()}>
                {getUserName()}
              </p>
            </div>
          </div>

          <FiltersPanel
            filter={filter}
            onChange={setFilter}
            onGenerate={onGenerate}
            allPlants={all}
          />

          <div className="mt-6">
            <ExportPDFButton
              plants={selectedPlants}
              disabled={selectedPlants.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2
                         bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm
                         disabled:opacity-50"
              label="Export PDF"
            />
          </div>
        </aside>

        {/* KONTEN UTAMA */}
        <section className="relative p-6 md:p-8">
          <div
            className={`sticky top-4 z-50 rounded-2xl px-5 py-4 mb-6 ring-1 ring-emerald-100 backdrop-blur-md bg-white/90 transition-shadow ${
              scrolled ? "shadow-md" : "shadow-sm"
            }`}
          >
            {/* 🔹 NAVIGATION TABS */}
            <div className="flex justify-center gap-4 mb-4">
              <Link
                href="/rekomendasi"
                className={`px-4 py-2 rounded-full border-2 font-semibold ${
                  pathname === "/rekomendasi" ? activeClass : inactiveClass
                }`}
              >
                All Plants
              </Link>

              <Link
                href="/kebunku"
                className={`px-4 py-2 rounded-full border-2 font-semibold ${
                  pathname === "/kebunku" ? activeClass : inactiveClass
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span>My Garden</span>
                  {alertCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
                      {alertCount}
                    </span>
                  )}
                </span>
              </Link>
            </div>

            {/* 🔍 SEARCH BAR */}
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari tanaman..."
                className="flex-1 h-12 px-5 rounded-full bg-white text-gray-900 ring-1 ring-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* 🔹 HASIL REKOMENDASI */}
          {visiblePlants.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Tidak ada hasil rekomendasi.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visiblePlants.map((plant) => {
                const rank = getRank(plant.id);
                const isTop10 = appliedHasFilter && rank !== -1;

                return (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    selected={selected.includes(plant.id)}
                    onToggleSelect={toggleSelect}
                    rank={isTop10 ? rank : undefined}
                    showScore={isTop10}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 🔹 Floating Chat Button */}
      <ChatButton
        context="Halaman rekomendasi PlantMatch - bantu user memilih dan merawat tanaman hias."
      />
    </main>
  );
}