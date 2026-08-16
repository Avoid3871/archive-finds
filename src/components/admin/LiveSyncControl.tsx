"use client";

import { useState, useEffect } from "react";
import { CloudUpload, CheckCircle2, AlertCircle, RefreshCw, GitBranch, ExternalLink, Globe, ArrowUpRight } from "lucide-react";

export function LiveSyncControl({ onSyncSuccess }: { onSyncSuccess?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedCount, setChangedCount] = useState(0);
  const [lastCommit, setLastCommit] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string; commit?: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await fetch("/api/admin/sync-live");
      const data = await res.json();
      if (data.success) {
        setHasChanges(data.hasUnsyncedChanges);
        setChangedCount(data.changedFilesCount || 0);
        setLastCommit(data.lastCommit || "");
        setBranch(data.branch || "main");
      }
    } catch (e) {
      // Ignore network errors
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setFeedback({ type: "info", text: "Staging catalog changes & pushing to GitHub / Vercel..." });
      
      const res = await fetch("/api/admin/sync-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Live Deploy: Catalog update [${new Date().toLocaleTimeString()}]` }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          text: data.message || "✓ Live website updated & build triggered on GitHub/Vercel!",
          commit: data.commitMsg,
        });
        await fetchStatus();
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Sync failed. Check terminal or git credentials.",
        });
      }
    } catch (e: any) {
      setFeedback({
        type: "error",
        text: `Sync error: ${e.message}`,
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setFeedback(null), 12000);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${hasChanges ? "bg-amber-400 animate-pulse" : "bg-emerald-500 shadow-sm shadow-emerald-500/50"}`} />
            <span className="font-mono text-xs uppercase font-bold text-neutral-200">
              {hasChanges ? `${changedCount} Unsynced Local Updates` : "🟢 Live Store In Sync (0 Pending)"}
            </span>
          </div>

          <button
            onClick={fetchStatus}
            title="Refresh Git Status"
            className="p-1 text-neutral-500 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${statusLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 border-l border-neutral-800 pl-3">
            <GitBranch className="w-3.5 h-3.5 text-neutral-500" />
            <span>{branch}</span>
            {lastCommit && (
              <span className="text-neutral-500 truncate max-w-[240px]" title={lastCommit}>
                • {lastCommit}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://archive-finds.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-mono rounded transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Website</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-500" />
          </a>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 text-xs font-mono font-bold uppercase rounded shadow transition-all tracking-wider shrink-0"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Deploying Live...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-3.5 h-3.5" />
                <span>🚀 Sync to Live Website</span>
              </>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`text-xs font-mono px-3 py-2 rounded-md flex items-center justify-between gap-2 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border border-emerald-700/60 shadow-lg shadow-emerald-950/50"
              : feedback.type === "error"
              ? "bg-rose-950/90 text-rose-200 border border-rose-700/60 shadow-lg shadow-rose-950/50"
              : "bg-blue-950/90 text-blue-200 border border-blue-700/60 shadow-lg shadow-blue-950/50"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : feedback.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>

          {feedback.type === "success" && (
            <a
              href="https://archive-finds.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-black font-bold text-[11px] uppercase tracking-wider rounded hover:bg-emerald-400 transition-colors shrink-0"
            >
              <span>Open Live</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
