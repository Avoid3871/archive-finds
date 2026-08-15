import { NextResponse } from "next/server";
import { getJobsHistory, clearJobsHistory, logJobRecord } from "@/lib/admin/jobLogger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const jobs = getJobsHistory();
    return NextResponse.json({
      success: true,
      total: jobs.length,
      jobs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const job = logJobRecord(body);
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cleared = clearJobsHistory();
    return NextResponse.json({ success: cleared });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
