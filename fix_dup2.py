path = r"src/app/components/field/FieldCheckIn.tsx"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove the second occurrence of the duplicate function block
old = '''function shiftStartHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":5,"Operations Manager":10,"Supervisor":10,"Sales Manager":10,"Sales Head":10 };
  return m[role] ?? 10;
}
function shiftEndHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":9,"Operations Manager":19,"Supervisor":19,"Sales Manager":19,"Sales Head":19 };
  return m[role] ?? 19;
}

function shiftStartHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":5,"Operations Manager":10,"Supervisor":10,"Sales Manager":10,"Sales Head":10 };
  return m[role] ?? 10;
}
function shiftEndHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":9,"Operations Manager":19,"Supervisor":19,"Sales Manager":19,"Sales Head":19 };
  return m[role] ?? 19;
}'''

new = '''function shiftStartHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":5,"Operations Manager":10,"Supervisor":10,"Sales Manager":10,"Sales Head":10 };
  return m[role] ?? 10;
}
function shiftEndHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":9,"Operations Manager":19,"Supervisor":19,"Sales Manager":19,"Sales Head":19 };
  return m[role] ?? 19;
}'''

if old in c:
    c = c.replace(old, new)
    print("Duplicate block removed")
else:
    # Count occurrences
    count = c.count("function shiftStartHour")
    print(f"shiftStartHour count: {count} - trying alternate removal")
    # Remove second occurrence
    idx1 = c.find("function shiftStartHour")
    idx2 = c.find("function shiftStartHour", idx1 + 1)
    if idx2 > 0:
        # Find end of second shiftEndHour block
        end = c.find("\n}\n", c.find("function shiftEndHour", idx2)) + 3
        c = c[:idx2] + c[end:]
        print(f"Removed from index {idx2} to {end}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("shiftStartHour count now:", c.count("function shiftStartHour"))
