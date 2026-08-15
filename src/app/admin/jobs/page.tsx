"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Filter,
  Layers,
  Cpu,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface JobRecord {
  id: string;
  type: string;
  pieceName: string;
  status: "SUCCESS" | "RUNNING" | "PENDING" | "FAILED";
  duration: string;
  durationMs: number;
  timestamp: string;
  details?: string;
}

function timeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 10) return "just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } catch (e) {
    return isoString;
  }
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/jobs", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch (e) {
      console.error("Failed to load jobs history", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear the background jobs history?")) return;
    try {
      await fetch("/api/admin/jobs", { method: "DELETE" });
      setJobs([]);
    } catch (e) {
      console.error("Failed to clear jobs", e);
    }
  };

  const totalJobs = jobs.length;
  const successJobs = jobs.filter((j) => j.status === "SUCCESS").length;
  const successRate = totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 100;
  const avgDurationMs =
    totalJobs > 0
      ? Math.round(jobs.reduce((acc, j) => acc + (j.durationMs || 1000), 0) / totalJobs)
      : 0;
  const avgDurationStr = avgDurationMs >= 1000 ? `${(avgDurationMs / 1000).toFixed(1)}s` : `${avgDurationMs}ms`;

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter = filterType === "ALL" || job.type === filterType;
    const matchesSearch =
      !searchQuery ||
      job.pieceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.details && job.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "INGEST_GRAIL":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
      case "AI_BACKGROUND_REMOVAL":
        return "bg-purple-950/80 text-purple-300 border-purple-800/80";
      case "STUDIO_IMAGE_SEARCH":
        return "bg-blue-950/80 text-blue-300 border-blue-800/80";
      case "SCAN_REDDIT_FEED":
        return "bg-amber-950/80 text-amber-300 border-amber-800/80";
      case "ROTATE_IMAGE":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800/80";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-mono font-black uppercase tracking-wider text-white">
              JOB QUEUE & WORKER LOGS
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Pipeline Active
            </span>
          </div>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Real-time execution logs for AI cutouts, Reddit scanners, image search engines, and catalog ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="px-3 py-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : "text-neutral-400"}`} />
            <span>Refresh</span>
          </button>

          {totalJobs > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-neutral-900 border border-red-900/50 hover:border-red-600 text-red-400 font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono uppercase tracking-widest">Total Jobs</span>
            <Activity className="w-4 h-4 text-neutral-600" />
          </div>
          <p className="text-3xl font-mono font-black text-white mt-2">{totalJobs}</p>
          <p className="text-[10px] font-mono text-neutral-500 mt-1">Logged pipeline tasks</p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono uppercase tracking-widest">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-mono font-black text-emerald-400 mt-2">{successRate}%</p>
          <p className="text-[10px] font-mono text-emerald-500/70 mt-1">{successJobs} of {totalJobs} succeeded</p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono uppercase tracking-widest">Avg Runtime</span>
            <Clock className="w-4 h-4 text-neutral-600" />
          </div>
          <p className="text-3xl font-mono font-black text-white mt-2">{avgDurationStr}</p>
          <p className="text-[10px] font-mono text-neutral-500 mt-1">Per worker execution</p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-mono uppercase tracking-widest">Active Engines</span>
            <Cpu className="w-4 h-4 text-neutral-600" />
          </div>
          <p className="text-3xl font-mono font-black text-white mt-2">5</p>
          <p className="text-[10px] font-mono text-neutral-500 mt-1">rembg • Reddit • Sugargoo</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-3 border border-neutral-800 rounded">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "ALL", value: "ALL" },
            { label: "INGEST", value: "INGEST_GRAIL" },
            { label: "AI CUTOUT", value: "AI_BACKGROUND_REMOVAL" },
            { label: "STUDIO SEARCH", value: "STUDIO_IMAGE_SEARCH" },
            { label: "SCANNER", value: "SCAN_REDDIT_FEED" },
            { label: "ROTATE", value: "ROTATE_IMAGE" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                filterType === tab.value
                  ? "bg-white text-black shadow-sm"
                  : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search piece, ID, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Job ID</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Subject Piece</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <Activity className="w-6 h-6 mx-auto mb-2 text-neutral-700" />
                    <p className="font-mono text-xs uppercase tracking-wider">No background jobs found</p>
                    <p className="font-mono text-[10px] text-neutral-600 mt-1">
                      Execute a scan, ingest a piece, or trigger an AI cutout to see live entries.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className={`hover:bg-neutral-800/50 cursor-pointer transition-colors ${
                        isExpanded ? "bg-neutral-800/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-neutral-400">
                        {job.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 border text-[10px] font-bold uppercase rounded tracking-wider ${getTypeBadgeClass(
                            job.type
                          )}`}
                        >
                          {job.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white max-w-[280px] truncate">
                        {job.pieceName}
                      </td>
                      <td className="py-3.5 px-4">
                        {job.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] rounded font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            SUCCESS
                          </span>
                        ) : job.status === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 text-[10px] rounded font-bold">
                            <XCircle className="w-2.5 h-2.5" />
                            FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-[10px] rounded font-bold">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            RUNNING
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 font-mono">
                        {job.duration}
                      </td>
                      <td
                        className="py-3.5 px-4 text-neutral-500 font-mono whitespace-nowrap"
                        title={new Date(job.timestamp).toLocaleString()}
                      >
                        {timeAgo(job.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-500">
                        <button
                          type="button"
                          className="p-1 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedJobId(isExpanded ? null : job.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded Details Pane */}
        {expandedJobId && (
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 font-mono text-xs">
            {(() => {
              const selectedJob = jobs.find((j) => j.id === expandedJobId);
              if (!selectedJob) return null;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="font-bold text-white uppercase">
                      Job Details: {selectedJob.id}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Executed at {new Date(selectedJob.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-900 rounded border border-neutral-800 text-neutral-300">
                    <p className="text-neutral-400 text-[11px]">
                      <strong className="text-neutral-200">Subject:</strong> {selectedJob.pieceName}
                    </p>
                    <p className="text-neutral-400 text-[11px] mt-1">
                      <strong className="text-neutral-200">Execution Time:</strong> {selectedJob.duration} ({selectedJob.durationMs} ms)
                    </p>
                    {selectedJob.details && (
                      <div className="mt-2 pt-2 border-t border-neutral-800">
                        <p className="text-[11px] text-neutral-300">
                          <strong className="text-neutral-400">Log Output:</strong> {selectedJob.details}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
