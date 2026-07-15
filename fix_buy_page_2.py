"""
fix_buy_page_2.py — 249 Carwashing Buy Page Fixes (Round 2)
Fixes the 11 patches that were skipped in fix_buy_page.py
Run: python fix_buy_page_2.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT  = r"E:\3rd June Final Deployment\cleancar-root\src\app"
CPP   = os.path.join(ROOT, "components", "subscription", "CustomerPlanPage.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_r2_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(CPP, os.path.join(backup_dir, "CustomerPlanPage.tsx"))
print(f"Backed up CustomerPlanPage.tsx → {backup_dir}\n")

results = []

def patch(old, new, label):
    with open(CPP, "r", encoding="utf-8") as fh:
        content = fh.read()
    if old not in content:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")
        return
    content = content.replace(old, new, 1)
    with open(CPP, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)
    results.append(("OK", label))
    print(f"  [OK]   {label}")

# =============================================================================
# SLIDE 1 — Remove price chips inside vehicle cards (lines 1092-1098)
# The conditional block that shows plan prices when a card is selected:
#   {activeCat===cat.id && selectedPlan===null && (
#     <div style={{marginTop:8}}>
#       {cfg.monthlyPlans.map(p=>(
#         <div key={p.id} style={{...}}>{p.icon} from {inr(p.prices[cat.id])}</div>
#       ))}
#     </div>
#   )}
# =============================================================================
print("=== SLIDE 1 — Remove price chips inside vehicle cards ===")

patch(
    """{activeCat===cat.id && selectedPlan===null && (
                            <div style={{marginTop:8}}>
                              {cfg.monthlyPlans.map(p=>(
                                <div key={p.id} style={{fontSize:11,color:"#6366f1",fontWeight:600}}>{p.icon} from {inr(p.prices[cat.id])}</div>
                              ))}
                            </div>
                          )}""",
    "",
    "Slide 1 — Remove price chips inside vehicle selector cards"
)

# Remove the "Plans for your {catLabel}" preview banner (lines 1106-1118)
# This is the dark indigo banner showing all 3 plan prices below vehicle cards
patch(
    """{/* Price preview banner */}
              {activeCat && (
                <div style={{marginBottom:28,padding:"16px 20px",background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:16,display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{fontSize:13,color:"rgba(199,210,254,0.8)",fontWeight:600,flexShrink:0}}>💡 Plans for your {catLabel}:</div>
                  {cfg.monthlyPlans.map(p=>(
                    <div key={p.id} style={{textAlign:"center"}}>
                      <div style={{fontSize:12,color:"rgba(199,210,254,0.7)"}}>{p.icon} {p.name}</div>
                      <div style={{fontSize:18,fontWeight:800,color:"white",fontFamily:"'Playfair Display',serif"}}>{inr(p.prices[activeCat])}</div>
                      <div style={{fontSize:10,color:"rgba(199,210,254,0.5)"}}>/month</div>
                    </div>
                  ))}
                </div>
              )}""",
    "",
    "Slide 1 — Remove Plans-for-your-vehicle price preview banner"
)

# =============================================================================
# SLIDE 3 — Replace InfoBtn with Show more on plan cards (line 1229)
# =============================================================================
print("\n=== SLIDE 3 — Replace InfoBtn with Show more on plan/pack/addon cards ===")

patch(
    """              <InfoBtn color={ac} onClick={()=>setInfoModal({planId:plan.id})} />""",
    """              <button onClick={(e)=>{e.stopPropagation();setInfoModal({planId:plan.id});}} style={{background:"none",border:"none",color:ac,fontSize:11,cursor:"pointer",padding:"0 2px",fontWeight:700,fontFamily:"inherit",textDecoration:"underline"}}>Show more</button>""",
    "Slide 3 — Replace InfoBtn with Show more on monthly plan cards"
)

# Truncate plan features from 5 to 3 (line 1234 shows slice(0,5))
patch(
    "{plan.features.slice(0,5).map((f,fi)=>(",
    "{plan.features.slice(0,3).map((f,fi)=>(",
    "Slide 3 — Truncate plan features to first 3"
)

# =============================================================================
# SLIDE 3 — Replace InfoBtn with Show more on pack cards (line 1300)
# =============================================================================
patch(
    """              <InfoBtn color={colors[i]} onClick={()=>setInfoModal({packId:pack.id})} />""",
    """              <button onClick={(e)=>{e.stopPropagation();setInfoModal({packId:pack.id});}} style={{background:"none",border:"none",color:colors[i],fontSize:11,cursor:"pointer",padding:"0 2px",fontWeight:700,fontFamily:"inherit",textDecoration:"underline"}}>Show more</button>""",
    "Slide 3 — Replace InfoBtn with Show more on pack cards"
)

# =============================================================================
# SLIDE 6 — Replace InfoBtn with See more on addon cards (line 1529)
# =============================================================================
print("\n=== SLIDE 6 — Replace InfoBtn with See more on addon cards ===")

patch(
    """                            <InfoBtn color={ac} onClick={()=>setInfoModal({addonName:addon.name})} />""",
    """                            <button onClick={(e)=>{e.stopPropagation();setInfoModal({addonName:addon.name});}} style={{background:"none",border:"none",color:ac,fontSize:11,cursor:"pointer",padding:"0 2px",fontWeight:700,fontFamily:"inherit",textDecoration:"underline"}}>See more</button>""",
    "Slide 6 — Replace InfoBtn with See more on addon cards"
)

# =============================================================================
# SLIDE 8 — Wire onBlur to mobile field (line 1560)
# The mobile field is inside a fields array object, not a direct JSX input.
# Pattern: {label:"Mobile number *",value:custMobile,onChange:setCustMobile,...}
# This is passed to a FormField renderer. We need to add onBlur to that object
# OR find the actual input JSX that renders custMobile.
# Since it's a config object, we add an onBlur key to it.
# =============================================================================
print("\n=== SLIDE 8 — Wire onBlur speed checkout to mobile field ===")

patch(
    '{label:"Mobile number *",value:custMobile,onChange:setCustMobile,placeholder:"10-digit number",type:"tel",icon:"📱"},',
    '{label:"Mobile number *",value:custMobile,onChange:setCustMobile,onBlur:()=>handleMobileLookup(custMobile),placeholder:"10-digit number",type:"tel",icon:"📱"},',
    "Slide 8 — Add onBlur to mobile field config object"
)

# =============================================================================
# SLIDE 10 — Fix bill summary plan label (line 321)
# Current: {planObj?.icon} {planObj?.name}
# This only shows the monthly plan name. When pack is selected (planMode==="pack")
# the plan section is hidden (line 316: planMode==="monthly" && selectedPlan &&)
# So the bug is elsewhere — the CostPanel header always shows planObj?.name.
# From line 264: const planObj = cfg.monthlyPlans.find(p=>p.id===selectedPlan)
# When selectedPlan is null (pack mode), planObj is undefined → shows nothing.
# But slide 10 shows "Express Wash" in the bill — meaning selectedPlan has a
# stale value from a previous monthly selection.
# Fix: derive a display label that accounts for pack mode.
# The label at line 321 is inside planMode==="monthly" block so it's correct there.
# The actual mislabelled line is in the grand total / review section.
# From line 824 invoice items: planObj?.name||selectedPlan — this is the invoice.
# The visual bug in slide 10 is the left panel label. Let's fix the packObj name
# display and add a derived label variable.
# =============================================================================
print("\n=== SLIDE 10 — Fix bill summary plan label ===")

# Add a derived planDisplayName constant after planObj definition (line 264)
patch(
    "  const planObj = cfg.monthlyPlans.find((p:any)=>p.id===selectedPlan);",
    """  const planObj = cfg.monthlyPlans.find((p:any)=>p.id===selectedPlan);
  const packObj = cfg.packs.find((p:any)=>p.id===selectedPack);
  const planDisplayName = planMode==="monthly"
    ? (planObj?.name || selectedPlan || "Plan")
    : selectedPack==="pack2" ? "Pack of 2"
    : selectedPack==="pack4" ? "Pack of 4"
    : selectedPack==="urgent" ? "Urgent Wash"
    : selectedPack==="onetime" ? "One-Time Wash"
    : (packObj?.name || selectedPack || "Pack");""",
    "Slide 10 — Add planDisplayName derived variable after planObj"
)

# Now replace planObj?.name in the CostPanel display (line 321)
patch(
    "<div style={{fontSize:13,fontWeight:700,color:\"#1e293b\"}}>{planObj?.icon} {planObj?.name}</div>",
    "<div style={{fontSize:13,fontWeight:700,color:\"#1e293b\"}}>{planMode===\"monthly\"?planObj?.icon:\"📦\"} {planDisplayName}</div>",
    "Slide 10 — Use planDisplayName in CostPanel plan header label"
)

# =============================================================================
# Summary
# =============================================================================
print("\n" + "="*60)
ok    = [r for r in results if r[0] == "OK"]
skips = [r for r in results if r[0] == "SKIP"]
print(f"  Applied : {len(ok)}")
print(f"  Skipped : {len(skips)}")
if skips:
    print("\n  SKIPPED (string not found):")
    for _, label in skips:
        print(f"    - {label}")
print("\nRun: npm run build")
print("="*60)
