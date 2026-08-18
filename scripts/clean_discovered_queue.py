import json
import os
import sys
import asyncio
from google_sheet_extractor import check_link_alive, clean_url, load_registry, save_registry

sys.stdout.reconfigure(encoding="utf-8")

DISCOVERED_QUEUE_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "discovered_sheet_finds.json")

async def clean_queue():
    if not os.path.exists(DISCOVERED_QUEUE_PATH):
        print("No discovered queue found.")
        return

    with open(DISCOVERED_QUEUE_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    print(f"Auditing {len(items)} items in discovered queue with strict live verification...")
    
    sem = asyncio.Semaphore(10)
    registry = load_registry()
    
    healthy_items = []
    purged_items = []
    
    for item in items:
        raw_url = item.get("rawMarketUrl") or item.get("sugargooUrl") or item.get("directStoreLink", "")
        raw_url = clean_url(raw_url)
        item["rawMarketUrl"] = raw_url
        item["directStoreLink"] = raw_url
        
        is_alive, reason = await check_link_alive(raw_url, sem)
        if is_alive:
            item["validationNote"] = reason
            healthy_items.append(item)
            print(f"  ✅ KEPT [ALIVE]: {item.get('brand')} - {item.get('title')} ({reason})")
        else:
            purged_items.append(item)
            raw_url_lower = raw_url.lower()
            registry["processed_links"][raw_url_lower] = {
                "status": "DEAD",
                "reason": reason
            }
            print(f"  ❌ PURGED [DEAD]: {item.get('brand')} - {item.get('title')} ({reason})")

    # Save cleaned queue
    with open(DISCOVERED_QUEUE_PATH, "w", encoding="utf-8") as f:
        json.dump(healthy_items, f, indent=2, ensure_ascii=False)
        
    save_registry(registry)
    print(f"\nAudit complete! Kept {len(healthy_items)} active items, purged {len(purged_items)} dead items.")

if __name__ == "__main__":
    asyncio.run(clean_queue())
