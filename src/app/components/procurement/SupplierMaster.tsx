import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import { Textarea } from "../ui/textarea";
import { Plus, Star, Download, Building2, Phone, Mail, MapPin, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import { gstComplianceService, type GSTVendor, type VendorDocument } from "../../services/gstComplianceService";
import { useCity } from "../../contexts/CityContext";
import { GST_STATE_OPTIONS } from "../../services/accountingEntryService";

// ── Supplier seed fallback ────────────────────────────────────────────────────
const SUPPLIER_SEED = [
  { id:"SUP-001", companyName:"Hindustan Unilever Ltd",  tradeName:"HUL",      gst:"27AAACH0262P1ZE", gstin:"27AAACH0262P1ZE", contactPerson:"Vikram Shah",  phone:"9876543210", email:"vikram.shah@hul.com",     category:"Cleaning Supplies", categories:["Cleaning Supplies","Chemicals"], city:"Surat",  pinCode:"395003", state:"Gujarat",     paymentTerms:"Net 30", creditLimit:500000, outstanding:125000, status:"Active", rating:4.5, totalOrders:28, totalValue:1250000 },
  { id:"SUP-002", companyName:"3M India Ltd",            tradeName:"3M",       gst:"29AABCT3518Q1ZV", gstin:"29AABCT3518Q1ZV", contactPerson:"Priya Nair",   phone:"9876543211", email:"priya.nair@3m.com",        category:"Equipment",         categories:["Equipment","Consumables"],    city:"Mumbai", pinCode:"400051", state:"Maharashtra", paymentTerms:"Net 15", creditLimit:300000, outstanding:68500,  status:"Active", rating:4.2, totalOrders:15, totalValue:650000  },
  { id:"SUP-003", companyName:"Pidilite Industries",     tradeName:"Pidilite", gst:"27AABCP6538N1Z6", gstin:"27AABCP6538N1Z6", contactPerson:"Anand Mehta",  phone:"9876543212", email:"anand.mehta@pidilite.com", category:"Cleaning Supplies", categories:["Cleaning Supplies"],          city:"Surat",  pinCode:"395004", state:"Gujarat",     paymentTerms:"Net 30", creditLimit:400000, outstanding:95000,  status:"Active", rating:4.0, totalOrders:22, totalValue:880000  },
  { id:"SUP-004", companyName:"Bosch India Ltd",         tradeName:"Bosch",    gst:"29AABCB2792M1ZS", gstin:"29AABCB2792M1ZS", contactPerson:"Rajesh Kumar", phone:"9876543213", email:"rajesh.kumar@bosch.in",    category:"Equipment",         categories:["Equipment"],                  city:"Pune",   pinCode:"411001", state:"Maharashtra", paymentTerms:"Net 45", creditLimit:600000, outstanding:52000,  status:"Active", rating:4.8, totalOrders:8,  totalValue:420000  },
  { id:"SUP-005", companyName:"Local Vendor Surat",      tradeName:"LV Surat", gst:"27AAALV1234A1ZP", gstin:"27AAALV1234A1ZP", contactPerson:"Suresh Patel", phone:"9876543214", email:"suresh@lvsurat.com",       category:"Consumables",       categories:["Consumables"],                city:"Surat",  pinCode:"395001", state:"Gujarat",     paymentTerms:"COD",    creditLimit:100000, outstanding:15000,  status:"Active", rating:3.5, totalOrders:42, totalValue:315000  },
];

export function SupplierMaster() {
  const navigate = useNavigate();
  const { availableCities } = useCity();
  const [vendors, setVendors] = useState(() => gstComplianceService.getVendors());
  const [formData, setFormData] = useState({
    companyName: "", tradeName: "", supplierType: "", contactPerson: "", designation: "",
    phone: "", altPhone: "", email: "",
    addressLine1: "", addressLine2: "", city: "", stateCode: "", state: "", pinCode: "", region: "",
    gstNumber: "", panNumber: "", msme: "", yearEstablished: "",
    paymentTerms: "", creditLimit: "", bankAccountNumber: "", ifscCode: "",
    notes: "",
  });
  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  // Real KYC document uploads - the GSTVendor data model already has real
  // fields for these (gstCertificate/panCertificate), they were just
  // never connected to this form.
  const [gstCertFile, setGstCertFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const [panCertFile, setPanCertFile] = useState<{ name: string; type: string; base64: string } | null>(null);

  const handleKycUpload = (kind: "gst" | "pan", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("File is too large — please upload a file under 500KB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = { name: file.name, type: file.type, base64: reader.result as string };
      if (kind === "gst") setGstCertFile(data); else setPanCertFile(data);
      toast.success(`${kind === "gst" ? "GST" : "PAN"} certificate attached`);
    };
    reader.onerror = () => toast.error("Could not read this file — please try again.");
    reader.readAsDataURL(file);
  };

  const suppliers = vendors.length > 0 ? vendors.map(v => ({
    id: v.id,
    companyName: (v as any).name ?? (v as any).legalName ?? "",
    tradeName: (v as any).tradeName ?? (v as any).name ?? "",
    gst: v.gstin ?? "", gstin: v.gstin ?? "",
    contactPerson: v.contactPerson ?? "",
    phone: (v as any).contactPhone ?? (v as any).phone ?? "",
    email: (v as any).contactEmail ?? (v as any).email ?? "",
    category: (v as any).vendorType ?? "General",
    categories: Array.isArray((v as any).categories) ? (v as any).categories : [(v as any).vendorType ?? "General"],
    city: (v as any).city ?? v.state ?? "Surat",
    pinCode: (v as any).pinCode ?? "",
    state: v.state ?? "Gujarat",
    paymentTerms: v.paymentTerms ?? "Net 30",
    creditLimit: (v as any).creditLimit ?? 0,
    outstanding: (v as any).outstanding ?? 0,
    status: v.status ?? "Active",
    rating: (v as any).rating ?? 4.0,
    totalOrders: (v as any).totalOrders ?? 0,
    totalValue: (v as any).totalValue ?? 0,
  })) : SUPPLIER_SEED;
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const handleAddSupplier = () => {
    if (!formData.companyName.trim() || !formData.contactPerson.trim() || !formData.phone.trim() || !formData.gstNumber.trim()) {
      toast.error("Please fill in company name, contact person, phone, and GST number");
      return;
    }
    const gstDoc: VendorDocument | undefined = gstCertFile
      ? { id: `DOC-${Date.now()}-1`, type: "GST Certificate", fileName: gstCertFile.name, fileBase64: gstCertFile.base64, uploadedBy: "Procurement", uploadedAt: new Date().toISOString(), status: "Pending Verification" }
      : undefined;
    const panDoc: VendorDocument | undefined = panCertFile
      ? { id: `DOC-${Date.now()}-2`, type: "PAN Certificate", fileName: panCertFile.name, fileBase64: panCertFile.base64, uploadedBy: "Procurement", uploadedAt: new Date().toISOString(), status: "Pending Verification" }
      : undefined;
    const newVendor: GSTVendor = {
      id: `SUP-${Date.now()}`,
      name: formData.companyName.trim(),
      gstin: formData.gstNumber.trim(),
      pan: formData.panNumber.trim(),
      state: formData.state || "Gujarat",
      stateCode: formData.stateCode || "24",
      address: `${formData.addressLine1}${formData.addressLine2 ? ", " + formData.addressLine2 : ""}`,
      contactPerson: formData.contactPerson.trim(),
      contactPhone: formData.phone.trim(),
      contactEmail: formData.email.trim(),
      vendorType: "Goods",
      supplyType: "Regular",
      paymentTerms: formData.paymentTerms || "Net 30",
      bankAccountNumber: formData.bankAccountNumber.trim(),
      ifscCode: formData.ifscCode.trim(),
      gstinValidated: false,
      riskScore: gstComplianceService.initVendorRisk(formData.gstNumber.trim()),
      riskLevel: "Medium",
      filingStatus: "Unknown",
      createdBy: "Procurement",
      createdAt: new Date().toISOString(),
      status: "Active",
      notes: formData.notes.trim(),
      gstCertificate: gstDoc,
      panCertificate: panDoc,
      approvalStatus: "Pending",
    };
    gstComplianceService.saveVendor(newVendor);
    toast.success("Supplier added successfully");
    setVendors(gstComplianceService.getVendors());
    setShowAddDialog(false);
    setFormData({
      companyName: "", tradeName: "", supplierType: "", contactPerson: "", designation: "",
      phone: "", altPhone: "", email: "",
      addressLine1: "", addressLine2: "", city: "", stateCode: "", state: "", pinCode: "", region: "",
      gstNumber: "", panNumber: "", msme: "", yearEstablished: "",
      paymentTerms: "", creditLimit: "", bankAccountNumber: "", ifscCode: "",
      notes: "",
    });
    setGstCertFile(null);
    setPanCertFile(null);
  };

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
    return stars;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-teal-600";
    if (rating >= 2.5) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Supplier Master</h2>
          <p className="text-sm text-gray-500 mt-1">Complete supplier registry and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="chemicals">Chemicals</SelectItem>
                  <SelectItem value="consumables">Consumables</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="protective">Protective Gear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="surat">Surat</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="below3">Below 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <Input placeholder="Supplier name..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supplier Registry — {suppliers.length} Active</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{supplier.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.companyName}</p>
                      <p className="text-xs text-gray-500">{supplier.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{supplier.contactPerson}</p>
                      <p className="text-xs text-gray-500">{supplier.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{supplier.city}</span>
                    </div>
                    <p className="text-xs text-gray-500">{supplier.pinCode}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{supplier.gst}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {supplier.paymentTerms}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{(supplier.creditLimit / 1000).toFixed(0)}K
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-medium text-gray-900">
                        ₹{(supplier.outstanding / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-gray-500">
                        {((supplier.outstanding / supplier.creditLimit) * 100).toFixed(0)}% used
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {renderStars(supplier.rating)}
                      <span className={`text-sm font-medium ml-1 ${getRatingColor(supplier.rating)}`}>
                        {supplier.rating}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{supplier.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/procurement/supplier/${supplier.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Complete supplier registration form with all required details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Basic Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input placeholder="Enter company name" value={formData.companyName} onChange={e => updateField("companyName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Trade Name (if different)</Label>
                  <Input placeholder="Enter trade name" value={formData.tradeName} onChange={e => updateField("tradeName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Type *</Label>
                  <Select value={formData.supplierType} onValueChange={val => updateField("supplierType", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="service">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact Person Name *</Label>
                  <Input placeholder="Enter contact person" value={formData.contactPerson} onChange={e => updateField("contactPerson", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input placeholder="Enter designation" value={formData.designation} onChange={e => updateField("designation", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={e => updateField("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alternate Phone</Label>
                  <Input placeholder="+91 XXXXX XXXXX" value={formData.altPhone} onChange={e => updateField("altPhone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="supplier@example.com" value={formData.email} onChange={e => updateField("email", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Address Line 1 *</Label>
                  <Input placeholder="Street address" value={formData.addressLine1} onChange={e => updateField("addressLine1", e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address Line 2</Label>
                  <Input placeholder="Building, floor, etc." value={formData.addressLine2} onChange={e => updateField("addressLine2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Select value={formData.city} onValueChange={val => setFormData(prev => ({ ...prev, city: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {availableCities.map(c => <SelectItem key={c.id} value={c.displayName}>{c.displayName}</SelectItem>)}
                      <SelectItem value="Other">Other city</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select value={formData.stateCode} onValueChange={val => {
                    const state = GST_STATE_OPTIONS.find(s => s.value === val);
                    setFormData(prev => ({ ...prev, stateCode: val, state: state?.name || "" }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {GST_STATE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>PIN Code *</Label>
                  <Input placeholder="XXXXXX" maxLength={6} value={formData.pinCode} onChange={e => updateField("pinCode", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={formData.region} onValueChange={val => updateField("region", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gujarat">Gujarat</SelectItem>
                      <SelectItem value="maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Business Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>GST Number *</Label>
                  <Input placeholder="XXAABCUXXXXRXZX" maxLength={15} className="font-mono" value={formData.gstNumber} onChange={e => updateField("gstNumber", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number *</Label>
                  <Input placeholder="ABCDE1234F" maxLength={10} className="font-mono" value={formData.panNumber} onChange={e => updateField("panNumber", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>MSME Registration (optional)</Label>
                  <Input placeholder="MSME number" value={formData.msme} onChange={e => updateField("msme", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Year Established</Label>
                  <Input type="number" placeholder="YYYY" value={formData.yearEstablished} onChange={e => updateField("yearEstablished", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>GST Certificate {gstCertFile && <span className="text-green-600 text-xs">✓ Attached</span>}</Label>
                  <label className="flex items-center justify-center border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleKycUpload("gst", e)} />
                    <span className="text-sm text-gray-600">{gstCertFile ? gstCertFile.name : "Click to attach GST certificate"}</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>PAN Certificate {panCertFile && <span className="text-green-600 text-xs">✓ Attached</span>}</Label>
                  <label className="flex items-center justify-center border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleKycUpload("pan", e)} />
                    <span className="text-sm text-gray-600">{panCertFile ? panCertFile.name : "Click to attach PAN certificate"}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment & Finance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Payment Terms *</Label>
                  <Select value={formData.paymentTerms} onValueChange={val => updateField("paymentTerms", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net7">Net 7</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="advance100">Advance 100%</SelectItem>
                      <SelectItem value="advance50">50% Advance 50% on Delivery</SelectItem>
                      <SelectItem value="cod">COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credit Limit (₹) *</Label>
                  <Input type="number" placeholder="0" value={formData.creditLimit} onChange={e => updateField("creditLimit", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bank Account Number</Label>
                  <Input placeholder="XXXX XXXX XXXX" value={formData.bankAccountNumber} onChange={e => updateField("bankAccountNumber", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input placeholder="XXXXXXXXXXXXXX" className="font-mono" value={formData.ifscCode} onChange={e => updateField("ifscCode", e.target.value.toUpperCase())} />
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2">
              <Label>Internal Notes (Not visible to supplier)</Label>
              <Textarea rows={3} placeholder="Add any internal notes about this supplier..." value={formData.notes} onChange={e => updateField("notes", e.target.value)} />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier}>
              Save Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}