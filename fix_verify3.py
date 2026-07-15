path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
import re
exports = re.findall(r'export\s+\w+\s+\w+', c)
print("Exports found:", exports[:10])
