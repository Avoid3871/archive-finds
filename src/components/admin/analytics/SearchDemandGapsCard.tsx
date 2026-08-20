"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Zap,
  Flame,
  Info,
  Send,
  Radio,
} from "lucide-react";
import { SearchDemandGap } from "@/lib/analytics/analyticsStore";

interface SearchDemandGapsCardProps {
  gaps: SearchDemandGap[];
  hasLiveSearches?: boolean;
  lang?: "de" | "en";
  onTestSearchLogged?: () => void;
}

export function SearchDemandGapsCard({
  gaps,
  hasLiveSearches = false,
  lang = "de",
  onTestSearchLogged,
}: SearchDemandGapsCardProps) {
  const [testQuery, setTestQuery] = useState("");
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [testSuccessNotice, setTestSuccessNotice] = useState<string | null>(null);

  const isDe = lang === "de";

  if (!gaps || gaps.length === 0) return null;

  const missingCount = gaps.filter((g) => !g.inCatalog).length;

  const handleRunTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    try {
      setIsSubmittingTest(true);
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "search",
          query: testQuery.trim(),
          path: "/search",
        }),
      });

      setTestSuccessNotice(
        isDe
          ? `✓ Suchanfrage „${testQuery.trim()}“ erfolgreich in Echtzeit geloggt!`
          : `✓ Search query "${testQuery.trim()}" logged live to analytics!`
      );
      setTestQuery("");
      setTimeout(() => setTestSuccessNotice(null), 4000);

      if (onTestSearchLogged) {
        onTestSearchLogged();
      }
    } catch (err) {
      console.warn("Failed to log test search:", err);
    } finally {
      setIsSubmittingTest(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3 text-cyan-400" />
              <span>{isDe ? "SUCH-INTELLIGENCE & UNGEDECKTE NACHFRAGE" : "SEARCH INTELLIGENCE & DEMAND GAPS"}</span>
            </span>

            {/* Live vs Benchmark Transparency Badge */}
            {hasLiveSearches ? (
              <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono rounded font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isDe ? "100% Echte Live-Suchen" : "100% Organic Live Searches"}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/80 text-amber-300 text-[10px] font-mono rounded font-bold uppercase flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-400" />
                <span>{isDe ? "Archiv-Benchmark (Vorschau)" : "Curated Benchmark Mode"}</span>
              </span>
            )}

            {missingCount > 0 && (
              <span className="px-2 py-0.5 bg-red-950/80 border border-red-800/80 text-red-300 text-[10px] font-mono rounded font-bold uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400 fill-current" />
                <span>{missingCount} {isDe ? "Fehlende Grails" : "Missing Grails"}</span>
              </span>
            )}
          </div>
          <h2 className="font-mono font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <span>{isDe ? "WAS DEINE BESUCHER SUCHEN (DEMAND GAPS)" : "LIVE SEARCH QUERIES & DEMAND GAPS"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            {hasLiveSearches
              ? isDe
                ? "Echte Suchbegriffe deiner Website-Besucher, abgeglichen mit dem Live-Katalog."
                : "Real-time search queries from your visitors cross-referenced with your live catalog."
              : isDe
                ? "Transparenz-Hinweis: Sobald Besucher in der Suchleiste suchen, werden diese automatisch live geloggt. Aktuell siehst du kuratierte Mode-Benchmarks als Vorschau."
                : "Notice: Displays curated archive benchmarks until organic users search on your shop."}
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

      {/* Interactive Quick-Test Search Logger (for Developer/Admin verification) */}
      <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/90 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-300 font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{isDe ? "Live-Pipeline testen (Suchanfrage simulieren):" : "Test Live Search Pipeline:"}</span>
          </span>
          {testSuccessNotice && (
            <span className="text-emerald-400 font-mono text-[11px] font-bold animate-in fade-in">
              {testSuccessNotice}
            </span>
          )}
        </div>

        <form onSubmit={handleRunTestSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder={
                isDe
                  ? "Suchbegriff eingeben (z. B. 'Balenciaga 3XL Sneaker' oder 'Chrome Hearts Ring')..."
                  : "Type a search query to log (e.g. 'Balenciaga 3XL Sneaker')..."
              }
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingTest || !testQuery.trim()}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-lg text-xs font-mono font-bold uppercase transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmittingTest ? "..." : isDe ? "Live Loggen" : "Log Query"}</span>
          </button>
        </form>
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
                      {gap.isLive && (
                        <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold rounded">
                          LIVE
                        </span>
                      )}
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
