import urllib.request

test_img_url = "https://docs.google.com/sheets-images-rt/ADAzV4ROCunHlSPqzLWBvkv9P2vpsOXk_uwsKQUrE7PQ5CJhXOfkra9tp0Jq506ImEmw6e18VvZ3ewzk_5K92_PpKxyruZJ3GF4uPXgc_RtE8v29nj-oIy7GCHBQwAzb1ci415mqLMs__20i5s8yL2NDlm_cq8DjYGF7xfEeljk=w800-h800"

req = urllib.request.Request(test_img_url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        print(f"Downloaded Image Size: {len(data)} bytes")
        with open('scratch/test_sheet_img.jpg', 'wb') as f:
            f.write(data)
        print("Successfully saved test_sheet_img.jpg!")
except Exception as e:
    print("Error:", e)
