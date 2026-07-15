path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Find the main export object
idx = c.find('export const PERMISSIONS')
if idx < 0:
    idx = c.find('export const permissions')
if idx < 0:
    idx = c.find('}: RolePermissions =')
print("Main export found at char:", idx)
print("Around it:", repr(c[idx:idx+60]))
