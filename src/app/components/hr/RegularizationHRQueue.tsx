/**
 * RegularizationHRQueue.tsx — real, previously-missing screen: HR takes
 * an explicit, real action to apply a manager-approved regularization to
 * the actual attendance record. Never automatic, even after the manager
 * has approved.
 *
 * This deliberately uses AttendanceContext's own real, live
 * updateAttendance/addAttendanceRecord - confirmed directly that
 * AttendanceService's applyApprovedCorrection() writes to a completely
 * different, disconnected storage key (ATTENDANCE_MASTER) than the real
 * data (ATTENDANCE_RECORDS) that AttendanceContext itself describes as
 * "the ONLY source of attendance for payroll." Using that older path
 * here would have made this screen look like it worked while never
 * actually correcting the real record anyone else sees.
 */

import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { matchesEmployeeId } from "../../services/employeeDatabaseService";
import {
  getPendingHRApprovals, markRegularizationHRApplied, hrRejectRegularization, getRegularizationPolicy, setRegularizationPolicy,
} from "../../services/attendanceRegularizationService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CheckCircle, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";

export function RegularizationHRQueue() {
  const { currentUser } = useRole();
  const { getAttendanceForDate, updateAttendance, addAttendanceRecord } = useAttendance();
  const [refreshTick, setRefreshTick] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const pending = getPendingHRApprovals(currentUser?.cityId);

  const handleApply = (req: ReturnType<typeof getPendingHRApprovals>[number]) => {
    // Real, genuine application to the actual attendance record - find
    // the real record for this employee and date, update it if it
    // exists, or create a real one if it genuinely doesn't.
    const dayRecords = getAttendanceForDate(req.date).filter((a) => matchesEmployeeId(a.employeeId, req.employeeId));
    const updates: any = { status: "Present" };
    if (req.requestedCheckInTime) updates.checkInTime = `${req.requestedCheckInTime}:00`;
    if (req.requestedCheckOutTime) updates.checkOutTime = `${req.requestedCheckOutTime}:00`;

    if (dayRecords[0]) {
      updateAttendance(dayRecords[0].attendanceId, updates);
    } else {
      addAttendanceRecord({
        employeeId: req.employeeId,
        cityId: req.cityId,
        date: req.date,
        status: "Present",
        checkInTime: updates.checkInTime,
        checkOutTime: updates.checkOutTime,
      } as any);
    }

    markRegularizationHRApplied(req.id, currentUser?.name || "HR");
    toast.success(`Attendance corrected for ${req.employeeName} on ${req.date}`);
    setRefreshTick((t) => t + 1);
  };

  const handleReject = (requestId: string) => {
    const result = hrRejectRegularization(requestId, currentUser?.name || "HR", rejectComment);
    if (result.success) {
      toast.success("Request rejected — employee notified");
      setRejectingId(null); setRejectComment("");
      setRefreshTick((t) => t + 1);
    } else {
      toast.error(result.error || "Could not reject");
    }
  };

  const policy = getRegularizationPolicy();
  const [maxDaysBack, setMaxDaysBack] = useState(String(policy.maxDaysBack));
  const [maxPerMonth, setMaxPerMonth] = useState(String(policy.maxRequestsPerMonth));

  const handleSavePolicy = () => {
    setRegularizationPolicy({
      maxDaysBack: parseInt(maxDaysBack, 10) || 7,
      maxRequestsPerMonth: parseInt(maxPerMonth, 10) || 3,
    });
    toast.success("Real policy updated — applies to every employee");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" /> Pending HR Confirmation
          </CardTitle>
          <p className="text-xs text-gray-500">Manager-approved requests — a real, explicit click is required to apply each one</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing pending.</p>
          ) : (
            pending.map((req) => (
              <div key={req.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{req.employeeName}</p>
                    <p className="text-xs text-gray-500">{req.date} · {req.punchType}
                      {req.requestedCheckInTime && ` · In: ${req.requestedCheckInTime}`}
                      {req.requestedCheckOutTime && ` · Out: ${req.requestedCheckOutTime}`}
                    </p>
                    <p className="text-xs text-gray-500">Manager: {req.managerActionBy}{req.managerComment ? ` — ${req.managerComment}` : ""}</p>
                    {req.cmActionBy && (
                      <p className="text-xs text-gray-500">City Manager: {req.cmActionBy}{req.cmComment ? ` — ${req.cmComment}` : ""}</p>
                    )}
                  </div>
                  {rejectingId !== req.id && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApply(req)}>Apply Correction</Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(req.id)}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
                {rejectingId === req.id && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Reason for rejection (required)" rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>Confirm Reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectComment(""); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600" /> Regularization Policy
          </CardTitle>
          <p className="text-xs text-gray-500">Applies the same way to every real employee</p>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div>
            <Label>Max Days Back</Label>
            <Input type="number" min="1" value={maxDaysBack} onChange={(e) => setMaxDaysBack(e.target.value)} className="w-24" />
          </div>
          <div>
            <Label>Max Requests / Month</Label>
            <Input type="number" min="1" value={maxPerMonth} onChange={(e) => setMaxPerMonth(e.target.value)} className="w-24" />
          </div>
          <Button onClick={handleSavePolicy}>Save Policy</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegularizationHRQueue;
