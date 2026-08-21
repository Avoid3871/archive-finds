"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Search,
  ExternalLink,
  ShoppingBag,
  Layers,
  Flame,
  Check,
  Clipboard,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ScoredMatch {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    imageUrl: string;
    era?: string;
    style?: string;
  };
  matchScore: number;
  matchReasons: string[];
  sugargooUrl: string;
  superbuyUrl: string;
  mulebuyUrl: string;
  cnfansUrl: string;
}

interface VisualAnalysis {
  garmentCategory: string;
  identifiedPiece: string;
  likelyBrand: string;
  aesthetic: string;
  dominantColors: string[];
  keywords: string[];
  marketplaceSearchQuery: string;
}

interface GrailHunterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_FIT_PICS = [
  {
    id: "sample-ro-hoodie",
    title: "Rick Owens Mountain Hoodie",
    brand: "Rick Owens",
    category: "Tops",
    imageUrl: "/products/sheet/grid_r04_c04_image21.png",
    sampleLabel: "Rick Owens Mountain Zip-Up Hoodie",
  },
  {
    id: "sample-balenciaga-boots",
    title: "Balenciaga Alaska Boots",
    brand: "Balenciaga",
    category: "Footwear",
    imageUrl: "/products/sheet/grid_r03_c04_image17.png",
    sampleLabel: "Balenciaga Ski Alaska Boots",
  },
  {
    id: "sample-erd-tee",
    title: "ERD Punk Tee",
    brand: "Enfants Riches Déprimés",
    category: "Tops",
    imageUrl: "/products/sheet/grid_r03_c02_image34.png",
    sampleLabel: "ERD Enfants Riches Déprimés Punk T Shirt",
  },
  {
    id: "sample-vetements-skull",
    title: "Vetements Skull Shirt",
    brand: "Vetements",
    category: "Tops",
    imageUrl: "/products/sheet/grid_r03_c05_image6.png",
    sampleLabel: "Vetements Heavy Metal Skull Tee",
  },
];

