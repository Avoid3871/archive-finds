import asyncio
import json
from playwright.async_api import async_playwright

url = "https://docs.google.com/spreadsheets/d/1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10/edit?gid=1523005324#gid=1523005324"

async def main():
    print("Launching Chromium (Fast Mode)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        captured_images = []
        page.on("response", lambda res: (
            captured_images.append(res.url)
            if any(ext in res.url.lower() for ext in [".jpg", ".jpeg", ".png", ".webp", "googleusercontent.com", "alicdn.com", "imgur.com"])
            and not "static/spreadsheets" in res.url
            and not "favicon" in res.url
            and not "cleardot" in res.url
            and not "client/img" in res.url
            else None
        ))

        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        print("DOM loaded, waiting 4s...")
        await page.wait_for_timeout(4000)

        # Scroll down to load all canvas/images
        for _ in range(5):
            await page.keyboard.press("PageDown")
            await page.wait_for_timeout(500)

        title = await page.title()
        print(f"Page Title: {title}")

        # Check DOM img elements
        dom_imgs = await page.eval_on_selector_all("img", """
            imgs => imgs.map(i => ({ src: i.src, width: i.width, height: i.height }))
        """)
        print(f"DOM Img tags: {len(dom_imgs)}")
        for i in dom_imgs[:10]:
            print("  DOM Img:", i['src'][:80], f"({i['width']}x{i['height']})")

        print(f"\nCaptured Network Image Requests: {len(captured_images)}")
        unique_images = list(dict.fromkeys(captured_images))
        for u in unique_images:
            print("  Network Img:", u)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
