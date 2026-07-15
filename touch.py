path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('// Field tracking roles added\n', '// Field tracking roles added - v2\n')
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
