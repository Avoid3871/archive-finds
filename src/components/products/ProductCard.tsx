"use client";

import Link from "next/link";
import Image from "next/image";
import { MockProduct } from "@/lib/products/mockData";
import { formatPrice } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { Bookmark, Heart } from "lucide-react";

interface ProductCardProps {
  product: MockProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { isSaved, toggleSave } = useWishlist();
  const saved = isSaved(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(product);
  };

  return (
    <div className="group relative flex flex-col bg-white border border-neutral-200 overflow-hidden transition-all duration-300 hover:border-black hover:shadow-sm">
      {/* Clickable Card Link */}
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-col flex-grow"
      >
        {/* Visual Image Container */}
        <div className="relative aspect-[3/4] w-full bg-neutral-50 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={`${product.brand} - ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Top Floating Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
            {product.isRare && (
              <span className="px-1.5 py-0.5 bg-black text-white text-[9px] font-mono tracking-widest uppercase font-bold">
                RARE
              </span>
            )}
            {product.era && (
              <span className="px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-black border border-neutral-200 text-[9px] font-mono tracking-wider uppercase font-semibold">
                {product.era}
              </span>
            )}
          </div>

          {/* Subtle hover overlay badge */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="px-2 py-1 bg-black text-white text-[10px] font-mono uppercase tracking-wider">
              VIEW PIECE
            </span>
          </div>
        </div>

        {/* Editorial Information Block */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between border-t border-neutral-100 bg-white">
          <div>
            {/* Brand Tag */}
            <p className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-black">
              {product.brand}
            </p>

            {/* Product Name */}
            <h3 className="text-xs sm:text-sm font-medium text-neutral-800 line-clamp-2 mt-0.5 leading-snug">
              {product.name}
            </h3>
          </div>

          {/* Price & Category Meta */}
          <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold font-mono text-black">
              {formatPrice(product.price, product.currency)}
            </span>
            <span className="text-[10px] font-mono text-neutral-600 uppercase">
              {product.categorySlug}
            </span>
          </div>
        </div>
      </Link>

      {/* Top-Right Quick Bookmark / Wishlist Button */}
      <button
        onClick={handleWishlistClick}
        aria-label={saved ? "Remove from saved grails" : "Save piece to wishlist"}
        className={`absolute top-2 right-2 z-20 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
          saved
            ? "bg-black text-white shadow-md scale-105"
            : "bg-white/80 text-neutral-600 hover:text-black hover:bg-white border border-neutral-200"
        }`}
      >
        <Bookmark
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            saved ? "fill-white scale-110" : "fill-none hover:scale-110"
          }`}
        />
      </button>
    </div>
  );
}
