import urllib.request
import json
import re

sheet_id = '1hiennceyGI86UvF2QnO5wn6kdiM2_qOP5wDPG12zD10'
gid = '1523005324'

# Fetch gviz
url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:json&gid={gid}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        match = re.search(r'google\.visualization\.Query\.setResponse\((.*)\);', content, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
            rows = data['table']['rows']
            print(f"Total Rows: {len(rows)}")
            
            # Let's count valid product entries in Left stream (Col 0, 1) and Right stream (Col 3, 4)
            left_items = []
            right_items = []
            current_category = "Tops/Tees"
            
            categories_map = {
                "Pants/Shorts": "Bottoms",
                "Hoodies/Sweaters": "Outerwear",
                "Jackets/Coats etc.": "Outerwear",
                "Shoes": "Footwear",
                "Accessoires": "Accessories"
            }
            
            for idx, r in enumerate(rows):
                c = r.get('c', [])
                if not c:
                    continue
                
                # Check for category header
                col0 = c[0].get('v') if len(c) > 0 and c[0] else None
                if col0 and any(cat in str(col0) for cat in ["Pants", "Hoodies", "Jackets", "Shoes", "Accessoires"]):
                    current_category = str(col0).strip()
                    print(f"\n--- SECTION DETECTED: {current_category} (Row {idx+1}) ---")
                    continue
                
                # Left item: Col 0 is Name, Col 1 is Price
                if len(c) > 1 and c[0] and c[1]:
                    name = str(c[0].get('v', '')).strip()
                    price = str(c[1].get('v', '')).strip()
                    if name and price and '$' in price or '€' in price:
                        left_items.append({
                            'name': name,
                            'price': price,
                            'section': current_category,
                            'row': idx + 1
                        })
                
                # Right item: Col 3 is Name, Col 4 is Price
                if len(c) > 4 and c[3] and c[4]:
                    name = str(c[3].get('v', '')).strip()
                    price = str(c[4].get('v', '')).strip()
                    if name and price and ('$' in price or '€' in price):
                        right_items.append({
                            'name': name,
                            'price': price,
                            'section': current_category,
                            'row': idx + 1
                        })

            print(f"\nExtracted {len(left_items)} Left Stream Items")
            print(f"Extracted {len(right_items)} Right Stream Items")
            print(f"TOTAL EXTRACTED PRODUCTS: {len(left_items) + len(right_items)}")
            
            print("\nSAMPLE EXTRACTED PRODUCTS:")
            all_items = left_items + right_items
            for item in all_items[:10]:
                print(f"  • [{item['section']}] {item['name']} — {item['price']}")
                
except Exception as e:
    print(f"Error: {e}")
