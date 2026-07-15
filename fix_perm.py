path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Find and remove duplicate keys by keeping only first occurrence
import re

# Find all top-level keys in the object
def remove_duplicate_keys(content):
    lines = content.split('\n')
    seen_keys = {}
    result = []
    depth = 0
    skip_until_depth = None
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Track brace depth
        depth += stripped.count('{') - stripped.count('}')
        
        if skip_until_depth is not None:
            if depth <= skip_until_depth:
                skip_until_depth = None
            continue
        
        # Check if this is a top-level key (depth 1 means inside main object)
        key_match = re.match(r"^\s{2,4}(\w+)\s*:", stripped) if depth == 1 else None
        if key_match and depth == 1:
            key = key_match.group(1)
            if key in seen_keys:
                # Skip this duplicate block
                skip_until_depth = depth - 1
                continue
            seen_keys[key] = True
        
        result.append(line)
    
    return '\n'.join(result)

fixed = remove_duplicate_keys(c)

with open(path, 'w', encoding='utf-8') as f:
    f.write(fixed)
print("Done. Original lines:", len(c.split('\n')), "Fixed lines:", len(fixed.split('\n')))
