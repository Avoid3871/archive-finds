import sys
import os
import json
import re
import urllib.parse
import urllib.request
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def fetch_weidian_thor_gallery(market_url: str):
    images = []
    m = re.search(r'(?:itemId|itemID)=(\d+)', market_url)
    if not m:
        m = re.search(r'item\.html\?id=(\d+)', market_url)
    if not m:
        return images
        
    item_id = m.group(1)
    thor_url = f"https://thor.weidian.com/detail/getItemSkuInfo/1.0?param=%7B%22itemId%22%3A%22{item_id}%22%7D"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": f"https://weidian.com/item.html?itemID={item_id}"
    }
    try:
        req = urllib.request.Request(thor_url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            sku_info = res_data.get("result", {})
            
            # Extract main images
            main_imgs = sku_info.get("skuInfos", [])
            for item in main_imgs:
                img_url = item.get("skuImg") or item.get("img")
                if img_url and img_url.startswith("http") and img_url not in images:
                    images.append(img_url)
    except Exception:
        pass
        
    return images

def fetch_visual_search_images(query: str, limit: int = 8):
    images = []
    if not query.strip():
        return images
        
    # Clean up query
    clean_query = query
    for b in ["Rick Owens", "Chrome Hearts", "Maison Margiela", "Balenciaga", "Yohji Yamamoto", "Undercover", "Raf Simons"]:
        if b.lower() in clean_query.lower():
            clean_query = f"{b} {clean_query}"
            break
            
    search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(clean_query)}+studio+photo&form=HDRSC2"
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1000, 'height': 800})
            page.goto(search_url, timeout=12000)
            page.wait_for_timeout(1500)
            
            img_urls = page.evaluate('''() => {
                const list = [];
                document.querySelectorAll('a.iusc').forEach(el => {
                    try {
                        const m = JSON.parse(el.getAttribute('m') || '{}');
                        if (m.murl && !list.includes(m.murl)) {
                            // Filter out tiny or irrelevant banners
                            if (!m.murl.includes('.gif') && !m.murl.includes('logo') && !m.murl.includes('icon')) {
                                list.push(m.murl);
                            }
                        }
                    } catch(e){}
                });
                return list;
            }''')
            browser.close()
            images.extend(img_urls[:limit])
    except Exception:
        pass
        
    return images

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"images": []}))
        return
        
    payload_file = sys.argv[1]
    with open(payload_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    query = data.get("query", "").strip()
    market_url = data.get("marketUrl", "").strip()
    
    all_images = []
    
    # 1. Try Weidian Thor Gallery
    if "weidian" in market_url:
        thor_imgs = fetch_weidian_thor_gallery(market_url)
        all_images.extend(thor_imgs)
        
    # 2. Visual search for luxury studio photos
    search_imgs = fetch_visual_search_images(query, limit=8)
    for u in search_imgs:
        if u not in all_images:
            all_images.append(u)
            
    print(json.dumps({"images": all_images[:10]}))

if __name__ == "__main__":
    main()
