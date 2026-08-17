import os
import sys
import re
import json
import time
import asyncio
import urllib.parse
import urllib.request
from PIL import Image
import requests
from playwright.async_api import async_playwright
from product_identifier import identify_product_metadata, resolve_exact_source_price, LUXURY_BRANDS
from image_cutout_pipeline import process_and_cutout_image, fetch_marketplace_store_photos
from job_logger import log_job

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

AFFILIATE_MEMBER_ID = "1325437696506389977"
SHEET_PRODUCTS_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "sheetProducts.json")
PRODUCTS_IMG_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "products")
HISTORY_FILE = os.path.join(os.path.dirname(__file__), "..", "scratch", "reddit_scanner_history.json")

def load_scanner_history() -> dict:
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "scanned_reddit_posts": [],
        "blacklisted_links": [],
        "blacklisted_titles": []
    }

def save_scanner_history(history: dict):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

def emit_progress(percent: int, message: str, current: int, total: int, found_count: int, phase: str = "SCANNING", item: str = ""):
    data = {
        "percent": max(0, min(100, int(percent))),
        "message": message,
        "current": current,
        "total": total,
        "foundCount": found_count,
        "phase": phase,
        "item": item
    }
    print(f"[AF_PROGRESS] {json.dumps(data)}", flush=True)


# Synchronized Luxury Brands Dictionary
KNOWN_BRANDS = LUXURY_BRANDS

CATEGORY_KEYWORDS = {
    "Outerwear": ["jacket", "bomber", "coat", "parka", "puffer", "windbreaker", "leather jacket", "blazer", "cardigan", "knit", "sweater", "vest"],
    "Hoodies": ["hoodie", "zip-up", "zip up", "pullover", "sweatshirt"],
    "Denim": ["jeans", "denim", "pants", "trousers", "cords", "sweatpants", "cargo", "shorts", "banana", "bolan", "tyrone"],
    "T-Shirts": ["tee", "t-shirt", "tshirt", "tank", "longsleeve", "jersey", "top", "shirt"],
    "Footwear": ["shoes", "boots", "sneakers", "derbies", "loafers", "vans", "vns", "ramones", "geobasket", "tabi", "3xl", "defender", "strikes", "kiss boot", "gat"],
    "Jewelry": ["ring", "necklace", "pendant", "bracelet", "chain", "earring", "cross", "wallet chain"],
    "Accessories": ["bag", "backpack", "tote", "hat", "beanie", "cap", "belt", "sunglasses", "glasses", "scarf", "wallet", "shades", "frames"]
}

IGNORE_TITLES = [
    "megathread", "rules", "discord", "seller ban", "easter mega", "winner", "essential guide",
    "blowjob", "nsfw", "porn", "hentai", "shitpost", "meme", "scam", "drama", "giveaway", "mod post", "gifs"
]

def verify_market_link_live(raw_url: str) -> tuple[bool, str]:
    clean_target = resolve_and_clean_market_url(raw_url)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    }
    try:
        resp = requests.get(clean_target, headers=headers, timeout=6, allow_redirects=True)
        if resp.status_code in [404, 410]:
            return False, f"HTTP {resp.status_code} Not Found"
        
        text = resp.text
        delisted_keywords = [
            "商品已经下架", "商品已下架", "宝贝不存在", "item not found", 
            "item deleted", "404 Not Found", "此商品不存在", "已下架", 
            "该宝贝不存在", "已被删除", "违规下架", "error-notice"
        ]
        if any(kw in text for kw in delisted_keywords):
            return False, "Marketplace item delisted / out of stock"
            
        if "item_offline" in resp.url or "error1.html" in resp.url:
            return False, "Taobao item offline redirect"
            
        return True, "Active"
    except Exception as e:
        return True, f"Network pass: {e}"

