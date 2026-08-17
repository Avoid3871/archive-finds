import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, brand, category, season, price, estimatedRetail, rawImageSrc, localImage, imageUrl, rotation } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: "Market or Reddit URL is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "ingest_single_piece.py");
    const payload = JSON.stringify({
      url,
      title,
      brand,
      category,
      season: season || "",
      price,
      estimatedRetail: estimatedRetail || 0,
      rawImageSrc,
      localImage: localImage || imageUrl,
      rotation: rotation || 0,
    });

    // Write temp payload
    const tempPayloadFile = path.join(process.cwd(), "scratch", `temp_ingest_${Date.now()}.json`);
    fs.mkdirSync(path.dirname(tempPayloadFile), { recursive: true });
    fs.writeFileSync(tempPayloadFile, payload, "utf-8");

    const cmd = `python "${scriptPath}" "${tempPayloadFile}"`;

    return new Promise<NextResponse>((resolve) => {
      exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
        try {
          if (fs.existsSync(tempPayloadFile)) {
            fs.unlinkSync(tempPayloadFile);
          }
        } catch (e) {}

        if (error) {
          resolve(
            NextResponse.json({
              success: false,
              error: stderr || error.message,
              stdout,
            })
          );
        } else {
          let parsedResult: any = null;
          if (stdout) {
            const lines = stdout.trim().split("\n");
            for (let i = lines.length - 1; i >= 0; i--) {
              try {
                const obj = JSON.parse(lines[i].trim());
                if (obj && obj.slug) {
                  parsedResult = obj;
                  break;
                }
              } catch (e) {}
            }
          }

          // Trigger fast background auto-sync to GitHub so live website reflects new piece immediately
          try {
            const pieceTitle = parsedResult?.title || title;
            const gitCmd = `git add -A && git commit -m "Auto-Deploy: Ingested ${pieceTitle.replace(/"/g, '')}" && git push origin main`;
            exec(gitCmd, { cwd: process.cwd() }, (gitErr) => {
              if (gitErr) {
                console.warn("[AUTO-SYNC] Notice:", gitErr.message);
              } else {
                console.log(`[AUTO-SYNC] Successfully pushed "${pieceTitle}" to live GitHub/Vercel.`);
              }
            });
          } catch (e) {}

          resolve(
            NextResponse.json({
              success: true,
              slug: parsedResult?.slug || "",
              id: parsedResult?.id || "",
              title: parsedResult?.title || title,
              imageUrl: parsedResult?.imageUrl || localImage || imageUrl,
              message: "Piece successfully ingested with AI cutout and Sugargoo affiliate link! (Live sync started in background)",
              stdout,
            })
          );
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
