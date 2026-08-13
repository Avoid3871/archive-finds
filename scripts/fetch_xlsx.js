const https = require('https');
const fs = require('fs');

const sheetId = '1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      console.log("FETCH:", url.slice(0, 80), "STATUS:", res.statusCode);
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), headers: res.headers }));
    }).on('error', reject);
  });
}

async function run() {
  const xlsxUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const res = await fetchUrl(xlsxUrl);
  console.log("XLSX final status:", res.status, "content-type:", res.headers['content-type'], "size:", res.buffer.length);
  fs.writeFileSync('scripts/sheet.xlsx', res.buffer);
}

run().catch(console.error);
