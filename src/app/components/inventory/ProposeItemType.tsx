/**
 * ProposeItemType.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Procurement Manager screen: propose a new trackable item type (e.g. a
 * new bottle or brush category). Genuinely requires Super Admin approval
 * before it can be used for real stock receipt - matches the same real
 * propose -> approve pattern already established elsewhere in this app
 * (e.g. Sales Manager proposing a BTL location for Sales Head to approve).
 */
import { useEffect, useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { trackedInventoryService } from "../../services/trackedInventoryService";
import type { TrackedItemType, ItemCategory, TrackingMode, RetirementRule } from "../../types/trackedInventory";

const emptyForm = {
  name: "",
  category: "Bottle" as ItemCategory,
  trackingMode: "individual" as TrackingMode,
  barcodePrefix: "",
  usesLaundryStage: false,
  retirementRule: "manual" as RetirementRule,
  retirementThreshold: undefined as number | undefined,
  isComposite: false,
};

export function ProposeItemType() {
  const { currentUser } = useRole();
  const [types, setTypes] = useState<TrackedItemType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setTypes(trackedInventoryService.getItemTypes());
  }, []);

  const refresh = () => setTypes(trackedInventoryService.getItemTypes());

  const myProposals = types.filter(t => t.proposedBy === currentUser?.employeeId);

  const handleSubmit = () => {
    if (!form.name || !form.barcodePrefix) {
      toast.error("Name and barcode prefix are required.");
      return;
    }
    trackedInventoryService.proposeItemType(
      form,
      currentUser?.employeeId || "unknown",
      currentUser?.name || "Unknown"
    );
    toast.success(`${form.name} submitted for Super Admin approval.`);
    setShowForm(false);
    setForm(emptyForm);
    refresh();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Propose Item Type</h1>
          <p className="text-sm text-gray-500">New bottle, brush, or other category you want tracked by barcode — requires Super Admin approval before it can be used.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4 mr-2" /> New Proposal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Item Type Proposal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tyre Shine Bottle" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Barcode Prefix</label>
                <Input value={form.barcodePrefix} onChange={e => setForm({ ...form, barcodePrefix: e.target.value.toUpperCase() })} placeholder="e.g. BOT-TYRESHINE" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Category</label>
                <select className="border rounded-lg px-2 py-1.5 text-sm w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ItemCategory })}>
                  <option value="Cloth">Cloth</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Brush">Brush</option>
                  <option value="Pressure Washer Part">Pressure Washer Part</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Tracking Mode</label>
                <select className="border rounded-lg px-2 py-1.5 text-sm w-full" value={form.trackingMode} onChange={e => setForm({ ...form, trackingMode: e.target.value as TrackingMode })}>
                  <option value="individual">Individual (each unit barcoded)</option>
                  <option value="aggregate">Aggregate (count only)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500">This proposal will be sent to Super Admin for review — it won't be usable for real stock receipt until approved.</p>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Submit for Approval</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">My Proposals</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myProposals.map(t => (
            <div key={t.id} className="border rounded-lg p-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.name} <span className="text-xs text-gray-500">({t.category})</span></p>
                {t.approvalStatus === "Rejected" && t.rejectionReason && (
                  <p className="text-xs text-red-600 mt-0.5">Rejected: {t.rejectionReason}</p>
                )}
              </div>
              <Badge variant={t.approvalStatus === "Approved" ? "default" : t.approvalStatus === "Pending" ? "outline" : "destructive"}>
                {t.approvalStatus}
              </Badge>
            </div>
          ))}
          {myProposals.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No proposals submitted yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProposeItemType;
