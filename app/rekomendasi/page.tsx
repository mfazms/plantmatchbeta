// app/rekomendasi/page.tsx
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
import PlantList from "@/components/PlantList";
import ExportPDFButton from "@/components/ExportPDFButton";

// Firebase
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function RekomendasiPage() {
  const [all, setAll] = useState<Plant[]>([]);
  const [shown, setShown] = useState<Plant[]>([]);
  const [filter, setFilter] = useState<UserFilter>({});
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // tambahkan indikator loading

  // Cek status login Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // kalau belum login, arahkan ke login
      } else {
        setUser(currentUser);
      }
      setLoading(false); // berhenti loading setelah pengecekan
    });
    return () => unsub();
  }, [router]);

  // Ambil data tanaman
  useEffect(() => {
    fetchPlants().then((data) => {
      setAll(data);
      setShown(data);
    });
  }, []);

  // Scroll blur effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(all, {
        includeScore: false,
        threshold: 0.3,
        keys: ["latin", "common", "category", "climate", "use"],
      }),
    [all]
  );

  const onGenerate = () => {
    const scored = recommend(all, filter).map((s) => s.plant);
    const afterSearch =
      query.trim().length === 0
        ? scored
        : fuse
            .search(query)
            .map((r) => r.item)
            .filter((p) => scored.some((x) => x.id === p.id));
    setShown(afterSearch);
  };

  const onSearchChange = (val: string) => {
    setQuery(val);
    if (val.trim().length === 0) {
      const scored = recommend(all, filter).map((s) => s.plant);
      setShown(scored.length ? scored : all);
      return;
    }
    setShown(fuse.search(val).map((r) => r.item));
  };

  const toggleSelect = (id: number) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  const selectedPlants = shown.filter((p) => selected.includes(p.id));

  // Jika masih loading, tampilkan tampilan sementara
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-800">
        <p className="text-lg font-medium">Memuat...</p>
      </main>
    );
  }

  // Jika belum login (tapi sudah dicek), redirect ke login
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
          <div className="sticky top-4 z-50 bg-white/90 rounded-2xl px-5 py-4 mb-6 ring-1 ring-emerald-100 shadow-sm backdrop-blur-md">
            
            {/* 🔹 NAVIGATION TABS (All Plants / My Garden) */}
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

            {/* SEARCH BAR */}
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari tanaman..."
                className="flex-1 h-12 px-5 rounded-full bg-white text-gray-900 ring-1 ring-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <PlantList
            plants={shown}
            selectedIds={selected}
            onToggleSelect={toggleSelect}
          />
        </section>
      </div>
    </main>
  );
}
