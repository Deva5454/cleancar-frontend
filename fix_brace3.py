path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 875 is "};" (index 874) — insert 3 closing braces before it
# Need:    },   (closes inner object)
# Then:  },     (closes role block)  
# Then: },      (closes outer)
# Current end: depth goes 5->4->3 but needs to reach 0
# So insert 3 more closing lines before line 875

insert_at = 874  # 0-indexed, before the final };
lines.insert(insert_at, '    },\n')    # depth 4->3
lines.insert(insert_at, '  },\n')     # depth 5->4
lines.insert(insert_at, '},\n')       # depth 6->5... wait let me recalc

# Actually depth at line 873 is 5, 874 is 4, 875 is 3
# We need it to reach 0, so we need 3 more } before the final };
# Insert before line 875 (index 874):
# },    closes depth 4->3... no

# Simpler: just add the 3 missing closing braces before };
# Remove what we inserted and do it properly
lines.pop(insert_at)
lines.pop(insert_at)  
lines.pop(insert_at)

# The final }; is at index 874 (line 875)
# We need depth to be 1 (inside module.exports = {) before };
# Current depth before }; is 3, needs to be 1
# So insert 2 closing lines before };
lines.insert(874, '    },\n')
lines.insert(874, '  },\n')

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Verify
depth = 0
for line in lines:
    for ch in line:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
print(f"Final brace depth: {depth} (should be 0)")
print(f"Total lines: {len(lines)}")
