"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackAffiliateClick } from "@/lib/analytics";

interface AffiliateButtonProps {
  affiliateUrl: string;
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  price?: number;
  currency?: string;
  source?: string;
  className?: string;
}

export function AffiliateButton({
  affiliateUrl,
  productId,
  productName,
  brand,
  category,
  price,
  currency = "EUR",
  source = "product_detail",
  className,
}: AffiliateButtonProps) {
  const handleClick = () => {
    trackAffiliateClick({
      affiliateUrl,
      productId,
      productName,
      brand,
      category,
      price,
      currency,
      source,
    });
  };

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "group relative w-full flex items-center justify-between px-6 py-4 bg-black text-white font-mono text-sm uppercase tracking-widest transition-all duration-300 hover:bg-neutral-800 active:scale-[0.99] border border-black shadow-sm",
        className
      )}
    >
      <span className="font-bold flex items-center gap-2">
        VIEW ITEM
        <span className="text-[10px] text-neutral-400 font-normal">
          (via Sugargoo)
        </span>
      </span>

      <div className="flex items-center gap-2">
        <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  );
}

