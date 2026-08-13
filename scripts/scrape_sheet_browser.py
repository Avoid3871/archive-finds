import asyncio
import json
import re
from playwright.async_api import async_playwright

url = "https://docs.google.com/spreadsheets/d/1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10/edit?gid=1523005324#gid=1523005324"

async def main():
    print("Launching Chromium to inspect Google Sheet DOM...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Intercept network requests to capture images and API calls
        captured_images = []
        page.on("response", lambda response: (
            captured_images.append(response.url)
            if any(ext in response.url.lower() for ext in [".jpg", ".jpeg", ".png", ".webp", "googleusercontent.com/docs", "googleusercontent.com/drawings", "lh3.googleusercontent", "lh4.googleusercontent", "lh5.googleusercontent", "lh6.googleusercontent", "lh7.googleusercontent"])
            and not "static/spreadsheets" in response.url
            and not "favicon" in response.url
            and not "cleardot" in response.url
            else None
        ))

        await page.goto(url, wait_until="networkidle", timeout=45000)
        title = await page.title()
        print(f"Page Title: {title}")

        # Wait 3 seconds for client canvas to render all embedded objects
        await page.wait_for_timeout(3000)

        # 1. Search for <img> tags in DOM
        img_elements = await page.eval_on_selector_all("img", """
            imgs => imgs.map(img => ({
                src: img.src,
                alt: img.alt,
                width: img.width,
                height: img.height,
                style: img.getAttribute('style')
            }))
        """)
        print(f"\nFound {len(img_elements)} <img> elements in page DOM:")
        for idx, img in enumerate(img_elements[:15]):
            print(f"  [{idx+1}] {img['src'][:100]} ({img['width']}x{img['height']})")

        # 2. Search for canvas or svg elements
        canvas_count = len(await page.query_selector_all("canvas"))
        svg_count = len(await page.query_selector_all("svg"))
        print(f"\nCanvas elements: {canvas_count}, SVG elements: {svg_count}")

        # 3. Print captured network image requests
        print(f"\nCaptured network images ({len(captured_images)}):")
        unique_images = list(dict.fromkeys(captured_images))
        for idx, img_url in enumerate(unique_images[:25]):
            print(f"  [Net {idx+1}] {img_url}")

        # Save results
        results = {
            "title": title,
            "dom_images": img_elements,
            "network_images": unique_images
        }
        with open("scripts/browser_sheet_results.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print("\nSaved scripts/browser_sheet_results.json!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
