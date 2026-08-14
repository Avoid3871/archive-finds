"use client";

import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"reddit" | "quick-ingest" | "sheets">("reddit");
  
  // Reddit Scanner States
  const [isScanningReddit, setIsScanningReddit] = useState(false);
  const [scanLimit, setScanLimit] = useState(10);
  const [autoApprove, setAutoApprove] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [discoveredItems, setDiscoveredItems] = useState<DiscoveredItem[]>([]);
  const [approvingSlug, setApprovingSlug] = useState<string | null>(null);

  // Quick Ingest States
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingestBrand, setIngestBrand] = useState("Rick Owens");
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestCategory, setIngestCategory] = useState("Outerwear");
  const [ingestPrice, setIngestPrice] = useState("65");
  const [ingestImage, setIngestImage] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Google Sheets States
  const [sources, setSources] = useState<SheetSource[]>(INITIAL_SOURCES);
  const [newName, setNewName] = useState("");
  const [newSheetId, setNewSheetId] = useState("");
  const [newTab, setNewTab] = useState("Sheet1");

  // Fetch cached discovered items on load
  useEffect(() => {
    fetchDiscovered();
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

  const handleScanReddit = async () => {
    setIsScanningReddit(true);
    setScanResult("Initiating Playwright stealth crawler on r/QualityReps & search feeds...");
    try {
      const res = await fetch("/api/admin/reddit-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: scanLimit, autoAdd: autoApprove }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data.message || "Scan finished successfully!");
        if (data.items) setDiscoveredItems(data.items);
      } else {
        setScanResult(`Scan error: ${data.error}`);
      }
    } catch (e: any) {
      setScanResult(`Network error: ${e.message}`);
    } finally {
      setIsScanningReddit(false);
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
            Automated Reddit r/QualityReps crawler, de-obfuscation parser, AI cutout studio, and 1-click affiliate converter.
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
          {/* Scanner Control Box */}
          <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>r/QualityReps Automated Ingestion Engine</span>
                </h2>
                <p className="text-xs font-mono text-neutral-400 mt-1 max-w-2xl">
                  Crawls new posts, [FIND] & [QC] flairs, extracts obfuscated Taobao / Weidian links, creates Sugargoo affiliate links, generates transparent AI cutouts (`rembg`), and updates the catalog.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 border border-neutral-800 rounded">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Posts Limit:</label>
                  <select
                    value={scanLimit}
                    onChange={(e) => setScanLimit(Number(e.target.value))}
                    className="bg-transparent text-xs font-mono text-white focus:outline-none"
                  >
                    <option value={5} className="bg-neutral-900">5 Posts</option>
                    <option value={10} className="bg-neutral-900">10 Posts</option>
                    <option value={20} className="bg-neutral-900">20 Posts</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-neutral-950 px-3 py-1.5 border border-neutral-800 rounded text-xs font-mono text-neutral-300">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-white focus:ring-0"
                  />
                  <span>Auto-Approve & Save</span>
                </label>

                <button
                  onClick={handleScanReddit}
                  disabled={isScanningReddit}
                  className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 rounded disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningReddit ? "animate-spin" : ""}`} />
                  <span>{isScanningReddit ? "SCANNING REDDIT..." : "SCAN r/QualityReps NOW"}</span>
                </button>
              </div>
            </div>

            {scanResult && (
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-neutral-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="overflow-x-auto whitespace-pre-wrap">{scanResult}</div>
              </div>
            )}
          </div>

          {/* Discovered Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                Discovered Grails Queue ({discoveredItems.length})
              </h3>
              <button
                onClick={fetchDiscovered}
                className="text-[11px] font-mono text-neutral-500 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {discoveredItems.length === 0 ? (
              <div className="p-12 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-xl space-y-2">
                <ShieldCheck className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-mono text-neutral-400">No pending pieces in the review queue.</p>
                <p className="text-[11px] font-mono text-neutral-600">Click &quot;SCAN r/QualityReps NOW&quot; above to search for fresh grails.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredItems.map((item) => (
                  <div
                    key={item.slug}
                    className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex gap-4 items-start relative group hover:border-neutral-700 transition-colors"
                  >
                    {/* Image Preview */}
                    <div className="w-24 h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-2 flex items-center justify-center shrink-0 relative overflow-hidden">
                      {item.rawImageSrc ? (
                        <img
                          src={item.rawImageSrc}
                          alt={item.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Scissors className="w-6 h-6 text-neutral-700" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-neutral-800 text-[10px] font-mono font-bold text-white rounded">
                          {item.brand}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">
                          {item.category}
                        </span>
                        <span className="ml-auto text-xs font-mono font-bold text-emerald-400">
                          ${item.sourcePrice}
                        </span>
                      </div>

                      <h4 className="text-xs font-mono text-white truncate font-medium">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-neutral-400">
                        {item.redditPostUrl && (
                          <a
                            href={item.redditPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white flex items-center gap-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Reddit Thread</span>
                          </a>
                        )}
                        {item.sugargooUrl && (
                          <a
                            href={item.sugargooUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-emerald-400 flex items-center gap-1 text-emerald-500/80"
                          >
                            <LinkIcon className="w-2.5 h-2.5" />
                            <span>Sugargoo Link</span>
                          </a>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleApprovePiece(item)}
                          disabled={approvingSlug === item.slug}
                          className="px-3 py-1.5 bg-white text-black font-mono text-[11px] font-bold uppercase rounded hover:bg-neutral-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          <span>{approvingSlug === item.slug ? "Importing & Generating..." : "Approve & Ingest"}</span>
                        </button>
                        <button
                          onClick={() =>
                            setDiscoveredItems((prev) => prev.filter((i) => i.slug !== item.slug))
                          }
                          className="px-2.5 py-1.5 bg-neutral-800 text-neutral-400 font-mono text-[11px] rounded hover:bg-neutral-700 hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 1-Click Rapid Ingestion */}
      {activeTab === "quick-ingest" && (
        <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>1-Click Grail Ingestion Studio</span>
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Paste any raw Taobao, Weidian, 1688, or Reddit URL. The pipeline will automatically create your Sugargoo affiliate link, generate a transparent AI cutout, add it to the vault, and render all 3 slide styles.
            </p>
          </div>

          {ingestMessage && (
            <div
              className={`p-3.5 border rounded text-xs font-mono flex items-center gap-2 ${
                ingestMessage.type === "success"
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                  : "bg-red-950/40 border-red-800 text-red-400"
              }`}
            >
              {ingestMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{ingestMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleQuickIngest} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                Market URL or Obfuscated Link (Taobao / Weidian / 1688) *
              </label>
              <input
                type="text"
                required
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
                placeholder="https://item.taobao.com/item.htm?id=... or https://weidian(dot)com/..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Designer Brand *
                </label>
                <input
                  type="text"
                  required
                  value={ingestBrand}
                  onChange={(e) => setIngestBrand(e.target.value)}
                  placeholder="e.g. Enfants Riches Déprimés"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Category *
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
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Piece Name / Title
                </label>
                <input
                  type="text"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. Teenage Nostalgia Hoodie"
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
                Source Image URL (Optional - will auto AI-cutout)
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

      {/* TAB 3: Google Sheets */}
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
