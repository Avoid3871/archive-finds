const https = require('https');

const sheetId = '1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function discoverTabs() {
  console.log("Discovering tabs in spreadsheet...");
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/pubhtml`;
  const html = await fetch(url);
  
  // Look for tab names / sheet switcher in pubhtml
  const tabMatches = [...html.matchAll(/<li[^>]*id="sheet-button-([0-9]+)"[^>]*><a[^>]*>(.*?)<\/a>/gi)];
  console.log(`Found ${tabMatches.length} tabs via sheet buttons:`);
  tabMatches.forEach(m => {
    console.log(`  Tab GID: ${m[1]}, Name: ${m[2]}`);
  });

  // Also look for any gid occurrences
  const allGids = [...new Set([...html.matchAll(/gid=([0-9]+)/gi)].map(m => m[1]))];
  console.log("All GIDs referenced in HTML:", allGids);

  // Check the default tab (gid=0 or first gid)
  for (const gid of allGids) {
    console.log(`\nTesting GID ${gid}...`);
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
    const raw = await fetch(gvizUrl);
    const match = raw.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
    if (match) {
      const parsed = JSON.parse(match[1]);
      console.log(`  GID ${gid} Table rows:`, parsed.table.rows.length, "cols:", parsed.table.cols.length);
      // Check first 3 rows
      parsed.table.rows.slice(0, 3).forEach((r, idx) => {
        const nonNull = (r.c || []).filter(c => c && c.v);
        console.log(`    Row ${idx}:`, nonNull.map(c => c.v).join(' | '));
      });
    }
  }
}

discoverTabs().catch(console.error);
