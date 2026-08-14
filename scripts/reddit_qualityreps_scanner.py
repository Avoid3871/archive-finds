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
    "megathread", "rules", "discord", "seller ban", "guide", "easter mega", "announcement", "winner", "essential guide"
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

    discovered_items = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        urls_to_scan = [
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3AFIND+OR+weidian+OR+taobao+OR+haul&sort=new",
            "https://www.reddit.com/r/QualityReps/new/",
            "https://www.reddit.com/r/QualityReps/search/?q=Rick+Owens+OR+Chrome+Hearts+OR+ERD+OR+Vetements+OR+Margiela+OR+Balenciaga+OR+Undercover&sort=new",
            "https://www.reddit.com/r/QualityReps/search/?q=flair%3AQC+OR+flair%3AGRAIL&sort=new"
        ]
        
        post_links = []
        for u in urls_to_scan:
            print(f"Fetching feed: {u}", flush=True)
            try:
                await page.goto(u, timeout=35000)
                await page.wait_for_timeout(2500)
                # Scroll down to load more dynamic content
                for _ in range(4):
                    await page.keyboard.press("PageDown")
                    await page.wait_for_timeout(800)
                    
                links = await page.eval_on_selector_all(
                    "a[href*='/r/QualityReps/comments/']",
                    "els => Array.from(new Set(els.map(e => e.href))).filter(h => !h.includes('/comment/'))"
                )
                for l in links:
                    if l not in post_links:
                        post_links.append(l)
            except Exception as e:
                print(f"Error fetching feed {u}: {e}", flush=True)
                
        print(f"Found {len(post_links)} total candidate posts. Processing up to {max_posts}...", flush=True)

        valid_count = 0
        for idx, post_url in enumerate(post_links):
            if valid_count >= max_posts:
                break
                
            print(f"\n--- [{idx+1}/{len(post_links)}] Processing {post_url} ---", flush=True)
            post_page = await context.new_page()
            try:
                await post_page.goto(post_url, timeout=25000)
                await post_page.wait_for_timeout(2500)
                
                title_el = await post_page.query_selector("h1")
                title = (await title_el.inner_text()).strip() if title_el else ""
                
                if any(ig in title.lower() for ig in IGNORE_TITLES):
                    print(f"Skipping announcement/guide thread: '{title}'", flush=True)
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
                identified = identify_product_metadata(title, comments=comments_list)
                brand = identified.get("brand") or detect_brand(title + " " + body_text)
                canonical_title = identified.get("canonicalTitle") or title
                canonical_title = re.sub(r'\[.*?\]|\(.*?\)|QC|FIND|W2C|LC', '', canonical_title).strip()
                
                # REJECT generic garbage and non-designer titles
                if brand in ["Archive Collection", "Archive Finds", "General"] or "Archive Piece" in canonical_title:
                    print(f"Skipping unverified generic item: '{canonical_title}'", flush=True)
                    continue
                
                category = detect_category(canonical_title + " " + title + " " + body_text)
                price = estimate_price(brand, category, full_text)
                estimated_retail = identified.get("estimatedRetail") or round(price * 8.5, 0)
                season = identified.get("season", "")
                
                for link_idx, market_link in enumerate(extracted_links[:2]):
                    # Check for valid marketplace product ID
                    is_valid_market_link = (
                        ("weidian.com" in market_link and ("itemid" in market_link.lower() or "item.html?id=" in market_link.lower())) or
                        ("taobao.com" in market_link and "id=" in market_link.lower()) or
                        ("1688.com" in market_link and ("offer/" in market_link.lower() or "detail/" in market_link.lower()))
                    )
                    if not is_valid_market_link:
                        print(f"Skipping invalid store link (missing product ID): {market_link}", flush=True)
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
                    
                    discovered_items.append(item)
                    valid_count += 1
                    print(f"[VERIFIED #{valid_count}] {item['title']} | ${price} (Retail: ${estimated_retail}) | {market_link}", flush=True)
                    
                    if auto_add and img_src:
                        out_png = os.path.join(PRODUCTS_IMG_DIR, f"{slug}.png")
                        print(f"Generating AI cutout for {slug} (with fallback '{item['title']}')...", flush=True)
                        create_image_cutout_from_url(img_src, out_png, query_fallback=item["title"])
                        
            except Exception as e:
                print(f"Error scraping {post_url}: {e}", flush=True)
            finally:
                await post_page.close()
                
        await browser.close()

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

