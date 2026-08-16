"use client";

import React, { useState } from "react";
import { MockProduct } from "@/lib/products/mockData";
import { AgentSelector } from "@/components/agents/AgentSelector";
import { AffiliateButton } from "@/components/products/AffiliateButton";
import { SavePieceButton } from "@/components/products/SavePieceButton";
import { ProductPrice } from "@/components/products/ProductPrice";
import { AGENTS_CONFIG, AgentId } from "@/lib/agents/agentConfig";
import { resolveAgentUrl } from "@/lib/agents/agentResolver";
import { ShieldCheck, Sparkles, Truck, Check } from "lucide-react";

interface ProductDetailActionsProps {
  product: MockProduct;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>("sugargoo");
  const [activeAffiliateUrl, setActiveAffiliateUrl] = useState<string>(
    resolveAgentUrl(product.affiliateUrl, "sugargoo")
  );

  const handleAgentChange = (agentId: AgentId, resolvedUrl: string) => {
    setSelectedAgentId(agentId);
    setActiveAffiliateUrl(resolvedUrl);
  };

  const currentAgent = AGENTS_CONFIG[selectedAgentId] || AGENTS_CONFIG.sugargoo;

  return (
    <div className="space-y-6">
      {/* Dynamic Price Display */}
      <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-200">
        <ProductPrice
          price={product.price}
          className="text-2xl sm:text-3xl font-mono font-black text-black"
        />
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
          ESTIMATED PROCURING PRICE
        </span>
      </div>

      {/* Agent Selector & Routing */}
      <div className="space-y-4 pt-1">
        <AgentSelector
          sourceUrl={product.affiliateUrl}
          onAgentChange={handleAgentChange}
        />

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
          <SavePieceButton product={product} />

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
          <span>Automated catalog link & stock integrity checks</span>
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
          <ProductPrice
            price={product.price}
            className="text-base font-black font-mono text-black"
          />
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
