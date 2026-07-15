path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find exact brace depth at every line near the end
depth = 0
for i, line in enumerate(lines):
    depth += line.count('{') - line.count('}')
    if i >= len(lines) - 20:
        print(f"{i+1}: depth={depth} | {line.rstrip()}")
