"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { GrailHunterModal } from "@/components/search/GrailHunterModal";
import { MOCK_PRODUCTS, Product } from "@/lib/products/mockData";
import { BRANDS } from "@/lib/constants";
import { trackClientEvent } from "@/lib/analytics/trackEvent";
import { Camera, Sparkles, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);
  const [isGrailHunterOpen, setIsGrailHunterOpen] = useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced search query tracker for Demand Gap analytics
  useEffect(() => {
    const qClean = query.trim();
    if (qClean.length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        trackClientEvent({
          type: "search",
          query: qClean,
        });
      }, 700);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return productsList.filter((prod) => {
      return (
        prod.name.toLowerCase().includes(q) ||
        prod.brand.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        prod.tags.some((t) => t.toLowerCase().includes(q)) ||
        prod.style.toLowerCase().includes(q) ||
        prod.era.toLowerCase().includes(q)
      );
    });
  }, [query, productsList]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Modal */}
      <GrailHunterModal
        isOpen={isGrailHunterOpen}
        onClose={() => setIsGrailHunterOpen(false)}
      />

      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          INSTANT LOOKUP &amp; AI VISION
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
          SEARCH ARCHIVE
        </h1>
      </div>

      {/* Main Search Input & Visual Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            onOpenGrailHunter={() => setIsGrailHunterOpen(true)}
            autoFocus={true}
            placeholder="Search by brand (e.g. Rick Owens), piece (e.g. Bomber), or tag..."
          />
        </div>

        <div className="lg:col-span-4">
          <button
            type="button"
            onClick={() => setIsGrailHunterOpen(true)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 hover:from-neutral-800 hover:to-neutral-800 text-white rounded-none border border-black flex items-center justify-between gap-3 text-xs font-mono font-bold uppercase transition-all shadow-md cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Grail Hunter (Photo Search)</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black rounded">
              AI VISION
            </span>
          </button>
        </div>
      </div>

      {/* Suggested Search Terms */}
      {!query && (
        <div className="space-y-4 pt-2">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
            Suggested Searches:
          </p>
          <div className="flex flex-wrap gap-2">
            {["Rick Owens Mountain", "Balenciaga Alaska", "ERD Punk Tee", "Vetements Skull", "Helmut Lang Painter", "85 Denim", "Riot Bomber"].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-mono text-neutral-800 transition-colors cursor-pointer"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Results Display */}
      {query ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono border-b border-neutral-200 pb-4">
            <span className="text-neutral-500">
              RESULTS FOR &ldquo;<span className="text-black font-bold">{query}</span>&rdquo;
            </span>
            <span className="text-neutral-500 font-bold">
              {searchResults.length} {searchResults.length === 1 ? "ITEM FOUND" : "ITEMS FOUND"}
            </span>
          </div>

          <ProductGrid products={searchResults} />
        </div>
      ) : null}
    </div>
  );
}
