import os
import sys
import re
import json
import time
import asyncio
import urllib.parse
from PIL import Image
import rembg
from playwright.async_api import async_playwright
from product_identifier import identify_product_metadata

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



# Known Designer & Archive Brands Dictionary for accurate tagging
KNOWN_BRANDS = [
    ("Enfants Riches Déprimés", ["erd", "enfants riches deprimes", "enfants riches déprimés", "enfants"]),
    ("Rick Owens", ["rick owens", "rick", "drkshdw", "geobasket", "ramones", "geth", "tyrone", "bolan", "dunk", "vns", "vans", "ro"]),
    ("Chrome Hearts", ["chrome hearts", "chrome", "ch", "matty boy", "dagger"]),
    ("Balenciaga", ["balenciaga", "blcg", "bb", "steroid", "defender", "strike", "3xl", "cargo"]),
    ("Undercover", ["undercover", "uc", "jun takahashi", "scab", "85", "68", "arts and crafts", "guruguru"]),
    ("Vetements", ["vetements", "vet", "demna", "tfd", "total fucking darkness", "may the bridges", "bridges"]),
    ("Maison Margiela", ["maison margiela", "margiela", "mm6", "tabi", "gats", "german army trainer"]),
    ("Vivienne Westwood", ["vivienne westwood", "vivienne", "westwood", "orb"]),
    ("Dior", ["dior", "hedi slimane", "hedi", "dior homme", "clawmark", "cummerbund", "bleu clair", "strip"]),
    ("Number (N)ine", ["number (n)ine", "number nine", "number (n) nine", "n(n)", "nn", "takahiro miyashita", "school of visual comedy", "touch me im sick"]),
    ("Saint Michael", ["saint michael", "saint mxxxxxx", "saint m"]),
    ("Prada", ["prada", "prada sport", "linea rossa"]),
    ("Yohji Yamamoto", ["yohji yamamoto", "yohji", "pour homme", "y's"]),
    ("Alyx", ["alyx", "1017 alyx 9sm", "matthew williams"]),
    ("Junya Watanabe", ["junya watanabe", "junya", "comme des garcons", "cdg"]),
    ("Raf Simons", ["raf simons", "raf", "riot riot riot", "consumed", "virginia creeper", "closer", "poltergeist", "nebraska"]),
    ("Bottega Veneta", ["bottega veneta", "bottega", "bv", "tire boot", "puddle"]),
    ("Acne Studios", ["acne studios", "acne", "1981m", "1989", "super baggy"]),
    ("Miu Miu", ["miu miu", "miumiu"]),
    ("Kapital", ["kapital", "bone", "skeleton", "damask"]),
    ("Boris Bidjan Saberi", ["boris bidjan saberi", "bbs", "11 by bbs"]),
    ("Carol Christian Poell", ["carol christian poell", "ccp", "drip sneaker", "prosthetic"]),
    ("Helmut Lang", ["helmut lang", "helmut", "painter denim", "astro"]),
]

CATEGORY_KEYWORDS = {
    "Outerwear": ["jacket", "bomber", "coat", "parka", "puffer", "windbreaker", "leather jacket", "blazer", "cardigan", "knit", "sweater"],
    "Hoodies": ["hoodie", "zip-up", "zip up", "pullover", "sweatshirt"],
    "Denim": ["jeans", "denim", "pants", "trousers", "cords", "sweatpants", "cargo", "shorts"],
    "T-Shirts": ["tee", "t-shirt", "tshirt", "tank", "longsleeve", "jersey"],
    "Footwear": ["shoes", "boots", "sneakers", "derbies", "loafers", "vans", "vns", "ramones", "geobasket", "tabi", "3xl", "defender", "strikes"],
    "Jewelry": ["ring", "necklace", "pendant", "bracelet", "chain", "earring", "cross", "wallet chain"],
    "Accessories": ["bag", "backpack", "tote", "hat", "beanie", "cap", "belt", "sunglasses", "glasses", "scarf", "wallet"]
}

