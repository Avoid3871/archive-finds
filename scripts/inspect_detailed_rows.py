import csv
import io
import urllib.request
import re

sheet_id = '1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI'
gid = '1553171019' # TOPS

csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&gid={gid}"
req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})

with urllib.request.urlopen(req) as resp:
    content = resp.read().decode('utf-8')
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)

print(f"Total Rows in TOPS: {len(rows)}")
for i in range(1, 15):
    if i < len(rows):
        r = rows[i]
        print(f"\n--- Row {i} ---")
        print(f"Col 0 (Image?): {r[0]}")
        print(f"Col 1 (Link): {r[1]}")
        print(f"Col 2 (Brand): {r[2]}")
        print(f"Col 3 (Item Name): {r[3]}")
        print(f"Col 4 (Price USD): {r[4]}")
        print(f"Col 5 (Price CNY): {r[5]}")
        print(f"Col 7 (QC/Reddit/Imgur): {r[7] if len(r) > 7 else ''}")
