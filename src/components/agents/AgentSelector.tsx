"use client";

import React, { useState, useEffect } from "react";
import { AGENTS_CONFIG, AgentId, AgentInfo } from "@/lib/agents/agentConfig";
import { resolveAgentUrl } from "@/lib/agents/agentResolver";
import { ChevronDown, Check, Sparkles, ExternalLink, ShieldCheck, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentSelectorProps {
  sourceUrl: string;
  onAgentChange?: (agentId: AgentId, resolvedUrl: string) => void;
  className?: string;
  variant?: "compact" | "full";
}

const STORAGE_KEY = "archive_finds_preferred_agent";

export function AgentSelector({
  sourceUrl,
  onAgentChange,
  className,
  variant = "full",
}: AgentSelectorProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>("sugargoo");
  const [isOpen, setIsOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Load preferred agent from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AgentId;
      if (saved && AGENTS_CONFIG[saved]) {
        setSelectedAgentId(saved);
        const resolved = resolveAgentUrl(sourceUrl, saved);
        onAgentChange?.(saved, resolved);
      }
    } catch (e) {
      // ignore
    }
  }, [sourceUrl, onAgentChange]);

  const handleSelect = (agentId: AgentId) => {
    setSelectedAgentId(agentId);
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, agentId);
    } catch (e) {
      // ignore
    }
    const resolved = resolveAgentUrl(sourceUrl, agentId);
    onAgentChange?.(agentId, resolved);
  };

  const currentAgent = AGENTS_CONFIG[selectedAgentId] || AGENTS_CONFIG.sugargoo;
  const agentsList = Object.values(AGENTS_CONFIG);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
          <span>Purchasing Agent</span>
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        </label>

        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 hover:text-black flex items-center gap-1 transition-colors"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Agent Guide</span>
        </button>
      </div>

      {/* Main Agent Dropdown Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all duration-150"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-bold text-xs font-mono tracking-wider uppercase text-black">
              {currentAgent.name}
            </span>
            {currentAgent.badge && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider bg-black text-white">
                {currentAgent.badge}
              </span>
            )}
            {currentAgent.coupons && (
              <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-600 font-semibold">
                {currentAgent.coupons}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-neutral-500">
            <span className="text-[10px] font-mono uppercase">Change</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-neutral-200 shadow-xl py-1 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 border-b border-neutral-100 bg-neutral-50">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-600">
                  Select your preferred proxy agent:
                </span>
              </div>

              {agentsList.map((agent) => {
                const isSelected = agent.id === selectedAgentId;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelect(agent.id)}
                    className={cn(
                      "w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors border-b border-neutral-50 last:border-0",
                      isSelected
                        ? "bg-neutral-100 font-semibold"
                        : "hover:bg-neutral-50"
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wide text-black">
                          {agent.name}
                        </span>
                        {agent.badge && (
                          <span className="px-1.5 py-0.2 bg-black text-white text-[8px] font-mono uppercase font-bold tracking-wider">
                            {agent.badge}
                          </span>
                        )}
                        {agent.coupons && (
                          <span className="text-[10px] font-mono text-emerald-600 font-medium">
                            {agent.coupons}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 font-light line-clamp-1">
                        {agent.description}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-black shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Agent Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full border border-neutral-200 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-black" />
                <h3 className="font-black text-base uppercase tracking-tight">
                  Shopping via Proxy Agents
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-black"
              >
                [Close]
              </button>
            </div>

            <div className="space-y-4 text-xs font-light text-neutral-700 leading-relaxed">
              <p>
                To purchase items from Chinese domestic markets (Weidian, Taobao, 1688), international customers use proxy forwarding agents.
              </p>
              <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-2">
                <div className="font-mono font-bold text-[11px] uppercase tracking-wider text-black">
                  How it works:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 font-mono text-[11px] text-neutral-600">
                  <li>Choose your agent (We recommend <strong>Sugargoo</strong>).</li>
                  <li>Click <strong>&quot;VIEW ITEM&quot;</strong> to open the product page on your agent.</li>
                  <li>The agent purchases the item and receives it in their warehouse.</li>
                  <li>Inspect high-res QC photos and ship directly to your door.</li>
                </ol>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-mono font-bold text-[11px] uppercase tracking-wide text-emerald-950">
                    New User Bonus:
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Registering with our partner links unlocks exclusive shipping discount vouchers and coupon bundles for your first haul!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2.5 bg-black text-white text-xs font-mono uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
