import urllib.parse
import requests
import re
import json

def get_garment_images(query: str, count: int = 5):
    """
    Scrapes high-resolution clean garment images using DuckDuckGo/Bing HTML scraping.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # Method 1: DuckDuckGo token & i.js
    try:
        token_url = f"https://duckduckgo.com/?q={urllib.parse.quote(query + ' product garment')}&t=h_&iar=images&iax=images&ia=images"
        sess = requests.Session()
        res = sess.get(token_url, headers=headers, timeout=8)
        vqd_match = re.search(r'vqd=([\d-]+)', res.text)
        if vqd_match:
            vqd = vqd_match.group(1)
            api_url = f"https://duckduckgo.com/i.js?l=us-en&o=json&q={urllib.parse.quote(query)}&vqd={vqd}&f=,,,&p=1"
            api_res = sess.get(api_url, headers=headers, timeout=8)
            if api_res.status_code == 200:
                data = api_res.json()
                urls = [r["image"] for r in data.get("results", []) if "image" in r]
                if urls:
                    return urls[:count]
    except Exception as e:
        print(f"DDG error: {e}")

    # Method 2: Bing Images Scrape
    try:
        bing_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query + ' product white background')}&form=HDRSC2"
        res = requests.get(bing_url, headers=headers, timeout=8)
        matches = re.findall(r'murl&quot;:&quot;(https?://[^&quot;]+)&quot;', res.text)
        if matches:
            return matches[:count]
    except Exception as e:
        print(f"Bing error: {e}")

    return []

if __name__ == "__main__":
    imgs = get_garment_images("Chrome Hearts Soap and Water Hoodie")
    print("Found images:", imgs)
