path = r"src/app/components/field/FieldCheckIn.tsx"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove the duplicate shiftStart/shiftEnd lines
old = '''  const shiftStart = shiftStartHour(currentRole);
  const shiftEnd   = shiftEndHour(currentRole);
  const shiftStart = shiftStartHour(currentRole);
  const shiftEnd   = shiftEndHour(currentRole);'''
new = '''  const shiftStart = shiftStartHour(currentRole);
  const shiftEnd   = shiftEndHour(currentRole);'''
c = c.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Fixed:", c.count("const shiftStart") == 1)
