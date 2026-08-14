"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Share2,
  ExternalLink,
  Flame,
  Tag,
  Hash,
  Play
} from "lucide-react";
import carouselPacks from "@/lib/products/carouselPacks.json";
import slidesData from "@/lib/products/slidesData.json";

export default function AdminSlidesPage() {
  const [activeTab, setActiveTab] = useState<"packs" | "single">("packs");
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadingBatch, setDownloadingBatch] = useState(false);

  const currentPack = carouselPacks[selectedPackIndex] || carouselPacks[0];
  const currentSlide = currentPack.slides[currentSlideIndex] || currentPack.slides[0];

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % currentPack.slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) =>
      prev === 0 ? currentPack.slides.length - 1 : prev - 1
    );
  };

  const handleSelectPack = (idx: number) => {
    setSelectedPackIndex(idx);
    setCurrentSlideIndex(0);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(currentPack.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleDownloadAllInPack = async () => {
    setDownloadingBatch(true);
    for (let i = 0; i < currentPack.slides.length; i++) {
      const slide = currentPack.slides[i];
      const link = document.createElement("a");
      link.href = slide.slideUrl;
      link.download = `Slide_${String(i + 1).padStart(2, "0")}_${currentPack.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Small pause between downloads to avoid browser block
      await new Promise((r) => setTimeout(r, 200));
    }
    setTimeout(() => setDownloadingBatch(false), 1000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-2">
            <Flame className="w-3 h-3 fill-emerald-400" />
            VIRAL CONTENT PIPELINE // 9:16 HIGH-RES EXPORT
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-white" />
            <span>SOCIAL MEDIA SLIDESHOW STUDIO</span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Automated 1080x1920 TikTok & Instagram Carousel Packs with Hook Covers, Grail Slides & Outro CTAs.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1">
          <button
            onClick={() => setActiveTab("packs")}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "packs"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ready-to-Post Packs ({carouselPacks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "single"
                ? "bg-white text-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>Single Slides ({slidesData.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "packs" ? (
        <div className="space-y-8">
          {/* Pack Selector Carousel Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {carouselPacks.map((pack, idx) => (
              <button
                key={pack.id}
                onClick={() => handleSelectPack(idx)}
                className={`p-3 text-left border transition-all flex flex-col justify-between h-32 rounded ${
                  selectedPackIndex === idx
                    ? "bg-neutral-800 border-white text-white ring-1 ring-white"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                }`}
              >
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 block">
                    {pack.vol} • {pack.slideCount} SLIDES
                  </span>
                  <h2 className="font-mono font-bold text-xs uppercase line-clamp-2 mt-1 text-white">
                    {pack.title}
                  </h2>
                </div>
                <span className="text-[9px] font-mono text-neutral-500 uppercase">
                  {pack.badgeText}
                </span>
              </button>
            ))}
          </div>

          {/* Main Pack Showcase: Interactive Phone Previewer & Posting Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: 9:16 Interactive Mobile Frame (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[360px] aspect-[9/16] bg-neutral-950 border-2 border-neutral-800 rounded-2xl overflow-hidden shadow-2xl group">
                <Image
                  src={currentSlide.slideUrl}
                  alt={currentSlide.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-contain"
                />

                {/* Top Overlay Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                  <span className="px-2.5 py-1 bg-black/85 backdrop-blur-md text-white text-[10px] font-mono tracking-widest uppercase border border-white/20">
                    SLIDE {String(currentSlideIndex + 1).padStart(2, "0")} / {String(currentPack.slides.length).padStart(2, "0")}
                  </span>
                  <span className="px-2 py-0.5 bg-white text-black text-[9px] font-mono tracking-wider uppercase font-bold">
                    {currentSlide.type.toUpperCase()}
                  </span>
                </div>

                {/* Left & Right Clickable Navigation Hitboxes */}
                <button
                  onClick={handlePrevSlide}
                  aria-label="Previous Slide"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black border border-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  aria-label="Next Slide"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black border border-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Bottom Dot Indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none">
                  {currentPack.slides.map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`h-1.5 rounded-full transition-all ${
                        currentSlideIndex === dotIdx
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Slide Navigation Buttons */}
              <div className="flex items-center justify-between w-full max-w-[360px] mt-4">
                <button
                  onClick={handlePrevSlide}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs font-mono text-neutral-400">
                  {currentSlide.title.slice(0, 20)}...
                </span>
                <button
                  onClick={handleNextSlide}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Pack Metadata, Caption & 1-Click Batch Exporter (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Pack Title & Value Prop */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                      {currentPack.vol} • READY-TO-POST CAROUSEL
                    </span>
                    <h2 className="text-xl sm:text-2xl font-mono font-black uppercase text-white mt-0.5">
                      {currentPack.title}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 bg-white text-black font-mono text-[10px] uppercase font-bold">
                    {currentPack.badgeText}
                  </span>
                </div>

                {/* One-Click Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDownloadAllInPack}
                    disabled={downloadingBatch}
                    className="px-4 py-3.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {downloadingBatch
                        ? "DOWNLOADING ALL 7 SLIDES..."
                        : `DOWNLOAD ALL 7 SLIDES (${currentPack.vol})`}
                    </span>
                  </button>

                  <a
                    href={currentSlide.slideUrl}
                    download
                    className="px-4 py-3.5 bg-neutral-950 text-white border border-neutral-700 font-mono text-xs font-bold uppercase tracking-wider hover:border-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-neutral-400" />
                    <span>DOWNLOAD CURRENT SLIDE #{currentSlideIndex + 1}</span>
                  </a>
                </div>
              </div>

              {/* Ready-to-Copy Post Caption & Viral Hashtags */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold">
                      Viral TikTok & IG Caption
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyCaption}
                    className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono uppercase tracking-wider hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
                  >
                    {copiedCaption ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED TO CLIPBOARD!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY CAPTION & HASHTAGS</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {currentPack.caption}
                </div>
              </div>

              {/* Curated Pieces in this Pack */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  Pieces Included in this Pack ({currentPack.products.length} Items)
                </h3>

                <div className="divide-y divide-neutral-800">
                  {currentPack.products.map((p: any, pIdx: number) => (
                    <div
                      key={p.id}
                      className="py-2.5 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-neutral-500 text-[10px]">
                          0{pIdx + 2}
                        </span>
                        <div>
                          <p className="font-bold text-white uppercase">{p.name}</p>
                          <p className="text-[10px] text-neutral-500 uppercase">
                            {p.brand}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400">
                          ${p.price.toFixed(2)}
                        </span>
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="text-neutral-400 hover:text-white p-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standalone Single Slides View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {slidesData.map((item, idx) => (
            <div
              key={item.slideUrl}
              className="group bg-neutral-900 border border-neutral-800 rounded overflow-hidden flex flex-col justify-between hover:border-neutral-600 transition-all"
            >
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
                    SLIDE {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-neutral-900 border-t border-neutral-800">
                <div>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase">
                    {item.product.brand}
                  </p>
                  <h2 className="text-xs font-mono font-bold text-white uppercase truncate mt-0.5">
                    {item.product.name}
                  </h2>
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
                    Store Page <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
