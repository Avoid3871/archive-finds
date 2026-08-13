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

async function run() {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
  const raw = await fetch(url);
  const match = raw.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
  if (!match) return console.log("No match");
  
  const parsed = JSON.parse(match[1]);
  const rows = parsed.table.rows;
  console.log(`Total rows in GID ${gid}:`, rows.length);
  
  let colCount = parsed.table.cols.length;
  console.log(`Col count:`, colCount);

  // Let's print every non-null cell with row index and column letter
  rows.forEach((r, rowIdx) => {
    if (!r.c) return;
    const cells = r.c.map((cell, colIdx) => {
      if (!cell || (cell.v === null && cell.f === null)) return null;
      return `Col ${colIdx} (${String.fromCharCode(65 + colIdx)}): ${JSON.stringify(cell)}`;
    }).filter(Boolean);
    if (cells.length > 0) {
      console.log(`\n[Row ${rowIdx + 1}]:\n  ${cells.join('\n  ')}`);
    }
  });
}

run().catch(console.error);
