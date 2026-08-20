/**
 * Privacy-friendly client event tracker with Automatic Operator / Dev Filtering.
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
    // 1. Strict Developer & Operator Self-Filter
    // If user is authenticated as admin or on admin HUD or has opted out, NEVER track!
    const cookies = document.cookie || "";
    const isOperator =
      cookies.includes("af_admin_session") ||
      cookies.includes("af_ignore_analytics=true") ||
      localStorage.getItem("af_ignore_analytics") === "true" ||
      window.location.pathname.startsWith("/admin");

    if (isOperator) {
      return;
    }

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
