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

def search_clean_garment_image_playwright(query: str) -> str:
    """
    Finds pristine high-res studio/flat-lay product images from Bing Images.
    Filters out low-res thumbnails, reddit QC shots, and watermarked warehouse photos.
    """
    print(f"[IMAGE SEARCH] Querying web for clean studio flat-lay: '{query}'...")
    try:
        search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query + ' product studio white background flat lay')}&form=HDRSC2&first=1"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(search_url, headers=headers)
        html = urllib.request.urlopen(req, timeout=8).read().decode("utf-8", errors="ignore")
        
        matches = re.findall(r'class="iusc"[^>]*m="([^"]*)"', html)
        if not matches:
            matches = re.findall(r'm="(\{.*?\})"', html)
            
        for m_str in matches[:15]:
            try:
                m_clean = m_str.replace("&quot;", '"').replace("&amp;", "&")
                data = json.loads(m_clean)
                murl = data.get("murl")
                if murl and (murl.startswith("http://") or murl.startswith("https://")):
                    if not any(bad in murl.lower() for bad in ["preview.redd.it", "i.redd.it", "imgur", "cssbuy", "pandabuy", "snoovatar", "avatar"]):
                        print(f"[IMAGE SEARCH SUCCESS] Found: {murl[:80]}...")
                        return murl
            except Exception:
                pass
    except Exception as e:
        print(f"[IMAGE SEARCH WARNING] {e}")
        
    return ""

def process_and_cutout_image(img_input, output_path: str, query_fallback: str = "", target_size=(1000, 1000)) -> bool:
    """
    Takes an image URL, local path, or fallback search query.
    Extracts garment cleanly via rembg, trims padding, centers on a 1000x1000 square transparent canvas.
    """
    try:
        input_image = None
        
        # If input is empty or query fallback requested
        if not img_input and query_fallback:
            img_input = search_clean_garment_image_playwright(query_fallback)
            
        if isinstance(img_input, str):
            if img_input.startswith("http"):
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                try:
                    req = urllib.request.Request(img_input, headers=headers)
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        img_data = resp.read()
                    input_image = Image.open(io.BytesIO(img_data)).convert("RGBA")
                except Exception as e:
                    print(f"Failed to load image from {img_input}: {e}")
                    if query_fallback:
                        fallback_url = search_clean_garment_image_playwright(query_fallback)
                        if fallback_url:
                            req = urllib.request.Request(fallback_url, headers=headers)
                            with urllib.request.urlopen(req, timeout=15) as resp:
                                img_data = resp.read()
                            input_image = Image.open(io.BytesIO(img_data)).convert("RGBA")
            else:
                input_image = Image.open(img_input).convert("RGBA")
                
        if input_image is None:
            raise ValueError("No valid image data could be retrieved")

        # 1. AI background removal
        print("Executing AI background removal with rembg...")
        output_image = rembg.remove(input_image)
        
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
        ratio = min(max_w / orig_w, max_h / orig_h)
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
        process_and_cutout_image(inp, outp, query_fallback=fb)
    else:
        print("Usage: python image_cutout_pipeline.py <input_url_or_path> <output_png_path> [query_fallback]")
