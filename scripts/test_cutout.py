import os
import urllib.request
from PIL import Image
import rembg

def test_rembg_reddit_image():
    # Direct high-res reddit image from post
    img_url = "https://preview.redd.it/blassic-haul-v0-1mmpyngd9djh1.jpg?width=640&crop=smart&auto=webp&s=ba93445a40cf0a85dcb8f4bd8d398799b63fd1a7"
    
    print("Downloading sample reddit image...")
    req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        
    img = Image.open(urllib.request.io.BytesIO(data)).convert("RGBA")
    print(f"Original size: {img.size}")
    
    print("Removing background with rembg...")
    cutout = rembg.remove(img)
    
    bbox = cutout.getbbox()
    if bbox:
        cutout = cutout.crop(bbox)
        
    # Scale into 1000x1000 square
    target_size = (1000, 1000)
    margin = 60
    max_w = target_size[0] - 2 * margin
    max_h = target_size[1] - 2 * margin
    
    w, h = cutout.size
    ratio = min(max_w / w, max_h / h)
    new_w, new_h = int(w * ratio), int(h * ratio)
    resized = cutout.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    final = Image.new("RGBA", target_size, (0, 0, 0, 0))
    offset = ((target_size[0] - new_w) // 2, (target_size[1] - new_h) // 2)
    final.paste(resized, offset, resized)
    
    out_path = "public/products/test_rembg_cutout.png"
    os.makedirs("public/products", exist_ok=True)
    final.save(out_path, "PNG")
    print(f"Successfully created transparent cutout at {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    test_rembg_reddit_image()
