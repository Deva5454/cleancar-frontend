with open('src/app/components/subscription/CustomerPlanPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Verify emoji look correct now
idx = c.find('hatchback')
print("Hatchback:", c[idx:idx+60])

# Add RescheduleTab import
old_import = 'import { planSyncService } from "../../services/planSyncService";'
new_import = 'import { planSyncService } from "../../services/planSyncService";\nimport { RescheduleTab } from "./RescheduleTab";'
c = c.replace(old_import, new_import)

# Add pageMode state
old_state = '  const [cfg, setCfg] = useState<PlanPageConfig>(loadConfig);'
new_state = '  const [cfg, setCfg] = useState<PlanPageConfig>(loadConfig);\n  const [pageMode, setPageMode] = useState<"buy" | "reschedule">("buy");'
c = c.replace(old_state, new_state)

# Find the top bar closing div and add tabs after it
# The top bar ends just before the step bar comment
old_stepbar = '      {/* Step bar */}'
new_stepbar = '''      {/* Mode tabs */}
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"center"}}>
        <button onClick={() => setPageMode("buy")} style={{padding:"14px 32px",fontWeight:700,fontSize:14,border:"none",cursor:"pointer",borderBottom:pageMode==="buy"?"3px solid #312e81":"3px solid transparent",color:pageMode==="buy"?"#312e81":"#64748b",background:"none"}}>Subscribe / Buy</button>
        <button onClick={() => setPageMode("reschedule")} style={{padding:"14px 32px",fontWeight:700,fontSize:14,border:"none",cursor:"pointer",borderBottom:pageMode==="reschedule"?"3px solid #312e81":"3px solid transparent",color:pageMode==="reschedule"?"#312e81":"#64748b",background:"none"}}>Reschedule Wash</button>
      </div>
      {pageMode === "reschedule" && <div style={{minHeight:"80vh",background:"#f0f4ff"}}><RescheduleTab /></div>}
      {pageMode === "buy" && (<>
      {/* Step bar */}'''
c = c.replace(old_stepbar, new_stepbar)

# Close the buy fragment before final closing div
# Find last </div> before ); } export default
c = c.rstrip()
# Find the last occurrence of closing pattern
last_div = c.rfind('    </div>')
print("Last div position:", last_div)
print("Content around last div:", repr(c[last_div-20:last_div+20]))
c = c[:last_div] + '    </div>\n    </>)}\n  );\n}\n\nexport default CustomerPlanPage;'

# Remove old export if duplicated
c = c.replace('\n\nexport default CustomerPlanPage;\n\nexport default CustomerPlanPage;', '\n\nexport default CustomerPlanPage;')

with open('src/app/components/subscription/CustomerPlanPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Done!")
print("Last 8 lines:")
for line in c.split('\n')[-8:]:
    print(repr(line))
