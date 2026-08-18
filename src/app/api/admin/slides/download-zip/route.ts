import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
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

    for (let idx = 0; idx < slideUrls.length; idx++) {
      const slideUrl = slideUrls[idx];
      let fileData: Buffer | null = null;
      let entryFileName = `Slide_${String(idx + 1).padStart(2, "0")}.jpg`;

      // 1. Check if URL contains /api/admin/slides/image/[packId]/[fileName]
      const apiMatch = slideUrl.match(/\/api\/admin\/slides\/image\/([^/?#]+)\/([^/?#]+)/);
      if (apiMatch) {
        const packId = apiMatch[1];
        const fileName = apiMatch[2];
        entryFileName = `Slide_${String(idx + 1).padStart(2, "0")}_${fileName}`;
        const possiblePaths = [
          path.join(os.tmpdir(), "slides", "generated", packId, fileName),
          path.join(process.cwd(), "public", "slides", "generated", packId, fileName),
          path.join("/tmp", "slides", "generated", packId, fileName),
        ];
        for (const p of possiblePaths) {
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            fileData = fs.readFileSync(p);
            break;
          }
        }
      }

      // 2. Check local public file system
      if (!fileData) {
        const cleanRel = slideUrl.replace(/^\/+/, "");
        const localPath = path.join(process.cwd(), "public", cleanRel);
        if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
          fileData = fs.readFileSync(localPath);
          entryFileName = `Slide_${String(idx + 1).padStart(2, "0")}_${path.basename(localPath)}`;
        }
      }

      // 3. Check os.tmpdir()
      if (!fileData) {
        const cleanRel = slideUrl.replace(/^\/+/, "");
        const tmpPath = path.join(os.tmpdir(), cleanRel);
        if (fs.existsSync(tmpPath) && fs.statSync(tmpPath).isFile()) {
          fileData = fs.readFileSync(tmpPath);
          entryFileName = `Slide_${String(idx + 1).padStart(2, "0")}_${path.basename(tmpPath)}`;
        }
      }

      // 4. Remote HTTP fetch fallback if available
      if (!fileData && (slideUrl.startsWith("http://") || slideUrl.startsWith("https://"))) {
        try {
          const res = await fetch(slideUrl);
          if (res.ok) {
            const arr = await res.arrayBuffer();
            fileData = Buffer.from(arr);
          }
        } catch (e) {
          console.warn("Failed to fetch slide for zip:", slideUrl, e);
        }
      }

      if (fileData) {
        zip.file(entryFileName, fileData);
      }
    }

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
