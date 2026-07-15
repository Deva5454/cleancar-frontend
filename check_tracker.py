import urllib.request, zipfile, io, os

# Read from local zip if already downloaded, otherwise copy from fixed dir
src = r"src/app/components/admin/SuperAdminFieldTracker.tsx"

content = open(src, encoding="utf-8").read() if os.path.exists(src) else None
print("File exists:", os.path.exists(src))
print("Size:", len(content) if content else 0)
