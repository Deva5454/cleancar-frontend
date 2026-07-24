/**
 * UniformEntitlement.tsx — real annual uniform entitlement and
 * replacement flow, confirmed as: 2 T-shirts per year for a Car
 * Washer, 2 Shirts per year for a Supervisor or Sales Manager (field
 * sales executive), measured from
 * each person's own real date of joining. A supervisor takes an
 * explicit action to issue this once someone is genuinely due - it's
 * never auto-issued. A mid-cycle damage/wear replacement is genuinely
 * separate from this entitlement, and is fulfilled directly from real
 * Branch stock, which always keeps some on hand for exactly this.
 */

import { useState, useMemo } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getBranchesForCity } from "../../config/branchStores";
import {
  getCurrentAnniversaryYear, isDueForAnnualUniform, recordEntitlementIssuance,
  getReplacementRequests, createReplacementRequest, markReplacementFulfilled, confirmOldItemReturned,
} from "../../services/uniformEntitlementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Shirt, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const SIZES = ["S", "M", "L", "XL"];

export function UniformEntitlement() {
  const { inventory, fulfillReplacementThroughSupervisor, writeOffWasherItem } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeesByRole } = useEmployee();
  const branches = getBranchesForCity(city);
  const [refreshTick, setRefreshTick] = useState(0);

  const washers = getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);
  const supervisors = getEmployeesByRole("Supervisor");
  const salesManagers = getEmployeesByRole("Sales Manager");

  // Real people genuinely due their annual entitlement right now.
  // ✅ FIX: was reading e.dateOfJoining, a field that doesn't exist on
  // the real Employee object (the real field is joiningDate, per
  // EmployeeContext.tsx) — every real employee failed this filter
  // unconditionally, so this list was permanently empty regardless of
  // anyone's actual join date or anniversary.
  const dueList = useMemo(() => {
    const combine = (list: any[], garmentType: "T-Shirt" | "Shirt") =>
      list
        .filter((e: any) => e.joiningDate && isDueForAnnualUniform(e.employeeId || e.id, e.joiningDate))
        .map((e: any) => ({ employeeId: e.employeeId || e.id, name: e.fullName || `${e.firstName} ${e.lastName}`, garmentType, anniversaryYear: getCurrentAnniversaryYear(e.joiningDate) }));
    return [...combine(washers, "T-Shirt"), ...combine(supervisors, "Shirt"), ...combine(salesManagers, "Shirt")];
  }, [washers, supervisors, salesManagers, refreshTick]);

  const [issueSize, setIssueSize] = useState<Record<string, string>>({});

  const handleIssueAnnual = (employeeId: string, employeeName: string, garmentType: "T-Shirt" | "Shirt", anniversaryYear: number) => {
    const size = issueSize[employeeId];
    if (!size) {
      toast.error("Select a size first");
      return;
    }
    const itemName = garmentType === "T-Shirt" ? `Uniform T-Shirt - ${size}` : `Uniform Shirt - ${size}`;
    const item = inventory.find((i: any) => i.itemName === itemName && i.cityId === city);
    if (!item) {
      toast.error(`${itemName} doesn't exist in inventory yet`);
      return;
    }
    if (!branches[0]) {
      toast.error("No real branch found for this city");
      return;
    }
    // Real fix: this previously used issueInventory, which pulls
    // directly from Central stock, silently skipping Branch and
    // Supervisor entirely - the same chain-skipping mistake already
    // corrected for the replacement flow below, just not caught here
    // at the time. Uses the same real, chain-preserving movement now.
    const ok = fulfillReplacementThroughSupervisor(item.itemId, branches[0].id, currentUser?.employeeId || "", employeeId, 2, currentUser?.name || "Supervisor", city);
    if (!ok) {
      toast.error(`Branch doesn't have enough real ${itemName} stock right now`);
      return;
    }
    recordEntitlementIssuance({
      employeeId, employeeName, garmentType, size, anniversaryYear,
      issuedDate: new Date().toISOString(), issuedBy: currentUser?.name || "Supervisor", cityId: city,
    });
    toast.success(`Annual ${garmentType} entitlement issued to ${employeeName}`);
    setRefreshTick((t) => t + 1);
  };

  // Real replacement request form
  const [repEmployeeId, setRepEmployeeId] = useState("");
  const [repGarment, setRepGarment] = useState<"T-Shirt" | "Shirt">("T-Shirt");
  const [repSize, setRepSize] = useState("");
  const [repReason, setRepReason] = useState("");
  const requests = getReplacementRequests(city);

  const allPeople = [
    ...washers.map((w: any) => ({ id: w.employeeId || w.id, name: w.fullName || `${w.firstName} ${w.lastName}`, garment: "T-Shirt" as const })),
    ...supervisors.map((s: any) => ({ id: s.employeeId || s.id, name: s.fullName || `${s.firstName} ${s.lastName}`, garment: "Shirt" as const })),
    ...salesManagers.map((s: any) => ({ id: s.employeeId || s.id, name: s.fullName || `${s.firstName} ${s.lastName}`, garment: "Shirt" as const })),
  ];

  const handleRequestReplacement = () => {
    if (!repEmployeeId || !repSize || !repReason.trim()) {
      toast.error("Select the person, size, and enter a reason");
      return;
    }
    const person = allPeople.find((p) => p.id === repEmployeeId);
    createReplacementRequest({
      employeeId: repEmployeeId, employeeName: person?.name || repEmployeeId,
      garmentType: repGarment, size: repSize, reason: repReason.trim(),
      requestedBy: currentUser?.name || "Supervisor", requestedDate: new Date().toISOString(), cityId: city,
    });
    toast.success("Replacement request created — fulfill it from Branch stock below once ready");
    setRepEmployeeId(""); setRepSize(""); setRepReason("");
    setRefreshTick((t) => t + 1);
  };

  const handleFulfillReplacement = (req: ReturnType<typeof getReplacementRequests>[number]) => {
    // Real, confirmed rule: a replacement can only happen if the
    // existing, damaged item is genuinely returned first. This
    // refuses outright rather than silently allowing a replacement
    // with nothing physically received back.
    if (!req.oldItemReturned) {
      toast.error("Confirm the old, damaged item has been returned before issuing a replacement");
      return;
    }
    if (!branches[0]) {
      toast.error("No real branch found for this city");
      return;
    }
    const itemName = req.garmentType === "T-Shirt" ? `Uniform T-Shirt - ${req.size}` : `Uniform Shirt - ${req.size}`;
    const item = inventory.find((i: any) => i.itemName === itemName && i.cityId === city);
    if (!item) {
      toast.error(`${itemName} doesn't exist in inventory yet`);
      return;
    }
    const ok = fulfillReplacementThroughSupervisor(item.itemId, branches[0].id, currentUser?.employeeId || "", req.employeeId, 1, currentUser?.name || "Supervisor", city);
    if (ok) {
      markReplacementFulfilled(req.id);
      toast.success(`Replacement collected from Branch and issued to ${req.employeeName}`);
      setRefreshTick((t) => t + 1);
    } else {
      toast.error("Branch doesn't have enough real stock for this size right now");
    }
  };

  const handleConfirmReturn = (req: ReturnType<typeof getReplacementRequests>[number]) => {
    // ✅ FIX: this previously only flipped a flag on the request record
    // and never touched real inventory — so the damaged garment the
    // washer physically handed back was never deducted from their real
    // washerStock, and no write-off was ever logged. Every subsequent
    // replacement silently inflated that washer's tracked stock by 1
    // versus what they actually held. This now genuinely removes the
    // old unit from their real stock, with the same Loss-transaction
    // audit trail used for lost/damaged bottles.
    const itemName = req.garmentType === "T-Shirt" ? `Uniform T-Shirt - ${req.size}` : `Uniform Shirt - ${req.size}`;
    const item = inventory.find((i: any) => i.itemName === itemName && i.cityId === city);
    if (!item) {
      toast.error(`${itemName} doesn't exist in inventory yet — can't write off the old item`);
      return;
    }
    const ok = writeOffWasherItem(
      item.itemId, req.employeeId, 1,
      `Uniform replacement - old/damaged ${itemName} returned and written off (${req.reason})`,
      currentUser?.name || "Supervisor", city
    );
    if (!ok) {
      toast.error(`${req.employeeName}'s real stock doesn't show a ${itemName} on hand to write off — check before proceeding`);
      return;
    }
    confirmOldItemReturned(req.id);
    toast.success(`Old, damaged item confirmed returned and written off for ${req.employeeName} — replacement can now be issued`);
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shirt className="w-4 h-4 text-blue-600" /> Annual Uniform Entitlement — Due Now
          </CardTitle>
          <p className="text-xs text-gray-500">2 per year, real anniversary date from each person's date of joining — a replacement never uses up part of this</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {dueList.length === 0 ? (
            <p className="text-sm text-gray-400">No one is currently due their annual entitlement.</p>
          ) : (
            dueList.map((d) => (
              <div key={`${d.employeeId}-${d.garmentType}`} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.garmentType} · Year {d.anniversaryYear} of employment</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={issueSize[d.employeeId] || ""} onValueChange={(v) => setIssueSize((prev) => ({ ...prev, [d.employeeId]: v }))}>
                    <SelectTrigger className="w-20"><SelectValue placeholder="Size" /></SelectTrigger>
                    <SelectContent>
                      {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => handleIssueAnnual(d.employeeId, d.name, d.garmentType, d.anniversaryYear)}>Issue Annual (2)</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Report Damaged / Request Replacement
          </CardTitle>
          <p className="text-xs text-gray-500">Genuinely separate from the annual entitlement — fulfilled from real Branch stock</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={repEmployeeId} onValueChange={(v) => {
              setRepEmployeeId(v);
              const p = allPeople.find((x) => x.id === v);
              if (p) setRepGarment(p.garment);
            }}>
              <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
              <SelectContent>
                {allPeople.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.garment})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={repSize} onValueChange={setRepSize}>
              <SelectTrigger><SelectValue placeholder="Size" /></SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Textarea value={repReason} onChange={(e) => setRepReason(e.target.value)} placeholder="Reason — damaged, worn out, etc." rows={2} />
          <Button variant="outline" onClick={handleRequestReplacement} className="w-full">Submit Replacement Request</Button>

          {requests.filter((r) => r.status === "Pending").length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs">Pending Replacement Requests</Label>
              {requests.filter((r) => r.status === "Pending").map((r) => (
                <div key={r.id} className="bg-amber-50 rounded-lg p-2 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{r.employeeName}</span> — {r.garmentType} ({r.size})
                      <p className="text-xs text-gray-500">{r.reason}</p>
                    </div>
                    {r.oldItemReturned ? (
                      <span className="text-xs text-green-700 font-medium">Old item returned ✓</span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">Old item not yet returned</span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {!r.oldItemReturned && (
                      <Button size="sm" variant="outline" onClick={() => handleConfirmReturn(r)}>Confirm Old Item Returned</Button>
                    )}
                    <Button size="sm" disabled={!r.oldItemReturned} onClick={() => handleFulfillReplacement(r)}>Collect from Branch &amp; Issue</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UniformEntitlement;
