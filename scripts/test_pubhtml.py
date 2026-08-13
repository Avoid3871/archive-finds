import urllib.request
import re

url = 'https://docs.google.com/spreadsheets/d/1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10/pubhtml'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        print('PUBHTML STATUS:', resp.status)
        content = resp.read().decode('utf-8')
        print('PUBHTML LENGTH:', len(content))
        links = re.findall(r'href=[\'"]?([^\'" >]+)', content)
        print('LINKS IN PUBHTML:', len(links))
        for l in links[:15]:
            print('  ->', l)
except Exception as e:
    print('PUBHTML ERROR:', e)
