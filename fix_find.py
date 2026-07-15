with open('src/app/components/subscription/CustomerPlanPage.tsx', 'rb') as f:
    raw = f.read()

# Find all remaining corrupted sequences (non-ASCII in icon/badge/trust areas)
import re
# Find all quoted strings containing non-ascii
matches = re.findall(b'"([^"]*[\xc3-\xf0][^"]*)"', raw)
unique = set(matches)
for m in sorted(unique):
    try:
        print(repr(m[:60]))
    except:
        pass
