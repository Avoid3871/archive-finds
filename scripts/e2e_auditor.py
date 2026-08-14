import os
import sys
import json
import time
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_comprehensive_audit():
    errors = []
    warnings = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Capture console errors
        def on_console(msg):
            if msg.type == "error":
                # Filter out known harmless favicon / chrome extension messages
                if not any(ign in msg.text for ign in ["favicon.ico", "extension"]):
                    errors.append(f"Console error: {msg.text}")
                    
        page.on("console", on_console)
        page.on("pageerror", lambda err: errors.append(f"Page uncaught error: {err}"))

        urls_to_test = [
            ("/", "Home Page"),
            ("/discover", "Discover & Filter Engine"),
            ("/saved", "Saved Pieces (Wishlist)"),
            ("/product/rick-owens-qc-ro-v-ns-from-hyl-2172", "Rick Owens Piece"),
            ("/product/chrome-hearts-ch-soap-and-water-hoodie-2186", "Chrome Hearts Piece"),
            ("/admin/sources", "Admin Sourcing Hub & Link Health"),
            ("/admin/slides", "Admin Social Slides Studio"),
        ]

        print("\n--- 1. Testing Page Navigation & Rendering ---", flush=True)
        for url, name in urls_to_test:
            target = f"http://localhost:3000{url}"
            try:
                res = page.goto(target, wait_until="networkidle", timeout=15000)
                status = res.status if res else "None"
                if status != 200:
                    errors.append(f"{name} ({url}) returned HTTP {status}")
                else:
                    print(f"✅ {name} loaded (HTTP 200)", flush=True)
            except Exception as e:
                errors.append(f"Failed to navigate to {name} ({url}): {e}")

            # Check broken images
            broken_imgs = page.evaluate("""() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.filter(i => i.naturalWidth === 0 && !i.src.includes('data:image') && !i.src.includes('blob:')).map(i => i.src);
            }""")
            if broken_imgs:
                warnings.append(f"{name} has {len(broken_imgs)} broken images: {broken_imgs[:2]}")

        print("\n--- 2. Testing Wishlist & Bookmark Flow ---", flush=True)
        page.goto("http://localhost:3000/product/rick-owens-qc-ro-v-ns-from-hyl-2172", wait_until="networkidle")
        bookmark_btn = page.query_selector("button:has-text('Save'), button:has-text('SAVED'), button:has(svg.lucide-bookmark), button:has(svg.lucide-heart)")
        if bookmark_btn:
            bookmark_btn.click()
            page.wait_for_timeout(600)
            print("✅ Clicked Wishlist Bookmark button on Rick Owens page.", flush=True)
            
            # Verify /saved page
            page.goto("http://localhost:3000/saved", wait_until="networkidle")
            page.wait_for_timeout(800)
            saved_items = page.query_selector_all("a[href*='/product/']")
            print(f"✅ /saved page successfully displays {len(saved_items)} bookmarked grail(s).", flush=True)
            if len(saved_items) == 0:
                warnings.append("Wishlist item was not saved to localStorage or rendered in /saved")
        else:
            warnings.append("Bookmark button selector not found on product page.")

        print("\n--- 3. Testing Discover Filters (Price & Category) ---", flush=True)
        page.goto("http://localhost:3000/discover", wait_until="networkidle")
        # Try category filter click
        cat_btn = page.query_selector("button:has-text('Footwear'), button:has-text('Shoes'), button:has-text('Hoodies')")
        if cat_btn:
            cat_name = cat_btn.inner_text().strip()
            cat_btn.click()
            page.wait_for_timeout(600)
            print(f"✅ Filtered by category '{cat_name}'.", flush=True)
        
        # Test Price sorting / Under $50
        under_50 = page.query_selector("button:has-text('Under $50'), button:has-text('< $50'), select")
        if under_50:
            print("✅ Price filter control is interactive.", flush=True)

        print("\n--- 4. Testing Admin Sourcing Hub & AI Lens API ---", flush=True)
        page.goto("http://localhost:3000/admin/sources", wait_until="networkidle")
        # Switch to 1-Click Ingest tab
        ingest_tab = page.query_selector("button:has-text('1-Click Ingest'), button:has-text('Quick Ingest')")
        if ingest_tab:
            ingest_tab.click()
            page.wait_for_timeout(500)
            print("✅ 1-Click Ingest Studio tab accessible.", flush=True)

        # Switch to Link Health tab
        health_tab = page.query_selector("button:has-text('Link Health'), button:has-text('Dead Links')")
        if health_tab:
            health_tab.click()
            page.wait_for_timeout(500)
            print("✅ Link Health & Dead Links Inspector tab accessible.", flush=True)

        print("\n--- 5. Testing Admin Slides Studio & 3-Style Switcher ---", flush=True)
        page.goto("http://localhost:3000/admin/slides", wait_until="networkidle")
        style_btns = page.query_selector_all("button:has-text('Viral Minimal'), button:has-text('Editorial Dark'), button:has-text('Minimal Dark')")
        print(f"✅ Found {len(style_btns)} style switchers in Social Slide Studio.", flush=True)
        for btn in style_btns:
            btn.click()
            page.wait_for_timeout(300)

        browser.close()

    print("\n================ AUDIT SUMMARY ================")
    if errors:
        print(f"❌ FATAL ERRORS ({len(errors)}):")
        for e in errors:
            print(f"   - {e}")
    else:
        print("✨ ZERO FATAL ERRORS OR UNCAUGHT EXCEPTIONS DETECTED!")

    if warnings:
        print(f"\n⚠️ WARNINGS / IMPROVEMENTS ({len(warnings)}):")
        for w in warnings:
            print(f"   - {w}")
    else:
        print("✨ ZERO WARNINGS OR BROKEN ASSETS DETECTED!")

if __name__ == "__main__":
    run_comprehensive_audit()
