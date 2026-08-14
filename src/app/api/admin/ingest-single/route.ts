import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, brand, category, price, rawImageSrc } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: "Market or Reddit URL is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "ingest_single_piece.py");
    const payload = JSON.stringify({ url, title, brand, category, price, rawImageSrc });

    // Write temp payload
    const tempPayloadFile = path.join(process.cwd(), "scratch", `temp_ingest_${Date.now()}.json`);
    fs.mkdirSync(path.dirname(tempPayloadFile), { recursive: true });
    fs.writeFileSync(tempPayloadFile, payload, "utf-8");

    const cmd = `python "${scriptPath}" "${tempPayloadFile}"`;

    return new Promise((resolve) => {
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
          resolve(
            NextResponse.json({
              success: true,
              message: "Piece successfully ingested with AI cutout and Sugargoo affiliate link!",
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
