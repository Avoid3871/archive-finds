import re
import urllib.request
import json
from bs4 import BeautifulSoup

with open('scratch_sheet.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Find all buttons / tabs
tabs = []
for li in soup.find_all('li', id=re.compile(r'sheet-button-.*')):
    a = li.find('a')
    gid = li.get('id').replace('sheet-button-', '')
    name = a.text.strip() if a else 'Unknown'
    tabs.append((gid, name))

print(f"Tabs discovered: {tabs}")

# For each tab, let's fetch its export=csv
sheet_id = '1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI'

for gid, name in tabs:
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    try:
        req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            rows = [r for r in data.split('\n') if r.strip()]
            print(f"\nTab: {name} (gid={gid}) -> Rows: {len(rows)}")
            for i in range(min(4, len(rows))):
                print(f"   [{i}]: {rows[i][:120]}")
    except Exception as e:
        print(f"Error for {name}: {e}")
