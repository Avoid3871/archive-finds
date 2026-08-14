import asyncio
from playwright.async_api import async_playwright
import urllib.parse

async def test_sugargoo_links():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        weidian_url = "https://weidian.com/item.html?itemID=7810589648"
        encoded = urllib.parse.quote(weidian_url, safe="")
        
        # Test Format 1: /products?productLink=...&memberId=...
        url1 = f"https://www.sugargoo.com/products?productLink={encoded}&memberId=1325437696506389977"
        print(f"Testing URL 1: {url1}")
        await page.goto(url1, timeout=30000)
        await page.wait_for_timeout(4000)
        title1 = await page.title()
        body1 = await page.inner_text("body")
        print(f"URL 1 Title: {title1}")
        print(f"URL 1 contains price/title?: {'Soap' in body1 or '¥' in body1 or 'Chrome' in body1 or 'product' in body1.lower()}")
        
        # Test Format 2: /#/home/productDetail?productUrl=...&memberId=...
        url2 = f"https://www.sugargoo.com/#/home/productDetail?productUrl={encoded}&memberId=1325437696506389977"
        print(f"\nTesting URL 2: {url2}")
        await page.goto(url2, timeout=30000)
        await page.wait_for_timeout(4000)
        title2 = await page.title()
        body2 = await page.inner_text("body")
        print(f"URL 2 Title: {title2}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_sugargoo_links())
