/**
 * TrackedInventoryScanMovement.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, scan-based handover for any tracked item (bottles, brushes,
 * pressure washer parts) - the core requirement: every change of hands
 * requires a real camera scan of the barcode, so the system always
 * knows exactly where an item moved from and to. Reuses BarcodeScanner
 * exactly as already proven for cloths.
 */
import { useEffect, useState } from "react";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useRole } from "../../contexts/RoleContext";
import { getBranchesForCity } from "../../config/branchStores";
import { BarcodeScanner } from "../cloth-tracking/BarcodeScanner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowRight, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { trackedInventoryService } from "../../services/trackedInventoryService";
import type { TrackedUnitLocation } from "../../types/trackedInventory";

export function TrackedInventoryScanMovement() {
  const { city } = useCity();
  trackedInventoryService.setCityId(city);
  const { currentUser } = useRole();
  const { getEmployeesByRole } = useEmployee();
  const branches = getBranchesForCity(city);
  const supervisors = getEmployeesByRole("Supervisor");
  const washers = getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);

  const [toLocation, setToLocation] = useState<TrackedUnitLocation>("Branch");
  const [toLocationId, setToLocationId] = useState("");
  const [recentScans, setRecentScans] = useState<{ id: string; from: string; to: string; time: string }[]>([]);

  useEffect(() => {
    setToLocationId("");
  }, [toLocation, city]);

  const handleScan = (barcode: string) => {
    if ((toLocation === "Branch" || toLocation === "Supervisor" || toLocation === "Washer") && !toLocationId) {
      toast.error(`Select which ${toLocation.toLowerCase()} this is going to before scanning.`);
      return;
    }
    const result = trackedInventoryService.scanMovement(
      barcode,
      toLocation,
      toLocationId || undefined,
      currentUser?.employeeId || "unknown",
      currentUser?.name || "Unknown",
    );
    if (!result.success) {
      toast.error(result.error?.message || "Scan failed.");
      return;
    }
    toast.success(`${result.unit!.shortId} moved to ${toLocation}.`);
    setRecentScans(prev => [
      { id: result.unit!.id, from: result.unit!.currentLocation, to: toLocation, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-blue-600" /> Scan to Move
        </h1>
        <p className="text-sm text-gray-500">Every real handover — Kim, Branch, Supervisor, Washer, and back — is confirmed by scanning the item's real barcode.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Where is this going?</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {(["Kim", "Branch", "Supervisor", "Washer"] as TrackedUnitLocation[]).map(loc => (
              <button
                key={loc}
                onClick={() => setToLocation(loc)}
                className={`border rounded-lg p-2 text-sm font-medium ${toLocation === loc ? "border-blue-500 bg-blue-50 text-blue-700" : "text-gray-600"}`}
              >
                {loc}
              </button>
            ))}
          </div>

          {toLocation === "Branch" && (
            <select className="border rounded-lg px-2 py-1.5 text-sm w-full" value={toLocationId} onChange={e => setToLocationId(e.target.value)}>
              <option value="">Select branch...</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {toLocation === "Supervisor" && (
            <select className="border rounded-lg px-2 py-1.5 text-sm w-full" value={toLocationId} onChange={e => setToLocationId(e.target.value)}>
              <option value="">Select supervisor...</option>
              {supervisors.map((s: any) => <option key={s.employeeId || s.id} value={s.employeeId || s.id}>{s.fullName || `${s.firstName} ${s.lastName}`}</option>)}
            </select>
          )}
          {toLocation === "Washer" && (
            <select className="border rounded-lg px-2 py-1.5 text-sm w-full" value={toLocationId} onChange={e => setToLocationId(e.target.value)}>
              <option value="">Select washer...</option>
              {washers.map((w: any) => <option key={w.employeeId || w.id} value={w.employeeId || w.id}>{w.fullName || `${w.firstName} ${w.lastName}`}</option>)}
            </select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Scan Barcode</CardTitle></CardHeader>
        <CardContent>
          <BarcodeScanner onScan={handleScan} placeholder="Scan item barcode" />
        </CardContent>
      </Card>

      {recentScans.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Scans</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentScans.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <span className="font-mono text-xs">{s.id.slice(-8)}</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Badge variant="outline" className="text-xs">{s.from}</Badge>
                  <ArrowRight className="w-3 h-3" />
                  <Badge variant="outline" className="text-xs">{s.to}</Badge>
                </span>
                <span className="text-xs text-gray-400">{s.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TrackedInventoryScanMovement;
