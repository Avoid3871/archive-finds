const https = require('https');
const fs = require('fs');

const sheetId = '1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10';
const gid = '1523005324';

function fetchToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchToBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), headers: res.headers }));
    }).on('error', reject);
  });
}

async function run() {
  console.log("1. Testing HTML view...");
  const htmlUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview?gid=${gid}`;
  const htmlRes = await fetchToBuffer(htmlUrl);
  console.log("HTML Status:", htmlRes.status);
  const htmlText = htmlRes.buffer.toString('utf8');
  fs.writeFileSync('scripts/sheet_dump.html', htmlText);
  console.log("Saved sheet_dump.html, length:", htmlText.length);

  // Search for links in html
  const hrefMatches = [...htmlText.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log(`Found ${hrefMatches.length} total href links in HTML view`);
  const productLinks = hrefMatches.filter(h => !h.includes('google.com') && !h.includes('accounts'));
  console.log(`Product / non-google links found: ${productLinks.length}`);
  console.log("Sample 10 links:", productLinks.slice(0, 10));

  // Search for images in html
  const imgMatches = [...htmlText.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
  console.log(`Found ${imgMatches.length} image src links in HTML view`);
}

run().catch(console.error);
