import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  ArrowRight,
  FileText,
  Download,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";

interface ApprovalStage {
  id: string;
  stageName: string;
  approverRole: string;
  approverName: string;
  status: "pending" | "approved" | "rejected" | "in_progress";
  timestamp?: string;
  comments?: string;
}

interface PayrollApproval {
  id: string;
  month: string;
  totalEmployees: number;
  totalAmount: number;
  submittedBy: string;
  submittedDate: string;
  currentStage: number;
  stages: ApprovalStage[];
  status: "pending" | "approved" | "rejected" | "processing";
}

export function PayrollApprovalWorkflow() {
  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();
  const latestRun = payrollRuns[0];
  const emp = employees.find(e => e.employeeId === latestRun?.employeeId);

  const [approval, setApproval] = useState({
    id: latestRun?.payrollId || "PR-001",
    employeeId: latestRun?.employeeId || "",
    employeeName: emp ? emp.firstName + " " + emp.lastName : "No payroll data",
    month: latestRun?.month || "",
    grossSalary: latestRun?.grossSalary || 0,
    netSalary: latestRun?.netSalary || 0,
    status: latestRun?.status || "Pending",
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [comments, setComments] = useState("");
  const [isApproving, setIsApproving] = useState(true);

  const handleApprove = () => {
    const currentStage = approval.stages[approval.currentStage];
    
    setApproval({
      ...approval,
      stages: approval.stages.map((stage, index) => {
        if (index === approval.currentStage) {
          return {
            ...stage,
            status: "approved",
            timestamp: new Date().toLocaleString(),
            comments,
          };
        }
        if (index === approval.currentStage + 1) {
          return { ...stage, status: "in_progress" };
        }
        return stage;
      }),
      currentStage: approval.currentStage + 1,
      status:
        approval.currentStage === approval.stages.length - 1
          ? "approved"
          : "pending",
    });

    setShowApprovalModal(false);
    setComments("");
    toast.success(`Payroll approved by ${currentStage.approverRole}`);

    if (approval.currentStage === approval.stages.length - 1) {
      setTimeout(() => {
        toast.success("Payroll processing initiated!");
      }, 1000);
    }
  };

  const handleReject = () => {
    const currentStage = approval.stages[approval.currentStage];

    setApproval({
      ...approval,
      stages: approval.stages.map((stage, index) => {
        if (index === approval.currentStage) {
          return {
            ...stage,
            status: "rejected",
            timestamp: new Date().toLocaleString(),
            comments,
          };
        }
        return stage;
      }),
      status: "rejected",
    });

    setShowApprovalModal(false);
    setComments("");
    toast.error(`Payroll rejected by ${currentStage.approverRole}`);
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "approved":
        return "border-green-200 bg-green-50";
      case "rejected":
        return "border-red-200 bg-red-50";
      case "in_progress":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const currentStage = approval.stages[approval.currentStage];
  const canApprove = currentStage && currentStage.status === "in_progress";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Approval Workflow</h2>
          <p className="text-sm text-gray-600 mt-1">
            Multi-stage approval process for {approval.month}
          </p>
        </div>
        <Badge
          className={
            approval.status === "approved"
              ? "bg-green-100 text-green-700 border-green-200"
              : approval.status === "rejected"
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-orange-100 text-orange-700 border-orange-200"
          }
        >
          {approval.status.toUpperCase()}
        </Badge>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-blue-100">Payroll ID</p>
              <p className="text-lg font-bold">{approval.id}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Period</p>
              <p className="text-lg font-bold">{approval.month}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Employees</p>
              <p className="text-lg font-bold">{approval.totalEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Total Amount</p>
              <p className="text-lg font-bold">
                ₹{(approval.totalAmount / 100000).toFixed(2)}L
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-500 flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-100">Submitted by</p>
              <p className="font-medium">{approval.submittedBy} on {approval.submittedDate}</p>
            </div>
            {canApprove && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsApproving(false);
                    setShowApprovalModal(true);
                  }}
                  className="bg-white text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setIsApproving(true);
                    setShowApprovalModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approval.stages.map((stage, index) => (
              <div key={stage.id}>
                <Card className={getStageColor(stage.status)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                          {getStageIcon(stage.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{stage.stageName}</h4>
                            <Badge variant="outline" className="text-xs">
                              Stage {index + 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <User className="w-3 h-3 inline mr-1" />
                            {stage.approverName} ({stage.approverRole})
                          </p>
                          {stage.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">{stage.timestamp}</p>
                          )}
                          {stage.comments && (
                            <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                              💬 {stage.comments}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            stage.status === "approved"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : stage.status === "rejected"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : stage.status === "in_progress"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {stage.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < approval.stages.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg cursor-pointer transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">View Details</h3>
            <p className="text-sm text-gray-600">Review payroll breakdown</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg cursor-pointer transition-shadow">
          <CardContent className="p-6 text-center">
            <Download className="w-12 h-12 mx-auto text-green-600 mb-3" />
            <h3 className="font-semibold mb-2">Download Report</h3>
            <p className="text-sm text-gray-600">Export payroll sheet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg cursor-pointer transition-shadow">
          <CardContent className="p-6 text-center">
            <Send className="w-12 h-12 mx-auto text-purple-600 mb-3" />
            <h3 className="font-semibold mb-2">Send Reminder</h3>
            <p className="text-sm text-gray-600">Notify pending approver</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && currentStage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-bold">
                {isApproving ? "Approve Payroll" : "Reject Payroll"}
              </h3>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <Card className={isApproving ? "bg-green-50" : "bg-red-50"}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-1">Payroll: {approval.month}</p>
                  <p className="text-sm text-gray-600">
                    {approval.totalEmployees} employees • ₹
                    {(approval.totalAmount / 100000).toFixed(2)}L
                  </p>
                </CardContent>
              </Card>

              <div>
                <label className="text-sm font-medium mb-2 block">Comments</label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    isApproving
                      ? "Add approval comments (optional)"
                      : "Please provide reason for rejection *"
                  }
                  rows={4}
                />
              </div>
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={isApproving ? handleApprove : handleReject}
                className={
                  isApproving
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isApproving ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}