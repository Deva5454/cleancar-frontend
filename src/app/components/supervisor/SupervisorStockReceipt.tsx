import { useMemo, useState } from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { getBranchesForCity } from "../../config/branchStores";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Truck, Package } from "lucide-react";
import { toast } from "sonner";

/**
 * SupervisorStockReceipt — the real receiving half of the Branch →
 * Supervisor transfer. A branch manager sends stock with a real
 * challan; this is where the supervisor confirms what actually
 * arrived, with any real shortfall recorded honestly rather than
 * assumed away.
 */
export function SupervisorStockReceipt() {
  const { inventory, stockTransactions, receiveSupervisorTransfer } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const branches = getBranchesForCity(city);

  const supervisorId = currentUser?.employeeId || "";

  const pendingReceipts = useMemo(
    () => stockTransactions.filter((t: any) =>
      t.fromLocation === "Branch" && t.toLocation === "Supervisor" && t.toId === supervisorId && t.status === "Pending" && t.cityId === city
    ),
    [stockTransactions, supervisorId, city]
  );

  const pastReceipts = useMemo(
    () => stockTransactions
      .filter((t: any) => t.fromLocation === "Branch" && t.toLocation === "Supervisor" && t.toId === supervisorId && t.status === "Completed" && t.cityId === city)
      .sort((a: any, b: any) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
      .slice(0, 10),
    [stockTransactions, supervisorId, city]
  );

  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [qtyReceived, setQtyReceived] = useState("");
  const [qtyDamaged, setQtyDamaged] = useState("0");
  const [damageNotes, setDamageNotes] = useState("");

  const branchName = (branchId?: string) => branches.find((b) => b.id === branchId)?.name || branchId;

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
    receiveSupervisorTransfer(receivingId, received, damaged, damageNotes || undefined, city);
    toast.success("Receipt confirmed — your stock is updated");
    setReceivingId(null);
  };

  if (!supervisorId) {
    return <div className="p-4 text-sm text-gray-500">Could not identify your employee record.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Stock From Branch
        </h2>
        <p className="text-sm text-gray-500">Real transfers sent to you from a branch store</p>
      </div>

      {pendingReceipts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" /> Awaiting Your Confirmation ({pendingReceipts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingReceipts.map((t: any) => {
              const item = inventory.find((i: any) => i.itemId === t.itemId);
              return (
                <div key={t.transactionId} className="bg-white rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item?.itemName || t.itemId}</p>
                      <p className="text-xs text-gray-500">From {branchName(t.fromId)} · Challan {t.challanNumber} · Sent: {t.quantitySent}</p>
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
                    <span>{item?.itemName || t.itemId} — from {branchName(t.fromId)}, Challan {t.challanNumber}</span>
                    <span>
                      Received {t.quantityReceived}
                      {(t.damagedQuantity ?? 0) > 0 && <span className="text-red-600 ml-1">({t.damagedQuantity} damaged)</span>}
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

export default SupervisorStockReceipt;
