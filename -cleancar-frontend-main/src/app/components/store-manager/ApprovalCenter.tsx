import { useRole } from "../contexts/RoleContext";
import { useApprovals, approvalPermissions } from "../contexts/ApprovalContext";
import { BackButton } from "./ui/back-button";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function ApprovalCenter() {
  const { currentRole, currentUser } = useRole();
  const { approvals, approveApproval, rejectApproval, canApprove } = useApprovals();

  // Filter approvals based on role permissions
  const filteredApprovals = approvals.filter(approval => {
    return canApprove(approval.type, currentRole);
  });

  const pendingCount = filteredApprovals.filter(a => a.status === "Pending").length;
  const approvedToday = filteredApprovals.filter(a => a.status === "Approved").length;
  const rejectedCount = filteredApprovals.filter(a => a.status === "Rejected").length;

  const handleApprove = (id: string) => {
    approveApproval(id, currentUser.name);
  };

  const handleReject = (id: string) => {
    rejectApproval(id, currentUser.name, "Rejected by approver");
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
          <p className="text-sm text-gray-500 mt-1">Centralized approval workflow management</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          {pendingCount} Pending
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold mt-1">{pendingCount}</p>
                <p className="text-xs text-orange-600 mt-1">Requires action</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved Today</p>
                <p className="text-2xl font-bold mt-1">{approvedToday}</p>
                <p className="text-xs text-green-600 mt-1">Processed</p>
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
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold mt-1">{rejectedCount}</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Priority</p>
                <p className="text-2xl font-bold mt-1">{filteredApprovals.filter(a => a.priority === "High" && a.status === "Pending").length}</p>
                <p className="text-xs text-red-600 mt-1">Urgent</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requests Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredApprovals.filter(a => a.status === "Pending").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No pending approvals</p>
                  <p className="text-gray-400 text-sm mt-1">All approval requests have been processed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApprovals.filter(a => a.status === "Pending").map((approval) => (
                  <div 
                    key={approval.id} 
                    className={`p-4 border rounded-lg ${
                      approval.priority === "High" ? "border-red-300 bg-red-50" : 
                      approval.priority === "Medium" ? "border-orange-300 bg-orange-50" : 
                      "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">{approval.type}</p>
                          <Badge 
                            variant={
                              approval.priority === "High" ? "destructive" : 
                              approval.priority === "Medium" ? "default" : 
                              "outline"
                            }
                          >
                            {approval.priority}
                          </Badge>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
                          <div className="text-gray-600">Requester: {approval.requester}</div>
                          <div className="text-gray-600">Description: {approval.description}</div>
                          <div className="text-gray-600">Requested: {new Date(approval.date).toLocaleDateString()}</div>
                          {approval.amount && (
                            <div className="text-gray-900 font-medium">Amount: ₹{approval.amount.toLocaleString()}</div>
                          )}
                        </div>
                        {approval.type === "Mobile Number Change" && (
                          <div className="mt-2 bg-blue-50 rounded p-2 text-xs text-blue-800">
                            <strong>Mobile Change Request</strong>
                            <pre className="whitespace-pre-wrap mt-1">{approval.description}</pre>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" variant="default" onClick={() => handleApprove(approval.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(approval.id)}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approved Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredApprovals.filter(a => a.status === "Approved").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No approved requests</p>
                  <p className="text-gray-400 text-sm mt-1">Approved requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApprovals.filter(a => a.status === "Approved").map((approval) => (
                  <div key={approval.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{approval.type}</p>
                          <p className="text-sm text-gray-600">
                            Requested by {approval.requester}
                            {approval.amount && ` • ₹${approval.amount.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Approved</Badge>
                        <p className="text-xs text-gray-500 mt-1">{new Date(approval.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rejected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredApprovals.filter(a => a.status === "Rejected").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <XCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No rejected requests</p>
                  <p className="text-gray-400 text-sm mt-1">Rejected requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApprovals.filter(a => a.status === "Rejected").map((approval) => (
                  <div key={approval.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center">
                          <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{approval.type}</p>
                          <p className="text-sm text-gray-600">
                            Requested by {approval.requester}
                            {approval.amount && ` • ₹${approval.amount.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">Rejected</Badge>
                        <p className="text-xs text-gray-500 mt-1">{new Date(approval.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Approval Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Amount/Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="font-medium">#{approval.id}</TableCell>
                      <TableCell>{approval.type}</TableCell>
                      <TableCell>{approval.requester}</TableCell>
                      <TableCell>
                        {approval.amount ? `₹${approval.amount.toLocaleString()}` : approval.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            approval.priority === "High" ? "destructive" :
                            approval.priority === "Medium" ? "default" :
                            "outline"
                          }
                        >
                          {approval.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{approval.approver || "—"}</TableCell>
                      <TableCell>{new Date(approval.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            approval.status === "Approved" ? "secondary" : 
                            approval.status === "Rejected" ? "destructive" : 
                            "default"
                          }
                        >
                          {approval.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}