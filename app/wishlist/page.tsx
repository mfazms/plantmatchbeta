"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebaseConfig";
import {
  getWishlist,
  removeFromWishlist,
  removeMultipleFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";
import { getGardenSummary } from "@/lib/garden";
import PlantImage from "@/components/PlantImage";
import NavigationTabs from "@/components/NavigationTabs";
import ChatButton from "@/components/ChatButton";
import ExportPDFButton from "@/components/ExportPDFButton";

type GardenSummary = {
  total: number;
  unwateredToday: number;
  overdue: number;
};

export default function WishlistPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [query, setQuery] = useState("");
  
  // ⭐ NEW: Garden summary untuk alert count
  const [gardenSummary, setGardenSummary] = useState<GardenSummary | null>(null);

  // 🔐 Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // ⭐ NEW: Load garden summary untuk badge count
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

  // 🔥 Load wishlist
  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    setLoading(true);
    const items = await getWishlist();
    setWishlist(items);
    setLoading(false);
  };

  // 🧠 Nama tampilan user
  const getUserName = () => {
    if (!user) return "Tamu";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "Pengguna";
  };

  // ⭐ Alert count untuk My Garden
  const alertCount =
    (gardenSummary?.overdue ?? 0) + (gardenSummary?.unwateredToday ?? 0);

  // 🔍 Filter by search query
  const filteredWishlist = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wishlist;

    return wishlist.filter((item) => {
      const plantName = Array.isArray(item.plantData.common)
        ? item.plantData.common[1] ||
          item.plantData.common[0] ||
          item.plantData.latin
        : (item.plantData.common as string) || item.plantData.latin;

      const haystack = `${plantName} ${item.plantData.latin}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [wishlist, query]);

  // 🌿 Tanaman yang sedang terpilih (buat ExportPDFButton)
  const selectedPlants = useMemo(
    () =>
      wishlist
        .filter((item) => selectedItems.has(item.plantId))
        .map((item) => item.plantData),
    [wishlist, selectedItems]
  );

  // ✅ Toggle select
  const toggleSelect = (plantId: number) => {
    const next = new Set(selectedItems);
    if (next.has(plantId)) next.delete(plantId);
    else next.add(plantId);
    setSelectedItems(next);
  };

  const selectAll = () => {
    const allIds = new Set(filteredWishlist.map((item) => item.plantId));
    setSelectedItems(allIds);
  };

  const deselectAll = () => setSelectedItems(new Set());

  // 🗑️ Remove multiple
  const removeSelected = async () => {
    if (selectedItems.size === 0) {
      alert("Pilih tanaman yang ingin dihapus");
      return;
    }

    if (!confirm(`Hapus ${selectedItems.size} tanaman dari favorite?`)) return;

    const ok = await removeMultipleFromWishlist(Array.from(selectedItems));
    if (ok) {
      alert("Berhasil menghapus dari favorite");
      setSelectedItems(new Set());
      setSelectMode(false);
      loadWishlist();
    }
  };

  // 🗑️ Remove single
  const removeSingle = async (plantId: number) => {
    if (!confirm("Hapus tanaman ini dari favorite?")) return;

    const ok = await removeFromWishlist(plantId);
    if (ok) {
      alert("Dihapus dari favorite");
      loadWishlist();
    }
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-700 font-semibold">
            Memuat favorite...
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 pb-10">
        {/* 📍 Sticky header: title + tabs + search */}
        <header className="sticky top-0 z-30 pt-4 pb-3 bg-gradient-to-b from-white via-white/95 to-transparent">
          <div className="rounded-2xl px-5 py-4 shadow-sm ring-1 ring-emerald-100 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-3">
              {/* Title + user */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-800 flex items-center gap-2">
                    <span>{getUserName()}'s Favorite</span>
                  </h1>
                  <p className="text-sm text-gray-600">
                    {wishlist.length} tanaman ditandai favorit
                  </p>
                </div>
              </div>

              {/* ⭐ Navigation tabs dengan alertCount */}
              <NavigationTabs alertCount={alertCount} />

              {/* Search bar */}
              <div className="mt-3 flex items-center gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari tanaman di favorite..."
                  className="flex-1 h-11 px-5 rounded-full bg-white text-gray-900 ring-1 ring-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>
          </div>
        </header>

        {/* 🔧 Action bar */}
        <section className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              setSelectMode((v) => !v);
              setSelectedItems(new Set());
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm
              ${
                selectMode
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
          >
            {selectMode ? "✓ Select Mode" : "Select Multiple"}
          </button>

          {selectMode && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-xs md:text-sm text-gray-600">
                {selectedItems.size} selected
              </span>

              <button
                onClick={selectAll}
                className="px-4 py-2 text-xs md:text-sm rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 text-xs md:text-sm rounded-full bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              >
                Deselect All
              </button>

              {/* 📄 Export PDF pakai komponen ExportPDFButton */}
              <ExportPDFButton
                plants={selectedPlants}
                disabled={selectedPlants.length === 0}
                className="px-4 py-2 text-xs md:text-sm rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                label="Export PDF"
                icon
              />

              <button
                onClick={removeSelected}
                disabled={selectedItems.size === 0}
                className="px-4 py-2 text-xs md:text-sm rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Remove ({selectedItems.size})
              </button>
            </div>
          )}
        </section>

        {/* 📦 Content */}
        <section className="mt-6">
          {filteredWishlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {query.trim() ? "Tidak ada hasil pencarian" : "Wishlist masih kosong"}
              </h2>
              <p className="text-gray-600 mb-6">
                {query.trim() 
                  ? "Coba kata kunci lain atau hapus filter pencarian."
                  : "Tambahkan tanaman favorit kamu dari halaman rekomendasi."
                }
              </p>
              {!query.trim() && (
                <Link
                  href="/rekomendasi"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  <span>🌿</span>
                  <span>Jelajahi Tanaman</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWishlist.map((item) => {
                const plantName = Array.isArray(item.plantData.common)
                  ? item.plantData.common[1] ||
                    item.plantData.common[0] ||
                    item.plantData.latin
                  : (item.plantData.common as string) || item.plantData.latin;

                const isSelected = selectedItems.has(item.plantId);

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-2xl bg-slate-50 ring-1 ring-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                      selectMode && isSelected ? "ring-2 ring-emerald-500" : ""
                    }`}
                  >
                    {/* Checkbox select mode */}
                    {selectMode && (
                      <button
                        onClick={() => toggleSelect(item.plantId)}
                        className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shadow-sm transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {isSelected ? "✓" : "□"}
                      </button>
                    )}

                    {/* Image */}
                    <div className="relative h-56 bg-white flex items-center justify-center">
                      <PlantImage
                        id={item.plantData.id}
                        alt={plantName}
                        className="object-contain max-h-full"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-emerald-800 mb-1 line-clamp-1">
                        {plantName}
                      </h3>
                      <p className="text-sm text-gray-500 italic mb-3 line-clamp-1">
                        {item.plantData.latin}
                      </p>

                      <div className="flex gap-2">
                        <Link
                          href={`/tanaman/${item.plantData.id}`}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all"
                        >
                          Lihat Detail
                        </Link>
                        {!selectMode && (
                          <button
                            onClick={() => removeSingle(item.plantId)}
                            className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-red-600 text-red-600 hover:bg-red-300 text-sm"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-3 text-xs text-gray-400">
                      Added:{" "}
                      {item.addedAt?.toLocaleDateString
                        ? item.addedAt.toLocaleDateString("id-ID")
                        : String(item.addedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 💬 Floating chat button */}
      <ChatButton context="Halaman wishlist PlantMatch - bantu user mengatur wishlist dan memilih tanaman." />
    </main>
  );
}