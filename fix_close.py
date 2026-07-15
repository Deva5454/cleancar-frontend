path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Current end: depth 6->5->4->3->2 then }; 
# Need:        depth 6->5->4->3->2->1->0 then };
# So replace lines 874-877 with correct closing sequence
# depth 6: line 874 closes to 5 ✓
# depth 5: line 875 closes to 4 ✓  
# depth 4: need new line to close to 3
# depth 3: line 876 closes to 2... but it's indented wrong
# depth 2: need new line to close to 1
# depth 1: }; closes to 0

# Replace the closing block (lines 874-877, indices 873-876)
new_closing = [
    '    },\n',   # depth 6->5
    '  },\n',     # depth 5->4
    '  },\n',     # depth 4->3
    '},\n',       # depth 3->2
    '},\n',       # depth 2->1
    '};\n',       # depth 1->0
]

lines = lines[:873] + new_closing + lines[877:]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Verify
depth = 0
for line in lines:
    depth += line.count('{') - line.count('}')
print(f"Final depth: {depth} (should be 0)")

# Show new end
depths = []
d = 0
for line in lines:
    d += line.count('{') - line.count('}')
    depths.append(d)
print("\nNew closing lines:")
for i in range(len(lines)-12, len(lines)):
    print(f"{i+1} [d={depths[i]}]: {lines[i].rstrip()}")
