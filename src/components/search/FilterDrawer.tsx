"use client";

import { BRANDS, CATEGORIES, ERAS, STYLES } from "@/lib/constants";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FilterState {
  brand?: string;
  category?: string;
  era?: string;
  style?: string;
}

interface FilterDrawerProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
}

export function FilterDrawer({
  filters,
  onFilterChange,
  onReset,
}: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const toggleBrand = (slug: string) => {
    onFilterChange({
      ...filters,
      brand: filters.brand === slug ? undefined : slug,
    });
  };

  const toggleCategory = (slug: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === slug ? undefined : slug,
    });
  };

  const toggleEra = (slug: string) => {
    onFilterChange({
      ...filters,
      era: filters.era === slug ? undefined : slug,
    });
  };

  const toggleStyle = (slug: string) => {
    onFilterChange({
      ...filters,
      style: filters.style === slug ? undefined : slug,
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-neutral-200 hover:border-black bg-white text-xs font-mono tracking-widest uppercase transition-all"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-mono font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Modal / Slide-Over Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-black" />
                <h2 className="font-black text-sm uppercase tracking-widest">
                  FILTER ARCHIVE
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-black"
                aria-label="Close Filter Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Sections */}
            <div className="p-6 overflow-y-auto space-y-8 flex-grow">
              {/* Brands */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-3">
                  Designer / Brand
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {BRANDS.map((b) => {
                    const isSelected = filters.brand === b.slug;
                    return (
                      <button
                        key={b.slug}
                        onClick={() => toggleBrand(b.slug)}
                        className={cn(
                          "px-2.5 py-1 text-xs border transition-all font-medium",
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                        )}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-3">
                  Category
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const isSelected = filters.category === c.slug;
                    return (
                      <button
                        key={c.slug}
                        onClick={() => toggleCategory(c.slug)}
                        className={cn(
                          "px-2.5 py-1 text-xs border transition-all font-medium",
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Era */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-3">
                  Era
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {ERAS.map((e) => {
                    const isSelected = filters.era === e.slug;
                    return (
                      <button
                        key={e.slug}
                        onClick={() => toggleEra(e.slug)}
                        className={cn(
                          "px-3 py-1 text-xs font-mono border transition-all",
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                        )}
                      >
                        {e.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-3">
                  Aesthetic / Style
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.map((s) => {
                    const isSelected = filters.style === s.slug;
                    return (
                      <button
                        key={s.slug}
                        onClick={() => toggleStyle(s.slug)}
                        className={cn(
                          "px-2.5 py-1 text-xs border transition-all font-medium",
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black"
                        )}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-neutral-200 bg-neutral-50 flex items-center gap-3">
              <button
                onClick={onReset}
                className="w-1/3 py-3 border border-neutral-300 text-neutral-600 hover:text-black hover:border-black font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-2/3 py-3 bg-black text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                Apply Filters {activeCount > 0 && `(${activeCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
