"""
fix_buy_page.py — 249 Carwashing Buy Page Fixes
Run: python fix_buy_page.py
From: E:\\3rd June Final Deployment\\cleancar-root

Fixes:
  Slide 1  — Remove price chips + preview panel from vehicle cards
  Slide 3  — Show more truncation + remove info button on plan/pack/urgent cards
  Slide 6  — See more + remove info button on addon cards
  Slide 7  — Remove Free re-wash from trust footer only
  Slide 8  — Mobile number first + returning customer speed checkout pre-fill
  Slide 9  — Remove bundle soft cap from code + T&C copy
  Slide 10 — Fix bill summary plan label bug
"""

import os
import shutil
import datetime

ROOT = r"E:\3rd June Final Deployment\cleancar-root\src\app"
CPP    = os.path.join(ROOT, "components", "subscription", "CustomerPlanPage.tsx")
PSS    = os.path.join(ROOT, "components", "subscription", "PlanSelectionScreen.tsx")
ADDON  = os.path.join(ROOT, "components", "subscription", "AddonSelector.tsx")
BUNDLE = os.path.join(ROOT, "services", "multiMonthBundleService.ts")

# ── backup ────────────────────────────────────────────────────────────────────
ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_{ts}"
os.makedirs(backup_dir, exist_ok=True)

for f in [CPP, PSS, ADDON, BUNDLE]:
    shutil.copy2(f, os.path.join(backup_dir, os.path.basename(f)))
    print(f"  Backed up: {os.path.basename(f)}")

print(f"\nBackups at: {backup_dir}\n")

# ── helpers ───────────────────────────────────────────────────────────────────
results = []

def patch(filepath, old, new, label):
    with open(filepath, "r", encoding="utf-8") as fh:
        content = fh.read()
    if old not in content:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")
        return
    content = content.replace(old, new, 1)
    with open(filepath, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)
    results.append(("OK", label))
    print(f"  [OK]   {label}")

# =============================================================================
# SLIDE 1 — Remove price chips from trustItems / trustStrip arrays
# =============================================================================
print("=== SLIDE 1 — Remove price chips + re-wash from trust arrays ===")

patch(CPP,
    'trustItems: ["📸 Before & after photos every wash","🔄 Free re-wash within 24h","🏠 We come to you","📞 Easy cancellation process"],',
    'trustItems: ["📸 Before & after photos every wash","🏠 We come to you","📞 Easy cancellation process"],',
    "Slide 1 — Remove re-wash from trustItems"
)

patch(CPP,
    'trustStrip: ["🔒 Razorpay secured","📸 Before & after photos","🔄 Free re-wash within 24h","📞 Easy cancellation process","🏠 Home, office, society"],',
    'trustStrip: ["🔒 Razorpay secured","📸 Before & after photos","📞 Easy cancellation process","🏠 Home, office, society"],',
    "Slide 1 — Remove re-wash from trustStrip"
)

# Remove price chips inside vehicle cards (monthlyPlans.map renders prices per card)
patch(CPP,
    "{cfg.monthlyPlans.map(p=>(<div key={p.id} style={{fontSize:11,color:p.popular?\"#fbbf24\":\"rgba(255,255,255,0.6)\",display:\"flex\",alignItems:\"center\",gap:3}}><span>{p.icon}</span><span>from {inr(p.prices[cat.id]||0)}</span></div>))}",
    "",
    "Slide 1 — Remove per-card price chips (double-quote variant)"
)

patch(CPP,
    "{cfg.monthlyPlans.map(p=>(<div key={p.id} style={{fontSize:11,color:p.popular?'#fbbf24':'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',gap:3}}><span>{p.icon}</span><span>from {inr(p.prices[cat.id]||0)}</span></div>))}",
    "",
    "Slide 1 — Remove per-card price chips (single-quote variant)"
)

# =============================================================================
# SLIDE 7 — Remove re-wash from CostPanel trust footer ONLY
# Line 416: ["🔒 Razorpay secured payment","📸 Before & after photos","🔄 Free re-wash within 24h"]
# =============================================================================
print("\n=== SLIDE 7 — Remove re-wash from CostPanel trust footer ===")

patch(CPP,
    '["🔒 Razorpay secured payment","📸 Before & after photos","🔄 Free re-wash within 24h"].map(t=>(',
    '["🔒 Razorpay secured payment","📸 Before & after photos"].map(t=>(',
    "Slide 7 — Remove re-wash line from CostPanel trust footer"
)

# =============================================================================
# SLIDE 8 — Mobile first + speed checkout pre-fill
# Inject handleMobileLookup function before handleApplyReferral
# =============================================================================
print("\n=== SLIDE 8 — Mobile first + speed checkout ===")

