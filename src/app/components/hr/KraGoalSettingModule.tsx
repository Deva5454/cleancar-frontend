/**
 * KraGoalSettingModule.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The reporting manager's real "goal setting" step: once a role's KRA
 * structure is Active for a quarter (KraAuthoringModule.tsx + Super Admin
 * approval), the reporting manager sets real per-KPI target numbers for
 * each of their direct reports for that quarter and finalizes them — a
 * lighter action than the KRA structure's own approval, since only the
 * structure itself needs the Super Admin gate.
 */

import { useMemo, useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import {
  getActiveKraTemplate, resolveEmployeeKras, saveEmployeeKraAssignment, finalizeEmployeeKraAssignment,
  getKpiCatalog, type KraOverride,
} from "../../services/kraEngineService";
import { getFinancialQuarter, listPastAndCurrentQuarters, type FinancialQuarter } from "../../services/financialQuarter";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Target } from "lucide-react";
import { toast } from "sonner";

export function KraGoalSettingModule() {
  const { currentUser } = useRole();
  const { getDirectReports } = useEmployee();
  const [refresh, setRefresh] = useState(0);
  const current = getFinancialQuarter();
  const [selectedYear, setSelectedYear] = useState(current.financialYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter>(current.quarter);
  const quarterOptions = useMemo(() => listPastAndCurrentQuarters(8), []);

  const directReports = useMemo(
    () => getDirectReports(currentUser?.employeeId || ""),
    [getDirectReports, currentUser]
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const employee = directReports.find((e: any) => (e.id || e.employeeId) === selectedEmployeeId);
  const catalog = useMemo(() => getKpiCatalog(), [refresh]);

  const template = employee?.designation ? getActiveKraTemplate(employee.designation, selectedYear, selectedQuarter) : undefined;
  const resolved = employee?.designation
    ? resolveEmployeeKras(selectedEmployeeId, employee.designation, selectedYear, selectedQuarter)
    : undefined;

  const [targets, setTargets] = useState<Record<string, number>>({});
  const effectiveTargets = (kraCode: string, kpiCode: string, fallback: number) =>
    targets[`${kraCode}:${kpiCode}`] ?? fallback;

  const loadEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setTargets({});
  };

  const finalize = () => {
    if (!employee?.designation || !template || !resolved) return;
    const overrides: KraOverride[] = resolved.kras.flatMap((kra) =>
      kra.kpis.map((kpi) => ({
        action: "SET_KPI_TARGET" as const,
        kraCode: kra.kraCode,
        kpiCode: kpi.kpiCode,
        newTarget: effectiveTargets(kra.kraCode, kpi.kpiCode, kpi.defaultTarget ?? 0),
      }))
    );
    const saveResult = saveEmployeeKraAssignment(
      selectedEmployeeId, employee.designation, template.id, overrides,
      currentUser?.name || "Manager", selectedYear, selectedQuarter
    );
    if (!saveResult.success || !saveResult.assignment) { toast.error(saveResult.error || "Could not save goals"); return; }
    finalizeEmployeeKraAssignment(saveResult.assignment.id, currentUser?.name || "Manager");
    toast.success(`Goals finalized for ${employee.fullName || employee.firstName} for ${selectedQuarter} FY${selectedYear}`);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Goal Setting</h1>
        <p className="text-sm text-gray-500">Set real per-KPI targets for your direct reports, based on their role's approved KRA structure for the quarter.</p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={loadEmployee}>
              <SelectTrigger><SelectValue placeholder="Select a direct report" /></SelectTrigger>
              <SelectContent>
                {directReports.map((e: any) => (
                  <SelectItem key={e.id || e.employeeId} value={e.id || e.employeeId}>
                    {e.fullName || `${e.firstName} ${e.lastName}`} — {e.designation || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Financial Quarter</Label>
            <Select
              value={`${selectedYear}|${selectedQuarter}`}
              onValueChange={(v) => { const [y, q] = v.split("|"); setSelectedYear(y); setSelectedQuarter(q as FinancialQuarter); setTargets({}); }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {quarterOptions.map((q) => (
                  <SelectItem key={`${q.financialYear}|${q.quarter}`} value={`${q.financialYear}|${q.quarter}`}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {directReports.length === 0 && (
        <p className="text-center text-gray-400 py-12">No direct reports found.</p>
      )}

      {selectedEmployeeId && !template && (
        <p className="text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-6 px-4 text-sm">
          No approved KRA structure exists yet for {employee?.designation} in {selectedQuarter} FY{selectedYear} — HR needs to author one and get it approved first.
        </p>
      )}

      {selectedEmployeeId && template && resolved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <Target className="w-4 h-4" /> {employee?.fullName || employee?.firstName} — {employee?.designation}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.kras.map((kra) => (
              <div key={kra.kraCode} className="border rounded-lg p-3">
                <div className="flex justify-between text-sm font-medium mb-1.5">
                  <span>{kra.name}</span>
                  <span className="text-gray-400">{kra.weight}%</span>
                </div>
                {kra.kpis.map((kpi) => {
                  const entry = catalog.find((c) => c.code === kpi.kpiCode);
                  return (
                    <div key={kpi.kpiCode} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded p-2 mb-1">
                      <span className="flex-1">{entry?.name || kpi.kpiCode}</span>
                      <span className="text-gray-400">Target:</span>
                      <Input type="number" className="w-24 h-7"
                        value={effectiveTargets(kra.kraCode, kpi.kpiCode, kpi.defaultTarget ?? 0)}
                        onChange={(e) => setTargets((prev) => ({ ...prev, [`${kra.kraCode}:${kpi.kpiCode}`]: Number(e.target.value) }))} />
                      <span className="text-gray-400">{entry?.unit}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <Button className="w-full" onClick={finalize}>Finalize Goals for {selectedQuarter} FY{selectedYear}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default KraGoalSettingModule;
