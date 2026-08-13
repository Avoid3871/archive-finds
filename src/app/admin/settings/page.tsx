"use client";

import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [memberId, setMemberId] = useState("archivefinds");
  const [pythonPath, setPythonPath] = useState("python");
  const [autoScanInterval, setAutoScanInterval] = useState("60");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white">
          WORKER & AFFILIATE SETTINGS
        </h1>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Configure local worker engine parameters and Sugargoo affiliate partner tokens.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-neutral-900 border border-neutral-700 text-xs font-mono text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configuration saved successfully!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6 bg-neutral-900 p-6 border border-neutral-800 rounded">
        <div>
          <label className="text-xs font-mono uppercase text-neutral-300 block mb-1.5 font-bold">
            Sugargoo Partner Member ID
          </label>
          <input
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
          />
          <p className="text-[10px] font-mono text-neutral-500 mt-1">
            This token is injected as &quot;memberId&quot; into all generated Sugargoo affiliate links.
          </p>
        </div>

        <div>
          <label className="text-xs font-mono uppercase text-neutral-300 block mb-1.5 font-bold">
            Python Executable Path (Local rembg)
          </label>
          <input
            type="text"
            value={pythonPath}
            onChange={(e) => setPythonPath(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
          />
          <p className="text-[10px] font-mono text-neutral-500 mt-1">
            Path to the local Python binary with rembg and onnxruntime installed.
          </p>
        </div>

        <div>
          <label className="text-xs font-mono uppercase text-neutral-300 block mb-1.5 font-bold">
            Auto-Scan Interval (Minutes)
          </label>
          <input
            type="number"
            value={autoScanInterval}
            onChange={(e) => setAutoScanInterval(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
          />
          <p className="text-[10px] font-mono text-neutral-500 mt-1">
            Background frequency for polling registered Google Sheet sources.
          </p>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <button
            type="submit"
            className="px-6 py-3 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
