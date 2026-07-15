with open('src/app/components/subscription/CustomerPlanPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('Subscribe / Buy')
print("Tab area:", repr(c[idx-200:idx+300]))
