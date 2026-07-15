path = r"src/app/config/permissionMatrix.ts"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines[865:882], 866):
    print(f"{i}: {l}", end="")
