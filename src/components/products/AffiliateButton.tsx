"use client";

import { ArrowUpRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AffiliateButtonProps {
  affiliateUrl: string;
  price?: number;
  currency?: string;
  className?: string;
}

export function AffiliateButton({
  affiliateUrl,
  price,
  currency = "EUR",
  className,
}: AffiliateButtonProps) {
  const handleClick = () => {
    // Analytics tracking hook (e.g. TikTok pixel / event tracking)
    try {
      if (typeof window !== "undefined") {
        console.log(`[Affiliate Click] Redirecting to: ${affiliateUrl}`);
      }
    } catch {
      // ignore
    }
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
