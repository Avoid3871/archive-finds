"use client";

import { useState } from "react";
import {
  Clock,
  Sparkles,
  Flame,
  Calendar,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { OptimalPostTimeInsight } from "@/lib/analytics/analyticsStore";

interface OptimalPostTimesCardProps {
  insights: OptimalPostTimeInsight;
}

export function OptimalPostTimesCard({ insights }: OptimalPostTimesCardProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const currentHour = new Date().getHours();

  if (!insights) return null;

  const { peakHours, bestDays, currentStatus, hourlyHeatmap, actionableTips } =
    insights;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-800/80 text-amber-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>VIRALITY &amp; TIMING INTELLIGENCE</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              Audience Active Hours
            </span>
          </div>
          <h2 className="font-mono font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <span>OPTIMAL SOCIAL POSTING TIMES</span>
          </h2>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-black uppercase flex items-center gap-2 shadow-lg ${
              currentStatus.isPeakNow
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-950/50"
                : "bg-neutral-950 text-neutral-300 border-neutral-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentStatus.isPeakNow
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span>{currentStatus.badge}</span>
          </div>
        </div>
      </div>

      {/* Live Advice Box */}
      <div className="p-4 bg-neutral-950/80 border border-neutral-800/80 rounded-xl flex items-start gap-3">
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
          <Zap className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-sans text-neutral-200 font-medium leading-relaxed">
            {currentStatus.message}
          </p>
          <p className="text-[10px] font-mono text-neutral-500">
            Based on aggregated audience engagement, referral clicks from TikTok/Instagram, and conversion patterns.
          </p>
        </div>
      </div>

      {/* Grid: Peak Windows & Top Days */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Primary Peak Window */}
        <div className="p-4 bg-gradient-to-br from-neutral-950 to-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>PRIMARY PEAK DROP</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/20 rounded text-amber-300">
              96% Activity
            </span>
          </div>
          <p className="font-mono font-black text-sm text-white">
            {peakHours.primaryWindow}
          </p>
          <p className="text-[11px] text-neutral-400 font-sans">
            Highest link clicks &amp; viral retention for TikTok Slides &amp; IG Carousels.
          </p>
        </div>

        {/* Secondary Window */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>SECONDARY SURGE</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cyan-500/20 rounded text-cyan-300">
              82% Activity
            </span>
          </div>
          <p className="font-mono font-black text-sm text-white">
            {peakHours.secondaryWindow}
          </p>
          <p className="text-[11px] text-neutral-400 font-sans">
            Lunch break surge. Great for quick single-product highlight posts.
          </p>
        </div>

        {/* Best Days to Drop */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>TOP CONVERSION DAYS</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/20 rounded text-emerald-300">
              Ranked
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {bestDays.map((d) => (
              <span
                key={d.day}
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  d.isTop
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    : "bg-neutral-900 text-neutral-300 border border-neutral-800"
                }`}
              >
                {d.day}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            Thursdays and Sundays consistently drive maximum bio link conversion.
          </p>
        </div>
      </div>

      {/* 24-Hour Activity Heatmap Bar Chart */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>24-Hour Audience Engagement Curve (Local CET Time)</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            Current: {String(currentHour).padStart(2, "0")}:00
          </span>
        </div>

        {/* Heatmap Columns */}
        <div className="grid grid-cols-24 gap-1 sm:gap-1.5 h-20 items-end bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
          {hourlyHeatmap.map((item) => {
            const isNow = item.hour === currentHour;
            const isHovered = hoveredHour === item.hour;

            return (
              <div
                key={item.hour}
                onMouseEnter={() => setHoveredHour(item.hour)}
                onMouseLeave={() => setHoveredHour(null)}
                className="h-full flex flex-col justify-end items-center relative group cursor-pointer"
              >
                {/* Bar */}
                <div
                  style={{ height: `${item.activity}%` }}
                  className={`w-full rounded-t-sm transition-all duration-200 ${
                    isNow
                      ? "bg-emerald-400 shadow-md shadow-emerald-400/50"
                      : item.isPeak
                      ? "bg-amber-400 group-hover:bg-amber-300"
                      : item.activity >= 50
                      ? "bg-cyan-600/70 group-hover:bg-cyan-500"
                      : "bg-neutral-800 group-hover:bg-neutral-700"
                  }`}
                />

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                  <div className="bg-black/95 text-white text-[10px] font-mono px-2 py-1 rounded shadow-xl border border-neutral-700 whitespace-nowrap">
                    <span className="font-bold text-amber-300">{item.hourLabel}</span>
                    <span className="text-neutral-400 ml-1.5">
                      ({item.activity}% engagement {isNow ? "• NOW" : ""})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour markers */}
        <div className="flex justify-between text-[9px] font-mono text-neutral-500 px-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span className="text-amber-400 font-bold">18:00 (Peak)</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Actionable Creator Pro-Tips */}
      <div className="p-4 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-2">
        <h4 className="text-xs font-mono uppercase font-bold text-neutral-300 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Tactical Upload Recommendations</span>
        </h4>
        <ul className="space-y-1.5 text-xs text-neutral-400 font-sans">
          {actionableTips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-emerald-400 font-mono font-bold shrink-0">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
