"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between bg-emerald-800 text-white">
      {/* HERO SECTION */}
      <section className="flex-1 flex items-center justify-center w-full">
        <div className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 items-center gap-12">
          {/* LOGO */}
          <div className="flex justify-center md:justify-end">
            <Image
              src="/hero.png"
              alt="PlantMatch logo"
              width={480}
              height={480}
              priority
              className="w-full max-w-[340px] h-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* TEKS */}
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              PlantMatch
            </h1>
            <p className="mt-4 text-emerald-100 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
              Plants, like people, need the right environment to flourish.
              When the place feels right, growth comes naturally. So find the
              one that fits — not to change it, but to grow together.
            </p>

            {/* BUTTON KE REGISTER */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mt-8 rounded-full bg-white text-emerald-800 px-6 py-2.5 
                         hover:bg-emerald-50 transition shadow-sm text-lg font-semibold"
            >
              Explore plants →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full text-center py-6 border-t border-emerald-700 text-sm text-emerald-200">
        © {new Date().getFullYear()}{" "}
        <span className="text-emerald-400 font-semibold">PlantMatch</span> — Find the Plant That Fits You
      </footer>
    </main>
  );
}
