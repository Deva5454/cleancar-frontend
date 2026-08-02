import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  ArrowLeft,
  Star,
  Edit,
  Ban,
  CheckCircle,
  FileText,
  Upload,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  IndianRupee,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { gstComplianceService } from "../../services/gstComplianceService";
import { useRole } from "../../contexts/RoleContext";

export function SupplierDetail() {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const { currentUser } = useRole();
  // Bumped after any real save (blacklist/reactivate/note) so vendors/
  // vendorData/supplier below recompute with the persisted change —
  // gstComplianceService.getVendors() isn't reactive on its own.
  const [refreshTick, setRefreshTick] = useState(0);
  const vendors = gstComplianceService.getVendors();
  const vendorData = vendors.find(v => v.id === supplierId) || vendors[0];

  const supplier = vendorData ? {
    id: vendorData.id || "",
    companyName: vendorData.name ?? "",
    supplierType: "Vendor",
    contactPerson: vendorData.contactPerson || "",
    phone: vendorData.contactPhone ?? "",
    email: vendorData.contactEmail ?? "",
    address: vendorData.address || "",
    city: vendorData.state ?? "",
    state: vendorData.state || "",
    gst: vendorData.gstin || "",
    pan: vendorData.pan || "",
    status: vendorData.status ?? "Active",
    // No real vendor rating exists anywhere in this app yet — 4.0 is a
    // neutral placeholder, same as before, kept out of this fix's scope.
    rating: (vendorData as any).rating ?? 4.0,
    // Real fix: neither field exists on GSTVendor (no vendor credit-limit
    // or outstanding-balance tracking anywhere in this app) — these were
    // silently defaulting to 0, which then divided 0/0 into NaN% below.
    // hasCreditData stays false so the UI can say "Not tracked" honestly
    // instead of showing a fabricated ₹0K / NaN%.
    outstanding: 0,
    creditLimit: 0,
    hasCreditData: false,
    paymentTerms: vendorData.paymentTerms || "Net 30",
    categories: [vendorData.vendorType ?? "General"],
    bankAccountNumber: vendorData.bankAccountNumber || "",
    ifscCode: vendorData.ifscCode || "",
    gstCertificate: vendorData.gstCertificate,
    panCertificate: vendorData.panCertificate,
    notes: vendorData.notes || "",
  } : null;

  const purchaseHistory = (() => {
    try {
      return JSON.parse(localStorage.getItem("cleancar_purchase_orders") || "[]")
        .filter((p: any) => supplier && (p.supplier ?? "").toLowerCase().includes(supplier.companyName.split(" ")[0].toLowerCase()))
        .slice(0, 5);
    } catch { return []; }
  })();
  const paymentHistory = (() => {
    try {
      return JSON.parse(localStorage.getItem("cleancar_supplier_payments") || "[]")
        .filter((p: any) => supplier && (p.supplier ?? "").toLowerCase().includes(supplier.companyName.split(" ")[0].toLowerCase()))
        .slice(0, 5);
    } catch { return []; }
  })();
  const invoiceHistory: any[] = [];
  // Real compliance documents already uploaded via GST → Vendor Master
  // (gstCertificate/panCertificate) — replaces a permanently-empty fake list.
  const realDocuments = [supplier?.gstCertificate, supplier?.panCertificate].filter(Boolean) as Array<{
    type: string; fileName: string; uploadedAt: string; status: string;
  }>;
  // Real note history, parsed back out of the single notes string field
  // each entry was appended to (see appendVendorNote above).
  const noteEntries = supplier?.notes
    ? supplier.notes.split("\n").filter(Boolean).map((line) => {
        const m = line.match(/^\[(.+?)\]\s*(.+?):\s*(.*)$/);
        return m ? { date: m[1], author: m[2], note: m[3] } : { date: "", author: "", note: line };
      })
    : [];
  const mockPerformanceData = {
    onTimeDelivery: supplier?.rating ? Math.round(supplier.rating * 20) : 80,
    qualityScore: supplier?.rating ? Math.round(supplier.rating * 19) : 75,
    priceCompetitiveness: 78,
    orderFulfillmentRate: 95,
    responseTime: 2,
  };
  const mockRatingHistory: any[] = [];
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [newNote, setNewNote] = useState("");

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalf) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />);
    }
    while (stars.length < 5) {
      stars.push(<Star key={`empty-${stars.length}`} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-teal-600";
    if (rating >= 2.5) return "text-amber-600";
    return "text-red-600";
  };

  // Real note history lives on the vendor's own single notes string field
  // (GSTVendor has no structured per-note list) — each entry is appended
  // as a timestamped, authored line, parsed back into rows for display.
  // Accepts extra field changes so a status change and its note land in
  // one save, rather than two saves racing on a stale closure.
  const appendVendorNote = (text: string, extraChanges: Partial<typeof vendorData> = {}) => {
    if (!vendorData) return;
    const entry = `[${new Date().toLocaleString("en-IN")}] ${currentUser?.name || "User"}: ${text}`;
    const updatedNotes = vendorData.notes ? `${vendorData.notes}\n${entry}` : entry;
    gstComplianceService.saveVendor({ ...vendorData, ...extraChanges, notes: updatedNotes });
    setRefreshTick(t => t + 1);
  };

  const handleBlacklist = () => {
    if (!blacklistReason.trim()) {
      toast.error("Please enter a reason for blacklisting");
      return;
    }
    if (!vendorData) return;
    appendVendorNote(`Blacklisted — ${blacklistReason.trim()}`, { status: "Blacklisted" });
    toast.success("Supplier blacklisted successfully");
    setShowBlacklistDialog(false);
    setBlacklistReason("");
  };

  const handleReactivate = () => {
    if (!vendorData) return;
    appendVendorNote("Reactivated", { status: "Active" });
    toast.success("Supplier reactivated");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    appendVendorNote(newNote.trim());
    toast.success("Note added successfully");
    setShowNoteDialog(false);
    setNewNote("");
  };

  if (!supplier) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/procurement?tab=suppliers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Suppliers
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No supplier data found. Please add vendors in GST → Vendor Master.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/procurement?tab=suppliers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{supplier.companyName}</h1>
              <Badge variant={supplier.status === "Active" ? "default" : "destructive"}>
                {supplier.status}
              </Badge>
              <div className="flex items-center gap-1">
                {renderStars(supplier.rating)}
                <span className={`text-sm font-medium ml-1 ${getRatingColor(supplier.rating)}`}>
                  {supplier.rating}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{supplier.id} • {supplier.supplierType}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Supplier
          </Button>
          {supplier.status === "Active" ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBlacklistDialog(true)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Blacklist
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleReactivate}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-400">Not tracked</p>
              </div>
              <IndianRupee className="w-8 h-8 text-teal-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold text-gray-400">Not tracked</p>
                <p className="text-xs text-gray-500 mt-1">
                  No real vendor credit/outstanding tracking yet
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total POs</p>
                <p className="text-2xl font-bold text-gray-900">{purchaseHistory.length}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Last 90 days
                </p>
              </div>
              <Package className="w-8 h-8 text-teal-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On-Time Delivery</p>
                <p className="text-2xl font-bold text-green-600">{mockPerformanceData.onTimeDelivery}%</p>
                <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
          <TabsTrigger value="invoice-history">Invoice History</TabsTrigger>
          <TabsTrigger value="payment-history">Payment History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium">{supplier.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Supplier Type</p>
                  <p className="font-medium">{supplier.supplierType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium">{supplier.contactPerson || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{supplier.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{supplier.email || "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{supplier.address || "—"}</p>
                  <p className="text-sm text-gray-600 mt-1">{supplier.state}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">GST Number</p>
                  <p className="font-medium font-mono text-sm">{supplier.gst || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PAN Number</p>
                  <p className="font-medium font-mono text-sm">{supplier.pan || "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supply Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplier.categories.map((cat, idx) => (
                  <div key={idx}>
                    <Badge variant="secondary" className="mb-2">{cat}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment & Finance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <Badge variant="secondary">{supplier.paymentTerms}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Account</p>
                  <p className="font-medium font-mono text-sm">{supplier.bankAccountNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IFSC Code</p>
                  <p className="font-medium font-mono text-sm">{supplier.ifscCode || "—"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Purchase History Tab */}
        <TabsContent value="purchase-history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseHistory.map((po) => (
                    <TableRow key={po.poNumber}>
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell>{po.date}</TableCell>
                      <TableCell className="text-right font-medium">₹{po.value.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{po.items}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === "Delivered" ? "default" : "secondary"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice History Tab */}
        <TabsContent value="invoice-history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Match Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceHistory.map((invoice) => (
                    <TableRow key={invoice.invoiceNumber}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className="text-right font-medium">₹{invoice.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.matchStatus === "Matched" ? "default" : "secondary"}>
                          {invoice.matchStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.paymentStatus === "Paid" ? "default" : "secondary"}>
                          {invoice.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payment-history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>UTR/Reference</TableHead>
                    <TableHead>Invoices</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell className="text-right font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.mode}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                      <TableCell className="text-sm">{payment.invoices}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">On-Time Delivery</p>
                      <p className="text-sm font-bold text-green-600">{mockPerformanceData.onTimeDelivery}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${mockPerformanceData.onTimeDelivery}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Quality Score</p>
                      <p className="text-sm font-bold text-green-600">{mockPerformanceData.qualityScore}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${mockPerformanceData.qualityScore}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Price Competitiveness</p>
                      <p className="text-sm font-bold text-teal-600">{mockPerformanceData.priceCompetitiveness}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${mockPerformanceData.priceCompetitiveness}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Order Fulfillment Rate</p>
                      <p className="text-sm font-bold text-green-600">{mockPerformanceData.orderFulfillmentRate}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${mockPerformanceData.orderFulfillmentRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Response Time</p>
                      <p className="text-sm font-bold text-teal-600">{mockPerformanceData.responseTime}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${mockPerformanceData.responseTime}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: "On-Time", value: mockPerformanceData.onTimeDelivery },
                    { metric: "Quality", value: mockPerformanceData.qualityScore },
                    { metric: "Price", value: mockPerformanceData.priceCompetitiveness },
                    { metric: "Fulfillment", value: mockPerformanceData.orderFulfillmentRate },
                    { metric: "Response", value: mockPerformanceData.responseTime },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="value" stroke="#0d9488" fill="#0d9488" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rating Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockRatingHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} width={50} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rating" stroke="#0d9488" strokeWidth={2} name="Supplier Rating" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Uploaded Documents</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.info("Compliance documents are uploaded from GST → Vendor Master → Edit Vendor.");
                    navigate("/gst/vendors");
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Uploaded Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realDocuments.map((doc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{doc.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.uploadedAt?.split("T")[0]}</TableCell>
                      <TableCell><Badge variant="outline">{doc.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {realDocuments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No documents uploaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Internal Notes</CardTitle>
                <Button size="sm" onClick={() => setShowNoteDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {noteEntries.slice().reverse().map((note, idx) => (
                  <div key={idx} className="border-l-2 border-teal-600 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      {note.author && <p className="text-sm font-medium text-gray-900">{note.author}</p>}
                      {note.author && note.date && <span className="text-xs text-gray-400">•</span>}
                      {note.date && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {note.date}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{note.note}</p>
                  </div>
                ))}
                {noteEntries.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">No notes yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Blacklist Dialog */}
      <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklist Supplier</DialogTitle>
            <DialogDescription>
              This action will prevent new POs and RFQs with this supplier. Existing POs will show a warning.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Blacklisting *</Label>
              <Textarea
                rows={4}
                placeholder="Enter detailed reason for blacklisting this supplier..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBlacklistDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlacklist}>
              <Ban className="w-4 h-4 mr-2" />
              Blacklist Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
            <DialogDescription>
              This note is internal and not visible to the supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                rows={4}
                placeholder="Enter your note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupplierDetail;
