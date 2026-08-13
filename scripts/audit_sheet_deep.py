import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
import json
from PIL import Image

XLSX_PATH = Path("storage/temp/sheet_export.xlsx")
EXTRACT_DIR = Path("storage/temp/sheet_unzipped")

print("--- DEEP AUDIT OF SPREADSHEET ARCHITECTURE ---")

# 1. Check workbook sheets
tree_wb = ET.parse(EXTRACT_DIR / "xl" / "workbook.xml")
root_wb = tree_wb.getroot()
ns_main = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
sheets = root_wb.findall('.//m:sheet', ns_main)

print(f"Total Sheets in Workbook: {len(sheets)}")
sheet_map = {}
for s in sheets:
    sheet_name = s.attrib.get('name')
    sheet_id = s.attrib.get('sheetId')
    r_id = s.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    sheet_map[r_id] = sheet_name
    print(f"  Sheet: {sheet_name} (ID: {sheet_id}, rId: {r_id})")

# 2. Check sheet1 relationships & drawings
tree_rels = ET.parse(EXTRACT_DIR / "xl" / "_rels" / "workbook.xml.rels")
root_rels = tree_rels.getroot()
target_map = {elem.attrib['Id']: elem.attrib['Target'] for elem in root_rels}

for r_id, name in sheet_map.items():
    rel_path = target_map.get(r_id)
    print(f"\nAnalyzing sheet target: {rel_path} for '{name}'")
    sheet_xml_path = EXTRACT_DIR / "xl" / rel_path
    
    # Check hyperlinks in this sheet
    tree_sheet = ET.parse(sheet_xml_path)
    root_sheet = tree_sheet.getroot()
    
    # Check drawings in sheet rels
    sheet_rels_path = EXTRACT_DIR / "xl" / Path(rel_path).parent / "_rels" / f"{Path(rel_path).name}.rels"
    if sheet_rels_path.exists():
        tree_srels = ET.parse(sheet_rels_path)
        for rel in tree_srels.getroot():
            if 'drawing' in rel.attrib.get('Type', ''):
                print(f"  -> Associated Drawing: {rel.attrib.get('Target')}")
            if 'hyperlink' in rel.attrib.get('Type', ''):
                print(f"  -> Hyperlink Target: {rel.attrib.get('Target')}")

# 3. Check shared strings (text & links in cells)
shared_strings_path = EXTRACT_DIR / "xl" / "sharedStrings.xml"
if shared_strings_path.exists():
    tree_ss = ET.parse(shared_strings_path)
    sst = [elem.text for elem in tree_ss.getroot().findall('.//m:t', ns_main) if elem.text]
    print(f"\nTotal Shared Strings: {len(sst)}")
    print("First 20 shared strings:", sst[:20])

