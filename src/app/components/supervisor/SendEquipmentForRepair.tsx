/**
 * SendEquipmentForRepair.tsx — real, corrected equipment-repair action:
 * a supervisor collects a washer's genuinely broken equipment and it
 * travels Washer -> Supervisor -> Branch Store -> Central ("Kim") for
 * repair — never straight to Central, since the branch store (real
 * stock in the City Manager's custody) is the only real stock-holding
 * point between the field and Central. The supervisor is purely the
 * courier here, never a stock-holding location themselves, matching
 * the same real pattern already used for uniform replacement.
 *
 * If the branch already holds a spare unit of the same equipment, it's
 * issued straight back to the washer in this same action — the real,
 * previously-missing answer to "what does the washer use meanwhile".
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getBranchesForCity } from "../../config/branchStores";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Hammer } from "lucide-react";
import { toast } from "sonner";

export function SendEquipmentForRepair() {
  const { inventory, reportBrokenEquipment } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeesByRole } = useEmployee();
  const washers = getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);
  // Only one real branch store exists per city today (see
  // branchStores.ts) — same real shortcut UniformEntitlement.tsx
  // already uses, rather than adding a picker for a choice that
  // doesn't yet exist.
  const branch = getBranchesForCity(city)[0];

  const equipmentItems = inventory.filter((i: any) => i.category === "Equipment" && i.cityId === city);

  const [washerId, setWasherId] = useState("");
  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState("");

  const handleSend = () => {
    if (!washerId || !itemId || !reason.trim()) {
      toast.error("Select the washer, the equipment, and enter a reason");
      return;
    }
    if (!branch) {
      toast.error("No real branch store found for this city");
      return;
    }
    const result = reportBrokenEquipment(itemId, "Washer", washerId, branch.id, currentUser?.name || "Supervisor", reason.trim(), city);
    if (result.success) {
      if (result.spareIssued) {
        toast.success("Broken unit sent toward Kim via the Branch Store — a spare was issued from real Branch stock, so the washer isn't left without equipment");
      } else {
        toast.success("Broken unit sent toward Kim via the Branch Store — no spare was on hand at the branch, so the washer will be short this equipment until repair completes or a spare arrives");
      }
      setWasherId(""); setItemId(""); setReason("");
    } else {
      toast.error(result.error || "Could not send this — that washer may not actually have this equipment");
    }
  };

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Hammer className="w-4 h-4 text-amber-600" /> Send Equipment for Repair
        </CardTitle>
        <p className="text-xs text-gray-500">Real, broken equipment travels back to Kim to be repaired and returned — not a like-for-like swap</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Washer</Label>
          <Select value={washerId} onValueChange={setWasherId}>
            <SelectTrigger><SelectValue placeholder="Select washer" /></SelectTrigger>
            <SelectContent>
              {washers.map((w: any) => <SelectItem key={w.employeeId || w.id} value={w.employeeId || w.id}>{w.fullName || `${w.firstName} ${w.lastName}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Equipment</Label>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
            <SelectContent>
              {equipmentItems.map((i: any) => <SelectItem key={i.itemId} value={i.itemId}>{i.itemName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong with it" rows={2} />
        <Button variant="destructive" onClick={handleSend} className="w-full">Send for Repair</Button>
      </CardContent>
    </Card>
  );
}

export default SendEquipmentForRepair;
