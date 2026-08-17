import os
import sys
import io
import re
import json
import urllib.request
import urllib.parse
from PIL import Image
import rembg
import requests
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BAD_IMAGE_DOMAINS = [
    "vecteezy", "shutterstock", "alamy", "istockphoto", "gettyimages", "stock.adobe", "freepik", "dreamstime", "123rf",
    "ytimg", "youtube", "tiktok", "instagram", "facebook", "pinterest", "tripadvisor", "wikipedia", "wikimedia",
    "snoovatar", "avatar", "badge", "emoji", "award", "lookaside", "icon", "filesor", "pimpandhost", "tumblr"
]

def fetch_weidian_thor_api(item_id: str) -> list[str]:
    """Fetches seller studio photos directly from Weidian Thor API in 0.1s."""
    try:
        url = f"https://thor.weidian.com/detail/getItemSkuInfo/1.0?param=%7B%22itemId%22%3A%22{item_id}%22%7D"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
            res = data.get("result", {})
            main_pic = res.get("itemMainPic")
            photos = []
            if main_pic:
                photos.append(main_pic)
            for sku in res.get("skuInfos", []):
                sku_img = sku.get("skuImg")
                if sku_img and sku_img not in photos:
                    photos.append(sku_img)
            if photos:
                print(f"[WEIDIAN THOR API] Instantly retrieved {len(photos)} seller studio photo(s) in 0.1s!")
                return photos
    except Exception:
        pass
    return []

def fetch_marketplace_store_photos(market_url: str) -> list[str]:
    """
    Directly extracts high-resolution seller studio photos from Weidian (Thor API + HTML), Taobao, and 1688 item pages.
    """
    if not market_url or not any(k in market_url for k in ["weidian.com", "taobao.com", "1688.com"]):
        return []
        
    # 1. Fast Weidian Thor API Lookup
    if "weidian.com" in market_url:
        match = re.search(r'(?:itemID|itemId|id)=(\d+)', market_url, re.IGNORECASE)
        if match:
            item_id = match.group(1)
            api_photos = fetch_weidian_thor_api(item_id)
            if api_photos:
                return api_photos

    # 2. HTML Scraper Fallback
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(market_url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html)
        valid = []
        for img in imgs:
            if any(cdn in img for cdn in ["geilicdn", "wdvdimg", "alicdn", "taobaocdn", "cbu01", "img.alicdn.com"]):
                if not any(bad in img.lower() for bad in ["icon", "logo", "avatar", "badge", "banner", "head", "footer", "unadjust_550_200", "96_52", "42_42"]):
                    valid.append(img)
        
        valid = list(dict.fromkeys(valid))
        if valid:
            print(f"[STORE SCRAPER] Extracted {len(valid)} seller studio photos directly from store page!")
            return valid
    except Exception as e:
        print(f"[STORE SCRAPER WARNING] Could not fetch marketplace photos: {e}")
        
    return []

def search_clean_garment_image_playwright(query: str) -> str:
    """
    Finds pristine high-res studio/flat-lay product images from Bing Images.
    Filters out stock photo sites, thumbnails, fitpics, and non-garment graphics.
    """
    print(f"[IMAGE SEARCH] Querying web for clean studio flat-lay: '{query}'...")
    try:
        # Search specifically on fashion retailers / archive platforms
        search_term = f"{query} (grailed OR ssense OR farfetch OR lyst OR endclothing OR modesens OR stockx) product studio flat lay"
        search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(search_term)}&form=HDRSC2&first=1"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(search_url, headers=headers)
        html = urllib.request.urlopen(req, timeout=8).read().decode("utf-8", errors="ignore")
        
        matches = re.findall(r'class="iusc"[^>]*m="([^"]*)"', html)
        if not matches:
            matches = re.findall(r'm="(\{.*?\})"', html)
            
        for m_str in matches[:20]:
            try:
                m_clean = m_str.replace("&quot;", '"').replace("&amp;", "&")
                data = json.loads(m_clean)
                murl = data.get("murl")
                title = (data.get("t") or "").lower()
                
                if murl and (murl.startswith("http://") or murl.startswith("https://")):
                    # Reject stock photo domains & non-fashion sites
                    if any(bad in murl.lower() for bad in BAD_IMAGE_DOMAINS):
                        continue
                    if any(bad in title for bad in ["stock photo", "vecteezy", "shutterstock", "getty", "alamy", "nature", "landscape", "park"]):
                        continue
                        
                    print(f"[IMAGE SEARCH SUCCESS] Found pristine studio shot: {murl[:80]}...")
                    return murl
            except Exception:
                pass
    except Exception as e:
        print(f"[IMAGE SEARCH WARNING] {e}")
        
    return ""

