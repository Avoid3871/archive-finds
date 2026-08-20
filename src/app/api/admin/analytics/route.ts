import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics/analyticsStore";

export async function GET() {
  try {
    const summary = getAnalyticsSummary();
    return NextResponse.json({
      success: true,
      analytics: summary,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Failed to load analytics" },
      { status: 500 }
    );
  }
}
