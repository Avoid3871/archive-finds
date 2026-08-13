with open('scripts/published_dump.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re
print("First 1000 chars:\n", content[:1000])

# Search for iframe or sheet data
iframes = re.findall(r'<iframe[^>]*src="([^"]+)"', content)
print("Iframes:", iframes)

scripts = re.findall(r'<script[^>]*src="([^"]+)"', content)
print("Scripts:", scripts[:5])