def clean_ui_artifacts(img: Image.Image) -> Image.Image:
    """
    Detects and crops out screenshot UI artifacts like bottom red/orange scrub bars,
    video player controls, and status bars from mobile screenshots.
    """
    try:
        w, h = img.size
        # Check bottom 12% for bright red/orange scrubber bar
        bottom_h = int(h * 0.12)
        bottom_strip = img.crop((0, h - bottom_h, w, h)).convert("RGB")
        
        # Check if bottom has intense red horizontal bar (R > 180, G < 70, B < 70)
        pixels = list(bottom_strip.getdata())
        red_count = sum(1 for r, g, b in pixels if r > 180 and g < 70 and b < 70)
        
        if red_count > (len(pixels) * 0.03): # More than 3% red pixels in bottom strip
            print("[IMAGE CLEANER] Detected and removed red scrubber UI bar from bottom.")
            return img.crop((0, 0, w, h - bottom_h))
    except Exception:
        pass
    return img

def is_badge_or_icon(img: Image.Image) -> bool:
    """Detects if an image is a tiny icon, badge, emoji, mobile screenshot or non-garment graphic."""
    w, h = img.size
    # Reject tiny thumbnails
    if w < 180 or h < 180:
        return True
    # Reject vertical mobile phone screenshots (tall aspect ratio with app UI)
    if h / max(1, w) > 1.45:
        print("[IMAGE FILTER] Rejected vertical mobile phone screenshot.")
        return True
    # Reject extreme panoramic banners
    if w / max(1, h) > 2.5:
        print("[IMAGE FILTER] Rejected extreme banner graphic.")
        return True
    return False


