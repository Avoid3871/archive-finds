import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import util from "util";

const execFilePromise = util.promisify(execFile);
const UPLOADS_DIR = path.join(process.cwd(), "public", "products", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

function getApiKey(providedKey?: string): string {
  if (providedKey && providedKey.trim().length > 5) {
    // If user provided a new key, save to .env.local for persistence
    try {
      let content = "";
      if (fs.existsSync(ENV_LOCAL_PATH)) {
        content = fs.readFileSync(ENV_LOCAL_PATH, "utf-8");
      }
      if (content.includes("GEMINI_API_KEY=")) {
        content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY="${providedKey.trim()}"`);
      } else {
        content += `\nGEMINI_API_KEY="${providedKey.trim()}"\n`;
      }
      fs.writeFileSync(ENV_LOCAL_PATH, content, "utf-8");
    } catch (e) {
      console.warn("Could not write to .env.local:", e);
    }
    return providedKey.trim();
  }

  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      brand,
      category,
      imageSrc,
      apiKey: customApiKey,
      autoCutout = true,
    } = body;

    const apiKey = getApiKey(customApiKey);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          needsApiKey: true,
          error: "Google Gemini API Key is required. Please provide your API key.",
        },
        { status: 400 }
      );
    }

    if (!title && !brand) {
      return NextResponse.json(
        { success: false, error: "Product title or brand is required for AI generation" },
        { status: 400 }
      );
    }

    const pieceLabel = `${brand ? brand + " " : ""}${title || "Garment"}`;
    const garmentCategory = category || "Luxury Fashion Garment";

    // Optimized High-Fashion Editorial Prompt
    const prompt = `Professional high-end luxury fashion archive studio photograph of ${pieceLabel} (${garmentCategory}). Authentic top-down flat-lay product shot, clean editorial studio lighting, perfectly isolated garment centered in frame, crisp embroidery and authentic graphic details preserved, neutral minimalist dark studio aesthetic, 8k resolution, photorealistic fashion archive catalogue.`;

    // 1. Call Google Imagen 3 API (Imagen 3.0 Model)
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const payload = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        outputMimeType: "image/png",
      },
    };

    const res = await fetch(imagenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.predictions || data.predictions.length === 0) {
      const errMsg =
        data.error?.message ||
        data.error ||
        "Google Imagen API failed to generate image. Verify your Gemini API Key.";
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }

    // Extract Base64 Image
    const base64Bytes = data.predictions[0].bytesBase64Encoded;
    if (!base64Bytes) {
      return NextResponse.json(
        { success: false, error: "No image bytes returned from Google Imagen" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(base64Bytes, "base64");
    const timestamp = Date.now();
    const safeBaseName = (title || brand || "ai_piece")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 35);

    const rawFileName = `ai_raw_${safeBaseName}_${timestamp}.png`;
    const rawFilePath = path.join(UPLOADS_DIR, rawFileName);

    fs.writeFileSync(rawFilePath, buffer);
    const rawPublicUrl = `/products/uploads/${rawFileName}`;
    let finalImageUrl = rawPublicUrl;

    // 2. Local rembg background removal if requested
    if (autoCutout) {
      const cutoutFileName = `ai_cutout_${safeBaseName}_${timestamp}.png`;
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
      const scriptPath = path.join(process.cwd(), "scratch", "ai_cutout_runner.py");
      try {
        fs.mkdirSync(path.join(process.cwd(), "scratch"), { recursive: true });
        fs.writeFileSync(scriptPath, pythonScript, "utf-8");
        await execFilePromise("python", [scriptPath, rawFilePath, cutoutFilePath]);

        if (fs.existsSync(cutoutFilePath)) {
          finalImageUrl = `/products/uploads/${cutoutFileName}`;
        }
      } catch (rembgError) {
        console.warn("Rembg cutout on AI image failed, falling back to raw:", rembgError);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      rawUrl: rawPublicUrl,
      isCutout: finalImageUrl !== rawPublicUrl,
      promptUsed: prompt,
      message: `✨ Studio Flat-Lay for "${pieceLabel}" successfully generated with Gemini Imagen!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI studio image" },
      { status: 500 }
    );
  }
}
