path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Show context around duplicates
for ln in [274, 630]:
    print(f"\n--- Around line {ln+1} ---")
    for i in range(ln-2, min(ln+8, len(lines))):
        print(f"{i+1}: {lines[i]}", end="")
