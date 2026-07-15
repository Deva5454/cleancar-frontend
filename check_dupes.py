import re
files = [
    "src/app/components/field/FieldCheckIn.tsx",
    "src/app/services/fieldTrackingService.ts",
    "src/app/components/washer/WasherCoreScreensConnected.tsx",
    "src/app/components/om/OperationsManagerApp.tsx",
]
for path in files:
    with open(path, encoding='utf-8') as f:
        c = f.read()
    funcs = re.findall(r'(?:function|const)\s+(\w+)\s*[=(]', c)
    seen = {}
    for fn in funcs:
        seen[fn] = seen.get(fn, 0) + 1
    dups = {k:v for k,v in seen.items() if v > 1}
    if dups:
        print(f"DUPES in {path.split('/')[-1]}: {dups}")
    else:
        print(f"OK: {path.split('/')[-1]}")
