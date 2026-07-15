import re

f = open('src/app/components/supervisor/SupervisorAppConnected.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

pattern = r'const handleMarkAbsentFromAlert = \(washerId: string\) => \{.*?\n  \};'

new_fn = (
  'const handleMarkAbsentFromAlert = (washerId: string) => {\n'
  '    const washer = team.find((w: any) => w.id === washerId);\n'
  '    const washerName = washer?.name || washerId;\n'
  '    openEscalationModal("mark_absent_alert", `Mark Absent \u2014 ${washerName}`, [\n'
  '      { key: "reason", label: "Reason for absence", type: "select", options: ["Not reachable", "Personal emergency", "Sick leave", "No show", "Other"] },\n'
  '    ], (data) => {\n'
  '      if (data.reason) {\n'
  '        alertService.markAlertActioned(`ALERT-NOCHECKIN-${washerId}`, currentUser?.employeeId || "SUP-001");\n'
  '        alertService.markAlertActioned(`ALERT-${washerId}`, currentUser?.employeeId || "SUP-001");\n'
  '        toast.success(`${washerName} marked ABSENT \u2014 ${data.reason}. Cover redistribution initiated.`);\n'
  '      }\n'
  '      setEscalationModal(null);\n'
  '    });\n'
  '  };'
)

result = re.sub(pattern, new_fn, c, flags=re.DOTALL)
if result == c:
    print('NO MATCH FOUND')
else:
    f = open('src/app/components/supervisor/SupervisorAppConnected.tsx', 'w', encoding='utf-8', newline='')
    f.write(result)
    f.close()
    print('FIXED')
