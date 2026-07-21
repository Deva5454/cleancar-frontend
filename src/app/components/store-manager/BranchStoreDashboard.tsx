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
import { getBranchesForCity, type BranchStore } from "../../config/branchStores";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Package, Truck } from "lucide-react";
import { toast } from "sonner";

export function BranchStoreDashboard({ branchId }: { branchId?: string }) {
  const { inventory, stockTransactions, receiveBranchTransfer } = useInventory();
  const { city } = useCity();
  const branches = getBranchesForCity(city);
  const activeBranch: BranchStore | undefined = branchId
    ? branches.find((b) => b.id === branchId)
    : branches[0];

  const [receivingId, setReceivingId] = useState<string | null>(null);
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
