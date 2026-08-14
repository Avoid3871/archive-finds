import os
import sys
import re
import json
import time
import urllib.parse
import urllib.request
from PIL import Image
import rembg

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

def convert_to_sugargoo_affiliate(raw_url: str) -> str:
    c_url = clean_url(raw_url)
    encoded = urllib.parse.quote(c_url, safe="")
    return f"https://www.sugargoo.com/#/home/productDetail?productUrl={encoded}&memberId={AFFILIATE_MEMBER_ID}"

def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:60]

def create_image_cutout(img_url: str, output_path: str) -> bool:
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            
        img = Image.open(urllib.request.io.BytesIO(data)).convert("RGBA")
        cutout = rembg.remove(img)
        bbox = cutout.getbbox()
        if bbox:
            cutout = cutout.crop(bbox)
            
        target_size = (1000, 1000)
        margin = 60
        max_w = target_size[0] - 2 * margin
        max_h = target_size[1] - 2 * margin
        w, h = cutout.size
        ratio = min(max_w / w, max_h / h)
        new_w, new_h = max(1, int(w * ratio)), max(1, int(h * ratio))
        resized = cutout.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        final = Image.new("RGBA", target_size, (0, 0, 0, 0))
        offset = ((target_size[0] - new_w) // 2, (target_size[1] - new_h) // 2)
        final.paste(resized, offset, resized)
        
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        final.save(output_path, "PNG", optimize=True)
        print(f"[OK] Saved cutout to {output_path}", flush=True)
        return True
    except Exception as e:
        print(f"Error creating cutout: {e}", flush=True)
        return False

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

    if raw_img:
        print(f"Generating AI cutout from {raw_img}...", flush=True)
        create_image_cutout(raw_img, out_png)
    else:
        # Fallback: copy placeholder or generate blank transparent
        img = Image.new("RGBA", (1000, 1000), (0, 0, 0, 0))
        os.makedirs(os.path.dirname(out_png), exist_ok=True)
        img.save(out_png, "PNG")

    new_piece = {
        "id": item_id,
        "title": f"{brand} - {title}" if brand not in title else title,
        "brand": brand,
        "category": category,
        "sourcePrice": price,
        "estimatedRetail": round(price * 8.5, 0),
        "sugargooUrl": affiliate_url,
        "affiliateLink": affiliate_url,
        "localImage": local_img,
        "slug": slug,
        "status": "APPROVED",
        "verified": True,
        "notes": "1-Click Admin Ingest"
    }

    products.append(new_piece)
    with open(SHEET_PRODUCTS_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2)

    print(f"Added new product #{item_id}: {new_piece['title']}", flush=True)
    print("Regenerating all 3 slide styles...", flush=True)
    os.system("node scripts/generate_all_slide_styles.js")
    print("Ingest process complete!", flush=True)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        ingest(sys.argv[1])
    else:
        print("Usage: python ingest_single_piece.py <payload.json>")
