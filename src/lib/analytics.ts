"use client";

import { track } from "@vercel/analytics";

export interface AffiliateClickEvent {
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  price?: number;
  currency?: string;
  affiliateUrl: string;
  source?: string;
}

/**
 * Tracks outbound affiliate conversions with Vercel Analytics & browser logging.
 */
export function trackAffiliateClick(data: AffiliateClickEvent) {
  try {
    // 1. Vercel Analytics Custom Event
    track("Affiliate Click", {
      productId: data.productId || "unknown",
      productName: data.productName || "unknown",
      brand: data.brand || "unknown",
      category: data.category || "unknown",
      price: data.price ? String(data.price) : "0",
      currency: data.currency || "EUR",
      source: data.source || "web_product_page",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Tracked Outbound Affiliate Click:", data);
    }
  } catch (err) {
    console.error("[Analytics] Failed to track affiliate click:", err);
  }
}
