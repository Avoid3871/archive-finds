/**
 * Privacy-friendly client event tracker.
 * Zero cookies, zero personal data, zero trackers.
 */
export function trackClientEvent(payload: {
  type: "page_view" | "agent_click" | "search" | "slide_generated";
  path?: string;
  agent?: string;
  productSlug?: string;
  brand?: string;
  price?: number;
  query?: string;
  style?: string;
}) {
  if (typeof window === "undefined") return;

  try {
    const data = {
      ...payload,
      referrer: document.referrer || undefined,
      path: payload.path || window.location.pathname,
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently without blocking UI
  }
}
