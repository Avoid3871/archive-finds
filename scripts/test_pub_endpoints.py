import urllib.request
import re

pub_base = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8'

# 1. Test pubhtml/sheet
url1 = f'{pub_base}/pubhtml/sheet?headers=false&gid=1523005324'
print("1. Fetching pubhtml/sheet...")
try:
    req = urllib.request.Request(url1, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        print(f"pubhtml/sheet Status: {resp.status}, Length: {len(content)}")
        with open('scripts/sheet_fragment.html', 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Look for links in this fragment
        anchors = re.findall(r'<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)</a>', content, re.DOTALL)
        print(f"Anchors found: {len(anchors)}")
        for href, text in anchors[:10]:
            clean_text = re.sub(r'<[^>]+>', '', text).strip()
            print(f"  -> '{clean_text}': {href}")
except Exception as e:
    print("Error 1:", e)

# 2. Test pub?output=xlsx
url2 = f'{pub_base}/pub?output=xlsx'
print("\n2. Fetching pub?output=xlsx...")
try:
    req = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        print(f"XLSX Status: {resp.status}, Size: {len(data)} bytes")
        with open('scripts/published_sheet.xlsx', 'wb') as f:
            f.write(data)
        print("Successfully saved scripts/published_sheet.xlsx!")
except Exception as e:
    print("Error 2:", e)
