"use client";

import { useState, useEffect } from "react";
import { CloudUpload, CheckCircle2, AlertCircle, RefreshCw, GitBranch, ArrowUpRight } from "lucide-react";

export function LiveSyncControl({ onSyncSuccess }: { onSyncSuccess?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedCount, setChangedCount] = useState(0);
  const [lastCommit, setLastCommit] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

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
      setFeedback({ type: "info", text: "Deploying catalog to GitHub & triggering Live Website build..." });
      
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
      setTimeout(() => setFeedback(null), 8000);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${hasChanges ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
          <span className="font-mono text-xs uppercase font-bold text-neutral-200">
            {hasChanges ? `${changedCount} Unsynced Local Updates` : "Live Store In Sync"}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 border-l border-neutral-800 pl-3">
          <GitBranch className="w-3.5 h-3.5 text-neutral-500" />
          <span>{branch}</span>
          {lastCommit && (
            <span className="text-neutral-500 truncate max-w-[200px]" title={lastCommit}>
              • {lastCommit}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {feedback && (
          <div
            className={`text-[11px] font-mono px-2.5 py-1 rounded flex items-center gap-1.5 ${
              feedback.type === "success"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                : feedback.type === "error"
                ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                : "bg-blue-950/80 text-blue-300 border border-blue-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : feedback.type === "error" ? (
              <AlertCircle className="w-3 h-3 text-rose-400" />
            ) : (
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
            )}
            <span className="truncate max-w-[300px]">{feedback.text}</span>
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 text-xs font-mono font-bold uppercase rounded shadow transition-all tracking-wider shrink-0"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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
  );
}
