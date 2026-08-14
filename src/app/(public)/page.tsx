import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles, Compass, ShieldCheck, Zap } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { MOCK_PRODUCTS } from "@/lib/products/mockData";
import { BRANDS, CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  const newFinds = MOCK_PRODUCTS.slice(0, 6);
  const featuredFinds = MOCK_PRODUCTS.filter((p) => p.isFeatured);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative border-b border-neutral-200 bg-white pt-10 pb-12 sm:pt-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-6">
            {/* Top Micro-Tag */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-100 border border-neutral-200 text-[10px] font-mono tracking-widest uppercase text-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              LIVE ARCHIVE DATABASE — UPDATED DAILY
            </div>

            {/* Huge Confident Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.95] text-black">
              ARCHIVE
              <br />
              FINDS.
            </h1>

            {/* Value Proposition */}
            <p className="text-base sm:text-xl text-neutral-600 font-light max-w-2xl leading-relaxed">
              Curated rare designer garments, avant-garde runway pieces, and vintage streetwear grails. Sourced directly and verified.
            </p>

            {/* Quick Hero Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/discover"
                className="px-6 py-3.5 bg-black text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <span>EXPLORE ALL FINDS</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/new"
                className="px-6 py-3.5 bg-white text-black border border-neutral-300 font-mono text-xs uppercase tracking-widest hover:border-black transition-all"
              >
                NEW DROPS
              </Link>
            </div>
          </div>

          {/* Quick Category & Price Carousel on Mobile */}
          <div className="mt-10 pt-6 border-t border-neutral-100 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-600 shrink-0 mr-2">
              QUICK ACCESS:
            </span>
            <Link
              href="/discover?maxPrice=30"
              className="shrink-0 px-3 py-1.5 bg-neutral-100 hover:bg-black hover:text-white border border-neutral-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              🏷️ Under $30
            </Link>
            <Link
              href="/discover?maxPrice=60"
              className="shrink-0 px-3 py-1.5 bg-neutral-100 hover:bg-black hover:text-white border border-neutral-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              💸 Under $60
            </Link>
            <Link
              href="/saved"
              className="shrink-0 px-3 py-1.5 bg-neutral-100 hover:bg-black hover:text-white border border-neutral-300 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              🔖 Saved Vault
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/discover?category=${cat.slug}`}
                className="shrink-0 px-3 py-1.5 bg-neutral-50 hover:bg-black hover:text-white border border-neutral-200 text-xs font-medium uppercase tracking-wider transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. NEW FINDS (2-COL ON MOBILE / 4-COL ON DESKTOP) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-neutral-200">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600 mb-1">
              FRESHLY CURATED
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              NEW FINDS
            </h2>
          </div>
          <Link
            href="/new"
            className="text-xs font-mono tracking-widest uppercase text-neutral-600 hover:text-black flex items-center gap-1 transition-colors"
          >
            VIEW ALL ({MOCK_PRODUCTS.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProductGrid products={newFinds} />
      </section>

      {/* 3. EDITORIAL HIGHLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-black bg-neutral-950 text-white p-6 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-2 py-0.5 bg-white text-black text-[10px] font-mono uppercase tracking-widest font-bold">
              SPOTLIGHT GRAIL
            </span>
            <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
              2001 RAF SIMONS RIOT RIOT RIOT! ARCHIVE
            </h3>
            <p className="text-neutral-400 text-sm sm:text-base font-light leading-relaxed">
              The foundational archetype of modern subcultural fashion. Seminal Autumn/Winter 2001 layered archive piece from Raf Simons' most coveted historical runway collection.
            </p>
            <div className="pt-2">
              <Link
                href="/product/raf-simons-raf-simons-a-w-2001-riot-riot-riot-striped-l-s"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors"
              >
                VIEW GRAIL DETAILS <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXPLORE BY BRAND */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-neutral-200">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600 mb-1">
              DESIGNER HOUSES
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              EXPLORE BY BRAND
            </h2>
          </div>
          <Link
            href="/brands"
            className="text-xs font-mono tracking-widest uppercase text-neutral-600 hover:text-black flex items-center gap-1 transition-colors"
          >
            ALL BRANDS <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/discover?brand=${brand.slug}`}
              className="group p-4 sm:p-6 border border-neutral-200 bg-white hover:border-black transition-all flex flex-col justify-between h-32 sm:h-36"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono text-neutral-600 uppercase">
                  {brand.origin}
                </span>
                <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-black group-hover:translate-x-0.5 transition-transform">
                  {brand.name}
                </h3>
                <p className="text-[10px] font-mono text-neutral-600 uppercase">
                  {brand.era}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. EXPLORE BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-neutral-200">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600 mb-1">
              TAXONOMY
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              EXPLORE BY CATEGORY
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-xs font-mono tracking-widest uppercase text-neutral-600 hover:text-black flex items-center gap-1 transition-colors"
          >
            ALL CATEGORIES <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/discover?category=${cat.slug}`}
              className="p-5 border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-black transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-neutral-600 uppercase">
                  {cat.count} PIECES
                </span>
                <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight text-black mt-1">
                  {cat.name}
                </h3>
              </div>
              <div className="pt-4 flex justify-end">
                <ArrowUpRight className="w-4 h-4 text-neutral-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. TRUST & AUTOMATION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 bg-neutral-50 border border-neutral-200">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white border border-neutral-200 text-black">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-black">
                Fast Direct Links
              </h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Zero clutter. Direct Sugargoo affiliate pathways to procure verified archive pieces.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white border border-neutral-200 text-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-black">
                Daily Curation
              </h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Automated scanning across specialized spreadsheets and collector channels.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white border border-neutral-200 text-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-black">
                Deduplicated Database
              </h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Multi-tier deduplication ensures unique, high-quality product discovery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
