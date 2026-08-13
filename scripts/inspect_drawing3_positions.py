import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

EXTRACT_DIR = Path("storage/temp/sheet_unzipped")
tree_d3 = ET.parse(EXTRACT_DIR / "xl" / "drawings" / "drawing3.xml")
tree_d3_rels = ET.parse(EXTRACT_DIR / "xl" / "drawings" / "_rels" / "drawing3.xml.rels")

d3_map = {rel.attrib['Id']: Path(rel.attrib['Target']).name for rel in tree_d3_rels.getroot() if 'media' in rel.attrib.get('Target', '')}

ns = {
    'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
}

drawing_rows = []
for anchor in tree_d3.getroot().findall('.//xdr:twoCellAnchor', ns) + tree_d3.getroot().findall('.//xdr:oneCellAnchor', ns):
    from_elem = anchor.find('xdr:from', ns)
    blip = anchor.find('.//a:blip', ns)
    if from_elem is not None and blip is not None:
        col = int(from_elem.find('xdr:col', ns).text)
        row = int(from_elem.find('xdr:row', ns).text)
        r_embed = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
        img_name = d3_map.get(r_embed)
        if img_name:
            drawing_rows.append({
                "row": row,
                "col": col,
                "image": img_name
            })

drawing_rows.sort(key=lambda x: (x["row"], x["col"]))
print(f"Total images positioned in Drawing 3: {len(drawing_rows)}")
print("\n--- FIRST 20 DRAWING POSITIONS IN DRAWING 3 ---")
for d in drawing_rows[:20]:
    print(f"Row {d['row']:02d}, Col {d['col']:02d} -> Image: {d['image']}")

