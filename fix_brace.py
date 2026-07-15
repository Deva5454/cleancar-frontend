path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Count braces to find where they go out of balance
depth = 0
for i, line in enumerate(lines):
    for ch in line:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
    if depth < 0:
        print(f"IMBALANCE at line {i+1}: depth={depth}")
        print("Context:")
        for j in range(max(0,i-3), min(len(lines),i+4)):
            print(f"  {j+1}: {lines[j]}", end="")
        break

print(f"Final brace depth: {depth} (should be 0)")
