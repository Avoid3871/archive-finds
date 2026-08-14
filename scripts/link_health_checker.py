import sys
import os
import json
import asyncio
import urllib.parse
from playwright.async_api import async_playwright
import requests

sys.stdout.reconfigure(encoding="utf-8")

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "sheetProducts.json")
HEALTH_REPORT_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "linkHealthReport.json")

def normalize_sugargoo_link(raw_market_url: str) -> str:
    encoded = urllib.parse.quote(raw_market_url, safe="")
    return f"https://www.sugargoo.com/products?productLink={encoded}&memberId=1325437696506389977"

async def check_single_product(item: dict) -> dict:
    direct_link = item.get("directStoreLink") or item.get("sourceLink") or ""
    affiliate_url = item.get("affiliateUrl") or item.get("affiliateLink") or item.get("sugargooUrl") or ""
    title = item.get("name") or item.get("title") or "Unnamed Grail"
    slug = item.get("slug", "")
    
    # Extract underlying raw link from affiliate url if directStoreLink is missing
    if not direct_link and affiliate_url:
        parsed = urllib.parse.urlparse(affiliate_url)
        params = urllib.parse.parse_qs(parsed.query)
        if "productLink" in params:
            direct_link = params["productLink"][0]
        elif "productUrl" in params:
            direct_link = params["productUrl"][0]
            
    result = {
        "id": item.get("id"),
        "title": title,
        "slug": slug,
        "brand": item.get("brand"),
        "directLink": direct_link,
        "affiliateUrl": affiliate_url,
        "imageUrl": item.get("imageUrl") or item.get("localImage") or "",
        "status": "HEALTHY",
        "statusCode": 200,
        "message": "Link verified and active",
        "testedAt": ""
    }
    
    if not direct_link:
        result["status"] = "FLAGGED"
        result["message"] = "No direct market link found"
        return result
        
    # Quick HTTP check with timeout
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        resp = requests.get(direct_link, headers=headers, timeout=10, allow_redirects=True)
        result["statusCode"] = resp.status_code
        text = resp.text
        
        # Check for delisting patterns in Chinese marketplaces
        delisted_keywords = [
            "商品已经下架", "商品已下架", "宝贝不存在", "item not found", 
            "item deleted", "404 Not Found", "此商品不存在", "已下架", "该宝贝不存在"
        ]
        
        if resp.status_code in [404, 410]:
            result["status"] = "DEAD"
            result["message"] = f"HTTP {resp.status_code} - Item page deleted or not found"
        elif any(kw in text for kw in delisted_keywords):
            result["status"] = "DEAD"
            result["message"] = "Marketplace notice: Item was delisted / out of stock by seller"
        else:
            result["status"] = "HEALTHY"
            result["message"] = "Item page is live on marketplace"
    except requests.exceptions.RequestException as e:
        result["status"] = "NEEDS_REVIEW"
        result["message"] = f"Network check warning: {str(e)[:60]}"
        
    return result

async def run_full_audit(limit: int = 150):
    print(f"Loading catalog from {CATALOG_PATH}...")
    if not os.path.exists(CATALOG_PATH):
        print(f"Error: Catalog not found at {CATALOG_PATH}")
        return
        
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)
        
    print(f"Starting Link Health Audit for {len(products)} products (checking up to {limit})...")
    
    results = []
    healthy_count = 0
    dead_count = 0
    flagged_count = 0
    
    for i, p in enumerate(products[:limit]):
        res = await check_single_product(p)
        results.append(res)
        
        if res["status"] == "HEALTHY":
            healthy_count += 1
            icon = "✅"
        elif res["status"] == "DEAD":
            dead_count += 1
            icon = "❌"
        else:
            flagged_count += 1
            icon = "⚠️"
            
        print(f"[{i+1}/{len(products[:limit])}] {icon} {res['title'][:35]} -> {res['status']} ({res['message'][:40]})")
        
    summary = {
        "lastAudit": os.environ.get("AUDIT_TIME", "2026-08-14T20:45:00Z"),
        "totalChecked": len(results),
        "healthy": healthy_count,
        "dead": dead_count,
        "flagged": flagged_count,
        "items": results
    }
    
    os.makedirs(os.path.dirname(os.path.abspath(HEALTH_REPORT_PATH)), exist_ok=True)
    with open(HEALTH_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
        
    print(f"\n[AUDIT FINISHED] Total: {len(results)} | Healthy: {healthy_count} | Dead: {dead_count} | Flagged: {flagged_count}")
    print(f"Report saved to: {HEALTH_REPORT_PATH}")
    return summary

if __name__ == "__main__":
    limit = 150
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            pass
    asyncio.run(run_full_audit(limit))
