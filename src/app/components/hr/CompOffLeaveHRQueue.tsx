/**
 * CompOffLeaveHRQueue.tsx — real screen: HR takes an explicit, real
 * action to apply an already-double-approved comp-off request. This both
 * consumes one real earned credit (via compOffLeaveRequestService,
 * oldest first) and marks the real attendance record for that date as
 * Leave — using AttendanceContext's own real, live
 * updateAttendance/addAttendanceRecord, the same real record every other
 * screen reads, not a disconnected parallel store.
 */

import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { matchesEmployeeId } from "../../services/employeeDatabaseService";
import {
  getPendingHRCompOffApprovals, hrApplyCompOffLeave, hrRejectCompOffLeave,
} from "../../services/compOffLeaveRequestService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function CompOffLeaveHRQueue() {
  const { currentUser } = useRole();
  const { getAttendanceForDate, updateAttendance, addAttendanceRecord } = useAttendance();
  const [refreshTick, setRefreshTick] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const pending = getPendingHRCompOffApprovals(currentUser?.cityId);

  const handleApply = (req: ReturnType<typeof getPendingHRCompOffApprovals>[number]) => {
    const result = hrApplyCompOffLeave(req.id, currentUser?.name || "HR");
    if (!result.success) {
      toast.error(result.error || "Could not apply this comp-off request");
      return;
    }

    const dayRecords = getAttendanceForDate(req.date).filter((a) => matchesEmployeeId(a.employeeId, req.employeeId));
    if (dayRecords[0]) {
      updateAttendance(dayRecords[0].attendanceId, { status: "Leave" });
    } else {
      addAttendanceRecord({
        employeeId: req.employeeId,
        cityId: req.cityId,
        date: req.date,
        status: "Leave",
      } as any);
    }

    toast.success(`Comp-off applied for ${req.employeeName} on ${req.date}`);
    setRefreshTick((t) => t + 1);
  };

  const handleReject = (requestId: string) => {
    const result = hrRejectCompOffLeave(requestId, currentUser?.name || "HR", rejectComment);
    if (result.success) {
      toast.success("Request rejected — employee notified");
      setRejectingId(null); setRejectComment("");
      setRefreshTick((t) => t + 1);
    } else {
      toast.error(result.error || "Could not reject");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600" /> Pending Comp Off — HR Confirmation
        </CardTitle>
        <p className="text-xs text-gray-500">Double-approved requests — a real, explicit click both applies the leave and consumes the earned credit</p>
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
                  <p className="text-xs text-gray-500">Wants {req.date} off</p>
                  <p className="text-xs text-gray-500">Manager: {req.managerActionBy}{req.managerComment ? ` — ${req.managerComment}` : ""}</p>
                  {req.cmActionBy && (
                    <p className="text-xs text-gray-500">City Manager: {req.cmActionBy}{req.cmComment ? ` — ${req.cmComment}` : ""}</p>
                  )}
                </div>
                {rejectingId !== req.id && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApply(req)}>Apply</Button>
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
  );
}

export default CompOffLeaveHRQueue;
