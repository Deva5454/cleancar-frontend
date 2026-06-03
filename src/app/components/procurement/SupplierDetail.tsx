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

export function SupplierDetail() {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const vendors = gstComplianceService.getVendors();
  const vendorData = vendors.find(v => v.id === supplierId) || vendors[0];

  // Map vendor data to supplier format with defaults
  const supplier = vendorData ? {
    id: vendorData.id || "",
    companyName: vendorData.legalName || "",
    tradeName: vendorData.tradeName || vendorData.legalName || "",
    supplierType: "Vendor",
    contactPerson: vendorData.contactPerson || "",
    phone: vendorData.phone || "",
    email: vendorData.email || "",
    city: vendorData.city || "",
    state: vendorData.state || "",
    pinCode: vendorData.pinCode || "",
    gst: vendorData.gstin || "",
    pan: vendorData.pan || "",
    status: "Active",
    rating: 4.0,
    outstanding: 0,
    creditLimit: 0,
    paymentTerms: "Net 30",
    categories: [],
    documents: [],
    notes: []
  } : null;

  const purchaseHistory: any[] = [];
  const invoiceHistory: any[] = [];
  const paymentHistory: any[] = [];
  const mockPerformanceData = { onTimeDelivery: 0, qualityScore: 0, priceCompetitiveness: 0, orderFulfillmentRate: 0, responseTime: 0 };
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

  const handleBlacklist = () => {
    if (!blacklistReason.trim()) {
      toast.error("Please enter a reason for blacklisting");
      return;
    }
    toast.success("Supplier blacklisted successfully");
    setShowBlacklistDialog(false);
    setBlacklistReason("");
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
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
          {supplier.status === "Active" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBlacklistDialog(true)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Blacklist
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
                <p className="text-2xl font-bold text-gray-900">₹{(supplier.creditLimit / 1000).toFixed(0)}K</p>
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
                <p className="text-2xl font-bold text-amber-600">₹{(supplier.outstanding / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((supplier.outstanding / supplier.creditLimit) * 100).toFixed(0)}% of limit
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
                  <p className="text-sm text-gray-500">Trade Name</p>
                  <p className="font-medium">{supplier.tradeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Supplier Type</p>
                  <p className="font-medium">{supplier.supplierType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium">{supplier.contactPerson} ({supplier.designation})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{supplier.phone}</p>
                  {supplier.alternatePhone && (
                    <p className="text-sm text-gray-400">{supplier.alternatePhone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
                {supplier.website && (
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium text-teal-600">{supplier.website}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{supplier.addressLine1}</p>
                  {supplier.addressLine2 && <p className="text-sm text-gray-600">{supplier.addressLine2}</p>}
                  <p className="text-sm text-gray-600 mt-1">
                    {supplier.city}, {supplier.state} - {supplier.pinCode}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Region: {supplier.region}</p>
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
                  <p className="font-medium font-mono text-sm">{supplier.gst}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PAN Number</p>
                  <p className="font-medium font-mono text-sm">{supplier.pan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">MSME Registration</p>
                  <p className="font-medium text-sm">{supplier.msme}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year Established</p>
                  <p className="font-medium">{supplier.yearEstablished}</p>
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
                    <Badge variant="secondary" className="mb-2">{cat.name}</Badge>
                    <p className="text-sm text-gray-600">{cat.products}</p>
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
                  <p className="text-sm text-gray-500">Credit Limit</p>
                  <p className="font-medium">₹{supplier.creditLimit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Account</p>
                  <p className="font-medium font-mono text-sm">{supplier.bankAccount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IFSC Code</p>
                  <p className="font-medium font-mono text-sm">{supplier.ifsc}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium text-sm">{supplier.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium">{supplier.accountType}</p>
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
                <Button size="sm">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.documents.map((doc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{doc.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{doc.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.uploadedDate}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Upload className="w-4 h-4 mr-1" />
                          Replace
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                {supplier.notes.map((note, idx) => (
                  <div key={idx} className="border-l-2 border-teal-600 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{note.author}</p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.date}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{note.note}</p>
                  </div>
                ))}
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
