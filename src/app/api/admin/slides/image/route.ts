import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packId = searchParams.get("packId") || "";
    const fileName = searchParams.get("file") || searchParams.get("fileName") || "";

    if (!packId || !fileName) {
      return new NextResponse("Missing packId or fileName", { status: 400 });
    }

    const safePackId = path.basename(packId);
    const safeFileName = path.basename(fileName);

    const possiblePaths = [
      path.join(os.tmpdir(), "slides", "generated", safePackId, safeFileName),
      path.join(process.cwd(), "public", "slides", "generated", safePackId, safeFileName),
      path.join("/tmp", "slides", "generated", safePackId, safeFileName),
    ];

    let foundPath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      return new NextResponse("Slide image not found", { status: 404 });
    }

    const imageBuffer = fs.readFileSync(foundPath);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving slide image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
