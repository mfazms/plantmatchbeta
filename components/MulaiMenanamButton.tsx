"use client";

import { auth, db } from "@/lib/firebaseConfig";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore"; // Import getDoc dan deleteDoc
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react"; // Import useEffect

// Definisikan tipe Plant
interface Plant {
    id: number;
    latin?: string;
    watering_frequency?: { value: number; period: 'day' | 'week' | 'month' };
    care_tips?: any[];
}

// Fungsi bantu untuk menghitung nextReminder
const calculateNextReminder = (plant: Plant) => {
    const { value, period } = plant.watering_frequency || {};
    if (!value || !period) return null;

    let intervalDays = 0;
    if (period === "week") intervalDays = Math.round(7 / value);
    else if (period === "day") intervalDays = value;
    else if (period === "month") intervalDays = Math.round(30 / value);

    const now = new Date();
    const nextReminder = new Date(now);
    nextReminder.setDate(now.getDate() + intervalDays);
    return nextReminder;
};


export default function MulaiMenanamButton({ plant }: { plant: Plant }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPlanted, setIsPlanted] = useState(false); // State baru untuk status tanaman

  // 1. useEffect: Cek status tanaman saat komponen dimuat
  useEffect(() => {
    const checkPlantStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsPlanted(false);
        return;
      }

      const docId = `${user.uid}_${plant.id}`;
      const userPlantRef = doc(db, "user_plants", docId);
      
      try {
        const docSnap = await getDoc(userPlantRef);
        setIsPlanted(docSnap.exists());
      } catch (error) {
        console.error("Error checking plant status:", error);
      }
    };

    // Gunakan onAuthStateChanged untuk memicu pengecekan setelah status auth dimuat
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkPlantStatus();
      } else {
        setIsPlanted(false); // Reset jika user logout
      }
    });

    return () => unsubscribe(); // Cleanup function
  }, [plant.id]); // Re-run jika plant.id berubah

  // Fungsi: Menambahkan Tanaman (Mulai Menanam)
  const handleMulaiMenanam = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Kamu harus login dulu!");
        router.push("/login");
        return;
      }
      
      const plantNameForDb = plant.latin ?? `Tanaman ID ${plant.id}`;
      const nextReminder = calculateNextReminder(plant);
      
      if (!plant.watering_frequency?.value || !plant.watering_frequency?.period || !nextReminder) {
        alert("Data frekuensi penyiraman tidak tersedia untuk tanaman ini.");
        return;
      }

      const userPlantRef = doc(db, "user_plants", `${user.uid}_${plant.id}`);
      await setDoc(userPlantRef, {
        userId: user.uid,
        plantId: plant.id,
        plantName: plantNameForDb,
        startedAt: new Date(), 
        nextReminder: nextReminder,
        wateringFrequency: plant.watering_frequency,
        careTips: plant.care_tips || [],
      });

      setIsPlanted(true); // Set status planted menjadi true
      alert(`🌱 Tanaman ${plantNameForDb} berhasil ditambahkan ke daftarmu!`);
    } catch (err) {
      console.error("Error:", err);
      let message = "Terjadi kesalahan saat menyimpan data.";
      if (err instanceof Error) {
        message = `Terjadi kesalahan saat menyimpan data. ${err.message}`;
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi: Menghapus Tanaman (Berhenti Menanam)
  const handleBerhentiMenanam = async () => {
    setLoading(true);
    try {
        const user = auth.currentUser;
        if (!user) return; // Seharusnya sudah dicek di useEffect, tapi jaga-jaga

        const docId = `${user.uid}_${plant.id}`;
        const userPlantRef = doc(db, "user_plants", docId);

        await deleteDoc(userPlantRef);
        
        setIsPlanted(false); // Set status planted menjadi false
        alert(`🗑️ Tanaman ${plant.latin ?? 'ini'} berhasil dihapus dari daftarmu.`);
    } catch (err) {
        console.error("Error deleting plant:", err);
        alert("Gagal menghapus tanaman. Silakan coba lagi.");
    } finally {
        setLoading(false);
    }
  };


  return (
    <button
      onClick={isPlanted ? handleBerhentiMenanam : handleMulaiMenanam} // Panggil fungsi yang berbeda
      disabled={loading}
      // Ganti warna dan teks berdasarkan state isPlanted
      className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 
                 text-white text-lg font-semibold transition shadow-md disabled:opacity-60 
                 ${isPlanted ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
    >
      {loading 
        ? "⏳ Memproses..." 
        : isPlanted 
          ? "🗑️ Berhenti Menanam" 
          : "🌱 Mulai Menanam"}
    </button>
  );
}