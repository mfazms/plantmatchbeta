"use client";

import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { Plant, UserFilter } from "@/lib/types";
import { fetchPlants } from "@/lib/loadData";
import { 
  recommend, 
  groupPlantsByScore, 
  getGroupInfo,
  type ScoredPlant,
  type PlantGroup 
} from "@/lib/recommend";

import FiltersPanel from "@/components/FiltersPanel";
import PlantCard from "@/components/PlantCard";
import ExportPDFButton from "@/components/ExportPDFButton";
import ChatButton from "@/components/ChatButton";

// ⭐ NEW: Import loading components
import { 
  ButtonLoading, 
  PageTransition, 
  GenerateLoading,
  PlantCardSkeleton 
} from "@/components/LoadingAnimations";

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

  const [gardenSummary, setGardenSummary] = useState<GardenSummary | null>(null);

  // ⭐ NEW: Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

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

  // 🔹 Ambil ringkasan kebun
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

  // 🔹 Scroll effect
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

  // 🔹 ⭐ Enhanced Generate dengan loading animation
  const onGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate processing time untuk show animation (remove in production jika terlalu lama)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const next = recommend(all, filter);
    setScored(next);
    setAppliedHasFilter(hasCurrentFilter);
    setSelected([]);
    
    setIsGenerating(false);
    
    // Smooth scroll ke hasil
    setTimeout(() => {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }, 100);
  };

  // 🔹 Search input
  const onSearchChange = (val: string) => setQuery(val);

  // 🔹 ⭐ FILTERING LOGIC - hanya tampilkan tanaman yang COCOK (score > 0)
  const baseList = useMemo(() => {
    if (!appliedHasFilter) {
      // Tidak ada filter → tampilkan semua
      return scored;
    }
    
    // Ada filter → HANYA tampilkan yang skor > 0
    return scored.filter((p) => (p.normalizedScore ?? 0) > 0);
  }, [scored, appliedHasFilter]);

  // 🔹 Search engine (Fuse.js)
  const fuse = useMemo(
    () =>
      new Fuse<ScoredPlant>(baseList, {
        includeScore: false,
        threshold: 0.3,
        keys: ["latin", "common", "category", "climate", "use"],
      }),
    [baseList]
  );

  // 🔹 Hasil akhir yang ditampilkan (setelah search)
  const visiblePlants = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return baseList;

    const results = fuse.search(trimmed);
    const ids = new Set(results.map((r) => r.item.id));

    return baseList.filter((p) => ids.has(p.id));
  }, [baseList, fuse, query]);

  // 🔹 ⭐ GROUP RESULTS by score percentage
  const groupedResults = useMemo(() => {
    if (!appliedHasFilter) {
      return { all: visiblePlants };
    }

    return groupPlantsByScore(visiblePlants);
  }, [visiblePlants, appliedHasFilter]);

  // 🔹 Pilih tanaman (checkbox)
  const toggleSelect = (id: number) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  const selectedPlants = visiblePlants.filter((p) => selected.includes(p.id));

  // 🔹 Alert count
  const alertCount =
    (gardenSummary?.overdue ?? 0) + (gardenSummary?.unwateredToday ?? 0);

  // 🔹 Get username
  const getUserName = () => {
    if (!user) return "Tamu";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "Pengguna";
  };

  // 🔹 ⭐ Handle navigation dengan loading
  const handleNavigation = (href: string) => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push(href);
    }, 300);
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-800">
        <PageTransition show={true} />
      </main>
    );
  }

  if (!user) return null;

  // Style aktif untuk tab
  const activeClass = "bg-emerald-600 text-white border-emerald-600";
  const inactiveClass =
    "border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition";

  // Helper: Render group section
  const renderGroup = (
    groupKey: keyof PlantGroup,
    plants: ScoredPlant[],
    startRank: number
  ) => {
    if (plants.length === 0) return null;

    const info = getGroupInfo(groupKey);
    
    return (
      <section className="mb-10 animate-fadeIn" key={groupKey}>
        <div className="mb-5 pb-3 border-b-2 border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{info.emoji}</span>
            <h2 className={`text-2xl font-bold text-${info.color}-700`}>
              {info.label} ({info.range})
            </h2>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {plants.length} tanaman
            </span>
          </div>
          <p className="text-gray-600 text-sm">{info.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {plants.map((plant, idx) => {
            const rank = startRank + idx;
            
            return (
              <div
                key={plant.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <PlantCard
                  plant={plant}
                  selected={selected.includes(plant.id)}
                  onToggleSelect={toggleSelect}
                  rank={rank}
                  showScore={true}
                />
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ⭐ Page transition overlay */}
      <PageTransition show={isNavigating} />

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

            {/* Welcome Message */}
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

          {/* ⭐ Enhanced Generate Button dengan loading */}
          <div className="mt-6">
            <ButtonLoading
              loading={isGenerating}
              onClick={onGenerate}
              className="w-full rounded-full px-6 py-3 bg-white text-emerald-800 font-bold
                       hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isGenerating ? "Memproses..." : "Generate"}
            </ButtonLoading>
          </div>

          <div className="mt-4">
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
            {/* NAVIGATION TABS */}
            <div className="flex justify-center gap-4 mb-4">
              <Link
                href="/rekomendasi"
                className={`px-4 py-2 rounded-full border-2 font-semibold transition-all duration-300 ${
                  pathname === "/rekomendasi" ? activeClass : inactiveClass
                }`}
              >
                All Plants
              </Link>

              {/* ⭐ My Garden button dengan loading */}
              <button
                onClick={() => handleNavigation("/kebunku")}
                className={`px-4 py-2 rounded-full border-2 font-semibold transition-all duration-300 ${
                  pathname === "/kebunku" ? activeClass : inactiveClass
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span>My Garden</span>
                  {alertCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </span>
              </button>
            </div>

            {/* SEARCH BAR */}
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari tanaman..."
                className="flex-1 h-12 px-5 rounded-full bg-white text-gray-900 ring-1 ring-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-gray-400 transition-all duration-300"
              />
            </div>
          </div>

          {/* ⭐ INFO FILTER STATUS */}
          {appliedHasFilter && !isGenerating && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fadeIn">
              <p className="text-sm text-emerald-800">
                🎯 Menampilkan <span className="font-bold">{visiblePlants.length}</span> tanaman 
                yang cocok dengan filter kamu.
                {visiblePlants.length === 0 && (
                  <span className="block mt-2 text-amber-700">
                    ⚠️ Tidak ada tanaman yang cocok. Coba ubah filter!
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ⭐ LOADING STATE saat generate */}
          {isGenerating ? (
            <GenerateLoading />
          ) : visiblePlants.length === 0 ? (
            <div className="text-center py-16 animate-fadeIn">
              <p className="text-gray-500 text-lg mb-2">
                {appliedHasFilter 
                  ? "Tidak ada tanaman yang cocok dengan filter kamu 😅"
                  : "Tidak ada hasil rekomendasi."
                }
              </p>
              {appliedHasFilter && (
                <p className="text-gray-400 text-sm">
                  Coba ubah filter atau reset untuk melihat semua tanaman.
                </p>
              )}
            </div>
          ) : appliedHasFilter ? (
            // ⭐ GROUPED RESULTS (dengan filter aktif)
            <div className="space-y-10">
              {/* Perfect Match */}
              {renderGroup(
                "perfect", 
                (groupedResults as PlantGroup).perfect,
                0
              )}

              {/* Great Match */}
              {renderGroup(
                "great",
                (groupedResults as PlantGroup).great,
                (groupedResults as PlantGroup).perfect.length
              )}

              {/* Good Match */}
              {renderGroup(
                "good",
                (groupedResults as PlantGroup).good,
                (groupedResults as PlantGroup).perfect.length + 
                (groupedResults as PlantGroup).great.length
              )}

              {/* Acceptable Match */}
              {renderGroup(
                "acceptable",
                (groupedResults as PlantGroup).acceptable,
                (groupedResults as PlantGroup).perfect.length + 
                (groupedResults as PlantGroup).great.length +
                (groupedResults as PlantGroup).good.length
              )}
            </div>
          ) : (
            // 📋 NORMAL GRID (tanpa filter)
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visiblePlants.map((plant, idx) => (
                <div
                  key={plant.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <PlantCard
                    plant={plant}
                    selected={selected.includes(plant.id)}
                    onToggleSelect={toggleSelect}
                    showScore={false}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Floating Chat Button */}
      <ChatButton
        context="Halaman rekomendasi PlantMatch - bantu user memilih dan merawat tanaman hias."
      />
    </main>
  );
}