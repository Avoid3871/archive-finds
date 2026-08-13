import urllib.request
import re
import json

pubhtml_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8/pubhtml'

req = urllib.request.Request(pubhtml_url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        print(f"Downloaded HTML, Length: {len(html)}")
        
        # Save dump
        with open('scripts/published_dump.html', 'w', encoding='utf-8') as f:
            f.write(html)
            
        # Find all <a> tags
        anchors = re.findall(r'<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL)
        print(f"Total <a> anchors found: {len(anchors)}")
        
        for idx, (href, text) in enumerate(anchors[:20]):
            clean_text = re.sub(r'<[^>]+>', '', text).strip()
            print(f"[{idx+1}] Text: '{clean_text}' -> URL: {href}")

except Exception as e:
    print("Error fetching published html:", e)
