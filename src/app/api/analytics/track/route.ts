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

  const customCountry = req.headers.get("x-country-code");
  if (customCountry && customCountry.length === 2) return customCountry.toUpperCase();

  if (bodyCountry && bodyCountry.length === 2) return bodyCountry.toUpperCase();

  // Accept-Language fallback parsing
  const acceptLang = (req.headers.get("accept-language") || "").toLowerCase();
  if (acceptLang.includes("de-de") || acceptLang.includes("de-ch") || acceptLang.includes("de-at") || acceptLang.startsWith("de")) return "DE";
  if (acceptLang.includes("fr-fr") || acceptLang.startsWith("fr")) return "FR";
  if (acceptLang.includes("en-gb")) return "GB";
  if (acceptLang.includes("en-ca")) return "CA";
  if (acceptLang.includes("en-au")) return "AU";
  if (acceptLang.includes("ja")) return "JP";
  if (acceptLang.includes("it")) return "IT";
  if (acceptLang.includes("es")) return "ES";
  if (acceptLang.includes("nl")) return "NL";
  if (acceptLang.includes("sv") || acceptLang.includes("se")) return "SE";
  if (acceptLang.includes("pl")) return "PL";
  if (acceptLang.includes("ko")) return "KR";
  if (acceptLang.includes("pt-br") || acceptLang.includes("br")) return "BR";
  if (acceptLang.includes("en-us") || acceptLang.startsWith("en")) return "US";

  return "DE";
}

function parseCity(req: NextRequest, bodyCity?: string): string | undefined {
  const vercelCity = req.headers.get("x-vercel-ip-city");
  if (vercelCity) {
    try {
      return decodeURIComponent(vercelCity);
    } catch {
      return vercelCity;
    }
  }
  return bodyCity || undefined;
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
    const city = parseCity(req, body?.city);

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
        country: countryCode,
        city,
        device,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
