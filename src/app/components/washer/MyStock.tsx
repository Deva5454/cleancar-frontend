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
import { Package, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { useInventory } from "../../contexts/InventoryContext";
import { useRole } from "../../contexts/RoleContext";
import { EmptyBottleReturnPanel } from "../shared/EmptyBottleReturnPanel";

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
  const [washerEstimate, setWasherEstimate] = useState("");
  const [notes, setNotes] = useState("");

  // Real stock for this specific logged-in washer, in this specific city.
  const myStock = useMemo(() => {
    if (!washerId || !cityId) return [];
    return getWasherStock(washerId, cityId).map((item: any) => {
      const balance = item.washerStock[washerId] || 0;
      return {
        itemId: item.itemId,
        material: item.itemName,
        unit: item.unit,
        balance,
        reorderLevel: item.reorderLevel,
        status: getStatus(balance, item.reorderLevel),
      };
    });
  }, [inventory, washerId, cityId, getWasherStock]);

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

  const handleRequestReplenishment = () => {
    if (!selectedItem || !washerId || !cityId) return;
    // Real request - creates a genuine Pending transaction, the same
    // real record type MaterialRequisition.tsx already reads from for
    // its pending MRF list. A supervisor or store manager approving it
    // there is what actually moves stock - this only requests it.
    createTransaction({
      itemId: selectedItem.itemId,
      type: "Transfer",
      quantity: Math.max(0, selectedItem.reorderLevel - selectedItem.balance) || 1,
      fromLocation: "Supervisor",
      toLocation: "Washer",
      toId: washerId,
      status: "Pending",
      requestedBy: currentUser?.name || washerId,
      cityId,
      reason: [
        washerEstimate ? `Washer's own estimate: ${washerEstimate} ${selectedItem.unit}` : "",
        notes,
      ].filter(Boolean).join(" — ") || undefined,
    });
    toast.success(`Replenishment requested for ${selectedItem.material} — sent to your Supervisor`);
    setShowRequestDialog(false);
    setSelectedItem(null);
    setWasherEstimate("");
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

      {myStock.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            No stock currently issued to you.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myStock.map((stock: any) => {
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
                        onClick={() => { setSelectedItem(stock); setShowRequestDialog(true); }}
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
              <Label htmlFor="washer-estimate">Your Own Estimated Remaining Quantity (optional)</Label>
              <Input
                id="washer-estimate"
                type="number"
                min="0"
                value={washerEstimate}
                onChange={(e) => setWasherEstimate(e.target.value)}
                placeholder="If different from the system's number"
              />
              <p className="text-xs text-gray-500">This helps the Supervisor verify stock accuracy</p>
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
