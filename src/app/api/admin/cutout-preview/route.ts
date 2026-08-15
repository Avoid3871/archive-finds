import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import util from "util";
import { logJobRecord } from "@/lib/admin/jobLogger";

const execFilePromise = util.promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const { imageSrc, rotation = 0 } = await req.json();

    if (!imageSrc) {
      return NextResponse.json({ success: false, error: "imageSrc is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scratch", "run_cutout_preview.py");
    const outFilename = `preview_${Date.now()}.png`;
    const outFullPath = path.join(process.cwd(), "public", "products", outFilename);

    const pythonCode = `
import sys
import os
import urllib.request
import io
from PIL import Image
import rembg

image_src = sys.argv[1]
out_path = sys.argv[2]
rotation = int(sys.argv[3]) if len(sys.argv) > 3 else 0

os.makedirs(os.path.dirname(out_path), exist_ok=True)

try:
    if image_src.startswith("http"):
        req = urllib.request.Request(
            image_src,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            input_bytes = resp.read()
    else:
        # Local file path
        local_full = os.path.join(r"${process.cwd().replace(/\\/g, '\\\\')}", "public", image_src.lstrip("/"))
        with open(local_full, "rb") as f:
            input_bytes = f.read()

    # Remove background with rembg
    output_bytes = rembg.remove(input_bytes)
    img = Image.open(io.BytesIO(output_bytes))

    # Apply rotation if specified
    if rotation % 360 != 0:
        img = img.rotate((360 - rotation) % 360, expand=True)

    img.save(out_path, "PNG")
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
`;

    fs.writeFileSync(scriptPath, pythonCode, "utf-8");

    const startTime = Date.now();
    await execFilePromise("python", [scriptPath, imageSrc, outFullPath, String(rotation)], {
      cwd: process.cwd(),
      timeout: 20000,
    });

    const localCutoutUrl = `/products/${outFilename}`;
    logJobRecord({
      type: "AI_BACKGROUND_REMOVAL",
      pieceName: imageSrc.substring(imageSrc.lastIndexOf("/") + 1, imageSrc.lastIndexOf("/") + 40) || "Preview Cutout",
      status: "SUCCESS",
      durationMs: Date.now() - startTime,
      details: `Generated transparent studio cutout (${outFilename})`,
    });

    return NextResponse.json({
      success: true,
      localCutoutUrl,
      rawImageSrc: imageSrc,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
