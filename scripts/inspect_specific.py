import asyncio
from playwright.async_api import async_playwright
import json

async def inspect_specific_post():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        url = "https://www.reddit.com/r/QualityReps/comments/1vocd6n/last_haul_for_awhile_im_lying/"
        await page.goto(url, timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Extract post text & comments
        text = await page.inner_text("body")
        print("--- POST 7 FULL BODY TEXT ---")
        print(text[:2500])
        
        # Check gallery captions
        captions = await page.eval_on_selector_all(
            "li, div, p, span, a",
            "els => els.map(e => e.innerText).filter(t => t && (t.includes('taobao') || t.includes('weidian') || t.includes('1688') || t.includes('yupoo') || t.includes('link') || t.includes('w2c') || t.includes('W2C')))"
        )
        print("\n--- MATCHING ELEMENTS ---")
        for c in set(captions[:10]):
            print(" ->", c[:120])
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_specific_post())
