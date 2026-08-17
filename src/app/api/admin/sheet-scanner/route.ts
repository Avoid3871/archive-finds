import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const DISCOVERED_PATH = path.join(process.cwd(), "scratch", "discovered_sheet_finds.json");
const REGISTRY_PATH = path.join(process.cwd(), "scratch", "sheet_ingestion_registry.json");

export async function GET(req: NextRequest) {
  try {
    let items: any[] = [];
    if (fs.existsSync(DISCOVERED_PATH)) {
      try {
        items = JSON.parse(fs.readFileSync(DISCOVERED_PATH, "utf-8"));
      } catch (e) {}
    }

    let registry: any = { processed_links: {}, blacklisted_links: [] };
    if (fs.existsSync(REGISTRY_PATH)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
      } catch (e) {}
    }

    const deadCount = Object.values(registry.processed_links || {}).filter((v: any) => v.status === "DEAD").length;
    const ingestedCount = Object.values(registry.processed_links || {}).filter((v: any) => v.status === "INGESTED").length;
    const skippedCount = Object.values(registry.processed_links || {}).filter((v: any) => v.status === "SKIPPED").length;

    return NextResponse.json({
      success: true,
      items,
      stats: {
        queueCount: items.length,
        deadCount,
        ingestedCount,
        skippedCount,
        totalRegistry: Object.keys(registry.processed_links || {}).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const rawMarketUrl = searchParams.get("rawMarketUrl") || "";
    const slug = searchParams.get("slug") || "";
    const title = searchParams.get("title") || "";
    const action = searchParams.get("action") || "dismiss"; // dismiss | blacklist | ingested

    const normalizeUrl = (u: string) => {
      if (!u) return "";
      // IMPORTANT: Preserve query params — stripping them causes all weidian/taobao
      // items to normalize to the same base path, triggering mass deletion.
      return u
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
    };

    const targetUrlNorm = rawMarketUrl ? normalizeUrl(rawMarketUrl) : "";

    // 1. Update registry
    let registry: any = { processed_links: {}, blacklisted_links: [] };
    if (fs.existsSync(REGISTRY_PATH)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
      } catch (e) {}
    }

    if (rawMarketUrl) {
      const urlLower = rawMarketUrl.toLowerCase().trim();
      const status = action === "ingested" ? "INGESTED" : action === "blacklist" ? "DEAD" : "SKIPPED";
      const reason = action === "ingested" 
        ? "Ingested into Live Store Catalog" 
        : action === "blacklist" 
        ? "Manually Blacklisted by Admin" 
        : "Dismissed from Queue";

      registry.processed_links[urlLower] = {
        status,
        reason,
        timestamp: new Date().toISOString(),
      };
      if (action === "blacklist" && !registry.blacklisted_links.includes(urlLower)) {
        registry.blacklisted_links.push(urlLower);
      }
      fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
    }

    // 2. Remove ONLY the single targeted item from discovered queue.
    //    Strategy: Use `id` as unique primary key. Only fall back to URL match
    //    if no `id` was provided, and only if the URL is non-empty.
    let items: any[] = [];
    if (fs.existsSync(DISCOVERED_PATH)) {
      try {
        items = JSON.parse(fs.readFileSync(DISCOVERED_PATH, "utf-8"));
        const beforeCount = items.length;

        if (id) {
          // Primary: strict ID match (removes exactly 1 item)
          items = items.filter((it: any) => it.id !== id);
        } else if (targetUrlNorm) {
          // Fallback: exact full-URL match (only if id was not provided)
          items = items.filter((it: any) => {
            const itUrlNorm = normalizeUrl(it.rawMarketUrl || it.directStoreLink || "");
            return !itUrlNorm || itUrlNorm !== targetUrlNorm;
          });
        }

        const removed = beforeCount - items.length;
        if (removed > 1) {
          console.warn(`[sheet-scanner DELETE] WARNING: Removed ${removed} items (expected 1). id=${id}, url=${rawMarketUrl}`);
        }

        fs.writeFileSync(DISCOVERED_PATH, JSON.stringify(items, null, 2), "utf-8");
      } catch (e) {}
    }

    return NextResponse.json({ success: true, items, count: items.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sheetUrl = body.sheetUrl || "https://docs.google.com/spreadsheets/d/1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI/";
    const limit = body.limit || 20;
    const tabs = body.tabs || []; // array of tab names
    const validateLinks = body.validateLinks !== false;

    const scriptPath = path.join(process.cwd(), "scripts", "google_sheet_extractor.py");
    const args = ["-u", scriptPath, sheetUrl, `--limit=${limit}`];

    if (!validateLinks) {
      args.push("--no-validate");
    }

    if (tabs.length > 0) {
      args.push("--tabs", ...tabs);
    }

    const child = spawn("python", args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "utf-8",
      },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;
        const safeEnqueue = (data: Uint8Array) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch (e) {
              isClosed = true;
            }
          }
        };

        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch (e) {}
          }
        };

        child.stdout.on("data", (chunk) => {
          const text = chunk.toString("utf-8");
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.includes("[AF_SHEET_PROGRESS]")) {
              try {
                const jsonStr = line.substring(line.indexOf("[AF_SHEET_PROGRESS]") + 19).trim();
                const progressData = JSON.parse(jsonStr);
                safeEnqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "progress", data: progressData })}\n\n`)
                );
              } catch (err) {
                safeEnqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "log", text: line })}\n\n`)
                );
              }
            } else if (line.includes("[AF_SHEET_RESULT]")) {
              try {
                const jsonStr = line.substring(line.indexOf("[AF_SHEET_RESULT]") + 17).trim();
                const resultData = JSON.parse(jsonStr);
                safeEnqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "complete", result: resultData })}\n\n`)
                );
              } catch (err) {
                // Fallback
              }
            } else {
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "log", text: line })}\n\n`)
              );
            }
          }
        });

        child.stderr.on("data", (chunk) => {
          const text = chunk.toString("utf-8");
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "log", text: `[ERROR] ${text}` })}\n\n`)
          );
        });

        child.on("close", () => {
          safeClose();
        });

        child.on("error", (err) => {
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "log", text: `[FATAL] ${err.message}` })}\n\n`)
          );
          safeClose();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
