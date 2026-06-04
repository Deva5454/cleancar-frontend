import { useState, useEffect, useMemo } from "react";
import { Plus, AlertTriangle, Clock, CheckCircle, XCircle, TrendingDown, X } from "lucide-react";
import { BackButton } from "../ui/back-button";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { customerCareExecutiveService } from "../../services/customerCareExecutiveService";
import type { Complaint } from "../../types/customerCareExecutive.types";
import { useCustomers } from "../../contexts/AppProvider";

// Map service Complaint to UI complaint format
type UIComplaint = {
  id: string;
  customer: string;
  carNo: string;
  type: string;
  severity: string;
  description: string;
  assignedTo: string;
  sla: string;
  status: string;
  createdAt?: string;
};

// Complaint Management Module
export function ComplaintManagement() {
  const { customers } = useCustomers();
  const [serviceComplaints, setServiceComplaints] = useState<Complaint[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    vehicleNumber: "",
    complaintType: "",
    description: "",
    priority: "P3" as "P1" | "P2" | "P3" | "P4",
  });

  // Handle status change for complaints
  const handleStatusChange = (id: string, newStatus: string) => {
    customerCareExecutiveService.updateComplaintStatus(id, newStatus);
    const updated = customerCareExecutiveService.getAllComplaints();
    setServiceComplaints(updated);
  };

  // Load complaints from service
  useEffect(() => {
    const loaded = customerCareExecutiveService.getAllComplaints();
    setServiceComplaints(loaded);
  }, []);

  // Map service complaints to UI format
  const complaints: UIComplaint[] = useMemo(() => serviceComplaints.map(c => {
    // Map priority
    const priority = c.priority.toUpperCase();
    const severity = priority === "P1" ? "Critical" : priority === "P2" ? "High" : priority === "P3" ? "Medium" : "Low";

    // Map status
    let status = "Open";
    if (c.status === "new") status = "Open";
    else if (c.status === "assigned" || c.status === "in_progress") status = "In Progress";
    else if (c.status === "resolved" || c.status === "closed") status = "Closed";
    else if (c.escalated) status = "Escalated";

    return {
      id: c.ticketId,
      customer: c.customerName,
      carNo: c.vehicleNumber || "N/A",
      type: c.complaintType,
      severity,
      description: c.description,
      assignedTo: c.assignedSupervisorName || "Unassigned",
      sla: c.slaBreached ? "Overdue" : "On Time",
      status,
      createdAt: new Date(c.createdAt).toLocaleDateString(),
    };
  }), [serviceComplaints]);

  const openComplaints = complaints.filter(c => c.status === "Open").length;
  const closedToday = 2;
  const avgResolutionTime = "4.2h";

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();

    // Create complaint (this would normally call a service method to create the complaint)
    const newComplaint = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      vehicleNumber: formData.vehicleNumber,
      complaintType: formData.complaintType,
      description: formData.description,
      priority: formData.priority,
    };

    // Close modal and reset form
    setShowRegisterModal(false);
    setFormData({
      customerName: "",
      customerPhone: "",
      vehicleNumber: "",
      complaintType: "",
      description: "",
      priority: "P3",
    });

    // Reload complaints
    const loaded = customerCareExecutiveService.getAllComplaints();
    setServiceComplaints(loaded);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track and resolve customer complaints</p>
        </div>
        <Button size="sm" onClick={() => setShowRegisterModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Register Complaint
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Complaints</p>
                <p className="text-2xl font-bold mt-1">{openComplaints}</p>
                <p className="text-xs text-orange-600 mt-1">Requires attention</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold mt-1">{complaints.filter(c => c.status === "In Progress").length}</p>
                <p className="text-xs text-blue-600 mt-1">Being resolved</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved Today</p>
                <p className="text-2xl font-bold mt-1">{closedToday}</p>
                <p className="text-xs text-green-600 mt-1">SLA maintained</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Resolution</p>
                <p className="text-2xl font-bold mt-1">{avgResolutionTime}</p>
                <p className="text-xs text-green-600 mt-1">Target: 6h</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Complaints</TabsTrigger>
          <TabsTrigger value="open">Open ({openComplaints})</TabsTrigger>
          <TabsTrigger value="progress">In Progress</TabsTrigger>
          <TabsTrigger value="escalated">Escalated</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Complaint Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Car Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.id}</TableCell>
                      <TableCell>{complaint.customer}</TableCell>
                      <TableCell>{complaint.carNo}</TableCell>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            complaint.severity === "Critical" ? "destructive" : 
                            complaint.severity === "High" ? "default" : 
                            "outline"
                          }
                        >
                          {complaint.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                      <TableCell>{complaint.assignedTo}</TableCell>
                      <TableCell>
                        <span className={complaint.sla.includes("Overdue") ? "text-red-600 font-medium" : "text-gray-600"}>
                          {complaint.sla}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            complaint.status === "Closed" ? "secondary" : 
                            complaint.status === "Escalated" ? "destructive" : 
                            "outline"
                          }
                        >
                          {complaint.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open Complaints Requiring Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complaints.filter(c => c.status === "Open").map((complaint) => (
                  <div key={complaint.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{complaint.id}</p>
                          <Badge variant="destructive">{complaint.severity}</Badge>
                          <Badge variant="outline">{complaint.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{complaint.description}</p>
                        <div className="mt-3 grid grid-cols-2 gap-x-4 text-sm">
                          <div className="text-gray-600">Customer: {complaint.customer}</div>
                          <div className="text-gray-600">Car: {complaint.carNo}</div>
                          <div className="text-gray-600">Assigned: {complaint.assignedTo}</div>
                          <div className={complaint.sla.includes("Overdue") ? "text-red-600 font-medium" : "text-gray-600"}>
                            SLA: {complaint.sla}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm">Assign</Button>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaints Being Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complaints.filter(c => c.status === "In Progress").map((complaint) => (
                  <div key={complaint.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{complaint.id} • {complaint.customer}</p>
                          <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Handler: {complaint.assignedTo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">In Progress</Badge>
                        <p className={`text-xs mt-1 ${complaint.sla.includes("Overdue") ? "text-red-600 font-medium" : "text-gray-600"}`}>
                          {complaint.sla}
                        </p>
                        <Button size="sm" className="mt-2">Update Status</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escalated Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complaints.filter(c => c.status === "Escalated").map((complaint) => (
                  <div key={complaint.id} className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">{complaint.id} • {complaint.type}</p>
                          <p className="text-sm text-gray-700 mt-1">{complaint.description}</p>
                          <div className="flex gap-4 mt-2 text-xs">
                            <span>Customer: {complaint.customer}</span>
                            <span>Car: {complaint.carNo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{complaint.severity}</Badge>
                        <p className="text-xs text-red-600 font-medium mt-1">{complaint.sla}</p>
                        <Button size="sm" variant="destructive" className="mt-2">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resolved Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complaints.filter(c => c.status === "Closed").map((complaint) => (
                  <div key={complaint.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{complaint.id} • {complaint.customer}</p>
                          <p className="text-sm text-gray-600">{complaint.type} • Resolved by {complaint.assignedTo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Closed</Badge>
                        <p className="text-xs text-gray-500 mt-1">{complaint.createdAt}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Complaint Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Register New Complaint</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRegisterModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                    <Input
                      id="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1">P1 - Critical</SelectItem>
                        <SelectItem value="P2">P2 - High</SelectItem>
                        <SelectItem value="P3">P3 - Medium</SelectItem>
                        <SelectItem value="P4">P4 - Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="complaintType">Complaint Type *</Label>
                  <Select
                    value={formData.complaintType}
                    onValueChange={(value) => setFormData({ ...formData, complaintType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select complaint type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service Quality">Service Quality</SelectItem>
                      <SelectItem value="Missed Service">Missed Service</SelectItem>
                      <SelectItem value="Billing Issue">Billing Issue</SelectItem>
                      <SelectItem value="Vehicle Damage">Vehicle Damage</SelectItem>
                      <SelectItem value="Staff Behavior">Staff Behavior</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegisterModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Register Complaint
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}