"use client";

import { useState } from "react";
import { CategoryItem } from "@/lib/analytics/analyticsStore";
import { Tag, Sparkles, Layers } from "lucide-react";

interface CategoryBrandMatrixProps {
  categories?: CategoryItem[];
  categoryBreakdown?: CategoryItem[];
  brands?: { brand: string; clicks: number; percentage: number }[];
  topBrands?: { brand: string; clicks: number; percentage: number }[];
}

export function CategoryBrandMatrix(props: CategoryBrandMatrixProps) {
  const [activeView, setActiveView] = useState<"categories" | "brands">("brands");

  const brandList = props.brands || props.topBrands || [];
  const categoryList = props.categories || props.categoryBreakdown || [];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            {activeView === "brands" ? (
              <Sparkles className="w-4 h-4 text-amber-400" />
            ) : (
              <Layers className="w-4 h-4 text-cyan-400" />
            )}
            <span>{activeView === "brands" ? "Designer Brand Share" : "Garment Category Split"}</span>
          </h2>
          <p className="text-xs font-mono text-neutral-500">
            Demand density and traffic allocation across catalogs
          </p>
        </div>

        <div className="flex items-center bg-neutral-950 border border-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveView("brands")}
            className={`px-3 py-1 text-xs font-mono uppercase font-bold rounded transition-colors cursor-pointer ${
              activeView === "brands"
                ? "bg-white text-black shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Brands
          </button>
          <button
            onClick={() => setActiveView("categories")}
            className={`px-3 py-1 text-xs font-mono uppercase font-bold rounded transition-colors cursor-pointer ${
              activeView === "categories"
                ? "bg-white text-black shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="space-y-4">
        {activeView === "brands"
          ? brandList.map((b, idx) => (
              <div key={b.brand || idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white uppercase flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-center font-mono">
                      0{idx + 1}
                    </span>
                    <span>{b.brand}</span>
                  </span>
                  <span className="text-neutral-400">
                    <strong className="text-white">{b.clicks}</strong> clicks ({b.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(b.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))
          : categoryList.map((c, idx) => (
              <div key={c.category || idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white uppercase flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-center font-mono">
                      0{idx + 1}
                    </span>
                    <span>{c.category}</span>
                  </span>
                  <span className="text-neutral-400">
                    <strong className="text-white">{c.clicks}</strong> clicks ({c.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(c.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
