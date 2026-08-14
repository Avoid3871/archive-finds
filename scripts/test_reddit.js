async function testReddit() {
  try {
    const res = await fetch("https://www.reddit.com/r/QualityReps/hot.json?limit=15", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ArchiveFinds/1.0"
      }
    });
    if (!res.ok) {
      console.error("HTTP error:", res.status, res.statusText);
      return;
    }
    const json = await res.json();
    const posts = json.data.children;
    console.log(`Fetched ${posts.length} posts from r/QualityReps!`);
    for (const post of posts.slice(0, 8)) {
      const d = post.data;
      console.log(`\n========================================`);
      console.log(`TITLE: ${d.title}`);
      console.log(`FLAIR: ${d.link_flair_text}`);
      console.log(`AUTHOR: ${d.author}`);
      console.log(`URL: ${d.url}`);
      console.log(`IS_GALLERY: ${d.is_gallery}`);
      if (d.gallery_data) {
        console.log(`GALLERY ITEMS: ${d.gallery_data.items.length}`);
      }
      console.log(`SELFTEXT: ${d.selftext ? d.selftext.slice(0, 150) + "..." : "[NO TEXT]"}`);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testReddit();
