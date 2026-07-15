path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the }; line and insert one more } before it
for i, l in enumerate(lines):
    if l.strip() == '};':
        lines.insert(i, '  },\n')
        break

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

depth = 0
for line in lines:
    for ch in line:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
print(f"Final brace depth: {depth} (should be 0)")
