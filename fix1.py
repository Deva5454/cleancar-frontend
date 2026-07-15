import re

path = r"src/app/services/fieldTrackingService.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1a: Replace FIELD_TRACKING_ROLES
old = '''export const FIELD_TRACKING_ROLES = [
  "Sales Head",
  "Sales Manager",
  "Supervisor",
] as const;'''
new = '''export const FIELD_TRACKING_ROLES = [
  "Car Washer",
  "Operations Manager",
  "Supervisor",
  "Sales Manager",
  "Sales Head",
] as const;

export const ROLE_COLORS: Record<string, { pin: string; badge: string; text: string }> = {
  "Car Washer":         { pin: "#3b82f6", badge: "bg-blue-100",   text: "text-blue-800" },
  "Operations Manager": { pin: "#f59e0b", badge: "bg-amber-100",  text: "text-amber-800" },
  "Supervisor":         { pin: "#ef4444", badge: "bg-red-100",    text: "text-red-800" },
  "Sales Manager":      { pin: "#22c55e", badge: "bg-green-100",  text: "text-green-800" },
  "Sales Head":         { pin: "#0ea5e9", badge: "bg-sky-100",    text: "text-sky-800" },
};

export const ROLE_SHIFT: Record<string, { startTime: string; endTime: string }> = {
  "Car Washer":         { startTime: "05:00", endTime: "09:00" },
  "Operations Manager": { startTime: "10:00", endTime: "19:00" },
  "Supervisor":         { startTime: "10:00", endTime: "19:00" },
  "Sales Manager":      { startTime: "10:00", endTime: "19:00" },
  "Sales Head":         { startTime: "10:00", endTime: "19:00" },
};'''
c = c.replace(old, new)

# 1b: Extend checkIn role type
old2 = '    role: "Sales Head" | "Sales Manager" | "Supervisor";'
new2 = '    role: string;\n    shiftStartTime?: string;\n    shiftEndTime?: string;'
c = c.replace(old2, new2)

# 1c: Add shiftStartTime/End to FieldSession interface
old3 = '  reinstateRequest: ReinstatementRequest | null;'
new3 = '  shiftStartTime?: string;\n  shiftEndTime?: string;\n  reinstateRequest: ReinstatementRequest | null;'
c = c.replace(old3, new3)

# 1d: Store shift in session
old4 = '''    const now = new Date().toISOString();
    const session: FieldSession = {
      id: `FS-${Date.now()}`,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      role: params.role,
      date: now.slice(0, 10),'''
new4 = '''    const now = new Date().toISOString();
    const roleShift = ROLE_SHIFT[params.role] || { startTime: "10:00", endTime: "19:00" };
    const session: FieldSession = {
      id: `FS-${Date.now()}`,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      role: params.role,
      date: now.slice(0, 10),
      shiftStartTime: params.shiftStartTime || roleShift.startTime,
      shiftEndTime: params.shiftEndTime || roleShift.endTime,'''
c = c.replace(old4, new4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("fieldTrackingService.ts done:", old in c or new in c)
