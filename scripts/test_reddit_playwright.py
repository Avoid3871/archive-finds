import asyncio
from playwright.async_api import async_playwright
import json

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        print("Navigating to https://www.reddit.com/r/QualityReps/new/ ...")
        await page.goto("https://www.reddit.com/r/QualityReps/new/", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Get page title
        title = await page.title()
        print(f"Page Title: {title}")
        
        # Extract post articles / shreddit-post elements
        posts = await page.query_selector_all("shreddit-post, article, div[data-testid='post-container']")
        print(f"Found {len(posts)} post elements on page!")
        
        for i, post in enumerate(posts[:5]):
            post_title = await post.get_attribute("post-title") or await post.inner_text()
            permalink = await post.get_attribute("permalink")
            print(f"\n--- POST {i+1} ---")
            print(f"Title: {post_title[:80] if post_title else 'N/A'}")
            print(f"Permalink: {permalink}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test())
