import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { ArrowUpRight } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          ARCHIVE TAXONOMY
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
          CATEGORIES
        </h1>
        <p className="text-neutral-500 text-sm max-w-xl font-light">
          Browse by garment silhouette, outerwear, footwear, or archive accessories.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/discover?category=${cat.slug}`}
            className="group p-6 border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-black transition-all flex flex-col justify-between h-40"
          >
            <div>
              <span className="text-xs font-mono text-neutral-600 uppercase">
                {cat.count} AVAILABLE ITEMS
              </span>
              <h2 className="font-black text-lg uppercase tracking-tight text-black mt-2">
                {cat.name}
              </h2>
            </div>
            <div className="flex justify-end pt-4">
              <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-black transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
