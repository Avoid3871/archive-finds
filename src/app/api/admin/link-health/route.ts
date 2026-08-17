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
    const { productId, action, newUrl } = body; // action: 'approve' | 'delist' | 'delete' | 'update_url'

    if (!fs.existsSync(CATALOG_PATH)) {
      return NextResponse.json({ success: false, error: 'Catalog file not found' }, { status: 404 });
    }

    let catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
    const index = catalog.findIndex((p: any) => String(p.id) === String(productId) || p.slug === productId);

    if (index === -1 && action !== 'delete') {
      return NextResponse.json({ success: false, error: 'Product not found in catalog' }, { status: 404 });
    }

    let targetTitle = catalog[index]?.title || catalog[index]?.name || `Piece #${productId}`;

    if (action === 'delete') {
      catalog = catalog.filter((p: any) => String(p.id) !== String(productId) && p.slug !== productId);
      // Re-index remaining products
      catalog.forEach((p: any, idx: number) => {
        p.id = String(idx + 1);
      });
    } else if (action === 'delist') {
      // Complete removal from public store catalog
      catalog = catalog.filter((p: any) => String(p.id) !== String(productId) && p.slug !== productId);
      catalog.forEach((p: any, idx: number) => {
        p.id = String(idx + 1);
      });
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

    // Update and recalculate health report
    let updatedReport = null;
    if (fs.existsSync(REPORT_PATH)) {
      const healthData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
      
      if (action === 'delete' || action === 'delist') {
        healthData.items = (healthData.items || []).filter(
          (item: any) => String(item.id) !== String(productId) && item.slug !== productId
        );
      } else {
        const hIdx = healthData.items?.findIndex((item: any) => String(item.id) === String(productId) || item.slug === productId);
        if (hIdx !== undefined && hIdx !== -1) {
          healthData.items[hIdx].status = 'HEALTHY';
          healthData.items[hIdx].message = 'Approved & verified by admin';
          if (newUrl) {
            healthData.items[hIdx].directLink = newUrl;
            healthData.items[hIdx].directStoreLink = newUrl;
            healthData.items[hIdx].affiliateUrl = `https://www.sugargoo.com/products?productLink=${encodeURIComponent(newUrl)}&memberId=1325437696506389977`;
          }
        }
      }

      // Recalculate summary counts
      healthData.totalChecked = healthData.items.length;
      healthData.healthyCount = healthData.items.filter((it: any) => it.status === 'HEALTHY').length;
      healthData.deadCount = healthData.items.filter((it: any) => it.status === 'DEAD').length;
      healthData.flaggedCount = healthData.items.filter((it: any) => it.status === 'FLAGGED').length;

      fs.writeFileSync(REPORT_PATH, JSON.stringify(healthData, null, 2), 'utf-8');
      updatedReport = healthData;
    }

    // Trigger fast background auto-sync to GitHub so live website updates immediately
    try {
      const gitCmd = `git add -A && git commit -m "Auto-Deploy: ${action === 'delete' || action === 'delist' ? 'Deleted dead piece' : 'Updated URL/status for'} ${targetTitle.replace(/"/g, '')}" && git push origin main`;
      const { exec } = require('child_process');
      exec(gitCmd, { cwd: process.cwd() }, (gitErr: any) => {
        if (!gitErr) {
          console.log(`[AUTO-SYNC] Successfully pushed dead link moderation update to live server.`);
        }
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      action,
      productId,
      report: updatedReport,
      catalogCount: catalog.length,
      message: action === 'delete' || action === 'delist' ? `Piece ${targetTitle} deleted from store catalog.` : `Piece ${targetTitle} updated.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

