"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { MOCK_PRODUCTS } from "@/lib/products/mockData";
import { BRANDS } from "@/lib/constants";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return MOCK_PRODUCTS.filter((prod) => {
      return (
        prod.name.toLowerCase().includes(q) ||
        prod.brand.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        prod.tags.some((t) => t.toLowerCase().includes(q)) ||
        prod.style.toLowerCase().includes(q) ||
        prod.era.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          INSTANT LOOKUP
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
          SEARCH ARCHIVE
        </h1>
      </div>

      {/* Main Search Input */}
      <div className="max-w-2xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          autoFocus={true}
          placeholder="Search by brand (e.g. Raf Simons), piece (e.g. Bomber), or tag..."
        />
      </div>

      {/* Suggested Search Terms */}
      {!query && (
        <div className="space-y-4 pt-4">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
            Suggested Searches:
          </p>
          <div className="flex flex-wrap gap-2">
            {["Helmut Lang Painter", "Rick Owens Cargo", "85 Denim", "Riot Bomber", "Hakama", "Techwear", "AW05"].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-black hover:text-white border border-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Results Display */}
      {query && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
              Found {searchResults.length} {searchResults.length === 1 ? "piece" : "pieces"} for &quot;{query}&quot;
            </p>
          </div>

          <ProductGrid
            products={searchResults}
            emptyMessage={`No archive pieces found matching "${query}". Try searching for another designer or style.`}
          />
        </div>
      )}
    </div>
  );
}
