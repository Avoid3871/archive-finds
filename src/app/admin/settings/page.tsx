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
  Info,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck
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
    fieldName: "Affiliate Member ID",
    fieldKey: "sugargoo_id",
    placeholder: "1325437696506389977",
    description: "Your primary Sugargoo affiliate identifier for VIP conversion tracking.",
    urlFormat: "sugargoo.com/products?productLink={url}&memberId={id}",
    portalUrl: "https://www.sugargoo.com",
  },
  {
    id: "superbuy",
    name: "Superbuy",
    badge: "POPULAR",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: "🟡",
    fieldName: "Partner Code",
    fieldKey: "superbuy_id",
    placeholder: "wVam6e",
    description: "Superbuy affiliate referral partner code.",
    urlFormat: "superbuy.com/en/page/buy/?partnercode={id}&url={url}",
    portalUrl: "https://www.superbuy.com",
  },
  {
    id: "mulebuy",
    name: "Mulebuy",
    badge: "ACTIVE",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: "🔵",
    fieldName: "Referral Code (ref)",
    fieldKey: "mulebuy_id",
    placeholder: "201493429",
    description: "Mulebuy affiliate account reference code.",
    urlFormat: "mulebuy.com/product/?shop_type=weidian&id={id}&ref={ref}",
    portalUrl: "https://mulebuy.com",
  },
  {
    id: "cnfans",
    name: "CNfans",
    badge: "ACTIVE",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    icon: "🟣",
    fieldName: "Referral Code (ref)",
    fieldKey: "cnfans_id",
    placeholder: "16313214",
    description: "CNfans shopping agent affiliate referral ID.",
    urlFormat: "cnfans.com/product/?shop_type=weidian&id={id}&ref={ref}",
    portalUrl: "https://cnfans.com",
  },
  {
    id: "cssbuy",
    name: "CSSbuy",
    badge: "ACTIVE",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    icon: "🔴",
    fieldName: "Promo Code",
    fieldKey: "cssbuy_id",
    placeholder: "8e51fa03f5b9b13a",
    description: "CSSbuy promotion link code & inviter name.",
    urlFormat: "cssbuy.com/item.html?itemcode={id}&promotionCode={promo}",
    portalUrl: "https://cssbuy.com",
    secondaryFieldKey: "cssbuy_inviter",
    secondaryFieldName: "Inviter Username",
    secondaryPlaceholder: "z3r0x",
  },
  {
    id: "kakobuy",
    name: "Kakobuy",
    badge: "ACTIVE",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    icon: "🟠",
    fieldName: "Affiliate Code (affcode)",
    fieldKey: "kakobuy_id",
    placeholder: "ut9mq",
    description: "Kakobuy affiliate identification token.",
    urlFormat: "kakobuy.com/item/details?url={url}&affcode={id}",
    portalUrl: "https://kakobuy.com",
  },
  {
    id: "hoobuy",
    name: "Hoobuy",
    badge: "ACTIVE",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    icon: "🌐",
    fieldName: "Invite Code (inviteCode)",
    fieldKey: "hoobuy_id",
    placeholder: "PR3YGPpE",
    description: "Hoobuy agent registration & product routing invite code.",
    urlFormat: "hoobuy.cc/product/{type}/{id}?inviteCode={code}",
    portalUrl: "https://hoobuy.cc",
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
    adminPassword: "archivefinds2026",
  });

  const [showPassword, setShowPassword] = useState(false);
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
            adminPassword: s.security?.adminPassword || prev.adminPassword,
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
        security: {
          adminPassword: formData.adminPassword,
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
            Configure multi-agent affiliate routing tokens, referral parameters, security passphrase, and crawler automation.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs font-mono text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>ALL SETTINGS SAVED & PERSISTED</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        {/* SECTION 1: AFFILIATE NETWORK AGENTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-neutral-300" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                1. Multi-Agent Affiliate Network (7 Supported Agents)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              Auto-attached to all outbound links
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENTS_META.map((agent) => {
              const mainValue = (formData as any)[agent.fieldKey] || "";
              const secValue = agent.secondaryFieldKey ? (formData as any)[agent.secondaryFieldKey] || "" : "";

              return (
                <div
                  key={agent.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{agent.icon}</span>
                        <h3 className="font-mono font-bold text-sm text-white">
                          {agent.name}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${agent.badgeColor}`}
                      >
                        {agent.badge}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-neutral-400">
                      {agent.description}
                    </p>

                    {/* Primary Field */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase text-neutral-300 block font-semibold">
                        {agent.fieldName}
                      </label>
                      <input
                        type="text"
                        value={mainValue}
                        onChange={(e) => handleChange(agent.fieldKey, e.target.value)}
                        placeholder={agent.placeholder}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    {/* Optional Secondary Field (e.g. CSSbuy inviter) */}
                    {agent.secondaryFieldKey && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono uppercase text-neutral-300 block font-semibold">
                          {agent.secondaryFieldName}
                        </label>
                        <input
                          type="text"
                          value={secValue}
                          onChange={(e) => handleChange(agent.secondaryFieldKey!, e.target.value)}
                          placeholder={agent.secondaryPlaceholder}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Routing Scheme & External Portal */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span className="truncate max-w-[200px]" title={agent.urlFormat}>
                      {agent.urlFormat}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={agent.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
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

        {/* SECTION 3: HUD SECURITY & MASTER PASSPHRASE */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              3. HUD Security & Operator Passphrase
            </h2>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <p className="text-xs font-mono text-neutral-400">
              The HUD and all administrative actions are protected by this master passphrase. Visitors cannot access the HUD without entering it.
            </p>

            <div className="max-w-md space-y-1.5">
              <label className="text-xs font-mono uppercase text-neutral-300 block font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                Master Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.adminPassword}
                  onChange={(e) => handleChange("adminPassword", e.target.value)}
                  placeholder="archivefinds2026"
                  className="w-full px-3.5 py-2.5 pr-10 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] font-mono text-neutral-500">
                Default: <code className="text-neutral-400">archivefinds2026</code>. You can change it anytime here.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-between">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all flex items-center gap-2.5 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
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
            Changes apply instantly to live product pages, affiliate links, and security gates.
          </p>
        </div>
      </form>
    </div>
  );
}
