path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Show last 15 lines with depth
depth = 0
depths = []
for line in lines:
    depth += line.count('{') - line.count('}')
    depths.append(depth)

print("Last 15 lines with depth:")
for i in range(len(lines)-15, len(lines)):
    print(f"{i+1} [d={depths[i]}]: {repr(lines[i])}")
