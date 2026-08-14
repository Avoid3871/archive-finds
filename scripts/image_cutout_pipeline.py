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

def search_clean_garment_image(query: str) -> str:
    """
    Search DuckDuckGo Images for a clean garment flat-lay / studio image.
    """
    print(f"Searching web for clean flat-lay image: '{query}'...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # 1. Try DuckDuckGo image search
    try:
        search_url = f"https://duckduckgo.com/i.js?l=us-en&o=json&q={urllib.parse.quote(query + ' flat lay garment front white background')}"
        res = requests.get(search_url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            results = data.get("results", [])
            for r in results[:5]:
                img_url = r.get("image")
                if img_url and (img_url.endswith('.jpg') or img_url.endswith('.png') or img_url.endswith('.jpeg') or 'grailed' in img_url or 'ssense' in img_url or 'endclothing' in img_url):
                    return img_url
            if results:
                return results[0].get("image")
    except Exception as e:
        print(f"DuckDuckGo search error: {e}")
        
    return ""

def process_and_cutout_image(img_input, output_path: str, target_size=(1000, 1000)) -> bool:
    """
    Takes an image URL or filepath, removes the background via rembg,
    trims transparent padding, centers it on a square canvas with padding,
    and saves to output_path.
    """
    try:
        if isinstance(img_input, str):
            if img_input.startswith("http"):
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                req = urllib.request.Request(img_input, headers=headers)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    img_data = resp.read()
                input_image = Image.open(io.BytesIO(img_data)).convert("RGBA")
            else:
                input_image = Image.open(img_input).convert("RGBA")
        else:
            input_image = img_input.convert("RGBA")

        # 1. Remove background
        print("Running AI background removal...")
        output_image = rembg.remove(input_image)
        
        # 2. Get bounding box of non-transparent pixels
        bbox = output_image.getbbox()
        if bbox:
            cropped = output_image.crop(bbox)
        else:
            cropped = output_image
            
        # 3. Scale proportionally into target_size with margin
        margin = 60
        max_w = target_size[0] - 2 * margin
        max_h = target_size[1] - 2 * margin
        
        orig_w, orig_h = cropped.size
        ratio = min(max_w / orig_w, max_h / orig_h)
        new_w = int(orig_w * ratio)
        new_h = int(orig_h * ratio)
        
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # 4. Paste onto 1000x1000 transparent canvas centered
        final_canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
        offset_x = (target_size[0] - new_w) // 2
        offset_y = (target_size[1] - new_h) // 2
        final_canvas.paste(resized, (offset_x, offset_y), resized)
        
        # Ensure dir exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        final_canvas.save(output_path, "PNG", optimize=True)
        print(f"[OK] Saved cutout to {output_path}")
        return True
    except Exception as e:
        print(f"Cutout error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 2:
        inp = sys.argv[1]
        outp = sys.argv[2]
        process_and_cutout_image(inp, outp)
    else:
        print("Usage: python image_cutout_pipeline.py <input_url_or_path> <output_png_path>")
