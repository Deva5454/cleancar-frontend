/**
 * BranchTransferOut — /store-manager/branch-transfer
 *
 * Real Main Store → Branch Store material transfer. No vendor involved
 * here by design - this only ever moves stock the main store already
 * has. A real challan number is required, since that's the only record
 * of the movement without a vendor invoice or GRN behind it.
 */

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getBranchesForCity } from "../../config/branchStores";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Truck } from "lucide-react";
import { toast } from "sonner";

export function BranchTransferOut() {
  const { inventory, stockTransactions, transferToBranch } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeeById } = useEmployee();
  const branches = getBranchesForCity(city);

  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || "");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [challanNumber, setChallanNumber] = useState("");

  // Real access gate: a branch-assigned manager only ever receives
  // transfers, never sends them - the main store manager (no
  // assignedBranchId) is the only one who genuinely belongs here. This
  // check runs after every hook above, so React's hooks rules are never
  // violated regardless of which real user lands on this page.
  const assignedEmployee = currentUser?.employeeId ? getEmployeeById(currentUser.employeeId) : undefined;
  if (assignedEmployee?.assignedBranchId) {
    return <Navigate to="/store-manager/branch-store" replace />;
  }

  const centralItems = inventory.filter((i: any) => i.cityId === city && (i.centralStock || 0) > 0);
  const recentTransfers = stockTransactions
    .filter((t: any) => t.toLocation === "Branch" && t.cityId === city)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15);

  const handleTransfer = () => {
    if (!selectedBranch || !selectedItem || !quantity || !challanNumber.trim()) {
      toast.error("Select a branch, item, quantity, and enter a real challan number");
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    const result = transferToBranch(selectedItem, qty, selectedBranch, challanNumber, currentUser?.name || "Store Manager", city);
    if (!result) {
      toast.error("Could not create transfer — check that central stock is sufficient");
      return;
    }
    toast.success(`Transfer ${challanNumber} requested — awaiting City Manager approval`);
    setSelectedItem(""); setQuantity(""); setChallanNumber("");
  };

  const branchName = (branchId?: string) => branches.find((b) => b.id === branchId)?.name || branchId;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" /> Send to Branch Store
        </h1>
        <p className="text-sm text-gray-500">Real material transfer from the main store — no vendor involved</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New Transfer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Branch Store</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {centralItems.map((i: any) => (
                    <SelectItem key={i.itemId} value={i.itemId}>{i.itemName} (available: {i.centralStock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Challan Number *</Label>
              <Input value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} placeholder="CHL-2026-001" />
            </div>
          </div>
          <Button onClick={handleTransfer}>Send Transfer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Transfers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challan</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransfers.map((t: any) => {
                const item = inventory.find((i: any) => i.itemId === t.itemId);
                return (
                  <TableRow key={t.transactionId}>
                    <TableCell className="font-medium">{t.challanNumber}</TableCell>
                    <TableCell>{branchName(t.toId)}</TableCell>
                    <TableCell>{item?.itemName || t.itemId}</TableCell>
                    <TableCell>{t.quantitySent ?? t.quantity}</TableCell>
                    <TableCell>{t.quantityReceived ?? "—"}{(t.damagedQuantity ?? 0) > 0 && <span className="text-red-600 text-xs ml-1">({t.damagedQuantity} damaged)</span>}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "Completed" ? "default" : "secondary"}>{t.status === "Pending" ? "Awaiting CM Approval" : t.status === "Approved" ? "In Transit" : t.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default BranchTransferOut;
