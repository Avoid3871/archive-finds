import re

with open('scratch_sheet.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("HTML size:", len(html))

# Let's find sheet tab names or grid info in the html
matches = re.findall(r'(\{"name":"[^"]+","id":\d+[^}]*\})', html)
print("Sheet metadata objects:", matches)

# Find all occurrences of sheet or gid or sheet-tab
for m in re.finditer(r'gid=(\d+)', html):
    start = max(0, m.start() - 100)
    end = min(len(html), m.end() + 100)
    print("GID context:\n", html[start:end], "\n---")

# Look for table names / sheet names
tabs_found = re.findall(r'<div id="([^"]+)"[^>]*class="sheet-body', html)
print("Sheet body divs:", tabs_found)
