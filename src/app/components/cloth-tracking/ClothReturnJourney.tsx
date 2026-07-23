/**
 * ClothReturnJourney.tsx — the real, previously-missing reverse
 * journey: a dirty cloth moving from a Supervisor back to the Branch,
 * and from the Branch back to Kim, before it can ever reach the real
 * Laundry screen. Uses the same real returnClothsTowardKim() function
 * that existed but was never wired to any screen.
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
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

export function ClothReturnJourney() {
  const { city } = useCity();
  const { getEmployeesByRole } = useEmployee();
  const branches = getBranchesForCity(city);
  const supervisors = getEmployeesByRole("Supervisor");

  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || "");
  const [checkedAtSupervisor, setCheckedAtSupervisor] = useState<Set<string>>(new Set());
  const [checkedAtBranch, setCheckedAtBranch] = useState<Set<string>>(new Set());

  // Real, dirty cloths genuinely sitting with a specific supervisor,
  // awaiting their journey back toward Kim.
  const dirtyAtSupervisor = useMemo(
    () => selectedSupervisorId
      ? clothTrackingService.getClothsByStatus("IN_LAUNDRY_PROCESS").filter((c) => c.currentLocation === "Supervisor" && c.currentLocationId === selectedSupervisorId)
      : [],
    [refreshTick, selectedSupervisorId]
  );
  // Real, dirty cloths already at the branch, awaiting the final leg to Kim.
  const dirtyAtBranch = useMemo(
    () => clothTrackingService.getClothsByStatus("IN_LAUNDRY_PROCESS").filter((c) => c.currentLocation === "Branch" && c.currentLocationId === selectedBranchId),
    [refreshTick, selectedBranchId]
  );

  const toggleSupervisor = (id: string) => {
    setCheckedAtSupervisor((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleBranch = (id: string) => {
    setCheckedAtBranch((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleReturnToBranch = () => {
    if (!selectedBranchId || checkedAtSupervisor.size === 0) {
      toast.error("Select the branch and at least one real cloth");
      return;
    }
    clothTrackingService.returnClothsTowardKim(Array.from(checkedAtSupervisor), "Branch", selectedBranchId);
    toast.success(`${checkedAtSupervisor.size} cloth${checkedAtSupervisor.size !== 1 ? "s" : ""} sent back to the branch`);
    setCheckedAtSupervisor(new Set());
    setRefreshTick((t) => t + 1);
  };

  const handleReturnToKim = () => {
    if (checkedAtBranch.size === 0) {
      toast.error("Select at least one real cloth");
      return;
    }
    clothTrackingService.returnClothsTowardKim(Array.from(checkedAtBranch), "Kim");
    toast.success(`${checkedAtBranch.size} cloth${checkedAtBranch.size !== 1 ? "s" : ""} sent back to Kim — now ready for the Laundry screen`);
    setCheckedAtBranch(new Set());
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Undo2 className="w-5 h-5 text-blue-600" /> Cloth Return Journey
        </h1>
        <p className="text-sm text-gray-500">Real, dirty cloths returning: Supervisor → Branch → Kim. A cloth only appears on the Laundry screen once it's genuinely back at Kim.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Supervisor → Branch</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
            <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
            <SelectContent>
              {supervisors.map((s: any) => <SelectItem key={s.employeeId || s.id} value={s.employeeId || s.id}>{s.fullName || `${s.firstName} ${s.lastName}`}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {!selectedSupervisorId ? (
            <p className="text-sm text-gray-400">Select a supervisor to see their real dirty cloths.</p>
          ) : dirtyAtSupervisor.length === 0 ? (
            <p className="text-sm text-gray-400">No dirty cloths currently with this supervisor.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {dirtyAtSupervisor.map((c) => (
                <label key={c.id} className={`flex items-center gap-2 border rounded-lg p-2 cursor-pointer ${checkedAtSupervisor.has(c.id) ? "border-blue-500 bg-blue-50" : ""}`}>
                  <input type="checkbox" checked={checkedAtSupervisor.has(c.id)} onChange={() => toggleSupervisor(c.id)} />
                  <span className="text-sm">{c.shortId} {c.color && `· ${c.color}`}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{c.washCount}/90</Badge>
                </label>
              ))}
            </div>
          )}
          <Button onClick={handleReturnToBranch} disabled={checkedAtSupervisor.size === 0} className="w-full">
            Send {checkedAtSupervisor.size > 0 ? checkedAtSupervisor.size : ""} back to Branch
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Branch → Kim</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dirtyAtBranch.length === 0 ? (
            <p className="text-sm text-gray-400">No dirty cloths currently at this branch.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {dirtyAtBranch.map((c) => (
                <label key={c.id} className={`flex items-center gap-2 border rounded-lg p-2 cursor-pointer ${checkedAtBranch.has(c.id) ? "border-blue-500 bg-blue-50" : ""}`}>
                  <input type="checkbox" checked={checkedAtBranch.has(c.id)} onChange={() => toggleBranch(c.id)} />
                  <span className="text-sm">{c.shortId} {c.color && `· ${c.color}`}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{c.washCount}/90</Badge>
                </label>
              ))}
            </div>
          )}
          <Button onClick={handleReturnToKim} disabled={checkedAtBranch.size === 0} className="w-full">
            Send {checkedAtBranch.size > 0 ? checkedAtBranch.size : ""} back to Kim
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClothReturnJourney;
