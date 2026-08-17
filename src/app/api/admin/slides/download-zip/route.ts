import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slideUrls: string[] = body.slideUrls || [];
    const packTitle: string = body.packTitle || "ArchiveFinds_Slides";

    if (!slideUrls.length) {
      return NextResponse.json({ success: false, error: "No slides provided to zip." }, { status: 400 });
    }

    const zip = new JSZip();

    slideUrls.forEach((slideRel, idx) => {
      const cleanRel = slideRel.replace(/^\/+/, "");
      const fullPath = path.join(process.cwd(), "public", cleanRel);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const fileData = fs.readFileSync(fullPath);
        const entryName = `Slide_${String(idx + 1).padStart(2, "0")}_${path.basename(fullPath)}`;
        zip.file(entryName, fileData);
      }
    });

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const sanitizedTitle = packTitle.replace(/[^a-zA-Z0-9_-]/g, "_");

    return new Response(zipBuffer as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${sanitizedTitle}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("ZIP Generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