export function GrailHunterModal({ isOpen, onClose }: GrailHunterModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<VisualAnalysis | null>(null);
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [marketplaceLinks, setMarketplaceLinks] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedImage(null);
    setIsScanning(false);
    setAnalysis(null);
    setMatches([]);
    setMarketplaceLinks(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const runVisualMatch = async (imageBase64?: string, sampleLabel?: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/search/visual-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageBase64 || selectedImage,
          sampleLabel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setMatches(data.matches || []);
        setMarketplaceLinks(data.marketplaceSearchLinks);
      } else {
        setErrorMsg(data.error || "Could not analyze image.");
      }
    } catch (err: any) {
      setErrorMsg("Network error connecting to AI Vision Engine.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      runVisualMatch(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Clipboard Paste Listener (Ctrl+V anywhere in modal)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!isOpen) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleSampleClick = (sample: (typeof SAMPLE_FIT_PICS)[0]) => {
    setSelectedImage(sample.imageUrl);
    runVisualMatch(undefined, sample.sampleLabel);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-black uppercase tracking-widest text-white">
                  GRAIL HUNTER // AI VISUAL REVERSE SEARCH
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-500/30">
                  AI Vision 2.0
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                Upload fit-pics, screenshots from TikTok/Instagram, or paste images to match archive grails.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload / Input Zone */}
          {!selectedImage ? (
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-8 sm:p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-emerald-400 bg-emerald-950/20"
                    : "border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                    Drag &amp; Drop Fit-Pic or Click to Upload
                  </p>
                  <p className="text-xs font-mono text-neutral-400">
                    Supports JPG, PNG, WebP • Press <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded border border-neutral-700">Ctrl+V</kbd> to paste
                  </p>
                </div>

                {/* Mobile Camera Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Snap Photo (Camera)</span>
                  </button>
                </div>
              </div>

              {/* Curated Sample Demo Grails */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Or Test with Curated Sample Grails (1-Click Demo)</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SAMPLE_FIT_PICS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSampleClick(sample)}
                      className="group relative p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-2"
                    >
                      <div className="relative aspect-square w-full bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
                        <Image
                          src={sample.imageUrl}
                          alt={sample.title}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block truncate">
                          {sample.brand}
                        </span>
                        <span className="text-xs font-mono text-white font-medium block truncate">
                          {sample.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Analysis & Match Results View */
            <div className="space-y-6">
              {/* Top Controls & Scanned Image Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Image Preview with Laser Scan Effect */}
                <div className="md:col-span-4 relative bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center gap-3">
                  <div className="relative aspect-square w-full max-w-[240px] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                    <Image
                      src={selectedImage}
                      alt="Uploaded search item"
                      fill
                      className="object-contain p-2"
                    />

                    {/* Animated Scanning Laser Line */}
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[pulse_1.5s_infinite] absolute top-1/2 -translate-y-1/2" />
                        <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-between gap-2">
                    <button
                      onClick={resetState}
                      className="flex-1 py-1.5 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>New Photo</span>
                    </button>
                  </div>
                </div>

                {/* AI Detected Traits & DNA */}
                <div className="md:col-span-8 space-y-4">
                  {isScanning ? (
                    <div className="p-8 bg-neutral-900/60 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center gap-3 py-12">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <div className="space-y-1">
                        <p className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                          Analyzing Silhouette, Fabric &amp; Runway Era...
                        </p>
                        <p className="text-xs font-mono text-neutral-400">
                          Cross-referencing against 116+ live archive catalog pieces
                        </p>
                      </div>
                    </div>
                  ) : analysis ? (
                    <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                            AI IDENTIFIED DESIGNER PIECE
                          </span>
                          <h3 className="text-base sm:text-lg font-mono font-bold text-white">
                            {analysis.identifiedPiece}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold rounded-lg uppercase">
                          {analysis.likelyBrand}
                        </span>
                      </div>

                      {/* Visual DNA Tag Chips */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-md text-[11px] font-mono text-neutral-300 flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          Category: <strong>{analysis.garmentCategory}</strong>
                        </span>
                        <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-md text-[11px] font-mono text-neutral-300 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Aesthetic: <strong>{analysis.aesthetic}</strong>
                        </span>
                        {analysis.dominantColors?.map((color) => (
                          <span
                            key={color}
                            className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-md text-[11px] font-mono text-neutral-400"
                          >
                            🎨 {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Ranked Matches from Live Catalog */}
              {!isScanning && matches.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-emerald-400" />
                      <span>Matching Pieces in Archive Catalog ({matches.length})</span>
                    </h4>
                    <span className="text-xs font-mono text-neutral-500">
                      Ranked by visual &amp; silhouette similarity
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {matches.map(({ product, matchScore, matchReasons, sugargooUrl, superbuyUrl }) => (
                      <div
                        key={product.id}
                        className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between gap-3 group transition-all"
                      >
                        <div className="space-y-3">
                          {/* Image & Confidence Badge */}
                          <div className="relative aspect-square w-full bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-mono font-black rounded uppercase shadow-lg">
                              🔥 {matchScore}% MATCH
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block truncate">
                              {product.brand}
                            </span>
                            <Link
                              href={`/product/${product.slug}`}
                              onClick={handleClose}
                              className="text-xs font-mono font-bold text-white hover:text-emerald-400 line-clamp-2 transition-colors"
                            >
                              {product.name}
                            </Link>
                            <span className="text-xs font-mono font-bold text-neutral-300 block pt-1">
                              ${product.price?.toFixed(2)} USD
                            </span>
                          </div>

                          {/* Match Reasons */}
                          <div className="space-y-1">
                            {matchReasons.map((r, i) => (
                              <span
                                key={i}
                                className="inline-block mr-1 text-[9px] font-mono text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800"
                              >
                                ✓ {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2">
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={handleClose}
                            className="flex-1 py-1.5 px-2.5 bg-white hover:bg-neutral-200 text-black rounded text-[11px] font-mono font-bold uppercase text-center transition-colors"
                          >
                            View Piece
                          </Link>
                          <a
                            href={sugargooUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-orange-950/80 hover:bg-orange-900 border border-orange-500/40 text-orange-300 text-[10px] font-mono rounded flex items-center gap-1 transition-colors"
                            title="Buy with Sugargoo VIP"
                          >
                            <span>Sugargoo</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chinese Marketplace 1-Click Sourcing Fallback */}
              {!isScanning && marketplaceLinks && (
                <div className="p-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Source Directly from Chinese Marketplaces</span>
                      </h5>
                      <p className="text-[11px] font-mono text-neutral-400">
                        Search Taobao, Weidian &amp; 1688 with AI-optimized keywords via your preferred shopping agent:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={marketplaceLinks.sugargooSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-orange-950/60 hover:bg-orange-900 border border-orange-600/40 text-orange-200 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span>Search on Sugargoo (VIP)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={marketplaceLinks.superbuySearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-600/40 text-cyan-200 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span>Search on Superbuy</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={marketplaceLinks.mulebuySearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900 border border-blue-600/40 text-blue-200 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span>Search on Mulebuy</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={marketplaceLinks.cnfansSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-pink-950/60 hover:bg-pink-900 border border-pink-600/40 text-pink-200 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span>Search on CNfans</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {errorMsg && (
                <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-mono">
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
