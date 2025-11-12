"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig"; // Menggunakan impor Firebase Anda yang sudah ada
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Helper function untuk memformat tanggal dan menangani 'Invalid Date' / Firestore Timestamp
const formatStartAtDate = (dateString: any) => {
  let date: Date;
  if (dateString && typeof dateString.toDate === 'function') {
    date = dateString.toDate();
  } else if (dateString) {
    date = new Date(dateString);
  } else {
    return "Tanggal tidak tersedia";
  }

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};


export default function KebunKuPage() {
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserPlants = async () => {
      // Pastikan auth/user sudah siap
      const user = auth.currentUser;
      if (!user) {
        // Ini akan berjalan jika user belum login saat component dimuat
        router.push("/login");
        return;
      }

      try {
        const q = query(
          collection(db, "user_plants"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const userPlants = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          // >>> PERBAIKAN LOGIKA NAMA TANAMAN DIMULAI DI SINI <<<
          // 1. Judul Utama: Prioritaskan Nama Latin (latinName)
          const mainName = data.latinName || data.plantName || "Tanaman Tak Dikenal";
          
          // 2. Kategori/Subtitle: Gunakan Nama Umum/Kategori
          const subCategory = data.plantName || data.plantCategory || "Tanaman Hias"; 

          return {
            id: doc.id,
            plantName: mainName,      // Sekarang ini bisa jadi "Bougainvillea"
            plantCategory: subCategory, // Sekarang ini bisa jadi "Paper flower"
            plantId: data.plantId,
            ...data,
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
    <div className="min-h-screen bg-emerald-800 text-white">
      {/* HEADER NAVIGASI */}
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
        {/* Judul */}
        <h1 className="text-4xl font-extrabold text-center text-white mb-8">
          🌱 My Little Garden
        </h1>

        {plants.length === 0 ? (
          /* Tampilan Kosong */
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
          /* Daftar Tanaman - Grid dan Card Style Mirip All Plants */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map((plant) => (
              // LINK KE HALAMAN DETAIL TANAMAN
              <Link
                key={plant.id} 
                // !!! INI BAGIAN PENTING UNTUK LINK DETAIL !!!
                // plant.plantId harus berisi ID unik tanaman (misalnya: 'amelia')
                href={`/tanaman/${plant.plantId}`} 
                
                className="bg-white rounded-xl shadow-md overflow-hidden text-gray-900 hover:shadow-xl transition transform hover:-translate-y-0.5 border border-gray-100 group"
              >
                {/* Area Gambar */}
                <div className="relative p-3">
                    {/* Checkbox Placeholder (Untuk konsistensi visual dengan All Plants) */}
                    <div className="absolute top-5 right-5 bg-white p-1 rounded-md border border-gray-300 shadow-sm cursor-pointer opacity-70 group-hover:opacity-100 transition">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>

                    <div className="w-full h-56 flex justify-center items-center bg-gray-50 rounded-lg overflow-hidden">
                      <img
                        // PATH GAMBAR - Pastikan plant.plantId cocok dengan nama file gambar
                        src={`/images/plants/${plant.plantId}.jpg`}
                        alt={plant.plantName}
                        className="w-full h-full object-cover p-2" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; 
                          // Ganti dengan placeholder yang jelas, misalnya dari layanan eksternal 
                          // atau pastikan path /images/default_plant.jpg ADA di folder public Anda.
                          target.src = "https://placehold.co/400x300/e0f2f1/065f46?text=Image+Missing"; 
                          console.error(`Gambar untuk plantId: ${plant.plantId} tidak ditemukan. Menggunakan placeholder.`);
                        }}
                      />
                    </div>
                </div>
                
                {/* Area Teks/Informasi */}
                <div className="p-4 pt-0">
                    <h2 className="text-xl font-semibold text-emerald-800 mb-0">
                      {plant.plantName} {/* Sekarang menampilkan nama latin jika ada */}
                    </h2>
                    {/* Kategori Tanaman */}
                    <p className="text-gray-600 text-sm mb-3">
                      {plant.plantCategory} {/* Sekarang menampilkan nama umum/kategori */}
                    </p>
                    {/* Tanggal Mulai Tanam */}
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

      {/* FOOTER */}
      <footer className="w-full text-center py-6 border-t border-emerald-700 text-sm text-emerald-200 mt-10">
        © {new Date().getFullYear()}{" "}
        <span className="text-emerald-400 font-semibold">PlantMatch</span>
      </footer>

    </div>
  );
}