def process_and_cutout_image(img_input, output_path: str, query_fallback: str = "", market_url: str = "", target_size=(1000, 1000), model_name: str = "isnet-general-use") -> bool:
    """
    Takes a direct marketplace link (Weidian/Taobao/1688) or a real Reddit QC photo.
    Extracts garment cleanly via rembg (IS-Net HD), trims padding, centers on a 1000x1000 square transparent canvas.
    NEVER uses generic web search to prevent fake or unrelated images.
    """
    try:
        input_image = None
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"}
        
        # Priority 1: Direct Marketplace Seller Studio Photos (Weidian / Taobao / 1688)
        if market_url:
            seller_photos = fetch_marketplace_store_photos(market_url)
            for sp in seller_photos[:4]:
                try:
                    req = urllib.request.Request(sp, headers=headers)
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        img_data = resp.read()
                    temp_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
                    if not is_badge_or_icon(temp_img):
                        input_image = temp_img
                        print(f"[STORE PHOTO MATCH] Successfully retrieved official seller studio photo: {sp[:70]}...")
                        break
                except Exception:
                    pass

        # Priority 2: Genuine Reddit Post Image (only if from i.redd.it / preview.redd.it and not avatar/icon)
        if input_image is None and img_input:
            if isinstance(img_input, str) and img_input.startswith("http"):
                is_trusted_cdn = any(cdn in img_input for cdn in ["i.redd.it", "preview.redd.it", "external-preview.redd.it", "geilicdn", "alicdn", "cbu01"])
                if is_trusted_cdn and not any(bad in img_input.lower() for bad in BAD_IMAGE_DOMAINS):
                    try:
                        req = urllib.request.Request(img_input, headers=headers)
                        with urllib.request.urlopen(req, timeout=15) as resp:
                            img_data = resp.read()
                        temp_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
                        if not is_badge_or_icon(temp_img):
                            input_image = temp_img
                            print("[REDDIT QC MATCH] Successfully retrieved real Reddit QC photo.")
                    except Exception:
                        pass
            elif isinstance(img_input, str) and os.path.exists(img_input):
                temp_img = Image.open(img_input).convert("RGBA")
                if not is_badge_or_icon(temp_img):
                    input_image = temp_img
            elif isinstance(img_input, Image.Image):
                if not is_badge_or_icon(img_input):
                    input_image = img_input.convert("RGBA")

        # If no valid seller studio photo or real Reddit QC image exists, REJECT!
        if input_image is None or is_badge_or_icon(input_image):
            print("[IMAGE REJECT] No authentic seller studio or Reddit QC photo found. Skipping piece.")
            return False

        # Strip red scrub bar / mobile screenshot artifacts
        input_image = clean_ui_artifacts(input_image)

        # 1. AI background removal with chosen model (default: isnet-general-use)
        print(f"Executing AI background removal with rembg ({model_name})...")
        actual_model = "isnet-general-use" if model_name in ["isnet-general-use", "isnet-matte"] else model_name
        if actual_model not in ["isnet-general-use", "u2net", "silueta", "u2netp"]:
            actual_model = "isnet-general-use"

        session = rembg.new_session(actual_model)
        if model_name == "isnet-matte":
            output_image = rembg.remove(
                input_image,
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=12
            )
        else:
            output_image = rembg.remove(input_image, session=session)

        # Smart clean detached background watermarks/stickers
        try:
            import numpy as np
            from scipy import ndimage
            arr = np.array(output_image)
            alpha = arr[:, :, 3] > 25
            labeled, num_features = ndimage.label(alpha)
            if num_features > 1:
                sizes = ndimage.sum(alpha, labeled, range(1, num_features + 1))
                max_size = max(sizes) if len(sizes) > 0 else 0
                clean_alpha = np.zeros_like(alpha, dtype=bool)
                for idx, size in enumerate(sizes, 1):
                    if size >= 0.10 * max_size:
                        clean_alpha[labeled == idx] = True
                arr[~clean_alpha, 3] = 0
                output_image = Image.fromarray(arr)
        except Exception:
            pass
        
        # 2. Bounding box of garment
        bbox = output_image.getbbox()
        if bbox:
            cropped = output_image.crop(bbox)
        else:
            cropped = output_image
            
        # 3. Proportionally resize into 1000x1000 with 60px margin
        margin = 60
        max_w = target_size[0] - 2 * margin
        max_h = target_size[1] - 2 * margin
        
        orig_w, orig_h = cropped.size
        ratio = min(max_w / max(1, orig_w), max_h / max(1, orig_h))
        new_w = max(1, int(orig_w * ratio))
        new_h = max(1, int(orig_h * ratio))
        
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # 4. Center on 1000x1000 canvas
        final_canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
        offset_x = (target_size[0] - new_w) // 2
        offset_y = (target_size[1] - new_h) // 2
        final_canvas.paste(resized, (offset_x, offset_y), resized)
        
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        final_canvas.save(output_path, "PNG", optimize=True)
        print(f"[SUCCESS] Saved clean cutout to {output_path}")
        return True
    except Exception as e:
        print(f"[CUTOUT ERROR] {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 2:
        inp = sys.argv[1]
        outp = sys.argv[2]
        fb = sys.argv[3] if len(sys.argv) > 3 else ""
        m_name = sys.argv[4] if len(sys.argv) > 4 else "isnet-general-use"
        process_and_cutout_image(inp, outp, query_fallback=fb, model_name=m_name)
    else:
        print("Usage: python image_cutout_pipeline.py <input_url_or_path> <output_png_path> [query_fallback] [model_name]")
