import { useState } from "react";
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
import { Plus, FileText, ShoppingCart, FileCheck, X, Trash2, AlertTriangle, CheckCircle, XCircle, Edit, Filter } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";

// Mock inventory items for dropdown
const inventoryItems = [
  { name: "Car Wash Shampoo 5L", type: "Chemical", unit: "Liters", currentStock: 45, reorderLevel: 50 },
  { name: "Microfiber Towel Premium", type: "Consumable", unit: "Pieces", currentStock: 120, reorderLevel: 100 },
  { name: "Foam Gun", type: "Equipment", unit: "Pieces", currentStock: 8, reorderLevel: 10 },
  { name: "Wheel Cleaner 1L", type: "Chemical", unit: "Liters", currentStock: 25, reorderLevel: 30 },
  { name: "Interior Cleaner 5L", type: "Chemical", unit: "Liters", currentStock: 18, reorderLevel: 25 },
  { name: "Wax Coating 1L", type: "Chemical", unit: "Liters", currentStock: 12, reorderLevel: 20 },
  { name: "Sponge Heavy Duty", type: "Consumable", unit: "Pieces", currentStock: 85, reorderLevel: 100 },
  { name: "Brush Soft Bristle", type: "Consumable", unit: "Pieces", currentStock: 40, reorderLevel: 50 },
];

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

interface RequisitionItem {
  itemType: string;
  itemName: string;
  unit: string;
  quantity: number;
  currentStock: number;
  reorderLevel: number;
  justification: string;
}

