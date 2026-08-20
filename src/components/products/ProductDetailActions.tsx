"use client";

import React, { useState } from "react";
import { MockProduct } from "@/lib/products/mockData";
import { AgentSelector } from "@/components/agents/AgentSelector";
import { AffiliateButton } from "@/components/products/AffiliateButton";
import { SavePieceButton } from "@/components/products/SavePieceButton";
import { ProductPrice } from "@/components/products/ProductPrice";
import { AGENTS_CONFIG, AgentId } from "@/lib/agents/agentConfig";
import { resolveAgentUrl } from "@/lib/agents/agentResolver";
import { getResaleBenchmark } from "@/lib/products/pricingUtils";
import {
  ShieldCheck,
  Sparkles,
  Truck,
  Flame,
  Gift,
  Share2,
  Check,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface ProductDetailActionsProps {
  product: MockProduct;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>("sugargoo");
  const [activeAffiliateUrl, setActiveAffiliateUrl] = useState<string>(
    resolveAgentUrl(product.affiliateUrl, "sugargoo")
  );
  const [copied, setCopied] = useState<boolean>(false);

  const benchmark = getResaleBenchmark(product.price, product.brand, product.category);
  const currentAgent = AGENTS_CONFIG[selectedAgentId] || AGENTS_CONFIG.sugargoo;

  const handleAgentChange = (agentId: AgentId, resolvedUrl: string) => {
    setSelectedAgentId(agentId);
    setActiveAffiliateUrl(resolvedUrl);
  };

  const handleShareGrail = async () => {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/product/${product.slug}?ref=share`
      : `https://archive-finds.vercel.app/product/${product.slug}?ref=share`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.brand} - ${product.name}`,
          text: `Found this ${product.brand} grail on Archive Finds for $${product.price}:`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Social Proof Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-mono">
        <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
        <span>HIGH DEMAND</span>
        <span className="text-neutral-500">•</span>
        <span className="text-neutral-300">18 collectors viewed this piece today</span>
      </div>

      {/* Resale Price Comparison & Value Shock Display */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <ProductPrice
              price={product.price}
              className="text-2xl sm:text-3xl font-mono font-black text-black"
            />
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
              DIRECT PROCURING
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-neutral-500 line-through">
              Est. Resale: ${benchmark.estimatedResale} USD
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-neutral-200/60">
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Save ${benchmark.savingsDollars} ({benchmark.discountPercent}% below secondary market)
          </span>
          <span className="text-neutral-500 text-[10px] uppercase">
            Grailed / StockX Benchmark
          </span>
        </div>
      </div>

      {/* Agent Selector & Routing */}
      <div className="space-y-4 pt-1">
        <AgentSelector
          sourceUrl={product.affiliateUrl}
          onAgentChange={handleAgentChange}
        />

        {/* VIP Agent Shipping Coupon Incentive Banner */}
        <div className="p-3.5 bg-neutral-900 text-white rounded-lg flex items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-emerald-400 font-bold uppercase">
                {selectedAgentId === "sugargoo" ? "$140 Shipping Coupons" : `${currentAgent.name} VIP Discount`}
              </span>
              <p className="text-[11px] text-neutral-400 font-light">
                {selectedAgentId === "sugargoo"
                  ? "Register via our VIP partner link to claim $140 in worldwide shipping credits."
                  : `Partner perks & warehouse photo inspection enabled for ${currentAgent.name}.`}
              </p>
            </div>
          </div>
          {selectedAgentId === "sugargoo" && (
            <a
              href="https://www.sugargoo.com/register?memberId=1325437696506389977"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-2.5 py-1.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <span>Claim</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Primary Action Button (Desktop/Tablet) */}
        <div className="space-y-3 pt-2">
          <AffiliateButton
            affiliateUrl={activeAffiliateUrl}
            productId={product.id}
            productName={product.name}
            brand={product.brand}
            category={product.category}
            price={product.price}
            currency={product.currency}
            source="product_detail_main"
            agentName={currentAgent.name}
          />

          <div className="grid grid-cols-2 gap-3">
            <SavePieceButton product={product} />

            {/* Share Grail Button */}
            <button
              type="button"
              onClick={handleShareGrail}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black rounded font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Grail</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
            <span>Direct procurement via</span>
            <span className="text-black font-bold">{currentAgent.name}</span>
            {currentAgent.coupons && (
              <span className="text-emerald-600 font-semibold">({currentAgent.coupons})</span>
            )}
          </div>
        </div>
      </div>

      {/* Editorial Description */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          Piece Editorial
        </h3>
        <p className="text-sm text-neutral-700 font-light leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Value Assurance Badges */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2.5 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Verified proxy order routing via {currentAgent.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-black shrink-0" />
          <span>Automated catalog link &amp; stock integrity checks</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-neutral-600 shrink-0" />
          <span>Worldwide tracked shipping with warehouse photo inspection</span>
        </div>
      </div>

      {/* Sticky Mobile Conversion Bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 shadow-lg flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-neutral-500 uppercase truncate max-w-[130px]">
            {product.brand}
          </p>
          <div className="flex items-baseline gap-1.5">
            <ProductPrice
              price={product.price}
              className="text-base font-black font-mono text-black"
            />
            <span className="text-[10px] font-mono text-neutral-500 line-through">
              ${benchmark.estimatedResale}
            </span>
          </div>
        </div>
        <div className="flex-grow max-w-[210px]">
          <AffiliateButton
            affiliateUrl={activeAffiliateUrl}
            productId={product.id}
            productName={product.name}
            brand={product.brand}
            category={product.category}
            price={product.price}
            currency={product.currency}
            source="product_detail_mobile_bar"
            agentName={currentAgent.name}
            className="py-2.5 px-4 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
