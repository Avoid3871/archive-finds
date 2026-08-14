import os
import sys
import re
import json
import urllib.parse
import urllib.request
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Designer House Dictionary
LUXURY_BRANDS = [
    ("Rick Owens", ["rick owens", "drkshdw", "geobasket", "ramones", "ro", "geth", "bolan", "vns", "vans"]),
    ("Chrome Hearts", ["chrome hearts", "ch", "matty boy", "dagger", "horseshoe"]),
    ("Enfants Riches Déprimés", ["erd", "enfants riches deprimes", "enfants"]),
    ("Balenciaga", ["balenciaga", "blcg", "3xl", "defender", "strike", "steroid", "cargo"]),
    ("Undercover", ["undercover", "uc", "jun takahashi", "scab", "85", "68", "guruguru"]),
    ("Vetements", ["vetements", "vet", "demna", "tfd", "total fucking darkness", "bridges"]),
    ("Maison Margiela", ["maison margiela", "margiela", "mm6", "tabi", "gats", "german army trainer"]),
    ("Vivienne Westwood", ["vivienne westwood", "vivienne", "westwood", "orb"]),
    ("Dior", ["dior", "hedi slimane", "hedi", "dior homme", "clawmark", "strip"]),
    ("Number (N)ine", ["number (n)ine", "number nine", "n(n)", "nn", "takahiro miyashita", "school of visual comedy"]),
    ("Saint Michael", ["saint michael", "saint mxxxxxx", "saint m"]),
    ("Prada", ["prada", "prada sport", "linea rossa"]),
    ("Yohji Yamamoto", ["yohji yamamoto", "yohji", "pour homme", "y's"]),
    ("Alyx", ["alyx", "1017 alyx 9sm", "matthew williams"]),
    ("Junya Watanabe", ["junya watanabe", "junya", "comme des garcons", "cdg"]),
    ("Raf Simons", ["raf simons", "raf", "riot riot riot", "consumed", "virginia creeper", "closer", "poltergeist"]),
    ("Bottega Veneta", ["bottega veneta", "bottega", "bv", "tire boot", "puddle"]),
    ("Acne Studios", ["acne studios", "acne", "1981m", "1989", "super baggy"]),
    ("Miu Miu", ["miu miu", "miumiu"]),
    ("Kapital", ["kapital", "bone", "skeleton", "damask"]),
    ("Helmut Lang", ["helmut lang", "helmut", "painter denim", "astro"]),
]

COMMON_ABBREVIATIONS = {
    r'\bro\b': 'Rick Owens',
    r'\bch\b': 'Chrome Hearts',
    r'\bblcg\b': 'Balenciaga',
    r'\berd\b': 'Enfants Riches Déprimés',
    r'\buc\b': 'Undercover',
    r'\bmm\b': 'Maison Margiela',
    r'\bnn\b': 'Number (N)ine',
    r'\bv-?ns\b': 'DRKSHDW Vintage Low Vans Sneaker',
    r'\bgats?\b': 'Replica German Army Trainer GATs',
    r'\bgeos?\b': 'Geobasket Sneaker',
    r'\bramones?\b': 'Ramones Mainline Sneaker',
}

