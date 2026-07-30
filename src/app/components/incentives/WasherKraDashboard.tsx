/**
 * WasherKraDashboard.tsx — real, previously-missing screen: computes and
 * shows a washer's real KRA/KPI breakdown for the selected month, from
 * real, live job and attendance data - the pilot implementation of the
 * generic KRA engine, confirmed on Washer specifically because its
 * underlying data (jobs, attendance) is genuinely real, unlike CCE's
 * confirmed mock-data foundation.
 */

import { useState, useEffect, useMemo } from "react";
import { useJobs } from "../../contexts/JobContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useIncentive } from "../../contexts/IncentiveContext";
import { useRole } from "../../contexts/RoleContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { seedWasherKraTemplateIfMissing, computeWasherKraScores, WASHER_ROLE } from "../../services/kraWasherPilot";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import { Target } from "lucide-react";

export function WasherKraDashboard() {
  const { allJobs } = useJobs();
  const { attendanceRecords } = useAttendance();
  const { employeeIncentives } = useIncentive();
  const { currentUser } = useRole();

  const washers = useMemo(
    () => employeeDatabaseService.getAll().filter((e: any) => e.designation === WASHER_ROLE && e.status === "Active"),
    []
  );
  const [selectedWasherId, setSelectedWasherId] = useState(washers[0]?.id || "");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    seedWasherKraTemplateIfMissing(currentUser?.name || "System");
  }, [currentUser?.name]);

  const { results, totalScore } = useMemo(() => {
    if (!selectedWasherId) return { results: [], totalScore: 0 };
    return computeWasherKraScores(selectedWasherId, month, allJobs as any, attendanceRecords as any, employeeIncentives as any);
  }, [selectedWasherId, month, allJobs, attendanceRecords, employeeIncentives]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" /> Washer KRA / KPI Scorecard — Pilot
          </CardTitle>
          <p className="text-xs text-gray-500">Real, computed scores from real job and attendance data for the selected month</p>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Select value={selectedWasherId} onValueChange={setSelectedWasherId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select washer" /></SelectTrigger>
            <SelectContent>
              {washers.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.fullName || w.name} ({w.id})</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </CardContent>
      </Card>

      {selectedWasherId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Score: {totalScore}%</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((kra) => (
              <div key={kra.kraCode} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{kra.kraName} <span className="text-xs text-gray-400">({kra.kraWeight}% weight)</span></p>
                  <p className="text-sm font-semibold text-blue-700">{kra.kraScore}%</p>
                </div>
                <Progress value={Math.min(100, kra.kraScore)} className="h-2 mb-2" />
                <div className="space-y-1">
                  {kra.kpiResults.map((kpi) => (
                    <div key={kpi.kpiCode} className="flex justify-between text-xs text-gray-600">
                      <span>{kpi.kpiName}</span>
                      <span>{kpi.actual} / {kpi.target} target ({kpi.achievementPct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {results.length === 0 && <p className="text-sm text-gray-400">No KRA data — check that the template seeded correctly.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default WasherKraDashboard;
