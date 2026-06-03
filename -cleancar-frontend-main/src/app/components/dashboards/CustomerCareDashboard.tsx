// Dashboard for CCE role
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plus, AlertTriangle, Clock, CheckCircle, Phone, MessageSquare, Edit, Check } from "lucide-react";
import { MASTER_COMPLAINTS, MASTER_KPI_DATA } from "../../data/masterData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { BackButton } from "../ui/back-button";

export function CustomerCareDashboard() {
  // Initialize with centralized complaints data
  const [myComplaints, setMyComplaints] = useState(
    MASTER_COMPLAINTS.map((complaint) => ({
      id: complaint.id,
      customer: complaint.customerName,
      carNo: complaint.carNo,
      type: complaint.type,
      severity: complaint.severity,
      description: complaint.description,
      status: complaint.status,
      assignedTo: complaint.assignedTo,
      createdAt: complaint.createdAt,
      sla: complaint.sla,
    }))
  );
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  
  // Form state for new complaint
  const [newComplaint, setNewComplaint] = useState({
    customer: "",
    carNo: "",
    type: "Service Quality",
    severity: "Medium",
    description: "",
  });

  const stats = {
    open: myComplaints.filter(c => c.status === "Open").length,
    inProgress: myComplaints.filter(c => c.status === "In Progress").length,
    escalated: myComplaints.filter(c => c.status === "Escalated").length,
    closedToday: MASTER_COMPLAINTS.filter(c => c.status === "Closed" && c.resolutionDate === "2026-03-15").length,
    avgResolution: `${MASTER_KPI_DATA.avgResolutionTime}h`,
    nps: Math.round((MASTER_KPI_DATA.customerSatisfaction - 3) / 2 * 100), // Convert 4.7/5 to NPS ~85
  };

  const handleRegisterComplaint = () => {
    // Add new complaint
    const complaint = {
      id: `CMP${(myComplaints.length + 1).toString().padStart(3, '0')}`,
      ...newComplaint,
      status: "Open",
      assignedTo: "Unassigned",
      sla: "Within SLA (5h remaining)",
      createdAt: new Date().toLocaleDateString(),
    };
    
    setMyComplaints([complaint, ...myComplaints]);
    setRegisterDialogOpen(false);
    setNewComplaint({
      customer: "",
      carNo: "",
      type: "Service Quality",
      severity: "Medium",
      description: "",
    });
    
    toast.success("Complaint Registered", {
      description: `${complaint.id} has been created successfully.`,
    });
  };

  const handleCallCustomer = (complaint: any) => {
    setSelectedComplaint(complaint);
    setCallDialogOpen(true);
  };

  const handleUpdateStatus = (complaint: any, newStatus: string) => {
    const updated = myComplaints.map(c => 
      c.id === complaint.id ? { ...c, status: newStatus } : c
    );
    setMyComplaints(updated);
    setUpdateDialogOpen(false);
    
    toast.success("Status Updated", {
      description: `${complaint.id} status changed to ${newStatus}`,
    });
  };

  const handleTakeAction = (complaint: any) => {
    setSelectedComplaint(complaint);
    setUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Care Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Manage customer complaints and feedback</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700"
          onClick={() => setRegisterDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Register Complaint
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.open}</p>
              <p className="text-xs text-gray-500 mt-1">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
              <p className="text-xs text-gray-500 mt-1">Escalated</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.closedToday}</p>
              <p className="text-xs text-gray-500 mt-1">Closed Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.avgResolution}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">{stats.nps}</p>
              <p className="text-xs text-gray-500 mt-1">NPS Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Complaints */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Active Complaints</h3>
          <div className="space-y-3">
            {myComplaints.filter(c => c.status !== "Closed").map((complaint) => (
              <div 
                key={complaint.id} 
                className={`p-4 rounded-lg border-2 ${
                  complaint.severity === "Critical" ? "border-red-300 bg-red-50" :
                  complaint.severity === "High" ? "border-orange-300 bg-orange-50" :
                  "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{complaint.id}</p>
                      <Badge variant={
                        complaint.severity === "Critical" ? "destructive" :
                        complaint.severity === "High" ? "default" :
                        "outline"
                      }>
                        {complaint.severity}
                      </Badge>
                      <Badge variant="outline">{complaint.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{complaint.description}</p>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>Customer: {complaint.customer}</span>
                      <span>Car: {complaint.carNo}</span>
                      <span>Assigned: {complaint.assignedTo}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={
                      complaint.status === "Escalated" ? "destructive" :
                      complaint.status === "In Progress" ? "default" :
                      "outline"
                    }>
                      {complaint.status}
                    </Badge>
                    <p className={`text-xs font-medium ${
                      complaint.sla.includes("Overdue") ? "text-red-600" : "text-gray-600"
                    }`}>
                      {complaint.sla}
                    </p>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCallCustomer(complaint)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleTakeAction(complaint)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Register Complaint Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register New Complaint</DialogTitle>
            <DialogDescription>
              Create a new customer complaint record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name</Label>
              <Input
                id="customer"
                placeholder="Enter customer name"
                value={newComplaint.customer}
                onChange={(e) => setNewComplaint({ ...newComplaint, customer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carNo">Car Number</Label>
              <Input
                id="carNo"
                placeholder="e.g., GJ-01-AB-1234"
                value={newComplaint.carNo}
                onChange={(e) => setNewComplaint({ ...newComplaint, carNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Complaint Type</Label>
              <Select 
                value={newComplaint.type}
                onValueChange={(value) => setNewComplaint({ ...newComplaint, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Service Quality">Service Quality</SelectItem>
                  <SelectItem value="Billing Issue">Billing Issue</SelectItem>
                  <SelectItem value="Staff Behavior">Staff Behavior</SelectItem>
                  <SelectItem value="Delay">Delay</SelectItem>
                  <SelectItem value="Product Issue">Product Issue</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select 
                value={newComplaint.severity}
                onValueChange={(value) => setNewComplaint({ ...newComplaint, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the complaint in detail..."
                rows={4}
                value={newComplaint.description}
                onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRegisterComplaint}
              disabled={!newComplaint.customer || !newComplaint.carNo || !newComplaint.description}
            >
              Register Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Customer Dialog */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Call Customer</DialogTitle>
            <DialogDescription>
              Contact customer regarding complaint {selectedComplaint?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedComplaint.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Car Number:</span>
                  <span className="font-medium">{selectedComplaint.carNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="font-medium text-blue-600">{selectedComplaint.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Complaint:</span>
                  <span className="font-medium">{selectedComplaint.type}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Issue:</strong> {selectedComplaint.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setCallDialogOpen(false)}>
              Close
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                toast.success("Calling Customer", {
                  description: selectedComplaint?.phone ? `Initiating call to ${selectedComplaint.phone}` : "Initiating call",
                });
                setCallDialogOpen(false);
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Complaint Status</DialogTitle>
            <DialogDescription>
              Update status for complaint {selectedComplaint?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <Badge variant={
                    selectedComplaint.status === "Escalated" ? "destructive" :
                    selectedComplaint.status === "In Progress" ? "default" :
                    "outline"
                  }>
                    {selectedComplaint.status}
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">Customer: {selectedComplaint.customer}</p>
                  <p className="text-xs text-gray-600">Issue: {selectedComplaint.type}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Select New Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpdateStatus(selectedComplaint, "In Progress")}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    In Progress
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-green-50 hover:bg-green-100"
                    onClick={() => handleUpdateStatus(selectedComplaint, "Closed")}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-red-50 hover:bg-red-100"
                    onClick={() => handleUpdateStatus(selectedComplaint, "Escalated")}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Escalate
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setUpdateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
