path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
# Add a harmless comment at top to bust cache
if '// Field tracking roles added' not in c:
    c = '// Field tracking roles added\n' + c
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
print("Done")
