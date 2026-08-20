"use client";

import { useState } from "react";
import { Globe, Users, MapPin, Sparkles, Navigation, Radio, Compass, Plane } from "lucide-react";
import { GeoHotspot, GeoItem } from "@/lib/analytics/analyticsStore";
import { WORLD_MAP_PATH } from "./worldMapData";

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
  const [selectedRegion, setSelectedRegion] = useState<"all" | "americas" | "europe" | "asia_pacific">("all");
  const isDe = lang === "de";

  const filteredHotspots = selectedRegion === "all"
    ? hotspots
    : hotspots.filter((h) => h.region === selectedRegion);

  const activeTelemetry = activeHotspot || hotspots[0] || null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isDe ? "GLOBALER AUDIENCE TELEMETRIE-RADAR" : "GLOBAL VISITOR TELEMETRY"}</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              <span>{isDe ? "Echte Vektor-Topografie" : "Authentic Vector Topography"}</span>
            </span>
          </div>
          <h2 className="font-mono font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
            <span>{isDe ? "INTERAKTIVE ECHTZEIT-WELTKARTE" : "INTERACTIVE REAL-TIME WORLD MAP"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {isDe
              ? "Präzise Vektor-Küstenlinien aller 177 Länder mit pulsierenden Radar-Pings deiner Modemetropolen."
              : "High-definition vector coastlines across 177 countries with live radar telemetry beacons."}
          </p>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedRegion("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              selectedRegion === "all"
                ? "bg-white text-black shadow-md"
                : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            {isDe ? "Alle Regionen" : "All Regions"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedRegion("americas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              selectedRegion === "americas"
                ? "bg-white text-black shadow-md"
                : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            🇺🇸 {isDe ? "Amerika" : "Americas"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedRegion("europe")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              selectedRegion === "europe"
                ? "bg-white text-black shadow-md"
                : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            🇪🇺 {isDe ? "Europa" : "Europe"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedRegion("asia_pacific")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              selectedRegion === "asia_pacific"
                ? "bg-white text-black shadow-md"
                : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            🇯🇵 {isDe ? "Asien-Pazifik" : "Asia-Pacific"}
          </button>
        </div>
      </div>

      {/* ULTRA-HD AUTHENTIC VECTOR WORLD MAP */}
      <div className="relative w-full aspect-[2/1] min-h-[320px] max-h-[460px] bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#030712] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Global Longitude & Latitude Coordinates lines */}
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 w-full h-full pointer-events-none stroke-neutral-800/50"
          fill="none"
        >
          {/* Equator & Prime Meridian */}
          <line x1="0" y1="250" x2="1000" y2="250" strokeDasharray="3 6" strokeWidth="0.8" stroke="rgba(255,255,255,0.12)" />
          <line x1="500" y1="0" x2="500" y2="500" strokeDasharray="3 6" strokeWidth="0.8" stroke="rgba(255,255,255,0.12)" />
          
          {/* Latitudinal Grids */}
          <line x1="0" y1="125" x2="1000" y2="125" strokeDasharray="2 8" strokeWidth="0.5" />
          <line x1="0" y1="375" x2="1000" y2="375" strokeDasharray="2 8" strokeWidth="0.5" />
          
          {/* Longitudinal Grids */}
          <line x1="250" y1="0" x2="250" y2="500" strokeDasharray="2 8" strokeWidth="0.5" />
          <line x1="750" y1="0" x2="750" y2="500" strokeDasharray="2 8" strokeWidth="0.5" />
        </svg>

        {/* AUTHENTIC 177-COUNTRY GEOGRAPHIC VECTOR PATH */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full select-none"
        >
          <defs>
            <linearGradient id="realLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#111827" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="arcGlowAtlantic" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>
            <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* REAL WORLD MAP CONTINENTS & COUNTRIES */}
          <path
            d={WORLD_MAP_PATH}
            fill="url(#realLandGradient)"
            stroke="#334155"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

          {/* GLOWING CURVED FLIGHT / TRAFFIC ARCS (Connecting Fashion Capitals) */}
          {/* 1. New York (294.4, 136.9) ↔ London (499.6, 106.9) */}
          <path
            d="M294.4,136.9 Q397,60 499.6,106.9"
            fill="none"
            stroke="url(#arcGlowAtlantic)"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            className="animate-pulse"
            filter="url(#vectorGlow)"
          />

          {/* 2. London (499.6, 106.9) ↔ Berlin (537.2, 104.1) */}
          <path
            d="M499.6,106.9 Q518,85 537.2,104.1"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.8"
            strokeDasharray="3 3"
          />

          {/* 3. Paris (506.5, 114.3) ↔ Berlin (537.2, 104.1) */}
          <path
            d="M506.5,114.3 Q522,95 537.2,104.1"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="2 4"
            opacity="0.8"
          />

          {/* 4. Los Angeles (171.5, 155.4) ↔ Tokyo (887.9, 150.9) Transpacific */}
          <path
            d="M171.5,155.4 Q85,165 0,155"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.4"
            strokeDasharray="4 4"
          />
          <path
            d="M1000,155 Q940,165 887.9,150.9"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.4"
            strokeDasharray="4 4"
          />
        </svg>

        {/* REAL-TIME RADAR BEACONS & INTERACTIVE PINS */}
        <div className="absolute inset-0 pointer-events-auto">
          {filteredHotspots.map((spot) => {
            const isHovered = activeHotspot?.id === spot.id;

            return (
              <div
                key={spot.id}
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                onMouseEnter={() => setActiveHotspot(spot)}
                onMouseLeave={() => setActiveHotspot(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                {/* Multi-Layer Radar Rings */}
                <span className="absolute -inset-3 rounded-full bg-emerald-400/25 animate-ping pointer-events-none" />
                <span className="absolute -inset-1.5 rounded-full bg-emerald-500/35 animate-pulse pointer-events-none" />

                {/* Hotspot Core */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                    isHovered
                      ? "bg-amber-400 border-white scale-150 shadow-xl shadow-amber-400"
                      : spot.isTop
                      ? "bg-emerald-400 border-emerald-100 shadow-md shadow-emerald-400/90"
                      : "bg-cyan-400 border-cyan-100 shadow-md shadow-cyan-400/70"
                  }`}
                />

                {/* Country Flag Badge */}
                <div className="absolute left-1/2 -top-5 -translate-x-1/2 text-xs select-none pointer-events-none drop-shadow">
                  {spot.flag}
                </div>

                {/* High-Tech Telemetry Tooltip */}
                <div
                  className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 bg-neutral-950/95 backdrop-blur-md border border-neutral-700 text-white rounded-xl p-3 shadow-2xl z-40 transition-all pointer-events-none ${
                    isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-white">
                      <span>{spot.flag}</span>
                      <span>{spot.city}</span>
                    </span>
                    <span className="text-emerald-400 font-black">{spot.percentage}% Share</span>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-400 space-y-1 border-t border-neutral-800 pt-1.5">
                    <div className="flex justify-between">
                      <span>{isDe ? "Besucher" : "Sessions"}:</span>
                      <strong className="text-white">~{spot.visitors} {isDe ? "Aufrufe" : "views"}</strong>
                    </div>
                    <div className="flex justify-between text-neutral-500 text-[9px]">
                      <span>GEO:</span>
                      <span>{spot.lat}, {spot.lon}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live HUD Telemetry Overlay in Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-neutral-950/90 backdrop-blur border border-neutral-800 rounded-xl p-2.5 text-[10px] font-mono pointer-events-none hidden sm:block">
          <div className="flex items-center gap-2 text-neutral-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              HUB: <strong className="text-white">{activeTelemetry?.name || "Global"}</strong>
            </span>
            <span className="text-neutral-600">|</span>
            <span>
              COORD: <strong className="text-emerald-400">{activeTelemetry?.lat || "52.5° N"}, {activeTelemetry?.lon || "13.4° E"}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Hotspots Quick Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {hotspots.map((spot) => {
          const isActive = activeHotspot?.id === spot.id;

          return (
            <button
              key={spot.id}
              type="button"
              onMouseEnter={() => setActiveHotspot(spot)}
              onMouseLeave={() => setActiveHotspot(null)}
              className={`p-2.5 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                isActive
                  ? "bg-neutral-800 border-emerald-500 shadow-lg"
                  : "bg-neutral-950 border-neutral-800/80 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{spot.flag}</span>
                <span className="text-[10px] font-black text-emerald-400">
                  {spot.percentage}%
                </span>
              </div>
              <p className="text-[11px] font-bold text-white truncate">
                {spot.city}
              </p>
              <p className="text-[9px] text-neutral-500 truncate">
                ~{spot.visitors} {isDe ? "Aufrufe" : "views"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
