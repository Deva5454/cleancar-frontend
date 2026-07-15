path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Show lines 874-878
for i in range(873, 879):
    print(f"{i+1}: {repr(lines[i])}")
