with open('src/app/components/subscription/RescheduleTab.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Remove the broken useState seed call
old = 'export function RescheduleTab() {\n  useState(() => { seedDemoData(); });'
new = 'export function RescheduleTab() {'
c = c.replace(old, new)

# Add proper useEffect seed call after the existing useEffect
old2 = '  useEffect(() => {\n    if (otpTimer > 0) {'
new2 = '  useEffect(() => { seedDemoData(); }, []);\n\n  useEffect(() => {\n    if (otpTimer > 0) {'
c = c.replace(old2, new2)

with open('src/app/components/subscription/RescheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done')
print('useEffect seed:', 'seedDemoData(); }, []);' in c)
