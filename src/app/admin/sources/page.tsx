"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Play,
  Flame,
  ExternalLink,
  Sparkles,
  Scissors,
  Check,
  X,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  SlidersHorizontal,
  AlertTriangle,
  AlertOctagon,
  Edit3,
  Trash2,
  Search,
  Terminal,
  Square,
  Activity,
  ChevronDown,
  ChevronUp,
  Copy,
  Zap,
} from "lucide-react";
import Image from "next/image";

interface DiscoveredItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  sourcePrice: number;
  estimatedRetail: number;
  sugargooUrl: string;
  affiliateLink: string;
  rawMarketUrl: string;
  redditPostUrl: string;
  localImage: string;
  slug: string;
  status: string;
  rawImageSrc: string;
  season?: string;
}

interface SheetSource {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  itemsCount: number;
  lastScanned: string;
  status: "ACTIVE" | "IDLE" | "SCANNING";
}

interface HealthItem {
  id: string;
  title: string;
  brand: string;
  sugargooUrl: string;
  directStoreLink: string;
  status: "HEALTHY" | "DEAD" | "FLAGGED";
  httpStatus: number | null;
  delistedReason: string | null;
  note: string;
}

interface HealthReport {
  timestamp: string;
  totalChecked: number;
  healthyCount: number;
  deadCount: number;
  flaggedCount: number;
  items: HealthItem[];
}

const INITIAL_SOURCES: SheetSource[] = [
  {
    id: "src-1",
    name: "Archive Finds Main Collector Feed",
    spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    sheetName: "Sheet1",
    itemsCount: 106,
    lastScanned: "Just now",
    status: "ACTIVE",
  },
];

