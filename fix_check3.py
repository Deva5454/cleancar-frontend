path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find end of duplicate TSM block (starts line 277, find closing })
def find_block_end(lines, start_idx):
    depth = 0
    for i in range(start_idx, len(lines)):
        depth += lines[i].count('{') - lines[i].count('}')
        if depth < 0 or (depth == 0 and '}' in lines[i]):
            return i
    return start_idx

# TSM duplicate: lines 277-? (0-indexed: 276-?)
tsm_start = 276  # 0-indexed (line 277)
tsm_end = find_block_end(lines, tsm_start)
print(f"TSM duplicate block: lines {tsm_start+1} to {tsm_end+1}")
print("Last line:", lines[tsm_end].strip())

# Supervisor duplicate: lines 633-? (0-indexed: 632-?)
sup_start = 632  # 0-indexed (line 633)
sup_end = find_block_end(lines, sup_start)
print(f"Supervisor duplicate block: lines {sup_start+1} to {sup_end+1}")
print("Last line:", lines[sup_end].strip())
