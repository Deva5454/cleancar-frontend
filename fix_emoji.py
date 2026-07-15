with open('src/app/components/subscription/CustomerPlanPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

print('Has Apple Color Emoji:', "Apple Color Emoji" in c)
print('Has Sora sans-serif:', ".cpp-root { font-family: 'Sora', sans-serif; }" in c)

old = ".cpp-root { font-family: 'Sora', sans-serif; }"
new = ".cpp-root { font-family: 'Sora', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; }"
if old in c:
    c = c.replace(old, new)
    print('Emoji fix applied')

with open('src/app/components/subscription/CustomerPlanPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done')
