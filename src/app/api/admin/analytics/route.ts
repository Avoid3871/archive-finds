import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics/analyticsStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const summary = getAnalyticsSummary();
    return NextResponse.json(
      {
        success: true,
        analytics: summary,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Failed to load analytics" },
      { status: 500 }
    );
  }
}
