import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  BookOpen,
  Sparkles,
  Layers,
  Scale,
  ExternalLink,
  Compass,
  ArrowRight,
  Database,
  Globe2,
  FileText,
  Search,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Mission // Archive Finds",
  description:
    "An independent digital fashion archive and non-commercial research catalog dedicated to the preservation, documentation, and price transparency of contemporary garment silhouettes.",
};

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24 selection:bg-neutral-800">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-neutral-800/80 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-neutral-800/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[11px] font-mono uppercase tracking-widest text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Digital Archive // Open Study Index</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            The Preservation & Study of Contemporary Fashion Culture.
          </h1>

          <p className="text-sm sm:text-base md:text-lg font-sans text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Archive Finds is an independent digital catalog and non-commercial visual index 
            documenting rare silhouettes, runway history, garment construction, and cross-border 
            market valuations.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-neutral-800/80 mt-10">
            <div className="p-4 bg-neutral-900/50 border border-neutral-800/60 rounded-xl text-left">
              <span className="font-mono text-2xl font-bold text-white block">400+</span>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Archived Items</span>
            </div>
            <div className="p-4 bg-neutral-900/50 border border-neutral-800/60 rounded-xl text-left">
              <span className="font-mono text-2xl font-bold text-emerald-400 block">100%</span>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Independent Study</span>
            </div>
            <div className="p-4 bg-neutral-900/50 border border-neutral-800/60 rounded-xl text-left">
              <span className="font-mono text-2xl font-bold text-white block">7</span>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Indexed Agents</span>
            </div>
            <div className="p-4 bg-neutral-900/50 border border-neutral-800/60 rounded-xl text-left">
              <span className="font-mono text-2xl font-bold text-orange-400 block">0</span>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Stored Inventory</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE MANIFESTO & PHILOSOPHY */}
      <section className="py-16 md:py-24 border-b border-neutral-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
              <BookOpen className="w-4 h-4 text-white" />
              <span>Section 01 // Purpose & Philosophy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white">
              Why We Archive: Safeguarding Garment Design in the Digital Age
            </h2>
          </div>

          <div className="prose prose-invert prose-neutral max-w-none space-y-6 text-sm sm:text-base text-neutral-300 leading-relaxed font-sans">
            <p>
              Contemporary fashion moves at an unprecedented speed. Revolutionary garment silhouettes, 
              innovative fabric washes, and underground Japanese & European subcultural staples 
              frequently vanish from physical stores, fragmented boutique archives, and Asian marketplaces 
              without proper digital documentation.
            </p>
            <p>
              <strong>Archive Finds</strong> was created to solve this fragmentation. We operate as an 
              autonomous curatorial index that catalogues historically significant garments—spanning 
              pioneering avant-garde designers, archival runway collections, and contemporary streetwear 
              movements.
            </p>
            <p>
              Our vision pipeline cleans messy seller listings into pristine studio cutouts, standardizes 
              material notes, records weight metrics, and tracks real-time market valuations across 
              global manufacturing networks.
            </p>
          </div>
        </div>
      </section>

      {/* 3. THE 4 ARCHIVAL PILLARS (BENTO GRID) */}
      <section className="py-16 md:py-24 border-b border-neutral-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
              <Layers className="w-4 h-4 text-white" />
              <span>Section 02 // Core Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white">
              The Four Pillars of the Archive
            </h2>
            <p className="text-xs sm:text-sm font-sans text-neutral-400">
              Our automated indexing pipeline brings structure and transparency to modern garment research.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-white font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-mono font-bold uppercase text-white">
                Autonomous Studio Cutouts
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                Every item is isolated using our local neural cutout pipeline (`rembg`), eliminating 
                cluttered backgrounds and low-resolution noise to present garments with pure editorial 
                fidelity and museum-grade visual clarity.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-white font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-mono font-bold uppercase text-white">
                Live Valuation & Price Index
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                We track exact Chinese marketplace origin prices in CNY (Weidian / Taobao) and convert 
                them dynamically to USD and EUR. This transparency protects researchers and enthusiasts 
                from arbitrary middleman inflation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-white font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-mono font-bold uppercase text-white">
                Multi-Agent Sourcing Directives
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                We index direct compatibility with 7 global shipping & proxy agents (Sugargoo, Superbuy, 
                Mulebuy, CNfans, CSSbuy, Kakobuy, Hoobuy), allowing users to study international logistics 
                and purchase routes easily.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-white font-mono font-bold text-sm">
                04
              </div>
              <h3 className="text-lg font-mono font-bold uppercase text-white">
                9:16 Visual Archiving & Taxonomy
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                Our platform generates vertical archival study slides with typography, fit tags, 
                and source links formatted for contemporary social curation, knowledge dissemination, 
                and educational review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LEGAL NOTICE, NON-COMMERCIAL STATUS & FAIR USE */}
      <section className="py-16 md:py-24 border-b border-neutral-800/80 bg-neutral-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <Scale className="w-4 h-4" />
              <span>Section 03 // Legal Framework & Disclaimers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white">
              Non-Commercial Operations & Fair Use Notice
            </h2>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
            {/* Box 1: Non-Commercial & No Stock */}
            <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
              <h4 className="font-mono font-bold uppercase text-white text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                1. Independent Research Index (No Physical Goods Sold)
              </h4>
              <p>
                <strong>Archive Finds is not an online store, retailer, marketplace, manufacturer, or shipping agent.</strong> We do not hold physical stock, process payments for garments, or ship packages. All listings are curated purely for visual study, historical cataloging, and informational tracking.
              </p>
            </div>

            {/* Box 2: Third-Party Marketplaces & Links */}
            <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
              <h4 className="font-mono font-bold uppercase text-white text-xs flex items-center gap-2">
                <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                2. Third-Party Marketplace Links & Disclaimers
              </h4>
              <p>
                Outbound links provided on this site direct users to third-party marketplaces (e.g. Weidian, Taobao) or international shopping proxy services (Sugargoo, Superbuy, Mulebuy, CNfans, CSSbuy, Kakobuy, Hoobuy). Archive Finds is not responsible for the availability, quality, accuracy, fulfillment, or legality of items listed on third-party websites. Users interact with third-party providers at their own discretion.
              </p>
            </div>

            {/* Box 3: Intellectual Property & Fair Use */}
            <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
              <h4 className="font-mono font-bold uppercase text-white text-xs flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                3. Trademark & Intellectual Property Fair Use Notice
              </h4>
              <p>
                All brand names, designer logos, trademarks, and garment aesthetic likenesses referenced within this catalog remain the exclusive property of their respective fashion houses and trademark owners. Any mention of brands or designer names is made solely for descriptive, identifying, and educational research purposes under international fair use doctrines. Archive Finds is an independent research project and is not sponsored, endorsed, or affiliated with any featured fashion brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMMUNITY & INQUIRIES */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
            <Compass className="w-4 h-4 text-white" />
            <span>Connect & Explore</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif text-white">
            Explore the Living Archive
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            Browse our curated archive of outerwear, knitwear, denim, and accessories, updated daily through our autonomous discovery engine.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/discover"
              className="px-6 py-3 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/brands"
              className="px-6 py-3 bg-neutral-900 text-white border border-neutral-800 font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-800 hover:border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Brands</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
