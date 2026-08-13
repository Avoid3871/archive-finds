import xml.etree.ElementTree as ET
from pathlib import Path

EXTRACT_DIR = Path("storage/temp/sheet_unzipped")
tree_ss = ET.parse(EXTRACT_DIR / "xl" / "sharedStrings.xml")
ns_main = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
shared_strings = []
for si in tree_ss.getroot().findall('.//m:si', ns_main):
    text_parts = [t.text for t in si.findall('.//m:t', ns_main) if t.text]
    shared_strings.append("".join(text_parts))

def inspect_sheet(sheet_name, xml_file):
    print(f"\n=== INSPECTING {sheet_name} ({xml_file}) ===")
    sheet_xml_path = EXTRACT_DIR / "xl" / "worksheets" / xml_file
    rels_path = EXTRACT_DIR / "xl" / "worksheets" / "_rels" / f"{xml_file}.rels"
    
    rel_map = {}
    if rels_path.exists():
        for rel in ET.parse(rels_path).getroot():
            rel_map[rel.attrib['Id']] = rel.attrib.get('Target', '')

    root = ET.parse(sheet_xml_path).getroot()
    links = {}
    for hl in root.findall('.//m:hyperlink', ns_main):
        ref = hl.attrib.get('ref')
        r_id = hl.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        if ref and r_id in rel_map:
            links[ref] = rel_map[r_id]

    print(f"Total hyperlinks in {sheet_name}: {len(links)}")
    sample_links = list(links.items())[:10]
    for ref, url in sample_links:
        print(f"  {ref} -> {url}")

inspect_sheet("Archive's Spreadsheet", "sheet6.xml")
inspect_sheet("Updated Sheet )", "sheet4.xml")
inspect_sheet("Finds", "sheet2.xml")
