import urllib.request
import urllib.parse
import json
import os
import io
import re
from PIL import Image
from rembg import remove, new_session

session = new_session("u2net")

def clean_cutout(img_data: bytes, output_path: str, min_size: int = 1000):
    """Cleanly extracts garment with rembg, crops bounding box, centers on square canvas."""
    input_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
    
    # AI Background removal
    cutout = remove(input_img, session=session)
    
    # Get alpha bounding box
    bbox = cutout.getbbox()
    if not bbox:
        raise ValueError("Could not detect garment bounding box")
    
    cropped = cutout.crop(bbox)
    
    # Create canvas
    canvas_size = max(min_size, cropped.width + 120, cropped.height + 120)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # Center garment with nice margins
    target_max = canvas_size - 140
    aspect = cropped.width / cropped.height
    
    if aspect > 1:
        new_w = target_max
        new_h = int(target_max / aspect)
    else:
        new_h = target_max
        new_w = int(target_max * aspect)
        
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    
    # Save optimized PNG
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    canvas.save(output_path, "PNG", optimize=True)
    print(f"[OK] Clean cutout saved to {output_path} ({canvas_size}x{canvas_size})")
    return output_path

def search_duckduckgo_images(query: str, max_results: int = 5):
    """Searches DuckDuckGo for high-resolution garment/sneaker studio images."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # Step 1: get vqd token
    url = f"https://duckduckgo.com/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8")
        
        vqd_match = re.search(r'vqd=([\d-]+)&', html) or re.search(r'vqd="([\d-]+)"', html)
        if not vqd_match:
            print(f"[DDG] Could not find vqd for query: {query}")
            return []
        
        vqd = vqd_match.group(1)
        
        # Step 2: query i.js
        img_url = f"https://duckduckgo.com/i.js?l=us-en&o=json&q={urllib.parse.quote(query)}&vqd={vqd}&f=,,,&p=1"
        img_req = urllib.request.Request(img_url, headers=headers)
        with urllib.request.urlopen(img_req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            
        results = []
        for r in data.get("results", [])[:max_results]:
            results.append({
                "image": r.get("image"),
                "thumbnail": r.get("thumbnail"),
                "title": r.get("title"),
                "width": r.get("width"),
                "height": r.get("height")
            })
        return results
    except Exception as e:
        print(f"[DDG Error] {e}")
        return []

if __name__ == "__main__":
    # Test 1: Rick Owens Vans Sneaker
    print("\n--- Searching Rick Owens Vans ---")
    ro_results = search_duckduckgo_images("Rick Owens Vans low sneakers black white studio product", 5)
    for i, r in enumerate(ro_results):
        print(f"{i+1}. {r['title']} -> {r['image']}")
        
    # Test 2: Chrome Hearts Soap and Water Hoodie
    print("\n--- Searching Chrome Hearts Soap and Water Hoodie ---")
    ch_results = search_duckduckgo_images("Chrome Hearts Soap and Water hoodie washed black flat lay", 5)
    for i, r in enumerate(ch_results):
        print(f"{i+1}. {r['title']} -> {r['image']}")
