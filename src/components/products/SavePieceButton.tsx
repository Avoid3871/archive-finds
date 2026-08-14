"use client";

import { useWishlist } from "@/lib/wishlist/WishlistContext";
import { MockProduct } from "@/lib/products/mockData";
import { Bookmark, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavePieceButtonProps {
  product: MockProduct;
  className?: string;
}

export function SavePieceButton({ product, className }: SavePieceButtonProps) {
  const { isSaved, toggleSave } = useWishlist();
  const saved = isSaved(product.id);

  return (
    <button
      onClick={() => toggleSave(product)}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-6 py-3.5 border font-mono text-xs uppercase tracking-widest transition-all duration-200 active:scale-[0.99]",
        saved
          ? "bg-neutral-100 border-black text-black font-bold shadow-inner"
          : "bg-white border-neutral-300 text-neutral-800 hover:border-black hover:text-black",
        className
      )}
    >
      <Bookmark
        className={cn("w-4 h-4 transition-transform", saved ? "fill-black" : "fill-none")}
      />
      <span>{saved ? "SAVED IN YOUR GRAIL VAULT" : "SAVE TO WISHLIST"}</span>
    </button>
  );
}
