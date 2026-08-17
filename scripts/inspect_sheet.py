import urllib.request
import re
import json

sheet_id = '1tA1QwceEtsyzXtUN6mHewhuTdoSaOKIaTL9PqGotKsI'
url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/htmlview'

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    print(f"HTML Length: {len(html)}")
    
    # Check for bootstrap data or sheet definitions
    sheet_matches = re.findall(r'item-name">([^<]+)<', html)
    print("Item names:", sheet_matches)
    
    tab_matches = re.findall(r'<li id="sheet-button-([^"]+)"[^>]*><a[^>]*>([^<]+)</a>', html)
    print("Tab matches:", tab_matches)
    
    # Let's search for gid patterns
    gids = re.findall(r'gid=(\d+)', html)
    print("GIDs found:", set(gids))
    
    # Save a slice of html for inspection
    with open('scratch_sheet.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
except Exception as e:
    print("Error:", e)
