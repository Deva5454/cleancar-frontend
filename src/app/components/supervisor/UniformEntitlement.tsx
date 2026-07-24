/**
 * UniformEntitlement.tsx — real annual uniform entitlement and
 * replacement flow, confirmed as: 2 T-shirts per year for a Car
 * Washer, 2 Shirts per year for a Supervisor or TSE, measured from
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
  getReplacementRequests, createReplacementRequest, markReplacementFulfilled,
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
  const { inventory, issueInventory, fulfillFromBranch } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeesByRole } = useEmployee();
  const branches = getBranchesForCity(city);
  const [refreshTick, setRefreshTick] = useState(0);

  const washers = getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);
  const supervisors = getEmployeesByRole("Supervisor");
  const tses = getEmployeesByRole("TSE");

  // Real people genuinely due their annual entitlement right now.
  const dueList = useMemo(() => {
    const combine = (list: any[], garmentType: "T-Shirt" | "Shirt") =>
      list
        .filter((e: any) => e.dateOfJoining && isDueForAnnualUniform(e.employeeId || e.id, e.dateOfJoining))
        .map((e: any) => ({ employeeId: e.employeeId || e.id, name: e.fullName || `${e.firstName} ${e.lastName}`, garmentType, anniversaryYear: getCurrentAnniversaryYear(e.dateOfJoining) }));
    return [...combine(washers, "T-Shirt"), ...combine(supervisors, "Shirt"), ...combine(tses, "Shirt")];
  }, [washers, supervisors, tses, refreshTick]);

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
    // Real annual entitlement is 2 real pieces, issued from whatever
    // supervisor stock is available - not urgent, so it follows the
    // normal chain rather than pulling directly from Branch.
    issueInventory(item.itemId, 2, "Washer", employeeId, currentUser?.name || "Supervisor", city);
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
    ...tses.map((t: any) => ({ id: t.employeeId || t.id, name: t.fullName || `${t.firstName} ${t.lastName}`, garment: "Shirt" as const })),
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
    const ok = fulfillFromBranch(item.itemId, branches[0].id, req.employeeId, 1, currentUser?.name || "Supervisor", city);
    if (ok) {
      markReplacementFulfilled(req.id);
      toast.success(`Replacement fulfilled for ${req.employeeName} from Branch stock`);
      setRefreshTick((t) => t + 1);
    } else {
      toast.error("Branch doesn't have enough real stock for this size right now");
    }
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
                <div key={r.id} className="flex items-center justify-between bg-amber-50 rounded-lg p-2 text-sm">
                  <div>
                    <span className="font-medium">{r.employeeName}</span> — {r.garmentType} ({r.size})
                    <p className="text-xs text-gray-500">{r.reason}</p>
                  </div>
                  <Button size="sm" onClick={() => handleFulfillReplacement(r)}>Fulfill from Branch</Button>
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
