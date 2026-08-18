import asyncio
from playwright.async_api import async_playwright
import urllib.parse
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

DISCOVERED_QUEUE_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "discovered_sheet_finds.json")

async def test_all_items_on_sugargoo():
    if not os.path.exists(DISCOVERED_QUEUE_PATH):
        print("No discovered queue found.")
        return

    with open(DISCOVERED_QUEUE_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    print(f"Testing {len(items)} items on Sugargoo...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create browser context
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        valid_items = []
        failed_items = []
        
        for item in items:
            raw_url = item.get("rawMarketUrl") or item.get("directStoreLink", "")
            title = item.get("title")
            brand = item.get("brand")
            
            encoded = urllib.parse.quote(raw_url, safe="")
            sg_url = f"https://www.sugargoo.com/products?productLink={encoded}&memberId=1325437696506389977"
            
            print(f"\n--- Testing: {brand} - {title} ---")
            print(f"Market URL: {raw_url}")
            
            try:
                await page.goto(sg_url, wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(3500)
                
                cur_url = page.url
                page_text = await page.inner_text("body")
                
                is_failed = False
                reason = ""
                
                if "order/manual" in cur_url or "product search failed" in page_text.lower():
                    is_failed = True
                    reason = "Sugargoo: Product search failed (Redirected to manual order)"
                elif "item not found" in page_text.lower() or "商品不存在" in page_text:
                    is_failed = True
                    reason = "Sugargoo: Product not found"
                elif "brand risk" in page_text.lower() or "unable to purchase" in page_text.lower():
                    is_failed = True
                    reason = "Sugargoo: Brand Risk Blocked"
                else:
                    reason = "Sugargoo Valid / Resolves"
                    
                if is_failed:
                    print(f"  ❌ FAILED: {reason}")
                    failed_items.append((item, reason))
                else:
                    print(f"  ✅ SUCCESS: {reason} (URL: {cur_url})")
                    valid_items.append(item)
                    
            except Exception as e:
                print(f"  ⚠️ Error testing on Sugargoo: {e}")
                # Don't purge on timeout, but note it
                valid_items.append(item)
                
        await browser.close()
        
        print(f"\n==========================================")
        print(f"SUMMARY: {len(valid_items)} SUCCESSFUL, {len(failed_items)} FAILED on Sugargoo out of {len(items)}")
        
        # Save only the truly valid items back to discovered_sheet_finds.json
        with open(DISCOVERED_QUEUE_PATH, "w", encoding="utf-8") as f:
            json.dump(valid_items, f, indent=2, ensure_ascii=False)
        print(f"Updated {DISCOVERED_QUEUE_PATH} with {len(valid_items)} verified items.")

if __name__ == "__main__":
    asyncio.run(test_all_items_on_sugargoo())
