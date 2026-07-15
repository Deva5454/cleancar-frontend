with open('src/app/components/subscription/CustomerPlanPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix the ternary in borderBottom - wrap in parens to avoid regex parse issue
old1 = 'borderBottom:pageMode==="buy"?"3px solid #312e81":"3px solid transparent"'
new1 = 'borderBottom:(pageMode==="buy"?"3px solid #312e81":"3px solid transparent")'
c = c.replace(old1, new1)

old2 = 'borderBottom:pageMode==="reschedule"?"3px solid #312e81":"3px solid transparent"'
new2 = 'borderBottom:(pageMode==="reschedule"?"3px solid #312e81":"3px solid transparent")'
c = c.replace(old2, new2)

old3 = 'color:pageMode==="buy"?"#312e81":"#64748b"'
new3 = 'color:(pageMode==="buy"?"#312e81":"#64748b")'
c = c.replace(old3, new3)

old4 = 'color:pageMode==="reschedule"?"#312e81":"#64748b"'
new4 = 'color:(pageMode==="reschedule"?"#312e81":"#64748b")'
c = c.replace(old4, new4)

with open('src/app/components/subscription/CustomerPlanPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed:", c.count('borderBottom:(pageMode'), "replacements")
