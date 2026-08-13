import Link from "next/link";
import { SITE_CONFIG, BRANDS, CATEGORIES } from "@/lib/constants";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-neutral-950 text-white border-t border-neutral-800 pt-16 pb-24 md:pb-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-neutral-800">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white" />
              <span className="font-black tracking-widest text-xl uppercase">
                {SITE_CONFIG.name}
              </span>
            </div>
            <p className="text-neutral-400 text-sm max-w-sm font-light leading-relaxed">
              Curating rare designer garments, avant-garde pieces, and vintage runway grails.
              A visual fashion archive powered by autonomous discovery pipelines.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href={SITE_CONFIG.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono tracking-widest text-neutral-400 hover:text-white uppercase flex items-center gap-1 transition-colors"
              >
                TikTok <ArrowUpRight className="w-3 h-3" />
              </a>
              <a
                href={SITE_CONFIG.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono tracking-widest text-neutral-400 hover:text-white uppercase flex items-center gap-1 transition-colors"
              >
                Instagram <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Brands Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Featured Designers
            </h3>
            <ul className="space-y-2 text-sm">
              {BRANDS.slice(0, 5).map((brand) => (
                <li key={brand.slug}>
                  <Link
                    href={`/discover?brand=${brand.slug}`}
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Links */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Categories
            </h3>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/discover?category=${cat.slug}`}
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Info */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/discover" className="text-neutral-300 hover:text-white transition-colors">
                  All Finds
                </Link>
              </li>
              <li>
                <Link href="/new" className="text-neutral-300 hover:text-white transition-colors">
                  Latest Drops
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-neutral-300 hover:text-white transition-colors">
                  Instant Search
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-neutral-400 hover:text-neutral-200 transition-colors font-mono text-xs">
                  Worker HUD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <p>© {new Date().getFullYear()} ARCHIVE FINDS. All rights reserved.</p>
          <p className="text-neutral-600">
            Automated Product Discovery & Content Pipeline
          </p>
        </div>
      </div>
    </footer>
  );
}
