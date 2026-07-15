with open('src/app/components/admin/SuperAdminFieldTracker.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
lines = c.split('\n')
for i, l in enumerate(lines):
    if 'const AttendanceTab' in l or 'const LiveTab' in l or 'const DashboardTab' in l or 'const TimelineTab' in l:
        print(f"Line {i+1}: {l.strip()}")
    if 'function SVGTrail' in l:
        print(f"Line {i+1}: {l.strip()} <-- SVGTrail starts here")
