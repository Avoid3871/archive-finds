"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Users,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Globe,
  Smartphone,
  Laptop,
  Eye,
  Layers,
  ArrowUpRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { AnalyticsSummary } from "@/lib/analytics/analyticsStore";

const AGENT_CONFIGS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  sugargoo: { label: "Sugargoo (VIP)", color: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500/30" },
  superbuy: { label: "Superbuy", color: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500/30" },
  mulebuy: { label: "Mulebuy", color: "text-blue-400", bg: "bg-blue-500", border: "border-blue-500/30" },
  cnfans: { label: "CNfans", color: "text-pink-400", bg: "bg-pink-500", border: "border-pink-500/30" },
  cssbuy: { label: "CSSbuy", color: "text-purple-400", bg: "bg-purple-500", border: "border-purple-500/30" },
  kakobuy: { label: "Kakobuy", color: "text-yellow-400", bg: "bg-yellow-500", border: "border-yellow-500/30" },
  hoobuy: { label: "Hoobuy", color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/30" },
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      }
    } catch (e) {
      console.warn("Failed to load analytics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  const totalAgentClicks = data?.totalAgentClicks || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <h1 className="font-mono font-black text-xl sm:text-2xl uppercase tracking-widest text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <span>LIVE ANALYTICS &amp; CONVERSIONS</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-neutral-400 mt-1 flex items-center gap-2">
            <span>Privacy-First Tracker</span>
            <span className="text-neutral-600">•</span>
            <span className="text-emerald-400">Zero Cookies</span>
            <span className="text-neutral-600">•</span>
            <span>100% GDPR / DSGVO Compliant</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-mono uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>

          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Vercel Analytics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Pageviews */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Pageviews (Tracked)</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-black text-white">
              {loading ? "..." : (data?.totalPageviews || 0).toLocaleString()}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Active</span>
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            Cookie-free organic visitor page impressions
          </p>
        </div>

        {/* Metric 2: Outgoing Agent Clicks */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Outgoing Agent Clicks</span>
            <MousePointerClick className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-black text-white">
              {loading ? "..." : (data?.totalAgentClicks || 0).toLocaleString()}
            </span>
            <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-mono font-bold rounded">
              CTR: {data?.ctr || 0}%
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            Direct routing to Sugargoo, Superbuy &amp; CNfans
          </p>
        </div>

        {/* Metric 3: Top Performing Agent */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Top Affiliate Agent</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-mono font-black text-orange-400 uppercase">
              SUGARGOO
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              VIP Member ID
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            Default 1-click checkout routing
          </p>
        </div>

        {/* Metric 4: Compliance & Privacy Status */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Privacy &amp; GDPR</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              100% COMPLIANT
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            No cookie banner required • Anonymized IPs
          </p>
        </div>
      </div>

      {/* ROW 1: AGENT BREAKDOWN & TRAFFIC SOURCES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Multi-Agent Click Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-emerald-400" />
                <span>Affiliate Agent Routing Breakdown</span>
              </h2>
              <p className="text-xs font-mono text-neutral-500">
                Click volume distribution across all 7 supported Chinese shopping agents
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-400">
              {totalAgentClicks} Total Clicks
            </span>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {Object.entries(AGENT_CONFIGS).map(([key, config]) => {
              const count = data?.agentBreakdown?.[key] || 0;
              const percentage = totalAgentClicks > 0 ? Math.round((count / totalAgentClicks) * 100) : 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`font-bold ${config.color} uppercase flex items-center gap-1.5`}>
                      <span className={`w-2 h-2 rounded-full ${config.bg}`} />
                      {config.label}
                    </span>
                    <span className="text-neutral-400">
                      <strong className="text-white">{count}</strong> clicks ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full ${config.bg} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(percentage, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>💡 All referral links automatically inject active partner codes.</span>
            <Link href="/admin/settings" className="text-emerald-400 hover:underline">
              Edit Codes ➔
            </Link>
          </div>
        </div>

        {/* Right Column: Traffic Referral Sources (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Traffic Sources</span>
              </h2>
              <p className="text-xs font-mono text-neutral-500">
                Where social audiences discover your drops
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(data?.trafficSources || []).map((src, idx) => (
              <div
                key={idx}
                className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono font-bold flex items-center justify-center">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {src.source}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 bg-neutral-900 text-neutral-300 rounded font-bold">
                    {src.count} visits
                  </span>
                  <span className="text-emerald-400 font-bold w-10 text-right">
                    {src.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: LIVE GEO / COUNTRIES & DEVICE BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Geo Countries (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Geographic Audience (Countries)</span>
              </h2>
              <p className="text-xs font-mono text-neutral-500">
                Real-time country distribution parsed from incoming visitor headers
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Live Edge Geo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(data?.countries || []).map((c, idx) => (
              <div
                key={c.code || idx}
                className="p-3.5 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span>{c.country}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {c.percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(c.percentage, 5)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-neutral-500 flex justify-between">
                  <span>Code: {c.code}</span>
                  <span>{c.count} impressions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices & OS (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Devices &amp; Platforms</span>
              </h2>
              <p className="text-xs font-mono text-neutral-500">
                Mobile vs. Desktop audience breakdown
              </p>
            </div>
            <span className="text-xs font-mono text-blue-400 font-bold">
              Device Split
            </span>
          </div>

          <div className="space-y-3">
            {(data?.devices || []).map((dev, idx) => (
              <div
                key={idx}
                className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-2">
                    {dev.type === "mobile" ? (
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Laptop className="w-4 h-4 text-purple-400" />
                    )}
                    <span>{dev.device}</span>
                  </span>
                  <span className="text-blue-400 font-bold">
                    {dev.percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dev.type === "mobile" ? "bg-cyan-400" : "bg-purple-400"
                    }`}
                    style={{ width: `${Math.max(dev.percentage, 5)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-neutral-500 flex justify-between">
                  <span className="capitalize">{dev.type} Hardware</span>
                  <span>{dev.count} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP CLICKED PIECES TABLE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Top Sourced Grails &amp; Conversion Leaders</span>
            </h2>
            <p className="text-xs font-mono text-neutral-500">
              Pieces driving the highest click-through rates and international orders
            </p>
          </div>
          <Link
            href="/admin/slides"
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Create Carousels with Top Grails</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4"># Rank</th>
                <th className="py-3 px-4">Brand / Designer</th>
                <th className="py-3 px-4">Piece Title</th>
                <th className="py-3 px-4">Catalog Price</th>
                <th className="py-3 px-4 text-right">Clicks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {(data?.topProducts || []).map((item, idx) => (
                <tr key={item.slug || idx} className="hover:bg-neutral-950/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-neutral-500">
                    #{String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white uppercase">
                    {item.brand}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-300 max-w-xs truncate">
                    {item.title}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">
                    ${typeof item.price === "number" ? item.price.toFixed(2) : item.price} USD
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800/60 text-emerald-400 font-bold rounded">
                      {item.clicks} Clicks
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/product/${item.slug}`}
                      target="_blank"
                      className="text-neutral-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
