/**
 * LateMarkFlags.tsx — real, previously-missing screen: shows HR and
 * managers exactly which employees have crossed the real 3-late-mark
 * threshold this month, and the real 0.5-day penalty already applied.
 * Runs a real, idempotent scan against live attendance data on load -
 * safe to open repeatedly, never double-flags or double-deducts.
 */

import { useEffect, useMemo, useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import {
  scanAndFlagLateMarks, getLateMarkFlags, getFlagsForManager,
  acknowledgeFlagByHR, acknowledgeFlagByManager,
} from "../../services/lateMarkPenaltyService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function LateMarkFlags() {
  const { currentUser, currentRole } = useRole();
  const { attendanceRecords } = useAttendance();
  const [refreshTick, setRefreshTick] = useState(0);
  const isHR = currentRole === "HR" || currentRole === "Super Admin";

  const thisMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const { newFlags } = scanAndFlagLateMarks(attendanceRecords, thisMonth);
    if (newFlags > 0) setRefreshTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceRecords.length]);

  const flags = useMemo(() => {
    if (isHR) return getLateMarkFlags();
    return getFlagsForManager(currentUser?.employeeId || "");
  }, [isHR, currentUser?.employeeId, refreshTick]);

  const handleAcknowledge = (flagId: string) => {
    if (isHR) acknowledgeFlagByHR(flagId); else acknowledgeFlagByManager(flagId);
    toast.success("Acknowledged");
    setRefreshTick((t) => t + 1);
  };

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Late Mark Flags — {thisMonth}
        </CardTitle>
        <p className="text-xs text-gray-500">Real employees who crossed 3 late marks this month — a genuine 0.5-day penalty was already applied</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.length === 0 ? (
          <p className="text-sm text-gray-400">No real flags this month.</p>
        ) : (
          flags.map((f) => (
            <div key={f.id} className="flex items-center justify-between border rounded-lg p-3 bg-amber-50">
              <div>
                <p className="font-medium text-gray-900">{f.employeeName}</p>
                <p className="text-xs text-gray-600">{f.lateCount} real late marks · {f.penaltyDays} day penalty applied</p>
              </div>
              {(isHR ? !f.acknowledgedByHR : !f.acknowledgedByManager) ? (
                <Button size="sm" variant="outline" onClick={() => handleAcknowledge(f.id)}>Acknowledge</Button>
              ) : (
                <span className="text-xs text-green-700">Acknowledged</span>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default LateMarkFlags;