export function MaterialRequisitions() {
  const { currentRole, currentUser } = useRole();
  const stored = localStorage.getItem("cleancar_material_requisitions");
  const [requisitions, setRequisitions] = useState(stored ? JSON.parse(stored) : []);
  const [showRaiseDialog, setShowRaiseDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");

  // Form state
  const [urgency, setUrgency] = useState("Routine");
  const [requiredBy, setRequiredBy] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<RequisitionItem[]>([
    { itemType: "Chemical", itemName: "", unit: "", quantity: 0, currentStock: 0, reorderLevel: 0, justification: "" }
  ]);

  // Approval form state
  const [approvalAction, setApprovalAction] = useState<"approve" | "modify" | "reject">("approve");
  const [approvalReason, setApprovalReason] = useState("");
  const [modifiedItems, setModifiedItems] = useState<any[]>([]);

  const canRaiseRequisition = ["Supervisor", "Store Manager", "Operations Manager", "Procurement Manager", "Admin", "Super Admin"].includes(currentRole);
  const canApproveRequisition = ["Operations Manager", "Procurement Manager", "Admin", "Super Admin"].includes(currentRole);

  const handleAddItem = () => {
    setItems([...items, { itemType: "Chemical", itemName: "", unit: "", quantity: 0, currentStock: 0, reorderLevel: 0, justification: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-populate unit, current stock, and reorder level when item is selected
    if (field === "itemName") {
      const selectedItem = inventoryItems.find(item => item.name === value);
      if (selectedItem) {
        newItems[index].unit = selectedItem.unit;
        newItems[index].currentStock = selectedItem.currentStock;
        newItems[index].reorderLevel = selectedItem.reorderLevel;
        newItems[index].itemType = selectedItem.type;
      }
    }

    setItems(newItems);
  };

  const handleSubmitRequisition = () => {
    // Validation
    if (!requiredBy) {
      toast.error("Please select required by date");
      return;
    }
    if (selectedZones.length === 0) {
      toast.error("Please select at least one zone");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter justification");
      return;
    }
    if (items.some(item => !item.itemName || item.quantity <= 0)) {
      toast.error("Please complete all item details");
      return;
    }

    // Create new requisition
    const newId = `MR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const newRequisition = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      raisedBy: currentUser.name,
      raisedByRole: currentRole,
      zone: selectedZones,
      urgency: urgency,
      items: items.length,
      status: currentRole === "Procurement Manager" ? "Approved" : "Pending Approval",
      requiredBy: requiredBy,
      daysRemaining: Math.ceil((new Date(requiredBy).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      reason: reason,
      pmDirect: currentRole === "Procurement Manager",
      itemsList: items
    };

    const updatedRequisitions = [newRequisition, ...requisitions];
    setRequisitions(updatedRequisitions);
    localStorage.setItem("cleancar_material_requisitions", JSON.stringify(updatedRequisitions));

    // Auto-approve if PM raises the requisition (PM Direct - allowed as domain expert)
    if (currentRole === "Procurement Manager") {
      toast.success("Material Requisition created and auto-approved (PM Direct - Domain Authority)", {
        description: `${newId} created. No escalation needed - PM has final authority.`
      });
    } else {
      // Follow hierarchy: Supervisor/Store Manager → Operations Manager → Procurement Manager
      const approver = currentRole === "Supervisor" || currentRole === "Store Manager" ? "Operations Manager" : "Procurement Manager";
      toast.success(`Material Requisition submitted for approval`, {
        description: `Next Level: ${approver} (Following hierarchy: ${currentRole} → ${approver})`
      });
    }

    setShowRaiseDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setUrgency("Routine");
    setRequiredBy("");
    setSelectedZones([]);
    setReason("");
    setItems([{ itemType: "Chemical", itemName: "", unit: "", quantity: 0, currentStock: 0, reorderLevel: 0, justification: "" }]);
  };

  const handleViewDetail = (req: any) => {
    setSelectedRequisition(req);
    setShowDetailDialog(true);
  };

  const handleApprove = (req: any) => {
    setSelectedRequisition(req);
    setModifiedItems(req.itemsList);
    setApprovalAction("approve");
    setApprovalReason("");
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = () => {
    if (approvalAction === "reject" && !approvalReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }
    if (approvalAction === "modify" && !approvalReason.trim()) {
      toast.error("Please enter a reason for modification");
      return;
    }

    if (approvalAction === "approve") {
      const nextLevel = currentRole === "Operations Manager" ? "Procurement Manager" : "Processing";
      toast.success("Requisition approved successfully", {
        description: `${selectedRequisition.id} approved. Next Level: ${nextLevel}`
      });
    } else if (approvalAction === "modify") {
      toast.success("Requisition approved with modifications", {
        description: `Modified quantities approved. Requester will be notified.`
      });
    } else {
      toast.error("Requisition rejected", {
        description: `${selectedRequisition.raisedBy} will be notified with rejection reason`
      });
    }

    setShowApprovalDialog(false);
  };

  const handleConvertToPO = (req: any) => {
    toast.success("Converting to Purchase Order", {
      description: "Redirecting to PO creation form..."
    });
  };

  const handleSendForQuotation = (req: any) => {
    toast.success("Creating RFQ from requisition", {
      description: "Redirecting to quotation form..."
    });
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    if (urgency === "Emergency") return "destructive";
    if (urgency === "Urgent") return "default";
    return "outline";
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "Approved") return "default";
    if (status === "Pending Approval") return "secondary";
    if (status === "Fully Ordered") return "outline";
    if (status === "Rejected") return "destructive";
    return "secondary";
  };

  const filteredRequisitions = requisitions.filter((req: any) => {
    if (filterStatus !== "all" && req.status !== filterStatus) return false;
    if (filterUrgency !== "all" && req.urgency !== filterUrgency) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Material Requisitions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage purchase requisitions from supervisors and operations
          </p>
          <p className="text-xs font-semibold text-blue-700 mt-1">
            📋 Approval Hierarchy: Supervisor/Store Manager → Operations Manager → Procurement Manager
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
      <div className="flex gap-4">
        <div className="w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Partially Ordered">Partially Ordered</SelectItem>
              <SelectItem value="Fully Ordered">Fully Ordered</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterUrgency} onValueChange={setFilterUrgency}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgencies</SelectItem>
              <SelectItem value="Routine">Routine</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requisitions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MR Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Zone(s)</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Required By</TableHead>
                <TableHead>Days Rem.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisitions.map((req) => (
                <TableRow key={req.id} className={req.daysRemaining < 0 ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {req.id}
                      {req.pmDirect && (
                        <Badge variant="outline" className="text-xs">PM Direct</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{req.date}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{req.raisedBy}</p>
                      <p className="text-xs text-gray-500">{req.raisedByRole}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {req.zone.slice(0, 2).map((z, idx) => (
                        <code key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {z.split(" — ")[0]}
                        </code>
                      ))}
                      {req.zone.length > 2 && (
                        <span className="text-xs text-gray-500">+{req.zone.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getUrgencyBadgeVariant(req.urgency)}>
                      {req.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{req.items}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(req.status)}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{req.requiredBy}</TableCell>
                  <TableCell className={req.daysRemaining <= 2 && req.daysRemaining >= 0 ? "text-red-600 font-bold" : req.daysRemaining < 0 ? "text-gray-400" : ""}>
                    {req.daysRemaining < 0 ? `${Math.abs(req.daysRemaining)}d overdue` : `${req.daysRemaining}d`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetail(req)}>
                        <FileText className="w-4 h-4" />
                      </Button>
                      {canApproveRequisition && req.status === "Pending Approval" && (
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(req)}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      {currentRole === "Procurement Manager" && req.status === "Approved" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleConvertToPO(req)} title="Convert to PO">
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
            {/* Urgency */}
            <div>
              <Label>Urgency Level *</Label>
              <Select value={urgency} onValueChange={setUrgency}>
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
                    Emergency requisitions trigger immediate notification to Procurement Manager and require same-day action.
                  </p>
                </div>
              )}
            </div>

            {/* Required By Date */}
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

            {/* PIN Code Zones */}
            <div>
              <Label>PIN Code Zone(s) *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {zones.map((zone) => (
                  <label key={zone} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedZones.includes(zone)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedZones([...selectedZones, zone]);
                        } else {
                          setSelectedZones(selectedZones.filter(z => z !== zone));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{zone}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason / Justification */}
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

            {/* Items */}
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
                          value={item.itemName}
                          onValueChange={(value) => handleItemChange(index, "itemName", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((inv) => (
                              <SelectItem key={inv.name} value={inv.name}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{inv.name}</span>
                                  <span className="text-xs text-gray-500 ml-4">
                                    Stock: {inv.currentStock} / Reorder: {inv.reorderLevel}
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
                  <p className="font-medium">{selectedRequisition.raisedBy} ({selectedRequisition.raisedByRole})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{selectedRequisition.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Required By</p>
                  <p className="font-medium">{selectedRequisition.requiredBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Urgency</p>
                  <Badge variant={getUrgencyBadgeVariant(selectedRequisition.urgency)}>
                    {selectedRequisition.urgency}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Zone(s)</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRequisition.zone.map((z: string, idx: number) => (
                      <Badge key={idx} variant="outline">{z}</Badge>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="text-sm mt-1">{selectedRequisition.reason}</p>
                </div>
              </div>

              {selectedRequisition.itemsList.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Items Requested</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead>Justification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequisition.itemsList.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.itemName}</p>
                              <p className="text-xs text-gray-500">{item.itemType}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={item.currentStock < item.reorderLevel ? "text-red-600 font-medium" : ""}>
                              {item.currentStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{item.justification || "—"}</TableCell>
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
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Requisition - {selectedRequisition?.id}</DialogTitle>
            <DialogDescription>
              Review and approve, modify, or reject this material requisition
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-4">
              {/* Requisition Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <p className="text-xs text-gray-500">Raised By</p>
                  <p className="text-sm font-medium">{selectedRequisition.raisedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Required By</p>
                  <p className="text-sm font-medium">{selectedRequisition.requiredBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Urgency</p>
                  <Badge variant={getUrgencyBadgeVariant(selectedRequisition.urgency)}>
                    {selectedRequisition.urgency}
                  </Badge>
                </div>
              </div>

              {/* Approval Action */}
              <div>
                <Label>Approval Action *</Label>
                <Select value={approvalAction} onValueChange={(value: any) => setApprovalAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Approve All Items
                      </div>
                    </SelectItem>
                    <SelectItem value="modify">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4 text-blue-600" />
                        Approve with Modifications
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

              {/* Reason (required for modify/reject) */}
              {(approvalAction === "modify" || approvalAction === "reject") && (
                <div>
                  <Label htmlFor="approvalReason">
                    {approvalAction === "modify" ? "Reason for Modification" : "Reason for Rejection"} *
                  </Label>
                  <Textarea
                    id="approvalReason"
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder={approvalAction === "modify" ? "Explain why quantities are being adjusted..." : "Explain why this requisition is being rejected..."}
                    rows={3}
                  />
                </div>
              )}

              {/* Items - editable if modify */}
              <div>
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Requested Qty</TableHead>
                      {approvalAction === "modify" && <TableHead className="text-right">Approved Qty</TableHead>}
                      <TableHead className="text-right">Current Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modifiedItems.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.itemName}</p>
                            <p className="text-xs text-gray-500">{item.itemType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit}
                        </TableCell>
                        {approvalAction === "modify" && (
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              className="w-24 ml-auto"
                              defaultValue={item.quantity}
                              min="0"
                              max={item.quantity}
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <span className={item.currentStock < item.reorderLevel ? "text-red-600 font-medium" : ""}>
                            {item.currentStock}
                          </span>
                        </TableCell>
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
              {approvalAction === "approve" ? "Approve" : approvalAction === "modify" ? "Approve with Modifications" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
