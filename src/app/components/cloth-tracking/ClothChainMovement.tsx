/**
 * ClothChainMovement.tsx — real movement of barcoded cloths through
 * the actual chain: Kim → Branch, and Branch → Supervisor. Each cloth
 * is selected individually by its real barcode, matching how the rest
 * of this system tracks identity, not aggregate quantity.
 */

import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getBranchesForCity } from "../../config/branchStores";
import { clothTrackingService } from "../../services/clothTrackingService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Truck } from "lucide-react";
import { toast } from "sonner";

export function ClothChainMovement() {
  const { city } = useCity();
  const { getEmployeesByRole } = useEmployee();
  const branches = getBranchesForCity(city);
  const supervisors = getEmployeesByRole("Supervisor");

  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || "");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [checkedAtKim, setCheckedAtKim] = useState<Set<string>>(new Set());
  const [checkedAtBranch, setCheckedAtBranch] = useState<Set<string>>(new Set());

  // Real public queries - filtering the two real statuses/locations that matter here
  const kimClean = useMemo(
    () => clothTrackingService.getClothsByStatus("CLEAN_PACKED").filter((c) => c.currentLocation === "Kim"),
    [refreshTick]
  );
  const branchClean = useMemo(
    () => clothTrackingService.getClothsByStatus("CLEAN_PACKED").filter((c) => c.currentLocation === "Branch" && c.currentLocationId === selectedBranchId),
    [refreshTick, selectedBranchId]
  );

  const toggleKim = (id: string) => {
    setCheckedAtKim((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleBranch = (id: string) => {
    setCheckedAtBranch((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleSendToBranch = () => {
    if (!selectedBranchId || checkedAtKim.size === 0) {
      toast.error("Select the branch and at least one real cloth");
      return;
    }
    clothTrackingService.moveClothsToBranch(Array.from(checkedAtKim), selectedBranchId);
    toast.success(`${checkedAtKim.size} cloth${checkedAtKim.size !== 1 ? "s" : ""} sent to the branch`);
    setCheckedAtKim(new Set());
    setRefreshTick((t) => t + 1);
  };

  const handleSendToSupervisor = () => {
    if (!selectedSupervisorId || checkedAtBranch.size === 0) {
      toast.error("Select the supervisor and at least one real cloth");
      return;
    }
    clothTrackingService.moveClothsToSupervisor(Array.from(checkedAtBranch), selectedSupervisorId);
    toast.success(`${checkedAtBranch.size} cloth${checkedAtBranch.size !== 1 ? "s" : ""} sent to the supervisor`);
    setCheckedAtBranch(new Set());
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" /> Cloth Chain Movement
        </h1>
        <p className="text-sm text-gray-500">Move real, barcoded cloths through Kim → Branch → Supervisor</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Kim → Branch</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {kimClean.length === 0 ? (
            <p className="text-sm text-gray-400">No clean cloths currently at Kim.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {kimClean.map((c) => (
                <label key={c.id} className={`flex items-center gap-2 border rounded-lg p-2 cursor-pointer ${checkedAtKim.has(c.id) ? "border-blue-500 bg-blue-50" : ""}`}>
                  <input type="checkbox" checked={checkedAtKim.has(c.id)} onChange={() => toggleKim(c.id)} />
                  <span className="text-sm">{c.shortId} {c.color && `· ${c.color}`}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{c.washCount}/90</Badge>
                </label>
              ))}
            </div>
          )}
          <Button onClick={handleSendToBranch} disabled={checkedAtKim.size === 0} className="w-full">
            Send {checkedAtKim.size > 0 ? checkedAtKim.size : ""} to Branch
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Branch → Supervisor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
            <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
            <SelectContent>
              {supervisors.map((s: any) => <SelectItem key={s.employeeId || s.id} value={s.employeeId || s.id}>{s.fullName || `${s.firstName} ${s.lastName}`}</SelectItem>)}
            </SelectContent>
          </Select>
          {branchClean.length === 0 ? (
            <p className="text-sm text-gray-400">No clean cloths currently at this branch.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {branchClean.map((c) => (
                <label key={c.id} className={`flex items-center gap-2 border rounded-lg p-2 cursor-pointer ${checkedAtBranch.has(c.id) ? "border-blue-500 bg-blue-50" : ""}`}>
                  <input type="checkbox" checked={checkedAtBranch.has(c.id)} onChange={() => toggleBranch(c.id)} />
                  <span className="text-sm">{c.shortId} {c.color && `· ${c.color}`}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{c.washCount}/90</Badge>
                </label>
              ))}
            </div>
          )}
          <Button onClick={handleSendToSupervisor} disabled={checkedAtBranch.size === 0} className="w-full">
            Send {checkedAtBranch.size > 0 ? checkedAtBranch.size : ""} to Supervisor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClothChainMovement;