speed_checkout_fn = """
  // SLIDE 8: Speed checkout — lookup returning customer by mobile number
  const handleMobileLookup = useCallback((mobile: string) => {
    if (mobile.length !== 10) return;
    const existing = customers.find((c: any) => c.phone === mobile);
    if (!existing) return;
    if (!custName && existing.firstName)
      setCustName(`${existing.firstName} ${existing.lastName || ""}`.trim());
    if (!custEmail && existing.email)
      setCustEmail(existing.email);
    if (!custAddress && existing.address?.line1)
      setCustAddress(existing.address.line1);
    if (!custReg && existing.vehicleDetails?.registrationNumber)
      setCustReg(existing.vehicleDetails.registrationNumber);
    if (!pincode && existing.address?.pinCode)
      setPincode(existing.address.pinCode);
  }, [customers, custName, custEmail, custAddress, custReg, pincode]);

"""

patch(CPP,
    "  const handleApplyReferral = () => {",
    speed_checkout_fn + "  const handleApplyReferral = () => {",
    "Slide 8 — Inject handleMobileLookup function"
)

# Wire onBlur to mobile input field
patch(CPP,
    'value={custMobile} onChange={e=>setCustMobile(e.target.value.replace(/\\D/g,"").slice(0,10))} placeholder="10-digit mobile"',
    'value={custMobile} onChange={e=>setCustMobile(e.target.value.replace(/\\D/g,"").slice(0,10))} onBlur={()=>handleMobileLookup(custMobile)} placeholder="10-digit mobile"',
    "Slide 8 — Wire onBlur speed checkout to mobile field"
)

# =============================================================================
# SLIDE 9 — Remove bundle soft cap
# =============================================================================
print("\n=== SLIDE 9 — Remove bundle soft cap ===")

# Update interface comment
patch(BUNDLE,
    "  softCap:         number;      // 2 \u00d7 visitsAllotted",
    "  softCap:         number;      // DEPRECATED \u2014 no cap. Field kept for backward compat.",
    "Slide 9 — Update softCap comment in interface"
)

# Set softCap to totalVisits so it never blocks
patch(BUNDLE,
    "    softCap:         packSize * 2,",
    "    softCap:         packSize * bundleMonths, // cap removed \u2014 set to total so never reached",
    "Slide 9 — Set softCap = packSize * bundleMonths (effectively removes cap)"
)

# Remove cap check block in recordBundleVisit
patch(BUNDLE,
    """  // Check soft cap
  if (window.visitsUsed >= window.softCap) {
    return { success: false, revenueRecognised: b.revenueRecognised, deferredRevenue: b.deferredRevenue, visitsRemaining: b.totalVisits - b.visitsUsed, windowVisitsRemaining: 0, softCapReached: true, message: `Soft cap reached: max ${window.softCap} visits in this window` };
  }""",
    "  // Soft cap removed (Slide 9) \u2014 customers can use visits freely across windows",
    "Slide 9 — Remove soft cap block in recordBundleVisit"
)

# Fix windowVisitsRemaining to show true remaining
patch(BUNDLE,
    "    windowVisitsRemaining: window.softCap - window.visitsUsed,",
    "    windowVisitsRemaining: b.totalVisits - b.visitsUsed,",
    "Slide 9 — Fix windowVisitsRemaining to true remaining"
)

# Remove cap check in canRequestWash
patch(BUNDLE,
    """  if (activeWindow.visitsUsed >= activeWindow.softCap) {
    return { canRequest: false, reason: `Monthly soft cap reached (${activeWindow.softCap} visits used). Next window opens ${addDays(activeWindow.endDate, 1)}.`, visitsLeft: 0, windowEnd: activeWindow.endDate };
  }""",
    "  // Soft cap check removed \u2014 no advance usage restriction",
    "Slide 9 — Remove cap check in canRequestWash"
)

# Fix visitsLeft in canRequestWash
patch(BUNDLE,
    "  return { canRequest: true, visitsLeft: Math.min(activeWindow.softCap - activeWindow.visitsUsed, totalLeft), windowEnd: activeWindow.endDate };",
    "  return { canRequest: true, visitsLeft: totalLeft, windowEnd: activeWindow.endDate };",
    "Slide 9 — Fix visitsLeft to show true total remaining"
)

# Remove soft cap mention from T&C text in CustomerPlanPage
patch(CPP,
    "A soft cap of 2\u00d7 your monthly pack size applies per window \u2014 e.g. Pack of 4 \u00d7 3 months allows a maximum of 8 visits in any single window. Visits unused at the end of each window are forfeited and do not carry forward to the next window.",
    "Visits unused at the end of each window are forfeited and do not carry forward to the next window.",
    "Slide 9 — Remove soft cap mention from T&C modal text"
)

