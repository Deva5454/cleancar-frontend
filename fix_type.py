path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Fix the broken type definition
old = "type RolePermissions = {\n  [role in Role]: PermissionMatrix;\n  },\n};"
new = "type RolePermissions = {\n  [role in Role]: PermissionMatrix;\n};"
c = c.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

# Verify brace balance
depth = 0
for ch in c:
    if ch == '{': depth += 1
    elif ch == '}': depth -= 1
print(f"Brace depth: {depth} (should be 0)")
print("Type fixed:", "type RolePermissions = {\n  [role in Role]: PermissionMatrix;\n};" in c)
