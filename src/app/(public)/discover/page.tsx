"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterDrawer, FilterState } from "@/components/search/FilterDrawer";
import { MOCK_PRODUCTS, Product } from "@/lib/products/mockData";
import { BRANDS, CATEGORIES } from "@/lib/constants";
import { ArrowUpDown, Sparkles, Flame, Tag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const QUICK_FILTERS = [
  { id: "all", label: "⚡ All Finds", badge: null },
  { id: "under-30", label: "🏷️ Under $30", maxPrice: 30 },
  { id: "under-60", label: "💸 Under $60", maxPrice: 60 },
  { id: "rare", label: "🔥 Rare Grails", rareOnly: true },
  { id: "avant-garde", label: "👁️ Avant-Garde", style: "avant-garde" },
  { id: "denim", label: "👖 Denim & Bottoms", category: "denim" },
  { id: "outerwear", label: "🧥 Outerwear", category: "outerwear" },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialBrand = searchParams.get("brand") || undefined;
  const initialCategory = searchParams.get("category") || undefined;
  const initialMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);

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

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    brand: initialBrand,
    category: initialCategory,
    era: undefined,
    style: undefined,
    maxPrice: initialMaxPrice,
    minPrice: undefined,
    rareOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  const filteredProducts = useMemo(() => {
    return productsList.filter((prod) => {
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

      // Max price filter
      if (filters.maxPrice !== undefined && prod.price > filters.maxPrice) {
        return false;
      }

      // Min price filter
      if (filters.minPrice !== undefined && prod.price < filters.minPrice) {
        return false;
      }

      // Rare only filter
      if (filters.rareOnly && !prod.isRare) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name-asc") return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.brand.localeCompare(a.brand) || b.name.localeCompare(a.name);
      return 0; // featured default
    });
  }, [query, filters, sortBy]);

  const handleReset = () => {
    setFilters({
      brand: undefined,
      category: undefined,
      era: undefined,
      style: undefined,
      maxPrice: undefined,
      minPrice: undefined,
      rareOnly: false,
    });
    setQuery("");
  };

  const handleQuickFilter = (qf: (typeof QUICK_FILTERS)[number]) => {
    if (qf.id === "all") {
      handleReset();
    } else if (qf.maxPrice) {
      setFilters((prev) => ({
        ...prev,
        maxPrice: prev.maxPrice === qf.maxPrice ? undefined : qf.maxPrice,
        minPrice: undefined,
      }));
    } else if (qf.rareOnly) {
      setFilters((prev) => ({
        ...prev,
        rareOnly: !prev.rareOnly,
      }));
    } else if (qf.category) {
      setFilters((prev) => ({
        ...prev,
        category: prev.category === qf.category ? undefined : qf.category,
      }));
    } else if (qf.style) {
      setFilters((prev) => ({
        ...prev,
        style: prev.style === qf.style ? undefined : qf.style,
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Info */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          ARCHIVE DATABASE ({filteredProducts.length} OF {productsList.length} ITEMS)
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
          DISCOVER ALL FINDS
        </h1>
        <p className="text-neutral-500 text-sm max-w-xl font-light">
          Filter by designer house, price range, fashion era, or specific grail silhouettes.
        </p>
      </div>

      {/* Quick Filter Horizontal Scrollbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {QUICK_FILTERS.map((qf) => {
          let isActive = false;
          if (qf.id === "all") {
            isActive =
              !filters.brand &&
              !filters.category &&
              !filters.era &&
              !filters.style &&
              filters.maxPrice === undefined &&
              !filters.rareOnly &&
              !query;
          } else if (qf.maxPrice) {
            isActive = filters.maxPrice === qf.maxPrice;
          } else if (qf.rareOnly) {
            isActive = !!filters.rareOnly;
          } else if (qf.category) {
            isActive = filters.category === qf.category;
          } else if (qf.style) {
            isActive = filters.style === qf.style;
          }

          return (
            <button
              key={qf.id}
              onClick={() => handleQuickFilter(qf)}
              className={cn(
                "whitespace-nowrap px-3.5 py-2 text-xs font-mono uppercase tracking-wider border transition-all rounded-full flex items-center gap-1.5",
                isActive
                  ? "bg-black text-white border-black shadow-sm font-bold"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-black hover:text-black"
              )}
            >
              {qf.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-grow max-w-xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by designer, piece name, or style..."
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
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-white border border-neutral-200 px-3 py-2 pr-8 text-xs font-mono uppercase tracking-wider text-neutral-800 hover:border-black focus:outline-none cursor-pointer rounded-none"
            >
              <option value="featured">Featured Drops (Default)</option>
              <option value="price-asc">Price: Low to High ($ - $$$)</option>
              <option value="price-desc">Price: High to Low ($$$ - $)</option>
              <option value="name-asc">Designer: A – Z</option>
              <option value="name-desc">Designer: Z – A</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(filters.brand ||
        filters.category ||
        filters.era ||
        filters.style ||
        filters.maxPrice !== undefined ||
        filters.rareOnly ||
        query) && (
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
          {filters.maxPrice !== undefined && (
            <button
              onClick={() => setFilters({ ...filters, maxPrice: undefined, minPrice: undefined })}
              className="px-2.5 py-1 bg-black text-white text-[11px] font-mono flex items-center gap-1.5 hover:bg-neutral-800"
            >
              Max Price: ${filters.maxPrice} USD ✕
            </button>
          )}
          {filters.rareOnly && (
            <button
              onClick={() => setFilters({ ...filters, rareOnly: false })}
              className="px-2.5 py-1 bg-black text-white text-[11px] font-mono flex items-center gap-1.5 hover:bg-neutral-800"
            >
              Rare Grails Only ✕
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
