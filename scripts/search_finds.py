import asyncio
from playwright.async_api import async_playwright
import re
import json

async def search_finds():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        # Search r/QualityReps specifically for finds and weidian/taobao links
        url = "https://www.reddit.com/r/QualityReps/search/?q=flair%3AFIND+OR+weidian+OR+taobao&sort=new"
        print(f"Searching: {url}")
        await page.goto(url, timeout=30000)
        await page.wait_for_timeout(3000)
        
        post_links = await page.eval_on_selector_all(
            "a[href*='/r/QualityReps/comments/']",
            "links => Array.from(new Set(links.map(a => a.href))).filter(h => !h.includes('/comment/'))"
        )
        
        print(f"Found {len(post_links)} search result posts:\n")
        for l in post_links[:10]:
            print(" -", l)
            
        # Inspect top 3 search results
        for post_url in post_links[:4]:
            print(f"\n============================\nInspecting: {post_url}")
            p_page = await context.new_page()
            try:
                await p_page.goto(post_url, timeout=25000)
                await p_page.wait_for_timeout(2000)
                
                title = await (await p_page.query_selector("h1")).inner_text()
                body = await p_page.inner_text("body")
                
                # Check links
                hrefs = await p_page.eval_on_selector_all("a", "els => els.map(e => e.href)")
                
                print(f"Title: {title}")
                # Search for Taobao / Weidian / 1688 / Yupoo / Imgur / Sugargoo
                for h in set(hrefs):
                    if any(k in h.lower() for k in ['taobao', 'weidian', '1688', 'yupoo', 'sugargoo', 'mulebuy', 'citer', 'item']):
                        print(f"  [Link]: {h}")
                        
                # Search body text for regex matches (including text-based links)
                body_links = re.findall(r'(?:https?://[^\s"<>]+|(?:item|detail|weidian|yupoo)[^\s"<>]+)', body)
                for bl in body_links:
                    if any(k in bl.lower() for k in ['taobao', 'weidian', '1688', 'yupoo']):
                        print(f"  [Body Raw Link]: {bl}")
                        
            except Exception as e:
                print(f"Error: {e}")
            finally:
                await p_page.close()
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(search_finds())
