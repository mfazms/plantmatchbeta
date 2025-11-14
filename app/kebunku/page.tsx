"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Plant {
  id: number;
  latin: string;
  family: string;
  common: string[];
  category?: string;
}

interface UserPlant {
  id: string;
  plantId: number;
  startedAt: Timestamp;
  latinName: string;
  lastCommonName: string;
}

/**
 * Tipe helper untuk tanggal dari Firestore atau JS Date / string.
 */
type FirestoreDateLike = Timestamp | Date | string | number | null | undefined;

const formatStartAtDate = (date: FirestoreDateLike) => {
  if (!date) return "Tanggal tidak tersedia";

  let d: Date;

  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else if (typeof date === "string" || typeof date === "number") {
    d = new Date(date);
  } else {
    return "Tanggal tidak tersedia";
  }

  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Hitung lama tanaman hidup
const getTimeAlive = (startedAt: FirestoreDateLike) => {
  if (!startedAt) return "Baru ditanam";

  let startDate: Date;

  if (startedAt instanceof Timestamp) {
    startDate = startedAt.toDate();
  } else if (startedAt instanceof Date) {
    startDate = startedAt;
  } else if (typeof startedAt === "string" || typeof startedAt === "number") {
    startDate = new Date(startedAt);
  } else {
    return "Baru ditanam";
  }

  if (isNaN(startDate.getTime())) return "Baru ditanam";

  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 1) {
    // kalau masih < 1 hari, tampilkan dalam jam
    return `${diffHours} jam`;
  } else {
    // kalau sudah lebih dari 1 hari, tampilkan dalam hari
    return `${diffDays} hari`;
  }
};

export default function KebunKuPage() {
  const [plants, setPlants] = useState<UserPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserPlants = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        // 1️⃣ Ambil semua data tanaman dari koleksi "plants"
        const plantsSnapshot = await getDocs(collection(db, "plants"));
        const allPlants: Plant[] = plantsSnapshot.docs.map((doc) => ({
          id: Number(doc.data().id),
          latin: doc.data().latin,
          family: doc.data().family,
          common: doc.data().common || [],
          category: doc.data().category || "",
        }));

        // 2️⃣ Ambil semua data user_plants milik user ini
        const q = query(
          collection(db, "user_plants"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        // 3️⃣ Join user_plants dengan data master plants
        const userPlants: UserPlant[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const plantId = Number(data.plantId);

          // cari di master plants
          const match = allPlants.find((p) => p.id === plantId);

          return {
            id: doc.id,
            plantId: plantId,
            startedAt: data.startedAt as Timestamp,
            latinName: match?.latin || "Nama Latin Tidak Diketahui",
            lastCommonName:
              match?.common?.[match.common.length - 1] ||
              match?.common?.[0] ||
              "Tanaman Tak Dikenal",
          };
        });

        setPlants(userPlants);
      } catch (error) {
        console.error("Error fetching user plants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlants();
  }, [router]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-emerald-800 text-white">
        <p>Memuat koleksi kebunmu...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-emerald-800 text-white font-[Inter]">
      {/* HEADER */}
      <header className="py-6 px-4 bg-emerald-900 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-center gap-4">
          <Link
            href="/rekomendasi"
            className="px-6 py-2 rounded-full border border-emerald-500 text-emerald-100 font-medium hover:bg-emerald-700 transition"
          >
            All Plants
          </Link>
          <Link
            href="/kebunku"
            className="px-6 py-2 rounded-full bg-white text-emerald-800 font-medium border border-white shadow-md"
          >
            My Garden
          </Link>
        </div>
      </header>

      <main className="py-10 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-white mb-8">
          🌱 My Little Garden
        </h1>

        {plants.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-xl shadow-lg max-w-lg mx-auto text-gray-700">
            <p className="text-xl font-semibold mb-4">
              Kamu belum menanam tanaman apa pun.
            </p>
            <Link
              href="/rekomendasi"
              className="inline-block px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              Cari Tanaman
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map((plant) => (
              <Link
                key={plant.id}
                href={`/tanaman/${plant.plantId}`}
                className="bg-white rounded-xl shadow-md overflow-hidden text-gray-900 hover:shadow-xl transition transform hover:-translate-y-0.5 border border-gray-100 group"
              >
                <div className="relative p-3">
                  {/* Badge Counting Days di kanan atas gambar */}
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                    {getTimeAlive(plant.startedAt)}
                  </div>

                  <div className="w-full h-56 flex justify-center items-center bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={`/images/plants/${plant.plantId}.jpg`}
                      alt={plant.lastCommonName}
                      className="w-full h-full object-cover p-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;

                        // urutan fallback ekstensi
                        const extensions = [".png", ".jpeg", ".webp", ".jpg", ".JPG", ".PNG"];
                        const currentSrc = target.src;
                        const currentExt = currentSrc.substring(currentSrc.lastIndexOf("."));
                        const nextIndex = extensions.indexOf(currentExt) + 1;

                        if (nextIndex < extensions.length) {
                          // coba ekstensi berikutnya
                          const nextExt = extensions[nextIndex];
                          target.src = `/images/plants/${plant.plantId}${nextExt}`;
                        } else {
                          // kalau semua gagal, pakai default
                          target.onerror = null;
                          target.src = "/images/default_plant.jpg";
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <h2 className="text-xl font-semibold text-emerald-800 mb-0">
                    {plant.lastCommonName}
                  </h2>
                  <p className="text-gray-600 text-sm mb-3 italic">
                    {plant.latinName}
                  </p>
                  <p className="text-gray-500 text-xs border-t border-gray-100 pt-3">
                    Mulai menanam:{" "}
                    <span className="font-medium text-emerald-600">
                      {formatStartAtDate(plant.startedAt)}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="w-full text-center py-6 border-t border-emerald-700 text-sm text-emerald-200 mt-10">
        © {new Date().getFullYear()}{" "}
        <span className="text-emerald-400 font-semibold">PlantMatch</span>
      </footer>
    </div>
  );
}
