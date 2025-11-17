"use client";
import { useEffect, useMemo, useState } from "react";
import type { UserFilter, Plant } from "@/lib/types";

type Props = {
  filter: UserFilter;
  onChange: (f: UserFilter) => void;
  onGenerate: () => void;
  allPlants?: Plant[];
};

/** Fallback kalau data belum kebaca */
const LIGHT_FALLBACK = [
  "Bright light",
  "Diffused",
  "Direct sunlight.",
  "Prefers bright, indirect sunlight.",
];

const CLIMATE_FALLBACK = [
  "Tropical",
  "Subtropical",
  "Temperate",
  "Arid",
  "Tropical humid",
  "Arid Tropical",
  "Subtropical arid",
];

const AESTHETIC_FALLBACK = [
  "Table top",
  "Hanging",
  "Colors / Forms",
  "Potted plant",
  "Ground cover",
  "Flower",
];

const MBTI_FALLBACK = [
  "ISFJ",
  "INFJ",
  "ENFP",
  "INTJ",
  "INFP",
  "ISFP",
  "ENTP",
  "ESFJ",
];

const WATERING_OPTIONS = ["-", "Light", "Moderate", "Frequent"];

export default function FiltersPanel({
  filter,
  onChange,
  onGenerate,
  allPlants,
}: Props) {
  /* ===== AUTO DENSITY by viewport height ===== */
  const [density, setDensity] = useState<"normal" | "dense" | "ultra">("normal");

  useEffect(() => {
    const decide = () => {
      const h = window.innerHeight;
      if (h < 720) setDensity("ultra");
      else if (h < 820) setDensity("dense");
      else setDensity("normal");
    };
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  /* ===== Dynamic options dari database terbaru ===== */

  // Light: gabungan ideallight + toleratedlight
  const LIGHT_OPTIONS = useMemo(() => {
    if (!allPlants?.length) return ["-", ...LIGHT_FALLBACK];

    const set = new Set<string>();
    allPlants.forEach((plant) => {
      const ideal = plant.ideallight;
      const tol = plant.toleratedlight;

      if (ideal) set.add(ideal);
      if (tol && tol !== "/") set.add(tol);
    });

    return ["-", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allPlants]);

  // Climate: ambil unik dari field "climate"
  const CLIMATE_OPTIONS = useMemo(() => {
    if (!allPlants?.length) return ["-", ...CLIMATE_FALLBACK];

    const set = new Set<string>();
    allPlants.forEach((plant) => {
      const c = plant.climate;
      if (c) set.add(c);
    });

    return ["-", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allPlants]);

  // Aesthetic: ambil dari array "use" (Table top, Potted plant, Flower, dll)
  const AESTHETIC_OPTIONS = useMemo(() => {
    if (!allPlants?.length) return ["-", ...AESTHETIC_FALLBACK];

    const set = new Set<string>();
    allPlants.forEach((plant) => {
      const use = plant.use;
      if (Array.isArray(use)) {
        use.forEach((u) => u && set.add(u));
      } else if (typeof use === "string" && use) {
        set.add(use);
      }
    });

    return ["-", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allPlants]);

  // MBTI: sekarang di tipe Plant = string (bukan object { type })
  const MBTI_OPTIONS = useMemo(() => {
    if (!allPlants?.length) return ["-", ...MBTI_FALLBACK];

    const set = new Set<string>();
    allPlants.forEach((plant) => {
      const mbti = typeof plant.mbti === "string" ? plant.mbti.trim() : "";
      if (mbti) set.add(mbti);
    });

    // kalau ternyata tidak ada isi dari data, fallback ke default list
    if (!set.size) {
      return ["-", ...MBTI_FALLBACK];
    }

    return ["-", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allPlants]);

  /* ===== Helper untuk update filter ===== */
  const setFilter = (key: keyof UserFilter, v: string) =>
    onChange({
      ...filter,
      [key]: v === "-" ? undefined : v,
    });

  const Field = ({
    label,
    icon,
    children,
  }: {
    label: string;
    icon?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2 dens:space-y-1 u:space-y-1 animate-fadeIn">
      <label className="block text-sm font-semibold dens:text-[13px] u:text-xs text-white/90 flex items-center gap-2">
        {icon && <span className="text-emerald-300">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );

  const Select = ({
    value,
    onChange,
    options,
  }: {
    value?: string;
    onChange: (v: string) => void;
    options: string[];
  }) => (
    <select
      value={value ?? "-"}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full appearance-none rounded-xl border-2 border-emerald-500/30 bg-white/95 text-emerald-900
        px-4 py-3 text-sm shadow-lg outline-none 
        focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
        hover:border-emerald-400/60 hover:shadow-xl
        transition-all duration-300
        backdrop-blur-sm
        dens:h-9 dens:py-1.5 dens:px-3 dens:text-[13px] dens:rounded-lg
        u:h-8 u:py-1 u:px-2.5 u:text-xs u:rounded-md
        cursor-pointer
      "
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );

  const YEAR = new Date().getFullYear();

  return (
    <div className={`relative ${density === "ultra" ? "u" : density === "dense" ? "dens" : ""}`}>
      {/* ⭐ Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* ⭐ COPYRIGHT dengan gradient */}
        <div className="mb-4 pt-2 animate-fadeIn">
          <p className="text-xs u:text-[10.5px] leading-relaxed text-center backdrop-blur-sm bg-emerald-900/20 py-2 px-3 rounded-lg border border-emerald-500/20">
            <span className="text-white/60">© {YEAR} </span>
            <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent font-bold">
              PlantMatch
            </span>
            <span className="text-white/60"> — Find the Plant That Fits You</span>
          </p>
        </div>

        {/* ⭐ Fields dengan icons dan animations */}
        <div className="flex flex-col gap-6 dens:gap-3 u:gap-2.5">
          <Field label="Light Intensity" icon="☀️">
            <Select
              value={filter.light}
              onChange={(v) => setFilter("light", v)}
              options={LIGHT_OPTIONS}
            />
          </Field>

          <Field label="Local Climate" icon="🌍">
            <Select
              value={filter.climate}
              onChange={(v) => setFilter("climate", v)}
              options={CLIMATE_OPTIONS}
            />
          </Field>

          <Field label="Aesthetic Use / Placement" icon="🎨">
            <Select
              value={filter.aesthetic}
              onChange={(v) => setFilter("aesthetic", v)}
              options={AESTHETIC_OPTIONS}
            />
          </Field>

          <Field label="Watering Frequency" icon="💧">
            <Select
              value={filter.watering as string | undefined}
              onChange={(v) => setFilter("watering", v)}
              options={WATERING_OPTIONS}
            />
          </Field>

          <Field label="Personality Type (MBTI)" icon="🧠">
            <Select
              value={filter.mbti as string | undefined}
              onChange={(v) => setFilter("mbti", v)}
              options={MBTI_OPTIONS}
            />
          </Field>
        </div>
      </div>

      {/* util CSS: bikin varian 'dens:' & 'u:' (ultra) tanpa config tailwind */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Fade in animation */
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
          }

          .animate-fadeIn:nth-child(1) { animation-delay: 0s; }
          .animate-fadeIn:nth-child(2) { animation-delay: 0.1s; }
          .animate-fadeIn:nth-child(3) { animation-delay: 0.2s; }
          .animate-fadeIn:nth-child(4) { animation-delay: 0.3s; }
          .animate-fadeIn:nth-child(5) { animation-delay: 0.4s; }
          .animate-fadeIn:nth-child(6) { animation-delay: 0.5s; }

          /* Pulse animation */
          @keyframes pulse {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.1);
            }
          }

          .animate-pulse {
            animation: pulse 3s ease-in-out infinite;
          }

          /* Dense mode utilities */
          .dens .dens\\:gap-3 { gap: .75rem !important; }
          .dens .dens\\:space-y-1 > * + * { margin-top: .25rem !important; }
          .dens .dens\\:h-9 { height: 2.25rem !important; }
          .dens .dens\\:py-1\\.5 { padding-top: .375rem !important; padding-bottom: .375rem !important; }
          .dens .dens\\:px-3 { padding-left: .75rem !important; padding-right: .75rem !important; }
          .dens .dens\\:text-\\[13px\\] { font-size: 13px !important; }
          .dens .dens\\:rounded-lg { border-radius: .5rem !important; }

          /* Ultra mode utilities */
          .u .u\\:gap-2\\.5 { gap: .625rem !important; }
          .u .u\\:space-y-1 > * + * { margin-top: .25rem !important; }
          .u .u\\:h-8 { height: 2rem !important; }
          .u .u\\:py-1 { padding-top: .25rem !important; padding-bottom: .25rem !important; }
          .u .u\\:px-2\\.5 { padding-left: .625rem !important; padding-right: .625rem !important; }
          .u .u\\:text-xs { font-size: .75rem !important; }
          .u .u\\:rounded-md { border-radius: .375rem !important; }
          .u .u\\:text-\\[10\\.5px\\] { font-size: 10.5px !important; }
        `,
        }}
      />
    </div>
  );
}