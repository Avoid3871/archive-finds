"use client";

import { useState } from "react";
import {
  Globe,
  Users,
  MapPin,
  Sparkles,
  Navigation,
  Radio,
  Compass,
  Server,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
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
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const isDe = lang === "de";

  const hqSpot = hotspots.find((h) => h.isHub) || {
    id: "de-berlin",
    name: "Germany (Berlin / Server HQ)",
    city: "Berlin (HQ)",
    svgX: 537.2,
    svgY: 104.1,
    lat: "52.5200° N",
    lon: "13.4050° E",
    flag: "🇩🇪",
    visitors: 24,
    percentage: 15,
  };

  const filteredHotspots = selectedRegion === "all"
    ? hotspots
    : hotspots.filter((h) => h.region === selectedRegion || h.isHub);

  const activeTelemetry = activeHotspot || hqSpot;

  // ViewBox dynamic calculation for regional focus or zoom
  let targetViewBox = "0 0 1000 500";
  if (selectedRegion === "europe") {
    targetViewBox = "380 40 320 200"; // Focused on Europe
  } else if (selectedRegion === "americas") {
    targetViewBox = "60 40 400 300"; // Focused on North & Central America
  } else if (selectedRegion === "asia_pacific") {
    targetViewBox = "650 60 350 400"; // Focused on Asia-Pacific
  }

  // Generate smooth incoming Bezier curves directly to Germany HQ (537.2, 104.1)
  const incomingRoutes = [
    {
      id: "us-east-route",
      from: "New York",
      d: "M294.4,136.9 Q415.8,59.1 537.2,104.1",
      color: "#38bdf8", // Cyan
      strokeWidth: 1.8,
    },
    {
      id: "us-west-route",
      from: "Los Angeles",
      d: "M171.5,155.4 Q354.3,30.0 537.2,104.1",
      color: "#f59e0b", // Amber
      strokeWidth: 1.6,
    },
    {
      id: "ca-toronto-route",
      from: "Toronto",
      d: "M279.5,128.7 Q408.3,50.0 537.2,104.1",
      color: "#38bdf8",
      strokeWidth: 1.5,
    },
    {
      id: "uk-london-route",
      from: "London",
      d: "M499.6,106.9 Q518.4,90.0 537.2,104.1",
      color: "#10b981", // Emerald
      strokeWidth: 2.0,
    },
    {
      id: "fr-paris-route",
      from: "Paris",
      d: "M506.5,114.3 Q521.8,98.0 537.2,104.1",
      color: "#10b981",
      strokeWidth: 1.6,
    },
    {
      id: "jp-tokyo-route",
      from: "Tokyo",
      d: "M887.9,150.9 Q712.5,45.0 537.2,104.1",
      color: "#ec4899", // Pink
      strokeWidth: 1.5,
    },
    {
      id: "au-sydney-route",
      from: "Sydney",
      d: "M920.0,344.1 Q730.0,200.0 537.2,104.1",
      color: "#a855f7", // Purple
      strokeWidth: 1.4,
    },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -left-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isDe ? "LIVE AUDIENCE TRAFFIC-ROUTING" : "GLOBAL TRAFFIC TELEMETRY"}</span>
            </span>
            <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-300 text-[10px] font-mono rounded font-bold uppercase flex items-center gap-1.5">
              <Server className="w-3 h-3 text-amber-400" />
              <span>{isDe ? "Server-Ziel: Deutschland (Berlin HQ)" : "Server Target: Germany (Berlin HQ)"}</span>
            </span>
          </div>
          <h2 className="font-mono font-black text-xl text-white uppercase tracking-wider flex items-center gap-2">
            <span>{isDe ? "INTERAKTIVE ECHTZEIT-WELTKARTE" : "INTERACTIVE REAL-TIME WORLD MAP"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {isDe
              ? "Große Detailansicht aller 177 Länder mit reinen lokalen SVG-Wellen (ohne globale CSS-Effekte)."
              : "High-definition expanded vector view of all 177 countries with localized SVG wave ripples."}
          </p>
        </div>

        {/* Region & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Region Tabs */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedRegion("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedRegion === "all"
                  ? "bg-white text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {isDe ? "Global" : "Global"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedRegion("americas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedRegion === "americas"
                  ? "bg-white text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
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
                  : "text-neutral-400 hover:text-white"
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
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              🇯🇵 {isDe ? "Asien" : "Asia"}
            </button>
          </div>
        </div>
      </div>

      {/* ULTRA-HD AUTHENTIC VECTOR WORLD MAP (EXPANDED LARGE CANVAS) */}
      <div className="relative w-full aspect-[16/9] min-h-[440px] md:min-h-[520px] lg:min-h-[600px] max-h-[720px] bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#030712] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Global Longitude & Latitude Coordinates lines */}
        <svg
          viewBox={targetViewBox}
          className="absolute inset-0 w-full h-full pointer-events-none stroke-neutral-800/50 transition-all duration-500"
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

        {/* AUTHENTIC 177-COUNTRY GEOGRAPHIC VECTOR MAP */}
        <svg
          viewBox={targetViewBox}
          className="w-full h-full select-none transition-all duration-500"
        >
          <defs>
            <linearGradient id="realLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#111827" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </linearGradient>
            <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* REAL WORLD MAP CONTINENTS & COUNTRIES */}
          <path
            d={WORLD_MAP_PATH}
            fill="url(#realLandGradient)"
            stroke="#334155"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />

          {/* INCOMING TRAFFIC ROUTE ARCS LEADING DIRECTLY INTO GERMANY HQ (537.2, 104.1) */}
          <g>
            {incomingRoutes.map((r) => {
              const isHighlighted = activeHotspot?.city?.includes(r.from);

              return (
                <path
                  key={r.id}
                  d={r.d}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={isHighlighted ? 2.8 : r.strokeWidth}
                  strokeDasharray="4 4"
                  opacity={isHighlighted ? 1.0 : 0.65}
                  filter={isHighlighted ? "url(#vectorGlow)" : undefined}
                />
              );
            })}
          </g>

          {/* REAL-TIME RADAR BEACONS & EXACT GEOGRAPHIC PINS */}
          <g>
            {filteredHotspots.map((spot) => {
              const isHovered = activeHotspot?.id === spot.id;
              const isServerHub = !!spot.isHub;

              return (
                <g
                  key={spot.id}
                  onMouseEnter={() => setActiveHotspot(spot)}
                  onMouseLeave={() => setActiveHotspot(null)}
                  className="cursor-pointer group"
                >
                  {/* Clean SVG Native Expanding Ripple Ring (100% Locally Centered, Zero CSS Transform Bleed) */}
                  <circle
                    cx={spot.svgX}
                    cy={spot.svgY}
                    r={isServerHub ? "6" : "4"}
                    fill="none"
                    stroke={isServerHub ? "#10b981" : "#38bdf8"}
                    strokeWidth="1.2"
                  >
                    <animate
                      attributeName="r"
                      values={isServerHub ? "5; 18; 26" : "3.5; 12; 18"}
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.9; 0.3; 0"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Secondary Inner Ripple */}
                  <circle
                    cx={spot.svgX}
                    cy={spot.svgY}
                    r={isServerHub ? "4" : "3"}
                    fill="none"
                    stroke={isServerHub ? "#34d399" : "#38bdf8"}
                    strokeWidth="0.8"
                  >
                    <animate
                      attributeName="r"
                      values={isServerHub ? "4; 10; 15" : "2.5; 7; 11"}
                      dur="2.5s"
                      begin="0.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.7; 0.2; 0"
                      dur="2.5s"
                      begin="0.8s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Center Solid Pin Dot */}
                  <circle
                    cx={spot.svgX}
                    cy={spot.svgY}
                    r={isHovered ? (isServerHub ? "6" : "5") : (isServerHub ? "4.5" : "3.2")}
                    fill={
                      isHovered
                        ? "#f59e0b"
                        : isServerHub
                        ? "#10b981"
                        : spot.isTop
                        ? "#38bdf8"
                        : "#94a3b8"
                    }
                    stroke="#ffffff"
                    strokeWidth={isServerHub ? "1.5" : "0.8"}
                  />

                  {/* City Label */}
                  <text
                    x={spot.svgX}
                    y={spot.svgY - (isServerHub ? 10 : 7)}
                    textAnchor="middle"
                    fill={isServerHub ? "#34d399" : "#f1f5f9"}
                    fontSize={isServerHub ? "9.5" : "7.5"}
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                  >
                    {spot.flag} {spot.city}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Live HUD Telemetry Overlay in Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-neutral-950/90 backdrop-blur border border-neutral-800 rounded-xl p-2.5 text-[10px] font-mono pointer-events-none hidden sm:block">
          <div className="flex items-center gap-2 text-neutral-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              NODE: <strong className="text-white">{activeTelemetry?.name || "Germany HQ"}</strong>
            </span>
            <span className="text-neutral-600">|</span>
            <span>
              COORD: <strong className="text-emerald-400">{activeTelemetry?.lat || "52.5° N"}, {activeTelemetry?.lon || "13.4° E"}</strong>
            </span>
            <span className="text-neutral-600">|</span>
            <span className="text-amber-400 font-bold">
              {activeTelemetry?.isHub ? "🎯 SERVER HQ" : `ROUTE ──▶ GERMANY (${activeTelemetry?.percentage}% Traffic)`}
            </span>
          </div>
        </div>
      </div>

      {/* Hotspots Quick Grid with Inbound Routing Direction */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {hotspots.map((spot) => {
          const isActive = activeHotspot?.id === spot.id;
          const isServerHub = !!spot.isHub;

          return (
            <button
              key={spot.id}
              type="button"
              onMouseEnter={() => setActiveHotspot(spot)}
              onMouseLeave={() => setActiveHotspot(null)}
              className={`p-2.5 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                isServerHub
                  ? "bg-emerald-950/40 border-emerald-500/80 shadow-emerald-950/50 shadow-lg"
                  : isActive
                  ? "bg-neutral-800 border-amber-500 shadow-lg"
                  : "bg-neutral-950 border-neutral-800/80 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{spot.flag}</span>
                <span className={`text-[10px] font-black ${isServerHub ? "text-emerald-400" : "text-cyan-400"}`}>
                  {spot.percentage}%
                </span>
              </div>
              <p className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                <span>{spot.city}</span>
              </p>
              <p className="text-[9px] text-neutral-500 truncate flex items-center gap-1">
                {isServerHub ? (
                  <span className="text-emerald-400 font-bold">SERVER HQ 🇩🇪</span>
                ) : (
                  <span>──▶ DE Server</span>
                )}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
