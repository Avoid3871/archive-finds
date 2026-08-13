const https = require('https');

const sheetId = '1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10';
const gid = '1523005324';

// 1. Fetch via gviz json
const gvizJsonUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function run() {
  console.log("Fetching gviz json...");
  const res = await fetch(gvizJsonUrl);
  console.log("Status:", res.status);
  
  // Clean google viz wrapper
  const text = res.data;
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
  if (!match) {
    console.log("Could not parse gviz response wrapper. Raw snippet:\n", text.slice(0, 500));
    return;
  }
  
  const parsed = JSON.parse(match[1]);
  const table = parsed.table;
  console.log("Columns:", table.cols.map(c => c ? c.label || c.id : null));
  console.log("Total rows:", table.rows.length);
  
  console.log("\n--- FIRST 10 ROWS SAMPLE ---");
  table.rows.slice(0, 10).forEach((row, i) => {
    const formatted = (row.c || []).map(cell => {
      if (!cell) return null;
      return {
        v: cell.v,
        f: cell.f, // formatted value / formula / hyperlink
      };
    });
    console.log(`Row ${i}:`, JSON.stringify(formatted));
  });
}

run().catch(console.error);
