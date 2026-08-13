import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import json

sheet_gid = "1523005324"
url = f"https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8/pubhtml/sheet?headers=false&gid={sheet_gid}"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')
rows = soup.find_all('tr')

print(f"Total HTML rows in published table: {len(rows)}")

def clean_google_link(raw_link):
    if not raw_link: return None
    if "google.com/url?" in raw_link:
        parsed = urllib.parse.urlparse(raw_link)
        q = urllib.parse.parse_qs(parsed.query).get('q')
        if q: return q[0]
    return raw_link

row_data = []
for r_idx, tr in enumerate(rows):
    tds = tr.find_all(['td', 'th'])
    
    # Left column product (Col 1)
    left_name = None
    left_link = None
    left_price = None
    if len(tds) > 1:
        left_name = tds[1].get_text(strip=True)
        a_left = tds[1].find_all('a')
        if a_left:
            left_link = clean_google_link(a_left[0].get('href'))
    if len(tds) > 2:
        left_price = tds[2].get_text(strip=True)

    # Right column product (Col 4)
    right_name = None
    right_link = None
    right_price = None
    if len(tds) > 4:
        right_name = tds[4].get_text(strip=True)
        a_right = tds[4].find_all('a')
        if a_right:
            right_link = clean_google_link(a_right[0].get('href'))
    if len(tds) > 5:
        right_price = tds[5].get_text(strip=True)

    if left_name or right_name:
        row_data.append({
            "row_idx": r_idx,
            "left": { "name": left_name, "link": left_link, "price": left_price },
            "right": { "name": right_name, "link": right_link, "price": right_price }
        })

print(f"Found {len(row_data)} non-empty rows.")
print("\n--- FIRST 20 ROWS EXACT MAPPING ---")
for r in row_data[:20]:
    print(f"Row {r['row_idx']:02d}:")
    if r['left']['name']:
        print(f"  LEFT : '{r['left']['name']}' | Price: {r['left']['price']} | Link: {r['left']['link']}")
    if r['right']['name']:
        print(f"  RIGHT: '{r['right']['name']}' | Price: {r['right']['price']} | Link: {r['right']['link']}")

with open("storage/temp/exact_sheet_cells.json", "w", encoding="utf-8") as f:
    json.dump(row_data, f, indent=2)

print("\nSaved storage/temp/exact_sheet_cells.json!")
