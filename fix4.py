path = r"src/app/components/om/OperationsManagerApp.tsx"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add import if not present
if 'FieldCheckIn' not in c:
    c = c.replace(
        'import { RescheduleQueuePanel } from "../shared/RescheduleQueuePanel";',
        'import { RescheduleQueuePanel } from "../shared/RescheduleQueuePanel";\nimport { FieldCheckIn } from "../field/FieldCheckIn";'
    )

# Add tab trigger before reports tab
c = c.replace(
    '<TabsTrigger value="reports" className="py-4 text-sm font-semibold">',
    '<TabsTrigger value="field-checkin" className="py-4 text-sm font-semibold">\n                Field Check-In\n              </TabsTrigger>\n              <TabsTrigger value="reports" className="py-4 text-sm font-semibold">',
    1
)

# Add tab content before reports content
c = c.replace(
    '        <TabsContent value="reports"',
    '        <TabsContent value="field-checkin" className="mt-0">\n          <div className="max-w-2xl mx-auto py-6"><FieldCheckIn /></div>\n        </TabsContent>\n        <TabsContent value="reports"',
    1
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("OperationsManagerApp.tsx done:", "field-checkin" in c)
