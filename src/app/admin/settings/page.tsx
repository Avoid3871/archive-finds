"use client";

import { useState, useEffect } from "react";
import { 
  Save, 
  CheckCircle2, 
  ExternalLink, 
  Terminal, 
  Sliders, 
  Globe2, 
  Sparkles,
  Link2,
  RefreshCw,
  Info
} from "lucide-react";

interface AgentSettingItem {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: string;
  fieldName: string;
  fieldKey: string;
  placeholder: string;
  description: string;
  urlFormat: string;
  portalUrl: string;
  secondaryFieldKey?: string;
  secondaryFieldName?: string;
  secondaryPlaceholder?: string;
}

const AGENTS_META: AgentSettingItem[] = [
  {
    id: "sugargoo",
    name: "Sugargoo",
    badge: "RECOMMENDED",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: "🟢",
    fieldName: "Partner Member ID",
    fieldKey: "sugargoo_id",
    placeholder: "1325437696506389977",
    description: "Default platform. Injected as memberId into all Sugargoo buy links.",
    urlFormat: "sugargoo.com/products?productLink={url}&memberId={id}",
    portalUrl: "https://www.sugargoo.com",
  },
  {
    id: "superbuy",
    name: "Superbuy",
    badge: "POPULAR",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: "📦",
    fieldName: "Partner / Invitation Code",
    fieldKey: "superbuy_id",
    placeholder: "wVam6e",
    description: "Veteran agent. Injected as partnercode parameter.",
    urlFormat: "superbuy.com/en/page/buy/?url={url}&partnercode={code}",
    portalUrl: "https://www.superbuy.com/en/page/partner/",
  },
  {
    id: "mulebuy",
    name: "Mulebuy",
    badge: "FAST QC",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: "⚡",
    fieldName: "Referral Ref Code",
    fieldKey: "mulebuy_id",
    placeholder: "201493429",
    description: "Modern shopping platform. Injected as ref parameter.",
    urlFormat: "mulebuy.com/product/?url={url}&ref={code}",
    portalUrl: "https://mulebuy.com",
  },
  {
    id: "cnfans",
    name: "CNfans",
    badge: "TRENDING",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    icon: "🔥",
    fieldName: "Referral Ref Code",
    fieldKey: "cnfans_id",
    placeholder: "16313214",
    description: "Community-favorite agent with automated order routing.",
    urlFormat: "cnfans.com/product/?url={url}&ref={code}",
    portalUrl: "https://cnfans.com",
  },
  {
    id: "cssbuy",
    name: "CSSbuy",
    badge: "ESTABLISHED",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    icon: "🌐",
    fieldName: "Promotion Code",
    fieldKey: "cssbuy_id",
    placeholder: "8e51fa03f5b9b13a",
    description: "Established agent. Injected as promotionCode and inviter query params.",
    urlFormat: "cssbuy.com/item.html?url={url}&promotionCode={promo}&inviter={user}",
    portalUrl: "https://www.cssbuy.com",
    secondaryFieldKey: "cssbuy_inviter",
    secondaryFieldName: "Inviter Username",
    secondaryPlaceholder: "z3r0x",
  },
  {
    id: "kakobuy",
    name: "Kakobuy",
    badge: "FAST SHIPPING",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    icon: "🚀",
    fieldName: "Affiliate Affcode",
    fieldKey: "kakobuy_id",
    placeholder: "ut9mq",
    description: "Dedicated warehouse inspection agent. Injected as affcode.",
    urlFormat: "kakobuy.com/item/details?url={url}&affcode={code}",
    portalUrl: "https://item.kakobuy.com/center/affiliates",
  },
  {
    id: "hoobuy",
    name: "Hoobuy",
    badge: "PROMO",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    icon: "🎟️",
    fieldName: "Invite / Ambassador Code",
    fieldKey: "hoobuy_id",
    placeholder: "PR3YGPpE",
    description: "Multi-currency platform with $135 freight voucher campaigns.",
    urlFormat: "hoobuy.com/product?url={url}&inviteCode={code}",
    portalUrl: "https://hoobuy.com",
  },
];

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState({
    sugargoo_id: "1325437696506389977",
    superbuy_id: "wVam6e",
    mulebuy_id: "201493429",
    cnfans_id: "16313214",
    cssbuy_id: "8e51fa03f5b9b13a",
    cssbuy_inviter: "z3r0x",
    kakobuy_id: "ut9mq",
    hoobuy_id: "PR3YGPpE",
    pythonPath: "python",
    autoScanInterval: "60",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (json.success && json.settings) {
          const s = json.settings;
          setFormData((prev) => ({
            ...prev,
            sugargoo_id: s.agents?.sugargoo?.affiliateId || prev.sugargoo_id,
            superbuy_id: s.agents?.superbuy?.affiliateId || prev.superbuy_id,
            mulebuy_id: s.agents?.mulebuy?.affiliateId || prev.mulebuy_id,
            cnfans_id: s.agents?.cnfans?.affiliateId || prev.cnfans_id,
            cssbuy_id: s.agents?.cssbuy?.affiliateId || prev.cssbuy_id,
            cssbuy_inviter: s.agents?.cssbuy?.inviter || prev.cssbuy_inviter,
            kakobuy_id: s.agents?.kakobuy?.affiliateId || prev.kakobuy_id,
            hoobuy_id: s.agents?.hoobuy?.affiliateId || prev.hoobuy_id,
            pythonPath: s.worker?.pythonPath || prev.pythonPath,
            autoScanInterval: s.worker?.autoScanInterval || prev.autoScanInterval,
          }));
        }
      } catch (e) {
        console.error("Failed to load settings from API", e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        agents: {
          sugargoo: { affiliateId: formData.sugargoo_id },
          superbuy: { affiliateId: formData.superbuy_id },
          mulebuy: { affiliateId: formData.mulebuy_id },
          cnfans: { affiliateId: formData.cnfans_id },
          cssbuy: { affiliateId: formData.cssbuy_id, inviter: formData.cssbuy_inviter },
          kakobuy: { affiliateId: formData.kakobuy_id },
          hoobuy: { affiliateId: formData.hoobuy_id },
        },
        worker: {
          pythonPath: formData.pythonPath,
          autoScanInterval: formData.autoScanInterval,
        },
      };

      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Error saving settings", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe2 className="w-5 h-5 text-neutral-400" />
            <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white">
              AFFILIATE NETWORK & WORKER SETTINGS
            </h1>
          </div>
          <p className="text-xs font-mono text-neutral-400">
            Configure multi-agent affiliate routing tokens, referral parameters, and local crawler automation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            7 AGENTS INTEGRATED
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in rounded">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully! All storefront buy buttons now route through your updated codes.</span>
          </div>
          <span className="text-[10px] text-neutral-400 uppercase">Live Synced</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: MULTI-AGENT AFFILIATE CODES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-neutral-300" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                1. Multi-Agent Affiliate Network (7 Agents)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              Auto-resolved via <code className="text-neutral-400">resolveAgentUrl()</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENTS_META.map((agent) => {
              const currentVal = (formData as any)[agent.fieldKey] || "";
              const isConfigured = Boolean(currentVal && currentVal.trim().length > 0);

              return (
                <div
                  key={agent.id}
                  className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-5 flex flex-col justify-between hover:border-neutral-700 transition-all space-y-4 shadow-sm"
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{agent.icon}</span>
                        <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                          {agent.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border rounded ${agent.badgeColor}`}>
                          {agent.badge}
                        </span>
                        {isConfigured ? (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-neutral-300 block mb-1 font-bold">
                        {agent.fieldName}
                      </label>
                      <input
                        type="text"
                        value={currentVal}
                        placeholder={agent.placeholder}
                        onChange={(e) => handleChange(agent.fieldKey, e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    {/* Secondary field if applicable (e.g. CSSbuy inviter) */}
                    {agent.secondaryFieldKey && (
                      <div>
                        <label className="text-[10px] font-mono uppercase text-neutral-300 block mb-1 font-bold">
                          {agent.secondaryFieldName}
                        </label>
                        <input
                          type="text"
                          value={(formData as any)[agent.secondaryFieldKey] || ""}
                          placeholder={agent.secondaryPlaceholder}
                          onChange={(e) => handleChange(agent.secondaryFieldKey!, e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    )}

                    {/* Live Query Pattern Preview */}
                    <div className="bg-black/50 border border-neutral-800/80 rounded p-2.5 flex items-center justify-between gap-2">
                      <div className="truncate text-[10px] font-mono text-neutral-400">
                        <span className="text-neutral-600 font-bold">URL: </span>
                        {agent.urlFormat.replace("{id}", currentVal || agent.placeholder).replace("{code}", currentVal || agent.placeholder).replace("{promo}", currentVal || agent.placeholder).replace("{user}", (formData as any).cssbuy_inviter || "z3r0x")}
                      </div>
                      <a
                        href={agent.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 shrink-0 transition-colors"
                        title="Open Affiliate Portal"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: WORKER & CRAWLER PIPELINE */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-300" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              2. Worker & AI Pipeline Automation
            </h2>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-mono uppercase text-neutral-300 block mb-1.5 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  Python Executable Path (Local rembg)
                </label>
                <input
                  type="text"
                  value={formData.pythonPath}
                  onChange={(e) => handleChange("pythonPath", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                />
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  Path to local Python binary with rembg, onnxruntime, and pillow installed.
                </p>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-neutral-300 block mb-1.5 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                  Auto-Scan Interval (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.autoScanInterval}
                  onChange={(e) => handleChange("autoScanInterval", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                />
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  Polling frequency for scheduled background scanner jobs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-between">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all flex items-center gap-2.5 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>SAVING CONFIGURATION...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE ALL SETTINGS</span>
              </>
            )}
          </button>

          <p className="text-[11px] font-mono text-neutral-500">
            Changes apply instantly to live product pages and links.
          </p>
        </div>
      </form>
    </div>
  );
}
