"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { addPlantToGarden, stopPlanting } from "@/lib/garden";
import type { Plant } from "@/lib/types";

interface Props {
  plant: Plant;
}

type PlantStatus = "idle" | "loading" | "planted";

export default function MulaiMenanamButton({ plant }: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<PlantStatus>("idle");
  const [gardenEntryId, setGardenEntryId] = useState<string | null>(null);

  // Cek apakah tanaman ini sudah ditanam user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("idle");
        setGardenEntryId(null);
        return;
      }

      try {
        // Query ke collection "garden" dengan userId dan plantId
        const q = query(
          collection(db, "garden"),
          where("userId", "==", user.uid),
          where("plantId", "==", plant.id)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          // Sudah ada entry untuk tanaman ini
          setGardenEntryId(snap.docs[0].id);
          setStatus("planted");
        } else {
          setStatus("idle");
          setGardenEntryId(null);
        }
      } catch (err) {
        console.error("Error checking garden:", err);
        setStatus("idle");
      }
    });

    return () => unsub();
  }, [plant.id]);

  const handleClick = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    if (status === "loading") return;

    try {
      setStatus("loading");

      if (status === "idle") {
        // Mulai menanam - tambah ke garden
        const newEntryId = await addPlantToGarden({
          userId: user.uid,
          plantId: plant.id,
          plantName: plant.common?.[0] || plant.latin,
          image: `/api/plant-image?id=${plant.id}`, // Gunakan API route
        });

        setGardenEntryId(newEntryId);
        setStatus("planted");
        
        // Redirect ke My Garden setelah berhasil
        setTimeout(() => {
          router.push("/kebunku");
        }, 500);
      } else if (status === "planted" && gardenEntryId) {
        // Berhenti menanam - hapus dari garden
        await stopPlanting(gardenEntryId);
        setGardenEntryId(null);
        setStatus("idle");
      }
    } catch (err) {
      console.error("[MulaiMenanamButton] error:", err);
      alert("Terjadi kesalahan. Coba lagi ya!");
      setStatus(status === "planted" ? "planted" : "idle");
    }
  };

  const label =
    status === "loading"
      ? "Memproses..."
      : status === "planted"
      ? "🛑 Berhenti Menanam"
      : "🌱 Mulai Menanam";

  const bgColor =
    status === "planted"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className={`mt-4 w-full rounded-full ${bgColor} px-5 py-3 text-sm font-semibold text-white shadow transition disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}