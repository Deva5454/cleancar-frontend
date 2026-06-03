import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useRole } from "../../contexts/RoleContext";
import { useApprovals } from "../../contexts/AppProvider";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { Phone, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export function MobileChangeRequest() {
  const { currentRole, currentUser } = useRole();
  const { addApproval, approvals } = useApprovals();
  const [newMobile, setNewMobile] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mobileError, setMobileError] = useState("");

  // Find current employee
  const employees = employeeDatabaseService.getAll();
  const empId = currentUser?.employeeId || currentUser?.id || "";
  const empName = currentUser?.name || currentUser?.employeeName || currentRole;
  const currentEmployee = employees.find(
    e => empId && (e.id === empId || e.employeeId === empId ||
         e.mobile === empId || e.loginMobile === empId)
  );

  // Check if there is already a pending request
  const existingRequest = approvals.find(
    a => a.type === "Mobile Number Change"
      && a.relatedId === currentUser.employeeId
      && a.status === "Pending"
  );

  const validateMobile = (m: string) => {
    if (m.length !== 10) return "Must be exactly 10 digits";
    if (!/^[6-9]/.test(m)) return "Must start with 6, 7, 8, or 9";
    if (m === currentEmployee?.mobile) return "New number is same as current number";
    return "";
  };

  const handleSubmit = () => {
    const err = validateMobile(newMobile);
    if (err) { setMobileError(err); return; }
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }

    addApproval({
      type: "Mobile Number Change",
      requester: currentEmployee?.fullName || currentRole,
      description: `Mobile number change request\nEmployee: ${currentEmployee?.fullName}\n`
                 + `Current: ${currentEmployee?.mobile}\nNew: ${newMobile}\nReason: ${reason}`,
      priority: "Medium",
      relatedId: currentUser.employeeId,
      approver: undefined,
      // Store new mobile in description for retrieval on approval
    });

    setSubmitted(true);
    toast.success("Request submitted to City Manager for approval.");
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change Login Mobile Number</h1>
        <p className="text-sm text-gray-600 mt-1">
          Your mobile number is your login ID. Any change requires City Manager approval.
        </p>
      </div>

      {/* Current number */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Current Login Mobile</p>
          <p className="text-2xl font-bold text-blue-900 font-mono mt-1">
            {currentEmployee?.mobile
              ? currentEmployee.mobile.slice(0,5) + "XXXXX"
              : "Not set"}
          </p>
          <p className="text-xs text-blue-600 mt-1">Partial view for security</p>
        </CardContent>
      </Card>

      {/* Existing pending request */}
      {existingRequest && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Request Pending Approval</p>
              <p className="text-xs text-amber-700 mt-1">
                You already have a pending mobile change request.
                It is awaiting City Manager approval.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission success */}
      {submitted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900">Request Submitted</p>
              <p className="text-xs text-green-700 mt-1">
                Your City Manager has been notified. You will receive confirmation
                once approved. Your current number continues to work until approved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request form — only show if no pending request and not just submitted */}
      {!existingRequest && !submitted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              New Mobile Number Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>New Mobile Number <span className="text-red-500">*</span></Label>
              <Input
                type="tel" maxLength={10}
                placeholder="10-digit mobile number"
                value={newMobile}
                onChange={e => { setNewMobile(e.target.value); setMobileError(validateMobile(e.target.value)); }}
                className="mt-1.5 font-mono"
              />
              {mobileError && <p className="text-xs text-red-600 mt-1">{mobileError}</p>}
            </div>

            <div>
              <Label>Reason for Change <span className="text-red-500">*</span></Label>
              <textarea
                rows={3}
                placeholder="e.g. Lost previous SIM, changed number due to relocation..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="mt-1.5 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Important:</strong> This request will be sent to your City Manager.
                Your current mobile number will remain active until the request is approved.
                Once approved, you must use the new number to log in.
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!newMobile || newMobile.length !== 10 || !reason.trim() || !!mobileError}
              className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]"
            >
              Submit for City Manager Approval
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
