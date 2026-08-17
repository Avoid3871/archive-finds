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
from job_logger import log_job

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
    start_time = time.time()
    with open(payload_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_url = data.get("url", "").strip()
    brand = data.get("brand", "Archive Collection").strip()
    title = data.get("title", "Archive Grail").strip()
    category = data.get("category", "Outerwear").strip()
    season = data.get("season", "").strip()
    price = float(data.get("price", 59.0))
    estimated_retail = float(data.get("estimatedRetail", 0)) or round(price * 8.5, 0)
    raw_img = data.get("rawImageSrc", "").strip()

    affiliate_url = convert_to_sugargoo_affiliate(raw_url)
    slug = slugify(f"{brand}-{title}-{int(time.time()) % 10000}")
    
    with open(SHEET_PRODUCTS_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    item_id = str(len(products) + 1)
    local_img = f"/products/{slug}.png"
    out_png = os.path.join(PRODUCTS_IMG_DIR, f"{slug}.png")

    existing_img = (data.get("localImage", "") or data.get("imageUrl", "") or data.get("selectedImageSrc", "")).strip()
    clean_rel = existing_img.lstrip("/\\")
    existing_full_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "public", clean_rel)) if clean_rel else ""

    # 1. Try resolving base-slug preview if direct path was not found
    if not (existing_full_path and os.path.exists(existing_full_path) and os.path.isfile(existing_full_path)):
        base_slug = re.sub(r'-\d+$', '', slug)
        possible_previews = [
            os.path.join(os.path.dirname(__file__), "..", "public", "products", "sheet_previews", f"{base_slug}.jpg"),
            os.path.join(os.path.dirname(__file__), "..", "public", "products", "sheet_previews", f"{slug}.jpg"),
        ]
        for p in possible_previews:
            if os.path.exists(p) and os.path.isfile(p):
                existing_full_path = p
                print(f"[FOUND PREVIEW] Resolved preview source: {p}", flush=True)
                break

    saved_image = False

    # 2. Process local existing file with rembg
    if existing_full_path and os.path.exists(existing_full_path) and os.path.isfile(existing_full_path):
        try:
            with Image.open(existing_full_path) as im:
                im_rgba = im.convert("RGBA")
                ext = os.path.splitext(existing_full_path)[1].lower()
                if ext in [".jpg", ".jpeg", ".webp"] or "sheet_previews" in existing_full_path:
                    print(f"[REMBG STUDIO] Removing background from local source: {existing_full_path}...", flush=True)
                    cutout = rembg.remove(im_rgba)
                    cutout.save(out_png, "PNG")
                else:
                    im_rgba.save(out_png, "PNG")
            saved_image = True
            print(f"[REUSE CUTOUT] Successfully saved studio cutout to: {local_img}", flush=True)
        except Exception as e:
            print(f"[IMAGE PROCESS WARN] {e}, falling back to copy", flush=True)
            try:
                import shutil
                shutil.copy2(existing_full_path, out_png)
                saved_image = True
            except Exception as copy_err:
                print(f"[COPY WARN] {copy_err}", flush=True)

    # 3. If local file was not available, try downloading direct URL
    target_url = existing_img if existing_img.startswith("http") else (raw_img if raw_img.startswith("http") else "")
    if not saved_image and target_url:
        try:
            print(f"[DOWNLOAD SOURCE] Downloading high-res image from: {target_url[:60]}...", flush=True)
            req = urllib.request.Request(target_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.google.com/"
            })
            with urllib.request.urlopen(req, timeout=12) as response:
                import io
                img_data = response.read()
                with Image.open(io.BytesIO(img_data)) as dl_im:
                    dl_rgba = dl_im.convert("RGBA")
                    print(f"[REMBG WEB] Applying background removal to downloaded image...", flush=True)
                    cutout = rembg.remove(dl_rgba)
                    cutout.save(out_png, "PNG")
            saved_image = True
            print(f"[WEB CUTOUT] Successfully processed web image to: {local_img}", flush=True)
        except Exception as dl_err:
            print(f"[DOWNLOAD WARN] {dl_err}", flush=True)

    # 4. Fallback to process_and_cutout_image search pipeline
    if not saved_image or not os.path.exists(out_png):
        search_query = f"{brand} {title}"
        print(f"Generating AI cutout from market source/search...", flush=True)
        try:
            process_and_cutout_image(raw_img, out_png, query_fallback=search_query, market_url=raw_url)
        except Exception as pipe_err:
            print(f"[PIPELINE ERROR] {pipe_err}", flush=True)

    rotation = int(data.get("rotation", 0))
    if rotation % 360 != 0 and os.path.exists(out_png):
        try:
            with Image.open(out_png) as img:
                rotated = img.rotate((360 - rotation) % 360, expand=True)
                rotated.save(out_png, "PNG")
            print(f"[ROTATION] Rotated studio cutout by {rotation}° clockwise.", flush=True)
        except Exception as e:
            print(f"[ROTATION ERROR] Could not rotate image: {e}", flush=True)


    new_piece = {
        "id": item_id,
        "title": f"{brand} - {title}" if brand not in title else title,
        "name": f"{brand} - {title}" if brand not in title else title,
        "brand": brand,
        "brandSlug": slugify(brand),
        "category": category,
        "categorySlug": slugify(category),
        "season": season,
        "price": price,
        "sourcePrice": price,
        "estimatedRetail": estimated_retail,
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
        "isRare": price > 80 or bool(season),
        "notes": f"1-Click Admin Ingest{' | ' + season if season else ''}"
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

    # 1. Update sheet ingestion registry to mark as INGESTED
    registry_path = os.path.join(os.path.dirname(__file__), "..", "scratch", "sheet_ingestion_registry.json")
    try:
        registry = {"processed_links": {}, "blacklisted_links": []}
        if os.path.exists(registry_path):
            with open(registry_path, "r", encoding="utf-8") as rf:
                registry = json.load(rf)
        
        raw_url_lower = raw_url.lower().strip()
        clean_url_lower = clean_url(raw_url).lower().strip()
        entry = {
            "status": "INGESTED",
            "reason": f"Ingested piece: {new_piece['title']} ({slug})",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        registry.setdefault("processed_links", {})[raw_url_lower] = entry
        registry["processed_links"][clean_url_lower] = entry
        with open(registry_path, "w", encoding="utf-8") as rf:
            json.dump(registry, rf, indent=2, ensure_ascii=False)
    except Exception as reg_err:
        print(f"[REGISTRY WARN] Could not update registry: {reg_err}", flush=True)

    # 2. Remove piece from scratch discovered queues
    for q_filename in ["discovered_sheet_finds.json", "discovered_qualityreps_finds.json"]:
        q_path = os.path.join(os.path.dirname(__file__), "..", "scratch", q_filename)
        if os.path.exists(q_path):
            try:
                with open(q_path, "r", encoding="utf-8") as qf:
                    q_items = json.load(qf)
                
                target_raw_lower = clean_url(raw_url).lower().strip()
                target_title_lower = (new_piece.get("title") or "").strip().lower()
                q_items_filtered = [
                    it for it in q_items
                    if it.get("slug") != slug
                    and (it.get("title") or "").strip().lower() != target_title_lower
                    and clean_url(it.get("rawMarketUrl") or it.get("directStoreLink") or "").lower().strip() != target_raw_lower
                ]
                with open(q_path, "w", encoding="utf-8") as qf:
                    json.dump(q_items_filtered, qf, indent=2, ensure_ascii=False)
            except Exception as q_err:
                print(f"[QUEUE WARN] Could not update {q_filename}: {q_err}", flush=True)

    duration_ms = (time.time() - start_time) * 1000.0
    log_job(
        job_type="INGEST_GRAIL",
        piece_name=f"{brand} - {title}",
        status="SUCCESS",
        duration_ms=duration_ms,
        details=f"Live product #{item_id} added/updated with Sugargoo affiliate link ({slug})"
    )

    print(json.dumps({
        "status": "SUCCESS",
        "slug": slug,
        "id": item_id,
        "title": new_piece["title"],
        "imageUrl": local_img
    }), flush=True)
    print("Ingest process complete! Product live in catalog.", flush=True)



if __name__ == "__main__":
    if len(sys.argv) > 1:
        ingest(sys.argv[1])
    else:
        print("Usage: python ingest_single_piece.py <payload.json>")
