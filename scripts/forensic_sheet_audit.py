import urllib.request
import re
from bs4 import BeautifulSoup
import json

pubhtml_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8/pubhtml"

print(f"Fetching published HTML table from: {pubhtml_url}")
req = urllib.request.Request(
    pubhtml_url,
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')
tables = soup.find_all('table')
print(f"Found {len(tables)} tables in pubhtml.")

raw_rows = []
for t_idx, table in enumerate(tables):
    rows = table.find_all('tr')
    print(f"\nTable #{t_idx+1} has {len(rows)} rows.")
    for r_idx, tr in enumerate(rows):
        cells = tr.find_all(['td', 'th'])
        row_data = []
        for c_idx, td in enumerate(cells):
            text = td.get_text(strip=True)
            a_tags = td.find_all('a')
            links = [a.get('href') for a in a_tags if a.get('href')]
            imgs = [img.get('src') for img in td.find_all('img') if img.get('src')]
            if text or links or imgs:
                row_data.append({
                    "col": c_idx,
                    "text": text,
                    "links": links,
                    "imgs": imgs
                })
        if row_data:
            raw_rows.append({
                "table": t_idx,
                "row": r_idx,
                "cells": row_data
            })

print(f"\nTotal non-empty rows across pubhtml: {len(raw_rows)}")

# Print first 25 rows in detail
print("\n--- FIRST 25 ROWS IN PUBHTML ---")
for r in raw_rows[:25]:
    cell_strs = []
    for c in r["cells"]:
        l_str = f" [LINK: {c['links'][0]}]" if c['links'] else ""
        img_str = f" [IMG: {c['imgs'][0]}]" if c['imgs'] else ""
        cell_strs.append(f"Col {c['col']}: '{c['text']}'{l_str}{img_str}")
    print(f"Row {r['row']:02d}: " + " | ".join(cell_strs))

with open("storage/temp/pubhtml_rows.json", "w", encoding="utf-8") as f:
    json.dump(raw_rows, f, indent=2)

print("\nSaved full pubhtml_rows.json!")
