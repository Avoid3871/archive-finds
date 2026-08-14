import asyncio
from playwright.async_api import async_playwright
import json

async def inspect_post():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        url = "https://www.reddit.com/r/QualityReps/comments/1vocnvf/blassic_haul/"
        await page.goto(url, timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Extract all comments text and links
        comments = await page.eval_on_selector_all(
            "shreddit-comment, div[data-testid='comment']",
            """comments => comments.map(c => ({
                author: c.getAttribute('author') || '',
                text: c.innerText || '',
                links: Array.from(c.querySelectorAll('a')).map(a => ({ href: a.href, text: a.innerText }))
            }))"""
        )
        
        print(f"Found {len(comments)} comments:")
        for c in comments:
            print(f"Author: {c['author']}")
            print(f"Text snippet: {c['text'][:100]}")
            print(f"Links: {c['links']}")
            print("-" * 40)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_post())
