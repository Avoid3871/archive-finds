import { ProductGrid } from "@/components/products/ProductGrid";
import { MOCK_PRODUCTS } from "@/lib/products/mockData";
import { Sparkles } from "lucide-react";

export default function NewFindsPage() {
  const latestProducts = [...MOCK_PRODUCTS].reverse();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Info */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>LATEST SCANNED DROPS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
          NEW FINDS
        </h1>
        <p className="text-neutral-500 text-sm max-w-xl font-light">
          Recently imported from verified collector sheets and designer spreadsheets.
        </p>
      </div>

      <ProductGrid products={latestProducts} />
    </div>
  );
}
