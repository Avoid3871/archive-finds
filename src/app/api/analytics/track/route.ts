import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics/analyticsStore";

function parseDeviceFromUserAgent(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod")) {
    return "Mobile (iOS / iPhone)";
  }
  if (lower.includes("android")) {
    return "Mobile (Android)";
  }
  if (lower.includes("macintosh") || lower.includes("mac os")) {
    return "Desktop (macOS / Apple)";
  }
  if (lower.includes("windows")) {
    return "Desktop (Windows / PC)";
  }
  if (lower.includes("linux")) {
    return "Desktop (Linux)";
  }
  return "Mobile (Direct / App)";
}

function parseCountryCode(req: NextRequest, bodyCountry?: string): string {
  const vercelCountry = req.headers.get("x-vercel-ip-country");
  if (vercelCountry && vercelCountry.length === 2) return vercelCountry.toUpperCase();

  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry.length === 2) return cfCountry.toUpperCase();

  if (bodyCountry && bodyCountry.length === 2) return bodyCountry.toUpperCase();

  // Accept-Language fallback
  const acceptLang = req.headers.get("accept-language") || "";
  if (acceptLang.includes("de")) return "DE";
  if (acceptLang.includes("fr")) return "FR";
  if (acceptLang.includes("en-gb") || acceptLang.includes("en-GB")) return "GB";
  if (acceptLang.includes("en-ca") || acceptLang.includes("en-CA")) return "CA";
  if (acceptLang.includes("ja")) return "JP";

  return "US";
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check Server-Side Operator Auth Cookie & Ignore Header
    const adminCookie = req.cookies.get("af_admin_session");
    const ignoreCookie = req.cookies.get("af_ignore_analytics")?.value === "true";
    const ignoreHeader = req.headers.get("x-ignore-analytics") === "true";

    if (adminCookie || ignoreCookie || ignoreHeader) {
      return NextResponse.json({ success: true, ignored: true, reason: "admin_self_traffic" });
    }

    let body;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json") || contentType.includes("text/plain")) {
      const raw = await req.text();
      body = JSON.parse(raw);
    } else {
      body = await req.json();
    }

    if (body?.isAdmin || body?.path?.startsWith("/admin")) {
      return NextResponse.json({ success: true, ignored: true, reason: "admin_self_traffic" });
    }

    const ua = req.headers.get("user-agent") || "";
    const device = parseDeviceFromUserAgent(ua);
    const countryCode = parseCountryCode(req, body?.countryCode);

    if (body && body.type) {
      recordAnalyticsEvent({
        type: body.type,
        path: body.path,
        referrer: body.referrer,
        agent: body.agent,
        productSlug: body.productSlug,
        brand: body.brand,
        price: typeof body.price === "number" ? body.price : undefined,
        query: body.query,
        style: body.style,
        countryCode,
        device,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
