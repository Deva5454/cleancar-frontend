path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
import re
for m in re.finditer(r'^\s*TSM\s*:', c, re.MULTILINE):
    ln = c[:m.start()].count('\n') + 1
    print(f"Line {ln}: {m.group().strip()}")
