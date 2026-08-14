import asyncio
from playwright.async_api import async_playwright
import re
import json

async def test_post():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        url = "https://www.reddit.com/r/QualityReps/comments/1vocnvf/blassic_haul/"
        print(f"Opening post: {url}")
        await page.goto(url, timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Get title
        title_el = await page.query_selector("h1")
        title = await title_el.inner_text() if title_el else "No Title"
        print(f"Post Title: {title}")
        
        # Get images
        images = await page.eval_on_selector_all(
            "img[src*='preview.redd.it'], img[src*='i.redd.it'], shreddit-media-lightbox img",
            "imgs => imgs.map(i => i.src)"
        )
        print(f"Found {len(images)} images: {images[:3]}")
        
        # Get all text from body & comments
        body_text = await page.inner_text("body")
        
        # Search for Taobao / Weidian / 1688 / Yupoo links
        patterns = [
            r"https?://[^\s\"'<>]+(?:taobao|weidian|1688|yupoo|tmall)[^\s\"'<>]*",
            r"(?:item\.taobao\.com|weidian\.com|detail\.1688\.com|tmall\.com)[^\s\"'<>]*",
            r"https?://[^\s\"'<>]+sugargoo[^\s\"'<>]*",
            r"https?://[^\s\"'<>]+mulebuy[^\s\"'<>]*",
            r"https?://[^\s\"'<>]+cssbuy[^\s\"'<>]*",
            r"https?://[^\s\"'<>]+pandabuy[^\s\"'<>]*",
            r"https?://[^\s\"'<>]+superbuy[^\s\"'<>]*",
            r"https?://[^\s\"'<>]+allchinabuy[^\s\"'<>]*",
        ]
        
        found_links = set()
        for pat in patterns:
            matches = re.findall(pat, body_text, re.IGNORECASE)
            for m in matches:
                found_links.add(m)
                
        print(f"\nFound {len(found_links)} potential product/agent links in post:")
        for l in found_links:
            print(" -", l)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_post())
