import asyncio
from playwright.async_api import async_playwright
import urllib.parse
import re

async def search_google_or_bing_images(query: str, max_results: int = 5):
    """Uses Playwright to extract high-res studio/flat-lay product images from Bing/Google Images."""
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # Bing images search (clean JSON metadata in img elements)
        search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query + ' product white background')}&form=HDRSC2&first=1"
        print(f"[SEARCH] Loading {search_url}...")
        try:
            await page.goto(search_url, timeout=25000, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)
            
            # Extract murl from m attribute of .iusc elements
            elements = await page.query_selector_all("a.iusc")
            for el in elements[:max_results * 2]:
                m_attr = await el.get_attribute("m")
                if m_attr:
                    # m is a JSON string with 'murl'
                    try:
                        import json
                        data = json.loads(m_attr)
                        murl = data.get("murl")
                        turl = data.get("turl")
                        title = data.get("t", "")
                        if murl and (murl.startswith("http://") or murl.startswith("https://")):
                            if not any(bad in murl.lower() for bad in ["reddit", "preview.redd.it", "imgur"]):
                                results.append({
                                    "url": murl,
                                    "thumb": turl,
                                    "title": title
                                })
                    except Exception:
                        pass
                if len(results) >= max_results:
                    break
        except Exception as e:
            print(f"[SEARCH ERROR] {e}")
            
        await browser.close()
    return results

async def test():
    print("\n--- Searching Rick Owens Vans ---")
    ro_imgs = await search_google_or_bing_images("Rick Owens Vans Sneaker low black vintage leather", 4)
    for i, r in enumerate(ro_imgs):
        print(f"{i+1}. {r['title'][:60]} -> {r['url']}")
        
    print("\n--- Searching Chrome Hearts Soap and Water Hoodie ---")
    ch_imgs = await search_google_or_bing_images("Chrome Hearts Soap and Water Hoodie black vintage", 4)
    for i, r in enumerate(ch_imgs):
        print(f"{i+1}. {r['title'][:60]} -> {r['url']}")

if __name__ == "__main__":
    asyncio.run(test())
