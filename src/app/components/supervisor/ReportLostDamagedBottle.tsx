/**
 * ReportLostDamagedBottle.tsx — the real, previously-missing action:
 * a supervisor reports a specific washer's bottle as genuinely lost or
 * damaged. Removes it from that washer's real stock and creates a
 * real Loss record with the washer and reason attached, visible
 * directly in the real Loss & Wastage Register.
 */

import { useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getDilutionRecipes } from "../../services/dilutionRecipeService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ReportLostDamagedBottle() {
  const { inventory, reportLostOrDamagedBottle } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeesByRole } = useEmployee();
  const washers = getEmployeesByRole(["Car Washer Full Time", "Car Washer Part Time"]);
  const recipes = getDilutionRecipes(city).filter((r) => r.isActive);

  const [washerId, setWasherId] = useState("");
  const [bottledItemId, setBottledItemId] = useState("");
  const [reason, setReason] = useState<"Lost" | "Damaged">("Lost");
  const [notes, setNotes] = useState("");

  const handleReport = () => {
    if (!washerId || !bottledItemId) {
      toast.error("Select the washer and the product");
      return;
    }
    const ok = reportLostOrDamagedBottle(washerId, bottledItemId, reason, notes || undefined, currentUser?.name || "Supervisor", city);
    if (ok) {
      toast.success("Reported — this now shows in the real Loss & Wastage Register");
      setWasherId(""); setBottledItemId(""); setReason("Lost"); setNotes("");
    } else {
      toast.error("Could not report this — that washer may not actually have a bottle of this product");
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" /> Report Lost / Damaged Bottle
        </CardTitle>
        <p className="text-xs text-gray-500">A bottle that will never be returned — this removes it from the washer's real stock and records a genuine loss</p>
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
          <Label>Product</Label>
          <Select value={bottledItemId} onValueChange={setBottledItemId}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {recipes.map((r) => {
                const item = inventory.find((i: any) => i.itemId === r.bottledItemId);
                return <SelectItem key={r.recipeId} value={r.bottledItemId}>{item?.itemName || r.productName}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Reason</Label>
          <div className="flex gap-2">
            <Button variant={reason === "Lost" ? "default" : "outline"} size="sm" onClick={() => setReason("Lost")}>Lost</Button>
            <Button variant={reason === "Damaged" ? "default" : "outline"} size="sm" onClick={() => setReason("Damaged")}>Damaged</Button>
          </div>
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened, if known" rows={2} />
        </div>
        <Button variant="destructive" onClick={handleReport} className="w-full">Report {reason}</Button>
      </CardContent>
    </Card>
  );
}

export default ReportLostDamagedBottle;
