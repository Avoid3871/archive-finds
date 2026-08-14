const https = require('https');

async function testOldReddit() {
  const urls = [
    'https://old.reddit.com/r/QualityReps/new.json?limit=10',
    'https://www.reddit.com/r/QualityReps/new.rss',
    'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.reddit.com/r/QualityReps/new.json')
  ];

  for (const url of urls) {
    try {
      console.log('Testing URL:', url);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      console.log('Status:', res.status, res.statusText);
      if (res.ok) {
        const text = await res.text();
        console.log('Success! Sample output (first 200 chars):', text.slice(0, 200));
        break;
      }
    } catch (e) {
      console.log('Failed:', e.message);
    }
  }
}

testOldReddit();
