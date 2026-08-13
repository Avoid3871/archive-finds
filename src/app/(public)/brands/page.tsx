import Link from "next/link";
import { BRANDS } from "@/lib/constants";
import { ArrowUpRight } from "lucide-react";

export default function BrandsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          INDEX OF HOUSES
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-black">
          DESIGNER BRANDS
        </h1>
        <p className="text-neutral-500 text-sm max-w-xl font-light">
          Browse pieces across Japanese avant-garde, Belgian minimalism, and modern luxury houses.
        </p>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {BRANDS.map((brand) => (
          <Link
            key={brand.slug}
            href={`/discover?brand=${brand.slug}`}
            className="group p-6 border border-neutral-200 bg-white hover:border-black transition-all flex flex-col justify-between h-44"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono text-neutral-600 uppercase">
                {brand.origin}
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
            </div>

            <div>
              <h2 className="font-black text-lg uppercase tracking-tight text-black group-hover:translate-x-0.5 transition-transform">
                {brand.name}
              </h2>
              <p className="text-xs font-mono text-neutral-600 uppercase mt-1">
                Era: {brand.era}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
