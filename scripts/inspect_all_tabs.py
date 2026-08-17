import re
import urllib.request
import csv
import io

sheet_id = '1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI'

# Let's dynamically extract all tabs from the htmlview
url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/htmlview'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

# items.push({name: "TOPS", pageUrl: "...", gid: "1068692932", ...})
pattern = r'items\.push\(\{\s*name:\s*"([^"]+)",\s*pageUrl:\s*"([^"]+)",\s*gid:\s*"([^"]+)"'
tabs = re.findall(pattern, html)
print(f"Extracted Tabs ({len(tabs)}):", tabs)

for name, pageUrl, gid in tabs:
    # Fetch CSV
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&gid={gid}"
    try:
        req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as cresp:
            content = cresp.read().decode('utf-8')
            reader = csv.reader(io.StringIO(content))
            rows = list(reader)
            print(f"\n==========================================")
            print(f"TAB: {name} (gid={gid}) - Total Rows: {len(rows)}")
            if rows:
                print("Header row:", rows[0][:8])
            for idx, r in enumerate(rows[1:6]):
                print(f"Row {idx+1}: {r[:8]}")
    except Exception as e:
        print(f"Error fetching tab {name}: {e}")
