import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Users, Send, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { Link } from "react-router-dom";

interface VendorRequest {
  id: string;
  productCategory: string;
  description: string;
  quantity: string;
  urgency: "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected" | "completed";
  requestDate: string;
  requestedBy: string;
}

export function VendorRequest() {
  const [formData, setFormData] = useState({
    productCategory: "",
    description: "",
    quantity: "",
    urgency: "medium" as "high" | "medium" | "low"
  });

  const [requests] = useState<VendorRequest[]>([
    {
      id: "VR001",
      productCategory: "Cleaning Chemicals",
      description: "High-pressure foam cleaning solution for car washing",
      quantity: "100 Liters",
      urgency: "high",
      status: "pending",
      requestDate: "2026-03-09",
      requestedBy: "Store Manager"
    },
    {
      id: "VR002",
      productCategory: "Equipment Parts",
      description: "Replacement foam gun nozzles - multiple sizes",
      quantity: "20 Pieces",
      urgency: "medium",
      status: "approved",
      requestDate: "2026-03-08",
      requestedBy: "Store Manager"
    },
    {
      id: "VR003",
      productCategory: "Consumables",
      description: "Industrial-grade microfiber cloths",
      quantity: "500 Pieces",
      urgency: "low",
      status: "completed",
      requestDate: "2026-03-05",
      requestedBy: "Store Manager"
    },
    {
      id: "VR004",
      productCategory: "Polishing Products",
      description: "Premium ceramic coating wax",
      quantity: "50 Bottles",
      urgency: "medium",
      status: "rejected",
      requestDate: "2026-03-03",
      requestedBy: "Store Manager"
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    toast.success("Vendor request submitted successfully!");
    setFormData({
      productCategory: "",
      description: "",
      quantity: "",
      urgency: "medium"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case "approved":
        return <Badge variant="outline" className="border-green-500 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      case "rejected":
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>;
      case "completed":
        return <Badge variant="outline" className="border-blue-500 text-blue-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>;
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="border-green-500 text-green-700">Low</Badge>;
      default:
        return null;
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Request</h1>
          <p className="text-sm text-gray-500 mt-1">Request new vendor onboarding for products not in current catalog</p>
        </div>
        <Link to="/store-manager">
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Back to Store Manager
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold mt-1">{requests.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit New Vendor Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productCategory">Product Category</Label>
                <Select
                  value={formData.productCategory}
                  onValueChange={(value) => setFormData({ ...formData, productCategory: value })}
                >
                  <SelectTrigger id="productCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning-chemicals">Cleaning Chemicals</SelectItem>
                    <SelectItem value="equipment-parts">Equipment Parts</SelectItem>
                    <SelectItem value="consumables">Consumables</SelectItem>
                    <SelectItem value="polishing-products">Polishing Products</SelectItem>
                    <SelectItem value="finishing-products">Finishing Products</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Estimated Quantity</Label>
                <Input
                  id="quantity"
                  placeholder="e.g., 100 Liters"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the product specifications, requirements, and why this vendor is needed..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value as "high" | "medium" | "low" })}
              >
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High - Immediate Need</SelectItem>
                  <SelectItem value="medium">Medium - Within 2 Weeks</SelectItem>
                  <SelectItem value="low">Low - Within a Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.productCategory}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.description}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{request.requestDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">About Vendor Requests</p>
              <p className="text-sm text-blue-700 mt-1">
                Use this form when you need products that are not available in the current catalog. 
                Submit a vendor request to the Admin who will review and onboard the appropriate vendors. 
                Once approved, the product will be added to the inventory system and you can create purchase orders.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
