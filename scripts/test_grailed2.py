import asyncio
from playwright.async_api import async_playwright
import urllib.parse

async def search_grailed_image(query: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        url = f"https://www.grailed.com/shop?query={urllib.parse.quote(query)}"
        await page.goto(url, timeout=25000)
        await page.wait_for_timeout(3000)
        
        imgs = await page.eval_on_selector_all(
            "div[class*='feed-item'] img, div[class*='listing'] img, img[alt]",
            "els => Array.from(new Set(els.map(e => e.src))).filter(s => s.includes('listing') || s.includes('photos') || s.includes('media-assets.grailed.com/prd/listing'))"
        )
        print(f"Filtered {len(imgs)} Grailed listing images:")
        for im in imgs[:5]:
            print(" ->", im)
            
        await browser.close()
        return imgs[0] if imgs else ""

if __name__ == "__main__":
    asyncio.run(search_grailed_image("Rick Owens Mountain Hoodie"))
