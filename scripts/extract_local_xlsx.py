import zipfile
import os
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

XLSX_PATH = Path("sheet.xlsx")
if not XLSX_PATH.exists():
    XLSX_PATH = Path("storage/temp/sheet.xlsx")

OUTPUT_IMG_DIR = Path("public/products/sheet_images")
OUTPUT_IMG_DIR.mkdir(parents=True, exist_ok=True)

def process():
    if not XLSX_PATH.exists():
        print(f"File {XLSX_PATH} not found. Please download your spreadsheet as .xlsx (File -> Download -> Microsoft Excel .xlsx) into the project root as 'sheet.xlsx'.")
        return

    print(f"Reading XLSX archive: {XLSX_PATH} ({os.path.getsize(XLSX_PATH)} bytes)")
    
    extract_temp = Path("storage/temp/xlsx_extracted")
    extract_temp.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(XLSX_PATH, 'r') as z:
        z.extractall(extract_temp)

    media_dir = extract_temp / "xl" / "media"
    if not media_dir.exists():
        print("No xl/media directory found in XLSX.")
        return

    media_files = sorted(list(media_dir.glob("*.*")), key=lambda p: p.name)
    print(f"🎉 FOUND {len(media_files)} EMBEDDED IMAGES IN SPREADSHEET!")

    saved_images = []
    for idx, img_path in enumerate(media_files):
        ext = img_path.suffix.lower()
        target_name = f"sheet_item_{idx+1:03d}{ext}"
        target_dest = OUTPUT_IMG_DIR / target_name
        
        # Copy image
        with open(img_path, "rb") as f_in, open(target_dest, "wb") as f_out:
            f_out.write(f_in.read())

        saved_images.append(f"/products/sheet_images/{target_name}")

    print(f"Successfully extracted {len(saved_images)} product images into {OUTPUT_IMG_DIR}!")

    # Update sheetProducts.json with exact sheet images
    products_file = Path("src/lib/products/sheetProducts.json")
    if products_file.exists():
        with open(products_file, "r", encoding="utf-8") as f:
            products = json.load(f)

        for i, prod in enumerate(products):
            if i < len(saved_images):
                prod["imageUrl"] = saved_images[i]

        with open(products_file, "w", encoding="utf-8") as f:
            json.dump(products, f, indent=2)

        print(f"✅ Updated {len(products)} products in sheetProducts.json with authentic spreadsheet images!")

if __name__ == "__main__":
    process()
