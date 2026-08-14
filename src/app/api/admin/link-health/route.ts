import { NextResponse } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const REPORT_PATH = path.join(process.cwd(), 'src', 'lib', 'products', 'linkHealthReport.json');
const CATALOG_PATH = path.join(process.cwd(), 'src', 'lib', 'products', 'sheetProducts.json');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'run-audit') {
      const limit = searchParams.get('limit') || '106';
      const scriptPath = path.join(process.cwd(), 'scripts', 'link_health_checker.py');
      
      const { stdout, stderr } = await execPromise(`python "${scriptPath}" ${limit}`);
      
      let reportData = null;
      if (fs.existsSync(REPORT_PATH)) {
        reportData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
      }
      
      return NextResponse.json({
        success: true,
        output: stdout || stderr,
        report: reportData
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
