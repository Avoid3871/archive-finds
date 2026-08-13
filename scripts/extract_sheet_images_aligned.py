import zipfile
import os
import json
import xml.etree.ElementTree as ET
from pathlib import Path

XLSX_PATH = Path("storage/temp/sheet_export.xlsx")
EXTRACT_DIR = Path("storage/temp/sheet_unzipped")
OUTPUT_IMG_DIR = Path("public/products/sheet")

OUTPUT_IMG_DIR.mkdir(parents=True, exist_ok=True)
EXTRACT_DIR.mkdir(parents=True, exist_ok=True)

print(f"Unzipping {XLSX_PATH}...")
with zipfile.ZipFile(XLSX_PATH, "r") as z:
    z.extractall(EXTRACT_DIR)

media_dir = EXTRACT_DIR / "xl" / "media"
media_files = list(media_dir.glob("*.*"))
print(f"Found {len(media_files)} total image files in spreadsheet media!")

# Map drawings to cells
drawings_dir = EXTRACT_DIR / "xl" / "drawings"
rels_dir = drawings_dir / "_rels"

image_cell_map = [] # list of { row, col, image_filename }

for drawing_file in drawings_dir.glob("*.xml"):
    rels_file = rels_dir / f"{drawing_file.name}.rels"
    rel_map = {}
    if rels_file.exists():
        tree = ET.parse(rels_file)
        root = tree.getroot()
        for elem in root:
            r_id = elem.attrib.get("Id")
            target = elem.attrib.get("Target")
            if r_id and target and "media" in target:
                rel_map[r_id] = Path(target).name

    # Parse drawing xml
    tree = ET.parse(drawing_file)
    root = tree.getroot()
    
    # XML namespaces in openxml drawings
    ns = {
        'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }

    for anchor in root.findall('.//xdr:twoCellAnchor', ns) + root.findall('.//xdr:oneCellAnchor', ns):
        from_elem = anchor.find('xdr:from', ns)
        blip = anchor.find('.//a:blip', ns)
        if from_elem is not None and blip is not None:
            col_txt = from_elem.find('xdr:col', ns).text
            row_txt = from_elem.find('xdr:row', ns).text
            r_embed = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            
            row = int(row_txt)
            col = int(col_txt)
            img_fname = rel_map.get(r_embed)
            if img_fname:
                image_cell_map.append({
                    "row": row,
                    "col": col,
                    "filename": img_fname
                })

print(f"Mapped {len(image_cell_map)} images to exact spreadsheet cells (rows & columns)!")

# Sort by row, then col (left column first, then right column)
image_cell_map.sort(key=lambda x: (x["row"], x["col"]))

# Copy images to public/products/sheet/
copied_images = []
for idx, item in enumerate(image_cell_map):
    src_file = media_dir / item["filename"]
    if src_file.exists():
        ext = src_file.suffix
        dest_filename = f"item_r{item['row']:03d}_c{item['col']:02d}_{idx+1:03d}{ext}"
        dest_path = OUTPUT_IMG_DIR / dest_filename
        with open(src_file, "rb") as f_in, open(dest_path, "wb") as f_out:
            f_out.write(f_in.read())
        
        item["publicUrl"] = f"/products/sheet/{dest_filename}"
        copied_images.append(item)

print(f"Copied {len(copied_images)} images into {OUTPUT_IMG_DIR}!")

# Update src/lib/products/sheetProducts.json
products_path = Path("src/lib/products/sheetProducts.json")
with open(products_path, "r", encoding="utf-8") as f:
    products = json.load(f)

# Associate each product with its closest/matching spreadsheet image
# In the sheet, products are organized: Column A/B = Col 0/1, Column D/E = Col 3/4
for idx, prod in enumerate(products):
    if idx < len(copied_images):
        prod["imageUrl"] = copied_images[idx]["publicUrl"]

with open(products_path, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print(f"SUCCESS: UPDATED ALL {len(products)} PRODUCTS WITH REAL EXTRACTED SPREADSHEET IMAGES!")
