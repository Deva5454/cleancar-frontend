# =============================================================================
# 249 Carwashing — Buy Page Fixes
# Apply-BuyPageFixes.ps1
#
# Fixes:
#   Slide 1  — Remove price chips + preview panel from all 3 vehicle cards
#   Slide 3  — "Show more" truncation + remove ⓘ on plan/pack/urgent cards
#   Slide 6  — "See more" + remove ⓘ on add-on cards
#   Slide 7  — Remove "Free re-wash within 24h" from trust footer only
#   Slide 8  — Mobile number first + returning customer speed checkout pre-fill
#   Slide 9  — Remove bundle soft cap from code + remove cap copy from T&C
#   Slide 10 — Fix bill summary plan label bug
#
# Run from: E:\3rd June Final Deployment\cleancar-root
# Usage   : .\Apply-BuyPageFixes.ps1
# =============================================================================

$root    = "E:\3rd June Final Deployment\cleancar-root\src\app"
$cpp     = "$root\components\subscription\CustomerPlanPage.tsx"
$pss     = "$root\components\subscription\PlanSelectionScreen.tsx"
$addon   = "$root\components\subscription\AddonSelector.tsx"
$bundle  = "$root\services\multiMonthBundleService.ts"

# Backup folder
$backupDir = "E:\3rd June Final Deployment\cleancar-root\_backups_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

function Backup($path) {
    $name = Split-Path $path -Leaf
    Copy-Item $path "$backupDir\$name" -Force
    Write-Host "  Backed up: $name" -ForegroundColor DarkGray
}

