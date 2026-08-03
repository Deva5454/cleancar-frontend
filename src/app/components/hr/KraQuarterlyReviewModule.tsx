/**
 * KraQuarterlyReviewModule.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The real quarter-end achieved-value review step: the system fills in a
 * suggested figure for each KPI (the real computed formula for Washer/
 * Supervisor/Operations Manager/City Manager, or whatever was manually
 * entered for every other role), but the reporting manager must
 * separately register their own figure before it counts as final. They
 * can agree (same number) or move it up or down, but a comment is
 * mandatory either way — so every registered figure carries a real,
 * attributable justification rather than being a silent rubber stamp.
 *
 * Reporting managers see only their own direct reports. HR / Super Admin
 * get full oversight across every employee, same access pattern already
 * used by KraManualActualsModule.tsx.
 */

import { useMemo, useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import {
  getActiveKraTemplate, resolveEmployeeKras, getKpiCatalog,
  getSystemQuarterlyKpiValue, getKpiQuarterlyReview, submitManagerKpiQuarterlyReview,
} from "../../services/kraEngineService";
import { getFinancialQuarter, listPastAndCurrentQuarters, type FinancialQuarter } from "../../services/financialQuarter";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ClipboardCheck, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export function KraQuarterlyReviewModule() {
  const { currentUser, currentRole } = useRole();
  const { getDirectReports } = useEmployee();
  const [refresh, setRefresh] = useState(0);

  const isHRorSuperAdmin = currentRole === "HR" || currentRole === "Super Admin";
  const current = getFinancialQuarter();
  const [selectedYear, setSelectedYear] = useState(current.financialYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter>(current.quarter);
  const quarterOptions = useMemo(() => listPastAndCurrentQuarters(8), []);

  const directReports = useMemo(() => getDirectReports(currentUser?.employeeId || ""), [getDirectReports, currentUser]);
  const reviewableEmployees = useMemo(() => {
    if (isHRorSuperAdmin) return employeeDatabaseService.getAll().filter((e) => e.status !== "Inactive" && e.designation);
    return directReports;
  }, [isHRorSuperAdmin, directReports]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const employee = reviewableEmployees.find((e: any) => (e.id || e.employeeId) === selectedEmployeeId);
  const catalog = useMemo(() => getKpiCatalog(), [refresh]);

  const template = employee?.designation ? getActiveKraTemplate(employee.designation, selectedYear, selectedQuarter) : undefined;
  const resolved = employee?.designation && selectedEmployeeId
    ? resolveEmployeeKras(selectedEmployeeId, employee.designation, selectedYear, selectedQuarter)
    : undefined;

  const [drafts, setDrafts] = useState<Record<string, { value: string; comment: string }>>({});

  const save = (kpiCode: string, systemValue: number | null) => {
    const draft = drafts[kpiCode];
    const value = draft?.value !== undefined && draft.value !== "" ? Number(draft.value) : undefined;
    if (value === undefined || Number.isNaN(value)) { toast.error("Enter the achieved value first"); return; }
    if (!draft?.comment?.trim()) { toast.error("A comment is required — explain why this figure was registered"); return; }
    const result = submitManagerKpiQuarterlyReview(
      selectedEmployeeId, kpiCode, selectedYear, selectedQuarter, value, draft.comment, currentUser?.name || "Manager"
    );
    if (!result.success) { toast.error(result.error || "Could not save the review"); return; }
    toast.success("Achieved value registered");
    setDrafts((prev) => { const next = { ...prev }; delete next[kpiCode]; return next; });
    setRefresh((r) => r + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPI Quarterly Review</h1>
        <p className="text-sm text-gray-500">
          Register the real achieved value for each KPI at quarter end. You can agree with the system-suggested figure or
          adjust it up or down, but a comment is required either way.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{isHRorSuperAdmin ? "Employee" : "Direct Report"}</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
              <SelectContent>
                {reviewableEmployees.map((e: any) => (
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
              onValueChange={(v) => { const [y, q] = v.split("|"); setSelectedYear(y); setSelectedQuarter(q as FinancialQuarter); setDrafts({}); }}
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

      {reviewableEmployees.length === 0 && (
        <p className="text-center text-gray-400 py-12">No {isHRorSuperAdmin ? "employees" : "direct reports"} found.</p>
      )}

      {selectedEmployeeId && !template && (
        <p className="text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-6 px-4 text-sm">
          No approved KRA structure exists yet for {employee?.designation} in {selectedQuarter} FY{selectedYear}.
        </p>
      )}

      {selectedEmployeeId && template && resolved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4" /> {employee?.fullName || employee?.firstName} — {employee?.designation} — {selectedQuarter} FY{selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.kras.flatMap((kra) => kra.kpis.map((kpi) => {
              const entry = catalog.find((c) => c.code === kpi.kpiCode);
              const systemValue = getSystemQuarterlyKpiValue(selectedEmployeeId, kpi.kpiCode, selectedYear, selectedQuarter);
              const existingReview = getKpiQuarterlyReview(selectedEmployeeId, kpi.kpiCode, selectedYear, selectedQuarter);
              const draft = drafts[kpi.kpiCode];
              const draftValue = draft?.value ?? (existingReview ? String(existingReview.managerValue) : systemValue !== null ? String(systemValue) : "");
              const draftComment = draft?.comment ?? existingReview?.managerComment ?? "";

              return (
                <div key={kpi.kpiCode} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{entry?.name || kpi.kpiCode}</p>
                      <p className="text-xs text-gray-400">{kra.name} · Target: {kpi.defaultTarget ?? "—"}{entry?.unit ? ` ${entry.unit}` : ""}</p>
                    </div>
                    <p className="text-xs text-gray-400 text-right">
                      System-suggested: {systemValue !== null ? systemValue.toLocaleString("en-IN") : "No data yet"}
                    </p>
                  </div>

                  {existingReview && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Registered by {existingReview.reviewedBy} — "{existingReview.managerComment}"
                    </p>
                  )}
                  {!existingReview && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Pending manager registration
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 items-start">
                    <Input type="number" placeholder="Your figure" className="h-8"
                      value={draftValue}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [kpi.kpiCode]: { value: e.target.value, comment: prev[kpi.kpiCode]?.comment ?? draftComment } }))} />
                    <Textarea placeholder="Comment (required) — why this figure, even if it matches the system's" className="h-8 min-h-8 text-xs"
                      value={draft?.comment ?? draftComment}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [kpi.kpiCode]: { value: prev[kpi.kpiCode]?.value ?? draftValue, comment: e.target.value } }))} />
                    <Button size="sm" onClick={() => save(kpi.kpiCode, systemValue)}>{existingReview ? "Update" : "Register"}</Button>
                  </div>
                </div>
              );
            }))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default KraQuarterlyReviewModule;