IGNORE_TITLES = [
    "megathread", "rules", "discord", "seller ban", "guide", "easter mega", "announcement", "winner", "essential guide",
    "lc", "legit check", "legit-check", "is this real", "real or fake", "authentication", "can i get a lc", "please lc", 
    "help lc", "pls lc", "fitpic", "fit pic", "discussion", "question", "general question", "w2c", "where to cop", "wtc"
]


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
        r'https?://[^\s"\'<>()]+(?:item\.taobao\.com|weidian\.com|detail\.1688\.com|detail\.tmall\.com|x\.yupoo\.com)[^\s"\'<>()]*',
        r'(?:item\.taobao\.com|weidian\.com|detail\.1688\.com|detail\.tmall\.com|x\.yupoo\.com)[^\s"\'<>()]+'
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

from image_cutout_pipeline import process_and_cutout_image

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

def estimate_price(brand: str, category: str, text: str) -> float:
    yuan_match = re.search(r'(\d{2,4})\s*(?:y|yuan|rmb|¥|元)', text, re.IGNORECASE)
    if yuan_match:
        yuan = float(yuan_match.group(1))
        usd = round(yuan * 0.14, 2)
        if 10 <= usd <= 350:
            return usd
            
    usd_match = re.search(r'\$\s*(\d{2,3})', text)
    if usd_match:
        usd = float(usd_match.group(1))
        if 10 <= usd <= 350:
            return usd

    defaults = {
        "Outerwear": 89.0,
        "Hoodies": 59.0,
        "Denim": 65.0,
        "T-Shirts": 34.0,
        "Footwear": 115.0,
        "Jewelry": 42.0,
        "Accessories": 48.0
    }
    return defaults.get(category, 59.0)

def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:60]

def create_image_cutout_from_url(img_url: str, output_path: str, query_fallback: str = "") -> bool:
    return process_and_cutout_image(img_url, output_path, query_fallback=query_fallback)

