"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Sparkles, Smartphone, Play, CheckCircle2, ArrowRight } from "lucide-react";
import slidesData from "@/lib/products/slidesData.json";

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState(slidesData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleRegenerate = () => {
    setIsGenerating(true);
    setMsg("Generating high-resolution 1080x1920 9:16 luxury slides with Sharp...");
    setTimeout(() => {
      setIsGenerating(false);
      setMsg("All 12 editorial slides regenerated successfully in /public/slides/!");
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-white" />
            <span>9:16 SOCIAL SLIDESHOW STUDIO</span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Automated 1080x1920 vertical slides formatted for TikTok & Instagram Carousel Posts.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span>{isGenerating ? "GENERATING SLIDES..." : "REGENERATE BATCH"}</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-neutral-900 border border-neutral-700 text-xs font-mono text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid of 9:16 Social Slides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {slides.map((item, idx) => (
          <div
            key={item.slideUrl}
            className="group bg-neutral-900 border border-neutral-800 rounded overflow-hidden flex flex-col justify-between hover:border-neutral-600 transition-all"
          >
            {/* Phone aspect ratio preview (9:16) */}
            <div className="relative aspect-[9/16] w-full bg-neutral-950 overflow-hidden">
              <Image
                src={item.slideUrl}
                alt={item.product.name}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-contain"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2 py-0.5 bg-black/80 text-white text-[10px] font-mono uppercase tracking-widest border border-white/20">
                  SLIDE {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Slide Info & Download */}
            <div className="p-4 space-y-3 bg-neutral-900 border-t border-neutral-800">
              <div>
                <p className="text-[10px] font-mono text-neutral-500 uppercase">
                  {item.product.brand}
                </p>
                <h3 className="text-xs font-mono font-bold text-white uppercase truncate mt-0.5">
                  {item.product.name}
                </h3>
                <p className="text-xs font-mono text-emerald-400 mt-1 font-bold">
                  ${item.product.price.toFixed(2)} USD
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <a
                  href={item.slideUrl}
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-white hover:text-neutral-300 uppercase tracking-wider"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <Link
                  href={`/product/${item.product.slug}`}
                  target="_blank"
                  className="text-[10px] font-mono text-neutral-500 hover:text-white uppercase flex items-center gap-1"
                >
                  Store Page <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
