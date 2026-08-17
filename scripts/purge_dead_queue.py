import sys
import os
import json
import asyncio
import re

sys.path.insert(0, os.path.dirname(__file__))
from google_sheet_extractor import check_link_alive, load_registry, save_registry

DISCOVERED_QUEUE_PATH = os.path.join(os.path.dirname(__file__), "..", "scratch", "discovered_sheet_finds.json")

async def purge_dead_from_queue():
    if not os.path.exists(DISCOVERED_QUEUE_PATH):
        print("No discovered queue found.")
        return

    with open(DISCOVERED_QUEUE_PATH, "r", encoding="utf-8") as f:
        queue = json.load(f)

    print(f"Checking {len(queue)} items currently in discovered queue...")
    sem = asyncio.Semaphore(10)
    
    registry = load_registry()
    healthy_items = []
    dead_items = []

    for item in queue:
        url = item.get("rawMarketUrl") or item.get("directStoreLink") or ""
        is_alive, reason = await check_link_alive(url, sem)
        if is_alive:
            print(f"  ✅ HEALTHY: {item.get('brand')} - {item.get('title')} ({url})")
            healthy_items.append(item)
        else:
            print(f"  ❌ PURGED DEAD: {item.get('brand')} - {item.get('title')} -> {reason}")
            dead_items.append((item, reason))
            # Record in registry
            url_lower = url.strip().lower()
            registry["processed_links"][url_lower] = {
                "status": "DEAD",
                "reason": reason,
                "testedAt": "2026-08-17T13:30:00Z"
            }

    print(f"\nResult: {len(healthy_items)} Healthy / {len(dead_items)} Dead Items Purged.")
    
    # Save pruned queue
    with open(DISCOVERED_QUEUE_PATH, "w", encoding="utf-8") as f:
        json.dump(healthy_items, f, indent=2, ensure_ascii=False)
        
    save_registry(registry)
    print(f"Updated {DISCOVERED_QUEUE_PATH} with only 100% healthy items.")

if __name__ == "__main__":
    asyncio.run(purge_dead_from_queue())
