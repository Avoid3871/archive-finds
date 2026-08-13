with open('scripts/published_dump.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("HTML size:", len(content))

# Look for table rows <tr>
import re
trs = re.findall(r'<tr[^>]*>.*?</tr>', content, re.DOTALL)
print(f"Total <tr> rows: {len(trs)}")

for i, tr in enumerate(trs[:10]):
    print(f"\n--- TR {i+1} ---")
    tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
    for j, td in enumerate(tds):
        clean_td = re.sub(r'<[^>]+>', '', td).strip()
        if clean_td:
            print(f"  TD {j}: '{clean_td}' | Raw: {td[:150]}")