def is_valid_grail_image(image_path: str) -> tuple[bool, str]:
    if not os.path.exists(image_path):
        return False, "Image file not found"
    try:
        with Image.open(image_path) as img:
            if img.width < 100 or img.height < 100:
                return False, f"Image dimensions too small ({img.width}x{img.height})"
                
            if img.mode == "RGBA":
                bbox = img.getbbox()
                if not bbox:
                    return False, "Empty canvas with 0 visible pixels"
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
                if w < 60 or h < 60:
                    return False, f"Cutout content too small ({w}x{h})"
                    
            rgb = img.convert("RGB")
            small = rgb.resize((50, 50))
            pixels = list(small.getdata())
            
            # Check for totally black / dark frames
            total_lum = sum((r * 0.299 + g * 0.587 + b * 0.114) for r, g, b in pixels)
            avg_lum = total_lum / len(pixels)
            if avg_lum < 9.0:
                return False, f"Image is completely dark/black (avg lum: {avg_lum:.1f})"
                
            return True, "Valid"
    except Exception as e:
        return False, f"Image check exception: {e}"


def clean_text_and_extract_links(text: str) -> list[str]:
    """
    De-obfuscate Reddit text and extract clean Taobao, Weidian, 1688, Yupoo links.
    """
    if not text:
        return []
    
    cleaned = text
    cleaned = re.sub(r'\s*\(\s*dot\s*\)\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\[\s*dot\s*\]\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\{\s*dot\s*\}\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\(\s*\.\s*\)\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'(\w+)\s*\.\s*(\w+)', r'\1.\2', cleaned)
    cleaned = re.sub(r'https?\s*:\s*/\s*/\s*', 'https://', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'item\s*\.\s*taobao\s*\.\s*com', 'item.taobao.com', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'weidian\s*\.\s*com', 'weidian.com', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'detail\s*\.\s*1688\s*\.\s*com', 'detail.1688.com', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'detail\s*\.\s*tmall\s*\.\s*com', 'detail.tmall.com', cleaned, flags=re.IGNORECASE)

    patterns = [
        r'https?://[^\s"\'<>()]+(?:item\.taobao\.com|weidian\.com|detail\.1688\.com|detail\.tmall\.com|k\.youshop10\.com|x\.yupoo\.com)[^\s"\'<>()]*',
        r'(?:item\.taobao\.com|weidian\.com|detail\.1688\.com|detail\.tmall\.com|k\.youshop10\.com|x\.yupoo\.com)[^\s"\'<>()]+'
    ]
    
    links = []
    for pat in patterns:
        matches = re.findall(pat, cleaned, re.IGNORECASE)
        for m in matches:
            m = m.rstrip('.,;:)!?"\'')
            if not m.startswith('http'):
                m = 'https://' + m
            links.append(m)
            
    return list(dict.fromkeys(links))

def resolve_and_clean_market_url(raw_url: str) -> str:
    cleaned = raw_url.strip()
    if not cleaned.startswith("http"):
        cleaned = "https://" + cleaned
    # Expand Weidian short links
    if "k.youshop10.com" in cleaned:
        try:
            req = urllib.request.Request(cleaned, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=5) as response:
                cleaned = response.geturl()
        except Exception:
            pass
    return cleaned

def convert_to_sugargoo_affiliate(raw_url: str) -> str:
    clean_target = resolve_and_clean_market_url(raw_url)
    encoded = urllib.parse.quote(clean_target, safe="")
    return f"https://www.sugargoo.com/products?productLink={encoded}&memberId={AFFILIATE_MEMBER_ID}"

def detect_brand(text: str) -> str:
    text_lower = text.lower()
    for brand, synonyms in KNOWN_BRANDS:
        for syn in synonyms:
            if re.search(r'\b' + re.escape(syn) + r'\b', text_lower):
                return brand
    return "Archive Collection"

def detect_category(text: str) -> str:
    text_lower = text.lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        for kw in kws:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                return cat
    return "Outerwear"

def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:60]


