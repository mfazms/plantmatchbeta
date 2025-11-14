"use client";

import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Plant, UserFilter } from "@/lib/types";
import { fetchPlants } from "@/lib/loadData";
import { recommend } from "@/lib/recommend";
import FiltersPanel from "@/components/FiltersPanel";
import PlantCard from "@/components/PlantCard";
import ExportPDFButton from "@/components/ExportPDFButton";
import ChatButton from "@/components/ChatButton";

// Firebase
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function RekomendasiPage() {
  const [all, setAll] = useState<Plant[]>([]);
  const [shown, setShown] = useState<
    (Plant & { normalizedScore?: number })[]
  >([]);
  const [filter, setFilter] = useState<UserFilter>({});
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // 🔹 Ambil data tanaman
  useEffect(() => {
    fetchPlants().then((data) => {
      setAll(data);
      setShown(data);
    });
  }, []);

  // 🔹 Scroll blur / shadow effect utk header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 🔹 Search engine (Fuse.js)
  const fuse = useMemo(
    () =>
      new Fuse(all, {
        includeScore: false,
        threshold: 0.3,
        keys: ["latin", "common", "category", "climate", "use"],
      }),
    [all]
  );

  // 🔹 Generate rekomendasi tanaman
  const onGenerate = () => {
    const scored = recommend(all, filter);
    setShown(scored);
  };

  // 🔹 Pencarian manual
  const onSearchChange = (val: string) => {
    setQuery(val);
    if (val.trim().length === 0) {
      const scored = recommend(all, filter);
      setShown(scored.length ? scored : all);
      return;
    }
    setShown(fuse.search(val).map((r) => r.item));
  };

  // 🔹 Pilih tanaman (checkbox)
  const toggleSelect = (id: number) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  const selectedPlants = shown.filter((p) => selected.includes(p.id));

  // 🔹 Tentukan Top 10 untuk badge & kesesuaian
  const top10Ids = shown
    .filter((p) => typeof p.normalizedScore === "number")
    .sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0))
    .slice(0, 10)
    .map((p) => p.id);

  const getRank = (id: number) => top10Ids.indexOf(id);

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
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5
                         bg-white/10 hover:bg-white/20 transition text-sm font-medium"
            >
              ← Logout
            </Link>

            <Image
              src="/hero.png"
              alt="PlantMatch logo"
              width={100}
              height={100}
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
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
                My Garden
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
          {shown.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Tidak ada hasil rekomendasi.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {shown.map((plant) => {
                const rank = getRank(plant.id);
                const isTop10 = rank !== -1;

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

      {/* 🔹 Floating Chat Button (Gemini) */}
      <ChatButton
        context="Halaman rekomendasi PlantMatch - bantu user memilih dan merawat tanaman hias."
      />
    </main>
  );
}