export default function AdminSourcesPage() {
  const [activeTab, setActiveTab] = useState<"reddit" | "quick-ingest" | "health" | "sheets">("reddit");
  
  // Reddit Scanner Live Progress States
  const [isScanningReddit, setIsScanningReddit] = useState(false);
  const [scanLimit, setScanLimit] = useState(10);
  const [autoApprove, setAutoApprove] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    percent: number;
    message: string;
    current: number;
    total: number;
    foundCount: number;
    phase: string;
    item?: string;
  }>({
    percent: 0,
    message: "Crawler Ready",
    current: 0,
    total: 10,
    foundCount: 0,
    phase: "IDLE",
  });
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [showLiveTerminal, setShowLiveTerminal] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [discoveredItems, setDiscoveredItems] = useState<DiscoveredItem[]>([]);
  const [approvingSlug, setApprovingSlug] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveLogs, autoScroll]);


  // Quick Ingest States
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingestBrand, setIngestBrand] = useState("Rick Owens");
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestCategory, setIngestCategory] = useState("Outerwear");
  const [ingestPrice, setIngestPrice] = useState("65");
  const [ingestImage, setIngestImage] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Link Health States
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [isAuditingHealth, setIsAuditingHealth] = useState(false);
  const [healthFilter, setHealthFilter] = useState<"all" | "dead" | "flagged" | "healthy">("all");
  const [healthSearch, setHealthSearch] = useState("");
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [newUrlInput, setNewUrlInput] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Google Sheets States
  const [sources, setSources] = useState<SheetSource[]>(INITIAL_SOURCES);
  const [newName, setNewName] = useState("");
  const [newSheetId, setNewSheetId] = useState("");
  const [newTab, setNewTab] = useState("Sheet1");

  // Fetch cached data on load
  useEffect(() => {
    fetchDiscovered();
    fetchHealthReport();
  }, []);

  const fetchDiscovered = async () => {
    try {
      const res = await fetch("/api/admin/reddit-scanner");
      const data = await res.json();
      if (data.items) {
        setDiscoveredItems(data.items);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHealthReport = async () => {
    try {
      const res = await fetch("/api/admin/link-health");
      const data = await res.json();
      if (data.report) {
        setHealthReport(data.report);
      }
    } catch (e) {
      console.error("Failed to load health report:", e);
    }
  };

  const handleRunHealthAudit = async () => {
    setIsAuditingHealth(true);
    try {
      const res = await fetch("/api/admin/link-health?action=run-audit");
      const data = await res.json();
      if (data.report) {
        setHealthReport(data.report);
      }
    } catch (e) {
      console.error("Audit error:", e);
    } finally {
      setIsAuditingHealth(false);
    }
  };

  const handleHealthAction = async (productId: string, action: "approve" | "delist" | "update_url", newUrl?: string) => {
    setActionLoadingId(productId);
    try {
      const res = await fetch("/api/admin/link-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action, newUrl }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local health state
        if (healthReport) {
          const updatedItems = healthReport.items.map((it) => {
            if (it.id === productId) {
              return {
                ...it,
                status: action === "delist" ? ("DEAD" as const) : ("HEALTHY" as const),
                note: action === "delist" ? "Delisted by admin" : "Approved & verified by admin",
                directStoreLink: newUrl || it.directStoreLink,
              };
            }
            return it;
          });
          setHealthReport({
            ...healthReport,
            items: updatedItems,
          });
        }
        setEditingUrlId(null);
        setNewUrlInput("");
      } else {
        alert(`Action failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleScanReddit = async () => {
    setIsScanningReddit(true);
    setLiveLogs([]);
    setScanProgress({
      percent: 2,
      message: "Connecting stealth crawler to r/QualityReps feeds...",
      current: 0,
      total: scanLimit,
      foundCount: 0,
      phase: "INIT",
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/admin/reddit-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: scanLimit, autoAdd: autoApprove }),
        signal: controller.signal,
      });

      if (!res.body) {
        throw new Error("ReadableStream not supported on this browser.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          const lines = eventBlock.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            try {
              const payload = JSON.parse(trimmed.replace(/^data:\s*/, ""));

              if (payload.type === "progress" && payload.data) {
                setScanProgress((prev) => ({
                  ...prev,
                  ...payload.data,
                }));
              } else if (payload.type === "log" && payload.text) {
                setLiveLogs((prev) => [...prev.slice(-200), payload.text]);
              } else if (payload.type === "stderr" && payload.text) {
                setLiveLogs((prev) => [...prev.slice(-200), `⚠️ ${payload.text}`]);
              } else if (payload.type === "done") {
                setScanProgress((prev) => ({
                  ...prev,
                  percent: 100,
                  message: payload.message || "Scan finished!",
                  phase: "COMPLETE",
                }));
                if (payload.items) {
                  setDiscoveredItems(payload.items);
                }
              } else if (payload.type === "error") {
                setScanProgress((prev) => ({
                  ...prev,
                  message: `Crawler Error: ${payload.error}`,
                  phase: "ERROR",
                }));
              }
            } catch (err) {
              // Ignore partial JSON parse errors in stream
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setScanProgress((prev) => ({
          ...prev,
          message: "Scan aborted by user.",
          phase: "ABORTED",
        }));
        setLiveLogs((prev) => [...prev, "🛑 Scan stopped by user."]);
      } else {
        setScanProgress((prev) => ({
          ...prev,
          message: `Network error: ${e.message}`,
          phase: "ERROR",
        }));
        setLiveLogs((prev) => [...prev, `❌ Error: ${e.message}`]);
      }
    } finally {
      setIsScanningReddit(false);
      abortControllerRef.current = null;
      fetchDiscovered();
    }
  };

  const handleStopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleApprovePiece = async (item: DiscoveredItem) => {
    setApprovingSlug(item.slug);
    try {
      const res = await fetch("/api/admin/ingest-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: item.rawMarketUrl || item.sugargooUrl,
          brand: item.brand,
          title: item.title.replace(`${item.brand} - `, ""),
          category: item.category,
          price: item.sourcePrice,
          rawImageSrc: item.rawImageSrc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredItems((prev) => prev.filter((i) => i.slug !== item.slug));
        alert(`Approved & Ingested: ${item.title}! 3 slide styles generated.`);
      } else {
        alert(`Error ingesting: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setApprovingSlug(null);
    }
  };

  const handleQuickIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestUrl.trim()) return;

    setIsIngesting(true);
    setIngestMessage(null);

    try {
      const res = await fetch("/api/admin/ingest-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: ingestUrl,
          brand: ingestBrand,
          title: ingestTitle || `${ingestBrand} Piece`,
          category: ingestCategory,
          price: parseFloat(ingestPrice) || 59,
          rawImageSrc: ingestImage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIngestMessage({
          type: "success",
          text: "Piece successfully ingested! AI cutout created & all 3 slide styles generated.",
        });
        setIngestUrl("");
        setIngestTitle("");
        setIngestImage("");
      } else {
        setIngestMessage({ type: "error", text: data.error || "Failed to ingest piece." });
      }
    } catch (err: any) {
      setIngestMessage({ type: "error", text: err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIdentifyModel = async () => {
    const query = ingestTitle.trim() || ingestBrand.trim();
    if (!query) return;
    setIsIdentifying(true);
    try {
      const res = await fetch("/api/admin/identify-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.canonicalTitle) setIngestTitle(data.data.canonicalTitle);
        if (data.data.brand && data.data.brand !== "Archive Collection") setIngestBrand(data.data.brand);
        if (data.data.category) setIngestCategory(data.data.category);
        if (data.data.studioImageUrl) setIngestImage(data.data.studioImageUrl);
      }
    } catch (e) {
      console.error("AI Lens identification failed:", e);
    } finally {
      setIsIdentifying(false);
    }
  };

  // Filtered health items
  const filteredHealthItems = healthReport?.items.filter((item) => {
    if (healthFilter === "dead" && item.status !== "DEAD") return false;
    if (healthFilter === "flagged" && item.status !== "FLAGGED") return false;
    if (healthFilter === "healthy" && item.status !== "HEALTHY") return false;
    if (healthSearch.trim()) {
      const q = healthSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.directStoreLink && item.directStoreLink.toLowerCase().includes(q))
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-red-400 fill-red-400" />
              Sourcing Hub & Pipeline
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono">
              Sugargoo ID: 1325437696506389977
            </span>
          </div>
          <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white">
            GRAIL SOURCING & INGESTION
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Automated Reddit r/QualityReps crawler, de-obfuscation parser, AI studio cutouts, link health monitor, and 1-click affiliate converter.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("reddit")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "reddit"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>r/QualityReps Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab("quick-ingest")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "quick-ingest"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Ingest</span>
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "health"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Link Health & Dead Links</span>
          </button>
          <button
            onClick={() => setActiveTab("sheets")}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded ${
              activeTab === "sheets"
                ? "bg-white text-black font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: r/QualityReps Scanner */}
      {activeTab === "reddit" && (
        <div className="space-y-6">
          {/* Scanner Control Box with Live Progress HUD */}
          <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-5 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>r/QualityReps Automated Ingestion Engine</span>
                </h2>
                <p className="text-xs font-mono text-neutral-400 mt-1 max-w-2xl">
                  Playwright stealth scraper, auto-extracts Taobao/Weidian links, converts to Sugargoo VIP links, matches pristine studio flat-lays, and generates AI cutouts (`rembg`).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 border border-neutral-800 rounded">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Posts Limit:</label>
                  <select
                    value={scanLimit}
                    onChange={(e) => setScanLimit(Number(e.target.value))}
                    disabled={isScanningReddit}
                    className="bg-transparent text-xs font-mono text-white focus:outline-none disabled:opacity-50"
                  >
                    <option value={5} className="bg-neutral-900">5 Posts</option>
                    <option value={10} className="bg-neutral-900">10 Posts</option>
                    <option value={20} className="bg-neutral-900">20 Posts</option>
                    <option value={35} className="bg-neutral-900">35 Posts</option>
                    <option value={50} className="bg-neutral-900">50 Posts</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-neutral-950 px-3 py-1.5 border border-neutral-800 rounded text-xs font-mono text-neutral-300">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    disabled={isScanningReddit}
                    className="rounded bg-neutral-900 border-neutral-700 text-white focus:ring-0 disabled:opacity-50"
                  />
                  <span>Auto-Approve & Save</span>
                </label>

                {isScanningReddit ? (
                  <button
                    onClick={handleStopScan}
                    className="px-5 py-2.5 bg-red-950/60 text-red-300 border border-red-700/60 font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-900/60 transition-colors flex items-center gap-2 rounded"
                  >
                    <Square className="w-3.5 h-3.5 fill-red-400" />
                    <span>STOP SCAN</span>
                  </button>
                ) : (
                  <button
                    onClick={handleScanReddit}
                    className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 rounded shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>START REDDIT SCAN</span>
                  </button>
                )}
              </div>
            </div>

            {/* LIVE PROGRESS BAR HUD */}
            <div className="p-4 bg-black/90 border border-neutral-800/90 rounded-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    {isScanningReddit && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isScanningReddit ? "bg-emerald-500" : scanProgress.percent === 100 ? "bg-cyan-400" : "bg-neutral-600"}`}></span>
                  </span>
                  
                  <span className="font-bold text-white uppercase tracking-wider">
                    {isScanningReddit ? "CRAWLER ACTIVE" : scanProgress.percent === 100 ? "SCAN COMPLETE" : "CRAWLER STANDBY"}
                  </span>

                  <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 text-[10px] rounded uppercase border border-neutral-800">
                    PHASE: {scanProgress.phase || "IDLE"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-neutral-400 text-xs">
                  {scanProgress.current > 0 && (
                    <span>Post <strong className="text-white">{scanProgress.current}</strong> of <strong className="text-white">{scanProgress.total}</strong></span>
                  )}
                  <span className="text-emerald-400 font-bold">
                    {scanProgress.foundCount} Verified Grails
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-bold rounded">
                    {scanProgress.percent}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden relative p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                  style={{ width: `${scanProgress.percent}%` }}
                />
              </div>

              {/* Live Operation Status Subtitle */}
              <div className="flex items-center justify-between text-xs font-mono pt-1 text-neutral-300">
                <div className="flex items-center gap-2 truncate">
                  <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${isScanningReddit ? "text-yellow-400 animate-pulse" : "text-neutral-500"}`} />
                  <span className="truncate">
                    {scanProgress.message || "Ready. Click 'Start Reddit Scan' to crawl r/QualityReps."}
                  </span>
                </div>

                <button
                  onClick={() => setShowLiveTerminal(!showLiveTerminal)}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 flex-shrink-0 ml-3"
                >
                  <Terminal className="w-3 h-3 text-neutral-400" />
                  <span>{showLiveTerminal ? "Hide Console" : "Show Console"}</span>
                  {showLiveTerminal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Collapsible Live Streaming Terminal Console */}
              {showLiveTerminal && (
                <div className="mt-3 border-t border-neutral-800/80 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-bold">TERMINAL OUTPUT STREAM</span>
                      <span>({liveLogs.length} lines)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer hover:text-neutral-300">
                        <input
                          type="checkbox"
                          checked={autoScroll}
                          onChange={(e) => setAutoScroll(e.target.checked)}
                          className="w-3 h-3 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0"
                        />
                        <span>Auto-scroll</span>
                      </label>

                      <button
                        onClick={() => setLiveLogs([])}
                        className="hover:text-neutral-300 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-44 bg-black/95 border border-neutral-800 rounded p-3 font-mono text-xs overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
                    {liveLogs.length === 0 ? (
                      <p className="text-neutral-600 italic">
                        Terminal logs will stream here live when a scan is initiated...
                      </p>
                    ) : (
                      liveLogs.map((log, lIdx) => {
                        const isSuccess = log.includes("✓") || log.includes("[VERIFIED") || log.includes("[STUDIO MATCH]");
                        const isWarning = log.includes("⚠️") || log.includes("Skipping") || log.includes("[REJECTED]");
                        const isCutout = log.includes("AI cutout") || log.includes("rembg");
                        const isSearch = log.includes("[IMAGE SEARCH]");

                        return (
                          <div
                            key={lIdx}
                            className={`font-mono text-[11px] leading-relaxed break-all ${
                              isSuccess
                                ? "text-emerald-400 font-semibold"
                                : isWarning
                                ? "text-neutral-500"
                                : isCutout
                                ? "text-amber-300"
                                : isSearch
                                ? "text-cyan-300"
                                : "text-neutral-300"
                            }`}
                          >
                            {log}
                          </div>
                        );
                      })
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discovered Items Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-widest text-white flex items-center gap-2">
                <span>Discovered Grails Awaiting Moderation</span>
                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-xs rounded-full font-mono">
                  {discoveredItems.length}
                </span>
              </h2>

              <button
                onClick={fetchDiscovered}
                className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {discoveredItems.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
                <p className="font-mono text-neutral-400 text-sm">No items in the moderation queue.</p>
                <p className="font-mono text-neutral-600 text-xs">
                  Run the scanner above to pull fresh finds from r/QualityReps or use 1-Click Ingest.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoveredItems.map((item) => (
                  <div
                    key={item.slug}
                    className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 font-mono text-[10px] uppercase rounded">
                          {item.brand}
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          ${item.sourcePrice}
                        </span>
                      </div>

                      <h3 className="font-mono text-sm font-bold text-white line-clamp-2">
                        {item.title}
                      </h3>

                      {item.rawImageSrc && (
                        <div className="w-full h-36 bg-black rounded border border-neutral-800 overflow-hidden relative">
                          <img
                            src={item.rawImageSrc}
                            alt={item.title}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-neutral-500 space-y-1 pt-1">
                        <div className="truncate">
                          <span className="text-neutral-400">Source: </span>
                          <a
                            href={item.rawMarketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {item.rawMarketUrl}
                          </a>
                        </div>
                        <div className="truncate">
                          <span className="text-neutral-400">Reddit: </span>
                          <a
                            href={item.redditPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:underline"
                          >
                            r/QualityReps Post
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex items-center gap-2">
                      <button
                        onClick={() => handleApprovePiece(item)}
                        disabled={approvingSlug === item.slug}
                        className="flex-1 py-2 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 rounded disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{approvingSlug === item.slug ? "INGESTING..." : "APPROVE & INGEST"}</span>
                      </button>

                      <button
                        onClick={() =>
                          setDiscoveredItems((prev) => prev.filter((i) => i.slug !== item.slug))
                        }
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 1-Click Ingest */}
      {activeTab === "quick-ingest" && (
        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>1-Click Grail Ingestion Studio</span>
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Enter any Taobao, Weidian, 1688 or Yupoo link. The system will automatically convert it into a Sugargoo affiliate link, extract clean flat-lay photos, isolate transparent cutouts, and render all 3 slide styles (`viral_minimal`, `editorial_dark`, `minimal_dark`).
            </p>
          </div>

          {ingestMessage && (
            <div
              className={`p-3 rounded font-mono text-xs ${
                ingestMessage.type === "success"
                  ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                  : "bg-red-950/60 border border-red-800 text-red-300"
              }`}
            >
              {ingestMessage.text}
            </div>
          )}

          <form onSubmit={handleQuickIngest} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                Direct Product / Marketplace URL (Taobao, Weidian, 1688) *
              </label>
              <input
                type="text"
                required
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
                placeholder="https://item.taobao.com/item.htm?id=... or https://weidian.com/item.html?itemID=..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Brand / Designer
                </label>
                <input
                  type="text"
                  value={ingestBrand}
                  onChange={(e) => setIngestBrand(e.target.value)}
                  placeholder="Rick Owens"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Category
                </label>
                <select
                  value={ingestCategory}
                  onChange={(e) => setIngestCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                >
                  <option value="Outerwear">Outerwear</option>
                  <option value="Hoodies">Hoodies</option>
                  <option value="Denim">Denim</option>
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase text-neutral-400">
                    Piece Name / Title
                  </label>
                  <button
                    type="button"
                    onClick={handleIdentifyModel}
                    disabled={isIdentifying || (!ingestTitle && !ingestBrand)}
                    className="text-[9px] font-mono uppercase text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 disabled:opacity-40"
                  >
                    <Search className="w-2.5 h-2.5" />
                    <span>{isIdentifying ? "Identifying..." : "AI Lens Identify"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. Vintage Jumbo Cargo Pants or RO V-ns"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Sourcing Price (USD)
                </label>
                <input
                  type="number"
                  value={ingestPrice}
                  onChange={(e) => setIngestPrice(e.target.value)}
                  placeholder="59"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                Source Image URL (Optional - leave blank to auto-fetch studio flat lay)
              </label>
              <input
                type="text"
                value={ingestImage}
                onChange={(e) => setIngestImage(e.target.value)}
                placeholder="https://... image link"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={isIngesting}
              className="w-full py-3 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 rounded disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isIngesting ? "animate-spin" : ""}`} />
              <span>{isIngesting ? "PROCESSING AI CUTOUT & SLIDES..." : "INGEST PIECE & GENERATE SLIDES"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Link Health & Dead Links Inspector */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {/* Health Overview Banner */}
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Link Health & Dead Link Moderation Station</span>
                </h2>
                <p className="text-xs font-mono text-neutral-400 mt-1 max-w-2xl">
                  Automatically tests marketplace URLs (Taobao, Weidian, 1688) & Sugargoo affiliate routes. Flags delisted items ("商品已下架", 404s, missing items) so you can review, keep, replace, or delist them with 1-click.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunHealthAudit}
                  disabled={isAuditingHealth}
                  className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 rounded disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuditingHealth ? "animate-spin" : ""}`} />
                  <span>{isAuditingHealth ? "AUDITING CATALOG..." : "RUN FULL HEALTH AUDIT"}</span>
                </button>
              </div>
            </div>

            {/* Health Stats Grid */}
            {healthReport && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block">Total Audited</span>
                  <span className="text-lg font-mono font-bold text-white">{healthReport.totalChecked} Pieces</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-emerald-900/40 rounded">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block">🟢 Healthy Active</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{healthReport.healthyCount} Pieces</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-amber-900/40 rounded">
                  <span className="text-[10px] font-mono uppercase text-amber-400 block">🟡 Flagged Review</span>
                  <span className="text-lg font-mono font-bold text-amber-400">{healthReport.flaggedCount} Pieces</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-red-900/40 rounded">
                  <span className="text-[10px] font-mono uppercase text-red-400 block">🔴 Dead / Delisted</span>
                  <span className="text-lg font-mono font-bold text-red-400">{healthReport.deadCount} Pieces</span>
                </div>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/50 p-3 border border-neutral-800 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHealthFilter("all")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "all" ? "bg-white text-black font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                All ({healthReport?.items.length || 0})
              </button>
              <button
                onClick={() => setHealthFilter("dead")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "dead" ? "bg-red-500 text-white font-bold" : "text-red-400 hover:text-red-300"
                }`}
              >
                Dead ({healthReport?.deadCount || 0})
              </button>
              <button
                onClick={() => setHealthFilter("flagged")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "flagged" ? "bg-amber-500 text-black font-bold" : "text-amber-400 hover:text-amber-300"
                }`}
              >
                Flagged ({healthReport?.flaggedCount || 0})
              </button>
              <button
                onClick={() => setHealthFilter("healthy")}
                className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                  healthFilter === "healthy" ? "bg-emerald-500 text-black font-bold" : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                Healthy ({healthReport?.healthyCount || 0})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search pieces or links..."
                value={healthSearch}
                onChange={(e) => setHealthSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Items Table / Cards */}
          <div className="space-y-3">
            {filteredHealthItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-neutral-800 rounded-xl">
                <p className="font-mono text-neutral-500 text-xs">No pieces found matching this filter.</p>
              </div>
            ) : (
              filteredHealthItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-500 font-bold">#{item.id}</span>
                      <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 font-mono text-[10px] uppercase rounded">
                        {item.brand}
                      </span>
                      {item.status === "HEALTHY" && (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>HEALTHY</span>
                        </span>
                      )}
                      {item.status === "FLAGGED" && (
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>FLAGGED FOR REVIEW</span>
                        </span>
                      )}
                      {item.status === "DEAD" && (
                        <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono rounded flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          <span>DELISTED / 404</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-mono text-sm font-bold text-white">
                      {item.title}
                    </h3>

                    <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Note:</span>
                        <span>{item.note || "No audit notes"}</span>
                      </div>
                      {item.directStoreLink && (
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-neutral-500">Marketplace:</span>
                          <a
                            href={item.directStoreLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline truncate"
                          >
                            {item.directStoreLink}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Inline Edit URL Form */}
                    {editingUrlId === item.id && (
                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Paste new Taobao / Weidian link..."
                          value={newUrlInput}
                          onChange={(e) => setNewUrlInput(e.target.value)}
                          className="px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs font-mono text-white flex-1 focus:outline-none focus:border-white"
                        />
                        <button
                          onClick={() => handleHealthAction(item.id, "update_url", newUrlInput)}
                          disabled={!newUrlInput.trim() || actionLoadingId === item.id}
                          className="px-3 py-1.5 bg-white text-black font-mono text-xs font-bold uppercase rounded hover:bg-neutral-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingUrlId(null);
                            setNewUrlInput("");
                          }}
                          className="px-2 py-1.5 text-neutral-400 hover:text-white font-mono text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <a
                      href={item.sugargooUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test Sugargoo</span>
                    </a>

                    <button
                      onClick={() => {
                        setEditingUrlId(item.id);
                        setNewUrlInput(item.directStoreLink || "");
                      }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Update URL</span>
                    </button>

                    {item.status !== "HEALTHY" && (
                      <button
                        onClick={() => handleHealthAction(item.id, "approve")}
                        disabled={actionLoadingId === item.id}
                        className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Keep / Approve</span>
                      </button>
                    )}

                    {item.status !== "DEAD" && (
                      <button
                        onClick={() => handleHealthAction(item.id, "delist")}
                        disabled={actionLoadingId === item.id}
                        className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delist Piece</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Google Sheets */}
      {activeTab === "sheets" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-neutral-400" />
                    <div>
                      <h2 className="font-mono font-bold text-sm text-white">{src.name}</h2>
                      <p className="text-[10px] font-mono text-neutral-500">
                        Tab: {src.sheetName} • {src.itemsCount} products
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono rounded">
                    {src.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-800 text-xs font-mono grid grid-cols-2 gap-2 text-neutral-400">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Sheet ID:</span>
                    <span className="text-neutral-300 truncate block">{src.spreadsheetId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Last Scanned:</span>
                    <span className="text-neutral-300 block">{src.lastScanned}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-widest text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Connect Secondary Google Sheet</span>
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim() || !newSheetId.trim()) return;
                setSources([
                  ...sources,
                  {
                    id: `src-${Date.now()}`,
                    name: newName,
                    spreadsheetId: newSheetId,
                    sheetName: newTab || "Sheet1",
                    itemsCount: 0,
                    lastScanned: "Never",
                    status: "ACTIVE",
                  },
                ]);
                setNewName("");
                setNewSheetId("");
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
            >
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Secondary Finds Sheet"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  required
                  value={newSheetId}
                  onChange={(e) => setNewSheetId(e.target.value)}
                  placeholder="e.g. 1BxiMVs0..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Sheet Tab Name
                </label>
                <input
                  type="text"
                  value={newTab}
                  onChange={(e) => setNewTab(e.target.value)}
                  placeholder="Sheet1"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors rounded"
                >
                  ADD SPREADSHEET SOURCE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
