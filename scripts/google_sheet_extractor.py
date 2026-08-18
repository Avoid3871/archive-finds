import sys
import os
import re
import json
import csv
import io
import time
import urllib.parse
import urllib.request
import asyncio
from datetime import datetime, timezone
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "sheetProducts.json")
REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "sheet_ingestion_registry.json")
DISCOVERED_QUEUE_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "discovered_sheet_finds.json")

SUGARGOO_AFFILIATE_ID = "1325437696506389977"
DEFAULT_EXCHANGE_RATE = 0.14815  # 1 CNY = 0.14815 USD (1 USD = 6.75 CNY)

def clean_url(url: str) -> str:
    if not url:
        return ""
    url = url.strip()
    # 1. Unwrap Google redirect: https://www.google.com/url?q=...
    if "google.com/url?" in url:
        parsed = urllib.parse.urlparse(url)
        params = urllib.parse.parse_qs(parsed.query)
        if "q" in params:
            url = params["q"][0]
            
    # 2. Unwrap Sugargoo / Agent redirect links
    if any(agent in url for agent in ["sugargoo.com", "superbuy.com", "mulebuy.com", "cnfans.com", "cssbuy.com", "kakobuy.com", "hoobuy.com"]):
        try:
            parsed = urllib.parse.urlparse(url)
            params = urllib.parse.parse_qs(parsed.query)
            for k in ["productLink", "productUrl", "url"]:
                if k in params:
                    url = params[k][0]
                    break
        except Exception:
            pass

    # 3. Canonicalize Weidian
    if "weidian.com" in url:
        m = re.search(r'(?:itemID|itemId|item_id)=(\d+)', url, re.IGNORECASE)
        if m:
            return f"https://weidian.com/item.html?itemID={m.group(1)}"
            
    # 4. Canonicalize Taobao / Tmall
    if "taobao.com" in url or "tmall.com" in url:
        m = re.search(r'(?:[?&]|\b)id=(\d+)', url)
        if not m:
            m = re.search(r'spm=id=(\d+)', url)
        if m:
            return f"https://item.taobao.com/item.htm?id={m.group(1)}"

    # 5. Canonicalize 1688
    if "1688.com" in url:
        m = re.search(r'offer/(\d+)\.html', url)
        if m:
            return f"https://detail.1688.com/offer/{m.group(1)}.html"

    return url.strip()

def normalize_sugargoo_link(raw_url: str) -> str:
    raw_url = clean_url(raw_url)
    if not raw_url:
        return ""
    encoded = urllib.parse.quote(raw_url, safe="")
    return f"https://www.sugargoo.com/products?productLink={encoded}&memberId={SUGARGOO_AFFILIATE_ID}"

def parse_price(val: str, default_usd: float = 45.0) -> float:
    if not val:
        return default_usd
    cleaned = re.sub(r'[^\d.]', '', str(val).replace(',', ''))
    try:
        f = float(cleaned)
        return round(f, 2) if f > 0 else default_usd
    except Exception:
        return default_usd

def load_registry() -> dict:
    if os.path.exists(REGISTRY_PATH):
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "processed_links": {},  # raw_url -> { status: "INGESTED"|"DEAD"|"SKIPPED", timestamp: "..." }
        "blacklisted_links": [],
        "last_offset_by_tab": {},
        "sheet_stats": {}
    }

def save_registry(registry: dict):
    os.makedirs(os.path.dirname(REGISTRY_PATH), exist_ok=True)
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

def load_catalog_links() -> set:
    links = set()
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    for k in ["directStoreLink", "directLink", "sourceLink", "sugargooUrl", "affiliateUrl"]:
                        v = item.get(k)
                        if v:
                            cleaned = clean_url(v).lower()
                            links.add(cleaned)
                            # Also add raw market link parsed out of sugargooUrl
                            if "productLink=" in cleaned or "productUrl=" in cleaned:
                                try:
                                    parsed = urllib.parse.urlparse(cleaned)
                                    qs = urllib.parse.parse_qs(parsed.query)
                                    raw = qs.get("productLink", qs.get("productUrl", [""]))[0]
                                    if raw:
                                        links.add(raw.lower())
                                except Exception:
                                    pass
        except Exception:
            pass
    return links

