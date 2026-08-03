/**
 * CompOffLeaveRequestForm.tsx — real screen: an employee applies to take
 * a day off against their real, earned comp-off balance (credited
 * automatically by holidayPayService.ts when they genuinely work a real
 * public holiday while scheduled off per the duty roster).
 */

import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { getEmployeeCompOffBalance } from "../../services/holidayPayService";
import {
  submitCompOffLeaveRequest, resubmitCompOffLeaveRequest,
  getEmployeeCompOffLeaveRequests, type CompOffLeaveRequest,
} from "../../services/compOffLeaveRequestService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Gift, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, string> = {
  "Pending Manager": "bg-amber-100 text-amber-700",
  "Manager Rejected": "bg-red-100 text-red-700",
  "Pending City Manager": "bg-amber-100 text-amber-700",
  "City Manager Rejected": "bg-red-100 text-red-700",
  "Pending HR": "bg-blue-100 text-blue-700",
  "HR Rejected": "bg-red-100 text-red-700",
  "HR Applied": "bg-green-100 text-green-700",
  "Auto-Rejected": "bg-gray-100 text-gray-600",
};
const REJECTED_STATUSES = ["Manager Rejected", "City Manager Rejected", "HR Rejected"];

export function CompOffLeaveRequestForm() {
  const { currentUser } = useRole();
  const [refreshTick, setRefreshTick] = useState(0);
  const employeeId = currentUser?.employeeId || "";

  const employee = useMemo(() => employeeDatabaseService.getAll().find((e: any) => e.id === employeeId), [employeeId]);
  const balance = getEmployeeCompOffBalance(employeeId);

  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [resubmitDate, setResubmitDate] = useState("");
  const [resubmitReason, setResubmitReason] = useState("");
  const [resubmitComment, setResubmitComment] = useState("");

  const myRequests = getEmployeeCompOffLeaveRequests(employeeId);

  const handleSubmit = () => {
    if (!date) { toast.error("Select the date you want off"); return; }
    if (!reason.trim()) { toast.error("Enter a reason"); return; }
    if (!employee?.reportingManagerId) {
      toast.error("No reporting manager is set on your real profile — contact HR before submitting");
      return;
    }

    const result = submitCompOffLeaveRequest({
      employeeId,
      employeeName: currentUser?.name || employee?.fullName || "Employee",
      cityId: currentUser?.cityId || "",
      date,
      reason: reason.trim(),
      reportingManagerId: employee.reportingManagerId,
      reportingManagerName: employee.reportingManager,
    });

    if (result.success) {
      toast.success("Comp-off request submitted to your reporting manager");
      setDate(""); setReason("");
      setRefreshTick((t) => t + 1);
    } else {
      toast.error(result.error || "Could not submit request");
    }
  };

  const handleResubmit = (req: CompOffLeaveRequest) => {
    if (!resubmitDate) { toast.error("Select the date you want off"); return; }
    if (!resubmitReason.trim()) { toast.error("Enter a reason"); return; }
    if (!resubmitComment.trim()) { toast.error("Enter a comment explaining the resubmission"); return; }
    const result = resubmitCompOffLeaveRequest(req.id, { date: resubmitDate, reason: resubmitReason.trim() }, resubmitComment.trim());
    if (result.success) {
      toast.success("Resubmitted to your reporting manager");
      setResubmittingId(null); setResubmitDate(""); setResubmitReason(""); setResubmitComment("");
      setRefreshTick((t) => t + 1);
    } else {
      toast.error(result.error || "Could not resubmit");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-blue-600" /> Apply for Comp Off
          </CardTitle>
          <p className="text-xs text-gray-500">
            You have {balance.length} real comp-off {balance.length === 1 ? "day" : "days"} available
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {balance.length === 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              No comp-off days available — you earn one automatically by working a real public holiday while genuinely scheduled off.
            </div>
          )}
          <div>
            <Label>Date you want off</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={balance.length === 0}>Submit Request</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Comp Off Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myRequests.length === 0 ? (
            <p className="text-sm text-gray-400">No requests yet.</p>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{req.date}</p>
                    {req.isResubmission && <p className="text-xs text-blue-600">Resubmission</p>}
                  </div>
                  <Badge className={STATUS_BADGE[req.status]}>{req.status}</Badge>
                </div>
                <p className="text-xs text-gray-600">{req.reason}</p>
                {req.managerComment && (
                  <p className="text-xs text-gray-500 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> Manager: {req.managerComment}
                  </p>
                )}
                {req.cmComment && (
                  <p className="text-xs text-gray-500 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> City Manager: {req.cmComment}
                  </p>
                )}
                {req.hrComment && (
                  <p className="text-xs text-gray-500 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> HR: {req.hrComment}
                  </p>
                )}
                {req.history && req.history.length > 0 && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer select-none">Full history ({req.history.length})</summary>
                    <ul className="mt-1 space-y-1 pl-3 border-l-2 border-gray-200">
                      {req.history.map((h, i) => (
                        <li key={i}>
                          <span className="font-medium">{h.stage}</span> {h.action.toLowerCase()}
                          {h.actorName ? ` by ${h.actorName}` : ""}
                          {h.comment ? ` — ${h.comment}` : ""}
                          {" · "}{new Date(h.at).toLocaleString("en-IN")}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {REJECTED_STATUSES.includes(req.status) && resubmittingId !== req.id && (
                  <Button size="sm" variant="outline" onClick={() => { setResubmittingId(req.id); setResubmitDate(req.date); setResubmitReason(req.reason); }}>Resubmit</Button>
                )}
                {resubmittingId === req.id && (
                  <div className="space-y-2 pt-2 border-t">
                    <div>
                      <Label>Date you want off</Label>
                      <Input type="date" value={resubmitDate} onChange={(e) => setResubmitDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Textarea value={resubmitReason} onChange={(e) => setResubmitReason(e.target.value)} rows={2} />
                    </div>
                    <Textarea value={resubmitComment} onChange={(e) => setResubmitComment(e.target.value)} placeholder="Why are you resubmitting?" rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleResubmit(req)}>Confirm Resubmit</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setResubmittingId(null); setResubmitDate(""); setResubmitReason(""); setResubmitComment(""); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CompOffLeaveRequestForm;
