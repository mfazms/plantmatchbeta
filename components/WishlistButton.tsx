"use client";

import { useState, useEffect } from "react";
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist";
import type { Plant } from "@/lib/types";

type Props = {
  plant: Plant;
  onToggle?: () => void;
  showLabel?: boolean;
};

export default function WishlistButton({ plant, onToggle, showLabel = false }: Props) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      setChecking(true);
      const result = await isInWishlist(plant.id);
      setInWishlist(result);
      setChecking(false);
    };

    check();
  }, [plant.id]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (inWishlist) {
        const ok = await removeFromWishlist(plant.id);
        if (ok) {
          setInWishlist(false);
          onToggle?.();
        }
      } else {
        const ok = await addToWishlist(plant);
        if (ok) {
          setInWishlist(true);
          onToggle?.();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Loader kecil
  if (checking) {
    return (
      <button
        disabled
        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
      >
        ⏳
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        w-8 h-8 md:w-9 md:h-9
        flex items-center justify-center
        rounded-full
        border border-emerald-300
        bg-white/90 
        shadow-sm
        hover:bg-emerald-50 hover:border-emerald-500
        transition-all duration-150
        active:scale-90
        ${loading ? "opacity-70 cursor-wait" : ""}
      `}
      title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      {loading ? (
        <span className="text-sm">⏳</span>
      ) : (
        <span
          className={`
            text-lg transition-transform duration-300
            ${inWishlist ? "text-pink-500" : "text-emerald-500"}
            hover:scale-110
          `}
        >
          {inWishlist ? "❤️" : "🤍"}
        </span>
      )}

      {showLabel && (
        <span className="ml-2 text-sm">
          {inWishlist ? "In wishlist" : "Add to wishlist"}
        </span>
      )}
    </button>
  );
}
