import sys
import io
import os
import requests
from PIL import Image
from rembg import remove, new_session

sys.stdout.reconfigure(encoding="utf-8")
session = new_session("u2net")

def download_and_cutout(img_url: str, output_path: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    print(f"Downloading from {img_url}...")
    resp = requests.get(img_url, headers=headers, timeout=20)
    resp.raise_for_status()
    
    img = Image.open(io.BytesIO(resp.content)).convert("RGBA")
    print(f"Original image size: {img.size}")
    
    print("Running rembg AI background removal...")
    cutout = remove(img, session=session)
    
    # Get bounding box of garment
    bbox = cutout.getbbox()
    if not bbox:
        raise ValueError("Could not find garment bounds")
        
    cropped = cutout.crop(bbox)
    print(f"Garment cropped size: {cropped.size}")
    
    # Create high-res 1000x1000 square transparent canvas
    canvas_size = 1000
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    target_max = canvas_size - 120
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
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    canvas.save(output_path, "PNG", optimize=True)
    print(f"[SUCCESS] Saved clean cutout to {output_path}")

if __name__ == "__main__":
    # Rick Owens Vans
    ro_url = "https://cdna.lystit.com/1040/1300/n/photos/endclothing/c1bfa1a6/rick-owens-Black-Vintage-Low-Sneakers.jpeg"
    ro_out = "public/products/rick-owens-qc-ro-v-ns-from-hyl-2172.png"
    download_and_cutout(ro_url, ro_out)
    
    # Chrome Hearts Soap & Water Hoodie
    ch_url = "https://justinreed.com/cdn/shop/files/1_e62f3724-5319-4120-9a90-c0ad002c02b7.jpg?v=1778709631"
    ch_out = "public/products/chrome-hearts-ch-soap-and-water-hoodie-2186.png"
    download_and_cutout(ch_url, ch_out)
