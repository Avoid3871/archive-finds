"use client";

import { useState } from "react";
import { Globe, Users, MapPin, Sparkles, Navigation, Radio, Compass } from "lucide-react";
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
              <span>Live Satelliten-Kompilation</span>
            </span>
          </div>
          <h2 className="font-mono font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
            <span>{isDe ? "INTERAKTIVE ECHTZEIT-WELTKARTE" : "INTERACTIVE REAL-TIME WORLD MAP"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {isDe
              ? "Pulsierende Fashion-Hotspots und globale Traffic-Routen deiner viralen Besucherströme."
              : "Live geographic audience clusters and trade routing across North America, Europe & Asia."}
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

      {/* Ultra-Detailed Photorealistic Dark Cartography Vector Map */}
      <div className="relative w-full aspect-[2.1/1] min-h-[320px] max-h-[460px] bg-gradient-to-b from-neutral-950 via-[#070b12] to-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex items-center justify-center p-4">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Global Longitude & Latitude Coordinates lines */}
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 w-full h-full pointer-events-none stroke-neutral-800/40"
          fill="none"
        >
          {/* Equator & Meridian */}
          <line x1="0" y1="250" x2="1000" y2="250" strokeDasharray="3 6" strokeWidth="0.8" stroke="rgba(255,255,255,0.15)" />
          <line x1="500" y1="0" x2="500" y2="500" strokeDasharray="3 6" strokeWidth="0.8" stroke="rgba(255,255,255,0.15)" />
          
          {/* Latitude Lat Grids */}
          <line x1="0" y1="125" x2="1000" y2="125" strokeDasharray="2 8" strokeWidth="0.5" />
          <line x1="0" y1="375" x2="1000" y2="375" strokeDasharray="2 8" strokeWidth="0.5" />
          
          {/* Longitude Grids */}
          <line x1="250" y1="0" x2="250" y2="500" strokeDasharray="2 8" strokeWidth="0.5" />
          <line x1="750" y1="0" x2="750" y2="500" strokeDasharray="2 8" strokeWidth="0.5" />
        </svg>

        {/* HIGH-PRECISION DETAILED VECTOR CONTINENTS */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full select-none"
        >
          <defs>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="arcGlow1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* North America (Detailed Vector Path) */}
          <path
            d="M80,65 C100,55 140,50 180,60 C210,50 250,55 280,75 C310,65 335,80 340,110 C345,130 320,150 310,165 C325,180 310,210 295,225 C285,240 270,250 255,275 C245,290 230,305 215,315 C205,320 195,305 190,290 C180,285 170,265 160,255 C145,250 135,230 125,205 C110,195 95,175 90,155 C75,140 70,110 75,90 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.7"
          />

          {/* Greenland */}
          <path
            d="M360,40 C380,35 410,40 420,55 C425,70 410,95 390,105 C370,100 355,85 350,65 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.7"
          />

          {/* South America (Detailed Vector Path) */}
          <path
            d="M245,315 C265,310 295,325 315,340 C335,360 340,390 330,420 C320,445 305,470 285,485 C270,480 260,450 255,420 C245,390 235,365 240,340 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.7"
          />

          {/* British Isles (UK & Ireland) */}
          <path
            d="M480,120 C485,115 492,120 490,135 C485,145 478,148 475,138 Z"
            fill="url(#landGradient)"
            stroke="#10b981"
            strokeWidth="1"
          />
          <path
            d="M468,125 C472,122 475,128 472,138 C468,142 465,135 468,125 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.6"
          />

          {/* Europe & Scandinavia (Detailed Vector Path) */}
          <path
            d="M495,110 C510,95 535,90 550,110 C565,125 555,145 540,155 C530,165 525,180 505,185 C485,185 470,175 480,160 C490,150 495,130 495,110 Z"
            fill="url(#landGradient)"
            stroke="#10b981"
            strokeWidth="0.9"
          />
          {/* Scandinavia */}
          <path
            d="M515,60 C530,55 545,65 540,85 C535,100 520,110 510,95 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.6"
          />

          {/* Africa & Madagascar (Detailed Vector Path) */}
          <path
            d="M460,200 C490,195 545,200 575,225 C590,250 580,285 570,320 C560,355 545,395 525,430 C505,445 485,430 475,395 C460,360 440,320 435,280 C430,240 445,210 460,200 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.7"
          />
          {/* Madagascar */}
          <path
            d="M590,360 C595,355 602,365 598,390 C592,400 588,390 590,360 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.5"
          />

          {/* Asia & Russia (Detailed Vector Path) */}
          <path
            d="M560,95 C620,80 720,70 820,95 C860,110 870,145 850,175 C820,200 780,215 745,235 C710,250 670,270 640,285 C615,280 600,255 595,230 C585,200 565,160 555,130 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.7"
          />
          {/* India */}
          <path
            d="M660,230 C680,225 700,240 690,275 C680,295 665,305 655,280 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.6"
          />
          {/* Japan (Detailed Vector Path) */}
          <path
            d="M840,165 C855,160 860,180 850,205 C845,215 838,205 840,165 Z"
            fill="url(#landGradient)"
            stroke="#38bdf8"
            strokeWidth="1"
          />

          {/* Australia & New Zealand (Detailed Vector Path) */}
          <path
            d="M780,360 C815,345 865,350 885,380 C895,410 875,445 845,460 C815,465 785,440 775,410 C770,385 775,365 780,360 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.7"
          />
          {/* New Zealand */}
          <path
            d="M915,440 C920,435 925,445 920,465 C915,470 910,460 915,440 Z"
            fill="url(#landGradient)"
            stroke="#334155"
            strokeWidth="0.5"
          />

          {/* GLOWING CURVED FLIGHT / TRAFFIC ARCS (Connecting Fashion Hubs) */}
          {/* 1. New York (29.2, 35.8) -> London (48.6, 27.2) */}
          <path
            d="M292,179 Q390,110 486,136"
            fill="none"
            stroke="url(#arcGlow1)"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            className="animate-pulse"
            filter="url(#glow)"
          />

          {/* 2. London (48.6, 27.2) -> Berlin (52.8, 26.5) */}
          <path
            d="M486,136 Q507,125 528,132"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* 3. Paris (49.5, 30.5) -> New York (29.2, 35.8) */}
          <path
            d="M495,152 Q390,130 292,179"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="6 6"
            opacity="0.8"
          />

          {/* 4. Los Angeles (18.5, 39.2) -> Tokyo (84.8, 37.5) via Pacific */}
          <path
            d="M185,196 Q100,210 20,200"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M980,200 Q900,190 848,187"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
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
                <span className="absolute -inset-3.5 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" />
                <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />

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