def parse_multi_item_post(title: str, body_text: str, comments: list[str], post_images: list[str]) -> list[dict]:
    """
    Intelligently extracts each piece from Single-Find, Haul, or Multi-Item Gallery posts.
    Maps line-by-line comment clues to the correct marketplace link and gallery image.
    """
    candidates = []
    seen_links = set()

    all_lines = []
    if body_text:
        all_lines.extend(body_text.split('\n'))
    for c in comments:
        all_lines.extend(c.split('\n'))

    # 1. Line-by-Line / Paragraph Matching
    for line in all_lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        line_links = clean_text_and_extract_links(line_clean)
        for link in line_links:
            clean_l = resolve_and_clean_market_url(link)
            if clean_l.lower() in seen_links:
                continue
            seen_links.add(clean_l.lower())

            # Extract surrounding text as title hint
            title_hint = line_clean
            for l in line_links:
                title_hint = title_hint.replace(l, ' ')
            title_hint = re.sub(r'https?://\S+', ' ', title_hint)
            title_hint = re.sub(r'\[.*?\]|\(.*?\)|【.*?】', ' ', title_hint)
            title_hint = re.sub(r'^\s*[\d\.\-\:\*\#]+\s*', ' ', title_hint).strip()
            
            clean_sub_hint = re.sub(r'\b(w2c|link|wtc|item|pic|here|buy|for)\b', '', title_hint, flags=re.IGNORECASE).strip(' :-\t\r\n.,#')

            # Check if there was a numbered index like '1.', 'Pic 2', 'Image 3', '#4'
            img_index = None
            num_match = re.search(r'^(?:#|pic|img|image|item|slide)?\s*(\d+)[\.\:\-\s]', line_clean, re.IGNORECASE)
            if num_match:
                try:
                    idx = int(num_match.group(1)) - 1
                    if 0 <= idx < len(post_images):
                        img_index = idx
                except Exception:
                    pass

            assigned_img = post_images[img_index] if (img_index is not None and img_index < len(post_images)) else (
                post_images[len(candidates)] if len(candidates) < len(post_images) else (post_images[0] if post_images else "")
            )

            # If title hint is too short or generic, augment with post title
            if len(clean_sub_hint.split()) < 2:
                title_hint = f"{title}" if len(line_links) == 1 else f"{title} (Piece {len(candidates) + 1})"

            candidates.append({
                "market_link": clean_l,
                "title_hint": title_hint,
                "image_src": assigned_img,
                "item_index": len(candidates) + 1
            })

    # 2. Fallback: Full Text Link Scan if no line matches were produced
    if not candidates:
        full_text = f"{title} {body_text} " + " ".join(comments)
        general_links = clean_text_and_extract_links(full_text)
        for g_idx, g_link in enumerate(general_links):
            clean_gl = resolve_and_clean_market_url(g_link)
            if clean_gl.lower() in seen_links:
                continue
            seen_links.add(clean_gl.lower())
            assigned_img = post_images[g_idx] if g_idx < len(post_images) else (post_images[0] if post_images else "")
            candidates.append({
                "market_link": clean_gl,
                "title_hint": f"{title} (Piece {g_idx + 1})" if len(general_links) > 1 else title,
                "image_src": assigned_img,
                "item_index": g_idx + 1
            })

    return candidates


