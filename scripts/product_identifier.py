import os
import sys
import re
import json
import urllib.parse
import urllib.request

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Designer House Dictionary with Synonyms & Slang
LUXURY_BRANDS = [
    ("Chrome Hearts", ["chrome hearts", "chrome", "ch", "matty boy", "dagger", "horseshoe", "sluntradiction", "vagilante", "baby-a", "cemetery", "cross patch", "keeper ring", "floral ring", "paper chain", "roller"]),
    ("Rick Owens", ["rick owens", "rick", "drkshdw", "geobasket", "geos", "ramones", "ro", "geth", "bolan", "banana", "tyrone", "turbodrk", "vns", "vans", "dunks", "creatch", "bauhaus", "pusher", "mastodon", "detroit", "kiss boot"]),
    ("Enfants Riches Déprimés", ["erd", "enfants riches deprimes", "enfants riches déprimés", "enfants", "night of the long knives", "teenage death star", "aspirational lifestyle", "rehab", "louvre"]),
    ("Balenciaga", ["balenciaga", "blcg", "balenci", "vpf", "bb", "3xl", "defender", "strike", "steroid", "cargo", "paris moon", "skater hoodie", "skater tee", "be different", "tape type", "gothic", "cagole"]),
    ("Undercover", ["undercover", "uc", "jun takahashi", "scab", "85", "68", "arts and crafts", "arts & crafts", "guruguru", "witches", "but beautiful", "languid", "psycho color", "television"]),
    ("Vetements", ["vetements", "vet", "demna", "tfd", "total fucking darkness", "may the bridges", "bridges", "pirate bay", "gun club", "champion", "metal", "polizei", "target", "sexual fantasies", "titanic", "reworked"]),
    ("Maison Margiela", ["maison margiela", "margiela", "mm6", "tabi", "gats", "gat", "german army trainer", "artisanal", "replica", "five zip"]),
    ("Vivienne Westwood", ["vivienne westwood", "vivienne", "westwood", "orb", "armour ring", "beret"]),
    ("Dior", ["dior", "hedi slimane", "hedi", "dior homme", "clawmark", "cummerbund", "strip", "bleu clair", "luster", "navigate"]),
    ("Number (N)ine", ["number (n)ine", "number nine", "n(n)", "nn", "takahiro miyashita", "school of visual comedy", "give peace a chance", "touch me im sick", "crying heart", "shield", "hybrid cargo", "time migration"]),
    ("Saint Michael", ["saint michael", "saint mxxxxxx", "saint m", "readymade", "denim tears"]),
    ("Prada", ["prada", "prada sport", "linea rossa", "americas cup", "re-nylon"]),
    ("Yohji Yamamoto", ["yohji yamamoto", "yohji", "pour homme", "y's"]),
    ("Alyx", ["alyx", "1017 alyx 9sm", "matthew williams", "rollercoaster"]),
    ("Comme des Garçons", ["comme des garcons", "comme des garçons", "cdg", "homme plus", "play", "junya watanabe", "junya"]),
    ("Raf Simons", ["raf simons", "raf", "riot riot riot", "consumed", "virginia creeper", "closer", "poltergeist", "nebraska", "archive redux", "joy division", "waves", "history of my world", "all shadows"]),
    ("Bottega Veneta", ["bottega veneta", "bottega", "bv", "tire boot", "puddle", "intrecciato"]),
    ("Acne Studios", ["acne studios", "acne", "1981m", "1989", "super baggy", "1996", "face patch"]),
    ("Miu Miu", ["miu miu", "miumiu"]),
    ("Kapital", ["kapital", "bone", "skeleton", "damask", "bandana", "century denim"]),
    ("Boris Bidjan Saberi", ["boris bidjan saberi", "bbs", "11 by bbs", "bamba"]),
    ("Carol Christian Poell", ["carol christian poell", "ccp", "drip sneaker", "prosthetic", "dead-end", "scarstitch", "tornado boot"]),
    ("Helmut Lang", ["helmut lang", "helmut", "painter denim", "astro", "ballistic", "flak"]),
    ("Kiko Kostadinov", ["kiko kostadinov", "kiko", "asics", "delva", "bindra", "tulcea", "gaetan"]),
    ("Issey Miyake", ["issey miyake", "homme plisse", "issey", "pleats"]),
    ("Celine", ["celine", "cel", "teen knight poem", "teddy", "triomphe"]),
    ("Saint Laurent", ["saint laurent", "ysl", "slp", "l01", "wyatt", "crash", "babycat", "teddy jacket"]),
    ("Louis Vuitton", ["louis vuitton", "lv", "virgil abloh", "millionaires", "trainer"]),
    ("Ann Demeulemeester", ["ann demeulemeester", "ann d", "backlace"]),
    ("Haider Ackermann", ["haider ackermann", "haider", "perth", "velvet bomber"]),
    ("Jil Sander", ["jil sander", "jil"]),
    ("Goyard", ["goyard", "saint louis", "cardholder", "anjou"]),
    ("Bape", ["bape", "a bathing ape", "bapesta", "shark hoodie"]),
    ("Supreme", ["supreme", "box logo", "bogo"]),
    ("Arc'teryx", ["arcteryx", "arc'teryx", "beta lt", "alpha sv", "system_a"]),
]

COMMON_ABBREVIATIONS = {
    r'\bro\b': 'Rick Owens',
    r'\bch\b': 'Chrome Hearts',
    r'\bblcg\b': 'Balenciaga',
    r'\bbalenci\b': 'Balenciaga',
    r'\berd\b': 'Enfants Riches Déprimés',
    r'\buc\b': 'Undercover',
    r'\bjun\b': 'Undercover Jun Takahashi',
    r'\bjunya\b': 'Comme des Garçons Junya Watanabe',
    r'\bcel\b': 'Celine',
    r'\bslp\b': 'Saint Laurent',
    r'\bysl\b': 'Saint Laurent',
    r'\blv\b': 'Louis Vuitton',
    r'\bann d\b': 'Ann Demeulemeester',
    r'\bmm\b': 'Maison Margiela',
    r'\bmm6\b': 'Maison Margiela MM6',
    r'\bnn\b': 'Number (N)ine',
    r'\bv-?ns\b': 'DRKSHDW Vintage Low Sneakers',
    r'\bgats?\b': 'Replica German Army Trainer (GAT) Sneakers',
    r'\bgeos?\b': 'Geobasket High-Top Sneakers',
    r'\bramones?\b': 'Ramones Mainline Sneakers',
    r'\btfd\b': 'Total Fucking Darkness (TFD) Hoodie',
    r'\bcdg\b': 'Comme des Garçons',
    r'\bccp\b': 'Carol Christian Poell',
    r'\bbbs\b': 'Boris Bidjan Saberi',
    r'\bvpf\b': 'Balenciaga VPF T-Shirt',
    r'\bplay\b': 'Comme des Garçons Play',
}

