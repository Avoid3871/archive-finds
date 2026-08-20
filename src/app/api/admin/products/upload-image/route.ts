import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import util from "util";

const execFilePromise = util.promisify(execFile);
const UPLOADS_DIR = path.join(process.cwd(), "public", "products", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const removeBg = formData.get("removeBg") === "true";
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeBaseName = (customName || file.name || "product_upload")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 40);

    const rawFileName = `raw_${safeBaseName}_${timestamp}.png`;
    const rawFilePath = path.join(UPLOADS_DIR, rawFileName);

    fs.writeFileSync(rawFilePath, buffer);

    let finalImageUrl = `/products/uploads/${rawFileName}`;

    // If background removal is requested, run local rembg pipeline
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
    # Convert RGBA
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
        // Fallback to raw uploaded image
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      message: "Image uploaded and processed successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
