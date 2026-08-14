import asyncio
from playwright.async_api import async_playwright
import urllib.parse

async def search_images_playwright(query: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        # Search Google Images
        url = f"https://www.google.com/search?tbm=isch&q={urllib.parse.quote(query + ' flat lay garment')}"
        print(f"Opening: {url}")
        await page.goto(url, timeout=25000)
        await page.wait_for_timeout(2000)
        
        # Handle Google consent if present
        try:
            reject_all = await page.query_selector("button:has-text('Reject all'), button:has-text('Alle ablehnen'), button:has-text('Accept all')")
            if reject_all:
                await reject_all.click()
                await page.wait_for_timeout(1000)
        except Exception:
            pass
            
        imgs = await page.eval_on_selector_all(
            "div[data-ved] img[src^='http'], div[data-ved] img[src^='data:image']",
            "els => els.map(e => e.src).filter(s => s && s.length > 50)"
        )
        print(f"Found {len(imgs)} images on Google Images!")
        if imgs:
            print("First image sample:", imgs[0][:120])
            
        await browser.close()
        return imgs

if __name__ == "__main__":
    asyncio.run(search_images_playwright("Rick Owens Mountain Hoodie"))
