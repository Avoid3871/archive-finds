import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
  try {
    const scratchPath = path.join(process.cwd(), "scratch", "discovered_qualityreps_finds.json");
    if (fs.existsSync(scratchPath)) {
      const data = JSON.parse(fs.readFileSync(scratchPath, "utf-8"));
      return NextResponse.json({ success: true, items: data });
    }
    return NextResponse.json({ success: true, items: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 8;
    const autoAdd = body.autoAdd ? "--auto" : "";

    const scriptPath = path.join(process.cwd(), "scripts", "reddit_qualityreps_scanner.py");
    const cmd = `python "${scriptPath}" --limit=${limit} ${autoAdd}`;

    return new Promise((resolve) => {
      exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
        const scratchPath = path.join(process.cwd(), "scratch", "discovered_qualityreps_finds.json");
        let items = [];
        if (fs.existsSync(scratchPath)) {
          try {
            items = JSON.parse(fs.readFileSync(scratchPath, "utf-8"));
          } catch (e) {}
        }

        if (error) {
          resolve(
            NextResponse.json({
              success: false,
              error: stderr || error.message,
              stdout,
              items,
            })
          );
        } else {
          resolve(
            NextResponse.json({
              success: true,
              message: "r/QualityReps scan completed successfully!",
              stdout,
              items,
            })
          );
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