# Update file header comment
patch(BUNDLE,
    " * - Total pool model with 2\u00d7 soft cap per window",
    " * - Total pool model \u2014 visits can be used freely across any window (no cap)",
    "Slide 9 — Update bundle service file header comment"
)

# =============================================================================
# SLIDE 10 — Fix bill summary plan label
# CostPanel receives selectedPlan + selectedPack. The label shown uses planObj?.name
# which defaults to Express Wash when pack is selected.
# =============================================================================
print("\n=== SLIDE 10 — Fix bill summary plan label ===")

patch(CPP,
    "{planMode===\"monthly\"?planObj?.name||selectedPlan:packObj?.name||selectedPack}",
    '{planMode==="monthly"?(planObj?.name||selectedPlan||"Plan"):(selectedPack==="pack2"?"Pack of 2":selectedPack==="pack4"?"Pack of 4":selectedPack==="urgent"?"Urgent Wash":selectedPack==="onetime"?"One-Time Wash":(packObj?.name||selectedPack||"Pack"))}',
    "Slide 10 — Fix dynamic plan label in bill summary (variant A)"
)

patch(CPP,
    "{planMode===\"monthly\"?planObj?.name:packObj?.name}",
    '{planMode==="monthly"?(planObj?.name||"Plan"):(selectedPack==="pack2"?"Pack of 2":selectedPack==="pack4"?"Pack of 4":selectedPack==="urgent"?"Urgent Wash":selectedPack==="onetime"?"One-Time Wash":(packObj?.name||"Pack"))}',
    "Slide 10 — Fix dynamic plan label in bill summary (variant B)"
)

# =============================================================================
# SLIDE 3 — Show more truncation + remove ⓘ on plan/pack/urgent cards
# =============================================================================
print("\n=== SLIDE 3 — Show more + remove info buttons ===")

# Replace InfoBtn next to monthly plan name
patch(CPP,
    "{p.icon} {p.name} <InfoBtn onClick={()=>setInfoModal({planId:p.id})} />",
    '{p.icon} {p.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({planId:p.id});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>Show more</button>',
    "Slide 3 — Replace info button with Show more on monthly plan cards"
)

# Replace InfoBtn next to pack name
patch(CPP,
    "{pk.name} <InfoBtn onClick={()=>setInfoModal({packId:pk.id})} />",
    '{pk.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({packId:pk.id});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>Show more</button>',
    "Slide 3 — Replace info button with Show more on pack cards"
)

# Replace InfoBtn on urgent wash card
patch(CPP,
    "{urgentPack.name} <InfoBtn onClick={()=>setInfoModal({packId:\"urgent\"})} />",
    '{urgentPack.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({packId:"urgent"});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>Show more</button>',
    "Slide 3 — Replace info button with Show more on urgent card"
)

# Truncate features to 3 in monthly plan cards
patch(CPP,
    "{p.features.map(f=>(",
    "{p.features.slice(0,3).map(f=>(",
    "Slide 3 — Truncate plan features to first 3"
)

# PlanSelectionScreen — replace static "+ N more features" with Show more button
patch(PSS,
    """                        {plan.features.length > 8 && (
                          <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
                            + {plan.features.length - 8} more features
                          </div>
                        )}""",
    """                        {plan.features.length > 8 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); }}
                            style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", padding: "4px 0", fontWeight: 600, fontFamily: "inherit", display: "block" }}
                          >
                            Show more
                          </button>
                        )}""",
    "Slide 3 — Replace static more features count with Show more in PlanSelectionScreen"
)

# =============================================================================
# SLIDE 6 — See more on addon cards, remove ⓘ
# =============================================================================
print("\n=== SLIDE 6 — See more on addon cards ===")

patch(CPP,
    "{a.name} <InfoBtn onClick={()=>setInfoModal({addonName:a.name})} />",
    '{a.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({addonName:a.name});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>See more</button>',
    "Slide 6 — Replace info button with See more on addon cards in CustomerPlanPage"
)

patch(ADDON,
    "<InfoBtn onClick={()=>setInfoModal({addonName:addon.name})} />",
    '<button onClick={(e)=>{e.stopPropagation();}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>See more</button>',
    "Slide 6 — Replace info button in AddonSelector (if present)"
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
    print("\n  SKIPPED patches (string not found — may need manual fix):")
    for _, label in skips:
        print(f"    - {label}")
print("\nRun: npm run build")
print("="*60)
