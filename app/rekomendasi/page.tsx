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
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

// Garden summary (untuk notif belum disiram)
import { getGardenSummary } from "@/lib/garden";

// ⭐ Import wishlist helper
import { getWishlistCount } from "@/lib/wishlist";

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
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  // ⭐ NEW: Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ⭐ NEW: Confirmation dialog state
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>("");

  // 🔹 Cek status login Firebase - TIDAK redirect ke login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 🔹 Ambil ringkasan kebun DAN wishlist count
  useEffect(() => {
    if (!user) {
      // Set default nilai 0 jika tidak ada user login
      setGardenSummary({
        total: 0,
        unwateredToday: 0,
        overdue: 0
      });
      setWishlistCount(0);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // ✅ Ambil garden summary menggunakan helper function
        const summary = await getGardenSummary(user.uid);
        
        // 🔍 DEBUG: Log untuk check nilai
        console.log("🪴 Garden Summary:", summary);
        console.log("🪴 Total tanaman di garden:", summary.total);
        
        if (!cancelled) setGardenSummary(summary);

        // ✅ Ambil wishlist count menggunakan helper function
        const count = await getWishlistCount();
        
        // 🔍 DEBUG: Log untuk check nilai
        console.log("💖 Wishlist Count:", count);
        
        if (!cancelled) setWishlistCount(count);
        
      } catch (err) {
        console.error("Gagal mengambil data:", err);
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

  // 🔹 ⭐ Handle Tab Click - Show dialog jika belum login
  const handleTabClick = (href: string, requireAuth: boolean = false, actionName: string = "") => {
    if (requireAuth && !user) {
      // Jika butuh auth tapi user belum login, show dialog
      setPendingAction(actionName);
      setShowLoginDialog(true);
    } else {
      // Jika sudah login atau tidak butuh auth, langsung ke halaman
      handleNavigation(href);
    }
  };

  // 🔹 ⭐ Handle confirmation dari dialog
  const handleConfirmLogin = () => {
    setShowLoginDialog(false);
    router.push("/login");
  };

  const handleCancelLogin = () => {
    setShowLoginDialog(false);
    setPendingAction("");
  };

  // 🔹 ⭐ Handle Logout/Kembali
  const handleLogoutOrBack = async () => {
    if (user) {
      // Jika sudah login, lakukan logout
      try {
        setIsLoggingOut(true);
        await signOut(auth);
        router.push("/");
      } catch (error) {
        console.error("Error saat logout:", error);
        alert("Gagal logout. Silakan coba lagi.");
        setIsLoggingOut(false);
      }
    } else {
      // Jika belum login, kembali ke home
      router.push("/");
    }
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-800">
        <PageTransition show={true} />
      </main>
    );
  }

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
              {plants.length} plants
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
      <PageTransition show={isNavigating || isLoggingOut} />

      {/* ⭐ Login Confirmation Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Login Required
              </h3>
              <p className="text-gray-600 text-sm">
                Please login first to {pendingAction || "access this feature"}.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelLogin}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogin}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-[340px_1fr]">
        {/* SIDEBAR */}
        <aside className="bg-emerald-800 text-white p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={handleLogoutOrBack}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
                         bg-white/10 hover:bg-white/20 transition text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "Logging out..." : user ? "← Logout" : "← Back"}
            </button>

            {/* Welcome Message */}
            <div className="text-right">
              <p className="text-sm text-white">Welcome,</p>
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
            {/* ⭐ NAVIGATION TABS - CENTER ALIGNED dengan badge konsisten */}
            <nav className="flex flex-wrap items-center justify-center gap-3 mb-4">
              {/* All Plants - Selalu aktif di halaman ini */}
              <button
                onClick={() => handleTabClick("/rekomendasi", false)}
                className={`rounded-full border-2 px-5 py-2 font-semibold text-sm transition-all
                           shadow-sm hover:shadow-md ${activeClass}`}
              >
                All Plants
              </button>

              {/* My Garden - Fix path ke /riwayat-tanaman */}
              <button
                onClick={() => handleTabClick("/kebunku", true, "mengakses My Garden")}
                className={`rounded-full border-2 px-5 py-2 font-semibold text-sm transition-all
                           shadow-sm hover:shadow-md ${inactiveClass} inline-flex items-center gap-2`}
              >
                <span>My Garden</span>
                {user && (gardenSummary?.total ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full 
                                   bg-pink-500 text-white text-xs font-bold">
                    {gardenSummary?.total}
                  </span>
                )}
              </button>

              {/* Wishlist - Redirect ke login jika belum login */}
              <button
                onClick={() => handleTabClick("/wishlist", true, "mengakses Wishlist")}
                className={`rounded-full border-2 px-5 py-2 font-semibold text-sm transition-all
                           shadow-sm hover:shadow-md ${inactiveClass} inline-flex items-center gap-2`}
              >
                <span>Favorite</span>
                {user && wishlistCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full 
                                   bg-pink-500 text-white text-xs font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </nav>

            {/* SEARCH BAR */}
            <div className="flex items-center gap-2 mt-4">
              <input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Looking for Plants Here..."
                className="flex-1 h-12 px-5 rounded-full bg-white text-gray-900 ring-1 ring-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-gray-400 transition-all duration-300"
              />
            </div>
          </div>

          {/* ⭐ INFO FILTER STATUS */}
          {appliedHasFilter && !isGenerating && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fadeIn">
              <p className="text-sm text-emerald-800">
                Showing <span className="font-bold">{visiblePlants.length}</span> plants 
                that match your filter.
                {visiblePlants.length === 0 && (
                  <span className="block mt-2 text-amber-700">
                    ⚠️ No Plant match with your preferences. Try changing the filter!
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
                  ? "No Plant match with your preferences 😅"
                  : "No recommendations found."
                }
              </p>
              {appliedHasFilter && (
                <p className="text-gray-400 text-sm">
                  Try changing the filter or reset to see all plants.
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
        context="PlantMatch recommendation page - helping users choose and care for ornamental plants."
      />
    </main>
  );
}