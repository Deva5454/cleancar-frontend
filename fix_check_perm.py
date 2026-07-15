path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re
# Find all occurrences of TSM and Supervisor keys
for match in re.finditer(r'^\s*(TSM|Supervisor)\s*:', c, re.MULTILINE):
    line_num = c[:match.start()].count('\n') + 1
    print(f"Line {line_num}: {match.group().strip()}")
