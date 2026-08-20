import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import util from "util";
import urllib from "urllib";

const execFilePromise = util.promisify(execFile);
const UPLOADS_DIR = path.join(process.cwd(), "public", "products", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer | null = null;
    let removeBg = true;
    let customName = "product_image";
    let originalRawUrl = "";

    // 1. JSON Request (Base64 data or existing URL cutout)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { imageSrc, name, action } = body;
      removeBg = body.removeBg !== false;
      if (name) customName = name;

      if (!imageSrc) {
        return NextResponse.json({ success: false, error: "imageSrc is required" }, { status: 400 });
      }

      if (imageSrc.startsWith("data:image/")) {
        const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");
        buffer = Buffer.from(base64Data, "base64");
      } else if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
        // Fetch remote URL
        const res = await fetch(imageSrc, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
        });
        if (!res.ok) {
          return NextResponse.json({ success: false, error: "Failed to download image from URL" }, { status: 400 });
        }
        buffer = Buffer.from(await res.arrayBuffer());
      } else if (imageSrc.startsWith("/")) {
        // Local public file path
        const localPath = path.join(process.cwd(), "public", imageSrc.split("?")[0].replace(/^\//, ""));
        if (fs.existsSync(localPath)) {
          buffer = fs.readFileSync(localPath);
          originalRawUrl = imageSrc;
        } else {
          return NextResponse.json({ success: false, error: "Local file not found" }, { status: 404 });
        }
      }
    } else {
      // 2. Multipart FormData (File upload or clipboard blob)
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      removeBg = formData.get("removeBg") !== "false";
      const name = formData.get("name") as string | null;
      if (name) customName = name;

      if (!file) {
        return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
      }

      buffer = Buffer.from(await file.arrayBuffer());
    }

    if (!buffer) {
      return NextResponse.json({ success: false, error: "No valid image data could be parsed" }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeBaseName = customName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 40);

    const rawFileName = `raw_${safeBaseName}_${timestamp}.png`;
    const rawFilePath = path.join(UPLOADS_DIR, rawFileName);

    fs.writeFileSync(rawFilePath, buffer);
    const rawPublicUrl = `/products/uploads/${rawFileName}`;
    let finalImageUrl = rawPublicUrl;

    // Run Python rembg background cutout if requested
    if (removeBg) {
      const cutoutFileName = `cutout_${safeBaseName}_${timestamp}.png`;
      const cutoutFilePath = path.join(UPLOADS_DIR, cutoutFileName);

      const pythonScript = `
import sys
from PIL import Image
import rembg

input_path = sys.argv[1]
output_path = sys.argv[2]

try:
    img = Image.open(input_path)
    img = img.convert("RGBA")
    output = rembg.remove(img)
    output.save(output_path, "PNG")
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
`;
      const scriptPath = path.join(process.cwd(), "scratch", "upload_cutout_runner.py");
      try {
        fs.mkdirSync(path.join(process.cwd(), "scratch"), { recursive: true });
        fs.writeFileSync(scriptPath, pythonScript, "utf-8");
        await execFilePromise("python", [scriptPath, rawFilePath, cutoutFilePath]);

        if (fs.existsSync(cutoutFilePath)) {
          finalImageUrl = `/products/uploads/${cutoutFileName}`;
        }
      } catch (rembgError) {
        console.warn("Rembg cutout failed, falling back to raw image:", rembgError);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      rawUrl: rawPublicUrl,
      isCutout: finalImageUrl !== rawPublicUrl,
      message: removeBg ? "Studio cutout created successfully!" : "Raw image saved successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to process image" }, { status: 500 });
  }
}
