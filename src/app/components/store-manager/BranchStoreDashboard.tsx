/**
 * BranchStoreDashboard — /store-manager/branch-store
 *
 * Real, restricted view for a branch store manager - shows only that
 * branch's stock and transfers, never the main store's. Confirming
 * receipt is a real, separate step from the transfer being sent - stock
 * only actually lands in the branch once received here, with any real
 * damage honestly recorded rather than silently absorbed into the
 * count.
 */

import { useState, useMemo } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { getBranchesForCity, type BranchStore } from "../../config/branchStores";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Package, Truck } from "lucide-react";
import { EmptyBottleReturnPanel } from "../shared/EmptyBottleReturnPanel";
import { toast } from "sonner";

export function BranchStoreDashboard({ branchId }: { branchId?: string }) {
  const { inventory, stockTransactions, receiveBranchTransfer, transferBranchToSupervisor } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const { getEmployeeById, getEmployeesByRole } = useEmployee();
  const branches = getBranchesForCity(city);

  // Real branch resolution: an explicit prop wins (for any future
  // multi-branch admin view); otherwise, use the real logged-in
  // employee's assignedBranchId - a genuine restriction, not a picker.
  // Falls back to the first real branch only if the current user has no
  // real branch assignment at all (e.g. an Admin previewing this screen).
  const assignedEmployee = currentUser?.employeeId ? getEmployeeById(currentUser.employeeId) : undefined;
  const resolvedBranchId = branchId || assignedEmployee?.assignedBranchId;
  const activeBranch: BranchStore | undefined = resolvedBranchId
    ? branches.find((b) => b.id === resolvedBranchId)
    : branches[0];

  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [sendItemId, setSendItemId] = useState("");
  const [sendSupervisorId, setSendSupervisorId] = useState("");
  const [sendQty, setSendQty] = useState("");
  const [sendChallan, setSendChallan] = useState("");

  const supervisors = getEmployeesByRole("Supervisor");

  const branchStockItemsForSend = useMemo(
    () => activeBranch ? inventory.filter((i: any) => i.cityId === city && ((i.branchStock?.[activeBranch.id]) || 0) > 0) : [],
    [inventory, city, activeBranch]
  );

  const handleSendToSupervisor = () => {
    if (!activeBranch || !sendItemId || !sendSupervisorId || !sendQty || !sendChallan.trim()) {
      toast.error("Select an item, supervisor, quantity, and enter a real challan number");
      return;
    }
    const qty = parseInt(sendQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    const result = transferBranchToSupervisor(sendItemId, qty, activeBranch.id, sendSupervisorId, sendChallan, currentUser?.name || "Branch Manager", city);
    if (!result) {
      toast.error("Could not create transfer — check that branch stock is sufficient");
      return;
    }
    toast.success(`Sent to supervisor — challan ${sendChallan}, awaiting their confirmation`);
    setSendItemId(""); setSendSupervisorId(""); setSendQty(""); setSendChallan("");
  };

  const [qtyReceived, setQtyReceived] = useState("");
  const [qtyDamaged, setQtyDamaged] = useState("0");
  const [damageNotes, setDamageNotes] = useState("");

  const branchStockItems = useMemo(
    () => activeBranch ? inventory.filter((i: any) => i.cityId === city && ((i.branchStock?.[activeBranch.id]) || 0) > 0) : [],
    [inventory, city, activeBranch]
  );

  const pendingReceipts = useMemo(
    () => activeBranch
      ? stockTransactions.filter((t: any) => t.toLocation === "Branch" && t.toId === activeBranch.id && t.status === "Approved" && t.cityId === city)
      : [],
    [stockTransactions, city, activeBranch]
  );

  const pastReceipts = useMemo(
    () => activeBranch
      ? stockTransactions.filter((t: any) => t.toLocation === "Branch" && t.toId === activeBranch.id && t.status === "Completed" && t.cityId === city)
        .sort((a: any, b: any) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
        .slice(0, 10)
      : [],
    [stockTransactions, city, activeBranch]
  );

  const openReceive = (transactionId: string, sentQty: number) => {
    setReceivingId(transactionId);
    setQtyReceived(String(sentQty));
    setQtyDamaged("0");
    setDamageNotes("");
  };

  const confirmReceive = () => {
    if (!receivingId) return;
    const received = parseInt(qtyReceived, 10) || 0;
    const damaged = parseInt(qtyDamaged, 10) || 0;
    receiveBranchTransfer(receivingId, received, damaged, damageNotes || undefined, city);
    toast.success("Receipt confirmed — branch stock updated");
    setReceivingId(null);
  };

  if (!activeBranch) {
    return <div className="p-4 text-sm text-gray-500">No branch store is configured for this city.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> {activeBranch.name}
        </h1>
        <p className="text-sm text-gray-500">Real stock and transfers for this branch only</p>
      </div>

      {pendingReceipts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" /> Awaiting Receipt ({pendingReceipts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingReceipts.map((t: any) => {
              const item = inventory.find((i: any) => i.itemId === t.itemId);
              return (
                <div key={t.transactionId} className="bg-white rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item?.itemName || t.itemId}</p>
                      <p className="text-xs text-gray-500">Challan {t.challanNumber} · Sent: {t.quantitySent}</p>
                    </div>
                    {receivingId !== t.transactionId && (
                      <Button size="sm" onClick={() => openReceive(t.transactionId, t.quantitySent || t.quantity)}>Confirm Receipt</Button>
                    )}
                  </div>
                  {receivingId === t.transactionId && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                      <div>
                        <Label className="text-xs">Quantity Received</Label>
                        <Input type="number" value={qtyReceived} onChange={(e) => setQtyReceived(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Damaged (if any)</Label>
                        <Input type="number" value={qtyDamaged} onChange={(e) => setQtyDamaged(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Damage Notes (if any)</Label>
                        <Input value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} placeholder="What happened, if relevant" />
                      </div>
                      <div className="col-span-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setReceivingId(null)}>Cancel</Button>
                        <Button size="sm" onClick={confirmReceive}>Confirm</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {activeBranch && (
        <EmptyBottleReturnPanel currentLocation="Branch" currentId={activeBranch.id} requestedBy={currentUser?.name || "Branch Manager"} />
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Branch Stock</CardTitle></CardHeader>
        <CardContent>
          {branchStockItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No stock at this branch yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Item</TableHead><TableHead>Quantity</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {branchStockItems.map((i: any) => (
                  <TableRow key={i.itemId}>
                    <TableCell>{i.itemName}</TableCell>
                    <TableCell className="font-medium">{i.branchStock?.[activeBranch.id]} {i.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Send to Supervisor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {branchStockItemsForSend.length === 0 ? (
            <p className="text-sm text-gray-400">No branch stock available to send.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Item</Label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={sendItemId} onChange={(e) => setSendItemId(e.target.value)}>
                    <option value="">Select item</option>
                    {branchStockItemsForSend.map((i: any) => (
                      <option key={i.itemId} value={i.itemId}>{i.itemName} (available: {i.branchStock?.[activeBranch.id]})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Supervisor</Label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={sendSupervisorId} onChange={(e) => setSendSupervisorId(e.target.value)}>
                    <option value="">Select supervisor</option>
                    {supervisors.map((s: any) => (
                      <option key={s.employeeId || s.id} value={s.employeeId || s.id}>{s.fullName || `${s.firstName} ${s.lastName}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" value={sendQty} onChange={(e) => setSendQty(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Challan Number *</Label>
                  <Input value={sendChallan} onChange={(e) => setSendChallan(e.target.value)} placeholder="CHL-2026-001" />
                </div>
              </div>
              <Button onClick={handleSendToSupervisor} className="w-full">Send to Supervisor</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Receipt History</CardTitle></CardHeader>
        <CardContent>
          {pastReceipts.length === 0 ? (
            <p className="text-sm text-gray-400">No past receipts yet.</p>
          ) : (
            <div className="space-y-2">
              {pastReceipts.map((t: any) => {
                const item = inventory.find((i: any) => i.itemId === t.itemId);
                return (
                  <div key={t.transactionId} className="flex items-center justify-between text-sm border-b pb-2">
                    <span>{item?.itemName || t.itemId} — Challan {t.challanNumber}</span>
                    <span>
                      Received {t.quantityReceived}
                      {(t.damagedQuantity ?? 0) > 0 && <Badge variant="destructive" className="ml-2">{t.damagedQuantity} damaged</Badge>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BranchStoreDashboard;