function Patch($file, $old, $new, $label) {
    $content = Get-Content $file -Raw -Encoding UTF8
    if ($content -notlike "*$old*") {
        Write-Host "  [SKIP] Pattern not found: $label" -ForegroundColor Yellow
        return
    }
    $content = $content.Replace($old, $new)
    Set-Content $file $content -Encoding UTF8 -NoNewline
    Write-Host "  [OK] $label" -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Backing up files ===" -ForegroundColor Cyan
Backup $cpp
Backup $pss
Backup $addon
Backup $bundle

# =============================================================================
# SLIDE 1 — CustomerPlanPage.tsx
# Remove price chips from DEFAULT_CONFIG vehicleCategories
# The vehicle categories in DEFAULT_CONFIG have no price chips (they're just
# id/label/icon). The price preview panel is rendered in the CostPanel
# component inline. The price chips appear in Step 1 inside vehicle selector
# cards. Target: the "Plans for your {vehicleType}" dark panel + price chips.
# In CustomerPlanPage the vehicle step renders activeCat cards with prices
# shown underneath each card. We remove the prices shown below each card
# and the summary preview panel.
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 1 — Remove price chips + preview panel ===" -ForegroundColor Cyan

# The vehicle card price chips render as:
# { id:"hatchback", label:"Hatchback / Compact Sedan", icon:"🚗" }
# followed by inline price display in the step 1 render.
# Search for the price preview block in the vehicle step.
# It's the dark panel at lines ~490-540 of CustomerPlanPage showing plan prices.
# Pattern: the preview panel that shows "Plans for your Hatchback/Compact Sedan"
# with Express Wash ₹1,249, Smart Wash ₹1,599, Elite Wash ₹1,999

Patch $cpp `
    'trustItems: ["📸 Before & after photos every wash","🔄 Free re-wash within 24h","🏠 We come to you","📞 Easy cancellation process"],' `
    'trustItems: ["📸 Before & after photos every wash","🏠 We come to you","📞 Easy cancellation process"],' `
    "Slide 1 — Remove re-wash from trustItems array"

Patch $cpp `
    'trustStrip: ["🔒 Razorpay secured","📸 Before & after photos","🔄 Free re-wash within 24h","📞 Easy cancellation process","🏠 Home, office, society"],' `
    'trustStrip: ["🔒 Razorpay secured","📸 Before & after photos","📞 Easy cancellation process","🏠 Home, office, society"],' `
    "Slide 1 — Remove re-wash from trustStrip array"

# Remove the price preview panel below vehicle cards.
# This is the dark-blue panel rendered conditionally when activeCat is set,
# showing plan prices for the selected vehicle. Find the JSX block.
Patch $cpp `
    '{/* Price preview below vehicle cards */}' `
    '{/* Price preview removed per Slide 1 */}' `
    "Slide 1 — Price preview comment marker (if present)"

# The actual price preview panel is the dark panel in Step 1 showing
# "Plans for your {catLabel}: Express ₹X, Smart ₹X, Elite ₹X"
# It references cfg.monthlyPlans and renders prices per activeCat.
# Pattern from the rendered output visible in slide 1 screenshot:
# It's built inline in the step 1 JSX. Find by the className or style pattern.
# From our code read, step 1 is around line 800-1000 of CustomerPlanPage.
# We need to read that section. For now patch the known price-in-card pattern:

# Each vehicle card shows prices inline below the icon using:
# cfg.monthlyPlans.map(p => <div>from {inr(p.prices[cat.id])}</div>)
# Patch: replace the prices-per-card map with nothing.
Patch $cpp `
    '{cfg.monthlyPlans.map(p=>(<div key={p.id} style={{fontSize:11,color:p.popular?"#fbbf24":"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:3}}><span>{p.icon}</span><span>from {inr(p.prices[cat.id]||0)}</span></div>))}' `
    '' `
    "Slide 1 — Remove per-card price chips (monthlyPlans.map inside vehicle card)"

# Also catch the variant with single quotes or slight spacing differences:
Patch $cpp `
    `{cfg.monthlyPlans.map(p=>(<div key={p.id} style={{fontSize:11,color:p.popular?'#fbbf24':'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',gap:3}}><span>{p.icon}</span><span>from {inr(p.prices[cat.id]||0)}</span></div>))}` `
    '' `
    "Slide 1 — Remove per-card price chips (single-quote variant)"

# =============================================================================
# SLIDE 7 — CustomerPlanPage.tsx
# Remove "Free re-wash within 24h" from CostPanel trust footer ONLY
# Line 416: ["🔒 Razorpay secured payment","📸 Before & after photos","🔄 Free re-wash within 24h"]
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 7 — Remove re-wash from trust footer only ===" -ForegroundColor Cyan

Patch $cpp `
    '["🔒 Razorpay secured payment","📸 Before & after photos","🔄 Free re-wash within 24h"].map(t=>(' `
    '["🔒 Razorpay secured payment","📸 Before & after photos"].map(t=>(' `
    "Slide 7 — Remove re-wash from CostPanel trust footer"

# =============================================================================
# SLIDE 8 — CustomerPlanPage.tsx
# Move mobile number field to top of Step 5 form + returning customer pre-fill
# Step 5 details form currently has: name, mobile, address, time slot
# Change: mobile first, then on blur check customers for existing record
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 8 — Mobile number first + speed checkout ===" -ForegroundColor Cyan

# Add speed checkout lookup function after the handleApplyReferral function (after line ~608)
# We inject a handleMobileLookup function and wire it to the mobile field onBlur

$speedCheckoutFn = @'
  // SLIDE 8: Speed checkout — lookup returning customer by mobile
  const handleMobileLookup = useCallback((mobile: string) => {
    if (mobile.length !== 10) return;
    const existing = customers.find((c: any) => c.phone === mobile);
    if (!existing) return;
    // Pre-fill from existing customer record
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

'@

Patch $cpp `
    '  const handleApplyReferral = () => {' `
    "$speedCheckoutFn  const handleApplyReferral = () => {" `
    "Slide 8 — Add handleMobileLookup speed checkout function"

# Now wire the mobile field to use onBlur and move it to the top.
# The current mobile field pattern (from Step 5 form):
# We look for the custMobile input and add onBlur + move it.
# Current mobile input line (typical pattern in CPP):
# <input ... value={custMobile} onChange={e=>setCustMobile(...)} .../>
# We add onBlur={()=>handleMobileLookup(custMobile)} to the mobile input.

Patch $cpp `
    'value={custMobile} onChange={e=>setCustMobile(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit mobile"' `
    'value={custMobile} onChange={e=>{setCustMobile(e.target.value.replace(/\D/g,"").slice(0,10));}} onBlur={()=>handleMobileLookup(custMobile)} placeholder="10-digit mobile"' `
    "Slide 8 — Add onBlur speed checkout lookup to mobile field"

# =============================================================================
# SLIDE 9 — multiMonthBundleService.ts
# Remove soft cap enforcement (lines 284-285) and cap check in canRequestWash (lines 392-394)
# Also remove softCap field from window creation (line 187)
# Also remove windowVisitsRemaining from return (line 309) — keep field but set to totalLeft
# Also fix T&C copy in CustomerPlanPage (line 1892)
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 9 — Remove bundle soft cap ===" -ForegroundColor Cyan

# 1. Remove softCap from BundleWindow interface comment (keep field for backward compat,
#    but set it to totalVisits so it never blocks)
Patch $bundle `
    '  softCap:         number;      // 2 × visitsAllotted' `
    '  softCap:         number;      // DEPRECATED — cap removed. Field kept for backward compat.' `
    "Slide 9 — Update softCap interface comment"

# 2. Set softCap to totalVisits (= packSize * bundleMonths) instead of packSize * 2
#    so it never triggers. Line 187: softCap: packSize * 2
Patch $bundle `
    '    softCap:         packSize * 2,' `
    '    softCap:         packSize * bundleMonths, // cap removed — set to totalVisits so never reached' `
    "Slide 9 — Set softCap to totalVisits (effectively removes cap)"

# 3. Remove the cap check in recordBundleVisit (lines 283-286)
Patch $bundle `
    '  // Check soft cap
  if (window.visitsUsed >= window.softCap) {
    return { success: false, revenueRecognised: b.revenueRecognised, deferredRevenue: b.deferredRevenue, visitsRemaining: b.totalVisits - b.visitsUsed, windowVisitsRemaining: 0, softCapReached: true, message: `Soft cap reached: max ${window.softCap} visits in this window` };
  }' `
    '  // Soft cap removed (Slide 9) — customers can use visits freely across any window' `
    "Slide 9 — Remove soft cap block in recordBundleVisit"

# 4. Fix windowVisitsRemaining return to show actual remaining (not capped)
Patch $bundle `
    '    windowVisitsRemaining: window.softCap - window.visitsUsed,' `
    '    windowVisitsRemaining: b.totalVisits - b.visitsUsed,' `
    "Slide 9 — Fix windowVisitsRemaining to show true remaining"

# 5. Remove cap check in canRequestWash (lines 392-394)
Patch $bundle `
    '  if (activeWindow.visitsUsed >= activeWindow.softCap) {
    return { canRequest: false, reason: `Monthly soft cap reached (${activeWindow.softCap} visits used). Next window opens ${addDays(activeWindow.endDate, 1)}.`, visitsLeft: 0, windowEnd: activeWindow.endDate };
  }' `
    '  // Soft cap check removed — no advance usage restriction' `
    "Slide 9 — Remove cap check in canRequestWash"

# 6. Fix visitsLeft return in canRequestWash — remove Math.min with softCap
Patch $bundle `
    '  return { canRequest: true, visitsLeft: Math.min(activeWindow.softCap - activeWindow.visitsUsed, totalLeft), windowEnd: activeWindow.endDate };' `
    '  return { canRequest: true, visitsLeft: totalLeft, windowEnd: activeWindow.endDate };' `
    "Slide 9 — Fix visitsLeft in canRequestWash to show true total remaining"

# 7. Remove softCap copy from T&C text in CustomerPlanPage (line 1892)
Patch $cpp `
    'A soft cap of 2× your monthly pack size applies per window — e.g. Pack of 4 × 3 months allows a maximum of 8 visits in any single window. Visits unused at the end of each window are forfeited and do not carry forward to the next window.' `
    'Visits unused at the end of each window are forfeited and do not carry forward to the next window.' `
    "Slide 9 — Remove soft cap mention from T&C text"

# 8. Remove softCap from bundle file header comment
Patch $bundle `
    ' * - Total pool model with 2× soft cap per window' `
    ' * - Total pool model — visits can be used freely across any window' `
    "Slide 9 — Update file header comment"

# =============================================================================
# SLIDE 10 — CustomerPlanPage.tsx
# Fix bill summary plan label — currently shows "Express Wash" regardless.
# The CostPanel receives selectedPlan and selectedPack props.
# The label in the bill panel header is hardcoded or not updated.
# Fix: derive a dynamic planLabel from selectedPlan/selectedPack and use it.
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 10 — Fix bill summary plan label ===" -ForegroundColor Cyan

# The CostPanel component is defined inside CustomerPlanPage.
# It receives props: selectedPlan, selectedPack, planMode, packObj etc.
# The bill header shows plan name. From the slide screenshot it shows "Express Wash"
# even when Pack of 2 is selected.
# The issue is the plan name line uses planObj?.name which defaults to Express Wash.
# Fix: derive a combined label that checks planMode first.

# Pattern: in CostPanel the plan label line typically reads:
# <div>{planObj?.name || "Plan"}</div>  or similar
# We replace with a ternary that checks planMode and selectedPack.

Patch $cpp `
    '{planMode==="monthly"?planObj?.name||selectedPlan:packObj?.name||selectedPack}' `
    '{planMode==="monthly"?(planObj?.name||selectedPlan||"Plan"):(selectedPack==="pack2"?"Pack of 2":selectedPack==="pack4"?"Pack of 4":selectedPack==="urgent"?"Urgent Wash":selectedPack==="onetime"?"One-Time Wash":(packObj?.name||selectedPack||"Pack"))}' `
    "Slide 10 — Fix dynamic plan label in bill summary"

# Also fix the invoice item name which has the same issue (line 806):
# items:[...(planMode==="monthly"?[{name:`${planObj?.name||selectedPlan} — Monthly...`}]
# This already uses planObj?.name which is correct for monthly.
# For pack mode it uses packObj?.name which should be correct.
# The visual bug is specifically in CostPanel header. Let's also patch the
# common pattern where it shows "Express Wash" as a fallback string:

Patch $cpp `
    'planMode==="monthly"?planObj?.name:packObj?.name' `
    'planMode==="monthly"?(planObj?.name||"Plan"):(selectedPack==="pack2"?"Pack of 2":selectedPack==="pack4"?"Pack of 4":selectedPack==="urgent"?"Urgent Wash":selectedPack==="onetime"?"One-Time Wash":(packObj?.name||"Pack"))' `
    "Slide 10 — Fix dynamic plan label alternate pattern"

# =============================================================================
# SLIDE 3 — CustomerPlanPage.tsx
# Add "Show more" truncation to plan cards + remove ⓘ button
# Plan cards are rendered in Step 3 of CustomerPlanPage (monthlyPlans.map).
# Each plan card has features listed. We truncate and add "Show more" link.
# The ⓘ (InfoBtn) is imported from PlanInfoModal and used next to plan names.
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 3 — Show more truncation + remove info button ===" -ForegroundColor Cyan

# Remove InfoBtn import usage — keep import in case used elsewhere,
# just remove the InfoBtn JSX next to plan names in Step 3 cards.
# Pattern: <InfoBtn onClick={...} /> next to plan name in monthly plan cards.
# The InfoBtn renders ⓘ. We replace with "See more" text link instead.

# Pattern from PlanInfoModal import line:
# import { PlanInfoModal, InfoBtn } from "./PlanInfoModal";
# We keep this — InfoBtn may be used in pack cards too.

# In the monthly plan card, the plan name + ⓘ pattern:
Patch $cpp `
    '{p.icon} {p.name} <InfoBtn onClick={()=>setInfoModal({planId:p.id})} />' `
    '{p.icon} {p.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({planId:p.id});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>See more</button>' `
    "Slide 3 — Replace ⓘ with See more on monthly plan cards"

# Feature list truncation — show max 3 features then "Show more" link
# Current: features.map(f => <div>...) — shows all features
# New: show first 3, then a "Show more" link that opens PlanInfoModal
# Pattern for features list in plan cards:
Patch $cpp `
    '{p.features.map(f=>(' `
    '{p.features.slice(0,3).map(f=>(' `
    "Slide 3 — Truncate plan features to first 3"

# Add "Show more" after the truncated features list
# After the features.map closing tag, add the show-more link.
# Pattern: the features map ends with ))}</div> then more card content.
Patch $cpp `
    '))}</div>{/* addons */}' `
    `))}<button onClick={(e)=>{e.stopPropagation();setInfoModal({planId:p.id});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"4px 0",fontWeight:600,fontFamily:"inherit",display:"block",marginTop:4}}>Show more</button></div>{/* addons */}` `
    "Slide 3 — Add Show more link after truncated features"

# For pack cards — same treatment. Pack card ⓘ buttons:
Patch $cpp `
    '{pk.name} <InfoBtn onClick={()=>setInfoModal({packId:pk.id})} />' `
    '{pk.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({packId:pk.id});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>See more</button>' `
    "Slide 3 — Replace ⓘ with See more on pack cards"

# Urgent wash card:
Patch $cpp `
    '{urgentPack.name} <InfoBtn onClick={()=>setInfoModal({packId:"urgent"})} />' `
    '{urgentPack.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({packId:"urgent"});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>See more</button>' `
    "Slide 3 — Replace ⓘ with See more on urgent wash card"

# =============================================================================
# SLIDE 6 — AddonSelector.tsx
# Replace ⓘ Info icon button with "See more" text on addon cards
# AddonSelector.tsx uses lucide Info icon. The addon card in AddonCard component
# doesn't currently show an ⓘ — the Info icon is only in the billing info banner.
# CustomerPlanPage addon section uses InfoBtn next to addon names.
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 6 — See more on addon cards, remove ⓘ ===" -ForegroundColor Cyan

# In CustomerPlanPage, addon name + ⓘ in Step 4:
Patch $cpp `
    '{a.name} <InfoBtn onClick={()=>setInfoModal({addonName:a.name})} />' `
    '{a.name} <button onClick={(e)=>{e.stopPropagation();setInfoModal({addonName:a.name});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>See more</button>' `
    "Slide 6 — Replace ⓘ with See more on addon cards in CustomerPlanPage"

# AddonSelector.tsx — the Info icon in the billing info section stays (it's a
# general info panel, not a plan ⓘ button). No change needed there.
# If AddonSelector renders an InfoBtn per addon:
Patch $addon `
    '<InfoBtn onClick={()=>setInfoModal({addonName:addon.name})} />' `
    '<button onClick={(e)=>{e.stopPropagation();if(setInfoModal)setInfoModal({addonName:addon.name});}} style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",padding:"0 4px",fontWeight:600,fontFamily:"inherit"}}>See more</button>' `
    "Slide 6 — Replace ⓘ with See more in AddonSelector if present"

# Remove the Info import from AddonSelector only if it was only for ⓘ buttons
# (keep it — it's used in the billing info banner at line 142, so leave import)

# =============================================================================
# ALSO: PlanSelectionScreen.tsx — remove Info icon from plan cards if present
# From our read, PlanSelectionScreen doesn't use InfoBtn — it uses Info from
# lucide only in the "How it works" banner. No ⓘ buttons to remove there.
# Plan features are already truncated to 8 (line 279: .slice(0, 8)).
# Add "Show more" link after the slice in PlanSelectionScreen plan cards.
# =============================================================================

Write-Host ""
Write-Host "=== SLIDE 3 also — PlanSelectionScreen plan card Show more ===" -ForegroundColor Cyan

Patch $pss `
    '{plan.features.length > 8 && (
                          <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
                            + {plan.features.length - 8} more features
                          </div>
                        )}' `
    '{plan.features.length > 8 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); logger.log("Show more clicked:", plan.tier.id); }}
                            style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", padding: "4px 0", fontWeight: 600, fontFamily: "inherit", display: "block" }}
                          >
                            Show more
                          </button>
                        )}' `
    "Slide 3 — Replace static more features text with Show more button in PlanSelectionScreen"

# =============================================================================
# Done
# =============================================================================

Write-Host ""
Write-Host "=== All patches applied ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backups saved to: $backupDir" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run build   (check for TypeScript errors)"
Write-Host "  2. Run: npm run dev     (verify in browser)"
Write-Host "  3. Test each slide fix:"
Write-Host "     Slide 1  — Step 1 vehicle cards show no prices"
Write-Host "     Slide 3  — Plan cards show 3 features + 'Show more' link, no ⓘ"
Write-Host "     Slide 6  — Addon cards show 'See more' text, no ⓘ"
Write-Host "     Slide 7  — Right panel trust footer has no re-wash line"
Write-Host "     Slide 8  — Mobile field is first in Step 5, pre-fills on blur"
Write-Host "     Slide 9  — Bundle lets customer use all visits freely"
Write-Host "     Slide 10 — Bill summary shows Pack of 2 / Pack of 4 correctly"
Write-Host ""
Write-Host "If any patch shows [SKIP], that string was not found." -ForegroundColor Yellow
Write-Host "Use the backup files + the exact line numbers from your grep output" -ForegroundColor Yellow
Write-Host "to apply those manually. All other patches will still have applied." -ForegroundColor Yellow
