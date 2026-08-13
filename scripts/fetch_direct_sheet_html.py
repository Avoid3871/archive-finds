import urllib.request
from bs4 import BeautifulSoup
import json

sheet_gid = "1523005324"
direct_html_url = f"https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8/pubhtml/sheet?headers=false&gid={sheet_gid}"

print(f"Fetching direct sheet HTML: {direct_html_url}")
req = urllib.request.Request(
    direct_html_url,
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')
rows = soup.find_all('tr')
print(f"Found {len(rows)} table rows in published sheet HTML!")

extracted_products = []

for r_idx, tr in enumerate(rows):
    tds = tr.find_all(['td', 'th'])
    # In this table layout, inspect each cell
    row_info = []
    for c_idx, td in enumerate(tds):
        text = td.get_text(strip=True)
        links = [a.get('href') for a in td.find_all('a') if a.get('href')]
        if text or links:
            row_info.append({
                "col": c_idx,
                "text": text,
                "link": links[0] if links else None
            })
    
    if row_info:
        # print first 15 rows
        if r_idx < 15:
            items_str = " | ".join([f"Col {c['col']}: '{c['text']}' (Link: {c['link']})" for c in row_info])
            print(f"Row {r_idx:02d}: {items_str}")

