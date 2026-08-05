/**
 * EquipmentRepairQueue.tsx — real screen at Kim showing every real
 * equipment item currently under repair, with a genuine "Mark
 * Repaired" action that returns it to real, usable central stock.
 *
 * Also shows real Branch -> Central repair dispatches awaiting Kim's
 * receipt confirmation — a unit only actually enters the "Mark
 * Repaired" queue below once genuinely confirmed received here,
 * mirroring the same real, damage/loss-honest confirm-receipt pattern
 * BranchStoreDashboard.tsx already uses for ordinary stock transfers.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Truck, Wrench } from "lucide-react";
import { toast } from "sonner";

export function EquipmentRepairQueue() {
  const { inventory, stockTransactions, markEquipmentRepaired, consumePressureWasherPart, receiveRepairAtCentral } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();
  const [refreshTick, setRefreshTick] = useState(0);

  const pendingRepairReceipts = stockTransactions.filter(
    (t: any) => t.cityId === city && t.type === "Transfer" && t.fromLocation === "Branch" && t.toLocation === "Central" && t.status === "Pending"
  );
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [qtyReceived, setQtyReceived] = useState("");
  const [qtyMissing, setQtyMissing] = useState("0");
  const [receiptNotes, setReceiptNotes] = useState("");

  const openReceive = (transactionId: string, sentQty: number) => {
    setReceivingId(transactionId);
    setQtyReceived(String(sentQty));
    setQtyMissing("0");
    setReceiptNotes("");
  };

  const confirmReceive = () => {
    if (!receivingId) return;
    if (qtyReceived.trim() === "" || isNaN(Number(qtyReceived))) {
      toast.error("Enter the quantity actually received (0 if genuinely nothing arrived)");
      return;
    }
    const received = parseInt(qtyReceived, 10);
    const missing = parseInt(qtyMissing, 10) || 0;
    const transaction = pendingRepairReceipts.find((t: any) => t.transactionId === receivingId);
    const sentQty = transaction?.quantitySent ?? transaction?.quantity ?? 0;
    if (received < 0 || missing < 0) {
      toast.error("Quantity received/missing can't be negative");
      return;
    }
    if (received + missing > sentQty) {
      toast.error(`Received (${received}) + missing (${missing}) can't exceed what was dispatched (${sentQty})`);
      return;
    }
    receiveRepairAtCentral(receivingId, received, missing, receiptNotes || undefined, city);
    toast.success("Receipt confirmed — now in the real Mark Repaired queue below");
    setReceivingId(null);
    setRefreshTick((t) => t + 1);
  };

  const underRepair = inventory.filter((i: any) => i.cityId === city && (i.underRepairStock || 0) > 0);
  // ✅ FIX: previously there was no way to record which real spare part
  // (nozzle, spray gun, hose) a repair actually used — spare-parts
  // stock was completely disconnected from real repairs. Optional here
  // because not every repair uses a part (e.g. a loose fitting just
  // needs tightening), but when one is picked, it's a real deduction.
  const spareParts = inventory.filter((i: any) => i.cityId === city && i.category === "Pressure Washer Parts");
  const [partUsed, setPartUsed] = useState<Record<string, string>>({});
  const [partQty, setPartQty] = useState<Record<string, string>>({});

  const handleMarkRepaired = (itemId: string, qty: number, name: string) => {
    const ok = markEquipmentRepaired(itemId, qty, currentUser?.name || "Store Manager", city);
    if (!ok) {
      toast.error("Could not mark this repaired — real data mismatch, please refresh");
      return;
    }

    const selectedPartId = partUsed[itemId];
    const selectedQtyRaw = partQty[itemId];
    if (selectedPartId && selectedQtyRaw) {
      const selectedQty = parseInt(selectedQtyRaw, 10);
      if (selectedQty > 0) {
        const partOk = consumePressureWasherPart(selectedPartId, selectedQty, currentUser?.name || "Store Manager", city);
        const partName = spareParts.find((p: any) => p.itemId === selectedPartId)?.itemName || "part";
        if (partOk) {
          toast.success(`${name} marked repaired — ${selectedQty} ${partName} deducted from real spare stock`);
        } else {
          toast.error(`${name} marked repaired, but couldn't deduct ${partName} — check real spare stock and adjust manually if needed`);
        }
        setPartUsed((prev) => ({ ...prev, [itemId]: "" }));
        setPartQty((prev) => ({ ...prev, [itemId]: "" }));
        setRefreshTick((t) => t + 1);
        return;
      }
    }

    toast.success(`${name} marked repaired — back in real, usable central stock`);
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="space-y-6">
      {pendingRepairReceipts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="w-4 h-4" /> Awaiting Receipt from Branch ({pendingRepairReceipts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingRepairReceipts.map((t: any) => {
              const item = inventory.find((i: any) => i.itemId === t.itemId);
              return (
                <div key={t.transactionId} className="bg-white rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item?.itemName || t.itemId}</p>
                      <p className="text-xs text-gray-500">Challan {t.challanNumber} · Dispatched: {t.quantitySent}</p>
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
                        <Label className="text-xs">Missing in Transit (if any)</Label>
                        <Input type="number" value={qtyMissing} onChange={(e) => setQtyMissing(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Notes (if any)</Label>
                        <Input value={receiptNotes} onChange={(e) => setReceiptNotes(e.target.value)} placeholder="What happened, if relevant" />
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
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-600" /> Equipment Repair Queue
        </CardTitle>
        <p className="text-xs text-gray-500">Real equipment currently at Kim, sent back broken by a supervisor, awaiting repair</p>
        <Link to="/store-manager/equipment-serial-registry" className="text-xs text-blue-600 hover:underline inline-block mt-1">
          View real per-unit serial history →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {underRepair.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing currently under repair.</p>
        ) : (
          underRepair.map((i: any) => (
            <div key={i.itemId} className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{i.itemName}</p>
                  <p className="text-xs text-gray-500">{i.underRepairStock} unit(s) under repair</p>
                </div>
                <Button size="sm" onClick={() => handleMarkRepaired(i.itemId, i.underRepairStock, i.itemName)}>Mark Repaired</Button>
              </div>

              {spareParts.length > 0 && (
                <div className="pt-2 border-t">
                  <Label className="text-xs text-gray-500">Real spare part used for this repair (optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={partUsed[i.itemId] || ""}
                      onValueChange={(v) => setPartUsed((prev) => ({ ...prev, [i.itemId]: v }))}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="No part used" /></SelectTrigger>
                      <SelectContent>
                        {spareParts.map((p: any) => (
                          <SelectItem key={p.itemId} value={p.itemId}>
                            {p.itemName} (on hand: {p.centralStock || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min="1" placeholder="Qty"
                      className="w-20"
                      value={partQty[i.itemId] || ""}
                      onChange={(e) => setPartQty((prev) => ({ ...prev, [i.itemId]: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
    </div>
  );
}

export default EquipmentRepairQueue;
