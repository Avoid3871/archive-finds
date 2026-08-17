import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const REPORT_PATH = path.join(process.cwd(), 'src', 'lib', 'products', 'linkHealthReport.json');
const CATALOG_PATH = path.join(process.cwd(), 'src', 'lib', 'products', 'sheetProducts.json');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'run-audit') {
      const limit = searchParams.get('limit') || '150';
      const scriptPath = path.join(process.cwd(), 'scripts', 'link_health_checker.py');
      
      const child = spawn('python', ['-u', scriptPath, limit], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONIOENCODING: 'utf-8',
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

          child.stdout.on('data', (chunk) => {
            const text = chunk.toString('utf-8');
            const lines = text.split('\n');

            for (const line of lines) {
              if (!line.trim()) continue;

              if (line.includes('[AF_PROGRESS]')) {
                try {
                  const jsonStr = line.substring(line.indexOf('[AF_PROGRESS]') + 13).trim();
                  const progressData = JSON.parse(jsonStr);
                  safeEnqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'progress', data: progressData })}\n\n`)
                  );
                } catch (err) {
                  safeEnqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'log', text: line })}\n\n`)
                  );
                }
              } else if (line.includes('[AF_HEALTH_REPORT]')) {
                try {
                  const jsonStr = line.substring(line.indexOf('[AF_HEALTH_REPORT]') + 18).trim();
                  const reportData = JSON.parse(jsonStr);
                  safeEnqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'complete', report: reportData })}\n\n`)
                  );
                } catch (err) {
                  // Fallback
                }
              } else {
                safeEnqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'log', text: line })}\n\n`)
                );
              }
            }
          });

          child.stderr.on('data', (chunk) => {
            const text = chunk.toString('utf-8');
            safeEnqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'log', text: `[ERROR] ${text}` })}\n\n`)
            );
          });

          child.on('close', () => {
            let reportData = null;
            if (fs.existsSync(REPORT_PATH)) {
              try {
                reportData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
              } catch (e) {}
            }
            safeEnqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'complete', report: reportData })}\n\n`)
            );
            safeClose();
          });

          child.on('error', (err) => {
            safeEnqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
            );
            safeClose();
          });
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (fs.existsSync(REPORT_PATH)) {
      const data = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
      return NextResponse.json({ success: true, report: data });
    }

    return NextResponse.json({
      success: true,
      report: {
        lastAudit: 'Never',
        totalChecked: 0,
        healthy: 0,
        dead: 0,
        flagged: 0,
        items: []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, action, newUrl } = body; // action: 'approve' | 'delist' | 'update_url'

    if (!fs.existsSync(CATALOG_PATH)) {
      return NextResponse.json({ success: false, error: 'Catalog file not found' }, { status: 404 });
    }

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
    const index = catalog.findIndex((p: any) => String(p.id) === String(productId) || p.slug === productId);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Product not found in catalog' }, { status: 404 });
    }

    if (action === 'delist') {
      catalog[index].status = 'DELISTED';
      catalog[index].isDelisted = true;
    } else if (action === 'approve') {
      catalog[index].status = 'APPROVED';
      catalog[index].isDelisted = false;
    } else if (action === 'update_url' && newUrl) {
      const encoded = encodeURIComponent(newUrl);
      catalog[index].directStoreLink = newUrl;
      catalog[index].affiliateUrl = `https://www.sugargoo.com/products?productLink=${encoded}&memberId=1325437696506389977`;
      catalog[index].sugargooUrl = catalog[index].affiliateUrl;
      catalog[index].affiliateLink = catalog[index].affiliateUrl;
      catalog[index].status = 'APPROVED';
      catalog[index].isDelisted = false;
    }

    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');

    // Also update health report if exists
    if (fs.existsSync(REPORT_PATH)) {
      const healthData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
      const hIdx = healthData.items?.findIndex((item: any) => String(item.id) === String(productId) || item.slug === productId);
      if (hIdx !== undefined && hIdx !== -1) {
        healthData.items[hIdx].status = action === 'delist' ? 'DEAD' : 'HEALTHY';
        healthData.items[hIdx].message = action === 'delist' ? 'Manually delisted by admin' : 'Approved by admin';
        fs.writeFileSync(REPORT_PATH, JSON.stringify(healthData, null, 2), 'utf-8');
      }
    }

    return NextResponse.json({ success: true, product: catalog[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
