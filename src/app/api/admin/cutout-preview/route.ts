import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import util from "util";
import { logJobRecord } from "@/lib/admin/jobLogger";

const execFilePromise = util.promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const { imageSrc, rotation = 0, model = "isnet-general-use", cleanIslands = true } = await req.json();

    if (!imageSrc) {
      return NextResponse.json({ success: false, error: "imageSrc is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scratch", "run_cutout_preview.py");
    const outFilename = `_cutout_preview.png`;
    const outFullPath = path.join(process.cwd(), "public", "products", outFilename);

    // If imageSrc is a Base64 data URL (e.g. from File Upload or Clipboard Paste), write to temp input file
    let resolvedInput = imageSrc;
    let isTempFile = false;
    if (imageSrc.startsWith("data:image/")) {
      const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");
      const tempInputFilename = `temp_upload_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
      const tempInputPath = path.join(process.cwd(), "scratch", tempInputFilename);
      fs.writeFileSync(tempInputPath, Buffer.from(base64Data, "base64"));
      resolvedInput = tempInputPath;
      isTempFile = true;
    }

    const pythonCode = `
import sys
import os
import urllib.request
import io
import numpy as np
from PIL import Image
import rembg
from scipy import ndimage

image_src = sys.argv[1]
out_path = sys.argv[2]
rotation = int(sys.argv[3]) if len(sys.argv) > 3 else 0
model_name = sys.argv[4] if len(sys.argv) > 4 else "isnet-general-use"
do_clean_islands = sys.argv[5].lower() == "true" if len(sys.argv) > 5 else True

os.makedirs(os.path.dirname(out_path), exist_ok=True)

try:
    if image_src.startswith("http"):
        req = urllib.request.Request(
            image_src,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            input_bytes = resp.read()
    else:
        # Local file path (absolute or relative to public)
        if os.path.isabs(image_src):
            local_full = image_src
        else:
            local_full = os.path.join(r"${process.cwd().replace(/\\/g, '\\\\')}", "public", image_src.lstrip("/"))
        with open(local_full, "rb") as f:
            input_bytes = f.read()

    # Determine rembg session and parameters
    is_matte = (model_name == "isnet-matte")
    actual_model = "isnet-general-use" if (model_name == "isnet-matte" or model_name == "isnet-general-use") else model_name
    
    # Fallback to u2net if model name not recognized
    if actual_model not in ["isnet-general-use", "u2net", "silueta", "u2netp"]:
        actual_model = "isnet-general-use"

    session = rembg.new_session(actual_model)
    raw_img = Image.open(io.BytesIO(input_bytes)).convert("RGBA")

    if is_matte:
        output_image = rembg.remove(
            raw_img,
            session=session,
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=12
        )
    else:
        output_image = rembg.remove(raw_img, session=session)

    # Clean detached seller watermark islands / stray logos if requested
    if do_clean_islands:
        try:
            arr = np.array(output_image)
            alpha = arr[:, :, 3] > 25
            labeled, num_features = ndimage.label(alpha)
            if num_features > 1:
                sizes = ndimage.sum(alpha, labeled, range(1, num_features + 1))
                max_size = max(sizes) if len(sizes) > 0 else 0
                clean_alpha = np.zeros_like(alpha, dtype=bool)
                for idx, size in enumerate(sizes, 1):
                    # Keep pieces that are at least 10% of main garment size
                    if size >= 0.10 * max_size:
                        clean_alpha[labeled == idx] = True
                arr[~clean_alpha, 3] = 0
                output_image = Image.fromarray(arr)
        except Exception:
            pass

    # Bounding box crop & margin centering
    bbox = output_image.getbbox()
    if bbox:
        cropped = output_image.crop(bbox)
    else:
        cropped = output_image

    # Apply rotation if specified
    if rotation % 360 != 0:
        cropped = cropped.rotate((360 - rotation) % 360, expand=True)

    # Standardize to 1000x1000 transparent canvas with 60px studio margins
    target_size = (1000, 1000)
    margin = 60
    max_w = target_size[0] - 2 * margin
    max_h = target_size[1] - 2 * margin
    
    orig_w, orig_h = cropped.size
    ratio = min(max_w / max(1, orig_w), max_h / max(1, orig_h))
    new_w = max(1, int(orig_w * ratio))
    new_h = max(1, int(orig_h * ratio))
    
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    final_canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    offset_x = (target_size[0] - new_w) // 2
    offset_y = (target_size[1] - new_h) // 2
    final_canvas.paste(resized, (offset_x, offset_y), resized)

    final_canvas.save(out_path, "PNG", optimize=True)
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
`;

    fs.writeFileSync(scriptPath, pythonCode, "utf-8");

    const startTime = Date.now();
    try {
      await execFilePromise("python", [scriptPath, resolvedInput, outFullPath, String(rotation), model, String(cleanIslands)], {
        cwd: process.cwd(),
        timeout: 25000,
      });
    } finally {
      if (isTempFile && fs.existsSync(resolvedInput)) {
        try { fs.unlinkSync(resolvedInput); } catch (_) {}
      }
    }

    const localCutoutUrl = `/products/${outFilename}?t=${Date.now()}`;
    logJobRecord({
      type: "AI_BACKGROUND_REMOVAL",
      pieceName: (typeof imageSrc === "string" && imageSrc.startsWith("data:") ? "Custom Upload" : imageSrc.substring(imageSrc.lastIndexOf("/") + 1, imageSrc.lastIndexOf("/") + 40)) || "Preview Cutout",
      status: "SUCCESS",
      durationMs: Date.now() - startTime,
      details: `Generated studio cutout with model: ${model} (${outFilename})`,
    });

    return NextResponse.json({
      success: true,
      localCutoutUrl,
      rawImageSrc: imageSrc,
      modelUsed: model,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
