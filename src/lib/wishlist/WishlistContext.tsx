"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { MockProduct, MOCK_PRODUCTS } from "@/lib/products/mockData";
import { track } from "@vercel/analytics";

interface WishlistContextType {
  savedIds: string[];
  savedProducts: MockProduct[];
  savedCount: number;
  isSaved: (productId: string) => boolean;
  toggleSave: (product: MockProduct) => void;
  removeSave: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const STORAGE_KEY = "archive_finds_saved_grails_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load wishlist from localStorage:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
      window.dispatchEvent(new Event("wishlist-change"));
    } catch (e) {
      console.warn("Could not save wishlist to localStorage:", e);
    }
  }, [savedIds, isInitialized]);

  // Listen to cross-tab / window changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setSavedIds(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isSaved = useCallback(
    (productId: string) => savedIds.includes(productId),
    [savedIds]
  );

  const toggleSave = useCallback(
    (product: MockProduct) => {
      setSavedIds((prev) => {
        const exists = prev.includes(product.id);
        const next = exists
          ? prev.filter((id) => id !== product.id)
          : [...prev, product.id];

        // Track conversion event
        try {
          track(exists ? "Wishlist Remove" : "Wishlist Add", {
            productId: product.id,
            productName: product.name,
            brand: product.brand,
            price: String(product.price),
          });
        } catch {
          // ignore
        }

        return next;
      });
    },
    []
  );

  const removeSave = useCallback((productId: string) => {
    setSavedIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clearWishlist = useCallback(() => {
    setSavedIds([]);
  }, []);

  const savedProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => savedIds.includes(p.id));
  }, [savedIds]);

  return (
    <WishlistContext.Provider
      value={{
        savedIds,
        savedProducts,
        savedCount: savedIds.length,
        isSaved,
        toggleSave,
        removeSave,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
