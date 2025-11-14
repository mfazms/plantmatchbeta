"use client";
import { useRef } from "react";
import type { Plant } from "@/lib/types";
import { displayName } from "@/lib/types";

const RENDER_WIDTH_PX = 1500;
const INLINE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
       <rect width="100%" height="100%" fill="#ffffff"/>
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
    const maxH = 420;

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

  const preloadImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(async (img) => {
        if (img.complete && (img as HTMLImageElement).naturalWidth > 0) return;
        const data = img.getAttribute("data-candidates");
        if (!data) return;
        try {
          await tryLoadImage(img as HTMLImageElement, JSON.parse(data));
        } catch {
          (img as HTMLImageElement).src = INLINE_PLACEHOLDER;
        }
      })
    );
  };

  const handleExport = async () => {
    if (!ref.current) return;
    const html2pdf = (await import("html2pdf.js")).default;

    await preloadImages(ref.current);
    fitImages(ref.current);

    const opt = {
      margin: 10,
      filename: "plantify-selection.pdf",
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
        disabled={disabled}
      >
        {icon && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M19 9h-4V3H9v6H5l7 7 7-7z" />
            <path d="M5 18h14v2H5z" />
          </svg>
        )}
        {label} {plants.length ? `(${plants.length})` : ""}
      </button>

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
            return (
              <div
                key={p.id}
                style={{
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  pageBreakAfter: isLast ? "avoid" : "always",
                  padding: 24,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  marginBottom: 16,
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                {/* Header brand */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <img
                    src="/hero1.png"
                    alt="PlantMatch"
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "contain",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#0b3d2e",
                    }}
                  >
                    PlantMatch
                  </div>
                </div>

                <h2 style={{ fontSize: 28, margin: 0, color: "#0b3d2e" }}>
                  {displayName(p)}
                </h2>
                <p
                  style={{
                    margin: "6px 0 14px",
                    fontStyle: "italic",
                    color: "#374151",
                  }}
                >
                  {p.latin}
                </p>

                {/* Area gambar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    background: "#fafafa",
                    borderRadius: 10,
                    overflow: "hidden",
                    marginTop: 6,
                    marginBottom: 12,
                  }}
                >
                  <img
                    alt={p.latin}
                    data-candidates={JSON.stringify(candidates)}
                    data-fit="pdf"
                    style={{
                      display: "block",
                      borderRadius: 8,
                      background: "#fafafa",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 14,
                    fontSize: 14.5,
                    lineHeight: 1.75,
                    color: "#111",
                  }}
                >
                  <div>
                    <b>Family:</b>{" "}
                    <span style={{ color: "#374151" }}>{p.family ?? "-"}</span>
                  </div>
                  <div>
                    <b>Kategori:</b>{" "}
                    <span style={{ color: "#374151" }}>{p.category ?? "-"}</span>
                  </div>
                  <div>
                    <b>Asal/Origin:</b>{" "}
                    <span style={{ color: "#374151" }}>{p.origin ?? "-"}</span>
                  </div>
                  <div>
                    <b>Iklim:</b>{" "}
                    <span style={{ color: "#374151" }}>{p.climate ?? "-"}</span>
                  </div>
                  <div>
                    <b>Suhu ideal:</b>{" "}
                    <span style={{ color: "#374151" }}>
                      {p.tempmin?.celsius ?? "-"}°C — {p.tempmax?.celsius ?? "-"}°C (
                      {p.tempmin?.fahrenheit ?? "-"}—{p.tempmax?.fahrenheit ?? "-"}°F)
                    </span>
                  </div>
                  <div>
                    <b>Cahaya ideal:</b>{" "}
                    <span style={{ color: "#374151" }}>{p.ideallight ?? "-"}</span>
                  </div>
                  <div>
                    <b>Cahaya toleran:</b>{" "}
                    <span style={{ color: "#374151" }}>{p.toleratedlight ?? "-"}</span>
                  </div>
                  <div>
                    <b>Penyiraman:</b>{" "}
                    <span style={{ color: "#374151" }}>
                      {p.watering || 
                        ((p as any).watering_frequency 
                          ? `${(p as any).watering_frequency.value} kali per ${(p as any).watering_frequency.period}`
                          : "-"
                        )
                      }
                    </span>
                  </div>

                  {/* Catatan Penyiraman */}
                  {(p as any).watering_frequency?.notes && (
                    <div>
                      <b>Catatan Penyiraman:</b>{" "}
                      <span style={{ color: "#374151" }}>
                        {(p as any).watering_frequency.notes}
                      </span>
                    </div>
                  )}

                  <div>
                    <b>Hama:</b>{" "}
                    <span style={{ color: "#374151" }}>
                      {toList(p.insects).join(", ") || "-"}
                    </span>
                  </div>
                  <div>
                    <b>Penyakit:</b>{" "}
                    <span style={{ color: "#374151" }}>
                      {toList(p.diseases).join(", ") || "-"}
                    </span>
                  </div>
                  <div>
                    <b>Penggunaan:</b>{" "}
                    <span style={{ color: "#374151" }}>
                      {toList(p.use).join(", ") || "-"}
                    </span>
                  </div>

                  {/* Tips Perawatan */}
                  {(p as any).care_tips && (p as any).care_tips.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <b>Tips Perawatan:</b>
                      <ul style={{ 
                        margin: "4px 0 0 20px", 
                        padding: 0,
                        color: "#374151" 
                      }}>
                        {(p as any).care_tips.map((tip: string, i: number) => (
                          <li key={i} style={{ marginBottom: 3 }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* MBTI Personality */}
                  {(p as any).mbti && (
                    <div style={{ 
                      marginTop: 16, 
                      paddingTop: 12, 
                      borderTop: "1px solid #d1fae5" 
                    }}>
                      <b>Kepribadian MBTI:</b>{" "}
                      <span style={{ 
                        color: "#059669", 
                        fontWeight: 700 
                      }}>
                        {(p as any).mbti.type}
                      </span>
                      {(p as any).mbti.notes && (
                        <span style={{ color: "#374151" }}>
                          {" "}— {(p as any).mbti.notes}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Branding footer */}
                <div
                  style={{
                    marginTop: 24,
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: 8,
                    textAlign: "center",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  © 2025 <span style={{ color: "#059669", fontWeight: 600 }}>PlantMatch</span> — Find the Plant That Fits You
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}