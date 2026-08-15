import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
  try {
    const scratchPath = path.join(process.cwd(), "scratch", "discovered_qualityreps_finds.json");
    if (fs.existsSync(scratchPath)) {
      const data = JSON.parse(fs.readFileSync(scratchPath, "utf-8"));
      return NextResponse.json({ success: true, items: data });
    }
    return NextResponse.json({ success: true, items: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const rawMarketUrl = searchParams.get("rawMarketUrl");
    const redditPostUrl = searchParams.get("redditPostUrl");

    // 1. Update scratch/reddit_scanner_history.json
    const historyPath = path.join(process.cwd(), "scratch", "reddit_scanner_history.json");
    let history: { scanned_reddit_posts: string[]; blacklisted_links: string[]; blacklisted_titles: string[] } = {
      scanned_reddit_posts: [],
      blacklisted_links: [],
      blacklisted_titles: [],
    };
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
      } catch (e) {}
    }
    if (redditPostUrl && !history.scanned_reddit_posts.includes(redditPostUrl)) {
      history.scanned_reddit_posts.push(redditPostUrl);
    }
    if (rawMarketUrl && !history.blacklisted_links.includes(rawMarketUrl.toLowerCase())) {
      history.blacklisted_links.push(rawMarketUrl.toLowerCase());
    }
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf-8");

    // 2. Remove from scratch/discovered_qualityreps_finds.json
    const scratchPath = path.join(process.cwd(), "scratch", "discovered_qualityreps_finds.json");
    let items: any[] = [];
    if (fs.existsSync(scratchPath)) {
      try {
        items = JSON.parse(fs.readFileSync(scratchPath, "utf-8"));
        items = items.filter((it: any) => it.slug !== slug);
        fs.writeFileSync(scratchPath, JSON.stringify(items, null, 2), "utf-8");
      } catch (e) {}
    }

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10;
    const autoAdd = body.autoAdd;

    const scriptPath = path.join(process.cwd(), "scripts", "reddit_qualityreps_scanner.py");
    const args = ["-u", scriptPath, `--limit=${limit}`];
    if (autoAdd) {
      args.push("--auto");
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
        // Handle stdout
        child.stdout.on("data", (chunk) => {
          const rawText = chunk.toString("utf-8");
          const lines = rawText.split(/\r?\n/);
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            // Check for progress event
            if (line.includes("[AF_PROGRESS]")) {
              try {
                const jsonStr = line.substring(line.indexOf("[AF_PROGRESS]") + 13).trim();
                const progressData = JSON.parse(jsonStr);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "progress", data: progressData })}\n\n`)
                );
              } catch (err) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "log", text: line })}\n\n`)
                );
              }
            } else {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "log", text: line })}\n\n`)
              );
            }
          }
        });

        // Handle stderr
        child.stderr.on("data", (chunk) => {
          const text = chunk.toString("utf-8");
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "stderr", text })}\n\n`)
          );
        });

        // Handle process completion
        child.on("close", (code) => {
          const scratchPath = path.join(process.cwd(), "scratch", "discovered_qualityreps_finds.json");
          let items = [];
          if (fs.existsSync(scratchPath)) {
            try {
              items = JSON.parse(fs.readFileSync(scratchPath, "utf-8"));
            } catch (e) {}
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                code,
                success: code === 0,
                message: code === 0 ? `Scan complete! Discovered ${items.length} pieces.` : `Scan exited with code ${code}`,
                items,
              })}\n\n`
            )
          );
          controller.close();
        });

        // Handle error
        child.on("error", (err) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: err.message,
              })}\n\n`
            )
          );
          controller.close();
        });
      },
      cancel() {
        try {
          child.kill();
        } catch (e) {}
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
