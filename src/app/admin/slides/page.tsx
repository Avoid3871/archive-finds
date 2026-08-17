"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Smartphone,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  ExternalLink,
  Flame,
  Hash,
  Sparkles,
  Palette,
  Eye,
  Sliders,
  Wand2,
  RefreshCw,
  Tag,
  FolderOpen,
  Shuffle,
  Clock,
  Search,
  CheckSquare,
  Square,
  X,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import allProductsData from "@/lib/products/sheetProducts.json";
import carouselPacks from "@/lib/products/carouselPacks.json";

type SlideStyle = "viral_minimal" | "editorial_dark" | "minimal_dark";
type GeneratorMode = "latest" | "brand" | "category" | "random" | "custom";

interface GeneratedPack {
  id: string;
  title: string;
  rawTitle: string;
  mode: string;
  slideCount: number;
  productCount: number;
  productIds: string[];
  products: any[];
  caption: string;
  createdAt: string;
  styles: {
    viral_minimal: any[];
    editorial_dark: any[];
    minimal_dark: any[];
  };
  slides: any[];
}

const STYLE_DEFINITIONS: {
  id: SlideStyle;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    id: "viral_minimal",
    label: "Viral Minimal (White)",
    badge: "PRIMARY // VIRAL HOOK",
    description: "Ultra-clean white canvas, bold centered headline, garment cutout.",
  },
  {
    id: "editorial_dark",
    label: "Editorial Dark HUD",
    badge: "TECHWEAR // SPECS",
    description: "Dark archive HUD layout with technical specs, price tag & Sugargoo badge.",
  },
  {
    id: "minimal_dark",
    label: "Viral Minimal (Dark)",
    badge: "DARK MODE VIRAL",
    description: "Deep black minimalist canvas, bold white centered typography & garment focus.",
  },
];

const POPULAR_BRANDS = [
  "Rick Owens",
  "Balenciaga",
  "Chrome Hearts",
  "Undercover",
  "Enfants Riches Déprimés",
  "Maison Margiela",
  "Vivienne Westwood",
  "Number (N)ine",
  "Arcteryx",
  "Kapital",
  "Vetements",
  "Raf Simons",
  "Stussy",
  "Prada",
];

const CATEGORIES = [
  "Outerwear",
  "Hoodies",
  "T-Shirts",
  "Denim",
  "Pants",
  "Footwear",
  "Accessories",
  "Bags",
  "Jewelry",
];

