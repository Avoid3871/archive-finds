"use client";

import { useState } from "react";
import { TimelinePoint } from "@/lib/analytics/analyticsStore";
import { TrendingUp, MousePointerClick, Eye, Calendar } from "lucide-react";

interface TimelineChartProps {
  timeline: TimelinePoint[];
  timeline24h: { hour: string; pageviews: number; clicks: number }[];
}

export function InteractiveTimelineChart({ timeline, timeline24h }: TimelineChartProps) {
  const [viewMode, setViewMode] = useState<"7d" | "24h">("7d");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points = viewMode === "7d"
    ? timeline.map((t) => ({ label: t.label, pvs: t.pageviews, clk: t.agentClicks, ctr: t.ctr }))
    : timeline24h.map((t) => ({
        label: t.hour,
        pvs: t.pageviews,
        clk: t.clicks,
        ctr: t.pageviews > 0 ? Number(((t.clicks / t.pageviews) * 100).toFixed(1)) : 0,
      }));

  const maxPv = Math.max(10, ...points.map((p) => p.pvs));
  const maxClk = Math.max(5, ...points.map((p) => p.clk));

  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  // Build SVG path points for Pageviews (Area curve)
  const pvPoints = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(1, points.length - 1)) * chartW;
    const y = svgHeight - paddingY - (p.pvs / maxPv) * chartH;
    return { x, y, ...p };
  });

  const pvPathD = pvPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const areaPathD = pvPoints.length > 0
    ? `${pvPathD} L ${pvPoints[pvPoints.length - 1].x} ${svgHeight - paddingY} L ${pvPoints[0].x} ${svgHeight - paddingY} Z`
    : "";

  // Build SVG path for Clicks (Emerald line)
  const clkPoints = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(1, points.length - 1)) * chartW;
    const y = svgHeight - paddingY - (p.clk / Math.max(1, maxPv * 0.4)) * chartH;
    return { x, y, ...p };
  });

  const clkPathD = clkPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Traffic &amp; Conversion Trendlines</span>
          </h2>
          <p className="text-xs font-mono text-neutral-500">
            Interactive visual velocity curve comparing organic pageviews vs. outbound agent clicks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Pageviews
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Agent Clicks
            </span>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("7d")}
              className={`px-3 py-1 text-xs font-mono uppercase font-bold rounded transition-colors cursor-pointer ${
                viewMode === "7d"
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewMode("24h")}
              className={`px-3 py-1 text-xs font-mono uppercase font-bold rounded transition-colors cursor-pointer ${
                viewMode === "24h"
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              24 Hours
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Card */}
      {activePoint ? (
        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400 font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            {activePoint.label}
          </span>
          <div className="flex items-center gap-6">
            <span className="text-cyan-400 flex items-center gap-1 font-bold">
              <Eye className="w-3.5 h-3.5" />
              {activePoint.pvs} Pageviews
            </span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <MousePointerClick className="w-3.5 h-3.5" />
              {activePoint.clk} Agent Clicks
            </span>
            <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold rounded">
              CTR: {activePoint.ctr}%
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-neutral-950/60 border border-neutral-800/60 rounded-lg text-xs font-mono text-neutral-500 flex items-center justify-between">
          <span>💡 Hover over any point on the chart for exact granular session numbers.</span>
          <span className="text-neutral-400">Total Samples: {points.length}</span>
        </div>
      )}

      {/* SVG Interactive Canvas */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="clkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = svgHeight - paddingY - ratio * chartH;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="#262626"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area Fill for Pageviews */}
          {areaPathD && <path d={areaPathD} fill="url(#pvGradient)" />}

          {/* Line for Pageviews */}
          {pvPathD && (
            <path
              d={pvPathD}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Line for Clicks */}
          {clkPathD && (
            <path
              d={clkPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and Hover Triggers */}
          {pvPoints.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            const clkPt = clkPoints[idx];

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={svgHeight - paddingY}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Pageview Node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 3.5}
                  fill="#06b6d4"
                  stroke="#0a0a0a"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Click Node */}
                {clkPt && (
                  <circle
                    cx={clkPt.x}
                    cy={clkPt.y}
                    r={isHovered ? 6 : 3.5}
                    fill="#10b981"
                    stroke="#0a0a0a"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                )}

                {/* Bottom X-Axis Label */}
                <text
                  x={pt.x}
                  y={svgHeight - 8}
                  fill={isHovered ? "#ffffff" : "#737373"}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="transition-colors duration-150"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
