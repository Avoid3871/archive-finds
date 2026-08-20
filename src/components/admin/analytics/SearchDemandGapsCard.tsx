"use client";

import Link from "next/link";
import { Search, Sparkles, AlertCircle, CheckCircle2, ArrowUpRight, Zap, Flame } from "lucide-react";
import { SearchDemandGap } from "@/lib/analytics/analyticsStore";

interface SearchDemandGapsCardProps {
  gaps: SearchDemandGap[];
  lang?: "de" | "en";
}

export function SearchDemandGapsCard({ gaps, lang = "de" }: SearchDemandGapsCardProps) {
  const isDe = lang === "de";

  if (!gaps || gaps.length === 0) return null;

  const missingCount = gaps.filter((g) => !g.inCatalog).length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3 text-cyan-400" />
              <span>{isDe ? "SUCH-INTELLIGENCE & UNGEDECKTE NACHFRAGE" : "SEARCH INTELLIGENCE & DEMAND GAPS"}</span>
            </span>
            {missingCount > 0 && (
              <span className="px-2 py-0.5 bg-red-950/80 border border-red-800/80 text-red-300 text-[10px] font-mono rounded font-bold uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400 fill-current" />
                <span>{missingCount} {isDe ? "Fehlende Grails gesucht" : "Missing Grails"}</span>
              </span>
            )}
          </div>
          <h2 className="font-mono font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <span>{isDe ? "WAS DEINE BESUCHER SUCHEN (DEMAND GAPS)" : "LIVE SEARCH QUERIES & DEMAND GAPS"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {isDe
              ? "Erkenne sofort, nach welchen Hype-Pieces deine Zielgruppe sucht, die noch nicht im Katalog gelistet sind."
              : "Detect high-intent search queries for pieces not yet cataloged in your archive store."}
          </p>
        </div>

        <Link
          href="/admin/sources"
          className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xl text-xs font-mono uppercase font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isDe ? "Sourcing Hub öffnen" : "Open Sourcing Hub"}</span>
        </Link>
      </div>

      {/* Demand Gaps Grid / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-500 uppercase text-[10px]">
              <th className="py-2.5 px-3">{isDe ? "Suchbegriff / Piece" : "Search Query"}</th>
              <th className="py-2.5 px-3 text-center">{isDe ? "Such-Volumen" : "Search Volume"}</th>
              <th className="py-2.5 px-3 text-center">{isDe ? "Katalog-Status" : "Catalog Status"}</th>
              <th className="py-2.5 px-3 text-right">{isDe ? "1-Klick Sourcing" : "Action"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {gaps.map((gap, idx) => {
              const isMissing = !gap.inCatalog;

              return (
                <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                  {/* Query */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="font-bold text-white text-xs">{gap.query}</span>
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded font-bold text-white">
                      {gap.count} {isDe ? "Suchanfragen" : "searches"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    {isMissing ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/80 border border-red-800/80 text-red-300 rounded-lg text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span>{isDe ? "FEHLT IM SHOP" : "NOT IN SHOP"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-lg text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{isDe ? `Gelistet (${gap.matchCount})` : `In Shop (${gap.matchCount})`}</span>
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-right">
                    {isMissing ? (
                      <Link
                        href={`/admin/sources?query=${encodeURIComponent(gap.query)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3 h-3 fill-black" />
                        <span>{isDe ? "Jetzt Sourcen ↗" : "Source Grail ↗"}</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/search?q=${encodeURIComponent(gap.query)}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors text-[11px]"
                      >
                        <span>{isDe ? "Im Shop prüfen" : "View Results"}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
