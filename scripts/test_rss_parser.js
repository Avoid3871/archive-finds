async function parseRss() {
  const url = 'https://www.reddit.com/r/QualityReps/new.rss';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const xml = await res.text();
  console.log("Total XML length:", xml.length);

  // Simple regex parser for RSS/Atom entries
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  let count = 0;

  while ((match = entryRegex.exec(xml)) !== null && count < 6) {
    count++;
    const entry = match[1];
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = entry.match(/<link href="([^"]+)"/);
    const contentMatch = entry.match(/<content type="html">([\s\S]*?)<\/content>/);
    const authorMatch = entry.match(/<name>([^<]+)<\/name>/);

    const title = titleMatch ? titleMatch[1] : 'No title';
    const link = linkMatch ? linkMatch[1] : '';
    const author = authorMatch ? authorMatch[1] : '';
    const content = contentMatch ? contentMatch[1] : '';

    console.log(`\n================ ENTRY #${count} ================`);
    console.log(`TITLE: ${title}`);
    console.log(`AUTHOR: ${author}`);
    console.log(`REDDIT LINK: ${link}`);
    console.log(`CONTENT SNIPPET: ${content.slice(0, 300)}...`);
  }
}

parseRss();
