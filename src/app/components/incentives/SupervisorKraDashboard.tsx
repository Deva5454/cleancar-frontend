/**
 * SupervisorKraDashboard.tsx — real, previously-missing screen: Washer,
 * Operations Manager, and City Manager all had a KRA scorecard pilot;
 * Supervisor did not, despite IncentiveConfiguration.tsx already defining a
 * full SupervisorIncentiveRules KPI weight structure for them. Conversion
 * and Retention are genuinely computed from real subscription data (the
 * same real functions supervisorIncentiveService.ts's real-money incentive
 * calculation already uses). Audit Compliance and Customer Complaint SLA
 * are honestly shown as not yet available, rather than a fabricated score.
 */

import { useState, useEffect, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { seedSupervisorKraTemplateIfMissing, computeSupervisorKraScores, SUPERVISOR_ROLE } from "../../services/kraSupervisorPilot";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import { AlertCircle, Target } from "lucide-react";

export function SupervisorKraDashboard() {
  const { currentUser } = useRole();

  const supervisors = useMemo(
    () => employeeDatabaseService.getAll().filter((e: any) => e.designation === SUPERVISOR_ROLE && e.status === "Active"),
    []
  );
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(supervisors[0]?.id || "");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    seedSupervisorKraTemplateIfMissing(currentUser?.name || "System");
  }, [currentUser?.name]);

  const { results, totalScore, realWeightCovered } = useMemo(() => {
    if (!selectedSupervisorId) return { results: [], totalScore: null as number | null, realWeightCovered: 0 };
    return computeSupervisorKraScores(selectedSupervisorId, month);
  }, [selectedSupervisorId, month]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" /> Supervisor KRA / KPI Scorecard — Pilot
          </CardTitle>
          <p className="text-xs text-gray-500">Conversion and Retention are real, computed from actual subscription records</p>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select supervisor" /></SelectTrigger>
            <SelectContent>
              {supervisors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.fullName || s.name} ({s.id})</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </CardContent>
      </Card>

      {selectedSupervisorId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {totalScore !== null ? `Partial Score: ${totalScore}%` : "No real data available yet"}
            </CardTitle>
            <p className="text-xs text-gray-500">
              {realWeightCovered < 100
                ? `Based on ${realWeightCovered}% of the real KRA structure — the remaining ${100 - realWeightCovered}% has no real data source yet, and is honestly excluded rather than counted as zero.`
                : "Based on the complete real KRA structure."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((kra) => (
              <div key={kra.kraCode} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{kra.kraName} <span className="text-xs text-gray-400">({kra.kraWeight}% weight)</span></p>
                  {kra.kraScore !== null ? (
                    <p className="text-sm font-semibold text-blue-700">{kra.kraScore}%</p>
                  ) : (
                    <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Not yet available
                    </p>
                  )}
                </div>
                {kra.kraScore !== null ? (
                  <Progress value={Math.min(100, kra.kraScore)} className="h-2 mb-2" />
                ) : (
                  <div className="h-2 mb-2 bg-amber-100 rounded" />
                )}
                <div className="space-y-1">
                  {kra.kpiResults.map((kpi) => (
                    <div key={kpi.kpiCode} className="flex justify-between text-xs text-gray-600">
                      <span>{kpi.kpiName}</span>
                      <span>{kpi.actual !== null ? `${kpi.actual}${"%"} / ${kpi.target}% target (${kpi.achievementPct}%)` : "No real data source yet"}</span>
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

export default SupervisorKraDashboard;
