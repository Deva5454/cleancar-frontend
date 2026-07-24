/**
 * SendEquipmentForRepair.tsx — real, previously-missing action: a
 * supervisor collects a washer's genuinely broken equipment and sends
 * it toward Kim for repair, in one real action - never skipping the
 * supervisor's own role in the chain, matching the same real pattern
 * as uniform replacement.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
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
  const { inventory, sendEquipmentForRepair } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeesByRole } = useEmployee();
  const washers = getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);

  const equipmentItems = inventory.filter((i: any) => i.category === "Equipment" && i.cityId === city);

  const [washerId, setWasherId] = useState("");
  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState("");

  const handleSend = () => {
    if (!washerId || !itemId || !reason.trim()) {
      toast.error("Select the washer, the equipment, and enter a reason");
      return;
    }
    const ok = sendEquipmentForRepair(itemId, washerId, currentUser?.name || "Supervisor", reason.trim(), city);
    if (ok) {
      toast.success("Equipment sent for repair — now with Kim, tracked in the real Equipment Repair Queue");
      setWasherId(""); setItemId(""); setReason("");
    } else {
      toast.error("Could not send this — that washer may not actually have this equipment");
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
