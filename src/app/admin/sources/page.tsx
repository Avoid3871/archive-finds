"use client";

import { useState } from "react";
import { Plus, RefreshCw, FileSpreadsheet, CheckCircle2, Play } from "lucide-react";

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
    itemsCount: 142,
    lastScanned: "Today, 18:30",
    status: "ACTIVE",
  },
  {
    id: "src-2",
    name: "Japanese Designer Archive Sheet 02",
    spreadsheetId: "1c2Z...98Fq",
    sheetName: "Grails",
    itemsCount: 88,
    lastScanned: "Yesterday, 22:15",
    status: "ACTIVE",
  },
];

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<SheetSource[]>(INITIAL_SOURCES);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newSheetId, setNewSheetId] = useState("");
  const [newTab, setNewTab] = useState("Sheet1");

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSheetId.trim()) return;

    const newSource: SheetSource = {
      id: `src-${Date.now()}`,
      name: newName,
      spreadsheetId: newSheetId,
      sheetName: newTab || "Sheet1",
      itemsCount: 0,
      lastScanned: "Never",
      status: "ACTIVE",
    };

    setSources([...sources, newSource]);
    setNewName("");
    setNewSheetId("");
    setNewTab("Sheet1");
  };

  const handleTriggerScan = () => {
    setIsScanning(true);
    setScanMessage("Worker triggered: Scanning spreadsheet rows and performing 4-tier deduplication...");

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage("Scan completed successfully! 8 new products imported, 0 duplicates registered.");
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white">
            SPREADSHEET SOURCES
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Google Sheets are external input sources only. The database remains the Single Source of Truth.
          </p>
        </div>

        <button
          onClick={handleTriggerScan}
          disabled={isScanning}
          className="px-4 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span>{isScanning ? "SCANNING SHEETS..." : "SCAN ALL SOURCES"}</span>
        </button>
      </div>

      {scanMessage && (
        <div className="p-4 bg-neutral-900 border border-neutral-700 text-xs font-mono text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Sources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div
            key={src.id}
            className="p-5 bg-neutral-900 border border-neutral-800 rounded space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-neutral-400" />
                <div>
                  <h2 className="font-mono font-bold text-sm text-white">
                    {src.name}
                  </h2>
                  <p className="text-[10px] font-mono text-neutral-500">
                    Tab: {src.sheetName}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
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

      {/* Add New Source Form */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Connect New Google Sheet Source</span>
        </h2>

        <form onSubmit={handleAddSource} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Source Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Vintage Finds Sheet 03"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Google Spreadsheet ID
            </label>
            <input
              type="text"
              required
              value={newSheetId}
              onChange={(e) => setNewSheetId(e.target.value)}
              placeholder="e.g. 1BxiMVs0XRA5..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
              Tab / Sheet Name
            </label>
            <input
              type="text"
              value={newTab}
              onChange={(e) => setNewTab(e.target.value)}
              placeholder="Sheet1"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              ADD SPREADSHEET SOURCE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
