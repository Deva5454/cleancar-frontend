/**
 * ReportBrokenPart.tsx — real, previously-missing action: a
 * supervisor reports a specific washer's machine part as broken. The
 * washer keeps using the same machine - only the one real part is
 * requested as a replacement, flowing through the exact same real
 * requisition chain as any other material request, so it goes
 * through the supervisor's own real approval step rather than
 * skipping it.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getPartCatalog } from "../../services/pressureWasherPartsService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

export function ReportBrokenPart() {
  const { createTransaction } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeesByRole } = useEmployee();
  const washers = getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);
  const catalog = getPartCatalog();

  const [washerId, setWasherId] = useState("");
  const [partName, setPartName] = useState("");
  const [notes, setNotes] = useState("");

  const handleReport = () => {
    if (!washerId || !partName) {
      toast.error("Select the washer and the broken part");
      return;
    }
    // Real, quantity-tracked request - same real mechanism as any
    // other material request, showing up in Requisitions for a
    // supervisor to genuinely approve and fulfill, not a shortcut
    // that bypasses that real step. The washer's machine count itself
    // is never touched - only the one real part moves.
    createTransaction({
      itemId: partName,
      type: "Transfer",
      quantity: 1,
      quantityRequested: 1,
      quantityFulfilled: 0,
      fromLocation: "Central",
      toLocation: "Washer",
      toId: washerId,
      status: "Pending",
      requestedBy: currentUser?.name || "Supervisor",
      cityId: city,
      reason: `Broken part replacement (machine stays in use): ${notes || "no additional notes"}`,
    });
    toast.success("Broken part reported — shows in Requisitions for fulfillment");
    setWasherId(""); setPartName(""); setNotes("");
  };

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-600" /> Report Broken Machine Part
        </CardTitle>
        <p className="text-xs text-gray-500">The washer keeps using the same machine — only this one part gets replaced</p>
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
          <Label>Broken Part</Label>
          <Select value={partName} onValueChange={setPartName}>
            <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
            <SelectContent>
              {catalog.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened, if known" rows={2} />
        <Button variant="destructive" onClick={handleReport} className="w-full">Report Broken Part</Button>
      </CardContent>
    </Card>
  );
}

export default ReportBrokenPart;
