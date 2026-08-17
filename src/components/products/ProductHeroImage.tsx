"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

interface ProductHeroImageProps {
  imageUrl: string;
  brand: string;
  name: string;
  slug: string;
  isRare?: boolean;
}

export function ProductHeroImage({
  imageUrl,
  brand,
  name,
  slug,
  isRare = false,
}: ProductHeroImageProps) {
  const [currentSrc, setCurrentSrc] = useState(imageUrl || "/placeholder-fashion.svg");
  const [hasError, setHasError] = useState(false);
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const getCleanSlugBase = (s: string) => {
    return s.replace(/-\d+$/, "").replace(/[^a-z0-9-]+/g, "");
  };

  const handleImageError = () => {
    if (fallbackLevel === 0) {
      // 1. Try sheet preview JPG if local PNG was not found
      setFallbackLevel(1);
      const baseSlug = getCleanSlugBase(slug);
      setCurrentSrc(`/products/sheet_previews/${baseSlug}.jpg`);
    } else if (fallbackLevel === 1) {
      // 2. Try proxy or direct jsDelivr
      setFallbackLevel(2);
      if (imageUrl.startsWith("http")) {
        setCurrentSrc(`/api/admin/sheet-image-proxy?url=${encodeURIComponent(imageUrl)}`);
      } else if (imageUrl.startsWith("/products/")) {
        setCurrentSrc(`https://cdn.jsdelivr.net/gh/Avoid3871/archive-finds@main/public${imageUrl}`);
      } else {
        setCurrentSrc("/placeholder-fashion.svg");
        setHasError(true);
      }
    } else {
      // 3. Final fallback
      setFallbackLevel(3);
      setCurrentSrc("/placeholder-fashion.svg");
      setHasError(true);
    }
  };

  return (
    <div
      className={`relative aspect-[3/4] w-full bg-neutral-900/40 border border-neutral-800/80 rounded-xl overflow-hidden group select-none transition-all duration-300 ${
        isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
      }`}
      onClick={() => setIsZoomed(!isZoomed)}
    >
      {/* Background subtle archive grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Studio Image */}
      <div className="relative w-full h-full flex items-center justify-center p-6 sm:p-10">
        <img
          src={currentSrc}
          alt={`${brand} - ${name}`}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className={`max-w-full max-h-full object-contain filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out ${
            isZoomed
              ? "scale-150 transform-gpu z-30"
              : "group-hover:scale-[1.04] scale-100"
          }`}
        />
      </div>

      {/* RARE ARCHIVE Badge */}
      {isRare && (
        <div className="absolute top-4 left-4 z-10">
          <span className="px-2.5 py-1 bg-black text-white text-[10px] font-mono tracking-widest uppercase font-bold border border-neutral-700/80 shadow-lg">
            RARE ARCHIVE
          </span>
        </div>
      )}

      {/* Zoom indicator hover icon */}
      <div className="absolute bottom-4 right-4 z-10 px-2.5 py-1 bg-black/70 backdrop-blur-md border border-neutral-800 text-[10px] font-mono uppercase text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 rounded">
        <ZoomIn className="w-3 h-3 text-emerald-400" />
        <span>{isZoomed ? "Click to Reset" : "Click to Inspect"}</span>
      </div>
    </div>
  );
}