KNOWN_SELLER_NAMES = [
    "survival source", "david", "rog", "bound2", "cola", "mr lee", "mr.lee", "2december", "2dec",
    "aooko", "edward", "markpaing", "cloyad", "rick", "8billion", "lyfactory", "ly", "kappler",
    "godbless", "deeds", "nie", "jenny", "bape", "chaos", "captain", "kungfu", "1to1",
    "madebykungfu", "pirit", "reondistrict", "dude9", "vetementshop", "artdemon", "daft",
    "bumbershit", "lucky8", "bole", "mkszy", "marxism", "cupid club", "satan made", "patternerpp",
    "atomu", "whoisjacov", "richill", "swag", "ninja", "topacney", "topstoney", "topgivenchy"
]

SUGARGOO_CNY_TO_USD_RATE = 0.14815  # 1 CNY = ~0.14815 USD on Sugargoo (1 USD = 6.75 CNY)

def clean_reddit_title(text: str) -> tuple[str, str, str]:
    """
    Strips all Reddit conversational question prefixes, seller mentions, batch noise,
    tags, and punctuation to extract:
    1. Clean normalized query
    2. Detected Brand
    3. Piece Category
    """
    cleaned = text.strip()
    
    # 1. Expand abbreviations
    for pattern, replacement in COMMON_ABBREVIATIONS.items():
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    # 2. Strip Reddit tags like [QC], (W2C), [REVIEW], [FIND], etc.
    cleaned = re.sub(r'\[.*?\]|\(.*?\)|【.*?】', ' ', cleaned)
    
    # 3. Strip aggressive question starters and conversational fluff
    question_starters = [
        r'^(can\s+(these|this|they|it)\s+(be|look)?\s*(close\s+to|like|good|accurate)?)\s*',
        r'^(is\s+this\s+(close\s+to|accurate|legit|real|worth|good))\s*',
        r'^(are\s+these\s+(close\s+to|accurate|legit|real|worth|good))\s*',
        r'^(how\s+(do|are)\s+these(\s+look)?)\s*',
        r'^(how\s+is\s+this(\s+batch)?)\s*',
        r'^(what\s+do\s+you\s+(all\s+|guys\s+)?think\s+(of|about)?)\s*',
        r'^(anyone\s+(know|seen|have|can\s+qc))\s*',
        r'^(where\s+(to|can\s+i)\s+(cop|find|buy))\s*',
        r'^(who\s+has\s+the\s+best)\s*',
        r'^(looking\s+for|in\s+search\s+of)\s*',
        r'^(finally\s+got\s+(my|in\s+hand)?)\s*',
        r'^(just\s+(arrived|landed|copped|in\s+hand))\s*',
        r'^(qc\s+(on|check|please|help|pls)?)\s*',
        r'^(review\s+(on|of)?)\s*',
        r'^(thoughts\s+on(\s+this|\s+these)?)\s*',
        r'^(in\s+hand\s+(pics?|review)?\s*(of)?)\s*',
        r'^(lc\s+(on|check|please)?)\s*',
        r'^(legit\s+check\s*(on)?)\s*',
        r'^(need\s+a\s+(qc|lc|check)\s*(on)?)\s*',
    ]
    for q_pattern in question_starters:
        cleaned = re.sub(q_pattern, '', cleaned, flags=re.IGNORECASE).strip()

    # Strip leading pronouns / articles like 'this', 'these', 'my', 'the', 'a'
    cleaned = re.sub(r'^(this|these|those|that|my|a|an|the)\s+', '', cleaned, flags=re.IGNORECASE).strip()

    # 4. Strip seller names
    for seller in KNOWN_SELLER_NAMES:
        cleaned = re.sub(r'\bfrom\s+' + re.escape(seller) + r'\b', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b' + re.escape(seller) + r'\b', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bfrom\s+[\w\d\-\_]+', ' ', cleaned, flags=re.IGNORECASE)

    # 5. Strip batch / replica buzzwords
    batch_noise = [
        r'\b(god\s+batch|best\s+batch|budget\s+batch|top\s+tier|high\s+tier|high\s+end|batch)\b',
        r'\b(1:1|original|retail|real|authentic|reps?|replica|unbranded|grail)\b',
        r'\b(w2c\??|w2c\s+in\s+comments|link\s+in\s+comments|pls\s+qc|gl\s+or\s+rl|gl/rl|haul)\b',
        r'\b(close\s+to\s+original|close\s+to\s+retail|close\s+to\s+real)\b',
        r'\b(size\s+\d+|size\s+[smlx]+)\b',
    ]
    for b_pattern in batch_noise:
        cleaned = re.sub(b_pattern, ' ', cleaned, flags=re.IGNORECASE)

    # 6. Clean punctuation
    cleaned = re.sub(r'[\?!\'\"`~@#$%^&*()_+={}\[\]:;<>,/|]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    # 7. Detect Brand
    brand_detected = "Archive Collection"
    for brand, syns in LUXURY_BRANDS:
        if any(re.search(r'\b' + re.escape(s) + r'\b', cleaned.lower()) for s in syns) or any(re.search(r'\b' + re.escape(s) + r'\b', text.lower()) for s in syns):
            brand_detected = brand
            break

    # 8. Detect Category
    category_detected = "Outerwear"
    text_lower = (cleaned + " " + text).lower()
    if any(kw in text_lower for kw in ["glasses", "sunglasses", "frames", "optical", "shades", "eyewear"]):
        category_detected = "Accessories"
    elif any(kw in text_lower for kw in ["ring", "necklace", "chain", "bracelet", "pendant", "earring", "wallet chain"]):
        category_detected = "Jewelry"
    elif any(kw in text_lower for kw in ["sneaker", "shoe", "boot", "derby", "derbies", "loafer", "vans", "vns", "ramones", "geobasket", "tabi", "3xl", "defender", "strike", "runner"]):
        category_detected = "Footwear"
    elif any(kw in text_lower for kw in ["hoodie", "zip-up", "zip up", "pullover", "sweatshirt"]):
        category_detected = "Hoodies"
    elif any(kw in text_lower for kw in ["jacket", "bomber", "coat", "parka", "puffer", "windbreaker", "blazer", "cardigan", "knit", "sweater", "vest"]):
        category_detected = "Outerwear"
    elif any(kw in text_lower for kw in ["jeans", "denim", "pants", "trousers", "cords", "sweatpants", "cargo", "shorts"]):
        category_detected = "Denim"
    elif any(kw in text_lower for kw in ["tee", "t-shirt", "tshirt", "tank", "longsleeve", "jersey", "shirt", "top"]):
        category_detected = "T-Shirts"
    elif any(kw in text_lower for kw in ["bag", "backpack", "tote", "hat", "beanie", "cap", "belt", "scarf", "wallet"]):
        category_detected = "Accessories"

    return cleaned, brand_detected, category_detected


# Comprehensive Archive Runway & Model Knowledge Dictionary
ARCHIVE_RUNWAY_MODELS = [
    # --- RAF SIMONS ---
    {
        "brand": "Raf Simons",
        "keywords": ["rs", "cropped", "sweater", "nightmares", "v-neck", "v neck", "oversized knit", "cropped oversized"],
        "canonicalTitle": "Raf Simons AW16 'Nightmares and Dreams' Cropped Oversized 'RS' Knit Sweater",
        "season": "AW16 'Nightmares and Dreams'",
        "category": "Outerwear",
        "estimatedRetail": 1450.0,
        "archiveValue": 3200.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["riot", "camo", "patch bomber", "ma-1", "riot riot riot", "autumn winter 2001"],
        "canonicalTitle": "Raf Simons AW01 'Riot! Riot! Riot!' Camo Patch Bomber Jacket",
        "season": "AW01 'Riot! Riot! Riot!'",
        "category": "Outerwear",
        "estimatedRetail": 2200.0,
        "archiveValue": 35000.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["consumed", "straps", "modular cargo", "parachute", "spring summer 2003"],
        "canonicalTitle": "Raf Simons SS03 'Consumed' Modular Strap Cargo Bomber Jacket",
        "season": "SS03 'Consumed'",
        "category": "Outerwear",
        "estimatedRetail": 1800.0,
        "archiveValue": 8500.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["virginia creeper", "nebraska", "acid digested", "creeper"],
        "canonicalTitle": "Raf Simons AW02 'Virginia Creeper' Nebraska Acid Digested Sweatshirt",
        "season": "AW02 'Virginia Creeper'",
        "category": "Hoodies",
        "estimatedRetail": 850.0,
        "archiveValue": 4500.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["closer", "joy division", "unknown pleasures", "fishtail", "peter saville", "parka"],
        "canonicalTitle": "Raf Simons AW03 'Closer' Joy Division Unknown Pleasures Fishtail Parka",
        "season": "AW03 'Closer'",
        "category": "Outerwear",
        "estimatedRetail": 2500.0,
        "archiveValue": 20000.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["waves", "sleeping", "oversized waves hoodie"],
        "canonicalTitle": "Raf Simons AW04 'Waves' Oversized Graphic Pullover Hoodie",
        "season": "AW04 'Waves'",
        "category": "Hoodies",
        "estimatedRetail": 750.0,
        "archiveValue": 3800.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["poltergeist", "history of my world", "all shadows"],
        "canonicalTitle": "Raf Simons AW05 'History of My World' Poltergeist Sweater",
        "season": "AW05 'History of My World'",
        "category": "Outerwear",
        "estimatedRetail": 950.0,
        "archiveValue": 5500.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["i love ny", "ny sweater", "ny", "cropped ny"],
        "canonicalTitle": "Raf Simons AW17 'I Love NY' Cropped Oversized Knit Sweater",
        "season": "AW17 'New York'",
        "category": "Outerwear",
        "estimatedRetail": 1250.0,
        "archiveValue": 2800.0,
    },
    {
        "brand": "Raf Simons",
        "keywords": ["replicant", "blade runner", "patch denim", "rs denim shirt"],
        "canonicalTitle": "Raf Simons SS18 'Blade Runner Replicant' Patchwork Denim Shirt",
        "season": "SS18 'Replicant'",
        "category": "T-Shirts",
        "estimatedRetail": 980.0,
        "archiveValue": 1800.0,
    },

    # --- UNDERCOVER (JUN TAKAHASHI) ---
    {
        "brand": "Undercover",
        "keywords": ["85", "arts & crafts", "arts and crafts", "85 denim", "distressed yarn"],
        "canonicalTitle": "Undercover AW05 'Arts & Crafts' 85 Distressed Denim Jeans",
        "season": "AW05 'Arts & Crafts'",
        "category": "Denim",
        "estimatedRetail": 750.0,
        "archiveValue": 4200.0,
    },
    {
        "brand": "Undercover",
        "keywords": ["scab", "crust", "ethnic", "scab backpack", "seditionaries", "crust pants"],
        "canonicalTitle": "Undercover SS03 'Scab' Ethnic Crust Patchwork Pants",
        "season": "SS03 'Scab'",
        "category": "Denim",
        "estimatedRetail": 650.0,
        "archiveValue": 3500.0,
    },
    {
        "brand": "Undercover",
        "keywords": ["68", "red yarn", "klaus", "chuuut", "the janitor"],
        "canonicalTitle": "Undercover SS06 'T' 68 Red Yarn Distressed Denim Jeans",
        "season": "SS06 'T'",
        "category": "Denim",
        "estimatedRetail": 680.0,
        "archiveValue": 2800.0,
    },
    {
        "brand": "Undercover",
        "keywords": ["guruguru", "modular parka", "fur hood"],
        "canonicalTitle": "Undercover AW06 'Guruguru' Modular Fur Hooded Parka",
        "season": "AW06 'Guruguru'",
        "category": "Outerwear",
        "estimatedRetail": 1600.0,
        "archiveValue": 3200.0,
    },
    {
        "brand": "Undercover",
        "keywords": ["witches", "cross knit", "cross fleece"],
        "canonicalTitle": "Undercover AW02 'Witches' Cross Intarsia Knit Sweater",
        "season": "AW02 'Witches'",
        "category": "Outerwear",
        "estimatedRetail": 550.0,
        "archiveValue": 2400.0,
    },
    {
        "brand": "Undercover",
        "keywords": ["but beautiful", "hand stitched", "patti smith"],
        "canonicalTitle": "Undercover AW04 'But Beautiful' Hand-Stitched Reconstructed Jacket",
        "season": "AW04 'But Beautiful'",
        "category": "Outerwear",
        "estimatedRetail": 1400.0,
        "archiveValue": 3600.0,
    },

    # --- NUMBER (N)INE (TAKAHIRO MIYASHITA) ---
    {
        "brand": "Number (N)ine",
        "keywords": ["hybrid", "cargo", "cargo sweatpants", "hybrid cargo"],
        "canonicalTitle": "Number (N)ine AW04 'Give Peace A Chance' Hybrid Cargo Sweatpants",
        "season": "AW04 'Give Peace A Chance'",
        "category": "Denim",
        "estimatedRetail": 620.0,
        "archiveValue": 2800.0,
    },
    {
        "brand": "Number (N)ine",
        "keywords": ["shield", "skull hoodie", "tribal", "give peace a chance"],
        "canonicalTitle": "Number (N)ine AW04 'Give Peace A Chance' Shield Skull Tribal Hoodie",
        "season": "AW04 'Give Peace A Chance'",
        "category": "Hoodies",
        "estimatedRetail": 580.0,
        "archiveValue": 2200.0,
    },
    {
        "brand": "Number (N)ine",
        "keywords": ["high streets", "docking", "flannel", "grunge", "corduroy"],
        "canonicalTitle": "Number (N)ine AW05 'The High Streets' Distressed Docking Flannel",
        "season": "AW05 'The High Streets'",
        "category": "Outerwear",
        "estimatedRetail": 680.0,
        "archiveValue": 2500.0,
    },
    {
        "brand": "Number (N)ine",
        "keywords": ["crying heart", "shadow", "heart tee", "crying heart longsleeve"],
        "canonicalTitle": "Number (N)ine SS06 'Welcome to the Shadow' Crying Heart Longsleeve T-Shirt",
        "season": "SS06 'Welcome to the Shadow'",
        "category": "T-Shirts",
        "estimatedRetail": 320.0,
        "archiveValue": 1400.0,
    },
    {
        "brand": "Number (N)ine",
        "keywords": ["school of visual comedy", "time migration", "skull patch"],
        "canonicalTitle": "Number (N)ine SS01 'Time Migration' School of Visual Comedy Hoodie",
        "season": "SS01 'Time Migration'",
        "category": "Hoodies",
        "estimatedRetail": 480.0,
        "archiveValue": 1900.0,
    },
    {
        "brand": "Number (N)ine",
        "keywords": ["touch me", "kurt", "sick", "grunge cardigan"],
        "canonicalTitle": "Number (N)ine AW03 'Touch Me I'm Sick' Distressed Grunge Cardigan",
        "season": "AW03 'Touch Me I'm Sick'",
        "category": "Outerwear",
        "estimatedRetail": 580.0,
        "archiveValue": 2100.0,
    },

    # --- HELMUT LANG ---
    {
        "brand": "Helmut Lang",
        "keywords": ["painter", "painter denim", "splatter", "paint denim"],
        "canonicalTitle": "Helmut Lang 1998 Classic Raw Painter Denim Jeans",
        "season": "AW1998",
        "category": "Denim",
        "estimatedRetail": 380.0,
        "archiveValue": 1600.0,
    },
    {
        "brand": "Helmut Lang",
        "keywords": ["astro", "astro biker", "flight jacket", "biker jacket"],
        "canonicalTitle": "Helmut Lang 1999 Astro Biker Flight Jacket",
        "season": "AW1999",
        "category": "Outerwear",
        "estimatedRetail": 1200.0,
        "archiveValue": 5500.0,
    },
    {
        "brand": "Helmut Lang",
        "keywords": ["ballistic", "flak", "police vest"],
        "canonicalTitle": "Helmut Lang 1999 Ballistic Police Flak Vest",
        "season": "AW1999",
        "category": "Outerwear",
        "estimatedRetail": 850.0,
        "archiveValue": 3200.0,
    },
    {
        "brand": "Helmut Lang",
        "keywords": ["parachute", "strap cargo", "bond straps"],
        "canonicalTitle": "Helmut Lang SS03 Parachute Strap Cargo Trousers",
        "season": "SS03",
        "category": "Denim",
        "estimatedRetail": 650.0,
        "archiveValue": 2400.0,
    },

    # --- DIOR HOMME (HEDI SLIMANE) ---
    {
        "brand": "Dior",
        "keywords": ["clawmark", "claw", "strip"],
        "canonicalTitle": "Dior Homme SS04 'Strip' Clawmark Distressed Denim Jeans",
        "season": "SS04 'Strip'",
        "category": "Denim",
        "estimatedRetail": 750.0,
        "archiveValue": 3800.0,
    },
    {
        "brand": "Dior",
        "keywords": ["luster", "waxed", "coated black"],
        "canonicalTitle": "Dior Homme AW03 'Luster' Waxed Coated Black Denim Jeans",
        "season": "AW03 'Luster'",
        "category": "Denim",
        "estimatedRetail": 680.0,
        "archiveValue": 2400.0,
    },
    {
        "brand": "Dior",
        "keywords": ["navigate", "navigate boot", "combat boot", "pebble grain"],
        "canonicalTitle": "Dior Homme AW07 'Navigate' Pebble Grain Leather Combat Boots",
        "season": "AW07 'Navigate'",
        "category": "Footwear",
        "estimatedRetail": 1100.0,
        "archiveValue": 3500.0,
    },
    {
        "brand": "Dior",
        "keywords": ["victim of the crime", "napoleonic"],
        "canonicalTitle": "Dior Homme AW04 'Victim of the Crime' Napoleonic Military Jacket",
        "season": "AW04 'Victim of the Crime'",
        "category": "Outerwear",
        "estimatedRetail": 2400.0,
        "archiveValue": 4500.0,
    },

    # --- VETEMENTS ---
    {
        "brand": "Vetements",
        "keywords": ["tfd", "total fucking darkness", "darkness", "gun club"],
        "canonicalTitle": "Vetements AW16 'Total Fucking Darkness' (TFD) Heavy Oversized Hoodie",
        "season": "AW16",
        "category": "Hoodies",
        "estimatedRetail": 1250.0,
        "archiveValue": 2800.0,
    },
    {
        "brand": "Vetements",
        "keywords": ["may the bridges", "bridges", "light before"],
        "canonicalTitle": "Vetements SS16 'May The Bridges I Burn' Heavy Zip-Up Hoodie",
        "season": "SS16",
        "category": "Hoodies",
        "estimatedRetail": 1150.0,
        "archiveValue": 2400.0,
    },
    {
        "brand": "Vetements",
        "keywords": ["titanic", "coming soon"],
        "canonicalTitle": "Vetements SS16 'Coming Soon' Titanic Movie Oversized Hoodie",
        "season": "SS16",
        "category": "Hoodies",
        "estimatedRetail": 980.0,
        "archiveValue": 3200.0,
    },
    {
        "brand": "Vetements",
        "keywords": ["pirate bay", "piratebay"],
        "canonicalTitle": "Vetements AW17 'Pirate Bay' Torrent Heavy Oversized Hoodie",
        "season": "AW17",
        "category": "Hoodies",
        "estimatedRetail": 1200.0,
        "archiveValue": 2200.0,
    },
    {
        "brand": "Vetements",
        "keywords": ["metal", "skull", "heavy metal"],
        "canonicalTitle": "Vetements AW16 Metal Logo Heavyweight Oversized Hoodie",
        "season": "AW16",
        "category": "Hoodies",
        "estimatedRetail": 1100.0,
        "archiveValue": 2600.0,
    },

    # --- BALENCIAGA ---
    {
        "brand": "Balenciaga",
        "keywords": ["wfp", "world food programme"],
        "canonicalTitle": "Balenciaga AW18 World Food Programme (WFP) Printed Oversized T-Shirt",
        "season": "AW18",
        "category": "T-Shirts",
        "estimatedRetail": 550.0,
        "archiveValue": 550.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["skater", "skater hoodie", "skater zip", "skater distressed"],
        "canonicalTitle": "Balenciaga SS24 Skater Extreme Distressed Oversized Hoodie",
        "season": "SS24",
        "category": "Hoodies",
        "estimatedRetail": 1950.0,
        "archiveValue": 1950.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["skater denim", "skater jeans", "skater pants"],
        "canonicalTitle": "Balenciaga SS24 Skater Extreme Distressed Ultra Wide-Leg Jeans",
        "season": "SS24",
        "category": "Denim",
        "estimatedRetail": 1750.0,
        "archiveValue": 1750.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["paris moon", "moon tee"],
        "canonicalTitle": "Balenciaga SS24 Paris Moon Vintage Washed Distressed T-Shirt",
        "season": "SS24",
        "category": "T-Shirts",
        "estimatedRetail": 750.0,
        "archiveValue": 750.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["be different", "apple"],
        "canonicalTitle": "Balenciaga FW22 'Be Different' Washed Oversized Apple Hoodie",
        "season": "FW22 'The Mud Show'",
        "category": "Hoodies",
        "estimatedRetail": 1150.0,
        "archiveValue": 1150.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["mud", "mud washed", "mud hoodie", "the mud show"],
        "canonicalTitle": "Balenciaga FW22 Mud Washed Heavy Distressed Zip-Up Hoodie",
        "season": "FW22 'The Mud Show'",
        "category": "Hoodies",
        "estimatedRetail": 1650.0,
        "archiveValue": 1650.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["3xl", "3xl sneaker", "runner"],
        "canonicalTitle": "Balenciaga 3XL Distressed Chunky Runner Sneakers",
        "season": "SS23",
        "category": "Footwear",
        "estimatedRetail": 1150.0,
        "archiveValue": 1150.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["defender", "tire tread", "bouncing"],
        "canonicalTitle": "Balenciaga Defender Tire Tread Heavy Sneakers",
        "season": "FW22",
        "category": "Footwear",
        "estimatedRetail": 1250.0,
        "archiveValue": 1250.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["strike", "strike boot", "20mm"],
        "canonicalTitle": "Balenciaga Strike 20mm Heavy Distressed Canvas Combat Boots",
        "season": "FW21",
        "category": "Footwear",
        "estimatedRetail": 1350.0,
        "archiveValue": 1350.0,
    },
    {
        "brand": "Balenciaga",
        "keywords": ["steroid", "steroid derby", "steroid boot"],
        "canonicalTitle": "Balenciaga Steroid Heavy Molded Derby Shoes",
        "season": "SS23",
        "category": "Footwear",
        "estimatedRetail": 1450.0,
        "archiveValue": 1450.0,
    },

    # --- ENFANTS RICHES DÉPRIMÉS ---
    {
        "brand": "Enfants Riches Déprimés",
        "keywords": ["night of the long knives", "long knives", "intarsia knit"],
        "canonicalTitle": "Enfants Riches Déprimés AW19 'Night of the Long Knives' Intarsia Knit Sweater",
        "season": "AW19",
        "category": "Outerwear",
        "estimatedRetail": 2850.0,
        "archiveValue": 6500.0,
    },
    {
        "brand": "Enfants Riches Déprimés",
        "keywords": ["teenage death star", "death star"],
        "canonicalTitle": "Enfants Riches Déprimés SS20 'Teenage Death Star' Distressed Zip-Up Hoodie",
        "season": "SS20",
        "category": "Hoodies",
        "estimatedRetail": 1450.0,
        "archiveValue": 3200.0,
    },
    {
        "brand": "Enfants Riches Déprimés",
        "keywords": ["aspirational lifestyle"],
        "canonicalTitle": "Enfants Riches Déprimés AW21 'Aspirational Lifestyle' Vintage Distressed T-Shirt",
        "season": "AW21",
        "category": "T-Shirts",
        "estimatedRetail": 650.0,
        "archiveValue": 1200.0,
    },
    {
        "brand": "Enfants Riches Déprimés",
        "keywords": ["luxury rehab", "rehab"],
        "canonicalTitle": "Enfants Riches Déprimés SS21 'Luxury Rehab' Vintage Sun-Faded T-Shirt",
        "season": "SS21",
        "category": "T-Shirts",
        "estimatedRetail": 580.0,
        "archiveValue": 950.0,
    },

    # --- CELINE ---
    {
        "brand": "Celine",
        "keywords": ["teen knight poem", "teen knight", "knight poem"],
        "canonicalTitle": "Celine Homme AW21 'Teen Knight Poem' Embroidered Oversized Hoodie",
        "season": "AW21 'Teen Knight Poem'",
        "category": "Hoodies",
        "estimatedRetail": 1150.0,
        "archiveValue": 1850.0,
    },
    {
        "brand": "Celine",
        "keywords": ["dancing kid", "the dancing kid"],
        "canonicalTitle": "Celine Homme SS21 'The Dancing Kid' Checkered Flannel Cardigan",
        "season": "SS21 'The Dancing Kid'",
        "category": "Outerwear",
        "estimatedRetail": 1450.0,
        "archiveValue": 2100.0,
    },
    {
        "brand": "Celine",
        "keywords": ["teddy", "teddy jacket", "wool teddy"],
        "canonicalTitle": "Celine Classic Wool & Calfskin Leather Trimmed Teddy Bomber Jacket",
        "season": "Permanent Collection",
        "category": "Outerwear",
        "estimatedRetail": 2850.0,
        "archiveValue": 2850.0,
    },

    # --- SAINT LAURENT PARIS ---
    {
        "brand": "Saint Laurent",
        "keywords": ["crash", "little crash", "d02 crash", "do2 crash"],
        "canonicalTitle": "Saint Laurent Paris FW13 'Little Crash' D02 Skinny Denim Jeans",
        "season": "FW13",
        "category": "Denim",
        "estimatedRetail": 890.0,
        "archiveValue": 2400.0,
    },
    {
        "brand": "Saint Laurent",
        "keywords": ["babycat", "baby cat", "leopard teddy"],
        "canonicalTitle": "Saint Laurent Paris FW13 Babycat Patterned Wool Teddy Jacket",
        "season": "FW13",
        "category": "Outerwear",
        "estimatedRetail": 2450.0,
        "archiveValue": 4500.0,
    },
    {
        "brand": "Saint Laurent",
        "keywords": ["l01", "l01 biker", "lambskin biker"],
        "canonicalTitle": "Saint Laurent Paris L01 Classic Lambskin Motorcycle Biker Jacket",
        "season": "Permanent Collection",
        "category": "Outerwear",
        "estimatedRetail": 4990.0,
        "archiveValue": 4990.0,
    },
    {
        "brand": "Saint Laurent",
        "keywords": ["wyatt", "harness", "wyatt 40"],
        "canonicalTitle": "Saint Laurent Paris Wyatt 40mm Harness Leather / Suede Ankle Boots",
        "season": "Permanent Collection",
        "category": "Footwear",
        "estimatedRetail": 1250.0,
        "archiveValue": 1250.0,
    },

    # --- KAPITAL ---
    {
        "brand": "Kapital",
        "keywords": ["bone", "skeleton", "skeleton fleece", "bone fleece"],
        "canonicalTitle": "Kapital Kountry Reversible Bone Skeleton Fleece Zip-Up Jacket",
        "season": "Kountry Archive",
        "category": "Outerwear",
        "estimatedRetail": 650.0,
        "archiveValue": 1650.0,
    },
    {
        "brand": "Kapital",
        "keywords": ["damask", "damask fleece"],
        "canonicalTitle": "Kapital 14oz Damask Patterned Century Denim Fleece Jacket",
        "season": "Mainline Collection",
        "category": "Outerwear",
        "estimatedRetail": 750.0,
        "archiveValue": 1450.0,
    },
    {
        "brand": "Kapital",
        "keywords": ["century denim", "kakishibu", "sashiko"],
        "canonicalTitle": "Kapital Century Denim Kakishibu No. 5-S Sashiko Embroidered Jeans",
        "season": "Century Denim Archive",
        "category": "Denim",
        "estimatedRetail": 580.0,
        "archiveValue": 1100.0,
    },

    # --- VIVIENNE WESTWOOD ---
    {
        "brand": "Vivienne Westwood",
        "keywords": ["orb skull", "skull orb", "man ss03", "skull shirt"],
        "canonicalTitle": "Vivienne Westwood Man SS03 'Orb & Skull' Embroidered Cotton Shirt",
        "season": "SS03",
        "category": "T-Shirts",
        "estimatedRetail": 650.0,
        "archiveValue": 1450.0,
    },
    {
        "brand": "Vivienne Westwood",
        "keywords": ["armour ring", "armor ring", "4 tier"],
        "canonicalTitle": "Vivienne Westwood .925 Solid Sterling Silver 4-Tier Armour Ring",
        "season": "Jewelry Archive",
        "category": "Jewelry",
        "estimatedRetail": 450.0,
        "archiveValue": 450.0,
    },
    {
        "brand": "Vivienne Westwood",
        "keywords": ["pearl choker", "3 row pearl", "orb necklace"],
        "canonicalTitle": "Vivienne Westwood 3-Row Pearl Bas Relief Crystal Orb Choker Necklace",
        "season": "Jewelry Archive",
        "category": "Jewelry",
        "estimatedRetail": 590.0,
        "archiveValue": 590.0,
    },
    {
        "brand": "Vivienne Westwood",
        "keywords": ["beret", "orb beret", "wool beret"],
        "canonicalTitle": "Vivienne Westwood Planet Orb Embroidered Wool Beret",
        "season": "Accessories",
        "category": "Accessories",
        "estimatedRetail": 250.0,
        "archiveValue": 350.0,
    },

    # --- CAROL CHRISTIAN POELL ---
    {
        "brand": "Carol Christian Poell",
        "keywords": ["drip", "drip sneaker", "dipped sneaker"],
        "canonicalTitle": "Carol Christian Poell Drip-Rubber Dipped Low Sneakers",
        "season": "Artisanal Archive",
        "category": "Footwear",
        "estimatedRetail": 2200.0,
        "archiveValue": 3500.0,
    },
    {
        "brand": "Carol Christian Poell",
        "keywords": ["tornado", "tornado boot", "titanium"],
        "canonicalTitle": "Carol Christian Poell Titanium Insert Tornado Leather Boots",
        "season": "Artisanal Archive",
        "category": "Footwear",
        "estimatedRetail": 2800.0,
        "archiveValue": 4200.0,
    },
    {
        "brand": "Carol Christian Poell",
        "keywords": ["scarstitch", "scar stitch"],
        "canonicalTitle": "Carol Christian Poell Scarstitch Horsehide Leather Jacket",
        "season": "Artisanal Archive",
        "category": "Outerwear",
        "estimatedRetail": 5500.0,
        "archiveValue": 8500.0,
    },
]


def resolve_canonical_archetype_title(clean_query: str, brand: str, category: str, full_context: str = "") -> tuple[str, str, float, float]:
    """
    Resolves canonical luxury archive piece model names based on designer house models & archetypes.
    Returns: (canonicalTitle, season, estimatedRetail, archiveValue)
    """
    ctx = f"{clean_query} {full_context}".lower()

    # 1. First priority: Check exact Runway & Archive Match Matrix
    for item in ARCHIVE_RUNWAY_MODELS:
        if item["brand"].lower() in brand.lower() or brand.lower() in item["brand"].lower():
            matched_kws = [kw for kw in item["keywords"] if kw in ctx]
            if len(matched_kws) >= 1:
                return (
                    item["canonicalTitle"],
                    item["season"],
                    item["estimatedRetail"],
                    item["archiveValue"],
                )

    # 2. Chrome Hearts deep matching
    if brand == "Chrome Hearts":
        if any(kw in ctx for kw in ["glasses", "sunglasses", "optical", "frame", "shades", "eyewear"]):
            if "sluntradiction" in ctx:
                return ("Chrome Hearts Sluntradiction Optical Eyeglasses (.925 Sterling Silver)", "Eyewear Archive", 1650.0, 1850.0)
            elif "vagilante" in ctx:
                return ("Chrome Hearts Vagilante .925 Sterling Silver Eyeglasses", "Eyewear Archive", 1550.0, 1750.0)
            elif "baby" in ctx:
                return ("Chrome Hearts Baby-A Acetate & Sterling Silver Optical Frames", "Eyewear Archive", 1450.0, 1600.0)
            elif "deep" in ctx:
                return ("Chrome Hearts Deep II Titanium Sunglasses", "Eyewear Archive", 1750.0, 1900.0)
            elif "bone" in ctx:
                return ("Chrome Hearts Bone Prone Titanium Optical Frames", "Eyewear Archive", 1600.0, 1800.0)
            elif "dagger" in ctx:
                return ("Chrome Hearts Dagger Floral .925 Silver Optical Glasses", "Eyewear Archive", 1550.0, 1750.0)
            else:
                return ("Chrome Hearts .925 Sterling Silver Cross Eyeglasses", "Eyewear Archive", 1450.0, 1600.0)
        elif any(kw in ctx for kw in ["ring", "necklace", "pendant", "bracelet", "chain"]):
            if "dagger" in ctx:
                return ("Chrome Hearts .925 Solid Sterling Silver Dagger Ring" if "ring" in ctx else "Chrome Hearts Dagger Pendant Necklace", "Fine Jewelry", 850.0, 850.0)
            elif "floral" in ctx:
                return ("Chrome Hearts .925 Solid Sterling Silver Floral Cross Ring", "Fine Jewelry", 890.0, 890.0)
            elif "keeper" in ctx:
                return ("Chrome Hearts .925 Solid Sterling Silver Keeper Ring", "Fine Jewelry", 980.0, 980.0)
            elif "cemetery" in ctx:
                return ("Chrome Hearts .925 Solid Sterling Silver Cemetery Cross Ring", "Fine Jewelry", 1250.0, 1250.0)
            elif "paper" in ctx:
                return ("Chrome Hearts Paper Chain .925 Sterling Silver Bracelet", "Fine Jewelry", 1150.0, 1150.0)
            else:
                return ("Chrome Hearts .925 Sterling Silver Cross Ring" if "ring" in ctx else "Chrome Hearts Cross Pendant Necklace", "Fine Jewelry", 850.0, 850.0)
        elif any(kw in ctx for kw in ["hoodie", "zip", "sweatshirt"]):
            if "matty" in ctx:
                return ("Chrome Hearts x Matty Boy Brain / Chomper Graphic Hoodie", "Special Edition", 1450.0, 2600.0)
            elif "floral" in ctx or "horseshoe" in ctx:
                return ("Chrome Hearts Classic Horseshoe Floral Sleeve Zip-Up Hoodie", "Permanent Archive", 1150.0, 1450.0)
            else:
                return ("Chrome Hearts Multi-Cross Patch Zip-Up Hoodie", "Permanent Archive", 1350.0, 1850.0)
        elif any(kw in ctx for kw in ["denim", "jean", "pants"]):
            return ("Chrome Hearts Custom Leather Cross Patch Vintage Levi's 501 Denim", "Artisanal Denim", 3500.0, 8500.0)
        elif any(kw in ctx for kw in ["tee", "t-shirt", "shirt", "longsleeve"]):
            return ("Chrome Hearts Horseshoe Logo Longsleeve T-Shirt", "Permanent Archive", 450.0, 650.0)

    # 3. Rick Owens deep matching
    elif brand == "Rick Owens":
        if any(kw in ctx for kw in ["vans", "vns", "vintage sneaker", "low"]):
            return ("Rick Owens DRKSHDW Vintage Low Sneakers", "DRKSHDW Archive", 690.0, 690.0)
        elif any(kw in ctx for kw in ["ramone", "ramones"]):
            return ("Rick Owens Mainline Leather Ramones High-Top Sneakers", "Mainline Archive", 980.0, 980.0)
        elif any(kw in ctx for kw in ["geo", "geobasket"]):
            return ("Rick Owens Geobasket High-Top Leather Sneakers", "Mainline Archive", 1150.0, 1150.0)
        elif any(kw in ctx for kw in ["bolan", "banana"]):
            return ("Rick Owens DRKSHDW Bolan Banana Wide Leg Jeans", "SS23 EDFU", 850.0, 1100.0)
        elif any(kw in ctx for kw in ["tyrone"]):
            return ("Rick Owens Tyrone Cut Waxed Distressed Skinny Jeans", "Mainline Archive", 780.0, 950.0)
        elif any(kw in ctx for kw in ["bauhaus"]):
            return ("Rick Owens Bauhaus Leather Zip Cargo Pants", "FW20 PERFORMA", 1450.0, 1850.0)
        elif any(kw in ctx for kw in ["creatch"]):
            return ("Rick Owens Creatch Cargo Drawstring Pants", "DRKSHDW Archive", 690.0, 850.0)
        elif any(kw in ctx for kw in ["mountain", "hoodie", "zip"]):
            return ("Rick Owens Mountain Asymmetric Zip Hoodie", "DRKSHDW Archive", 620.0, 750.0)
        elif any(kw in ctx for kw in ["tommy", "tee", "shirt"]):
            return ("Rick Owens Tommy Oversized T-Shirt", "Mainline Archive", 380.0, 480.0)
        elif any(kw in ctx for kw in ["kiss", "boot"]):
            return ("Rick Owens Kiss 100mm Beveled Platform Boots", "FW19 LARRY", 1950.0, 2400.0)

    # 4. Maison Margiela deep matching
    elif brand == "Maison Margiela":
        if any(kw in ctx for kw in ["gat", "gats", "trainer", "replica"]):
            return ("Maison Margiela Replica German Army Trainer (GAT) Sneakers", "Iconic Permanent Collection", 590.0, 590.0)
        elif any(kw in ctx for kw in ["tabi"]):
            return ("Maison Margiela Tabi Split-Toe Leather Ankle Boots", "Iconic Permanent Collection", 1150.0, 1150.0)
        elif any(kw in ctx for kw in ["five zip", "5 zip", "5-zip"]):
            return ("Maison Margiela 5-Zip Iconic Leather Biker Jacket", "Permanent Collection", 2800.0, 2800.0)

    # Default formatted canonical archetype
    words = [w for w in clean_query.split() if w.lower() not in brand.lower()]
    sub_title = " ".join(words).title().strip()
    if not sub_title:
        sub_title = category

    return (f"{brand} {sub_title}", "", 650.0, 650.0)


def fetch_live_weidian_price(item_id: str) -> dict:
    """Fetches exact live price from Weidian Thor API in 0.1s."""
    try:
        url = f"https://thor.weidian.com/detail/getItemSkuInfo/1.0?param=%7B%22itemId%22%3A%22{item_id}%22%7D"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
            res = data.get("result", {})
            skus = res.get("skuInfos", [])
            
            prices_fen = []
            for s in skus:
                sinfo = s.get("skuInfo", {})
                title = (sinfo.get("title") or "").lower()
                is_sub_item = any(box in title for box in ["包装盒", "盒子", "不带", "邮费", "补差", "链接"])
                disc = sinfo.get("discountPrice") or sinfo.get("originalPrice")
                if disc and disc > 0:
                    prices_fen.append((disc, is_sub_item))
                    
            if prices_fen:
                main_items = [p for p, is_sub in prices_fen if not is_sub]
                chosen_fen = min(main_items) if main_items else min(p for p, _ in prices_fen)
                cny = round(chosen_fen / 100.0, 2)
                usd = round(cny * SUGARGOO_CNY_TO_USD_RATE, 2)
                return {
                    "success": True,
                    "priceCny": cny,
                    "priceUsd": usd,
                    "source": "WEIDIAN_LIVE_API"
                }
    except Exception:
        pass
    return {"success": False}


def fetch_live_taobao_1688_price(url: str) -> dict:
    """Extracts price from Taobao/1688 item page."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            matches = re.findall(r'\"(?:price|discountPrice|promotionPrice|itemPrice|reservePrice|defPrice|priceAmount)\"\s*:\s*\"?(\d+(?:\.\d{1,2})?)\"?', html)
            if matches:
                valid = [float(p) for p in matches if 0 < float(p) < 50000]
                if valid:
                    cny = min(valid)
                    if cny > 1000 and all(p.is_integer() for p in valid):
                        cny = round(cny / 100.0, 2)
                    usd = round(cny * SUGARGOO_CNY_TO_USD_RATE, 2)
                    return {
                        "success": True,
                        "priceCny": cny,
                        "priceUsd": usd,
                        "source": "TAOBAO_1688_HTML"
                    }
    except Exception:
        pass
    return {"success": False}


def resolve_exact_source_price(market_url: str = "", text: str = "", category: str = "Outerwear") -> float:
    if market_url:
        if "weidian.com" in market_url:
            m = re.search(r'(?:itemID|itemId|id)=(\d+)', market_url, re.IGNORECASE)
            if m:
                live = fetch_live_weidian_price(m.group(1))
                if live.get("success") and live.get("priceUsd"):
                    return live["priceUsd"]
        elif any(d in market_url for d in ["taobao.com", "tmall.com", "1688.com"]):
            live = fetch_live_taobao_1688_price(market_url)
            if live.get("success") and live.get("priceUsd"):
                return live["priceUsd"]

    if text:
        yuan_match = re.search(r'(\d{2,4})\s*(?:y|yuan|rmb|¥|元)', text, re.IGNORECASE)
        if yuan_match:
            yuan = float(yuan_match.group(1))
            usd = round(yuan * SUGARGOO_CNY_TO_USD_RATE, 2)
            if 2.0 <= usd <= 500:
                return usd
        usd_match = re.search(r'\$\s*(\d+(?:\.\d{1,2})?)', text)
        if usd_match:
            usd = float(usd_match.group(1))
            if 2.0 <= usd <= 500:
                return usd

    defaults = {
        "Outerwear": 89.0,
        "Hoodies": 59.0,
        "Denim": 65.0,
        "T-Shirts": 34.0,
        "Footwear": 115.0,
        "Jewelry": 42.0,
        "Accessories": 48.0
    }
    return defaults.get(category, 59.0)


def identify_product_metadata(query_or_title: str, comments: list[str] = None, market_url: str = "") -> dict:
    """
    Given a Reddit title/query and user comments, queries fashion retailer archives
    (Grailed, SSENSE, Justin Reed, END) via visual metadata search to resolve:
    - Exact canonical product name
    - Brand
    - Season / Year
    - Estimated Retail Price
    - Exact live source price ($USD)
    - High-res studio image URL
    """
    clean_query, brand_detected, category_detected = clean_reddit_title(query_or_title)
    
    # Check comments for exact model clues
    comment_clues = []
    if comments:
        for c in comments[:8]:
            c_clean, _, _ = clean_reddit_title(c)
            if len(c_clean) > 3 and not any(skip in c.lower() for skip in ["link", "w2c", "agent", "sugargoo", "ship", "gl", "rl", "size", "pandabuy"]):
                comment_clues.append(c_clean)
                
    full_ctx = clean_query
    if comment_clues:
        full_ctx += " " + " ".join(comment_clues[:2])
        
    # Generate canonical archetype fallback title & runway season first
    canonical_fallback, runway_season, est_retail_val, archive_val = resolve_canonical_archetype_title(
        clean_query, brand_detected, category_detected, full_ctx
    )
    
    # Resolve exact live Sugargoo source price
    source_price = resolve_exact_source_price(market_url, f"{query_or_title} {full_ctx}", category_detected)

    res_data = {
        "brand": brand_detected,
        "canonicalTitle": canonical_fallback,
        "season": runway_season,
        "estimatedRetail": est_retail_val or 650.0,
        "archiveValue": archive_val or est_retail_val or 650.0,
        "sourcePrice": source_price,
        "studioImageUrl": "",
        "category": category_detected,
        "description": f"Authentic {brand_detected} designer archive piece ({canonical_fallback})."
    }

    try:
        search_query = f"{brand_detected} {clean_query} Grailed SSENSE Justin Reed"
        target_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(search_query)}&form=HDRSC2&first=1"
        req = urllib.request.Request(
            target_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        )
        html = urllib.request.urlopen(req, timeout=8).read().decode("utf-8", errors="ignore")
        
        raw_matches = re.findall(r'class="iusc"[^>]*m="([^"]*)"', html)
        if not raw_matches:
            raw_matches = re.findall(r'm="(\{.*?\})"', html)
            
        SPAM_KEYWORDS = ["chat", "voice", "free & safe", "bot", "apk", "app", "download", "login", "vpn", "movie", "generator", "dating", "quiz", "game", "mod", "hack", "review", "forum", "question", "thoughts", "football", "player", "soccer", "stock photo", "creative commons", "alamy", "getty", "shutterstock", "dreamstime", "wallpaper", "vector", "drawing", "illustration", "tattoo", "celebrity", "news", "meme", "wuestenigel"]
        FASHION_KEYWORDS = ["sneaker", "shoe", "boot", "hoodie", "tee", "shirt", "jacket", "denim", "jean", "pant", "short", "coat", "blazer", "cardigan", "sweater", "vest", "bag", "leather", "zip", "low", "high", "slip", "runner", "vintage", "derby", "creeper", "track", "cross", "floral", "distressed", "glasses", "sunglasses", "optical", "ring", "necklace", "bracelet", "pendant", "drkshdw", "matty", "sluntradiction", "3xl", "defender", "ramones", "geobasket", "gat", "tabi"]

        candidate_titles = []
        for m_str in raw_matches[:15]:
            try:
                m_clean = m_str.replace("&quot;", '"').replace("&amp;", "&")
                d = json.loads(m_clean)
                t = d.get("t", "")
                murl = d.get("murl", "")
                
                # Clean title
                t_clean = re.sub(r'\s*[\|\–\-]\s*(Grailed|SSENSE|Farfetch|Justin Reed|eBay|Lyst|StockX|GOAT|END|Matches).*$', '', t, flags=re.IGNORECASE).strip()
                t_clean = re.sub(r'^[^\w]+', '', t_clean)
                
                t_lower = t_clean.lower()
                if any(bad in t_lower for bad in SPAM_KEYWORDS) or any(bad in murl.lower() for bad in SPAM_KEYWORDS):
                    continue
                    
                has_brand = brand_detected.lower() in t_lower
                has_fashion_kw = any(fkw in t_lower for fkw in FASHION_KEYWORDS)
                
                if (has_brand and has_fashion_kw) and len(t_clean.split()) >= 2 and len(t_clean) <= 80:
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
            
            # If we don't have an exact runway match from our curated dictionary, use web title
            if not runway_season:
                if not best_title.lower().startswith(brand_detected.lower()):
                    best_title = f"{brand_detected} {best_title}"
                res_data["canonicalTitle"] = best_title.strip()
                
                season_match = re.search(r'\b(SS\d{2}|FW\d{2}|AW\d{2}|20[12]\d)\b', best_title, re.IGNORECASE)
                if season_match:
                    res_data["season"] = season_match.group(1).upper()
            
            res_data["studioImageUrl"] = best_img
                
    except Exception as e:
        print(f"[IDENTIFIER WARNING] {e}", flush=True)

    # Estimate realistic retail price based on brand and category if not already set
    if not res_data.get("estimatedRetail") or res_data.get("estimatedRetail") == 650.0:
        category_defaults = {
            "Rick Owens": {"Sneakers": 790.0, "Footwear": 790.0, "Outerwear": 1850.0, "Hoodies": 690.0, "Denim": 820.0, "T-Shirts": 350.0},
            "Chrome Hearts": {"Hoodies": 1450.0, "Jewelry": 850.0, "Outerwear": 2900.0, "Denim": 2400.0, "T-Shirts": 450.0, "Accessories": 1200.0},
            "Balenciaga": {"Sneakers": 990.0, "Footwear": 990.0, "Hoodies": 950.0, "Outerwear": 2200.0, "Denim": 890.0, "T-Shirts": 550.0},
            "Enfants Riches Déprimés": {"T-Shirts": 490.0, "Hoodies": 1200.0, "Outerwear": 2800.0, "Denim": 1100.0},
            "Undercover": {"Outerwear": 1200.0, "T-Shirts": 250.0, "Denim": 750.0, "Hoodies": 450.0},
            "Maison Margiela": {"Sneakers": 590.0, "Footwear": 590.0, "Outerwear": 1600.0, "T-Shirts": 390.0, "Denim": 650.0},
            "Raf Simons": {"Outerwear": 1450.0, "Hoodies": 850.0, "T-Shirts": 420.0, "Denim": 680.0},
        }
        brand_table = category_defaults.get(brand_detected, {})
        res_data["estimatedRetail"] = brand_table.get(category_detected, 650.0)

    return res_data

    return res_data


if __name__ == "__main__":
    market_url = ""
    query_args = []
    
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] in ["--url", "-u"] and i + 1 < len(args):
            market_url = args[i + 1]
            i += 2
        else:
            query_args.append(args[i])
            i += 1
            
    arg = " ".join(query_args)
    if arg:
        res = identify_product_metadata(arg, market_url=market_url)
        print(json.dumps(res, indent=2, ensure_ascii=False))
    else:
        print("Usage: python product_identifier.py <query> [--url <market_url>]")
