import asyncio
from playwright.async_api import async_playwright
import re
import json

def clean_and_extract_links(text):
    if not text:
        return []
    # De-obfuscate common patterns:
    # 1. "item . taobao . com" -> "item.taobao.com"
    # 2. "weidian (dot) com" -> "weidian.com"
    # 3. "https : // " -> "https://"
    cleaned = text
    cleaned = re.sub(r'\s*\(\s*dot\s*\)\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\[\s*dot\s*\]\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'(\w+)\s*\.\s*(\w+)', r'\1.\2', cleaned)
    cleaned = re.sub(r'https?\s*:\s*/\s*/\s*', 'https://', cleaned, flags=re.IGNORECASE)
    
    patterns = [
        r'https?://[^\s"\'<>()]+(?:taobao|weidian|1688|yupoo|tmall|sugargoo|mulebuy|superbuy|cssbuy|allchinabuy)[^\s"\'<>()]*',
        r'(?:item\.taobao\.com|weidian\.com|detail\.1688\.com|detail\.tmall\.com)[^\s"\'<>()]+'
    ]
    
    results = []
    for pat in patterns:
        for m in re.findall(pat, cleaned, re.IGNORECASE):
            if not m.startswith('http'):
                m = 'https://' + m
            results.append(m)
    return list(set(results))

async def scan_feed():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        print("Fetching r/QualityReps feed...")
        await page.goto("https://www.reddit.com/r/QualityReps/new/", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Get post links
        post_links = await page.eval_on_selector_all(
            "a[href*='/r/QualityReps/comments/']",
            "links => Array.from(new Set(links.map(a => a.href))).filter(h => !h.includes('/comment/'))"
        )
        
        print(f"Discovered {len(post_links)} distinct post threads:\n")
        
        for i, post_url in enumerate(post_links[:8]):
            print(f"--- [POST {i+1}] {post_url} ---")
            post_page = await context.new_page()
            try:
                await post_page.goto(post_url, timeout=25000)
                await post_page.wait_for_timeout(2000)
                
                title_el = await post_page.query_selector("h1")
                title = await title_el.inner_text() if title_el else ""
                
                # Check body and captions
                body_el = await post_page.query_selector("div[data-testid='post-container'], shreddit-post")
                body_text = await body_el.inner_text() if body_el else ""
                
                # Check all links on page
                all_hrefs = await post_page.eval_on_selector_all("a", "els => els.map(e => e.href)")
                
                # Images
                imgs = await post_page.eval_on_selector_all(
                    "img[src*='preview.redd.it'], img[src*='i.redd.it'], img[src*='external-preview']",
                    "els => els.map(e => e.src)"
                )
                
                extracted_links = clean_and_extract_links(body_text + " " + " ".join(all_hrefs))
                
                print(f"Title: {title}")
                print(f"Images count: {len(imgs)}")
                if imgs:
                    print(f"Top image: {imgs[0][:100]}...")
                print(f"Extracted Market Links ({len(extracted_links)}):")
                for l in extracted_links:
                    print(f"  -> {l}")
            except Exception as e:
                print(f"Error scraping post: {e}")
            finally:
                await post_page.close()
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scan_feed())
