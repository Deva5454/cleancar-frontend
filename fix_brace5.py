path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove line 876 (index 875) - the extra },
del lines[875]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Verify
depth = 0
for line in lines:
    depth += line.count('{') - line.count('}')
print(f"Final depth: {depth} (should be 0)")
