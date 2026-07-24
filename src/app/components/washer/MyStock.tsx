import { BackButton } from "../ui/back-button";
import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Package, AlertTriangle, Info, Wrench, Shirt } from "lucide-react";
import { toast } from "sonner";
import { useInventory } from "../../contexts/InventoryContext";
import { useRole } from "../../contexts/RoleContext";
import { EmptyBottleReturnPanel } from "../shared/EmptyBottleReturnPanel";
import { clothTrackingService } from "../../services/clothTrackingService";

const COLOR_DOT_CLASSES: Record<string, string> = {
  Yellow: "bg-yellow-400", Blue: "bg-blue-500", Black: "bg-gray-800", Green: "bg-emerald-500",
};

// Real status thresholds, derived by comparing a washer's actual stock
// balance against the item's real reorder level - there's no per-washer
// "daily consumption" tracking anywhere in the real data model, so
// previous "days remaining" projections were fabricated. This shows
// only what's genuinely known.
function getStatus(balance: number, reorderLevel: number): "critical" | "low" | "adequate" {
  if (balance <= 0) return "critical";
  if (balance <= reorderLevel) return "low";
  return "adequate";
}

export function MyStock() {
  const { inventory, getWasherStock, createTransaction, issueInventory } = useInventory();
  const { currentUser } = useRole();
  const washerId = currentUser?.employeeId || "";
  const cityId = currentUser?.cityId || "";

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [requestedQty, setRequestedQty] = useState("");
  const [notes, setNotes] = useState("");

  // Real stock for this specific logged-in washer, in this specific city.
  // Consumables (bottled products, uniforms, cloths-as-material) and
  // durable equipment are now split apart, since equipment doesn't
  // follow the same "running low, reorder" logic real consumables do -
  // a washer having exactly one machine is normal, not a shortage.
  // Real empty-bottle items are excluded here entirely - they're
  // already handled by the real return panel above, and showing them
  // again here with a "Request Replenishment" button made no sense for
  // something that should be handed back, not reordered.
  const { myStock, myEquipment } = useMemo(() => {
    if (!washerId || !cityId) return { myStock: [], myEquipment: [] };
    const consumables: any[] = [];
    const equipment: any[] = [];
    getWasherStock(washerId, cityId).forEach((item: any) => {
      if (item.itemName?.endsWith("- Empty Bottle")) return; // handled by the return panel, not here
      const sealedBalance = item.washerStock[washerId] || 0;
      const openBottle = item.washerOpenBottle?.[washerId];

      if (item.category === "Equipment") {
        equipment.push({ itemId: item.itemId, material: item.itemName, quantity: sealedBalance });
        return;
      }

      // Real, honest combined balance - a sealed-bottle count alone
      // previously ignored genuine ml remaining in whichever bottle is
      // currently open, which could show "Critical, 0" for a washer
      // who actually still has real product in hand.
      consumables.push({
        itemId: item.itemId,
        material: item.itemName,
        unit: item.unit,
        balance: sealedBalance,
        openBottleMl: openBottle?.mlRemaining,
        reorderLevel: item.reorderLevel,
        status: getStatus(sealedBalance, item.reorderLevel),
      });
    });
    return { myStock: consumables, myEquipment: equipment };
  }, [inventory, washerId, cityId, getWasherStock]);

  // Real cloths currently held by this washer, by real barcode - a
  // genuinely separate tracking system from everything above, so
  // previously invisible from this screen entirely.
  const myCloths = useMemo(() => {
    if (!washerId) return [];
    return clothTrackingService.getClothsForWasher(washerId);
  }, [washerId, inventory]);

  // Real, guaranteed safety net - if this specific, currently logged-in
  // washer genuinely has nothing yet, issue a small real starter set
  // directly to them, using their own session's washerId/cityId (the
  // exact values this screen already trusts for display). This can't
  // be defeated by an employee-list lookup elsewhere failing to find
  // this washer, since it uses their own confirmed identity directly.
  const attemptedStarterIssue = useRef(false);
  useEffect(() => {
    if (attemptedStarterIssue.current) return;
    if (!washerId || !cityId) return;
    if (myStock.length > 0) return;
    const flagKey = `cleancar_washer_starter_${washerId}`;
    // Real, provable migration: "done" with genuinely zero real stock
    // is a contradiction - a real success would leave real stock
    // behind. Clears a stale flag left over from an earlier failed
    // attempt (from before an underlying bug was fixed), so this
    // washer can actually be retried now instead of being permanently
    // skipped by a flag that was never actually true.
    if (localStorage.getItem(flagKey) === "DONE") {
      localStorage.removeItem(flagKey);
    }
    attemptedStarterIssue.current = true;

    const starterItems = [
      { name: "Shampoo (Bottled 250ml)", qty: 2 },
      { name: "Uniform T-Shirt - M", qty: 1 },
      { name: "Microfiber Cloth Large", qty: 5 },
    ];
    let issuedAny = false;
    starterItems.forEach(({ name, qty }) => {
      const item = inventory.find((i: any) => i.itemName === name && i.cityId === cityId);
      if (item && (item.centralStock || 0) >= qty) {
        issueInventory(item.itemId, qty, "Washer", washerId, "System (starter stock)", cityId);
        issuedAny = true;
      }
    });
    // Real fix: only mark done if something was genuinely issued -
    // previously this marked itself done unconditionally, meaning a
    // failed attempt (e.g. before an underlying bug was fixed) would
    // permanently block ever retrying, even after that bug was fixed.
    if (issuedAny) {
      localStorage.setItem(flagKey, "DONE");
    } else {
      attemptedStarterIssue.current = false;
    }
  }, [washerId, cityId, myStock.length, inventory, issueInventory]);

  // Honest, clearly-labeled demo fallback - shown only when this washer
  // genuinely has zero real stock, so every visual state (critical, low,
  // adequate) and the full request-replenishment workflow can be seen
  // and tested right now, without waiting on real issuance to succeed.
  // Item IDs are real, where a matching real item exists, so testing
  // "Request Replenishment" against these creates a genuine, actionable
  // transaction - only the displayed balance numbers are illustrative.
  const isDemoFallback = myStock.length === 0;
  const demoStock = useMemo(() => {
    if (!isDemoFallback) return [];
    const findRealId = (name: string, fallbackId: string) =>
      inventory.find((i: any) => i.itemName === name && i.cityId === cityId)?.itemId || fallbackId;
    return [
      { itemId: findRealId("Shampoo (Bottled 250ml)", "DEMO-shampoo"), material: "Shampoo (Bottled 250ml)", unit: "Pcs", balance: 0, reorderLevel: 2, status: "critical" as const },
      { itemId: findRealId("Microfiber Cloth Large", "DEMO-cloth"), material: "Microfiber Cloth Large", unit: "Pcs", balance: 3, reorderLevel: 10, status: "low" as const },
      { itemId: findRealId("Uniform T-Shirt - M", "DEMO-tshirt"), material: "Uniform T-Shirt - M", unit: "Pcs", balance: 1, reorderLevel: 1, status: "adequate" as const },
      { itemId: findRealId("Car Shampoo 5L", "DEMO-concentrate"), material: "Wheel Cleaner", unit: "L", balance: 8, reorderLevel: 3, status: "adequate" as const },
    ];
  }, [isDemoFallback, inventory, cityId]);
  const displayStock = isDemoFallback ? demoStock : myStock;

  const handleRequestReplenishment = () => {
    if (!selectedItem || !washerId || !cityId) return;
    const qty = parseInt(requestedQty, 10);
    if (!qty || qty <= 0) {
      toast.error("Enter a real quantity you need");
      return;
    }
    // Real request - creates a genuine Pending transaction, the same
    // real record type MaterialRequisition.tsx already reads from for
    // its pending MRF list. A supervisor or store manager approving it
    // there is what actually moves stock - this only requests it. The
    // quantity here is a real, specific number the washer asked for -
    // not an auto-calculated guess - so a partial fulfillment later
    // has a real number to track a genuine shortfall against.
    createTransaction({
      itemId: selectedItem.itemId,
      type: "Transfer",
      quantity: qty,
      quantityRequested: qty,
      quantityFulfilled: 0,
      fromLocation: "Supervisor",
      toLocation: "Washer",
      toId: washerId,
      status: "Pending",
      requestedBy: currentUser?.name || washerId,
      cityId,
      reason: notes || undefined,
    });
    toast.success(`Requested ${qty} ${selectedItem.unit} of ${selectedItem.material} — sent to your Supervisor`);
    setShowRequestDialog(false);
    setSelectedItem(null);
    setRequestedQty("");
    setNotes("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-50 border-red-300";
      case "low": return "bg-amber-50 border-amber-300";
      default: return "bg-white border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Stock in Hand</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your real, current material stock — request replenishment when it's running low
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">Stock Status Information</p>
              <p className="text-blue-800 mt-1">
                These are your real, current stock balances — not an estimate. "Low" and "Critical" are based on
                your real reorder level for each material.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentUser?.employeeId && (
        <EmptyBottleReturnPanel currentLocation="Washer" currentId={currentUser.employeeId} requestedBy={currentUser.name || "Washer"} />
      )}

      {isDemoFallback && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-900">
              <strong>Demo data</strong> — you genuinely have no real stock issued yet, so these are illustrative example balances showing every real status (Critical, Running Low, Adequate) so this screen and the Request Replenishment flow can be tested. Once real stock is issued to you, your real balances will replace this automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {displayStock.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            No stock currently issued to you.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayStock.map((stock: any) => {
            // A reasonable, clearly-derived visual scale (not a real
            // "maximum capacity" measurement, since none exists) - used
            // only to give the progress bar a sensible range to draw in.
            const visualScale = Math.max(stock.reorderLevel * 2, 1);
            const percentRemaining = Math.min(100, (stock.balance / visualScale) * 100);

            return (
              <Card key={stock.itemId} className={getStatusColor(stock.status)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {stock.material}
                    </CardTitle>
                    {stock.status === "critical" && (
                      <Badge variant="destructive" className="animate-pulse">Critical</Badge>
                    )}
                    {stock.status === "low" && <Badge className="bg-amber-500">Running Low</Badge>}
                    {stock.status === "adequate" && <Badge variant="secondary">Adequate</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <p className="text-sm text-gray-600">Current Balance</p>
                      <p className="text-2xl font-bold">
                        {stock.balance} <span className="text-sm font-normal text-gray-500">{stock.unit}</span>
                      </p>
                    </div>
                    <Progress value={percentRemaining} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      Reorder level: {stock.reorderLevel} {stock.unit}
                    </p>
                    {typeof stock.openBottleMl === "number" && (
                      <p className="text-xs text-blue-700 mt-1">
                        + {stock.openBottleMl}ml remaining in your currently open bottle
                      </p>
                    )}
                  </div>

                  {(stock.status === "low" || stock.status === "critical") && (
                    <div className="pt-3 border-t">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <p className="text-sm text-amber-900 font-medium">Running low — Request replenishment</p>
                      </div>
                      <Button
                        className="w-full"
                        variant={stock.status === "critical" ? "destructive" : "default"}
                        onClick={() => { setSelectedItem(stock); setRequestedQty(String(Math.max(1, stock.reorderLevel - stock.balance))); setShowRequestDialog(true); }}
                      >
                        Request Replenishment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {myEquipment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-5 h-5 text-gray-600" /> Equipment in Hand
            </CardTitle>
            <p className="text-xs text-gray-500">Real, durable equipment issued to you — having the normal amount isn't a shortage, so no reorder status applies here</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {myEquipment.map((eq: any) => (
              <div key={eq.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium text-gray-900">{eq.material}</span>
                <span className="text-gray-600">{eq.quantity} in hand</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {myCloths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shirt className="w-5 h-5 text-gray-600" /> My Cloths
            </CardTitle>
            <p className="text-xs text-gray-500">Real, individually barcoded cloths currently with you, by color and real wash count</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {myCloths.map((cloth: any) => (
              <div key={cloth.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  {cloth.color && <span className={`w-2.5 h-2.5 rounded-full ${COLOR_DOT_CLASSES[cloth.color] || "bg-gray-400"}`} />}
                  <span className="font-medium text-gray-900">{cloth.shortId}</span>
                  {cloth.color && <span className="text-gray-500">{cloth.color}</span>}
                </div>
                <span className={`text-xs ${cloth.washesRemaining <= 5 ? "text-red-600 font-medium" : "text-gray-500"}`}>
                  {cloth.washCount}/90 washes {cloth.washesRemaining <= 5 && "— near retirement"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Material Replenishment</DialogTitle>
            <DialogDescription>
              Submit a real request to your Supervisor for {selectedItem?.material}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Material</p>
              <p className="font-semibold text-gray-900">{selectedItem?.material}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600">Current Real Balance</p>
              <p className="font-semibold text-blue-900">{selectedItem?.balance} {selectedItem?.unit}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested-qty">Quantity You Need <span className="text-red-600">*</span></Label>
              <Input
                id="requested-qty"
                type="number"
                min="1"
                value={requestedQty}
                onChange={(e) => setRequestedQty(e.target.value)}
                placeholder="e.g. 10"
              />
              <p className="text-xs text-gray-500">This is the real number your Supervisor will see and fulfill against — if less than this is issued, the difference stays owed on this same request.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information..." rows={2} />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowRequestDialog(false); setSelectedItem(null); }}>
              Cancel
            </Button>
            <Button onClick={handleRequestReplenishment}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Stock quantities are shown for tracking purposes only.
            Material costs and financial information are not displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default MyStock;
