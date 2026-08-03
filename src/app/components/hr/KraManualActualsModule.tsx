/**
 * KraManualActualsModule.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * For KPIs with no automatic real-data formula (every role beyond the
 * original 4 pilots — Car Washer/Supervisor/Operations Manager/City
 * Manager — plus any of those 4's own "not yet available" KPIs), HR or
 * the reporting manager enters the actual achieved value for a given
 * month directly. Reuses the same real saveKpiActual()/getKpiActual()
 * persistence every system-computed KPI actual already uses
 * (source: "MANUAL" vs "SYSTEM"), so scoring treats both uniformly.
 */

import { useMemo, useState } from "react";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import {
  getActiveKraTemplate, resolveEmployeeKras, getKpiCatalog, getKpiActualRecord, saveKpiActual,
} from "../../services/kraEngineService";
import { getFinancialQuarter, getQuarterInfo, listPastAndCurrentQuarters, type FinancialQuarter } from "../../services/financialQuarter";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PencilLine } from "lucide-react";
import { toast } from "sonner";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function monthsInQuarter(financialYear: string, quarter: FinancialQuarter): { key: string; label: string }[] {
  const { startDate } = getQuarterInfo(financialYear, quarter);
  const [y, m] = startDate.split("-").map(Number);
  return [0, 1, 2].map((i) => {
    const date = new Date(y, m - 1 + i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}` };
  });
}

export function KraManualActualsModule() {
  const [refresh, setRefresh] = useState(0);
  const current = getFinancialQuarter();
  const [selectedYear, setSelectedYear] = useState(current.financialYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter>(current.quarter);
  const quarterOptions = useMemo(() => listPastAndCurrentQuarters(8), []);
  const months = useMemo(() => monthsInQuarter(selectedYear, selectedQuarter), [selectedYear, selectedQuarter]);
  const [selectedMonth, setSelectedMonth] = useState(months[0]?.key || "");

  const roles = useMemo(() => {
    const set = new Set(employeeDatabaseService.getAll().filter((e) => e.status !== "Inactive" && e.designation).map((e) => e.designation));
    return Array.from(set).sort();
  }, [refresh]);
  const [selectedRole, setSelectedRole] = useState("");
  const employeesForRole = useMemo(
    () => employeeDatabaseService.getAll().filter((e) => e.designation === selectedRole && e.status !== "Inactive"),
    [selectedRole, refresh]
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const catalog = useMemo(() => getKpiCatalog(), [refresh]);
  const template = selectedRole ? getActiveKraTemplate(selectedRole, selectedYear, selectedQuarter) : undefined;
  const resolved = selectedEmployeeId && selectedRole
    ? resolveEmployeeKras(selectedEmployeeId, selectedRole, selectedYear, selectedQuarter)
    : undefined;

  const [values, setValues] = useState<Record<string, number>>({});

  const save = (kpiCode: string) => {
    const value = values[kpiCode];
    if (value === undefined) { toast.error("Enter a value first"); return; }
    saveKpiActual(selectedEmployeeId, kpiCode, selectedMonth, value, "MANUAL");
    toast.success("Saved");
    setRefresh((r) => r + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual KPI Actuals</h1>
        <p className="text-sm text-gray-500">Enter the real achieved value for KPIs that have no automatic data source yet.</p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setSelectedEmployeeId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
              <SelectContent>
                {employeesForRole.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Financial Quarter</Label>
            <Select
              value={`${selectedYear}|${selectedQuarter}`}
              onValueChange={(v) => { const [y, q] = v.split("|"); setSelectedYear(y); setSelectedQuarter(q as FinancialQuarter); setSelectedMonth(""); }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {quarterOptions.map((q) => <SelectItem key={`${q.financialYear}|${q.quarter}`} value={`${q.financialYear}|${q.quarter}`}>{q.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
              <SelectContent>{months.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedRole && !template && (
        <p className="text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-6 px-4 text-sm">
          No approved KRA structure exists yet for {selectedRole} in {selectedQuarter} FY{selectedYear}.
        </p>
      )}

      {selectedEmployeeId && resolved && selectedMonth && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><PencilLine className="w-4 h-4" /> KPI Actuals — {months.find((m) => m.key === selectedMonth)?.label}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {resolved.kras.flatMap((kra) => kra.kpis.map((kpi) => {
              const entry = catalog.find((c) => c.code === kpi.kpiCode);
              const isManual = !entry || entry.dataSource === "MANUAL_ENTRY" || entry.dataSource === "NOT_YET_AVAILABLE";
              const existing = getKpiActualRecord(selectedEmployeeId, kpi.kpiCode, selectedMonth);
              if (!isManual) {
                return (
                  <div key={kpi.kpiCode} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                    <span>{entry?.name}</span>
                    <span className="text-gray-400">Computed automatically — {existing?.actualValue ?? "not yet computed"}</span>
                  </div>
                );
              }
              return (
                <div key={kpi.kpiCode} className="flex items-center justify-between gap-2 text-sm bg-white border rounded-lg p-2">
                  <span className="flex-1">{entry?.name || kpi.kpiCode}</span>
                  <span className="text-xs text-gray-400">Target: {kpi.defaultTarget ?? "—"}</span>
                  <Input type="number" className="w-24 h-8"
                    defaultValue={existing?.actualValue}
                    onChange={(e) => setValues((prev) => ({ ...prev, [kpi.kpiCode]: Number(e.target.value) }))} />
                  <Button size="sm" onClick={() => save(kpi.kpiCode)}>Save</Button>
                </div>
              );
            }))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default KraManualActualsModule;
