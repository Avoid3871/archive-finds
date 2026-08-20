"use client";

import Link from "next/link";
import { Sparkles, TrendingUp, Layers, ArrowUpRight, Flame, Zap, Award } from "lucide-react";
import { SlideThemeRoi } from "@/lib/analytics/analyticsStore";

interface ContentThemeRoiCardProps {
  rois: SlideThemeRoi[];
  lang?: "de" | "en";
}

export function ContentThemeRoiCard({ rois, lang = "de" }: ContentThemeRoiCardProps) {
  const isDe = lang === "de";

  if (!rois || rois.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-800/80 text-purple-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-purple-400" />
              <span>{isDe ? "CONTENT & THEME ROI ATTRIBUTION" : "CONTENT & THEME ROI"}</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[10px] font-mono rounded font-bold uppercase flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" />
              <span>{isDe ? "Top-Konversion: Brand Focus (44.9% CTR)" : "Top: Brand Focus (44.9% CTR)"}</span>
            </span>
          </div>
          <h2 className="font-mono font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <span>{isDe ? "WELCHES SLIDE-THEMA ZIEHT AM BESTEN?" : "WHICH CONTENT THEME CONVERTS BEST?"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {isDe
              ? "Vergleiche Klickraten und Konversionen verschiedener TikTok-/Instagram-Slide-Konzepte."
              : "Attribution performance of slide pack topics driving link-in-bio traffic."}
          </p>
        </div>

        <Link
          href="/admin/slides"
          className="px-3.5 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-mono uppercase font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isDe ? "Slide Studio öffnen" : "Open Slide Studio"}</span>
        </Link>
      </div>

      {/* ROI Bars */}
      <div className="space-y-4">
        {rois.map((item, idx) => {
          const isTop = idx === 0;

          return (
            <div
              key={item.themeId}
              className={`p-4 rounded-xl border transition-all ${
                isTop
                  ? "bg-gradient-to-r from-neutral-950 via-purple-950/20 to-neutral-950 border-purple-700/60 shadow-lg shadow-purple-950/30"
                  : "bg-neutral-950 border-neutral-800/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                      <span>{item.theme}</span>
                      {isTop && (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[9px] font-black rounded">
                          #1 TOP CTR
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-white">{item.clicks}</span>
                    <span className="text-[10px] text-neutral-500 ml-1">
                      {isDe ? "Klicks" : "clicks"} ({item.views} {isDe ? "Aufrufe" : "views"})
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-black ${
                      item.conversionRating === "ELITE"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : item.conversionRating === "HIGH"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                        : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                    }`}
                  >
                    {item.ctr}% CTR
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.conversionRating === "ELITE"
                      ? "bg-gradient-to-r from-purple-500 to-emerald-400"
                      : item.conversionRating === "HIGH"
                      ? "bg-cyan-400"
                      : "bg-neutral-600"
                  }`}
                  style={{ width: `${Math.min(100, item.ctr * 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
