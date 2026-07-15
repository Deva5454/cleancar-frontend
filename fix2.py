path = r"src/app/components/field/FieldCheckIn.tsx"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add shift helper functions after nowMinute
old = 'function nowHour(): number { return new Date().getHours(); }\nfunction nowMinute(): number { return new Date().getMinutes(); }'
new = '''function nowHour(): number { return new Date().getHours(); }
function nowMinute(): number { return new Date().getMinutes(); }

function shiftStartHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":5,"Operations Manager":10,"Supervisor":10,"Sales Manager":10,"Sales Head":10 };
  return m[role] ?? 10;
}
function shiftEndHour(role: string): number {
  const m: Record<string, number> = { "Car Washer":9,"Operations Manager":19,"Supervisor":19,"Sales Manager":19,"Sales Head":19 };
  return m[role] ?? 19;
}'''
c = c.replace(old, new)

# Fix role cast
c = c.replace('role: currentRole as "Sales Head" | "Sales Manager",', 'role: currentRole,')

# Add shiftStart/End after hour declaration
c = c.replace(
    '  const hour    = nowHour();',
    '  const hour    = nowHour();\n  const shiftStart = shiftStartHour(currentRole);\n  const shiftEnd   = shiftEndHour(currentRole);'
)

# Use shift-aware hours
c = c.replace('const isBeforeWindow   = hour < FIELD_HOURS.CHECK_IN_HOUR;', 'const isBeforeWindow   = hour < shiftStart;')
c = c.replace('const isSuggestCheckout = hour >= FIELD_HOURS.SUGGESTED_CHECKOUT;', 'const isSuggestCheckout = hour >= shiftEnd;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("FieldCheckIn.tsx done: shiftStartHour =", "shiftStartHour" in c)
