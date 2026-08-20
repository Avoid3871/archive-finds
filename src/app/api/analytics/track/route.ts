import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics/analyticsStore";

export async function POST(req: NextRequest) {
  try {
    let body;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json") || contentType.includes("text/plain")) {
      const raw = await req.text();
      body = JSON.parse(raw);
    } else {
      body = await req.json();
    }

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
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
