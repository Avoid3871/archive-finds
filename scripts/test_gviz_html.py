import urllib.request
import re

sheet_id = '1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10'
gid = '1523005324'

url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:html&gid={gid}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        print(f"HTML Length: {len(html)}")
        links = re.findall(r'href=[\'"]?([^\'" >]+)', html)
        print(f"Total hrefs in gviz HTML: {len(links)}")
        for l in links[:15]:
            print("  Link:", l)
except Exception as e:
    print(f"Error: {e}")