async def scan_qualityreps(max_posts: int = 25, auto_add: bool = False):
    print(f"=== STARTING HIGH-YIELD REDDIT ARCHIVE SCANNER (Target: {max_posts} Grails) ===", flush=True)
    
    with open(SHEET_PRODUCTS_PATH, "r", encoding="utf-8") as f:
        existing_products = json.load(f)
        
    existing_urls = set()
    for p in existing_products:
        if p.get("sugargooUrl"):
            existing_urls.add(p.get("sugargooUrl", "").lower())
        if p.get("affiliateLink"):
            existing_urls.add(p.get("affiliateLink", "").lower())
        if p.get("rawMarketUrl"):
            existing_urls.add(p.get("rawMarketUrl", "").lower())

    scanner_history = load_scanner_history()
    scanned_posts_set = set(scanner_history.get("scanned_reddit_posts", []))
    blacklisted_links_set = set(scanner_history.get("blacklisted_links", []))

    discovered_items = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # Expanded multi-subreddit feeds & high-yield search matrix
        dynamic_feeds = [
            # 1. Finds & Direct Releases
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3AFIND+OR+flair%3AGRAIL&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3ARELEASE&sort=new",
            # 2. Hauls & In-Hand Reviews (High multi-piece volume)
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3AHAUL+OR+flair%3AREVIEW&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3AQC&sort=new",
            # 3. DesignerReps Finds & Reviews
            "https://www.reddit.com/r/DesignerReps/search/?q=flair%3AFIND+OR+flair%3AREVIEW+OR+flair%3AHAUL&sort=new",
            # 4. Designer Brand Searches with Store Links
            "https://www.reddit.com/r/QualityReps/search/?q=(Rick+Owens+OR+DRKSHDW)+(weidian+OR+taobao+OR+1688)&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=(Enfants+Riches+Deprimes+OR+ERD)+(weidian+OR+taobao)&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=(Balenciaga+OR+BLCG)+(weidian+OR+taobao+OR+1688)&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=(Chrome+Hearts+OR+CH)+(weidian+OR+taobao+OR+1688)&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=(Undercover+OR+Vetements+OR+Margiela)+(weidian+OR+taobao)&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=(Number+Nine+OR+Kapital+OR+Raf+Simons)+(weidian+OR+taobao)&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=(Acne+Studios+OR+CCP+OR+Kiko)+(weidian+OR+taobao)&sort=new",
            # 5. Live Latest Subreddit Chronological Feed
            "https://www.reddit.com/r/QualityReps/new/",
            "https://www.reddit.com/r/DesignerReps/new/"
        ]
        
        post_links = []
        emit_progress(3, "Connecting stealth browser to high-yield Grail feeds...", 0, max_posts, 0, "INIT")
        
        for u_idx, u in enumerate(dynamic_feeds):
            feed_pct = int(4 + (u_idx / len(dynamic_feeds)) * 14)
            feed_name = u.split('?')[0].replace("https://www.reddit.com/r/", "r/")
            emit_progress(feed_pct, f"Crawling feed ({u_idx+1}/{len(dynamic_feeds)}): {feed_name}...", 0, max_posts, 0, "FEED_FETCH")
            print(f"Fetching feed: {u}", flush=True)
            try:
                await page.goto(u, timeout=30000)
                await page.wait_for_timeout(2000)
                # Scroll down to load dynamic posts
                for _ in range(4):
                    await page.keyboard.press("PageDown")
                    await page.wait_for_timeout(600)
                    
                links = await page.evaluate('''() => {
                    const anchors = Array.from(document.querySelectorAll('a[href*="/comments/"]'));
                    const urls = anchors.map(a => {
                        try {
                            const u = new URL(a.href);
                            return u.origin + u.pathname;
                        } catch(e) {
                            return a.href.split('?')[0];
                        }
                    }).filter(href => href.includes('/comments/') && !href.includes('/comment/'));
                    return Array.from(new Set(urls));
                }''')
                for l in links:
                    if l not in post_links and l not in scanned_posts_set:
                        post_links.append(l)
            except Exception as e:
                print(f"Error fetching feed {u}: {e}", flush=True)
                
        emit_progress(18, f"Extracted {len(post_links)} unseen candidate threads. Starting deep Haul & Find extraction...", 0, max_posts, 0, "CANDIDATE_POOL")
        print(f"Found {len(post_links)} unseen candidate threads. Processing...", flush=True)

        valid_count = 0
        total_eval_target = min(len(post_links), max_posts * 4)
        
        for idx, post_url in enumerate(post_links):
            if valid_count >= max_posts:
                break
                
            if post_url in scanned_posts_set:
                continue
                
            # Record post as scanned
            scanned_posts_set.add(post_url)
            scanner_history["scanned_reddit_posts"] = list(scanned_posts_set)[-1500:]
            save_scanner_history(scanner_history)

            progress_base = 20 + int((idx / max(1, total_eval_target)) * 75)
            progress_base = min(95, progress_base)
            
            emit_progress(progress_base, f"Inspecting thread [{idx+1}/{len(post_links)}]: resolving comments & gallery...", idx+1, max_posts, valid_count, "INSPECT_POST")
            print(f"\n--- [{idx+1}/{len(post_links)}] Inspecting {post_url} ---", flush=True)
            
            post_page = await context.new_page()
            try:
                await post_page.goto(post_url, timeout=25000)
                await post_page.wait_for_timeout(2000)
                
                title_el = await post_page.query_selector("h1")
                title = (await title_el.inner_text()).strip() if title_el else ""
                
                if any(ig in title.lower() for ig in IGNORE_TITLES):
                    print(f"Skipping ignored topic thread: '{title}'", flush=True)
                    continue

                body_el = await post_page.query_selector("shreddit-post, div[data-testid='post-container']")
                body_text = (await body_el.inner_text()) if body_el else ""
                
                # Extract all comments list for context and link clues
                comments_list = await post_page.eval_on_selector_all(
                    "shreddit-comment p, div[data-testid='comment'] p",
                    "els => els.map(e => e.innerText || '').filter(t => t.length > 3)"
                )
                
                # Extract all post & gallery images
                raw_post_images = await post_page.eval_on_selector_all(
                    "img[src*='preview.redd.it'], img[src*='i.redd.it'], shreddit-gallery-carousel img, div[data-testid='post-container'] img",
                    "els => els.map(e => e.src)"
                )
                
                clean_post_images = []
                for img in raw_post_images:
                    if not any(bad in img.lower() for bad in ["snoo", "snoovatar", "avatar", "badge", "award", "marketing", "icon", "upvote", "downvote"]):
                        clean_img = img.replace("&amp;", "&")
                        if clean_img not in clean_post_images:
                            clean_post_images.append(clean_img)

                # Parse multi-item haul / single find
                candidates = parse_multi_item_post(title, body_text, comments_list, clean_post_images)
                
                if not candidates:
                    print(f"No marketplace store links found for '{title}'.", flush=True)
                    continue

                print(f"-> Detected {len(candidates)} candidate item(s) in thread '{title}'", flush=True)

                # Process each item in the haul/post (up to 8 items per thread)
                for item_candidate in candidates[:8]:
                    if valid_count >= max_posts:
                        break

                    market_link = item_candidate["market_link"]
                    title_hint = item_candidate["title_hint"]
                    candidate_img = item_candidate["image_src"]
                    
                    # 1. Validate Marketplace URL format
                    is_valid_market_link = (
                        ("weidian.com" in market_link and ("itemid" in market_link.lower() or "item.html?id=" in market_link.lower())) or
                        ("taobao.com" in market_link and "id=" in market_link.lower()) or
                        ("tmall.com" in market_link and "id=" in market_link.lower()) or
                        ("1688.com" in market_link and ("offer/" in market_link.lower() or "detail/" in market_link.lower()))
                    )
                    if not is_valid_market_link:
                        print(f"Skipping non-product market link: {market_link}", flush=True)
                        continue

                    if market_link.lower() in blacklisted_links_set:
                        print(f"Skipping blacklisted market link: {market_link}", flush=True)
                        continue

                    affiliate_link = convert_to_sugargoo_affiliate(market_link)
                    if affiliate_link.lower() in existing_urls:
                        print(f"Piece already exists in catalog: {market_link}", flush=True)
                        continue

                    # 2. Live Store Listing Availability Check
                    is_live, live_msg = verify_market_link_live(market_link)
                    if not is_live:
                        print(f"Skipping dead/delisted listing ({live_msg}): {market_link}", flush=True)
                        blacklisted_links_set.add(market_link.lower())
                        scanner_history["blacklisted_links"] = list(blacklisted_links_set)[-1500:]
                        save_scanner_history(scanner_history)
                        continue

                    # 3. Model Identification & Brand Resolution
                    emit_progress(progress_base + 1, f"Fashion Lens: Identifying '{title_hint[:35]}...'", idx+1, max_posts, valid_count, "MODEL_ID", title_hint)
                    identified = identify_product_metadata(title_hint, comments=comments_list, market_url=market_link)
                    
                    brand = identified.get("brand") or detect_brand(title_hint + " " + title + " " + body_text)
                    canonical_title = identified.get("canonicalTitle") or title_hint
                    canonical_title = re.sub(r'\[.*?\]|\(.*?\)|QC|FIND|W2C|LC|RELEASE|REVIEW|HAUL', '', canonical_title).strip()
                    
                    if brand in ["Archive Collection", "Archive Finds", "General"] or "Archive Piece" in canonical_title:
                        # Try detecting from full thread text
                        brand_retry = detect_brand(title + " " + body_text + " " + " ".join(comments_list))
                        if brand_retry != "Archive Collection":
                            brand = brand_retry
                            canonical_title = f"{brand} {canonical_title.replace('Archive Piece', '').strip()}".strip()
                        else:
                            print(f"Skipping unverified non-designer item: '{canonical_title}'", flush=True)
                            continue

                    # Deduplication check by Brand + Title
                    existing_titles = {
                        (p.get("brand", "").lower().strip(), p.get("name", "").lower().strip())
                        for p in existing_products + discovered_items
                    }
                    if (brand.lower().strip(), canonical_title.lower().strip()) in existing_titles:
                        print(f"Skipping duplicate piece in catalog: {brand} - {canonical_title}", flush=True)
                        continue

                    category = identified.get("category") or detect_category(canonical_title + " " + title_hint)
                    season = identified.get("season", "")

                    # 4. Live Sugargoo Price Resolution
                    price = resolve_exact_source_price(market_link, f"{title_hint} {title}", category)
                    estimated_retail = identified.get("estimatedRetail") or round(price * 8.5, 0)
                    if estimated_retail < price * 2:
                        estimated_retail = round(price * 5.0, 0)

                    slug = slugify(f"{brand}-{canonical_title}-{int(time.time()) % 10000 + item_candidate['item_index']}")
                    item_id = str(len(existing_products) + len(discovered_items) + 1)

                    # 5. Image Sourcing: Priority 1 = Direct Seller Studio Photos, Priority 2 = Post Gallery Photo
                    store_photos = fetch_marketplace_store_photos(market_link)
                    img_src = store_photos[0] if store_photos else (candidate_img if candidate_img else "")
                    
                    if not img_src:
                        print(f"Skipping item with no authentic photo: '{canonical_title}'", flush=True)
                        continue

                    item = {
                        "id": item_id,
                        "title": canonical_title,
                        "name": canonical_title,
                        "brand": brand,
                        "brandSlug": slugify(brand),
                        "category": category,
                        "categorySlug": slugify(category),
                        "season": season,
                        "era": season if season else "2020s",
                        "style": "Avant-Garde",
                        "price": price,
                        "sourcePrice": price,
                        "currency": "USD",
                        "estimatedRetail": estimated_retail,
                        "sugargooUrl": affiliate_link,
                        "affiliateLink": affiliate_link,
                        "affiliateUrl": affiliate_link,
                        "rawMarketUrl": market_link,
                        "directStoreLink": market_link,
                        "redditPostUrl": post_url,
                        "localImage": f"/products/{slug}.png",
                        "imageUrl": f"/products/{slug}.png",
                        "slug": slug,
                        "status": "APPROVED" if auto_add else "DISCOVERED",
                        "verified": True,
                        "isFeatured": True,
                        "isRare": True if (price > 75 or "rare" in title.lower()) else False,
                        "description": f"Authentic {brand} archive piece ({canonical_title}). Sourced directly from collector listings.",
                        "tags": [slugify(brand), slugify(category), "archive", "grail"],
                        "rawImageSrc": img_src,
                        "notes": f"Auto-sourced from r/QualityReps ({post_url})"
                    }

                    # 6. High-Precision Studio Cutout Generation
                    out_png = os.path.join(PRODUCTS_IMG_DIR, f"{slug}.png")
                    emit_progress(progress_base + 2, f"Studio Flat-Lay Cutout: {brand} {canonical_title[:28]}", idx+1, max_posts, valid_count, "AI_PROCESSING", canonical_title)
                    print(f"Generating AI cutout for {slug} (with fallback '{brand} {canonical_title}')...", flush=True)
                    
                    success = process_and_cutout_image(img_src, out_png, query_fallback=f"{brand} {canonical_title}", market_url=market_link)
                    if not success or not os.path.exists(out_png):
                        print(f"[REJECTED] Cutout failed or image invalid for: '{canonical_title}'", flush=True)
                        continue

                    # Validate cutout quality
                    is_valid_img, img_err = is_valid_grail_image(out_png)
                    if not is_valid_img:
                        print(f"[REJECTED] Image quality failed ({img_err}) for: '{canonical_title}'", flush=True)
                        try:
                            if os.path.exists(out_png):
                                os.remove(out_png)
                        except Exception:
                            pass
                        continue

                    # 7. Save to Discovered List & Cache
                    discovered_items.append(item)
                    valid_count += 1

                    cache_dir = os.path.join(os.path.dirname(__file__), "..", "scratch")
                    os.makedirs(cache_dir, exist_ok=True)
                    cache_file = os.path.join(cache_dir, "discovered_qualityreps_finds.json")
                    cached_list = []
                    if os.path.exists(cache_file):
                        try:
                            with open(cache_file, "r", encoding="utf-8") as f:
                                cached_list = json.load(f)
                        except Exception:
                            pass
                    if not any(c.get("slug") == item["slug"] for c in cached_list):
                        cached_list.insert(0, item)
                    with open(cache_file, "w", encoding="utf-8") as f:
                        json.dump(cached_list, f, indent=2)

                    # 8. Real-Time Discovered Item Event to SSE stream
                    print(f"[AF_ITEM_DISCOVERED] {json.dumps(item)}", flush=True)
                    emit_progress(progress_base + 3, f"✓ Verified Grail added: {brand} - {canonical_title} (${price})", idx+1, max_posts, valid_count, "ITEM_SAVED", canonical_title)
                    print(f"[VERIFIED #{valid_count}] {item['title']} | ${price} (Retail: ${estimated_retail}) | {market_link}", flush=True)

            except Exception as e:
                print(f"Error scraping {post_url}: {e}", flush=True)
            finally:
                await post_page.close()
                
        await browser.close()

    emit_progress(100, f"Scan finished! Discovered {len(discovered_items)} high-quality Grails.", max_posts, max_posts, len(discovered_items), "COMPLETE")
    print(f"\n=== SCAN FINISHED: Discovered {len(discovered_items)} high-quality pieces ===", flush=True)
    
    # Final cache update
    cache_dir = os.path.join(os.path.dirname(__file__), "..", "scratch")
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, "discovered_qualityreps_finds.json")
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(discovered_items, f, indent=2)
    print(f"Cached discovered items in {cache_file}", flush=True)

    if auto_add and discovered_items:
        print("Appending new items to sheetProducts.json...", flush=True)
        for it in discovered_items:
            existing_products.append(it)
        with open(SHEET_PRODUCTS_PATH, "w", encoding="utf-8") as f:
            json.dump(existing_products, f, indent=2)
        print(f"Updated {SHEET_PRODUCTS_PATH} with {len(existing_products)} total products!", flush=True)
        
        print("Triggering multi-style slide generator...", flush=True)
        os.system("node scripts/generate_all_slide_styles.js")

    return discovered_items


if __name__ == "__main__":
    auto = "--auto" in sys.argv
    limit = 25
    for arg in sys.argv:
        if arg.startswith("--limit="):
            limit = int(arg.split("=")[1])
        elif arg.isdigit():
            limit = int(arg)
    asyncio.run(scan_qualityreps(max_posts=limit, auto_add=auto))
