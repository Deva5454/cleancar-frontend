import { useState } from "react";
import { customerCareExecutiveService } from "../../services/customerCareExecutiveService";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import { BackButton } from "../ui/back-button";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Users,
  AlertTriangle,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export function OperationsManager() {
  const complaints = customerCareExecutiveService.getComplaints();
  const { customerSubscriptions, planTypes } = usePlanDefinitions();
  const [auditApprovals, setAuditApprovals] = useState([
    { id: 1, supervisor: "Suresh Yadav", auditType: "Site Quality Check", location: "Bandra Cluster", score: 8.5, date: "2026-02-27", status: "Pending" },
    { id: 2, supervisor: "Ramesh Kumar", auditType: "Process Compliance", location: "Andheri Cluster", score: 9.2, date: "2026-02-27", status: "Pending" },
    { id: 3, supervisor: "Vijay Singh", auditType: "Safety Audit", location: "Powai Cluster", score: 7.8, date: "2026-02-26", status: "Approved" },
  ]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [performanceReviewOpen, setPerformanceReviewOpen] = useState(false);

  const handleApproveAudit = (auditId: number) => {
    setAuditApprovals(prev =>
      prev.map(audit =>
        audit.id === auditId ? { ...audit, status: "Approved" } : audit
      )
    );
    const audit = auditApprovals.find(a => a.id === auditId);
    toast.success("Audit Approved", {
      description: `${audit?.auditType} by ${audit?.supervisor} has been approved.`
    });
  };

  const handleRejectAudit = (auditId: number) => {
    setAuditApprovals(prev =>
      prev.map(audit =>
        audit.id === auditId ? { ...audit, status: "Rejected" } : audit
      )
    );
    const audit = auditApprovals.find(a => a.id === auditId);
    toast.error("Audit Rejected", {
      description: `${audit?.auditType} by ${audit?.supervisor} has been rejected and sent back.`
    });
  };

  const handleReviewComplaint = (complaint: any) => {
    setSelectedComplaint(complaint);
    setComplaintDialogOpen(true);
  };

  const handleEscalateComplaint = () => {
    toast.success("Complaint Escalated", {
      description: `Complaint ${selectedComplaint?.id} has been escalated to Senior Management.`
    });
    setComplaintDialogOpen(false);
  };
  
  // Calculate plan distribution
  const planDistribution = planTypes.map(planType => {
    const count = customerSubscriptions.filter(sub => sub.planType === planType).length;
    const revenue = customerSubscriptions
      .filter(sub => sub.planType === planType)
      .reduce((sum, sub) => sum + sub.monthlyPrice, 0);
    return { planType, count, revenue, percentage: (count / customerSubscriptions.length) * 100 };
  }).filter(item => item.count > 0);

  const performanceMetrics = [
    { cluster: "Bandra Cluster", supervisor: "Suresh Yadav", washers: 5, washesCompleted: 62, avgQuality: 8.5, complaints: 1, nps: 82 },
    { cluster: "Andheri Cluster", supervisor: "Ramesh Kumar", washers: 6, washesCompleted: 78, avgQuality: 9.1, complaints: 0, nps: 88 },
    { cluster: "Powai Cluster", supervisor: "Vijay Singh", washers: 4, washesCompleted: 48, avgQuality: 8.2, complaints: 2, nps: 75 },
  ];

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Approve audits, route complaints, manage operations</p>
        </div>
        <Button size="sm" onClick={() => setPerformanceReviewOpen(true)}>
          <Award className="w-4 h-4 mr-2" />
          Performance Review
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Clusters Managed</p>
                <p className="text-2xl font-bold mt-1">3</p>
                <p className="text-xs text-gray-500 mt-1">Mumbai region</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold mt-1">2</p>
                <p className="text-xs text-orange-600 mt-1">Requires action</p>
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
                <p className="text-sm text-gray-500">Avg Quality Score</p>
                <p className="text-2xl font-bold mt-1">8.6</p>
                <p className="text-xs text-green-600 mt-1">+0.3 vs last week</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall NPS</p>
                <p className="text-2xl font-bold mt-1">82</p>
                <p className="text-xs text-green-600 mt-1">Excellent</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="complaints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="complaints">Complaint Routing</TabsTrigger>
          <TabsTrigger value="audits">Audit Approvals</TabsTrigger>
          <TabsTrigger value="performance">Cluster Performance</TabsTrigger>
          <TabsTrigger value="plan-analytics">Plan Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Complaints Requiring Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.filter(c => c.status !== "Closed").map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.id}</TableCell>
                      <TableCell>{complaint.customer}</TableCell>
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
                      <TableCell>
                        <Badge variant="outline">{complaint.status}</Badge>
                      </TableCell>
                      <TableCell>{complaint.assignedTo}</TableCell>
                      <TableCell>
                        <span className={complaint.sla.includes("Overdue") ? "text-red-600 font-medium" : "text-gray-600"}>
                          {complaint.sla}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {complaint.status === "Escalated" ? (
                            <Button size="sm" variant="default">Review</Button>
                          ) : (
                            <Button size="sm" variant="outline">Monitor</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Approvals Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditApprovals.map((audit) => (
                  <div 
                    key={audit.id} 
                    className={`p-4 border rounded-lg ${
                      audit.status === "Pending" ? "border-orange-300 bg-orange-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{audit.auditType}</p>
                          <Badge variant={audit.status === "Pending" ? "default" : "secondary"}>
                            {audit.status}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="text-gray-600">Supervisor: {audit.supervisor}</div>
                          <div className="text-gray-600">Location: {audit.location}</div>
                          <div className="text-gray-600">Date: {audit.date}</div>
                          <div className="text-gray-600">Score: <span className="font-medium text-blue-600">{audit.score}/10</span></div>
                        </div>
                      </div>
                      {audit.status === "Pending" && (
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="default" onClick={() => handleApproveAudit(audit.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectAudit(audit.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {audit.status === "Approved" && (
                        <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cluster Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((cluster, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-lg">{cluster.cluster}</p>
                        <p className="text-sm text-gray-500">Supervisor: {cluster.supervisor}</p>
                      </div>
                      <Badge 
                        variant={cluster.avgQuality >= 9 ? "secondary" : cluster.avgQuality >= 8 ? "outline" : "destructive"}
                        className="text-sm"
                      >
                        Quality: {cluster.avgQuality}/10
                      </Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{cluster.washers}</p>
                        <p className="text-xs text-gray-600">Washers</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{cluster.washesCompleted}</p>
                        <p className="text-xs text-gray-600">Washes</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{cluster.avgQuality}</p>
                        <p className="text-xs text-gray-600">Avg Score</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{cluster.complaints}</p>
                        <p className="text-xs text-gray-600">Complaints</p>
                      </div>
                      <div className="text-center p-3 bg-teal-50 rounded-lg">
                        <p className="text-2xl font-bold text-teal-600">{cluster.nps}</p>
                        <p className="text-xs text-gray-600">NPS</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan-analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planDistribution.map((plan, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-lg">{plan.planType}</p>
                        <p className="text-sm text-gray-500">Subscriptions: {plan.count}</p>
                      </div>
                      <Badge 
                        variant={plan.percentage >= 50 ? "secondary" : "outline"}
                        className="text-sm"
                      >
                        {(plan?.percentage ?? 0).toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{plan.count}</p>
                        <p className="text-xs text-gray-600">Subscriptions</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{(plan?.revenue ?? 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-600">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complaint Dialog */}
      <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Review Complaint</DialogTitle>
            <DialogDescription>
              Review and take action on the complaint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-id">Complaint ID</Label>
              <p className="text-sm text-gray-500">{selectedComplaint?.id}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <p className="text-sm text-gray-500">{selectedComplaint?.customer}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <p className="text-sm text-gray-500">{selectedComplaint?.type}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <p className="text-sm text-gray-500">{selectedComplaint?.severity}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Current Status</Label>
              <p className="text-sm text-gray-500">{selectedComplaint?.status}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned-to">Assigned To</Label>
              <p className="text-sm text-gray-500">{selectedComplaint?.assignedTo}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sla">SLA</Label>
              <p className="text-sm text-gray-500">{selectedComplaint?.sla}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a description of the complaint..."
                className="h-20"
                value={selectedComplaint?.description}
                readOnly
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setComplaintDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="default" onClick={handleEscalateComplaint}>
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Performance Review Dialog */}
      <Dialog open={performanceReviewOpen} onOpenChange={setPerformanceReviewOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Performance Review</DialogTitle>
            <DialogDescription>
              Review the performance metrics of the clusters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {performanceMetrics.map((cluster, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-lg">{cluster.cluster}</p>
                    <p className="text-sm text-gray-500">Supervisor: {cluster.supervisor}</p>
                  </div>
                  <Badge 
                    variant={cluster.avgQuality >= 9 ? "secondary" : cluster.avgQuality >= 8 ? "outline" : "destructive"}
                    className="text-sm"
                  >
                    Quality: {cluster.avgQuality}/10
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{cluster.washers}</p>
                    <p className="text-xs text-gray-600">Washers</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{cluster.washesCompleted}</p>
                    <p className="text-xs text-gray-600">Washes</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{cluster.avgQuality}</p>
                    <p className="text-xs text-gray-600">Avg Score</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{cluster.complaints}</p>
                    <p className="text-xs text-gray-600">Complaints</p>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-600">{cluster.nps}</p>
                    <p className="text-xs text-gray-600">NPS</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setPerformanceReviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}