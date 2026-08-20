"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/trackEvent";

export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ignore internal admin navigation from public pageview analytics
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    trackClientEvent({
      type: "page_view",
      path: fullPath,
    });
  }, [pathname, searchParams]);

  return null;
}