async def scan_qualityreps(max_posts: int = 15, auto_add: bool = False):
    print(f"=== STARTING r/QualityReps AUTO-SCAN (Limit: {max_posts}) ===", flush=True)
    
    with open(SHEET_PRODUCTS_PATH, "r", encoding="utf-8") as f:
        existing_products = json.load(f)
        
    existing_urls = set()
    for p in existing_products:
        existing_urls.add(p.get("sugargooUrl", "").lower())
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
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # Dynamic high-yield search queries targeting actual store links and verified drops
        all_search_queries = [
            "flair%3AFIND+OR+flair%3AGRAIL",
            "flair%3AQC+OR+flair%3ARELEASE",
            "Rick+Owens+(weidian+OR+taobao+OR+1688)",
            "Chrome+Hearts+(weidian+OR+taobao+OR+1688)",
            "Enfants+Riches+Deprimes+OR+ERD+(weidian+OR+taobao)",
            "Balenciaga+(weidian+OR+taobao+OR+1688)",
            "Maison+Margiela+(weidian+OR+taobao)",
            "Undercover+OR+Scab+OR+85+(weidian+OR+taobao)",
            "Raf+Simons+OR+Consumed+OR+Riot+(weidian+OR+taobao)",
            "Carol+Christian+Poell+OR+CCP+(weidian+OR+taobao)",
            "Acne+Studios+(weidian+OR+taobao)",
            "Kapital+(weidian+OR+taobao)",
            "Vivienne+Westwood+(weidian+OR+taobao)",
            "Yohji+Yamamoto+(weidian+OR+taobao)"
        ]
        import random
        random.shuffle(all_search_queries)

        urls_to_scan = [
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3AFIND&sort=new",
            f"https://www.reddit.com/r/QualityReps/search/?q={all_search_queries[0]}&sort=new",
            f"https://www.reddit.com/r/QualityReps/search/?q={all_search_queries[1]}&sort=relevance",
            f"https://www.reddit.com/r/QualityReps/search/?q={all_search_queries[2]}&sort=top&t=year",
            f"https://www.reddit.com/r/DesignerReps/search/?q={all_search_queries[3]}&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3AFIND&sort=top&t=all"
        ]
        
        post_links = []
        emit_progress(3, "Connecting stealth browser to high-yield Grail feeds...", 0, max_posts, 0, "INIT")
        for u_idx, u in enumerate(urls_to_scan):
            feed_pct = int(5 + (u_idx / len(urls_to_scan)) * 12)
            feed_name = u.split('?')[0].replace("https://www.reddit.com/r/", "r/")
            emit_progress(feed_pct, f"Crawling feed ({u_idx+1}/{len(urls_to_scan)}): {feed_name}...", 0, max_posts, 0, "FEED_FETCH")
            print(f"Fetching feed: {u}", flush=True)
            try:
                await page.goto(u, timeout=35000)
                await page.wait_for_timeout(2500)
                # Scroll down to load more dynamic content
                for _ in range(5):
                    await page.keyboard.press("PageDown")
                    await page.wait_for_timeout(800)
                    
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
                
        emit_progress(18, f"Extracted {len(post_links)} unseen candidate posts. Starting Grail analysis...", 0, max_posts, 0, "CANDIDATE_POOL")
        print(f"Found {len(post_links)} unseen candidate posts. Processing up to {max_posts}...", flush=True)

        valid_count = 0
        total_eval_target = min(len(post_links), max_posts * 3)
        for idx, post_url in enumerate(post_links):
            if valid_count >= max_posts:
                break
                
            if post_url in scanned_posts_set:
                print(f"Skipping already scanned post (History Cache): {post_url}", flush=True)
                continue
                
            # Record post as scanned
            scanned_posts_set.add(post_url)
            scanner_history["scanned_reddit_posts"] = list(scanned_posts_set)[-1000:]
            save_scanner_history(scanner_history)

            progress_base = 20 + int((idx / max(1, total_eval_target)) * 75)
            progress_base = min(95, progress_base)
            
            emit_progress(progress_base, f"Inspecting post [{idx+1}/{len(post_links)}]: resolving threads & comments...", idx+1, max_posts, valid_count, "INSPECT_POST")
            print(f"\n--- [{idx+1}/{len(post_links)}] Processing {post_url} ---", flush=True)
            post_page = await context.new_page()
            try:
                await post_page.goto(post_url, timeout=25000)
                await post_page.wait_for_timeout(2500)
                
                title_el = await post_page.query_selector("h1")
                title = (await title_el.inner_text()).strip() if title_el else ""
                
                if any(ig in title.lower() for ig in IGNORE_TITLES) or title.lower().startswith("lc ") or "[lc]" in title.lower() or "legit check" in title.lower():
                    print(f"Skipping announcement/guide/LC thread: '{title}'", flush=True)
                    continue

                    
                body_el = await post_page.query_selector("shreddit-post, div[data-testid='post-container']")
                body_text = (await body_el.inner_text()) if body_el else ""
                
                # Extract comments list for model identification
                comments_list = await post_page.eval_on_selector_all(
                    "shreddit-comment p, div[data-testid='comment'] p",
                    "els => els.map(e => e.innerText || '').filter(t => t.length > 5)"
                )
                
                # Fetch all hrefs
                all_hrefs = await post_page.eval_on_selector_all("a", "els => els.map(e => e.href)")
                
                # Combine full text to extract market links
                full_text = f"{title} {body_text} " + " ".join(comments_list) + " " + " ".join(all_hrefs)
                extracted_links = clean_text_and_extract_links(full_text)
                
                # Extract post images - filter out avatars/stickers
                raw_post_images = await post_page.eval_on_selector_all(
                    "img[src*='preview.redd.it'], img[src*='i.redd.it']",
                    "els => els.map(e => e.src)"
                )
                post_images = [
                    img for img in raw_post_images 
                    if not any(bad in img.lower() for bad in ["snoo", "snoovatar", "avatar", "badge", "award", "marketing", "icon"])
                ]
                
                if not extracted_links:
                    print(f"No market links detected for '{title}'.", flush=True)
                    continue
                    
                # Run AI Fashion Lens / Archive Model Identifier
                emit_progress(progress_base + 1, f"AI Model Identification for: '{title[:35]}...'", idx+1, max_posts, valid_count, "MODEL_ID")
                identified = identify_product_metadata(title, comments=comments_list)
                brand = identified.get("brand") or detect_brand(title + " " + body_text)
                canonical_title = identified.get("canonicalTitle") or title
                canonical_title = re.sub(r'\[.*?\]|\(.*?\)|QC|FIND|W2C|LC', '', canonical_title).strip()
                
                # REJECT generic garbage and non-designer titles
                if brand in ["Archive Collection", "Archive Finds", "General"] or "Archive Piece" in canonical_title:
                    print(f"Skipping unverified generic item: '{canonical_title}'", flush=True)
                    continue
                    
                # REJECT haul / bulk posts without single isolated piece
                if any(hkw in title.lower() for hkw in ["haul", "10kg", "5kg", "7kg", "4kg", "megathread", "giveaway", "discussion"]):
                    print(f"Skipping multi-item haul/announcement thread: '{title}'", flush=True)
                    continue

                # DEDUPLICATION: Check if product with identical brand & title already exists
                existing_titles = {
                    (p.get("brand", "").lower().strip(), p.get("name", "").lower().strip())
                    for p in existing_products + discovered_items
                }
                if (brand.lower().strip(), canonical_title.lower().strip()) in existing_titles:
                    print(f"Skipping duplicate product in catalog: {brand} - {canonical_title}", flush=True)
                    continue
                
                category = detect_category(canonical_title + " " + title + " " + body_text)
                price = estimate_price(brand, category, full_text)
                estimated_retail = identified.get("estimatedRetail") or round(price * 8.5, 0)
                season = identified.get("season", "")
                
                # Ingest only the primary single piece link to avoid duplicate variants
                for link_idx, market_link in enumerate(extracted_links[:1]):
                    # Check for valid marketplace product ID
                    is_valid_market_link = (
                        ("weidian.com" in market_link and ("itemid" in market_link.lower() or "item.html?id=" in market_link.lower())) or
                        ("taobao.com" in market_link and "id=" in market_link.lower()) or
                        ("1688.com" in market_link and ("offer/" in market_link.lower() or "detail/" in market_link.lower()))
                    )
                    if not is_valid_market_link:
                        print(f"Skipping invalid store link (missing product ID): {market_link}", flush=True)
                        continue

                    if market_link.lower() in blacklisted_links_set:
                        print(f"Skipping blacklisted market link: {market_link}", flush=True)
                        continue

                    affiliate_link = convert_to_sugargoo_affiliate(market_link)
                    
                    if affiliate_link.lower() in existing_urls:
                        print(f"Item already in catalog: {market_link}", flush=True)
                        continue
                        
                    slug = slugify(f"{brand}-{canonical_title}-{int(time.time()) % 10000 + link_idx}")
                    item_id = str(len(existing_products) + len(discovered_items) + 1)
                    
                    # Prefer high-res studio image if available, else post image
                    img_src = identified.get("studioImageUrl") or (post_images[0] if post_images else "")
                    if not img_src or any(bad in img_src.lower() for bad in ["snoo", "snoovatar", "avatar", "badge", "marketing"]):
                        print(f"Skipping item with no valid product image: '{canonical_title}'", flush=True)
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
                    
                    out_png = os.path.join(PRODUCTS_IMG_DIR, f"{slug}.png")
                    emit_progress(progress_base + 2, f"Fetching studio flat-lay & AI cutout: {brand} {canonical_title[:30]}", idx+1, max_posts, valid_count, "AI_PROCESSING", canonical_title)
                    print(f"Generating AI cutout for {slug} (with fallback '{item['title']}')...", flush=True)
                    success = process_and_cutout_image(img_src, out_png, query_fallback=f"{brand} {canonical_title}")
                    
                    if not success or not os.path.exists(out_png):
                        print(f"[REJECTED] Cutout failed or image invalid for: '{canonical_title}'", flush=True)
                        continue

                    discovered_items.append(item)
                    valid_count += 1

                    # 1. Update scratch/discovered_qualityreps_finds.json immediately so it is safe on disk
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

                    # 2. Emit Real-Time Discovered Item Event to SSE stream
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
    
    # Save discovered items to scratch/discovered_qualityreps_finds.json
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

