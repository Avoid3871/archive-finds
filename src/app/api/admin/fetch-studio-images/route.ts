import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import util from "util";
import { logJobRecord } from "@/lib/admin/jobLogger";

const execFilePromise = util.promisify(execFile);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { query, marketUrl } = await req.json();

    if (!query && !marketUrl) {
      return NextResponse.json({ success: false, error: "Query or marketUrl is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "fetch_alternative_studio_images.py");
    const tempPayloadFile = path.join(process.cwd(), "scratch", `img_search_${Date.now()}.json`);
    
    fs.mkdirSync(path.dirname(tempPayloadFile), { recursive: true });
    fs.writeFileSync(tempPayloadFile, JSON.stringify({ query, marketUrl }), "utf-8");

    try {
      const { stdout } = await execFilePromise("python", [scriptPath, tempPayloadFile], {
        cwd: process.cwd(),
        timeout: 15000,
      });

      if (fs.existsSync(tempPayloadFile)) {
        fs.unlinkSync(tempPayloadFile);
      }

      const result = JSON.parse(stdout);
      const imgCount = (result.images || []).length;

      logJobRecord({
        type: "STUDIO_IMAGE_SEARCH",
        pieceName: query || marketUrl || "Product Image Search",
        status: "SUCCESS",
        durationMs: Date.now() - startTime,
        details: `Found ${imgCount} studio alternative image candidates`,
      });

      return NextResponse.json({ success: true, images: result.images || [] });
    } catch (err: any) {
      if (fs.existsSync(tempPayloadFile)) {
        fs.unlinkSync(tempPayloadFile);
      }

      logJobRecord({
        type: "STUDIO_IMAGE_SEARCH",
        pieceName: query || marketUrl || "Product Image Search",
        status: "FAILED",
        durationMs: Date.now() - startTime,
        details: err.message,
      });

      return NextResponse.json({ success: false, error: err.message, images: [] });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
