/**
 * PressureWasherUnits.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Real pressure washer unit management - register a new unit's parts
 * (e.g. AA1 -> AA1-1 through AA1-4), view a unit's current, real slot
 * assignments (including any part now serving that originally belonged
 * to a different unit), and perform a real repair swap: scan the broken
 * part out (it keeps being tracked, per the confirmed requirement),
 * scan its replacement in (which keeps its own permanent identity).
 */
import { useEffect, useState } from "react";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { BarcodeScanner } from "../cloth-tracking/BarcodeScanner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Wrench, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { trackedInventoryService } from "../../services/trackedInventoryService";
import type { PressureWasherUnit, TrackedItemType, TrackedUnit } from "../../types/trackedInventory";

export function PressureWasherUnits() {
  const { city } = useCity();
  trackedInventoryService.setCityId(city);
  const { currentUser } = useRole();

  const [partTypes, setPartTypes] = useState<TrackedItemType[]>([]);
  const [units, setUnits] = useState<PressureWasherUnit[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  // Registration form
  const [showRegister, setShowRegister] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState("");
  const [newPartTypeId, setNewPartTypeId] = useState("");
  const [newSlotCount, setNewSlotCount] = useState(4);

  // Detail / swap
  const [selectedUnitCode, setSelectedUnitCode] = useState<string | null>(null);
  const [swapSlot, setSwapSlot] = useState<number | null>(null);
  const [scrappingSlot, setScrappingSlot] = useState<number | null>(null);
  const [scrapReason, setScrapReason] = useState("");

  useEffect(() => {
    const types = trackedInventoryService.getActiveItemTypes().filter(t => t.isComposite);
    setPartTypes(types);
    if (types.length > 0 && !newPartTypeId) setNewPartTypeId(types[0].id);
    setUnits(trackedInventoryService.getPressureWasherUnits());
  }, [city, refreshTick]);

  const handleRegister = () => {
    if (!newUnitCode || !newPartTypeId || newSlotCount < 1) {
      toast.error("Enter a real unit code, part type, and slot count.");
      return;
    }
    if (trackedInventoryService.getPressureWasherUnit(newUnitCode)) {
      toast.error(`Unit ${newUnitCode} already exists.`);
      return;
    }
    trackedInventoryService.createPressureWasherUnit(newUnitCode, newPartTypeId, newSlotCount);
    toast.success(`Unit ${newUnitCode} registered with ${newSlotCount} real, barcoded parts.`);
    setShowRegister(false);
    setNewUnitCode("");
    setRefreshTick(t => t + 1);
  };

  const selectedUnit = selectedUnitCode ? trackedInventoryService.getPressureWasherUnit(selectedUnitCode) : null;

  const handleSwapScan = (barcode: string) => {
    if (!selectedUnitCode || swapSlot === null) return;
    const result = trackedInventoryService.swapPart(
      selectedUnitCode, swapSlot, barcode,
      currentUser?.employeeId || "unknown", currentUser?.name || "Unknown"
    );
    if (!result.success) {
      toast.error(result.error || "Swap failed.");
      return;
    }
    toast.success(`Slot ${swapSlot} of ${selectedUnitCode} now served by ${barcode}. Old part moved to repair, still tracked.`);
    setSwapSlot(null);
    setRefreshTick(t => t + 1);
  };

  const handleScrapPart = (partId: string) => {
    if (!scrapReason.trim()) {
      toast.error("Enter a real reason before scrapping — beyond repair, unusable, lost, etc.");
      return;
    }
    const result = trackedInventoryService.scrapUnit(
      partId, scrapReason.trim(),
      currentUser?.employeeId || "unknown", currentUser?.name || "Unknown"
    );
    if (!result.success) {
      toast.error(result.error || "Scrap failed.");
      return;
    }
    toast.success(`${partId} scrapped — permanently removed from circulation. The slot is now open for a replacement.`);
    setScrappingSlot(null);
    setScrapReason("");
    setRefreshTick(t => t + 1);
  };

  const getPartDetail = (partId: string): TrackedUnit | undefined => trackedInventoryService.getUnitById(partId);

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" /> Pressure Washer Units
          </h1>
          <p className="text-sm text-gray-500">Real units, real parts, real repair history — every swap keeps both the old and new part's identity.</p>
        </div>
        <Button onClick={() => setShowRegister(!showRegister)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Register Unit
        </Button>
      </div>

      {showRegister && (
        <Card>
          <CardHeader><CardTitle className="text-base">Register New Unit</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Unit Code</label>
                <Input value={newUnitCode} onChange={e => setNewUnitCode(e.target.value.toUpperCase())} placeholder="e.g. AA1" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Part Type</label>
                <select className="border rounded-lg px-2 py-1.5 text-sm w-full" value={newPartTypeId} onChange={e => setNewPartTypeId(e.target.value)}>
                  {partTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  {partTypes.length === 0 && <option value="">No composite part type configured yet</option>}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1"># of Parts</label>
                <Input type="number" min={1} value={newSlotCount} onChange={e => setNewSlotCount(Number(e.target.value))} />
              </div>
            </div>
            {partTypes.length === 0 && (
              <p className="text-xs text-amber-700">
                No item type is marked "Composite unit" yet — add one in Tracked Item Types (Super Admin) first, with category "Pressure Washer Part".
              </p>
            )}
            {newUnitCode && (
              <p className="text-xs text-gray-500">
                Will create: {Array.from({ length: newSlotCount }, (_, i) => `${newUnitCode}-${i + 1}`).join(", ")}
              </p>
            )}
            <Button onClick={handleRegister} disabled={partTypes.length === 0}>Register</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">All Units</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {units.map(u => (
              <button
                key={u.unitCode}
                onClick={() => setSelectedUnitCode(u.unitCode)}
                className={`border rounded-lg p-3 text-left ${selectedUnitCode === u.unitCode ? "border-blue-500 bg-blue-50" : ""}`}
              >
                <p className="font-semibold text-sm">{u.unitCode}</p>
                <p className="text-xs text-gray-500">{Object.keys(u.slots).length}/{u.slotCount} parts</p>
              </button>
            ))}
            {units.length === 0 && <p className="text-sm text-gray-400 col-span-4">No units registered yet.</p>}
          </div>
        </CardContent>
      </Card>

      {selectedUnit && (
        <Card>
          <CardHeader><CardTitle className="text-base">{selectedUnit.unitCode} — Current Parts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: selectedUnit.slotCount }, (_, i) => i + 1).map(slot => {
              const partId = selectedUnit.slots[slot];
              if (!partId) {
                return (
                  <div key={slot} className="border border-dashed rounded-lg p-2 flex items-center justify-between">
                    <p className="text-sm text-gray-400">Slot {slot}: Empty — needs a replacement part</p>
                    <Button size="sm" variant="outline" onClick={() => setSwapSlot(slot)}>Fill Slot</Button>
                  </div>
                );
              }
              const part = getPartDetail(partId);
              const isForeign = part?.originalUnitCode && part.originalUnitCode !== selectedUnit.unitCode;
              return (
                <div key={slot} className="border rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Slot {slot}: <span className="font-mono">{partId}</span></p>
                      {isForeign && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Originally from {part!.originalUnitCode} — replaced part
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSwapSlot(Number(slot))}>
                        Mark Damaged / Swap
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setScrappingSlot(Number(slot)); setScrapReason(""); }}>
                        Scrap
                      </Button>
                    </div>
                  </div>
                  {scrappingSlot === Number(slot) && (
                    <div className="mt-2 pt-2 border-t space-y-2">
                      <label className="text-xs text-gray-600 block">Reason (required) — beyond repair, unusable, lost, etc.</label>
                      <Input value={scrapReason} onChange={e => setScrapReason(e.target.value)} placeholder="e.g. Cracked housing, unrepairable" />
                      <p className="text-xs text-red-600">This permanently removes {partId} from circulation and opens this slot for a real replacement.</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleScrapPart(partId)}>Confirm Scrap</Button>
                        <Button size="sm" variant="outline" onClick={() => setScrappingSlot(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {swapSlot !== null && (
              <Card className="mt-3 border-amber-300">
                <CardHeader><CardTitle className="text-sm">Scan Replacement Part for Slot {swapSlot}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-2">
                    The current part in this slot will move to repair and stay tracked. Scan the barcode of the real, physical replacement part now going in.
                  </p>
                  <BarcodeScanner onScan={handleSwapScan} placeholder="Scan replacement part barcode" />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setSwapSlot(null)}>Cancel</Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PressureWasherUnits;
