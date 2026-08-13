import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
import json

EXTRACT_DIR = Path("storage/temp/sheet_unzipped")

# 1. Parse workbook to get Sheet Name -> Sheet File
tree_wb = ET.parse(EXTRACT_DIR / "xl" / "workbook.xml")
root_wb = tree_wb.getroot()
ns_main = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

tree_wb_rels = ET.parse(EXTRACT_DIR / "xl" / "_rels" / "workbook.xml.rels")
root_wb_rels = tree_wb_rels.getroot()
wb_rel_map = {elem.attrib['Id']: elem.attrib['Target'] for elem in root_wb_rels}

print("=== ALL SHEETS IN WORKBOOK ===")
all_sheets = []
for s in root_wb.findall('.//m:sheet', ns_main):
    s_name = s.attrib['name']
    s_id = s.attrib['sheetId']
    r_id = s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
    target_xml = wb_rel_map.get(r_id)
    all_sheets.append({
        "name": s_name,
        "sheetId": s_id,
        "targetXml": target_xml
    })
    print(f"Sheet #{s_id}: '{s_name}' -> {target_xml}")

# 2. For each sheet, find its drawing.xml and hyperlink mappings
for s in all_sheets:
    sheet_xml_file = EXTRACT_DIR / "xl" / s["targetXml"]
    sheet_rels_file = EXTRACT_DIR / "xl" / Path(s["targetXml"]).parent / "_rels" / f"{Path(s['targetXml']).name}.rels"
    
    drawing_file = None
    hyperlinks = []
    if sheet_rels_file.exists():
        tree_srels = ET.parse(sheet_rels_file)
        for rel in tree_srels.getroot():
            if 'drawing' in rel.attrib.get('Type', ''):
                drawing_file = rel.attrib.get('Target')
            if 'hyperlink' in rel.attrib.get('Type', ''):
                hyperlinks.append(rel.attrib.get('Target'))
    
    print(f"\nTab: '{s['name']}' | Drawing: {drawing_file} | Links: {len(hyperlinks)}")

