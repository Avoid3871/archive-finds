"use client";

import { useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Bookmark, Trash2, ArrowLeft, Copy, Check, ExternalLink, Sparkles } from "lucide-react";

export default function SavedGrailsPage() {
  const { savedProducts, savedCount, clearWishlist } = useWishlist();
  const [copiedLinks, setCopiedLinks] = useState(false);

  const handleCopyAllLinks = () => {
    if (savedProducts.length === 0) return;
    const text = savedProducts
      .map(
        (p, i) =>
          `${i + 1}. ${p.brand} - ${p.name} ($${p.price.toFixed(2)})\nLink: https://archive-finds.vercel.app/product/${p.slug}\nSugargoo: ${p.affiliateUrl}`
      )
      .join("\n\n");

    navigator.clipboard.writeText(text);
    setCopiedLinks(true);
    setTimeout(() => setCopiedLinks(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 hover:text-black uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO DISCOVER</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-black text-white text-[10px] font-mono tracking-widest uppercase mb-2">
            <Bookmark className="w-3 h-3 fill-white" />
            LOCAL GRAIL VAULT
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
            SAVED PIECES ({savedCount})
          </h1>
          <p className="text-neutral-500 text-sm max-w-xl font-light mt-1">
            Your personal archive curation, saved locally in your browser without requiring any login.
          </p>
        </div>

        {savedCount > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyAllLinks}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              {copiedLinks ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>COPIED ALL LINKS!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY LINKS LIST</span>
                </>
              )}
            </button>

            <button
              onClick={clearWishlist}
              className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR ALL</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {savedCount === 0 ? (
        <div className="py-20 text-center space-y-4 border border-dashed border-neutral-300 bg-neutral-50 rounded-lg p-8">
          <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto text-neutral-500">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-mono font-bold uppercase text-black">
              YOUR GRAIL VAULT IS CURRENTLY EMPTY
            </h2>
            <p className="text-xs font-mono text-neutral-500 max-w-md mx-auto">
              Tap the bookmark icon on any piece across the catalog to save your favorite archive garments for later procurement.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>EXPLORE 104+ ARCHIVE FINDS</span>
            </Link>
          </div>
        </div>
      ) : (
        <ProductGrid
          products={savedProducts}
          emptyMessage="No pieces saved."
        />
      )}
    </div>
  );
}
