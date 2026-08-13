import urllib.request
import re

pubhtml_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT6-qGRXwOFYCvnqnpOP1iweDWQJWmornnr6HTmrlDFNDfNgJKLgm1qssk1WwDbNdnx7fOEjgcCo6s8/pubhtml"

req = urllib.request.Request(
    pubhtml_url,
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

print("Length of raw HTML:", len(html))
print("First 1000 characters:\n", html[:1000])

# Find iframes or sheet links
iframes = re.findall(r'<iframe[^>]+src="([^">]+)"', html)
print("\nIframes found:", iframes)

# Search for any URLs in html
urls = re.findall(r'https?://[^\s"\'<>]+', html)
print(f"\nTotal URLs found: {len(urls)}")
for u in urls[:20]:
    print("  ->", u)
