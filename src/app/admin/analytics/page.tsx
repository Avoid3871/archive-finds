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
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Download,
  Trash2,
  SlidersHorizontal,
  Languages,
} from "lucide-react";
import { AnalyticsSummary } from "@/lib/analytics/analyticsStore";
import { InteractiveTimelineChart } from "@/components/admin/analytics/InteractiveTimelineChart";
import { CategoryBrandMatrix } from "@/components/admin/analytics/CategoryBrandMatrix";
import { OptimalPostTimesCard } from "@/components/admin/analytics/OptimalPostTimesCard";
import { SearchDemandGapsCard } from "@/components/admin/analytics/SearchDemandGapsCard";
import { ContentThemeRoiCard } from "@/components/admin/analytics/ContentThemeRoiCard";
import { InteractiveWorldMap } from "@/components/admin/analytics/InteractiveWorldMap";

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
  const [purging, setPurging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"graphs" | "table">("graphs");
  const [lang, setLang] = useState<"de" | "en">("de");
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("af_analytics_lang");
    if (saved === "en" || saved === "de") {
      setLang(saved);
    }
  }, []);

  const handleLanguageChange = (newLang: "de" | "en") => {
    setLang(newLang);
    localStorage.setItem("af_analytics_lang", newLang);
  };

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

  const handlePurgeDevData = async () => {
    const confirmMsg = lang === "de"
      ? "Möchtest du wirklich alle lokalen Entwickler- und Test-Events bereinigen? Dadurch werden die Statistiken auf eine saubere organische Besucher-Basis zurückgesetzt."
      : "Are you sure you want to purge all local dev / test session events? This resets metrics to a clean organic audience baseline.";

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setPurging(true);
      const res = await fetch("/api/admin/analytics/purge", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setToastNotice(
          lang === "de"
            ? "🧹 Test-Traffic bereinigt! Analytics auf saubere Besucher-Basis zurückgesetzt."
            : "🧹 Dev test traffic purged! Analytics reset to clean organic baseline."
        );
        setTimeout(() => setToastNotice(null), 4000);
        await fetchAnalytics();
      }
    } catch (e: any) {
      console.warn("Failed to purge dev events:", e);
    } finally {
      setPurging(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const isDe = lang === "de";
  const totalAgentClicks = data?.totalAgentClicks || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border bg-emerald-950/95 border-emerald-500 text-emerald-200 font-mono text-xs flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* TOP TITLE & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <h1 className="font-mono font-black text-xl sm:text-2xl uppercase tracking-widest text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <span>{isDe ? "LIVE ANALYTIK & CONVERSIONS" : "LIVE ANALYTICS & CONVERSIONS"}</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-neutral-400 mt-1 flex items-center gap-2">
            <span>{isDe ? "DSGVO-konformer Edge-Tracker" : "Privacy-First Edge Tracker"}</span>
            <span className="text-neutral-600">•</span>
            <span className="text-emerald-400">{isDe ? "Keine Cookies" : "Zero Cookies"}</span>
            <span className="text-neutral-600">•</span>
            <span>{isDe ? "Deutsche Uhrzeiten (MEZ)" : "100% GDPR Compliant"}</span>
          </p>
        </div>

        {/* Controls: Language Switcher + View Mode + Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Switcher (DE / EN) */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => handleLanguageChange("de")}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
                isDe
                  ? "bg-emerald-500 text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>🇩🇪 DE</span>
            </button>
            <button
              onClick={() => handleLanguageChange("en")}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
                !isDe
                  ? "bg-emerald-500 text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>🇬🇧 EN</span>
            </button>
          </div>

          {/* View Switcher (Graphs vs Table) */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("graphs")}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-lg cursor-pointer ${
                viewMode === "graphs"
                  ? "bg-white text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isDe ? "Grafik-Ansicht" : "Graph View"}</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-lg cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{isDe ? "Tabellen-Matrix" : "Data Matrix"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{refreshing ? (isDe ? "Aktualisiere..." : "Updating...") : (isDe ? "Aktualisieren" : "Refresh")}</span>
          </button>
        </div>
      </div>

      {/* OPERATOR FILTER NOTICE & RESET BAR */}
      <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5 text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-400 uppercase">
              {isDe ? "Operator-Filter Aktiv:" : "Operator Filter Active:"}
            </strong>{" "}
            {isDe
              ? "Deine eigenen Seitenaufrufe, Test-Klicks und Admin-Sitzungen werden automatisch aus den Statistiken herausgefiltert."
              : "Your own pageviews, test clicks & admin sessions are automatically excluded from analytics metrics."}
          </span>
        </div>

        <button
          type="button"
          onClick={handlePurgeDevData}
          disabled={purging}
          title={isDe ? "Alte lokale Test-Events löschen" : "Reset past local test events"}
          className="px-3 py-1.5 bg-neutral-950 hover:bg-red-950/60 text-neutral-400 hover:text-red-300 border border-neutral-800 hover:border-red-800 rounded-lg text-[11px] font-mono uppercase font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
          <span>{purging ? (isDe ? "Bereinige..." : "Purging...") : (isDe ? "Test-Daten Bereinigen" : "Purge Dev Test Data")}</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Pageviews */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">
              {isDe ? "Seitenaufrufe (Gesamt)" : "Pageviews (Tracked)"}
            </span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono font-black text-white">
              {loading ? "..." : (data?.totalPageviews || 0).toLocaleString()}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>{isDe ? "Aktiv" : "Active"}</span>
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            {isDe ? "Organische Besucher-Impressionen" : "Cookie-free organic visitor impressions"}
          </p>
        </div>

        {/* Metric 2: Outgoing Agent Clicks */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">
              {isDe ? "Ausgehende Agent-Klicks" : "Outgoing Agent Clicks"}
            </span>
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
            {isDe ? "Weiterleitungen zu Sugargoo, Superbuy etc." : "Direct routing to Sugargoo, Superbuy & CNfans"}
          </p>
        </div>

        {/* Metric 3: Top Performing Agent */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">
              {isDe ? "Top Affiliate-Agent" : "Top Affiliate Agent"}
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-mono font-black text-orange-400 uppercase">
              SUGARGOO
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              VIP Member
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            {isDe ? "Standardmäßiges 1-Klick-Routing" : "Default 1-click checkout routing"}
          </p>
        </div>

        {/* Metric 4: Compliance & Privacy Status */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">
              {isDe ? "DSGVO & Datenschutz" : "Privacy & GDPR"}
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {isDe ? "100% KONFORM" : "100% COMPLIANT"}
            </span>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            {isDe ? "Kein Cookie-Banner erforderlich" : "No cookie banner required • Anonymized IPs"}
          </p>
        </div>
      </div>

      {/* 1. OPTIMAL POSTING TIMES & VIRALITY HEATMAP CARD */}
      {data?.optimalPostTimes && (
        <OptimalPostTimesCard insights={data.optimalPostTimes} lang={lang} />
      )}

      {/* 2. INTERACTIVE VISITOR WORLD MAP (GLOBAL HOTSPOTS) */}
      <InteractiveWorldMap
        hotspots={data?.geoHotspots || []}
        countries={data?.countries || []}
        lang={lang}
      />

      {/* 3. SEARCH DEMAND GAPS (WHAT VISITORS ARE SEARCHING) */}
      <SearchDemandGapsCard
        gaps={data?.searchDemandGaps || []}
        hasLiveSearches={data?.hasLiveSearches}
        lang={lang}
        onTestSearchLogged={fetchAnalytics}
      />

      {/* 4. CONTENT & SLIDE THEME ROI ATTRIBUTION */}
      <ContentThemeRoiCard
        rois={data?.slideThemeRois || []}
        lang={lang}
      />

      {/* VIEW MODE 1: VISUAL GRAPHS & INTERACTIVE CHARTS */}
      {viewMode === "graphs" && (
        <div className="space-y-8">
          {/* INTERACTIVE TIMELINE CHART */}
          <InteractiveTimelineChart
            timeline={data?.timeline || []}
            timeline24h={data?.timeline24h || []}
          />

          {/* AGENT BREAKDOWN & TRAFFIC SOURCES GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Multi-Agent Click Distribution (7 cols) */}
            <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-emerald-400" />
                    <span>{isDe ? "Affiliate-Agenten Klickverteilung" : "Affiliate Agent Routing Breakdown"}</span>
                  </h2>
                  <p className="text-xs font-mono text-neutral-500">
                    {isDe
                      ? "Klickvolumen aufgeschlüsselt über alle 7 unterstützten Shopping-Agenten"
                      : "Click volume distribution across all 7 supported Chinese shopping agents"}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-400">
                  {totalAgentClicks} {isDe ? "Klicks" : "Total Clicks"}
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
                          <strong className="text-white">{count}</strong> {isDe ? "Klicks" : "clicks"} ({percentage}%)
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
            </div>

            {/* Right Column: Traffic Inflow & Top Referrers (5 cols) */}
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{isDe ? "Traffic-Einstiegskanäle" : "Traffic Inflow Channels"}</span>
                  </h2>
                  <p className="text-xs font-mono text-neutral-500">
                    {isDe ? "Woher deine viralen Besucher kommen" : "Where your viral haul visitors originate from"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data?.trafficSources?.map((src) => (
                  <div
                    key={src.source}
                    className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="text-xs font-mono text-white font-medium">{src.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">
                        {src.count} {isDe ? "Aufrufe" : "views"}
                      </span>
                      <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] font-mono rounded">
                        {src.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GEOGRAPHY & DEVICE DISTRIBUTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Geo Distribution */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>{isDe ? "Geografische Zielgruppe (Länder-Split)" : "Geographic Audience (Country Split)"}</span>
                  </h2>
                  <p className="text-xs font-mono text-neutral-500">
                    {isDe
                      ? "Bereinigt um Entwickler-Zugriffe • Echte Besucher-Herkunft"
                      : "Cleaned of developer local noise • Organic visitor regions"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(!data?.countries || data.countries.length === 0) ? (
                  <div className="p-6 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-center space-y-2">
                    <Globe className="w-6 h-6 text-neutral-600 mx-auto" />
                    <p className="text-xs font-mono text-neutral-400 font-bold">
                      {isDe ? "Standby: Live Geo-Radar aktiv" : "Standby: Live Geo-Radar active"}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-600">
                      {isDe
                        ? "Erfasst automatisch die genaue Herkunft (Land & Stadt) aller neuen Besucher in Echtzeit."
                        : "Automatically records exact country & city of new visitors in real-time."}
                    </p>
                  </div>
                ) : (
                  data.countries.map((c) => (
                    <div
                      key={c.code}
                      className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{c.flag}</span>
                        <span className="text-xs font-mono text-white font-medium">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{c.count}</span>
                        <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-emerald-400 text-[10px] font-mono rounded font-bold">
                          {c.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Device Distribution */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    <span>{isDe ? "Geräte- & Plattform-Verhältnis" : "Device & Platform Ratio"}</span>
                  </h2>
                  <p className="text-xs font-mono text-neutral-500">
                    {isDe
                      ? "Optimiert für TikTok / Instagram In-App-Browser"
                      : "Optimized for mobile TikTok / Instagram in-app browsers"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(!data?.devices || data.devices.length === 0) ? (
                  <div className="p-6 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-center space-y-2">
                    <Smartphone className="w-6 h-6 text-neutral-600 mx-auto" />
                    <p className="text-xs font-mono text-neutral-400 font-bold">
                      {isDe ? "Warten auf Geräte-Telemetrie" : "Waiting for device telemetry"}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-600">
                      {isDe
                        ? "Erkennt automatisch iPhone / iOS, Android und Desktop-Browser."
                        : "Automatically detects iPhone / iOS, Android, and Desktop browsers."}
                    </p>
                  </div>
                ) : (
                  data.devices.map((d) => (
                    <div
                      key={d.device}
                      className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        {d.type === "mobile" ? (
                          <Smartphone className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Laptop className="w-4 h-4 text-cyan-400" />
                        )}
                        <span className="text-xs font-mono text-white font-medium">{d.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{d.count}</span>
                        <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-purple-300 text-[10px] font-mono rounded font-bold">
                          {d.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CATEGORY & BRAND MATRIX */}
          <CategoryBrandMatrix
            categoryBreakdown={data?.categoryBreakdown || []}
            topBrands={data?.topBrands || []}
          />
        </div>
      )}

      {/* VIEW MODE 2: RAW DATA MATRIX */}
      {viewMode === "table" && (
        <div className="space-y-6">
          {/* Top Sourced Grails Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>{isDe ? "Top Sourced Grails (Produkt-Klickraten)" : "Top Sourced Grails (Product Level CTR)"}</span>
                </h2>
                <p className="text-xs font-mono text-neutral-500">
                  {isDe
                    ? "Die am meisten geklickten Designer-Pieces deiner TikTok- & IG-Zielgruppe"
                    : "Most engaged fashion pieces across your TikTok & IG audience"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isDe ? "Designer" : "Designer"}</th>
                    <th className="py-2.5 px-3">{isDe ? "Piece Name" : "Piece Title"}</th>
                    <th className="py-2.5 px-3">{isDe ? "Kategorie" : "Category"}</th>
                    <th className="py-2.5 px-3">{isDe ? "Preis" : "Price"}</th>
                    <th className="py-2.5 px-3 text-right">{isDe ? "Agent-Klicks" : "Agent Clicks"}</th>
                    <th className="py-2.5 px-3 text-right">{isDe ? "Aktion" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {data?.topProducts?.map((prod, idx) => (
                    <tr key={prod.slug || idx} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-3 text-neutral-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 uppercase text-neutral-300 font-bold">{prod.brand}</td>
                      <td className="py-3 px-3 text-white max-w-xs truncate">{prod.title}</td>
                      <td className="py-3 px-3 text-neutral-400">{prod.category}</td>
                      <td className="py-3 px-3 text-white">${prod.price}</td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">{prod.clicks}</td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/product/${prod.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <span>{isDe ? "Ansehen" : "View"}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
