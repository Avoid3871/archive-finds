"use client";

import { track } from "@vercel/analytics";
import { trackClientEvent } from "@/lib/analytics/trackEvent";

export interface AffiliateClickEvent {
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  price?: number;
  currency?: string;
  affiliateUrl: string;
  source?: string;
  agentName?: string;
}

/**
 * Tracks outbound affiliate conversions with Vercel Analytics & local HUD tracker.
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
      currency: data.currency || "USD",
      source: data.source || "web_product_page",
    });

    // 2. Local Admin HUD Real-time Tracker
    let agent = "sugargoo";
    const url = (data.affiliateUrl || "").toLowerCase();
    if (url.includes("superbuy.com")) agent = "superbuy";
    else if (url.includes("mulebuy.com")) agent = "mulebuy";
    else if (url.includes("cnfans.com")) agent = "cnfans";
    else if (url.includes("cssbuy.com")) agent = "cssbuy";
    else if (url.includes("kakobuy.com")) agent = "kakobuy";
    else if (url.includes("hoobuy.com") || url.includes("hoobuy.cc")) agent = "hoobuy";

    trackClientEvent({
      type: "agent_click",
      agent,
      productSlug: data.productId,
      brand: data.brand,
      price: data.price,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Tracked Outbound Affiliate Click:", data);
    }
  } catch (err) {
    console.error("[Analytics] Failed to track affiliate click:", err);
  }
}
