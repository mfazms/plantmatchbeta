"use client";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Plant } from "@/lib/types";
import { displayName } from "@/lib/types";

const RENDER_WIDTH_PX = 1500;
const INLINE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
       <rect width="100%" height="100%" fill="#f9fafb"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#9ca3af">
         no image
       </text>
     </svg>`
  );

// helper: pastikan value jadi array string
const toList = (v: unknown) =>
  Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)];

function getSrcCandidates(p: Plant) {
  const c: string[] = [];
  c.push(`/api/plant-image?id=${p.id}`);
  c.push(`/images/placeholder-plant.jpg`);
  c.push(INLINE_PLACEHOLDER);
  return Array.from(new Set(c));
}

async function tryLoadImage(img: HTMLImageElement, srcs: string[]) {
  return new Promise<void>((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= srcs.length) {
        img.src = INLINE_PLACEHOLDER;
        return resolve();
      }
      const s = srcs[i++];
      img.onload = () => resolve();
      img.onerror = () => next();
      img.src = s;
    };
    next();
  });
}

/** Setelah preload, kunci ukuran gambar berdasarkan rasio aslinya (anti gepeng) */
function fitImages(root: HTMLElement) {
  const imgs = Array.from(
    root.querySelectorAll<HTMLImageElement>('img[data-fit="pdf"]')
  );
  imgs.forEach((img) => {
    const parent = img.parentElement as HTMLElement | null;
    const parentWidth = parent?.getBoundingClientRect()?.width || RENDER_WIDTH_PX - 48;
    const maxH = 500;

    const nw = img.naturalWidth || 1;
    const nh = img.naturalHeight || 1;

    const scale = Math.min(parentWidth / nw, maxH / nh);

    const w = Math.max(1, Math.round(nw * scale));
    const h = Math.max(1, Math.round(nh * scale));

    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    img.style.maxWidth = "100%";
    img.style.maxHeight = `${maxH}px`;
  });
}

// ⭐ BULLETPROOF: Loading Modal with React Portal
function PDFExportLoading({ progress }: { progress: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '448px',
          width: '90%',
          margin: '0 16px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {/* Icon */}
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                height: '80px',
                width: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <svg
                style={{ width: '40px', height: '40px', color: '#ffffff' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '8px',
            }}
          >
            Membuat PDF
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Mohon tunggu sebentar...
          </p>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                transition: 'width 300ms ease-out',
                borderRadius: '9999px',
                width: `${progress}%`,
              }}
            />
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>{progress}%</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );

  // ✅ Render to document.body using Portal
  return createPortal(modalContent, document.body);
}

export default function ExportPDFButton({
  plants,
  disabled,
  className,
  label = "Export PDF",
  icon = true,
}: {
  plants: Plant[];
  disabled?: boolean;
  className?: string;
  label?: string;
  icon?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const preloadImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(async (img) => {
        if (img.complete && (img as HTMLImageElement).naturalWidth > 0) return;
        const candidates = JSON.parse(img.getAttribute("data-candidates") || "[]");
        if (!candidates.length) return;
        await tryLoadImage(img, candidates);
      })
    );
  };

  const handleExport = async () => {
    if (!ref.current) return;
    setIsExporting(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const html2pdf = (await import("html2pdf.js")).default;

      await preloadImages(ref.current);
      fitImages(ref.current);

      setProgress(50);

      const opt = {
        margin: 10,
        filename: "plantmatch-selection.pdf",
        image: { type: "jpeg" as const, quality: 1 },
        html2canvas: {
          backgroundColor: "#ffffff",
          scale: Math.min(3, (window.devicePixelRatio || 1) * 2),
          useCORS: true,
          allowTaint: true,
        },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] as const },
      };

      await html2pdf().from(ref.current).set(opt).save();

      clearInterval(progressInterval);
      setProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <>
      <button
        className={
          className ??
          `inline-flex items-center gap-2 rounded-full px-4 py-2 bg-emerald-600 text-white
           hover:bg-emerald-700 transition shadow-sm disabled:opacity-50`
        }
        onClick={handleExport}
        disabled={disabled || isExporting}
      >
        {icon && !isExporting && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7z" />
            <path d="M5 18h14v2H5z" />
          </svg>
        )}
        {isExporting && (
          <svg
            className="animate-spin"
            style={{ width: '18px', height: '18px' }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isExporting ? "Membuat PDF..." : `${label} ${plants.length ? `(${plants.length})` : ""}`}
      </button>

      {/* ✅ Portal Modal - Completely isolated from layout */}
      {isExporting && <PDFExportLoading progress={progress} />}

      {/* Offscreen render target */}
      <div
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          width: RENDER_WIDTH_PX,
          background: "#fff",
          color: "#111",
          fontFamily: "system-ui, Arial, sans-serif",
          visibility: "hidden",
        }}
      >
        <div ref={ref}>
          {plants.map((p, idx) => {
            const candidates = getSrcCandidates(p);
            const isLast = idx === plants.length - 1;
            
            // ⭐ FIX: Handle MBTI properly (string OR object)
            const mbtiValue = typeof p.mbti === 'string' 
              ? p.mbti.trim() 
              : (p.mbti as any)?.type || '';
            
            return (
              <div
                key={p.id}
                style={{
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  pageBreakBefore: idx === 0 ? "avoid" : "always",
                  pageBreakAfter: "avoid",
                  padding: 32,
                  border: "2px solid #d1fae5",
                  borderRadius: 16,
                  marginBottom: isLast ? 0 : 20,
                  background: "linear-gradient(to bottom, #ffffff, #f0fdf4)",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              >
                {/* Header brand */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12, 
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "2px solid #d1fae5"
                }}>
                  <img 
                    src="/hero1.png" 
                    alt="PlantMatch" 
                    style={{ 
                      width: 64, 
                      height: 64, 
                      objectFit: "contain",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    }} 
                  />
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: 800, 
                    color: "#047857",
                    letterSpacing: "-0.5px"
                  }}>
                    PlantMatch
                  </div>
                </div>

                {/* Plant name */}
                <h2 style={{ 
                  fontSize: 36, 
                  margin: "0 0 8px 0", 
                  color: "#065f46",
                  fontWeight: 800,
                  lineHeight: 1.2
                }}>
                  {displayName(p)}
                </h2>
                <p style={{ 
                  margin: "0 0 24px 0", 
                  fontStyle: "italic", 
                  color: "#6b7280",
                  fontSize: 18
                }}>
                  {p.latin}
                </p>

                {/* Area gambar - BIGGER & CENTERED */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    background: "linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)",
                    borderRadius: 12,
                    overflow: "hidden",
                    marginTop: 12,
                    marginBottom: 24,
                    padding: 20,
                    border: "2px solid #a7f3d0",
                  }}
                >
                  <img
                    alt={p.latin}
                    data-candidates={JSON.stringify(candidates)}
                    data-fit="pdf"
                    style={{ 
                      display: "block", 
                      borderRadius: 10,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    }}
                  />
                </div>

                {/* Plant Details - 2 COLUMNS */}
                <div style={{ 
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px 40px",
                  marginTop: 24, 
                  fontSize: 15, 
                  lineHeight: 1.8, 
                  color: "#111" 
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Family:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{p.family || "-"}</span>
                  </div>
                  
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Kategori:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{p.category || "-"}</span>
                  </div>
                  
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Asal/Origin:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{p.origin || "-"}</span>
                  </div>
                  
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Iklim:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{p.climate || "-"}</span>
                  </div>
                  
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Suhu ideal:</span>
                    <br />
                    <span style={{ color: "#374151" }}>
                      {p.tempmin?.celsius || "-"}°C – {p.tempmax?.celsius || "-"}°C 
                      {" "}({p.tempmin?.fahrenheit || "-"}–{p.tempmax?.fahrenheit || "-"}°F)
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Cahaya ideal:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{p.ideallight || "-"}</span>
                  </div>
                  
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Cahaya toleran:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{p.toleratedlight || "-"}</span>
                  </div>
                  
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Penyiraman:</span>
                    <br />
                    <span style={{ color: "#374151" }}>
                      {p.watering ||
                        ((p as any).watering_frequency
                          ? `${(p as any).watering_frequency.value} kali per ${(p as any).watering_frequency.period}`
                          : "-")}
                    </span>
                  </div>

                  {(p as any).watering_frequency?.notes && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ fontWeight: 700, color: "#047857" }}>Catatan Penyiraman:</span>
                      <br />
                      <span style={{ color: "#374151" }}>{(p as any).watering_frequency.notes}</span>
                    </div>
                  )}
                  
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Hama:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{toList(p.insects).join(", ") || "-"}</span>
                  </div>
                  
                  <div>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Penyakit:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{toList(p.diseases).join(", ") || "-"}</span>
                  </div>
                  
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ fontWeight: 700, color: "#047857" }}>Penggunaan:</span>
                    <br />
                    <span style={{ color: "#374151" }}>{toList(p.use).join(", ") || "-"}</span>
                  </div>
                </div>

                {/* Care Tips */}
                {(p as any).care_tips && (p as any).care_tips.length > 0 && (
                  <div style={{ 
                    marginTop: 24, 
                    padding: 16,
                    background: "#ecfdf5",
                    borderRadius: 8,
                    border: "1px solid #a7f3d0"
                  }}>
                    <div style={{ fontWeight: 700, color: "#047857", marginBottom: 8 }}>
                      Tips Perawatan:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: "#374151" }}>
                      {(p as any).care_tips.map((tip: string, i: number) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ⭐ FIXED: MBTI Section - Now shows correctly */}
                {mbtiValue && (
                  <div style={{ 
                    marginTop: 24, 
                    padding: 20,
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    borderRadius: 12,
                    border: "2px solid #6ee7b7",
                    boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.1)"
                  }}>
                    <div style={{ 
                      fontSize: 18,
                      fontWeight: 700, 
                      color: "#065f46",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <span>🧠</span>
                      Kepribadian MBTI:
                    </div>
                    <div style={{ 
                      fontSize: 24,
                      fontWeight: 800, 
                      color: "#047857",
                      letterSpacing: "1px"
                    }}>
                      {mbtiValue}
                    </div>
                  </div>
                )}

                {/* Branding footer */}
                <div
                  style={{
                    marginTop: 32,
                    borderTop: "2px solid #d1fae5",
                    paddingTop: 16,
                    textAlign: "center",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  © 2025 <span style={{ color: "#047857", fontWeight: 700 }}>PlantMatch</span> – Find the Plant That Fits You
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}