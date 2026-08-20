"use client";

import { useState } from "react";
import { Globe, Users, MapPin, Sparkles } from "lucide-react";
import { GeoHotspot, GeoItem } from "@/lib/analytics/analyticsStore";

interface InteractiveWorldMapProps {
  hotspots: GeoHotspot[];
  countries: GeoItem[];
  lang?: "de" | "en";
}

export function InteractiveWorldMap({
  hotspots,
  countries,
  lang = "de",
}: InteractiveWorldMapProps) {
  const [activeHotspot, setActiveHotspot] = useState<GeoHotspot | null>(null);
  const isDe = lang === "de";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{isDe ? "GLOBALER TRAFFIC & GEOGRAFISCHE AUDIENCE" : "GLOBAL TRAFFIC MAP"}</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              {isDe ? "Live Hotspots & Regionen" : "Live Geographic Distribution"}
            </span>
          </div>
          <h2 className="font-mono font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <span>{isDe ? "INTERAKTIVE AUDIENCE WELTKARTE" : "INTERACTIVE VISITOR WORLD MAP"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {isDe
              ? "Pulsierende Hotspots deiner viralen Besucher über Nordamerika, Europa und Asien-Pazifik."
              : "Real-time engagement beacons of viral audience clusters across North America, Europe, and Asia."}
          </p>
        </div>

        {/* Quick Country Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {countries.slice(0, 4).map((c) => (
            <span
              key={c.code}
              className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white flex items-center gap-1.5"
            >
              <span>{c.flag}</span>
              <strong className="text-emerald-400">{c.percentage}%</strong>
            </span>
          ))}
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full aspect-[2/1] min-h-[260px] max-h-[380px] bg-neutral-950 rounded-2xl border border-neutral-800/90 overflow-hidden flex items-center justify-center p-4">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Stylized Minimal Vector Continents Background (World Map SVG paths) */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full text-neutral-800/60 fill-current select-none"
        >
          {/* North America */}
          <path d="M120,80 Q220,60 310,110 Q340,160 300,240 Q250,260 210,310 Q160,280 130,220 Q80,180 120,80 Z" opacity="0.4" />
          <path d="M150,110 Q280,90 290,180 Q260,240 200,250 Q140,200 150,110 Z" opacity="0.6" />
          
          {/* South America */}
          <path d="M250,310 Q310,330 320,410 Q290,480 250,460 Q230,380 250,310 Z" opacity="0.4" />

          {/* Europe */}
          <path d="M460,110 Q540,90 560,160 Q520,200 460,180 Q440,140 460,110 Z" opacity="0.6" />
          <path d="M480,120 Q530,120 540,160 Q490,180 480,120 Z" opacity="0.8" />

          {/* Africa */}
          <path d="M460,200 Q560,210 570,330 Q520,420 460,370 Q430,280 460,200 Z" opacity="0.35" />

          {/* Asia */}
          <path d="M570,90 Q780,80 840,180 Q800,280 670,270 Q580,220 570,90 Z" opacity="0.5" />
          <path d="M680,140 Q800,150 820,240 Q750,270 680,210 Z" opacity="0.7" />

          {/* Australia */}
          <path d="M780,360 Q880,350 890,430 Q830,460 780,420 Q760,380 780,360 Z" opacity="0.4" />
        </svg>

        {/* Dynamic Glowing Hotspots on Map */}
        <div className="absolute inset-0 pointer-events-auto">
          {hotspots.map((spot) => {
            const isHovered = activeHotspot?.id === spot.id;

            return (
              <div
                key={spot.id}
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                onMouseEnter={() => setActiveHotspot(spot)}
                onMouseLeave={() => setActiveHotspot(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                {/* Radar Ripple Rings */}
                <span className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping" />
                <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-pulse" />

                {/* Hotspot Core */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-200 ${
                    isHovered
                      ? "bg-amber-400 border-white scale-150 shadow-lg shadow-amber-400"
                      : spot.isTop
                      ? "bg-emerald-400 border-emerald-200 shadow-md shadow-emerald-400/80"
                      : "bg-cyan-400 border-cyan-100"
                  }`}
                />

                {/* Country Flag Badge Pin */}
                <div className="absolute left-1/2 -top-5 -translate-x-1/2 text-xs select-none pointer-events-none drop-shadow">
                  {spot.flag}
                </div>

                {/* Interactive Tooltip Card */}
                <div
                  className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-black/95 backdrop-blur-md border border-neutral-700 text-white rounded-xl p-2.5 shadow-2xl z-40 transition-all pointer-events-none ${
                    isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                    <span className="flex items-center gap-1 text-white">
                      <span>{spot.flag}</span>
                      <span>{spot.name}</span>
                    </span>
                    <span className="text-emerald-400">{spot.percentage}%</span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 flex items-center justify-between border-t border-neutral-800 pt-1">
                    <span>{isDe ? "Besucher" : "Audience"}:</span>
                    <span className="font-bold text-white">~{spot.visitors} {isDe ? "Aufrufe" : "views"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hotspots Quick Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {hotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onMouseEnter={() => setActiveHotspot(spot)}
            onMouseLeave={() => setActiveHotspot(null)}
            className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
              activeHotspot?.id === spot.id
                ? "bg-neutral-800 border-emerald-500 shadow-md"
                : "bg-neutral-950 border-neutral-800/80 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">{spot.flag}</span>
              <span className="text-[10px] font-bold text-emerald-400">
                {spot.percentage}%
              </span>
            </div>
            <p className="text-[11px] font-bold text-white truncate">
              {spot.name.split("(")[0]}
            </p>
            <p className="text-[10px] text-neutral-500">
              ~{spot.visitors} {isDe ? "Aufrufe" : "views"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
