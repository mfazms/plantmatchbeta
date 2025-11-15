"use client";

import React, { useState } from "react";
import { stopPlanting, addToPlantHistory } from "@/lib/garden";

interface StopPlantingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: string;
  plantName: string;
  onSuccess: () => void;
}

export default function StopPlantingDialog({
  isOpen,
  onClose,
  entryId,
  plantName,
  onSuccess,
}: StopPlantingDialogProps) {
  const [reason, setReason] = useState<"died" | "notSuitable" | "">("");
  const [loading, setLoading] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [affirmationMessage, setAffirmationMessage] = useState("");

  if (!isOpen) return null;

  const handleStopPlanting = async () => {
    if (!reason) {
      alert("Pilih alasan dulu ya 🌿");
      return;
    }

    setLoading(true);
    try {
      // Simpan ke history dengan alasan
      await addToPlantHistory({
        entryId,
        plantName,
        reason,
        stoppedAt: new Date(),
      });

      // Hapus dari garden aktif
      await stopPlanting(entryId);

      // Tampilkan pesan afirmasi
      if (reason === "died") {
        setAffirmationMessage(
          `💚 Jangan sedih ya! Tanaman ${plantName} mungkin sudah berusaha tumbuh sebaik mungkin. Setiap kegagalan adalah pembelajaran. Kamu pasti bisa merawat tanaman lain dengan lebih baik! Semangat terus ya! 🌱`
        );
      } else {
        setAffirmationMessage(
          `✨ Tidak apa-apa! ${plantName} mungkin memang bukan tanaman yang cocok untukmu. Semoga kamu bisa menemukan tanaman lain yang lebih sesuai dengan kondisi dan preferensimu. Keep exploring! 🌿`
        );
      }
      
      setShowAffirmation(true);
      
      // Tunggu sebentar untuk user baca afirmasi
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 5000);
    } catch (error) {
      console.error("Error stopping plant:", error);
      alert("Gagal menghentikan penanaman. Coba lagi ya!");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !showAffirmation) {
      setReason("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        {!showAffirmation ? (
          <>
            <h2 className="text-xl font-bold text-emerald-900 mb-2">
              Berhenti Menanam {plantName}? 🌿
            </h2>
            
            <p className="text-gray-600 mb-4 text-sm">
              Beritahu kami alasannya ya, biar kami bisa kasih saran yang lebih baik:
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setReason("died")}
                className={`w-full p-3 rounded-lg border-2 text-left transition ${
                  reason === "died"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-800">😢 Tanaman mati</div>
                <div className="text-sm text-gray-500 mt-1">
                  Tanamanku sayangnya tidak berhasil tumbuh
                </div>
              </button>

              <button
                onClick={() => setReason("notSuitable")}
                className={`w-full p-3 rounded-lg border-2 text-left transition ${
                  reason === "notSuitable"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-800">🤔 Tidak cocok</div>
                <div className="text-sm text-gray-500 mt-1">
                  Tanaman ini ternyata tidak cocok untukku
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              
              <button
                onClick={handleStopPlanting}
                disabled={loading || !reason}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Ya, Berhenti"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-4">
              {reason === "died" ? "🌱" : "🌟"}
            </div>
            <p className="text-gray-700 leading-relaxed">
              {affirmationMessage}
            </p>
            <div className="mt-6 text-xs text-gray-400">
              Menutup otomatis dalam beberapa detik...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}