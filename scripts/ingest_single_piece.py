import os
import sys
import re
import json
import time
import urllib.parse
import urllib.request
from PIL import Image
import rembg
from image_cutout_pipeline import process_and_cutout_image

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

AFFILIATE_MEMBER_ID = "1325437696506389977"
SHEET_PRODUCTS_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "sheetProducts.json")
PRODUCTS_IMG_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "products")

def clean_url(raw: str) -> str:
    cleaned = raw.strip()
    cleaned = re.sub(r'\s*\(\s*dot\s*\)\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\[\s*dot\s*\]\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*\{\s*dot\s*\}\s*', '.', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'(\w+)\s*\.\s*(\w+)', r'\1.\2', cleaned)
    cleaned = re.sub(r'https?\s*:\s*/\s*/\s*', 'https://', cleaned, flags=re.IGNORECASE)
    if not cleaned.startswith("http"):
        cleaned = "https://" + cleaned
    return cleaned

def resolve_and_clean_market_url(raw_url: str) -> str:
    c_url = clean_url(raw_url)
    # Resolve Weidian short-links if needed
    if "k.youshop10.com" in c_url:
        try:
            req = urllib.request.Request(c_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=5) as response:
                c_url = response.geturl()
        except Exception:
            pass
    return c_url

def convert_to_sugargoo_affiliate(raw_url: str) -> str:
    resolved_url = resolve_and_clean_market_url(raw_url)
    encoded = urllib.parse.quote(resolved_url, safe="")
    return f"https://www.sugargoo.com/products?productLink={encoded}&memberId={AFFILIATE_MEMBER_ID}"

def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:60]

def ingest(payload_file: str):
    with open(payload_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_url = data.get("url", "").strip()
    brand = data.get("brand", "Archive Collection").strip()
    title = data.get("title", "Archive Grail").strip()
    category = data.get("category", "Outerwear").strip()
    price = float(data.get("price", 59.0))
    raw_img = data.get("rawImageSrc", "").strip()

    affiliate_url = convert_to_sugargoo_affiliate(raw_url)
    slug = slugify(f"{brand}-{title}-{int(time.time()) % 10000}")
    
    with open(SHEET_PRODUCTS_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    item_id = str(len(products) + 1)
    local_img = f"/products/{slug}.png"
    out_png = os.path.join(PRODUCTS_IMG_DIR, f"{slug}.png")

    existing_img = data.get("localImage", "") or data.get("imageUrl", "")
    existing_full_path = os.path.join(os.path.dirname(__file__), "..", "public", existing_img.lstrip("/")) if existing_img else ""

    if existing_full_path and os.path.exists(existing_full_path):
        import shutil
        shutil.copy2(existing_full_path, out_png)
        print(f"[REUSE CUTOUT] Using verified pre-generated studio cutout: {existing_img}", flush=True)
    else:
        search_query = f"{brand} {title}"
        print(f"Generating AI cutout from market source...", flush=True)
        process_and_cutout_image(raw_img, out_png, query_fallback=search_query, market_url=raw_url)


    new_piece = {
        "id": item_id,
        "title": f"{brand} - {title}" if brand not in title else title,
        "name": f"{brand} - {title}" if brand not in title else title,
        "brand": brand,
        "brandSlug": slugify(brand),
        "category": category,
        "categorySlug": slugify(category),
        "price": price,
        "sourcePrice": price,
        "estimatedRetail": round(price * 8.5, 0),
        "directStoreLink": clean_url(raw_url),
        "sugargooUrl": affiliate_url,
        "affiliateLink": affiliate_url,
        "affiliateUrl": affiliate_url,
        "imageUrl": local_img,
        "localImage": local_img,
        "slug": slug,
        "status": "APPROVED",
        "verified": True,
        "isFeatured": True,
        "isRare": price > 80,
        "notes": "1-Click Admin Ingest"
    }

    # Check for existing product by directStoreLink or URL
    existing_index = -1
    normalized_new_url = clean_url(raw_url).split('&')[0]
    for idx, p in enumerate(products):
        p_url = (p.get("directStoreLink") or p.get("rawMarketUrl") or "").split('&')[0]
        if p_url and p_url == normalized_new_url:
            existing_index = idx
            break

    if existing_index >= 0:
        item_id = products[existing_index].get("id", str(existing_index + 1))
        new_piece["id"] = item_id
        products[existing_index] = new_piece
        print(f"[UPDATE] Updated existing product #{item_id}: {new_piece['title']}", flush=True)
    else:
        products.append(new_piece)
        print(f"[NEW] Added new product #{item_id}: {new_piece['title']}", flush=True)

    with open(SHEET_PRODUCTS_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print("Ingest process complete! Product live in catalog.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        ingest(sys.argv[1])
    else:
        print("Usage: python ingest_single_piece.py <payload.json>")
