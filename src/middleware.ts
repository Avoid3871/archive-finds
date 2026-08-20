import { NextRequest, NextResponse } from "next/server";

// Known aggressive AI scrapers, web crawlers, and automated data extractors
const BLOCKED_BOT_PATTERNS = [
  "gptbot",
  "chatgpt-user",
  "ccbot",
  "claudebot",
  "anthropic-ai",
  "bytespider",
  "diffbot",
  "scrapy",
  "cohere-ai",
  "perplexitybot",
  "omgilibot",
  "facebookbot",
  "amazonbot",
  "dataforseobot",
  "semrushbot",
  "ahrefsbot",
  "dotbot",
  "petalbot",
  "yandexbot",
  "mj12bot",
  "seekport",
  "megaindex",
  "zoominfobot",
  "blexbot",
  "turnitin",
  "sogou",
  "exabot",
];

// CLI and script user agents targeting APIs
const SCRIPT_BOT_PATTERNS = [
  "python-requests",
  "python-urllib",
  "aiohttp",
  "scrapy",
  "go-http-client",
  "java/",
  "libwww-perl",
  "wget",
];

export function middleware(req: NextRequest) {
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  const pathname = req.nextUrl.pathname;

  // 1. Block known aggressive scrapers and AI crawler bots globally
  const isBlockedBot = BLOCKED_BOT_PATTERNS.some((bot) =>
    userAgent.includes(bot)
  );

  if (isBlockedBot) {
    return new NextResponse(
      JSON.stringify({
        error: "Access Denied: Automated crawling and harvesting prohibited by Archive Finds Security Policy.",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        },
      }
    );
  }

  // 2. Block generic script libraries attempting to probe /api routes without browser headers
  if (pathname.startsWith("/api/")) {
    const isScriptBot = SCRIPT_BOT_PATTERNS.some((pattern) =>
      userAgent.includes(pattern)
    );

    // Allow internal loopback / localhost dev requests
    const host = req.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

    if (isScriptBot && !isLocal) {
      return new NextResponse(
        JSON.stringify({ error: "Access Denied: API access restricted." }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Robots-Tag": "noindex, nofollow",
          },
        }
      );
    }
  }

  // 3. Security response headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // If visiting admin or API routes, explicitly inject anti-index tags
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with common extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|css|js)).*)",
  ],
};
