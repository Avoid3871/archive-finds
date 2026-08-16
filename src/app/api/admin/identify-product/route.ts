import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || `${body.brand || ''} ${body.title || ''}`.trim();

    if (!query) {
      return NextResponse.json({ error: 'Query or title is required' }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'product_identifier.py');
    const marketUrl = body.marketUrl || '';

    const result = await new Promise<any>((resolve) => {
      const args = [scriptPath, query];
      if (marketUrl) {
        args.push('--url', marketUrl);
      }
      const proc = spawn('python', args, {
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        try {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            resolve(parsed);
          } else {
            resolve({
              canonicalTitle: query,
              brand: 'Archive Collection',
              estimatedRetail: 650,
              studioImageUrl: '',
              season: '',
              stdout,
              stderr
            });
          }
        } catch (err) {
          resolve({
            canonicalTitle: query,
            brand: 'Archive Collection',
            estimatedRetail: 650,
            studioImageUrl: '',
            season: '',
            error: String(err)
          });
        }
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Identification failed' }, { status: 500 });
  }
}
