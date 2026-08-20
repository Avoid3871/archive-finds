import { NextRequest, NextResponse } from "next/server";
import { purgeDevEvents } from "@/lib/analytics/analyticsStore";

export async function POST(req: NextRequest) {
  try {
    purgeDevEvents();
    return NextResponse.json({
      success: true,
      message: "Dev / Self-traffic events purged successfully. Analytics reset to clean external audience baseline.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
