const https = require('https');

const sheetId = '1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10';
const gid = '1523005324';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkImages() {
  console.log("Deep scanning sheet for images...");
  
  // 1. Fetch gviz json
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
  const rawJson = await fetch(gvizUrl);
  const match = rawJson.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
  
  if (match) {
    const parsed = JSON.parse(match[1]);
    const rows = parsed.table.rows;
    console.log(`Total rows in gviz: ${rows.length}`);
    
    let foundImageUrls = [];
    rows.forEach((r, rowIdx) => {
      if (!r.c) return;
      r.c.forEach((cell, colIdx) => {
        if (!cell) return;
        const v = String(cell.v || '');
        const f = String(cell.f || '');
        if (v.includes('http') || v.includes('.jpg') || v.includes('.png') || v.includes('image') ||
            f.includes('http') || f.includes('.jpg') || f.includes('.png') || f.includes('IMAGE')) {
          foundImageUrls.push({ row: rowIdx + 1, col: colIdx, v, f });
        }
      });
    });
    
    console.log(`Found ${foundImageUrls.length} cell matches containing URL/Image keywords in gviz!`);
    foundImageUrls.slice(0, 10).forEach(m => console.log(m));
  }

  // 2. Fetch full published HTML and search for <img> and background-image
  const pubHtmlUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8/pubhtml`;
  const html = await fetch(pubHtmlUrl);
  
  const imgTags = [...html.matchAll(/<img[^>]+src="([^">]+)"/gi)].map(m => m[1]);
  console.log(`\nFound ${imgTags.length} <img> src tags in published HTML:`);
  imgTags.forEach(t => console.log('  ->', t));

  const bgImgs = [...html.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/gi)].map(m => m[1]);
  console.log(`\nFound ${bgImgs.length} background-image urls in published HTML:`);
  bgImgs.filter(u => !u.includes('.css') && !u.includes('google.com/static')).slice(0, 10).forEach(u => console.log('  ->', u));

  // 3. Search for any image links (jpg, png, webp, drive, googleusercontent) in raw HTML
  const allUrls = [...html.matchAll(/https?:\/\/[^"'\s<>]+/gi)].map(m => m[0]);
  const imageCandidates = allUrls.filter(u => 
    u.match(/\.(jpg|jpeg|png|webp|gif)/i) || 
    u.includes('googleusercontent.com') || 
    u.includes('drive.google.com') ||
    u.includes('alicdn.com') ||
    u.includes('imgur.com')
  );
  console.log(`\nTotal potential image candidate URLs in raw HTML: ${imageCandidates.length}`);
  imageCandidates.slice(0, 15).forEach(u => console.log('  Candidate:', u));
}

checkImages().catch(console.error);