def expand_reddit_slang(text: str) -> str:
    cleaned = text
    for pattern, replacement in COMMON_ABBREVIATIONS.items():
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
    # Remove Reddit tags
    cleaned = re.sub(r'\[.*?\]|\(.*?\)|QC|FIND|W2C|LC|HAUL|from \w+', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def identify_product_metadata(query_or_title: str, comments: list[str] = None) -> dict:
    """
    Given a Reddit title/query and user comments, queries fashion retailer archives
    (Grailed, SSENSE, Justin Reed, END) via visual metadata search to resolve:
    - Exact canonical product name
    - Brand
    - Season / Year
    - Estimated Retail Price
    - High-res studio image URL
    """
    expanded = expand_reddit_slang(query_or_title)
    
    # Check comments for exact model mentions
    comment_clues = []
    if comments:
        for c in comments[:8]:
            c_clean = expand_reddit_slang(c)
            if len(c_clean) > 4 and not any(skip in c.lower() for skip in ["link", "w2c", "agent", "sugargoo", "ship", "gl", "rl", "size"]):
                comment_clues.append(c_clean)
                
    search_terms = expanded
    if comment_clues:
        search_terms += " " + " ".join(comment_clues[:2])
        
    print(f"[IDENTIFIER] Querying fashion archives for: '{search_terms}'...", flush=True)
    
    brand_detected = "Archive Collection"
    for brand, syns in LUXURY_BRANDS:
        if any(re.search(r'\b' + re.escape(s) + r'\b', search_terms.lower()) for s in syns):
            brand_detected = brand
            break
            
    res_data = {
        "brand": brand_detected,
        "canonicalTitle": f"{brand_detected} Archive Piece",
        "season": "",
        "estimatedRetail": 0.0,
        "studioImageUrl": "",
        "category": "Outerwear",
        "description": f"Authentic {brand_detected} designer archive piece."
    }

    try:
        search_query = f"{brand_detected} {expanded} Grailed SSENSE Justin Reed"
        target_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(search_query)}&form=HDRSC2&first=1"
        req = urllib.request.Request(
            target_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        )
        html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
        
        # Extract metadata from iusc attributes
        raw_matches = re.findall(r'class="iusc"[^>]*m="([^"]*)"', html)
        if not raw_matches:
            raw_matches = re.findall(r'm="(\{.*?\})"', html)
            
        SPAM_KEYWORDS = ["chat", "kate middleton", "voice", "free & safe", "bot", "apk", "app", "download", "login", "vpn", "movie", "generator", "dating", "quiz", "game", "mod", "hack", "review", "forum"]
        FASHION_KEYWORDS = ["sneaker", "shoe", "boot", "hoodie", "tee", "shirt", "jacket", "denim", "jean", "pant", "short", "coat", "blazer", "cardigan", "sweater", "vest", "bag", "leather", "zip", "low", "high", "slip", "runner", "vintage", "derby", "creeper", "track", "cross", "floral", "distressed"]

        candidate_titles = []
        for m_str in raw_matches[:15]:
            try:
                m_clean = m_str.replace("&quot;", '"').replace("&amp;", "&")
                d = json.loads(m_clean)
                t = d.get("t", "")
                murl = d.get("murl", "")
                
                # Clean title
                t_clean = re.sub(r'\s*[\|\–\-]\s*(Grailed|SSENSE|Farfetch|Justin Reed|eBay|Lyst|StockX|GOAT).*$', '', t, flags=re.IGNORECASE).strip()
                t_clean = re.sub(r'^[^\w]+', '', t_clean)
                
                # Filter out spam / non-fashion
                t_lower = t_clean.lower()
                if any(bad in t_lower for bad in SPAM_KEYWORDS):
                    continue
                    
                has_brand = brand_detected.lower() in t_lower
                has_fashion_kw = any(fkw in t_lower for fkw in FASHION_KEYWORDS)
                
                if (has_brand or has_fashion_kw) and len(t_clean.split()) >= 2 and len(t_clean) <= 90:
                    candidate_titles.append((t_clean, murl))
            except Exception:
                pass
                
        if candidate_titles:
            best_title, best_img = candidate_titles[0]
            for ct, cimg in candidate_titles:
                if ct.lower().startswith(brand_detected.lower()):
                    best_title = ct
                    best_img = cimg
                    break
                    
            res_data["canonicalTitle"] = best_title
            res_data["studioImageUrl"] = best_img
            
            season_match = re.search(r'\b(SS\d{2}|FW\d{2}|AW\d{2}|20[12]\d)\b', best_title, re.IGNORECASE)
            if season_match:
                res_data["season"] = season_match.group(1).upper()
        else:
            # Fallback to cleaned de-obfuscated query
            clean_fallback = re.sub(r'\[.*?\]|\(.*?\)|QC|FIND|W2C|LC', '', expanded).strip()
            if brand_detected.lower() not in clean_fallback.lower():
                clean_fallback = f"{brand_detected} {clean_fallback}"
            res_data["canonicalTitle"] = clean_fallback.strip()
    except Exception as e:
        print(f"[IDENTIFIER WARNING] {e}", flush=True)

    # Estimate realistic retail price based on brand and category
    category_defaults = {
        "Rick Owens": {"Sneakers": 790.0, "Outerwear": 1850.0, "Hoodies": 690.0, "Denim": 820.0, "Tops": 350.0},
        "Chrome Hearts": {"Hoodies": 1450.0, "Jewelry": 850.0, "Outerwear": 2900.0, "Denim": 2400.0, "Tops": 450.0},
        "Balenciaga": {"Sneakers": 990.0, "Hoodies": 950.0, "Outerwear": 2200.0, "Denim": 890.0, "Tops": 550.0},
        "Enfants Riches Déprimés": {"Tops": 490.0, "Hoodies": 1200.0, "Outerwear": 2800.0, "Denim": 1100.0},
        "Undercover": {"Outerwear": 1200.0, "Tops": 250.0, "Denim": 750.0, "Hoodies": 450.0},
        "Maison Margiela": {"Sneakers": 590.0, "Outerwear": 1600.0, "Tops": 390.0, "Denim": 650.0},
    }
    
    brand_table = category_defaults.get(brand_detected, {})
    for cat_name, price in brand_table.items():
        if cat_name.lower() in res_data["canonicalTitle"].lower():
            res_data["estimatedRetail"] = price
            break
            
    if res_data["estimatedRetail"] == 0.0:
        res_data["estimatedRetail"] = 650.0

    return res_data

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = " ".join(sys.argv[1:])
        res = identify_product_metadata(arg)
        print(json.dumps(res, indent=2, ensure_ascii=False))
    else:
        print("Usage: python product_identifier.py <query>")
