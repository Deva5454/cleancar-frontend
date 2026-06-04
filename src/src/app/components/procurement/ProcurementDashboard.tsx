import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  FileText,
  CreditCard,
  Calendar,
  AlertCircle,
  ShoppingCart,
  IndianRupee,
  Truck,
  ClipboardCheck,
  XCircle,
  Activity,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { toast } from "sonner";

// Mock data
const kpiData = {
  openRequisitions: 8,
  posAwaitingApproval: 2,
  posAwaitingAck: 5,
  deliveriesThisWeek: 12,
  grnsQualityCheck: 3,
  invoicesPending: 7,
  invoicesAwaitingPayment: 4,
  overduePayments: 1,
};

const reorderAlerts = [
  {
    id: 1,
    item: "Car Wash Shampoo 5L",
    currentStock: 45,
    reorderLevel: 50,
    deficit: 5,
    lastPrice: 450,
    suggestedQty: 55,
    supplier: "CleanPro Supplies Pvt Ltd",
    unit: "Liters"
  },
  {
    id: 2,
    item: "Microfiber Towel Premium",
    currentStock: 85,
    reorderLevel: 100,
    deficit: 15,
    lastPrice: 45,
    suggestedQty: 115,
    supplier: "AutoCare Enterprises",
    unit: "Pieces"
  },
  {
    id: 3,
    item: "Wax Coating 1L",
    currentStock: 12,
    reorderLevel: 20,
    deficit: 8,
    lastPrice: 550,
    suggestedQty: 28,
    supplier: "CleanPro Supplies Pvt Ltd",
    unit: "Liters"
  },
  {
    id: 4,
    item: "Foam Gun",
    currentStock: 8,
    reorderLevel: 10,
    deficit: 2,
    lastPrice: 1200,
    suggestedQty: 12,
    supplier: "Karcher India Pvt Ltd",
    unit: "Pieces"
  },
];

const expiryWatch = [
  {
    id: 1,
    material: "Wax Coating 1L",
    batch: "BATCH-WAX-20260115-001",
    expiryDate: "2026-04-10",
    remaining: 8,
    value: 4400,
    daysToExpiry: 24,
    unit: "Liters"
  },
  {
    id: 2,
    material: "Interior Cleaner 5L",
    batch: "BATCH-INT-20260201-003",
    expiryDate: "2026-04-15",
    remaining: 12,
    value: 5400,
    daysToExpiry: 29,
    unit: "Liters"
  },
];

const pendingApprovals = [
  {
    id: 1,
    poNumber: "PO-202603-015",
    supplier: "Karcher India Pvt Ltd",
    value: 75000,
    submitted: "2026-03-15",
    daysWaiting: 2
  },
  {
    id: 2,
    poNumber: "PO-202603-018",
    supplier: "CleanPro Supplies Pvt Ltd",
    value: 125000,
    submitted: "2026-03-16",
    daysWaiting: 1
  },
];

const recentActivity = [
  { id: 1, type: "PO Created", description: "PO-202603-020 created for AutoCare Enterprises", actor: "Kavya Nair", timestamp: "2 hours ago", value: 85000 },
  { id: 2, type: "GRN Received", description: "GRN-202603-012 received for PO-202603-008", actor: "Sandeep Jain", timestamp: "4 hours ago", value: 95000 },
  { id: 3, type: "Invoice Matched", description: "INV-2603-045 matched successfully", actor: "Kavya Nair", timestamp: "6 hours ago", value: 125000 },
  { id: 4, type: "Payment Released", description: "Payment of ₹150,000 released to CleanPro", actor: "Kavita Iyer", timestamp: "1 day ago", value: 150000 },
  { id: 5, type: "Return Raised", description: "Return DN-202603-002 raised for damaged items", actor: "Kavya Nair", timestamp: "1 day ago", value: 8500 },
  { id: 6, type: "PO Approved", description: "PO-202603-014 approved by Admin", actor: "Kavita Shah", timestamp: "2 days ago", value: 65000 },
  { id: 7, type: "Invoice Matched", description: "INV-2603-042 matched successfully", actor: "Kavya Nair", timestamp: "2 days ago", value: 88000 },
  { id: 8, type: "GRN Received", description: "GRN-202603-009 received for PO-202603-003", actor: "Sandeep Jain", timestamp: "3 days ago", value: 110000 },
  { id: 9, type: "Payment Released", description: "Payment of ₹95,000 released to AutoCare", actor: "Kavita Iyer", timestamp: "3 days ago", value: 95000 },
  { id: 10, type: "PO Created", description: "PO-202603-012 created for Eco Wash Solutions", actor: "Kavya Nair", timestamp: "4 days ago", value: 72000 },
];

