/**
 * RegularizationRequestForm.tsx — real, previously-missing screen: an
 * employee submits a regularization request for a genuine mispunch.
 * This is the only real way a correction can start - there is no
 * direct HR edit path.
 */

import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import {
  submitRegularizationRequest, resubmitRegularizationRequest,
  getEmployeeRegularizationRequests, getRegularizationPolicy, type RegularizationRequest,
} from "../../services/attendanceRegularizationService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Clock, AlertCircle } from "lucide-react";
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

export function RegularizationRequestForm() {
  const { currentUser } = useRole();
  const [refreshTick, setRefreshTick] = useState(0);
  const employeeId = currentUser?.employeeId || "";

  const employee = useMemo(() => employeeDatabaseService.getAll().find((e: any) => e.id === employeeId), [employeeId]);
  const policy = getRegularizationPolicy();

  const [date, setDate] = useState("");
  const [punchType, setPunchType] = useState<"IN" | "OUT" | "BOTH">("IN");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [reason, setReason] = useState("");

  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [resubmitComment, setResubmitComment] = useState("");

  const myRequests = getEmployeeRegularizationRequests(employeeId);

  const handleSubmit = () => {
    if (!date) { toast.error("Select the date to regularize"); return; }
    if (!reason.trim()) { toast.error("Enter a reason"); return; }
    if (punchType !== "OUT" && !checkInTime) { toast.error("Enter the check-in time"); return; }
    if (punchType !== "IN" && !checkOutTime) { toast.error("Enter the check-out time"); return; }

    if (!employee?.reportingManagerId) {
      toast.error("No reporting manager is set on your real profile — contact HR before submitting");
      return;
    }

    const result = submitRegularizationRequest({
      employeeId,
      employeeName: currentUser?.name || employee?.fullName || "Employee",
      cityId: currentUser?.cityId || "",
      date,
      punchType,
      requestedCheckInTime: punchType !== "OUT" ? checkInTime : undefined,
      requestedCheckOutTime: punchType !== "IN" ? checkOutTime : undefined,
      reason: reason.trim(),
      reportingManagerId: employee.reportingManagerId,
      reportingManagerName: employee.reportingManager,
    });

    if (result.success) {
      toast.success("Regularization request submitted to your reporting manager");
      setDate(""); setCheckInTime(""); setCheckOutTime(""); setReason("");
      setRefreshTick((t) => t + 1);
    } else {
      toast.error(result.error || "Could not submit request");
    }
  };

  const handleResubmit = (req: RegularizationRequest) => {
    if (!resubmitComment.trim()) { toast.error("Enter a comment explaining the resubmission"); return; }
    const result = resubmitRegularizationRequest(
      req.id,
      { requestedCheckInTime: req.requestedCheckInTime, requestedCheckOutTime: req.requestedCheckOutTime, reason: req.reason },
      resubmitComment.trim()
    );
    if (result.success) {
      toast.success("Resubmitted to your reporting manager");
      setResubmittingId(null); setResubmitComment("");
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
            <Clock className="w-4 h-4 text-blue-600" /> Request Attendance Regularization
          </CardTitle>
          <p className="text-xs text-gray-500">
            For a genuine missed punch only — covers the last {policy.maxDaysBack} real days, up to {policy.maxRequestsPerMonth} requests a month
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <Label>Which punch is missing?</Label>
            <Select value={punchType} onValueChange={(v: any) => setPunchType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Check-in only</SelectItem>
                <SelectItem value="OUT">Check-out only</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {punchType !== "OUT" && (
            <div>
              <Label>Requested Check-In Time</Label>
              <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            </div>
          )}
          {punchType !== "IN" && (
            <div>
              <Label>Requested Check-Out Time</Label>
              <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Reason for the missing punch</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSubmit} className="w-full">Submit Request</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Regularization Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myRequests.length === 0 ? (
            <p className="text-sm text-gray-400">No requests yet.</p>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{req.date} — {req.punchType}</p>
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
                  <Button size="sm" variant="outline" onClick={() => setResubmittingId(req.id)}>Resubmit</Button>
                )}
                {resubmittingId === req.id && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea value={resubmitComment} onChange={(e) => setResubmitComment(e.target.value)} placeholder="Why are you resubmitting?" rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleResubmit(req)}>Confirm Resubmit</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setResubmittingId(null); setResubmitComment(""); }}>Cancel</Button>
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

export default RegularizationRequestForm;
