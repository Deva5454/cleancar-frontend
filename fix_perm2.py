path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove duplicate TSM (lines 277-293, 0-indexed 276-292) and blank line before it (275)
# Remove duplicate Supervisor (lines 633-648, 0-indexed 632-647) and blank line before it (631)
# Remove in reverse order so indices don't shift

# Supervisor first (higher index) - lines 631-648 (0-indexed 630-647)
del lines[630:648]

# TSM - lines 275-293 (0-indexed 274-292) — but indices shifted by 18 now, so no shift needed for TSM
# TSM was at 274-292 (0-indexed), Supervisor was at 630+
del lines[274:293]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done. Lines remaining:", len(lines))

# Verify no more duplicates
import re
c = open(path, encoding='utf-8').read()
tsm_count = len(re.findall(r'^\s*TSM\s*:', c, re.MULTILINE))
sup_count = len(re.findall(r'^\s*Supervisor\s*:', c, re.MULTILINE))
print(f"TSM occurrences: {tsm_count} (should be 1)")
print(f"Supervisor occurrences: {sup_count} (should be 1)")
