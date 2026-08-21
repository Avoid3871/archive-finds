"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, ArrowUpRight, Bookmark, BookOpen, Camera, Sparkles } from "lucide-react";
import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import { GrailHunterModal } from "@/components/search/GrailHunterModal";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGrailHunterOpen, setIsGrailHunterOpen] = useState(false);
  const { savedCount } = useWishlist();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      <GrailHunterModal
        isOpen={isGrailHunterOpen}
        onClose={() => setIsGrailHunterOpen(false)}
      />

      {/* Top VIP Announcement Bar */}
      <div className="bg-black text-white px-4 py-1.5 text-center text-[10px] sm:text-[11px] font-mono tracking-wider flex items-center justify-center gap-2">
        <span className="hidden xs:inline">NEW TO AGENT SHOPPING?</span>
        <span>REGISTER VIA VIP LINK & CLAIM $140 SHIPPING COUPONS</span>
        <a
          href="https://www.sugargoo.com/register?memberId=1325437696506389977"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 underline hover:text-neutral-300 ml-1 font-bold"
        >
          CLAIM NOW
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand Title */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-3 h-3 bg-black transform group-hover:rotate-45 transition-transform duration-300" />
          <span className="font-black tracking-widest text-lg sm:text-xl uppercase text-black">
            ARCHIVE FINDS
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-xs font-semibold tracking-widest uppercase">
          <Link
            href="/discover"
            className="text-neutral-600 hover:text-black transition-colors"
          >
            DISCOVER
          </Link>
          <Link
            href="/new"
            className="text-neutral-600 hover:text-black transition-colors flex items-center gap-1"
          >
            NEW FINDS
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          </Link>
          <Link
            href="/brands"
            className="text-neutral-600 hover:text-black transition-colors"
          >
            BRANDS
          </Link>
          <Link
            href="/categories"
            className="text-neutral-600 hover:text-black transition-colors"
          >
            CATEGORIES
          </Link>
          <Link
            href="/mission"
            className="text-neutral-600 hover:text-black transition-colors"
          >
            OUR MISSION
          </Link>
          <button
            type="button"
            onClick={() => setIsGrailHunterOpen(true)}
            className="text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>GRAIL HUNTER</span>
          </button>
          <Link
            href="/saved"
            className="text-neutral-600 hover:text-black transition-colors flex items-center gap-1.5"
          >
            <Bookmark className={`w-3.5 h-3.5 ${savedCount > 0 ? "fill-black text-black" : ""}`} />
            <span>SAVED</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-mono rounded-full font-bold">
                {savedCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Switcher */}
          <CurrencySwitcher variant="header" />

          {/* Quick Search Button */}
          <Link
            href="/search"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded border border-neutral-200 text-neutral-500 hover:text-black hover:border-black transition-all text-xs font-medium"
            aria-label="Search Archive Finds"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search archive...</span>
            <kbd className="hidden sm:inline px-1 bg-neutral-100 border border-neutral-300 rounded text-[10px] text-neutral-500">
              /
            </kbd>
          </Link>

          {/* Quick Grail Hunter Camera Trigger Button */}
          <button
            type="button"
            onClick={() => setIsGrailHunterOpen(true)}
            title="Open Grail Hunter Visual Search"
            className="p-2 rounded border border-neutral-200 hover:border-black text-neutral-700 hover:text-black transition-all flex items-center justify-center cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
          </button>

          {/* Quick Saved Vault Button (Mobile/Tablet Header Icon) */}
          <Link
            href="/saved"
            aria-label="View Saved Pieces"
            className="relative p-2 rounded border border-neutral-200 text-neutral-700 hover:text-black hover:border-black transition-all md:hidden"
          >
            <Bookmark className={`w-4 h-4 ${savedCount > 0 ? "fill-black text-black" : ""}`} />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </Link>

          {/* Admin Direct Entry (Protected by Master Passphrase) */}
          <Link
            href="/admin"
            className="hidden lg:flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400 hover:text-black transition-colors pl-2"
          >
            HUD
            <ArrowUpRight className="w-3 h-3" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-700 hover:text-black"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-semibold tracking-wider uppercase">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-neutral-100 flex items-center justify-between text-neutral-800"
            >
              Discover Catalog
              <ArrowUpRight className="w-4 h-4 text-neutral-400" />
            </Link>
            <Link
              href="/new"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-neutral-100 flex items-center justify-between text-neutral-800"
            >
              New Drops
              <span className="text-[10px] px-1.5 py-0.5 bg-black text-white font-mono rounded">
                LATEST
              </span>
            </Link>
            <Link
              href="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-neutral-100 flex items-center justify-between text-neutral-800"
            >
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Saved Grail Vault
              </span>
              {savedCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 bg-black text-white font-mono rounded-full font-bold">
                  {savedCount}
                </span>
              )}
            </Link>
            <Link
              href="/brands"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-neutral-100 flex items-center justify-between text-neutral-800"
            >
              Designer Brands
              <ArrowUpRight className="w-4 h-4 text-neutral-400" />
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-neutral-100 flex items-center justify-between text-neutral-800"
            >
              Categories & Taxonomy
              <ArrowUpRight className="w-4 h-4 text-neutral-400" />
            </Link>
            <Link
              href="/mission"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-neutral-100 flex items-center justify-between text-neutral-800"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Our Mission & Manifesto
              </span>
              <ArrowUpRight className="w-4 h-4 text-neutral-400" />
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 font-mono text-xs text-neutral-500 hover:text-black flex items-center justify-between"
            >
              Worker & Admin HUD
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
