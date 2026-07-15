path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the last role block and show end of file
print("Last 20 lines:")
for i, l in enumerate(lines[-20:], len(lines)-19):
    print(f"{i}: {l}", end="")

# Also show brace depth at each line to find where it drops
depth = 0
prev_depths = []
for i, line in enumerate(lines):
    for ch in line:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
    prev_depths.append((i+1, depth))

# Find lines where depth is highest (unclosed blocks)
max_depth = max(d for _,d in prev_depths)
print(f"\nMax depth reached: {max_depth}")
# Show where depth stops decreasing near end
print("\nLast 25 depth changes:")
for ln, d in prev_depths[-25:]:
    print(f"  line {ln}: depth={d}")