export default function AdminSlidesPage() {
  const [activeTab, setActiveTab] = useState<"generator" | "preset_packs" | "history">("generator");
  const [selectedStyle, setSelectedStyle] = useState<SlideStyle>("viral_minimal");

  // Generator Configuration State
  const [genMode, setGenMode] = useState<GeneratorMode>("latest");
  const [selectedBrand, setSelectedBrand] = useState<string>("Rick Owens");
  const [selectedCategory, setSelectedCategory] = useState<string>("Outerwear");
  const [slideItemCount, setSlideItemCount] = useState<number>(5); // Number of garment items (pack will be items + 2 slides)
  const [customTitle, setCustomTitle] = useState<string>("");
  const [selectedCustomProductIds, setSelectedCustomProductIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active Pack / Display State
  const [activePack, setActivePack] = useState<GeneratedPack | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

  // History & Custom Modal
  const [generationHistory, setGenerationHistory] = useState<GeneratedPack[]>([]);
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState<boolean>(false);
  const [customSearchQuery, setCustomSearchQuery] = useState<string>("");
  const [customCategoryFilter, setCustomCategoryFilter] = useState<string>("ALL");

  // Preset Packs fallback
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // Load generation history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/admin/slides/generate");
      const data = await res.json();
      if (data.success && Array.isArray(data.history) && data.history.length > 0) {
        setGenerationHistory(data.history);
        if (!activePack) {
          setActivePack(data.history[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch slides history:", e);
    }
  };

  // Determine current pack and current slides
  const currentPackSlides = useMemo(() => {
    if (activeTab === "preset_packs") {
      const preset = carouselPacks[selectedPresetIndex] || carouselPacks[0];
      return (preset as any).styles?.[selectedStyle] || preset.slides || [];
    }
    if (activePack) {
      return activePack.styles?.[selectedStyle] || activePack.slides || [];
    }
    return [];
  }, [activeTab, selectedPresetIndex, activePack, selectedStyle]);

  const currentSlide = currentPackSlides[currentSlideIndex] || currentPackSlides[0] || {
    slideUrl: "/slides/packs/viral_minimal/pack_erd-grails_01_cover.jpg",
    title: "Cover Slide",
    type: "cover",
  };

  const handleNextSlide = useCallback(() => {
    if (currentPackSlides.length > 0) {
      setCurrentSlideIndex((prev) => (prev + 1) % currentPackSlides.length);
    }
  }, [currentPackSlides.length]);

  const handlePrevSlide = useCallback(() => {
    if (currentPackSlides.length > 0) {
      setCurrentSlideIndex((prev) => (prev === 0 ? currentPackSlides.length - 1 : prev - 1));
    }
  }, [currentPackSlides.length]);

  // Keyboard navigation for phone preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNextSlide();
      if (e.key === "ArrowLeft") handlePrevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextSlide, handlePrevSlide]);

  // Generate New Viral Slide Pack Action
  const handleGeneratePack = async (overrideMode?: GeneratorMode) => {
    const modeToUse = overrideMode || genMode;
    setIsGenerating(true);

    try {
      const payload = {
        mode: modeToUse,
        brand: selectedBrand,
        category: selectedCategory,
        productIds: Array.from(selectedCustomProductIds),
        count: slideItemCount,
        title: customTitle.trim() || undefined,
        style: selectedStyle,
      };

      const res = await fetch("/api/admin/slides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.pack) {
        setActivePack(data.pack);
        setCurrentSlideIndex(0);
        setActiveTab("generator");
        fetchHistory();
      } else {
        alert(`Generation failed: ${data.error || "Unknown error"}`);
      }
    } catch (e: any) {
      alert(`Network error during generation: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Viral Caption to Clipboard
  const handleCopyCaption = () => {
    const textToCopy =
      activeTab === "preset_packs"
        ? carouselPacks[selectedPresetIndex]?.caption || ""
        : activePack?.caption || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    }
  };

  // Download All Slides as a single clean ZIP
  const handleDownloadZip = async () => {
    if (!currentPackSlides.length) return;
    setDownloadingZip(true);

    try {
      const slideUrls = currentPackSlides.map((s: any) => s.slideUrl);
      const title =
        activeTab === "preset_packs"
          ? carouselPacks[selectedPresetIndex]?.id || "ArchivePack"
          : activePack?.title || "ArchivePack";

      const res = await fetch("/api/admin/slides/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideUrls,
          packTitle: `${title}_${selectedStyle}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create ZIP package");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ArchiveFinds_${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${selectedStyle}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      // Fallback: sequential browser download
      for (let i = 0; i < currentPackSlides.length; i++) {
        const slide = currentPackSlides[i];
        const link = document.createElement("a");
        link.href = slide.slideUrl;
        link.download = `Slide_${String(i + 1).padStart(2, "0")}_${selectedStyle}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      setDownloadingZip(false);
    }
  };

  // Suggested Quick Titles
  const suggestTitle = (text: string) => {
    setCustomTitle(text);
  };

  // Filtered Products for Custom Selection Modal
  const filteredProducts = useMemo(() => {
    return allProductsData.filter((p: any) => {
      if (customCategoryFilter !== "ALL" && p.category !== customCategoryFilter) return false;
      if (customSearchQuery.trim()) {
        const q = customSearchQuery.toLowerCase();
        const brandMatch = (p.brand || "").toLowerCase().includes(q);
        const nameMatch = (p.name || p.title || "").toLowerCase().includes(q);
        return brandMatch || nameMatch;
      }
      return true;
    });
  }, [customCategoryFilter, customSearchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* HEADER HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-2 rounded">
            <Flame className="w-3 h-3 fill-emerald-400" />
            <span>VIRAL CONTENT PIPELINE 2.0 // SMART SOCIAL ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-white" />
            <span>SOCIAL SLIDESHOW STUDIO 2.0</span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Generate unlimited viral 1080x1920 TikTok & Instagram Carousels on demand from your {allProductsData.length}+ live verified archive pieces.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-md ${
              activeTab === "generator"
                ? "bg-white text-black shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dynamic Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("preset_packs")}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-md ${
              activeTab === "preset_packs"
                ? "bg-white text-black shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Preset Packs ({carouselPacks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-md ${
              activeTab === "history"
                ? "bg-white text-black shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({generationHistory.length})</span>
          </button>
        </div>
      </div>

      {/* STYLE SWITCHER CONTROL BAR */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              SELECT POST STYLE / TEMPLATE:
            </h2>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Active: <strong className="text-white uppercase">{selectedStyle.replace("_", " ")}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STYLE_DEFINITIONS.map((def) => {
            const isSelected = selectedStyle === def.id;
            return (
              <button
                key={def.id}
                onClick={() => setSelectedStyle(def.id)}
                className={`p-3.5 text-left border rounded-xl transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-neutral-800 border-white text-white ring-2 ring-white/40 shadow-md"
                    : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-black uppercase text-white flex items-center gap-1.5">
                    {def.id === "viral_minimal" && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    {def.id === "editorial_dark" && <Sliders className="w-3.5 h-3.5 text-emerald-400" />}
                    {def.id === "minimal_dark" && <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                    {def.label}
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 bg-white text-black text-[9px] font-mono font-bold uppercase rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {def.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN VIEW TABS */}
      {activeTab === "generator" && (
        <div className="space-y-8">
          {/* DYNAMIC GENERATOR CONTROL PANEL */}
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-emerald-400" />
                  <span>Dynamic Carousel Creator</span>
                </h3>
                <p className="text-xs font-mono text-neutral-500">
                  Pick a topic mode, choose slide count, or customize titles to render fresh viral social media carousels.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGeneratePack("random")}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-mono text-xs uppercase rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Generate a completely random unique mix of grails"
                >
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Random Grail Mix</span>
                </button>
              </div>
            </div>

            {/* Mode Selector Cards */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-neutral-300">
                1. Select Topic / Curation Mode:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: "latest", label: "🔥 Latest Drops", desc: "Most recently cataloged" },
                  { id: "brand", label: "🏷️ Brand Theme", desc: "Single designer focus" },
                  { id: "category", label: "🧥 Category", desc: "Jackets, Pants, Boots..." },
                  { id: "random", label: "🎲 Random Mix", desc: "Fresh deduplicated grails" },
                  { id: "custom", label: "✍️ Custom Pick", desc: `${selectedCustomProductIds.size} pieces picked` },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setGenMode(m.id as GeneratorMode);
                      if (m.id === "custom" && selectedCustomProductIds.size === 0) {
                        setIsCustomPickerOpen(true);
                      }
                    }}
                    className={`p-3 text-left border rounded-xl transition-all ${
                      genMode === m.id
                        ? "bg-neutral-800 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    <span className="block font-mono text-xs font-bold text-white mb-0.5">
                      {m.label}
                    </span>
                    <span className="block font-mono text-[10px] text-neutral-500 truncate">
                      {m.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Parameters Config */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Brand Selector (if brand mode) */}
              {genMode === "brand" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-400">
                    Target Brand / Designer:
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    {POPULAR_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Selector (if category mode) */}
              {genMode === "category" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-400">
                    Target Category:
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Picker Trigger Button (if custom mode) */}
              {genMode === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-400">
                    Custom Pieces:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomPickerOpen(true)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded-lg text-xs font-mono text-emerald-400 flex items-center justify-between transition-colors"
                  >
                    <span>{selectedCustomProductIds.size} Pieces Selected</span>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Slide Count Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-neutral-400">
                    Garment Slides:
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {slideItemCount} Items (+2 for Cover & Outro = {slideItemCount + 2} Total Slides)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[3, 5, 7, 10].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSlideItemCount(cnt)}
                      className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors ${
                        slideItemCount === cnt
                          ? "bg-white text-black border-white"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {cnt} Pieces
                    </button>
                  ))}
                </div>
              </div>

              {/* Slide Count Slider */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="text-[10px] font-mono text-neutral-500 uppercase">
                  Fine Tune Count (3–12):
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={slideItemCount}
                  onChange={(e) => setSlideItemCount(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Hook / Headline Input */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-neutral-300">
                  2. Custom Viral Hook / Title (Optional - Auto-generated if empty):
                </label>
                <span className="text-[10px] font-mono text-neutral-500">
                  Use \n to split across 2 lines
                </span>
              </div>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. TOP 5 RICK OWENS\nGRAILS UNDER $100"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Quick Suggestion Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
                <span className="text-neutral-500 shrink-0">⚡ Quick Hooks:</span>
                {[
                  `TOP ${slideItemCount} ARCHIVE FINDS\nUNDER $100`,
                  `5 RICK OWENS GRAILS\nYOU MISSED`,
                  `THE BEST ARCHIVE\nJACKETS THIS SEASON`,
                  `UNDERCOVER GRAILS\nNO ONE TALKS ABOUT`,
                  `TOP ${slideItemCount} STREETWEAR\nGRAILS OF ALL TIME`,
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => suggestTitle(sug)}
                    className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    {sug.replace(/\n/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleGeneratePack()}
                disabled={isGenerating}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>RENDERING 1080x1920 SHARP SLIDES ({selectedStyle.toUpperCase()})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>GENERATE NEW VIRAL CAROUSEL PACK ({slideItemCount + 2} SLIDES)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MAIN PACK SHOWCASE: PHONE PREVIEW & POSTING CONSOLE */}
          {activePack && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: 9:16 Interactive Mobile Frame (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[360px] aspect-[9/16] bg-neutral-950 border-2 border-neutral-800 rounded-2xl overflow-hidden shadow-2xl group">
                  <Image
                    key={`${currentSlide.slideUrl}_${selectedStyle}_${currentSlideIndex}`}
                    src={currentSlide.slideUrl}
                    alt={currentSlide.title || "Slide Preview"}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-contain bg-black"
                  />

                  {/* Top Overlay Badge */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                    <span className="px-2.5 py-1 bg-black/85 backdrop-blur-md text-white text-[10px] font-mono tracking-widest uppercase border border-white/20 rounded">
                      SLIDE {String(currentSlideIndex + 1).padStart(2, "0")} / {String(currentPackSlides.length).padStart(2, "0")}
                    </span>
                    <span className="px-2 py-0.5 bg-white text-black text-[9px] font-mono tracking-wider uppercase font-bold rounded">
                      {currentSlide.type?.toUpperCase() || "SLIDE"}
                    </span>
                  </div>

                  {/* Left & Right Clickable Navigation Hitboxes */}
                  <button
                    onClick={handlePrevSlide}
                    aria-label="Previous Slide"
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    aria-label="Next Slide"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Bottom Dot Indicators */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none">
                    {currentPackSlides.map((_: any, dotIdx: number) => (
                      <span
                        key={dotIdx}
                        className={`h-1.5 rounded-full transition-all ${
                          currentSlideIndex === dotIdx
                            ? "w-6 bg-white shadow"
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
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase flex items-center gap-1 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-xs font-mono text-neutral-400 truncate max-w-[180px]">
                    {currentSlide.title}
                  </span>
                  <button
                    onClick={handleNextSlide}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase flex items-center gap-1 rounded-lg"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: Pack Metadata, Caption & 1-Click Batch Exporter (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Pack Title & 1-Click Action Hub */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                        {activePack.slideCount} SLIDES • {selectedStyle.toUpperCase().replace("_", " ")}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-mono font-black uppercase text-white mt-0.5">
                        {activePack.title}
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 bg-white text-black font-mono text-[10px] uppercase font-bold rounded">
                      READY TO POST
                    </span>
                  </div>

                  {/* One-Click Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleDownloadZip}
                      disabled={downloadingZip}
                      className="px-4 py-3.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {downloadingZip
                          ? "PACKING ZIP ARCHIVE..."
                          : `DOWNLOAD ALL ${activePack.slideCount} SLIDES (ZIP)`}
                      </span>
                    </button>

                    <a
                      href={currentSlide.slideUrl}
                      download={`Slide_${String(currentSlideIndex + 1).padStart(2, "0")}_${activePack.id}_${selectedStyle}.jpg`}
                      className="px-4 py-3.5 bg-neutral-950 text-white border border-neutral-700 font-mono text-xs font-bold uppercase tracking-wider hover:border-white transition-colors flex items-center justify-center gap-2 rounded-xl text-center"
                    >
                      <Download className="w-4 h-4 text-neutral-400" />
                      <span>DOWNLOAD CURRENT SLIDE #{currentSlideIndex + 1}</span>
                    </a>
                  </div>
                </div>

                {/* Ready-to-Copy Viral Caption */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold">
                        Viral TikTok & Instagram Caption
                      </h3>
                    </div>
                    <button
                      onClick={handleCopyCaption}
                      className="px-3.5 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono uppercase tracking-wider hover:bg-emerald-900 transition-colors flex items-center gap-1.5 rounded-lg cursor-pointer font-bold"
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

                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {activePack.caption}
                  </div>
                </div>

                {/* Curated Pieces in this Pack */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-3 shadow-xl">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                    Pieces Included in this Pack ({activePack.products.length} Items)
                  </h3>

                  <div className="divide-y divide-neutral-800 max-h-60 overflow-y-auto">
                    {activePack.products.map((p: any, pIdx: number) => {
                      const priceVal = typeof p.price === "number" ? p.price : parseFloat(p.price) || 49;
                      return (
                        <div
                          key={p.id || pIdx}
                          className="py-2.5 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-neutral-500 text-[10px]">
                              0{pIdx + 2}
                            </span>
                            <div>
                              <p className="font-bold text-white uppercase">{p.title || p.name}</p>
                              <p className="text-[10px] text-neutral-500 uppercase">
                                {p.brand}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-400">
                              ${priceVal.toFixed(2)}
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
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRESET PACKS TAB */}
      {activeTab === "preset_packs" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {carouselPacks.map((pack, idx) => (
              <button
                key={pack.id}
                onClick={() => {
                  setSelectedPresetIndex(idx);
                  setCurrentSlideIndex(0);
                }}
                className={`p-3 text-left border transition-all flex flex-col justify-between h-32 rounded-xl ${
                  selectedPresetIndex === idx
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

          {/* Preset Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[360px] aspect-[9/16] bg-neutral-950 border-2 border-neutral-800 rounded-2xl overflow-hidden shadow-2xl group">
                <Image
                  key={`${currentSlide.slideUrl}_${selectedStyle}`}
                  src={currentSlide.slideUrl}
                  alt={currentSlide.title || "Slide Preview"}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-contain bg-black"
                />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                  <span className="px-2.5 py-1 bg-black/85 backdrop-blur-md text-white text-[10px] font-mono tracking-widest uppercase border border-white/20 rounded">
                    SLIDE {String(currentSlideIndex + 1).padStart(2, "0")} / {String(currentPackSlides.length).padStart(2, "0")}
                  </span>
                  <span className="px-2 py-0.5 bg-white text-black text-[9px] font-mono tracking-wider uppercase font-bold rounded">
                    {currentSlide.type?.toUpperCase() || "SLIDE"}
                  </span>
                </div>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between w-full max-w-[360px] mt-4">
                <button
                  onClick={handlePrevSlide}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase flex items-center gap-1 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs font-mono text-neutral-400 truncate max-w-[180px]">
                  {currentSlide.title}
                </span>
                <button
                  onClick={handleNextSlide}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase flex items-center gap-1 rounded-lg"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
                <h2 className="text-xl sm:text-2xl font-mono font-black uppercase text-white">
                  {carouselPacks[selectedPresetIndex]?.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                    className="px-4 py-3.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 rounded-xl"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD ALL SLIDES (ZIP)</span>
                  </button>
                  <a
                    href={currentSlide.slideUrl}
                    download={`Slide_${currentSlideIndex + 1}.jpg`}
                    className="px-4 py-3.5 bg-neutral-950 text-white border border-neutral-700 font-mono text-xs font-bold uppercase tracking-wider hover:border-white transition-colors flex items-center justify-center gap-2 rounded-xl text-center"
                  >
                    <Download className="w-4 h-4 text-neutral-400" />
                    <span>DOWNLOAD CURRENT SLIDE</span>
                  </a>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold">
                    Caption & Hashtags
                  </span>
                  <button
                    onClick={handleCopyCaption}
                    className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono uppercase rounded-lg"
                  >
                    {copiedCaption ? "COPIED!" : "COPY CAPTION"}
                  </button>
                </div>
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 whitespace-pre-wrap">
                  {carouselPacks[selectedPresetIndex]?.caption}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GENERATION HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Generation History ({generationHistory.length} Packs)</span>
            </h3>
            <span className="text-xs font-mono text-neutral-500">
              Reload and inspect previous AI-generated slide packs
            </span>
          </div>

          {generationHistory.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
              <Sparkles className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="font-mono text-xs text-neutral-400">
                No slide packs generated yet. Use the Dynamic Studio to generate your first pack!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generationHistory.map((pack) => (
                <div
                  key={pack.id}
                  className="p-5 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-all rounded-2xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span className="uppercase text-emerald-400 font-bold">{pack.mode} MODE</span>
                      <span>{new Date(pack.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-mono text-sm font-bold text-white uppercase">
                      {pack.title}
                    </h4>
                    <p className="font-mono text-xs text-neutral-400">
                      {pack.productCount} Garments • {pack.slideCount} 9:16 Slides
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActivePack(pack);
                        setCurrentSlideIndex(0);
                        setActiveTab("generator");
                      }}
                      className="px-3.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 font-mono text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open in Studio</span>
                    </button>
                    <span className="text-[10px] font-mono text-neutral-500">
                      3 Styles Ready
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CUSTOM PRODUCT SELECTION MODAL */}
      {isCustomPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Select Custom Pieces ({selectedCustomProductIds.size} Selected)
                </span>
              </div>
              <button
                onClick={() => setIsCustomPickerOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 shrink-0 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  placeholder="Search by brand or title..."
                  className="w-full pl-9 pr-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "Outerwear", "Hoodies", "T-Shirts", "Denim", "Pants", "Footwear", "Accessories"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCustomCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-colors whitespace-nowrap ${
                      customCategoryFilter === cat
                        ? "bg-white text-black font-bold border-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950/40">
              {filteredProducts.map((p: any) => {
                const idStr = String(p.id || p.slug);
                const isSelected = selectedCustomProductIds.has(idStr);
                const priceVal = typeof p.price === "number" ? p.price : parseFloat(p.price) || 49;
                return (
                  <div
                    key={idStr}
                    onClick={() => {
                      setSelectedCustomProductIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(idStr)) next.delete(idStr);
                        else next.add(idStr);
                        return next;
                      });
                    }}
                    className={`p-3 bg-neutral-900 border rounded-xl cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="relative aspect-square bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center p-2">
                        {p.imageUrl || p.localImage ? (
                          <img
                            src={p.localImage || p.imageUrl}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-600">No Photo</span>
                        )}
                        <span className="absolute top-1.5 left-1.5 p-1 bg-black/80 rounded border border-neutral-700">
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-neutral-500" />
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold truncate block">
                        {p.brand}
                      </span>
                      <h5 className="font-mono text-[11px] font-bold text-white line-clamp-2">
                        {p.title || p.name}
                      </h5>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-neutral-800">
                      <span className="text-neutral-500">{p.category}</span>
                      <span className="text-white font-bold">${priceVal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 shrink-0 flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400">
                {selectedCustomProductIds.size} pieces selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomProductIds(new Set())}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-mono text-xs rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPickerOpen(false);
                    setSlideItemCount(Math.max(3, selectedCustomProductIds.size));
                  }}
                  className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase rounded-lg transition-colors"
                >
                  Done Selecting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
