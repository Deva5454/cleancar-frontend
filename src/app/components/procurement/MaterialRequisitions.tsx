import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Plus, FileText, ShoppingCart, FileCheck, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { useInventory } from "../../contexts/InventoryContext";
import { purchaseRequestService } from "../../services/purchaseRequestService";
import type { PurchaseRequest } from "../../lib/materialRequisition";

const zones = [
  "395001 — Ring Road",
  "395002 — Nanpura",
  "395003 — Athwa",
  "395004 — Rander",
  "395005 — Adajan",
  "395006 — Vesu",
  "395007 — Althan",
  "395008 — Dumas Road",
];

type Urgency = "Routine" | "Urgent" | "Emergency";

interface RequisitionItemForm {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  currentStock: number;
  reorderLevel: number;
  justification: string;
}

/**
 * Procurement's own view of raised requisitions — real, previously-
 * disconnected screen (mock inventory dropdown, its own separate
 * localStorage key, and an approval action that only ever showed a
 * toast without persisting anything) now built on the same real
 * purchaseRequestService the Inventory module's Material Requisition
 * screen and Store's own requisition screen share.
 */
export function MaterialRequisitions() {
  const { currentRole, currentUser } = useRole();
  const { city } = useCity();
  const { inventory } = useInventory();
  const navigate = useNavigate();

  const [requisitions, setRequisitions] = useState<PurchaseRequest[]>(() => purchaseRequestService.getAll());
  const [showRaiseDialog, setShowRaiseDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<PurchaseRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [urgency, setUrgency] = useState<Urgency>("Routine");
  const [requiredBy, setRequiredBy] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<RequisitionItemForm[]>([
    { itemId: "", itemName: "", unit: "", quantity: 0, currentStock: 0, reorderLevel: 0, justification: "" }
  ]);

  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [rejectReason, setRejectReason] = useState("");

  const canRaiseRequisition = ["Supervisor", "Store Manager", "Operations Manager", "Procurement Manager", "Admin", "Super Admin"].includes(currentRole);
  // Real approver set — matches the same three roles that can approve on
  // Inventory's Material Requisition screen and Store's own requisition
  // screen, so approval authority means the same thing everywhere this
  // shared pipeline appears.
  const canApproveRequisition = ["Procurement Manager", "Admin", "Super Admin"].includes(currentRole);

  const realItems = inventory.filter((i: any) => i.cityId === city);

  const handleAddItem = () => {
    setItems([...items, { itemId: "", itemName: "", unit: "", quantity: 0, currentStock: 0, reorderLevel: 0, justification: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof RequisitionItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "itemId") {
      const real = realItems.find((i: any) => i.itemId === value);
      if (real) {
        newItems[index].itemName = real.itemName;
        newItems[index].unit = real.unit;
        newItems[index].currentStock = real.centralStock || 0;
        newItems[index].reorderLevel = real.reorderLevel;
      }
    }

    setItems(newItems);
  };

  const resetForm = () => {
    setUrgency("Routine");
    setRequiredBy("");
    setSelectedZones([]);
    setReason("");
    setItems([{ itemId: "", itemName: "", unit: "", quantity: 0, currentStock: 0, reorderLevel: 0, justification: "" }]);
  };

  const handleSubmitRequisition = () => {
    if (!requiredBy) { toast.error("Please select required by date"); return; }
    if (selectedZones.length === 0) { toast.error("Please select at least one zone"); return; }
    if (!reason.trim()) { toast.error("Please enter justification"); return; }
    if (items.some((item) => !item.itemId || item.quantity <= 0)) { toast.error("Please complete all item details"); return; }

    const priority = urgency === "Routine" ? "Medium" : "High";
    const remarks = [
      `[${urgency}]`,
      `Zones: ${selectedZones.map((z) => z.split(" — ")[0]).join(", ")}`,
      `Required by: ${requiredBy}`,
      `Reason: ${reason}`,
    ].join(" · ");

    const pr = purchaseRequestService.create({
      requestedBy: currentUser.name,
      priority,
      items: items.map((i) => ({
        itemName: i.itemName, quantity: i.quantity, unit: i.unit, estimatedCost: 0,
        vendorSuggestion: i.justification || undefined,
      })),
      remarks,
    });

    // Domain-authority fast path — if the person raising it is themselves
    // a real approver, it doesn't need to wait on anyone else.
    if (canApproveRequisition) {
      const result = purchaseRequestService.approveAndIssuePO(pr.id, currentUser.name);
      setRequisitions(purchaseRequestService.getAll());
      toast.success(`${pr.id} created and auto-approved`, {
        description: result ? `${result.poNumber} created — no escalation needed.` : undefined,
      });
    } else {
      setRequisitions(purchaseRequestService.getAll());
      toast.success(`${pr.id} submitted for approval`, {
        description: "A Procurement Manager, Admin, or Super Admin will review it.",
      });
    }

    setShowRaiseDialog(false);
    resetForm();
  };

  const handleViewDetail = (req: PurchaseRequest) => {
    setSelectedRequisition(req);
    setShowDetailDialog(true);
  };

  const handleOpenApproval = (req: PurchaseRequest) => {
    setSelectedRequisition(req);
    setApprovalAction("approve");
    setRejectReason("");
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = () => {
    if (!selectedRequisition) return;
    if (approvalAction === "reject" && !rejectReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    if (approvalAction === "approve") {
      const result = purchaseRequestService.approveAndIssuePO(selectedRequisition.id, currentUser.name);
      if (!result) {
        toast.error("Could not approve — it may have already been actioned");
        return;
      }
      setRequisitions(purchaseRequestService.getAll());
      toast.success("Requisition approved", { description: `${selectedRequisition.id} approved — ${result.poNumber} created.` });
    } else {
      purchaseRequestService.reject(selectedRequisition.id, currentUser.name, rejectReason.trim());
      setRequisitions(purchaseRequestService.getAll());
      toast.error("Requisition rejected", { description: `${selectedRequisition.requestedBy} will be notified with the rejection reason.` });
    }

    setShowApprovalDialog(false);
  };

  const handleConvertToPO = (req: PurchaseRequest) => {
    navigate("/procurement", {
      state: {
        tab: "purchase-orders",
        prefill: { mrRef: req.id, items: req.items, reason: req.remarks },
      },
    });
    toast.success(`${req.id} — opening PO creation form`);
  };

  const handleSendForQuotation = (req: PurchaseRequest) => {
    navigate("/procurement", {
      state: {
        tab: "quotations",
        prefill: { mrRef: req.id, items: req.items },
      },
    });
    toast.success(`${req.id} — opening RFQ creation form`);
  };

  const getStatusBadgeVariant = (status: PurchaseRequest["status"]) => {
    if (status === "PO Issued") return "default";
    if (status === "Pending") return "secondary";
    if (status === "Rejected") return "destructive";
    return "secondary";
  };

  const filteredRequisitions = requisitions.filter((req) => {
    if (filterStatus !== "all" && req.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Material Requisitions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Requisitions raised by Supervisors, Store Managers, and Operations — same real pipeline Inventory and Store raise into
          </p>
        </div>
        {canRaiseRequisition && (
          <Button onClick={() => setShowRaiseDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Raise Requisition
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="w-48">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="PO Issued">PO Issued</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requisitions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequisitions.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-6 text-center">No requisitions yet.</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PR Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisitions.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.id}</TableCell>
                  <TableCell>{req.dateRequested}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{req.requestedBy}</p>
                  </TableCell>
                  <TableCell className="text-center">{req.items.length}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(req.status)}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetail(req)}>
                        <FileText className="w-4 h-4" />
                      </Button>
                      {canApproveRequisition && req.status === "Pending" && (
                        <Button variant="ghost" size="sm" onClick={() => handleOpenApproval(req)}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      {req.status === "PO Issued" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleConvertToPO(req)} title="Open Purchase Order">
                            <ShoppingCart className="w-4 h-4 text-teal-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSendForQuotation(req)} title="Send for Quotation">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Raise Requisition Dialog */}
      <Dialog open={showRaiseDialog} onOpenChange={setShowRaiseDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Raise Material Requisition</DialogTitle>
            <DialogDescription>
              Submit a request for materials needed for your zone or operations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Urgency Level *</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Emergency">Emergency - Immediate Action Required</SelectItem>
                </SelectContent>
              </Select>
              {urgency === "Emergency" && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">
                    Emergency requisitions should be followed up directly with Procurement for same-day action.
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="requiredBy">Required By Date *</Label>
              <Input
                id="requiredBy"
                type="date"
                value={requiredBy}
                onChange={(e) => setRequiredBy(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label>PIN Code Zone(s) *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {zones.map((zone) => (
                  <label key={zone} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedZones.includes(zone)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedZones([...selectedZones, zone]);
                        else setSelectedZones(selectedZones.filter(z => z !== zone));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{zone}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason / Justification *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why these materials are needed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items Required *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-md p-3">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-md p-3 bg-gray-50 relative">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Item Name *</Label>
                        <Select
                          value={item.itemId}
                          onValueChange={(value) => handleItemChange(index, "itemId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {realItems.map((inv: any) => (
                              <SelectItem key={inv.itemId} value={inv.itemId}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{inv.itemName}</span>
                                  <span className="text-xs text-gray-500 ml-4">
                                    Stock: {inv.centralStock || 0} / Reorder: {inv.reorderLevel}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit</Label>
                          <Input value={item.unit} disabled className="bg-gray-100" />
                        </div>
                      </div>

                      <div className="col-span-2 grid grid-cols-3 gap-2 text-xs text-gray-600 bg-white p-2 rounded border">
                        <div>
                          <span className="text-gray-500">Current Stock:</span>
                          <span className="ml-1 font-medium">{item.currentStock}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reorder Level:</span>
                          <span className="ml-1 font-medium">{item.reorderLevel}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Deficit:</span>
                          <span className={`ml-1 font-medium ${item.currentStock < item.reorderLevel ? "text-red-600" : "text-green-600"}`}>
                            {item.currentStock < item.reorderLevel ? item.reorderLevel - item.currentStock : "None"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Label className="text-xs">Justification (optional)</Label>
                        <Input
                          value={item.justification}
                          onChange={(e) => handleItemChange(index, "justification", e.target.value)}
                          placeholder="e.g., High consumption area, below reorder level..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-sm text-gray-600">
                Total Items: <span className="font-medium">{items.length}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRaiseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequisition}>
              Submit Requisition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Requisition Details - {selectedRequisition?.id}</DialogTitle>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-500">Raised By</p>
                  <p className="font-medium">{selectedRequisition.requestedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{selectedRequisition.dateRequested}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <Badge variant={selectedRequisition.priority === "High" ? "destructive" : "outline"}>
                    {selectedRequisition.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedRequisition.status)}>{selectedRequisition.status}</Badge>
                </div>
                {selectedRequisition.remarks && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Details</p>
                    <p className="text-sm mt-1">{selectedRequisition.remarks}</p>
                  </div>
                )}
              </div>

              {selectedRequisition.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Items Requested</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequisition.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-sm">{item.itemName}</TableCell>
                          <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                          <TableCell className="text-sm text-gray-600">{item.vendorSuggestion || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Requisition - {selectedRequisition?.id}</DialogTitle>
            <DialogDescription>
              Approve (creates a real draft Purchase Order) or reject this requisition
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <p className="text-xs text-gray-500">Raised By</p>
                  <p className="text-sm font-medium">{selectedRequisition.requestedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <Badge variant={selectedRequisition.priority === "High" ? "destructive" : "outline"}>
                    {selectedRequisition.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Action *</Label>
                <Select value={approvalAction} onValueChange={(value: any) => setApprovalAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Approve — Create Purchase Order
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Reject Requisition
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {approvalAction === "reject" && (
                <div>
                  <Label htmlFor="rejectReason">Reason for Rejection *</Label>
                  <Textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this requisition is being rejected..."
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Requested Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequisition.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-sm">{item.itemName}</TableCell>
                        <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              variant={approvalAction === "reject" ? "destructive" : "default"}
            >
              {approvalAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
