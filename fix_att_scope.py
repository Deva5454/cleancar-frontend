with open('src/app/components/admin/SuperAdminFieldTracker.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Find SVGTrail function boundaries
svg_start = c.find('function SVGTrail(')
# Find the svg return statement - this is where SVGTrail's JSX begins
svg_return = c.find('\n  return (\n    <svg viewBox=')

# Find AttendanceTab inside SVGTrail
att_start = c.find('  // ── Tab: Attendance', svg_start, svg_return)
if att_start == -1:
    att_start = c.find('  const AttendanceTab', svg_start, svg_return)

print(f"SVGTrail starts: {svg_start}")
print(f"SVGTrail return: {svg_return}")
print(f"AttendanceTab at: {att_start}")

if att_start == -1:
    print("AttendanceTab NOT found inside SVGTrail - checking globally")
    att_start = c.find('const AttendanceTab')
    print(f"Global position: {att_start}")
else:
    # Extract AttendanceTab block (from att_start to svg_return)
    att_block = c[att_start:svg_return]
    print(f"Block length: {len(att_block)}")
    print(f"Block ends with: {repr(att_block[-50:])}")
    
    # Remove from SVGTrail
    c2 = c[:att_start] + c[svg_return:]
    
    # Find where to insert: just before the main component return
    main_ret = c2.find('\n  return (\n    <div className="h-screen')
    print(f"Main return at: {main_ret}")
    
    # Insert AttendanceTab before main return
    c3 = c2[:main_ret] + '\n\n' + att_block.rstrip() + '\n' + c2[main_ret:]
    
    with open('src/app/components/admin/SuperAdminFieldTracker.tsx', 'w', encoding='utf-8') as f:
        f.write(c3)
    
    # Verify
    lines = c3.split('\n')
    for i, l in enumerate(lines):
        if any(x in l for x in ['function SVGTrail', 'const AttendanceTab', 'const LiveTab', 'const TimelineTab', 'const DashboardTab']):
            print(f"Line {i+1}: {l.strip()}")
    print("Done!")
