path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_block_end(lines, start_idx):
    depth = 0
    for i in range(start_idx, len(lines)):
        depth += lines[i].count('{') - lines[i].count('}')
        if depth == 0 and '}' in lines[i]:
            return i
    return start_idx

# TSM duplicate at line 627 (0-indexed 626), include blank line before (625)
tsm_start = 625
tsm_end = find_block_end(lines, 626)
print(f"Removing lines {tsm_start+1} to {tsm_end+1}:", lines[626].strip(), "...", lines[tsm_end].strip())
del lines[tsm_start:tsm_end+1]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

import re
c = open(path, encoding='utf-8').read()
tsm_count = len(re.findall(r'^\s*TSM\s*:', c, re.MULTILINE))
print(f"TSM occurrences: {tsm_count} (should be 1)")
print(f"Lines remaining: {len(lines)}")