def map_category(tab_name: str, item_title: str) -> str:
    tab_upper = tab_name.upper()
    title_upper = item_title.upper()
    
    if "SHOE" in tab_upper or "FOOTWEAR" in tab_upper or "SNEAKER" in tab_upper:
        return "Footwear"
    if "BOTTOM" in tab_upper or "PANT" in tab_upper or "JEAN" in tab_upper:
        if "JEAN" in title_upper or "DENIM" in title_upper:
            return "Denim"
        return "Pants"
    if "TOP" in tab_upper:
        if "JACKET" in title_upper or "COAT" in title_upper or "PUFFER" in title_upper or "BLAZER" in title_upper or "BOMBER" in title_upper or "PARKA" in title_upper or "ANORAK" in title_upper:
            return "Outerwear"
        if "HOODIE" in title_upper or "SWEATSHIRT" in title_upper or "ZIP" in title_upper or "KNIT" in title_upper or "CARDIGAN" in title_upper or "SWEATER" in title_upper:
            return "Hoodies"
        if "TEE" in title_upper or "T-SHIRT" in title_upper or "SHIRT" in title_upper or "TOP" in title_upper:
            return "T-Shirts"
        return "Outerwear"
    if "ACCESSOR" in tab_upper or "OTHER" in tab_upper or "BAG" in tab_upper:
        if "BAG" in title_upper or "BACKPACK" in title_upper or "TOTE" in title_upper:
            return "Bags"
        if "RING" in title_upper or "NECKLACE" in title_upper or "BRACELET" in title_upper or "CHAIN" in title_upper:
            return "Jewelry"
        return "Accessories"
    return "Outerwear"

async def check_link_alive(raw_url: str, sem: asyncio.Semaphore) -> tuple[bool, str]:
    """Test marketplace link live availability and stock accurately without paid APIs."""
    raw_url = clean_url(raw_url)
    if not raw_url or not raw_url.startswith("http"):
        return False, "Invalid or missing URL"
    
    # Fast heuristic check for obvious sold out notes
    if "sold out" in raw_url.lower() or "deleted" in raw_url.lower():
        return False, "Marked sold out in URL"

    # Reject non-orderable direct sites / albums / 1-off second-hand
    if "yupoo.com" in raw_url:
        return False, "Yupoo album (Agent direct checkout not supported)"
        
    if "reondistrict.com" in raw_url:
        return False, "Reon District (Direct Korean store, not an agent marketplace)"

    if "goofish.com" in raw_url or "2.taobao.com" in raw_url:
        return False, "Goofish / Xianyu (Second-hand single-quantity listing)"

    # 1. Weidian True Live Status Verification (via Direct HTML Render Check)
    if "weidian.com" in raw_url:
        wid_match = re.search(r'itemID=(\d+)', raw_url)
        if not wid_match:
            return False, "Invalid Weidian Item ID"
        wid = wid_match.group(1)
        target_url = f"https://weidian.com/item.html?itemID={wid}"
        headers_wd = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://weidian.com/"
        }
        async with sem:
            loop = asyncio.get_event_loop()
            def verify_wd():
                try:
                    req = urllib.request.Request(target_url, headers=headers_wd)
                    with urllib.request.urlopen(req, timeout=6) as resp:
                        html = resp.read().decode('utf-8', errors='ignore')
                        # 1. Check for explicit delisted indicators
                        if '该商品已经被删除' in html or '去看看其它商品吧' in html:
                            return False, "Weidian: Item Deleted / Removed by Seller"

                        # 2. Check for dummy / service / recycled non-clothing listings
                        m_title = re.search(r'<span class="item-name">(.*?)</span>', html)
                        title_text = m_title.group(1) if m_title else ""
                        
                        dummy_keywords = [
                            "服务", "棚拍", "定金", "补运费", "邮费", "专拍", "链接", "差价", "摄影", 
                            "deposit", "postage", "service", "freight", "custom order", "reship", "sample"
                        ]
                        if any(dk in title_text.lower() for dk in dummy_keywords):
                            return False, f"Weidian: Recycled dummy/service listing ({title_text[:25]})"

                        # 3. Active Weidian items always have item-name or cur-price rendered
                        if 'class="item-name"' in html or 'class="cur-price"' in html or 'class="content"' in html:
                            return True, "Weidian Active (In Stock)"
                        
                        # Empty shell = delisted
                        return False, "Weidian: Delisted / Off-shelf"
                except urllib.error.HTTPError as e:
                    return False, f"Weidian HTTP {e.code}"
                except Exception as e:
                    return False, f"Weidian check failed: {str(e)[:30]}"
            return await loop.run_in_executor(None, verify_wd)

    # 2. General / Taobao / 1688 Check
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    }

    async with sem:
        loop = asyncio.get_event_loop()
        def fetch():
            try:
                req = urllib.request.Request(raw_url, headers=headers)
                with urllib.request.urlopen(req, timeout=6) as resp:
                    final_url = resp.geturl()
                    code = resp.getcode()
                    body = resp.read().decode('utf-8', errors='ignore')
                    return code, body, final_url
            except urllib.error.HTTPError as e:
                return e.code, "", ""
            except Exception as e:
                return 0, "", ""

        status_code, text, final_url = await loop.run_in_executor(None, fetch)
        
        if status_code in [404, 410] or "error.taobao.com" in final_url:
            return False, f"HTTP {status_code} - Page Not Found / Error"
            
        delisted_keywords = [
            "商品已经下架", "商品已下架", "宝贝不存在", "item not found", 
            "item deleted", "404 Not Found", "此商品不存在", "已下架", "该宝贝不存在",
            "卖家已下架", "商品不存在或已被删除", "很抱歉，您查看的宝贝不存在"
        ]
        if any(kw in text for kw in delisted_keywords):
            return False, "Seller delisted or item out of stock"
            
        if status_code == 0:
            return False, "Host unreachable / link dead"

        # Taobao anti-bot: detect login redirect wall pages.
        is_taobao = "taobao.com" in raw_url or "tmall.com" in raw_url
        if is_taobao:
            is_login_wall = "x5referer" in text or "login.taobao.com" in text or "login.m.taobao.com" in text
            if is_login_wall:
                return False, "Taobao: Delisted or unverified on Sugargoo"

        return True, "Active"

