"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterDrawer, FilterState } from "@/components/search/FilterDrawer";
import { MOCK_PRODUCTS } from "@/lib/products/mockData";
import { BRANDS, CATEGORIES } from "@/lib/constants";
import { ArrowUpDown } from "lucide-react";

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialBrand = searchParams.get("brand") || undefined;
  const initialCategory = searchParams.get("category") || undefined;

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    brand: initialBrand,
    category: initialCategory,
    era: undefined,
    style: undefined,
  });
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((prod) => {
      // Query search
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesQuery =
          prod.name.toLowerCase().includes(q) ||
          prod.brand.toLowerCase().includes(q) ||
          prod.tags.some((t) => t.toLowerCase().includes(q)) ||
          prod.style.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Brand filter
      if (filters.brand && prod.brandSlug !== filters.brand) {
        return false;
      }

      // Category filter
      if (filters.category && prod.categorySlug !== filters.category) {
        return false;
      }

      // Era filter
      if (filters.era && prod.era !== filters.era) {
        return false;
      }

      // Style filter
      if (filters.style && prod.style.toLowerCase() !== filters.style.toLowerCase()) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0; // featured / default
    });
  }, [query, filters, sortBy]);

  const handleReset = () => {
    setFilters({
      brand: undefined,
      category: undefined,
      era: undefined,
      style: undefined,
    });
    setQuery("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Info */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          ARCHIVE DATABASE ({filteredProducts.length} ITEMS)
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
          DISCOVER ALL FINDS
        </h1>
        <p className="text-neutral-500 text-sm max-w-xl font-light">
          Filter by designer house, fashion era, silhouettes, or specific grail tags.
        </p>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-grow max-w-xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Filter by designer, piece name, or style..."
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile/Desktop Filter Drawer */}
          <FilterDrawer
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleReset}
          />

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white border border-neutral-200 px-3 py-2 pr-8 text-xs font-mono uppercase tracking-wider text-neutral-800 hover:border-black focus:outline-none cursor-pointer rounded-none"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(filters.brand || filters.category || filters.era || filters.style || query) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-mono text-neutral-600 text-[10px] uppercase tracking-widest mr-1">
            Active:
          </span>
          {filters.brand && (
            <button
              onClick={() => setFilters({ ...filters, brand: undefined })}
              className="px-2.5 py-1 bg-black text-white text-[11px] font-mono flex items-center gap-1.5 hover:bg-neutral-800"
            >
              Brand: {BRANDS.find((b) => b.slug === filters.brand)?.name || filters.brand} ✕
            </button>
          )}
          {filters.category && (
            <button
              onClick={() => setFilters({ ...filters, category: undefined })}
              className="px-2.5 py-1 bg-black text-white text-[11px] font-mono flex items-center gap-1.5 hover:bg-neutral-800"
            >
              Category: {CATEGORIES.find((c) => c.slug === filters.category)?.name || filters.category} ✕
            </button>
          )}
          {filters.era && (
            <button
              onClick={() => setFilters({ ...filters, era: undefined })}
              className="px-2.5 py-1 bg-black text-white text-[11px] font-mono flex items-center gap-1.5 hover:bg-neutral-800"
            >
              Era: {filters.era} ✕
            </button>
          )}
          {filters.style && (
            <button
              onClick={() => setFilters({ ...filters, style: undefined })}
              className="px-2.5 py-1 bg-black text-white text-[11px] font-mono flex items-center gap-1.5 hover:bg-neutral-800"
            >
              Style: {filters.style} ✕
            </button>
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="px-2.5 py-1 bg-neutral-200 text-black text-[11px] font-mono flex items-center gap-1.5 hover:bg-neutral-300"
            >
              Query: &quot;{query}&quot; ✕
            </button>
          )}
          <button
            onClick={handleReset}
            className="text-[11px] font-mono text-neutral-600 underline hover:text-black ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Product Grid */}
      <ProductGrid
        products={filteredProducts}
        emptyMessage="No pieces matched your selected filter combinations."
      />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-xs uppercase tracking-widest text-neutral-400">
          Loading archive finds...
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}

