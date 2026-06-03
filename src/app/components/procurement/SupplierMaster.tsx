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
import { gstComplianceService } from "../../services/gstComplianceService";
import { useCity } from "../../contexts/CityContext";
import { GST_STATE_OPTIONS } from "../../services/accountingEntryService";

export function SupplierMaster() {
  const navigate = useNavigate();
  const { availableCities } = useCity();
  const vendors = gstComplianceService.getVendors();
  const [formData, setFormData] = useState({ city: "", stateCode: "", state: "" });
  const suppliers = vendors.map(v => ({
    id: v.id, companyName: v.legalName, tradeName: v.tradeName||v.legalName,
    gstin: v.gstin||"", contactPerson: v.contactPerson||"", phone: v.phone||"",
    email: v.email||"", category: v.category||"General", city: v.city||"Surat",
    status: "Active", rating: 4.0, totalOrders: 0, totalValue: 0,
  }));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const handleAddSupplier = () => {
    toast.success("Supplier added successfully");
    setShowAddDialog(false);
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
                  <Input placeholder="Enter company name" />
                </div>
                <div className="space-y-2">
                  <Label>Trade Name (if different)</Label>
                  <Input placeholder="Enter trade name" />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Type *</Label>
                  <Select>
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
                  <Input placeholder="Enter contact person" />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input placeholder="Enter designation" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Alternate Phone</Label>
                  <Input placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="supplier@example.com" />
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
                  <Input placeholder="Street address" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address Line 2</Label>
                  <Input placeholder="Building, floor, etc." />
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
                  <Input placeholder="XXXXXX" maxLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select>
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
                  <Input placeholder="XXAABCUXXXXRXZX" maxLength={15} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number *</Label>
                  <Input placeholder="ABCDE1234F" maxLength={10} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>MSME Registration (optional)</Label>
                  <Input placeholder="MSME number" />
                </div>
                <div className="space-y-2">
                  <Label>Year Established</Label>
                  <Input type="number" placeholder="YYYY" />
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
                  <Select>
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
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Bank Account Number</Label>
                  <Input placeholder="XXXX XXXX XXXX" />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input placeholder="XXXXXXXXXXXXXX" className="font-mono" />
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2">
              <Label>Internal Notes (Not visible to supplier)</Label>
              <Textarea rows={3} placeholder="Add any internal notes about this supplier..." />
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