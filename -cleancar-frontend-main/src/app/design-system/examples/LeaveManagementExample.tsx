/**
 * Leave Management Example
 * 
 * Complete example showing how to use the design system components
 * to build a full-featured module.
 * 
 * This serves as a reference implementation for other modules.
 * 
 * @example
 */

import { useState } from "react";
import {
  PageHeader,
  StatusBadge,
  DataCard,
  ApprovalCard,
  EmptyState,
  LoadingState,
  ErrorState,
  SuccessState,
  DataTable,
  StatCard,
  InfoCard,
  FormField,
} from "../components";
import { Button } from "../../components/ui/button";
import { Calendar, Users, Clock, CheckCircle, Plus } from "lucide-react";
import { useLeaveWorkflow } from "../../hooks/useWorkflow";
import { usePermissions } from "../../hooks/usePermissions";
import { Permission } from "../../core/RolePermissionSystem";

/**
 * Complete Leave Management Module using Design System
 */
export function LeaveManagementExample() {
  const [view, setView] = useState<"list" | "approvals" | "apply" | "success">("list");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { pendingLeaves, approveLeave, rejectLeave } = useLeaveWorkflow();
  const { can } = usePermissions();
  
  // Mock data
  const leaves = [
    {
      id: "1",
      employeeName: "John Doe",
      leaveType: "Casual Leave",
      startDate: "Mar 10, 2026",
      endDate: "Mar 12, 2026",
      days: 2,
      status: "Approved",
      appliedOn: "Mar 8, 2026",
    },
    {
      id: "2",
      employeeName: "Jane Smith",
      leaveType: "Sick Leave",
      startDate: "Mar 15, 2026",
      endDate: "Mar 15, 2026",
      days: 1,
      status: "Pending",
      appliedOn: "Mar 14, 2026",
    },
  ];
  
  const stats = [
    { label: "Total Leaves", value: "48", type: "total" },
    { label: "Approved", value: "32", type: "approved" },
    { label: "Pending", value: "12", type: "pending" },
    { label: "Rejected", value: "4", type: "rejected" },
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const handleApply = () => {
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.leaveType) errors.leaveType = "Leave type is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";
    if (!formData.reason) errors.reason = "Reason is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setView("success");
      setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
      setFormErrors({});
    }, 1500);
  };
  
  const handleApprove = (leaveId: string) => {
    approveLeave(leaveId, "Approved by manager");
  };
  
  const handleReject = (leaveId: string) => {
    rejectLeave(leaveId, "Insufficient balance");
  };
  
  // Error state example
  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          type="500"
          title="Failed to load leaves"
          message={error}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 1000);
          }}
        />
      </div>
    );
  }
  
  // Loading state example
  if (isLoading && view === "list") {
    return (
      <div className="p-6">
        <LoadingState message="Loading leave data..." inCard />
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Leave Management"
        description="Manage leave requests and approvals"
        primaryAction={{
          label: "Apply for Leave",
          onClick: () => setView("apply"),
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
        breadcrumbs={[
          { label: "HR", onClick: () => {} },
          { label: "Leave Management" },
        ]}
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Leaves"
          value="48"
          icon={Calendar}
          variant="default"
          change={{ value: "+8%", type: "increase" }}
        />
        <StatCard
          label="Approved"
          value="32"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          label="Pending"
          value="12"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          label="Rejected"
          value="4"
          icon={Users}
          variant="danger"
        />
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setView("list")}
          className={`px-4 py-2 font-medium ${
            view === "list"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All Leaves
        </button>
        {can(Permission.APPROVE_LEAVE_L1) && (
          <button
            onClick={() => setView("approvals")}
            className={`px-4 py-2 font-medium ${
              view === "approvals"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pending Approvals ({pendingLeaves.length})
          </button>
        )}
      </div>
      
      {/* List View */}
      {view === "list" && (
        <>
          {leaves.length === 0 ? (
            <EmptyState
              title="No leaves found"
              description="No leave requests have been submitted yet"
              actionText="Apply for Leave"
              onAction={() => setView("apply")}
            />
          ) : (
            <DataTable
              data={leaves}
              columns={[
                { key: "employeeName", label: "Employee", sortable: true },
                { key: "leaveType", label: "Type", sortable: true },
                { key: "startDate", label: "Start Date" },
                { key: "endDate", label: "End Date" },
                { key: "days", label: "Days", align: "center" },
                {
                  key: "status",
                  label: "Status",
                  align: "center",
                  render: (status) => <StatusBadge status={status} />,
                },
                { key: "appliedOn", label: "Applied On" },
              ]}
              searchable
              searchPlaceholder="Search leaves..."
              paginated
              pageSize={10}
              onRowClick={(leave) => console.log("View leave:", leave)}
            />
          )}
        </>
      )}
      
      {/* Approvals View */}
      {view === "approvals" && (
        <>
          {pendingLeaves.length === 0 ? (
            <EmptyState
              title="No pending approvals"
              description="All leave requests have been processed"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLeaves.map((leave) => (
                <ApprovalCard
                  key={leave.id}
                  title={`Leave Request - ${leave.data.employeeName}`}
                  description={leave.data.leaveType}
                  status={leave.currentStatus}
                  metadata={{
                    "Start Date": leave.data.startDate,
                    "End Date": leave.data.endDate,
                    "Days": `${leave.data.days} days`,
                    "Reason": leave.data.reason,
                  }}
                  submittedBy={leave.data.employeeName}
                  submittedOn={leave.data.appliedOn}
                  onApprove={() => handleApprove(leave.id)}
                  onReject={() => handleReject(leave.id)}
                  canApprove={can(Permission.APPROVE_LEAVE_L1)}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Apply Form */}
      {view === "apply" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
            
            <FormField
              label="Leave Type"
              name="leaveType"
              type="select"
              value={formData.leaveType}
              onChange={(e) =>
                setFormData({ ...formData, leaveType: e.target.value })
              }
              options={[
                { value: "casual", label: "Casual Leave" },
                { value: "sick", label: "Sick Leave" },
                { value: "earned", label: "Earned Leave" },
              ]}
              required
              error={formErrors.leaveType}
            />
            
            <FormField
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
              error={formErrors.startDate}
            />
            
            <FormField
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              required
              error={formErrors.endDate}
            />
            
            <FormField
              label="Reason"
              name="reason"
              type="textarea"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Please provide a reason for your leave"
              required
              error={formErrors.reason}
              rows={3}
            />
            
            <div className="flex gap-3 pt-4">
              <Button onClick={handleApply} disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="outline" onClick={() => setView("list")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success View */}
      {view === "success" && (
        <SuccessState
          title="Leave request submitted"
          message="Your leave request has been sent for approval. You'll be notified once it's processed."
          primaryAction={{
            label: "View My Leaves",
            onClick: () => setView("list"),
          }}
          secondaryAction={{
            label: "Submit Another",
            onClick: () => setView("apply"),
          }}
        />
      )}
    </div>
  );
}

export default LeaveManagementExample;