const budgetData = {
  monthlyBudget: 500000,
  actualSpend: 385000,
  percentageSpent: 77,
};

export function ProcurementOverview() {
  const { currentRole } = useRole();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showPODialog, setShowPODialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poItems, setPOItems] = useState([
    { id: 1, itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0 }
  ]);

  const suppliers = [
    { id: "SUP-001", name: "CleanPro Supplies Pvt Ltd" },
    { id: "SUP-002", name: "AutoCare Enterprises" },
    { id: "SUP-003", name: "Karcher India Pvt Ltd" },
    { id: "SUP-004", name: "Eco Wash Solutions" },
  ];

  const handleRaisePO = (alert: any) => {
    // Pre-fill the PO form with alert data
    setPOItems([{
      id: 1,
      itemName: alert.item,
      quantity: alert.suggestedQty,
      unit: alert.unit,
      rate: alert.lastPrice,
      amount: alert.suggestedQty * alert.lastPrice
    }]);

    // Try to match supplier
    const matchingSupplier = suppliers.find(s => s.name === alert.supplier);
    if (matchingSupplier) {
      setSelectedSupplier(matchingSupplier.id);
    }

    setShowPODialog(true);
  };

  const handleAddItem = () => {
    setPOItems([...poItems, { id: Date.now(), itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    setPOItems(poItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setPOItems(poItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmitPO = () => {
    toast.success("Purchase Order created and sent for approval");
    setShowPODialog(false);
    setSelectedSupplier("");
    setPOItems([{ id: 1, itemName: "", quantity: 0, unit: "Pieces", rate: 0, amount: 0 }]);
  };

  const totalAmount = poItems.reduce((sum, item) => sum + item.amount, 0);

  const handleRaiseRequisition = (alert: any) => {
    toast.success("Creating Material Requisition", {
      description: `Pre-filling MR for ${alert.item}`
    });
  };

  const handlePlanConsumption = (batch: any) => {
    toast.success("Consumption plan created", {
      description: `Supervisor notified to prioritize ${batch.material}`
    });
  };

  const handleWriteOff = (batch: any) => {
    toast.success("Write-off process initiated", {
      description: `${batch.material} batch ${batch.batch} will be written off`
    });
  };

  const handleQuickApprove = (po: any) => {
    toast.success(`PO ${po.poNumber} approved`, {
      description: `Supplier ${po.supplier} will be notified`
    });
  };

  const handleQuickReject = (po: any) => {
    toast.error(`PO ${po.poNumber} rejected`, {
      description: "Procurement Manager will be notified"
    });
  };

  const getBudgetColor = () => {
    if (budgetData.percentageSpent >= 100) return "text-red-600";
    if (budgetData.percentageSpent >= 80) return "text-amber-600";
    return "text-green-600";
  };

  const getBudgetBarColor = () => {
    if (budgetData.percentageSpent >= 100) return "bg-red-600";
    if (budgetData.percentageSpent >= 80) return "bg-amber-600";
    return "bg-green-600";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "PO Created":
        return <ShoppingCart className="w-4 h-4 text-teal-600" />;
      case "GRN Received":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "Invoice Matched":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Payment Released":
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case "Return Raised":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "PO Approved":
        return <ClipboardCheck className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Procurement Command Center</h2>
        <p className="text-sm text-gray-500 mt-1">
          Current operational picture at a glance
        </p>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toast.info("Navigating to Requisitions...")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Requisitions Pending Action</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpiData.openRequisitions}</p>
              </div>
              <FileText className="w-10 h-10 text-teal-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${kpiData.posAwaitingApproval > 0 ? "border-red-200 bg-red-50" : ""}`} onClick={() => toast.info("Navigating to POs - Pending Approval...")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">POs Awaiting Approval</p>
                <p className={`text-3xl font-bold mt-1 ${kpiData.posAwaitingApproval > 0 ? "text-red-600" : "text-gray-900"}`}>
                  {kpiData.posAwaitingApproval}
                </p>
              </div>
              <AlertCircle className={`w-10 h-10 opacity-20 ${kpiData.posAwaitingApproval > 0 ? "text-red-600" : "text-gray-600"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toast.info("Navigating to POs - Awaiting Acknowledgment...")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">POs Awaiting Supplier Ack</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{kpiData.posAwaitingAck}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toast.info("Navigating to POs - Expected Deliveries...")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Deliveries Expected This Week</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpiData.deliveriesThisWeek}</p>
              </div>
              <Truck className="w-10 h-10 text-teal-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">GRNs Pending Quality Check</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpiData.grnsQualityCheck}</p>
              </div>
              <ClipboardCheck className="w-10 h-10 text-teal-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Invoices Pending 3-Way Match</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpiData.invoicesPending}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Invoices Matched - Awaiting Payment</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{kpiData.invoicesAwaitingPayment}</p>
              </div>
              <CreditCard className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${kpiData.overduePayments > 0 ? "border-red-200 bg-red-50" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue Payments to Suppliers</p>
                <p className={`text-3xl font-bold mt-1 ${kpiData.overduePayments > 0 ? "text-red-600" : "text-gray-900"}`}>
                  {kpiData.overduePayments}
                </p>
              </div>
              <AlertTriangle className={`w-10 h-10 opacity-20 ${kpiData.overduePayments > 0 ? "text-red-600" : "text-gray-600"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reorder Alerts Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Reorder Alerts
              </CardTitle>
              <Badge variant="destructive">{reorderAlerts.length}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Materials currently at or below reorder level</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {reorderAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-md p-3 bg-amber-50 border-amber-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{alert.item}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Preferred Supplier: {alert.supplier}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Current Stock:</span>
                    <span className="ml-1 font-medium text-red-600">{alert.currentStock} {alert.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reorder Level:</span>
                    <span className="ml-1 font-medium">{alert.reorderLevel} {alert.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Deficit:</span>
                    <span className="ml-1 font-medium text-red-600">{alert.deficit} {alert.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Price:</span>
                    <span className="ml-1 font-medium">₹{alert.lastPrice}/{alert.unit}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Suggested Order Qty:</span>
                    <span className="ml-1 font-medium text-teal-600">{alert.suggestedQty} {alert.unit}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1" onClick={() => handleRaisePO(alert)}>
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Raise PO
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleRaiseRequisition(alert)}>
                    <FileText className="w-3 h-3 mr-1" />
                    Raise Requisition
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expiry Watch Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-600" />
                Expiry Watch
              </CardTitle>
              <Badge variant="outline">{expiryWatch.length}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Batches expiring within 30 days with significant remaining quantity</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {expiryWatch.map((batch) => (
              <div key={batch.id} className="border rounded-md p-3 bg-red-50 border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{batch.material}</p>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">{batch.batch}</p>
                  </div>
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-500">Expiry Date:</span>
                    <span className="ml-1 font-medium text-red-600">{batch.expiryDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Days to Expiry:</span>
                    <span className="ml-1 font-medium text-red-600">{batch.daysToExpiry} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining Qty:</span>
                    <span className="ml-1 font-medium">{batch.remaining} {batch.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining Value:</span>
                    <span className="ml-1 font-medium">₹{batch.value.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1" onClick={() => handlePlanConsumption(batch)}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Plan Accelerated Consumption
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleWriteOff(batch)}>
                    <XCircle className="w-3 h-3 mr-1" />
                    Write Off
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals and Budget Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              Pending Approvals
              <Badge variant="secondary">{pendingApprovals.length}</Badge>
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Purchase Orders submitted for Admin/Super Admin approval</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.map((po) => (
                <div key={po.id} className="flex items-center justify-between p-3 border rounded-md bg-blue-50 border-blue-200">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <p className="font-medium text-sm">{po.poNumber}</p>
                      <Badge variant="outline" className="text-xs">{po.supplier}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span>Value: ₹{po.value.toLocaleString()}</span>
                      <span>•</span>
                      <span>Submitted: {po.submitted}</span>
                      <span>•</span>
                      <span className={po.daysWaiting > 1 ? "text-red-600 font-medium" : ""}>
                        Waiting: {po.daysWaiting} day{po.daysWaiting > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {(currentRole === "Admin" || currentRole === "Super Admin") && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleQuickApprove(po)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleQuickReject(po)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spend vs Budget Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-teal-600" />
              Spend vs Budget
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Current month's actual vs budget</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={budgetData.percentageSpent >= 100 ? "#dc2626" : budgetData.percentageSpent >= 80 ? "#f59e0b" : "#10b981"}
                  strokeWidth="12"
                  strokeDasharray={`${(budgetData.percentageSpent / 100) * 440} 440`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={`text-3xl font-bold ${getBudgetColor()}`}>
                  {budgetData.percentageSpent}%
                </p>
                <p className="text-xs text-gray-500 mt-1">of budget</p>
              </div>
            </div>
            <div className="mt-6 w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Monthly Budget:</span>
                <span className="font-medium">₹{(budgetData.monthlyBudget / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Actual Spend:</span>
                <span className={`font-medium ${getBudgetColor()}`}>₹{(budgetData.actualSpend / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Remaining:</span>
                <span className="font-medium">₹{((budgetData.monthlyBudget - budgetData.actualSpend) / 1000).toFixed(0)}K</span>
              </div>
            </div>
            <Button variant="link" size="sm" className="mt-4" onClick={() => toast.info("Opening Analytics...")}>
              View Detailed Analytics
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            Recent Activity
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">Last 10 procurement events across the system</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{activity.type}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.actor}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₹{(activity.value / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create PO Dialog */}
      <Dialog open={showPODialog} onOpenChange={setShowPODialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for material procurement from suppliers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Basic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>PO Date *</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Required By *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms *</Label>
                  <Select defaultValue="net30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net7">Net 7 Days</SelectItem>
                      <SelectItem value="net15">Net 15 Days</SelectItem>
                      <SelectItem value="net30">Net 30 Days</SelectItem>
                      <SelectItem value="advance50">50% Advance, 50% on Delivery</SelectItem>
                      <SelectItem value="advance100">100% Advance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Location *</Label>
                  <Select defaultValue="central">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central">Central Store - Surat</SelectItem>
                      <SelectItem value="branch1">Branch Store - Mumbai</SelectItem>
                      <SelectItem value="branch2">Branch Store - Ahmedabad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Items</h3>
                <Button size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
                      <div className="col-span-4">Item Name / Description</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Unit</div>
                      <div className="col-span-2">Rate (₹)</div>
                      <div className="col-span-2">Amount (₹)</div>
                    </div>

                    {/* Items */}
                    {poItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4">
                          <Input
                            placeholder="Enter item name"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(item.id, "itemName", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select value={item.unit} onValueChange={(value) => handleItemChange(item.id, "unit", value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pieces">Pieces</SelectItem>
                              <SelectItem value="Liters">Liters</SelectItem>
                              <SelectItem value="Kilograms">Kilograms</SelectItem>
                              <SelectItem value="Boxes">Boxes</SelectItem>
                              <SelectItem value="Sets">Sets</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={item.rate || ""}
                            onChange={(e) => handleItemChange(item.id, "rate", parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            value={item.amount.toFixed(2)}
                            readOnly
                            className="h-9 bg-gray-50"
                          />
                        </div>
                        <div className="col-span-1">
                          {poItems.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-9 w-9 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="grid grid-cols-12 gap-2 pt-3 border-t">
                      <div className="col-span-10 text-right font-semibold">
                        Total Amount:
                      </div>
                      <div className="col-span-2 font-bold text-lg">
                        ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Additional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Freight Terms</Label>
                  <Select defaultValue="supplier">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier Pays Freight</SelectItem>
                      <SelectItem value="buyer">Buyer Pays Freight</SelectItem>
                      <SelectItem value="included">Freight Included in Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input placeholder="Requisition or Quote reference" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Special Instructions</Label>
                  <Textarea rows={2} placeholder="Add any special delivery instructions, quality requirements, or other notes for the supplier..." />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Internal Notes (Not visible to supplier)</Label>
                  <Textarea rows={2} placeholder="Add internal notes about this PO..." />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPODialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary">
              Save as Draft
            </Button>
            <Button onClick={handleSubmitPO}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create PO & Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
