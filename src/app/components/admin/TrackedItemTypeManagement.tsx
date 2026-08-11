/**
 * TrackedItemTypeManagement.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Super Admin screen: add, edit, and view every trackable item type -
 * cloths, bottles, brushes, pressure washer parts, or any future
 * category. This is the real, dynamic configuration layer - adding a
 * new brush type is a real data row here, not a code change, per the
 * confirmed requirement that the brush list isn't fixed.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { trackedInventoryService } from "../../services/trackedInventoryService";
import { useRole } from "../../contexts/RoleContext";
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
  active: true,
};

export function TrackedItemTypeManagement() {
  const { currentUser } = useRole();
  const [types, setTypes] = useState<TrackedItemType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setTypes(trackedInventoryService.getItemTypes());
  }, []);

  const refresh = () => setTypes(trackedInventoryService.getItemTypes());

  const handleOpenNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (t: TrackedItemType) => {
    setForm({
      name: t.name, category: t.category, trackingMode: t.trackingMode,
      barcodePrefix: t.barcodePrefix, usesLaundryStage: t.usesLaundryStage,
      retirementRule: t.retirementRule, retirementThreshold: t.retirementThreshold,
      isComposite: t.isComposite, active: t.active,
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.barcodePrefix) {
      toast.error("Name and barcode prefix are required.");
      return;
    }
    if (editingId) {
      trackedInventoryService.updateItemType(editingId, form);
      toast.success(`${form.name} updated.`);
    } else {
      trackedInventoryService.createItemType(form);
      toast.success(`${form.name} added — ready to receive real stock at Kim.`);
    }
    setShowForm(false);
    refresh();
  };

  const pendingTypes = types.filter(t => t.approvalStatus === "Pending");

  const handleApprove = (t: TrackedItemType) => {
    trackedInventoryService.approveItemType(t.id, currentUser?.employeeId || "unknown", currentUser?.name || "Unknown");
    toast.success(`${t.name} approved — now available for real stock receipt.`);
    refresh();
  };

  const handleReject = (t: TrackedItemType) => {
    if (!rejectReason.trim()) {
      toast.error("Enter a real reason for rejecting this proposal.");
      return;
    }
    trackedInventoryService.rejectItemType(t.id, currentUser?.employeeId || "unknown", currentUser?.name || "Unknown", rejectReason.trim());
    toast.success(`${t.name} rejected.`);
    setRejectingId(null);
    setRejectReason("");
    refresh();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tracked Item Types</h2>
          <p className="text-sm text-gray-500 mt-1">
            Every category of item tracked by real barcode — cloths, bottles, brushes, pressure washer parts, or anything new. Add a type here, no code change needed.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item Type
        </Button>
      </div>

      {pendingTypes.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Pending Approval</span>
              <Badge variant="outline">{pendingTypes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTypes.map(t => (
              <div key={t.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t.name} <span className="text-xs text-gray-500">({t.category})</span></p>
                    <p className="text-xs text-gray-500">Prefix: {t.barcodePrefix} · Proposed by {t.proposedByName || "Unknown"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(t)}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setRejectingId(t.id); setRejectReason(""); }}>
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
                {rejectingId === t.id && (
                  <div className="mt-2 pt-2 border-t space-y-2">
                    <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Real reason for rejecting this proposal" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleReject(t)}>Confirm Reject</Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Edit Item Type" : "New Item Type"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Shampoo Bottle" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Barcode Prefix</label>
                <Input value={form.barcodePrefix} onChange={e => setForm({ ...form, barcodePrefix: e.target.value.toUpperCase() })} placeholder="e.g. BOT-SHAMPOO" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Category</label>
                <select
                  className="border rounded-lg px-2 py-1.5 text-sm w-full"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as ItemCategory })}
                >
                  <option value="Cloth">Cloth</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Brush">Brush</option>
                  <option value="Pressure Washer Part">Pressure Washer Part</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Tracking Mode</label>
                <select
                  className="border rounded-lg px-2 py-1.5 text-sm w-full"
                  value={form.trackingMode}
                  onChange={e => setForm({ ...form, trackingMode: e.target.value as TrackingMode })}
                >
                  <option value="individual">Individual (each unit barcoded)</option>
                  <option value="aggregate">Aggregate (count only)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Retirement Rule</label>
                <select
                  className="border rounded-lg px-2 py-1.5 text-sm w-full"
                  value={form.retirementRule}
                  onChange={e => setForm({ ...form, retirementRule: e.target.value as RetirementRule })}
                >
                  <option value="manual">Manual — mark retired by hand</option>
                  <option value="usage-count">Usage count threshold</option>
                  <option value="none">Never retires</option>
                </select>
              </div>
              {form.retirementRule === "usage-count" && (
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Retire After (uses)</label>
                  <Input type="number" min={1} value={form.retirementThreshold || ""}
                    onChange={e => setForm({ ...form, retirementThreshold: Number(e.target.value) })} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.usesLaundryStage} onChange={e => setForm({ ...form, usesLaundryStage: e.target.checked })} />
                Uses a Laundry stage (like cloths)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isComposite} onChange={e => setForm({ ...form, isComposite: e.target.checked })} />
                Composite unit (like pressure washer parts)
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Barcode Prefix</th>
                  <th className="py-2 pr-3">Mode</th>
                  <th className="py-2 pr-3">Retirement</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{t.name}</td>
                    <td className="py-2 pr-3 text-gray-500">{t.category}</td>
                    <td className="py-2 pr-3 text-gray-500">{t.barcodePrefix}</td>
                    <td className="py-2 pr-3 text-gray-500">{t.trackingMode}</td>
                    <td className="py-2 pr-3 text-gray-500">
                      {t.retirementRule === "usage-count" ? `After ${t.retirementThreshold} uses` : t.retirementRule}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={t.approvalStatus === "Approved" ? "default" : t.approvalStatus === "Pending" ? "outline" : "destructive"}>
                        {t.approvalStatus === "Approved" ? (t.active ? "Active" : "Inactive") : t.approvalStatus}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(t)}>Edit</Button>
                    </td>
                  </tr>
                ))}
                {types.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-400">No item types configured yet — add one above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TrackedItemTypeManagement;
