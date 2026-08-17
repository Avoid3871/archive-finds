import sys
import os
import json
import asyncio
import urllib.parse
import datetime

sys.stdout.reconfigure(encoding="utf-8")

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "sheetProducts.json")
HEALTH_REPORT_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "linkHealthReport.json")

def normalize_sugargoo_link(raw_market_url: str) -> str:
    encoded = urllib.parse.quote(raw_market_url, safe="")
    return f"https://www.sugargoo.com/products?productLink={encoded}&memberId=1325437696506389977"

async def check_single_product_async(item: dict, sem: asyncio.Semaphore) -> dict:
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
        "directStoreLink": direct_link,
        "affiliateUrl": affiliate_url,
        "imageUrl": item.get("imageUrl") or item.get("localImage") or "",
        "status": "HEALTHY",
        "statusCode": 200,
        "message": "Link verified and active",
        "testedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    if not direct_link:
        result["status"] = "FLAGGED"
        result["message"] = "No direct market link found"
        return result
        
    # 1. Weidian Thor Live Verification
    if "weidian.com" in direct_link:
        import re
        item_id_match = re.search(r'(?:itemID|itemId|item_id)=(\d+)', direct_link)
        if item_id_match:
            wid = item_id_match.group(1)
            thor_url = f"https://thor.weidian.com/detail/getItemSkuInfo/1.0?param=%7B%22itemId%22%3A%22{wid}%22%7D"
            headers_wd = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://weidian.com/"
            }
            async with sem:
                loop = asyncio.get_event_loop()
                def check_wd():
                    try:
                        import urllib.request
                        req = urllib.request.Request(thor_url, headers=headers_wd)
                        with urllib.request.urlopen(req, timeout=4) as resp:
                            data = json.loads(resp.read().decode('utf-8'))
                            code = data.get('status', {}).get('code')
                            if code != 0:
                                return False, "Weidian: Item delisted (code != 0)"
                            res = data.get('result')
                            if not res:
                                return False, "Weidian: No product data"
                            sku_infos = res.get('skuInfos', [])
                            stock = 0
                            if isinstance(sku_infos, list):
                                for s in sku_infos:
                                    stock += s.get('skuInfo', {}).get('stock', 0)
                            elif isinstance(sku_infos, dict):
                                for k, s in sku_infos.items():
                                    stock += s.get('stock', 0)
                            if len(sku_infos) > 0 and stock == 0:
                                return False, "Weidian: Out of stock (0 units available)"
                            return True, "Active (In Stock)"
                    except Exception as e:
                        return False, f"Weidian check failed: {str(e)[:30]}"
                
                is_alive, msg = await loop.run_in_executor(None, check_wd)
                if is_alive:
                    result["status"] = "HEALTHY"
                    result["message"] = "Weidian verified in stock"
                else:
                    result["status"] = "DEAD"
                    result["message"] = msg
                return result

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    }

    async with sem:
        try:
            import urllib.request
            req = urllib.request.Request(direct_link, headers=headers)
            loop = asyncio.get_event_loop()
            
            def fetch():
                try:
                    with urllib.request.urlopen(req, timeout=6) as response:
                        return response.getcode(), response.read().decode('utf-8', errors='ignore'), response.geturl()
                except urllib.error.HTTPError as e:
                    return e.code, "", ""
                except Exception as e:
                    return 0, str(e), ""

            status_code, text, final_url = await loop.run_in_executor(None, fetch)
            result["statusCode"] = status_code
            
            delisted_keywords = [
                "商品已经下架", "商品已下架", "宝贝不存在", "item not found", 
                "item deleted", "404 Not Found", "此商品不存在", "已下架", "该宝贝不存在",
                "卖家已下架", "商品不存在或已被删除", "很抱歉，您查看的宝贝不存在"
            ]
            
            if status_code in [404, 410] or "error.taobao.com" in final_url:
                result["status"] = "DEAD"
                result["message"] = f"HTTP {status_code} - Item page deleted or not found"
            elif any(kw in text for kw in delisted_keywords):
                result["status"] = "DEAD"
                result["message"] = "Marketplace notice: Item was delisted / out of stock by seller"
            elif status_code == 0:
                result["status"] = "FLAGGED"
                result["message"] = "Network timeout checking seller store"
            else:
                result["status"] = "HEALTHY"
                result["message"] = "Item page is live on marketplace"
        except Exception as e:
            result["status"] = "FLAGGED"
            result["message"] = f"Network warning: {str(e)[:40]}"
            
    return result

async def run_full_audit(limit: int = 150):
    if not os.path.exists(CATALOG_PATH):
        print(f"Error: Catalog not found at {CATALOG_PATH}")
        return
        
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)
        
    target_products = products[:limit]
    total = len(target_products)
    
    # Progress start
    print(json.dumps({
        "type": "progress",
        "data": {
            "percent": 0,
            "current": 0,
            "total": total,
            "phase": "STARTING",
            "message": f"Starting link audit for {total} pieces..."
        }
    }), flush=True)
    
    sem = asyncio.Semaphore(8) # 8 concurrent requests for max speed
    results = []
    healthy_count = 0
    dead_count = 0
    flagged_count = 0
    
    tasks = [check_single_product_async(p, sem) for p in target_products]
    
    completed_count = 0
    for coro in asyncio.as_completed(tasks):
        res = await coro
        results.append(res)
        completed_count += 1
        
        if res["status"] == "HEALTHY":
            healthy_count += 1
        elif res["status"] == "DEAD":
            dead_count += 1
        else:
            flagged_count += 1
            
        percent = int((completed_count / total) * 100)
        
        # Stream structured progress event
        print(f"[AF_PROGRESS] " + json.dumps({
            "percent": percent,
            "current": completed_count,
            "total": total,
            "healthy": healthy_count,
            "dead": dead_count,
            "flagged": flagged_count,
            "item": res.get("title", ""),
            "status": res.get("status", "HEALTHY"),
            "message": f"Audited [{completed_count}/{total}] {res.get('title', '')[:30]} ({res.get('status')})"
        }), flush=True)

    summary = {
        "lastAudit": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "totalChecked": len(results),
        "healthyCount": healthy_count,
        "deadCount": dead_count,
        "flaggedCount": flagged_count,
        "items": results
    }
    
    os.makedirs(os.path.dirname(os.path.abspath(HEALTH_REPORT_PATH)), exist_ok=True)
    with open(HEALTH_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
        
    print(f"[AF_HEALTH_REPORT] " + json.dumps(summary), flush=True)
    return summary

if __name__ == "__main__":
    limit = 150
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            pass
    asyncio.run(run_full_audit(limit))