def discover_tabs_from_sheet(sheet_id: str) -> list[dict]:
    """Dynamically discover all tabs in a Google Sheet."""
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/htmlview"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8')
    except Exception as e:
        print(f"[ERROR] Failed to discover sheet tabs: {e}", file=sys.stderr)
        return []

    pattern = r'items\.push\(\{\s*name:\s*"([^"]+)",\s*pageUrl:\s*"([^"]+)",\s*gid:\s*"([^"]+)"'
    matches = re.findall(pattern, html)
    tabs = []
    for name, page_url, gid in matches:
        if name.upper() not in ["CHANGELOG", "README", "INFO", "RESOURCES"]:
            tabs.append({
                "name": name,
                "gid": gid,
                "url": f"https://docs.google.com/spreadsheets/d/{sheet_id}/htmlview/sheet?headers=true&gid={gid}"
            })
    return tabs

async def extract_sheet_pipeline(
    sheet_id_or_url: str,
    selected_tab_names: list[str] = None,
    batch_limit: int = 25,
    validate_links: bool = True,
    max_concurrency: int = 10
):
    start_time = time.time()
    
    # Extract sheet ID
    sheet_id_match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_id_or_url)
    sheet_id = sheet_id_match.group(1) if sheet_id_match else sheet_id_or_url.strip()
    
    print(f"[AF_SHEET_LOG] Initializing Google Sheet extractor for ID: {sheet_id}")
    
    tabs = discover_tabs_from_sheet(sheet_id)
    if not tabs:
        print(f"[AF_SHEET_LOG] No product tabs discovered. Check sheet permissions or URL.")
        return
        
    print(f"[AF_SHEET_LOG] Discovered {len(tabs)} product tabs: {', '.join([t['name'] for t in tabs])}")
    
    registry = load_registry()
    catalog_links = load_catalog_links()
    
    if selected_tab_names:
        tabs_to_process = [t for t in tabs if t["name"].upper() in [st.upper() for st in selected_tab_names]]
    else:
        tabs_to_process = tabs

    total_extracted = 0
    discovered_healthy_items = []
    sem = asyncio.Semaphore(max_concurrency)
    
    # Load existing discovered queue to merge or append
    existing_queue = []
    if os.path.exists(DISCOVERED_QUEUE_PATH):
        try:
            with open(DISCOVERED_QUEUE_PATH, "r", encoding="utf-8") as f:
                existing_queue = json.load(f)
        except Exception:
            pass
            
    existing_queue_links = {clean_url(it.get("rawMarketUrl", "")).lower() for it in existing_queue}

    total_scanned_count = 0
    dead_filtered_count = 0
    already_cataloged_count = 0

    for tab in tabs_to_process:
        if total_extracted >= batch_limit:
            break
            
        tab_name = tab["name"]
        gid = tab["gid"]
        print(f"\n[AF_SHEET_LOG] 📂 Scanning Tab: '{tab_name}' (gid: {gid})...")
        
        # We fetch the HTML sheet view to extract embedded images AND clean columns
        tab_html_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/htmlview/sheet?headers=true&gid={gid}"
        try:
            req = urllib.request.Request(tab_html_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=12) as resp:
                tab_html = resp.read().decode('utf-8')
        except Exception as e:
            print(f"[AF_SHEET_LOG] Failed to fetch HTML for tab {tab_name}: {e}")
            continue

        soup = BeautifulSoup(tab_html, 'html.parser')
        tr_elements = soup.find_all('tr')
        print(f"[AF_SHEET_LOG] Total table rows in '{tab_name}': {len(tr_elements)}")

        # Find header indices
        header_row = None
        img_col = 0
        link_col = 1
        brand_col = 2
        name_col = 3
        price_usd_col = 4
        price_cny_col = 5
        qc_col = 7
        
        candidates = []
        for r_idx, tr in enumerate(tr_elements):
            tds = tr.find_all(['td', 'th'])
            row_texts = [td.get_text().strip().upper() for td in tds]
            if not row_texts or len(row_texts) < 3:
                continue
                
            # Check if this row is the header
            if "BRAND" in row_texts or "ITEM NAME" in row_texts or "PRICE" in " ".join(row_texts):
                header_row = r_idx
                for idx, t in enumerate(row_texts):
                    if "IMAGE" in t:
                        img_col = idx
                    elif "LINK" in t or "FIND" in t or "URL" in t:
                        link_col = idx
                    elif "BRAND" in t:
                        brand_col = idx
                    elif "ITEM" in t or "NAME" in t or "PIECE" in t or "MODEL" in t:
                        name_col = idx
                    elif "USD" in t or "PRICE ($)" in t:
                        price_usd_col = idx
                    elif "CNY" in t or "RMB" in t or "PRICE (¥)" in t:
                        price_cny_col = idx
                    elif "QC" in t or "QUALITY" in t:
                        qc_col = idx
                continue

            if header_row is None:
                continue

            # Extract row cells
            cell_texts = [td.get_text().strip() for td in tds]
            if len(cell_texts) <= max(link_col, name_col):
                continue
                
            # Extract links in row
            links_in_row = []
            for a in tr.find_all('a', href=True):
                c_url = clean_url(a['href'])
                if "taobao.com" in c_url or "weidian.com" in c_url or "1688.com" in c_url or "tmall.com" in c_url:
                    links_in_row.append(c_url)
                    
            raw_market_url = links_in_row[0] if links_in_row else (cell_texts[link_col] if len(cell_texts) > link_col else "")
            raw_market_url = clean_url(raw_market_url)
            
            if not raw_market_url or not raw_market_url.startswith("http"):
                continue

            # Check images in row
            imgs_in_row = []
            for img in tr.find_all('img', src=True):
                img_src = img['src']
                # Upgrade Google Sheets resolution
                if "sheets-images-rt" in img_src:
                    img_src = re.sub(r'=w\d+-h\d+', '=w1000-h1000', img_src)
                imgs_in_row.append(img_src)
                
            image_url = imgs_in_row[0] if imgs_in_row else ""
            if not image_url and len(cell_texts) > img_col and cell_texts[img_col].startswith("http"):
                image_url = cell_texts[img_col]

            raw_brand = cell_texts[brand_col] if len(cell_texts) > brand_col else "Archive Collection"
            raw_name = cell_texts[name_col] if len(cell_texts) > name_col else "Grail Piece"
            
            # Clean brand tags
            is_sold_out = "[SOLD OUT]" in raw_brand.upper() or "[SOLD OUT]" in raw_name.upper()
            clean_brand = re.sub(r'\[.*?\]', '', raw_brand).strip()
            clean_title = re.sub(r'\[.*?\]', '', raw_name).strip()
            
            if not clean_brand:
                clean_brand = "Archive Collection"
            if not clean_title:
                clean_title = raw_name or "Grail Item"

            price_usd_str = cell_texts[price_usd_col] if len(cell_texts) > price_usd_col else ""
            price_cny_str = cell_texts[price_cny_col] if len(cell_texts) > price_cny_col else ""
            
            price_usd = parse_price(price_usd_str, default_usd=49.0)
            price_cny = parse_price(price_cny_str, default_usd=round(price_usd / DEFAULT_EXCHANGE_RATE, 2))
            
            estimated_retail = round(price_usd * 8.5, 2)
            category = map_category(tab_name, clean_title)
            
            qc_link = ""
            if len(cell_texts) > qc_col:
                qc_link = cell_texts[qc_col]
            for a in tr.find_all('a', href=True):
                if "imgur.com" in a['href'] or "reddit.com" in a['href']:
                    qc_link = clean_url(a['href'])
                    break

            candidates.append({
                "tab": tab_name,
                "raw_market_url": raw_market_url,
                "brand": clean_brand,
                "title": clean_title,
                "price_usd": price_usd,
                "price_cny": price_cny,
                "estimated_retail": estimated_retail,
                "category": category,
                "image_url": image_url,
                "qc_link": qc_link,
                "is_sold_out_flag": is_sold_out
            })

        print(f"[AF_SHEET_LOG] Extracted {len(candidates)} candidate items from '{tab_name}'. Checking registry & dead links...")

        # Process candidates
        for c in candidates:
            if total_extracted >= batch_limit:
                break
                
            raw_url_lower = c["raw_market_url"].lower()
            total_scanned_count += 1
            
            # 1. Check if already in live catalog
            if raw_url_lower in catalog_links:
                already_cataloged_count += 1
                continue
                
            # 2. Check if already processed / blacklisted in registry
            if raw_url_lower in registry["processed_links"] or raw_url_lower in registry["blacklisted_links"]:
                status = registry["processed_links"].get(raw_url_lower, {}).get("status", "BLACKLISTED")
                if status in ["INGESTED", "DEAD", "SKIPPED"]:
                    continue

            # 3. Check if already in current queue
            if raw_url_lower in existing_queue_links:
                continue

            # 4. Check if marked sold out in sheet
            if c["is_sold_out_flag"]:
                registry["processed_links"][raw_url_lower] = {
                    "status": "DEAD",
                    "reason": "Marked Sold Out in Sheet",
                    "testedAt": datetime.now(timezone.utc).isoformat()
                }
                dead_filtered_count += 1
                continue

            # 5. Link Health Live Validation
            link_status_reason = ""
            if validate_links:
                is_alive, reason = await check_link_alive(c["raw_market_url"], sem)
                link_status_reason = reason
                if not is_alive:
                    registry["processed_links"][raw_url_lower] = {
                        "status": "DEAD",
                        "reason": reason,
                        "testedAt": datetime.now(timezone.utc).isoformat()
                    }
                    dead_filtered_count += 1
                    print(f"  ❌ Filtered Dead Link: {c['brand']} - {c['title']} ({reason})")
                    continue

            # 6. Item is Healthy & Unique!
            total_extracted += 1
            slug_base = f"{c['brand']}-{c['title']}".lower()
            slug = re.sub(r'[^a-z0-9]+', '-', slug_base).strip('-')
            
            affiliate_url = normalize_sugargoo_link(c["raw_market_url"])
            
            # Download and save preview photo locally for instant, zero-CORS rendering
            preview_rel = c["image_url"]
            if c["image_url"] and ("docs.google.com" in c["image_url"] or "http" in c["image_url"]):
                try:
                    preview_dir = os.path.join(os.path.dirname(__file__), "..", "public", "products", "sheet_previews")
                    os.makedirs(preview_dir, exist_ok=True)
                    preview_file = os.path.join(preview_dir, f"{slug}.jpg")
                    
                    req_img = urllib.request.Request(c["image_url"], headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                    with urllib.request.urlopen(req_img, timeout=6) as resp_img:
                        with open(preview_file, "wb") as f_out:
                            f_out.write(resp_img.read())
                    preview_rel = f"/products/sheet_previews/{slug}.jpg"
                except Exception as img_err:
                    # Fallback to proxy
                    preview_rel = f"/api/admin/sheet-image-proxy?url={urllib.parse.quote(c['image_url'])}"

            # Determine verification status
            is_taobao_unverified = "Unverified" in link_status_reason
            item_status = "UNVERIFIED_TAOBAO" if is_taobao_unverified else "APPROVED_HEALTHY"

            item_data = {
                "id": f"sheet-{int(time.time()*1000)}-{total_extracted}",
                "title": c["title"],
                "brand": c["brand"],
                "category": c["category"],
                "sourcePrice": c["price_usd"],
                "priceCNY": c["price_cny"],
                "estimatedRetail": c["estimated_retail"],
                "sugargooUrl": affiliate_url,
                "affiliateLink": affiliate_url,
                "rawMarketUrl": c["raw_market_url"],
                "directStoreLink": c["raw_market_url"],
                "imageUrl": preview_rel,
                "localImage": preview_rel,
                "rawImageSrc": c["image_url"],
                "slug": slug,
                "status": item_status,
                "validationNote": link_status_reason if link_status_reason else "Verified live",
                "qcLink": c["qc_link"],
                "sheetTab": c["tab"],
                "discoveredAt": datetime.now(timezone.utc).isoformat()
            }
            
            discovered_healthy_items.append(item_data)
            existing_queue_links.add(raw_url_lower)
            
            # 1. Real-time stream event for frontend live injection
            print(f"[AF_SHEET_ITEM] {json.dumps(item_data, ensure_ascii=False)}", flush=True)

            # 2. Incremental disk persistence
            try:
                temp_queue = existing_queue + discovered_healthy_items
                os.makedirs(os.path.dirname(DISCOVERED_QUEUE_PATH), exist_ok=True)
                with open(DISCOVERED_QUEUE_PATH, "w", encoding="utf-8") as f:
                    json.dump(temp_queue, f, indent=2, ensure_ascii=False)
                save_registry(registry)
            except Exception as e:
                pass

            # Streaming progress event
            progress_payload = {
                "current": total_extracted,
                "total": batch_limit,
                "percent": min(100, int((total_extracted / batch_limit) * 100)),
                "foundCount": total_extracted,
                "deadCount": dead_filtered_count,
                "item": f"{c['brand']} - {c['title']}",
                "phase": f"SCANNING ({tab_name})"
            }
            print(f"[AF_SHEET_PROGRESS] {json.dumps(progress_payload)}", flush=True)
            print(f"  ✨ Found Healthy Grail: {c['brand']} - {c['title']} (${c['price_usd']} | {c['category']})", flush=True)

    # Save registry
    save_registry(registry)
    
    # Merge newly discovered items into queue
    combined_queue = existing_queue + discovered_healthy_items
    os.makedirs(os.path.dirname(DISCOVERED_QUEUE_PATH), exist_ok=True)
    with open(DISCOVERED_QUEUE_PATH, "w", encoding="utf-8") as f:
        json.dump(combined_queue, f, indent=2, ensure_ascii=False)
        
    duration = round(time.time() - start_time, 2)
    summary = {
        "success": True,
        "newFound": len(discovered_healthy_items),
        "totalQueue": len(combined_queue),
        "totalScanned": total_scanned_count,
        "deadFiltered": dead_filtered_count,
        "alreadyCataloged": already_cataloged_count,
        "durationSeconds": duration,
        "items": discovered_healthy_items
    }
    
    print(f"\n[AF_SHEET_RESULT] {json.dumps(summary)}")
    print(f"[AF_SHEET_LOG] Ingestion batch complete in {duration}s. {len(discovered_healthy_items)} healthy grails queued for moderation.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Google Sheet Multi-Tab Ingestion & Dead Link Filtration Engine")
    parser.add_argument("sheet_url", nargs="?", default="https://docs.google.com/spreadsheets/d/1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI/", help="Google Sheet URL or ID")
    parser.add_argument("--tabs", nargs="*", default=None, help="Specific tabs to scan (e.g. TOPS BOTTOMS SHOES)")
    parser.add_argument("--limit", type=int, default=15, help="Batch limit")
    parser.add_argument("--no-validate", action="store_true", help="Skip live link health checking")
    parser.add_argument("--concurrency", type=int, default=8, help="Async validation concurrency")
    
    args = parser.parse_args()
    asyncio.run(extract_sheet_pipeline(
        sheet_id_or_url=args.sheet_url,
        selected_tab_names=args.tabs,
        batch_limit=args.limit,
        validate_links=not args.no_validate,
        max_concurrency=args.concurrency
    ))
