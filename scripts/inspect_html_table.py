import urllib.request
import re
from bs4 import BeautifulSoup

sheet_id = '1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI'
gid = '1553171019' # TOPS

url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/htmlview/sheet?headers=true&gid={gid}"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

print(f"HTML size: {len(html)}")

soup = BeautifulSoup(html, 'html.parser')
rows = soup.find_all('tr')
print(f"Total HTML Table Rows: {len(rows)}")

for idx, r in enumerate(rows[1:10]):
    tds = r.find_all('td')
    row_text = [td.get_text().strip() for td in tds]
    imgs = [img['src'] for img in r.find_all('img') if img.has_attr('src')]
    links = [a['href'] for a in r.find_all('a') if a.has_attr('href')]
    print(f"\n--- HTML Row {idx+1} ---")
    print(f"Text: {row_text[:5]}")
    print(f"Imgs: {imgs}")
    print(f"Links: {links}")
