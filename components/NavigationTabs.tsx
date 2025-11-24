// components/NavigationTabs.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getWishlistCount } from "@/lib/wishlist";

type NavTab = {
  label: string;
  href: string;
  badge?: number;
  emoji?: string;
};

export default function NavigationTabs({ 
  alertCount = 0 
}: { 
  alertCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Load wishlist count
  useEffect(() => {
    const loadWishlistCount = async () => {
      const count = await getWishlistCount();
      setWishlistCount(count);
    };

    loadWishlistCount();

    // Refresh count setiap 5 detik
    const interval = setInterval(loadWishlistCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const tabs: NavTab[] = [
    {
      label: "All Plants",
      href: "/rekomendasi",
    },
    {
      label: "My Garden",
      href: "/kebunku",
      badge: alertCount,
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      badge: wishlistCount,
    }
  ];

  const handleNavigation = (href: string) => {
    if (pathname === href) return; // Already on this page
    
    setNavigatingTo(href);
    
    // Small delay untuk show animation
    setTimeout(() => {
      router.push(href);
    }, 300);
  };

  const isActive = (href: string) => pathname === href;
  const isNavigating = (href: string) => navigatingTo === href;

  return (
    <>
      <div className="flex justify-center gap-3 flex-wrap">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const loading = isNavigating(tab.href);
          
          return (
            <button
              key={tab.href}
              onClick={() => handleNavigation(tab.href)}
              disabled={loading || active}
              className={`
                px-4 py-2 rounded-full border-2 font-semibold
                transition-all duration-300
                ${active 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                }
                ${loading ? 'scale-95 opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'}
                disabled:cursor-not-allowed
                relative overflow-hidden
              `}
            >
              {/* Shimmer effect saat loading */}
              {loading && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              )}
              
              <span className="inline-flex items-center gap-2 relative z-10">
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                
                {tab.emoji && <span>{tab.emoji}</span>}
                <span>{tab.label}</span>
                
                {/* Badge untuk count */}
                {tab.badge && tab.badge > 0 && (
                  <span className={`
                    inline-flex items-center justify-center rounded-full 
                    text-white text-xs px-2 py-0.5 font-bold
                    ${tab.label === "My Garden" 
                      ? "bg-red-500 animate-pulse" 
                      : "bg-pink-500"
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Page transition overlay */}
      {navigatingTo && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fadeIn pointer-events-none">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="h-16 w-16 rounded-full border-4 border-transparent border-t-emerald-500 border-r-emerald-400" />
                </div>
                <div className="flex h-16 w-16 items-center justify-center">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-xl">🌿</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-lg font-semibold text-emerald-700">
              Memuat halaman...
            </p>
          </div>
        </div>
      )}
    </>
  );
}