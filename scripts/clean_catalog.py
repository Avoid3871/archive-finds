import json
import os

sheet_path = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "products", "sheetProducts.json")
with open(sheet_path, "r", encoding="utf-8") as f:
    products = json.load(f)

print(f"Initial products count: {len(products)}")

clean_products = []
removed_slugs = []

for p in products:
    title = p.get("title", "") or p.get("name", "")
    brand = p.get("brand", "")
    raw_img = p.get("rawImageSrc", "")
    slug = p.get("slug", "")
    raw_market = p.get("rawMarketUrl", "") or p.get("directStoreLink", "")
    
    # Check bad indicators
    is_generic_title = "Archive Piece" in title
    is_generic_brand = brand in ["Archive Collection", "Archive Finds", "General"]
    is_snoo = any(bad in raw_img for bad in ["snoovatar", "snoo_assets", "badge", "award", "marketing"])
    is_haul_photo = any(bad in raw_img for bad in ["small-haul", "spring-haul", "haul"])
    is_broken_link = ("weidian.com/item.html" in raw_market and "itemId" not in raw_market and "itemID" not in raw_market) or not raw_market
    
    if is_generic_title or is_generic_brand or is_snoo or is_haul_photo or is_broken_link:
        print(f"REMOVING BAD PRODUCT: [{p.get('id')}] {brand} - {title} ({slug})")
        removed_slugs.append(slug)
    else:
        clean_products.append(p)

print(f"Clean products count: {len(clean_products)}")

with open(sheet_path, "w", encoding="utf-8") as f:
    json.dump(clean_products, f, indent=2)

# Remove bad image files
pub_prod_dir = os.path.join(os.path.dirname(__file__), "..", "public", "products")
for s in removed_slugs:
    img_file = os.path.join(pub_prod_dir, f"{s}.png")
    if os.path.exists(img_file):
        try:
            os.remove(img_file)
            print(f"Deleted image: {img_file}")
        except Exception as e:
            print(f"Could not delete {img_file}: {e}")

print("Triggering slide regenerator...")
os.system("node scripts/generate_all_slide_styles.js")
print("Done!")
