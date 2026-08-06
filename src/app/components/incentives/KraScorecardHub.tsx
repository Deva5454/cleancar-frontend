/**
 * KraScorecardHub.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The real, consolidated "one tab, switch roles" KRA scorecard — replaces
 * the 4 separate Washer/Operations Manager/City Manager/Supervisor
 * screens (and extends coverage to every other role/designation in the
 * company, via manually-entered KPI actuals where no real-data formula
 * exists yet).
 *
 * Washer/Supervisor/Operations Manager/City Manager keep their existing,
 * real per-role computation (kraWasherPilot.ts / kraSupervisorPilot.ts /
 * kraOMPilot.ts / kraCityPilot.ts) sourced from live job/attendance/
 * revenue/subscription data. CCE (kraCCEPilot.ts) is scored at the CITY
 * level from the real cleancar_complaints records (resolution rate,
 * CSAT, SLA compliance) — real per-CCE-employee attribution doesn't
 * reliably exist for complaints created going forward, only in
 * historical seed data, so this pilot is city-scoped like OM/City
 * Manager rather than per-employee (a deliberate, confirmed decision).
 * This screen just presents all of these (plus every other role) through
 * one shared shell instead of separate pages. Every other role reads
 * whatever KPI actuals exist for the picked month (system-computed where
 * a formula exists, manually entered otherwise via
 * KraManualActualsModule.tsx) against the quarter's approved KRA targets.
 *
 * Access: HR / Super Admin see every role and employee. Everyone else
 * sees only themselves and (if they have any) their direct reports.
 */

import { useEffect, useMemo, useState } from "react";
import { useJobs } from "../../contexts/JobContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useIncentive } from "../../contexts/IncentiveContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { WASHER_ROLE, computeWasherKraScores, seedWasherKpiCatalogIfMissing } from "../../services/kraWasherPilot";
import { SUPERVISOR_ROLE, computeSupervisorKraScores, seedSupervisorKpiCatalogIfMissing } from "../../services/kraSupervisorPilot";
import { OM_ROLE, computeOMKraScores, seedOMKpiCatalogIfMissing } from "../../services/kraOMPilot";
import { CITY_ROLE, computeCityKraScores, maskKraResultForCityManager, seedCityKpiCatalogIfMissing } from "../../services/kraCityPilot";
import { CCE_ROLE, computeCCEKraScores, seedCCEKpiCatalogIfMissing, type CCEComplaintLike } from "../../services/kraCCEPilot";
import { ACCOUNTS_ROLE, computeAccountsKraScores, seedAccountsKpiCatalogIfMissing } from "../../services/kraAccountsPilot";
import { STORE_ROLE, computeStoreKraScores, seedStoreKpiCatalogIfMissing, readMonthEndVerifications } from "../../services/kraStorePilot";
import { PROCUREMENT_ROLE, computeProcurementKraScores, seedProcurementKpiCatalogIfMissing } from "../../services/kraProcurementPilot";
import { seedTSEKpiCatalogIfMissing } from "../../services/kraTSEPilot";
import { seedTSMKpiCatalogIfMissing } from "../../services/kraTSMPilot";
import { seedSalesHeadKpiCatalogIfMissing } from "../../services/kraSalesHeadPilot";
import { seedSalesManagerKpiCatalogIfMissing } from "../../services/kraSalesManagerPilot";
import { seedClusterManagerKpiCatalogIfMissing } from "../../services/kraClusterManagerPilot";
import { seedHRKpiCatalogIfMissing } from "../../services/kraHRPilot";
import { getActiveKraTemplate, resolveEmployeeKras, getKpiCatalog, getKpiActual, getEffectiveQuarterlyKpiValue } from "../../services/kraEngineService";
import { getFinancialQuarter } from "../../services/financialQuarter";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Target, AlertCircle, CheckCircle, XCircle, MinusCircle } from "lucide-react";

const CITY_LEVEL_ROLES = new Set([OM_ROLE, CITY_ROLE, CCE_ROLE, ACCOUNTS_ROLE, STORE_ROLE, PROCUREMENT_ROLE]);
const ALL_CITIES = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"];

function readComplaints(): CCEComplaintLike[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("cleancar_complaints") : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const STATUS_ICON: Record<string, JSX.Element> = {
  "Met": <CheckCircle className="w-4 h-4 text-green-600" />,
  "Partially Met": <MinusCircle className="w-4 h-4 text-amber-600" />,
  "Not Met": <XCircle className="w-4 h-4 text-red-600" />,
  "Not Available": <AlertCircle className="w-4 h-4 text-gray-400" />,
};

interface GenericKpiRow { kpiCode: string; kpiName: string; actual: number | null; target: number; achievementPct: number | null; source?: "SYSTEM" | "MANUAL"; }
interface GenericKraRow { kraCode: string; kraName: string; kraWeight: number; kpis: GenericKpiRow[]; kraScore: number | null; }

export function KraScorecardHub() {
  const { currentUser, currentRole } = useRole();
  const { getDirectReports } = useEmployee();
  const { allJobs } = useJobs();
  const { attendanceRecords } = useAttendance();
  const { employeeIncentives } = useIncentive();
  const { subscriptions } = useCustomerSubscriptions();
  const { customers } = useCustomers();
  const { getRevenueByCity, getPayablesByCity } = useFinance();

  const isHRorSuperAdmin = currentRole === "HR" || currentRole === "Super Admin";
  const directReports = useMemo(() => getDirectReports(currentUser?.employeeId || ""), [getDirectReports, currentUser]);

  const roles = useMemo(() => {
    if (isHRorSuperAdmin) {
      return Array.from(new Set(employeeDatabaseService.getAll().filter((e) => e.status !== "Inactive" && e.designation).map((e) => e.designation))).sort();
    }
    const own = currentUser?.employeeId ? employeeDatabaseService.getById(currentUser.employeeId) : undefined;
    const set = new Set<string>();
    if (own?.designation) set.add(own.designation);
    directReports.forEach((e: any) => e.designation && set.add(e.designation));
    return Array.from(set).sort();
  }, [isHRorSuperAdmin, currentUser, directReports]);

  const [selectedRole, setSelectedRole] = useState("");
  const isCityLevel = CITY_LEVEL_ROLES.has(selectedRole);

  const employeesForRole = useMemo(() => {
    if (isHRorSuperAdmin) return employeeDatabaseService.getAll().filter((e) => e.designation === selectedRole && e.status !== "Inactive");
    const own = currentUser?.employeeId ? employeeDatabaseService.getById(currentUser.employeeId) : undefined;
    const list = [own, ...directReports].filter((e: any) => e && e.designation === selectedRole);
    return list as any[];
  }, [isHRorSuperAdmin, selectedRole, currentUser, directReports]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const cityChoices = isHRorSuperAdmin ? ALL_CITIES : [currentUser?.cityId || ALL_CITIES[0]];
  const [selectedCityId, setSelectedCityId] = useState(cityChoices[0]);

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const quarterForMonth = useMemo(() => getFinancialQuarter(new Date(`${month}-01T00:00:00`)), [month]);

  useEffect(() => {
    // Real fix: these seed functions existed but were never actually
    // called anywhere after the 4 old per-role dashboards were deleted —
    // without this, a fresh environment's KPI catalog never gets the
    // real, formula-linked entries HR should pick from when authoring a
    // KRA (an HR user typing a KPI name by hand instead would silently
    // create a MANUAL_ENTRY duplicate, disconnected from the real
    // computed formula). Idempotent — each function only inserts an
    // entry if its code isn't already present.
    seedWasherKpiCatalogIfMissing();
    seedSupervisorKpiCatalogIfMissing();
    seedOMKpiCatalogIfMissing();
    seedCityKpiCatalogIfMissing();
    seedCCEKpiCatalogIfMissing();
    seedAccountsKpiCatalogIfMissing();
    seedStoreKpiCatalogIfMissing();
    seedProcurementKpiCatalogIfMissing();
    seedTSEKpiCatalogIfMissing();
    seedTSMKpiCatalogIfMissing();
    seedSalesHeadKpiCatalogIfMissing();
    seedSalesManagerKpiCatalogIfMissing();
    seedClusterManagerKpiCatalogIfMissing();
    seedHRKpiCatalogIfMissing();
  }, []);

  const catalog = useMemo(() => getKpiCatalog(), [selectedRole]);
  const entries = useMemo(() => (selectedRole === OM_ROLE || selectedRole === CITY_ROLE) ? getRevenueByCity(selectedCityId) : [], [selectedRole, getRevenueByCity, selectedCityId]);
  const journals = useMemo(() => selectedRole === CITY_ROLE ? accountingEntryService.getAllJournals() : [], [selectedRole]);
  const ledgers = useMemo(() => selectedRole === CITY_ROLE ? accountingEntryService.getLedgers() : [], [selectedRole]);
  const complaints = useMemo(() => selectedRole === CCE_ROLE ? readComplaints() : [], [selectedRole]);
  const payables = useMemo(() => (selectedRole === ACCOUNTS_ROLE || selectedRole === PROCUREMENT_ROLE) ? getPayablesByCity(selectedCityId) : [], [selectedRole, getPayablesByCity, selectedCityId]);
  const monthEndRecords = useMemo(() => selectedRole === STORE_ROLE ? readMonthEndVerifications() : [], [selectedRole]);

  // ── Real per-role computation, reusing each pilot's own formula ──
  const washerResult = useMemo(() => {
    if (selectedRole !== WASHER_ROLE || !selectedEmployeeId) return null;
    return computeWasherKraScores(selectedEmployeeId, month, allJobs as any, attendanceRecords as any, employeeIncentives as any);
  }, [selectedRole, selectedEmployeeId, month, allJobs, attendanceRecords, employeeIncentives]);

  const supervisorResult = useMemo(() => {
    if (selectedRole !== SUPERVISOR_ROLE || !selectedEmployeeId) return null;
    return computeSupervisorKraScores(selectedEmployeeId, month);
  }, [selectedRole, selectedEmployeeId, month]);

  const omResult = useMemo(() => {
    if (selectedRole !== OM_ROLE) return null;
    return computeOMKraScores(selectedCityId, month, entries as any, subscriptions as any, customers as any);
  }, [selectedRole, selectedCityId, month, entries, subscriptions, customers]);

  const cceResult = useMemo(() => {
    if (selectedRole !== CCE_ROLE) return null;
    return computeCCEKraScores(selectedCityId, month, complaints);
  }, [selectedRole, selectedCityId, month, complaints]);

  const cityResult = useMemo(() => {
    if (selectedRole !== CITY_ROLE) return null;
    return computeCityKraScores(selectedCityId, month, entries as any, subscriptions as any, customers as any, journals as any, ledgers as any);
  }, [selectedRole, selectedCityId, month, entries, subscriptions, customers, journals, ledgers]);

  const accountsResult = useMemo(() => {
    if (selectedRole !== ACCOUNTS_ROLE) return null;
    return computeAccountsKraScores(selectedCityId, month, payables as any);
  }, [selectedRole, selectedCityId, month, payables]);

  const storeResult = useMemo(() => {
    if (selectedRole !== STORE_ROLE) return null;
    return computeStoreKraScores(selectedCityId, month, monthEndRecords);
  }, [selectedRole, selectedCityId, month, monthEndRecords]);

  const procurementResult = useMemo(() => {
    if (selectedRole !== PROCUREMENT_ROLE) return null;
    return computeProcurementKraScores(selectedCityId, month, payables as any);
  }, [selectedRole, selectedCityId, month, payables]);

  // ── Generic path: any other role, reads whatever actuals exist (manual or system) ──
  const genericResult: { results: GenericKraRow[]; totalScore: number | null; realWeightCovered: number } | null = useMemo(() => {
    if (!selectedRole || CITY_LEVEL_ROLES.has(selectedRole) || selectedRole === WASHER_ROLE || selectedRole === SUPERVISOR_ROLE || !selectedEmployeeId) return null;
    const { kras } = resolveEmployeeKras(selectedEmployeeId, selectedRole, quarterForMonth.financialYear, quarterForMonth.quarter);
    const results: GenericKraRow[] = kras.map((kra) => {
      const kpis: GenericKpiRow[] = kra.kpis.map((link) => {
        const entry = catalog.find((c) => c.code === link.kpiCode);
        const actualRecord = getKpiActual(selectedEmployeeId, link.kpiCode, month);
        const target = link.defaultTarget || 1;
        if (actualRecord === undefined) return { kpiCode: link.kpiCode, kpiName: entry?.name || link.kpiCode, actual: null, target, achievementPct: null };
        const achievementPct = Math.min(150, Math.round((actualRecord / target) * 100));
        return { kpiCode: link.kpiCode, kpiName: entry?.name || link.kpiCode, actual: actualRecord, target, achievementPct };
      });
      const available = kpis.filter((k) => k.achievementPct !== null);
      const kraScore = available.length > 0 ? Math.round(available.reduce((s, k) => s + (k.achievementPct as number), 0) / available.length) : null;
      return { kraCode: kra.kraCode, kraName: kra.name, kraWeight: kra.weight, kpis, kraScore };
    });
    const scored = results.filter((r) => r.kraScore !== null);
    const realWeightCovered = scored.reduce((s, r) => s + r.kraWeight, 0);
    const totalScore = realWeightCovered > 0 ? Math.round(scored.reduce((s, r) => s + (r.kraScore as number) * (r.kraWeight / realWeightCovered), 0)) : null;
    return { results, totalScore, realWeightCovered };
  }, [selectedRole, selectedEmployeeId, month, quarterForMonth, catalog]);

  const activeTemplate = selectedRole ? getActiveKraTemplate(selectedRole, quarterForMonth.financialYear, quarterForMonth.quarter) : undefined;
  const maskCityFigures = selectedRole === CITY_ROLE && currentRole === "City Manager";

  // ── Quarter-end effective value (manager-reviewed if registered, else system-suggested) per KPI ──
  const reviewSubjectId = isCityLevel ? selectedCityId : selectedEmployeeId;
  const quarterlyFor = (kpiCode: string) => {
    if (!reviewSubjectId) return undefined;
    return getEffectiveQuarterlyKpiValue(reviewSubjectId, kpiCode, quarterForMonth.financialYear, quarterForMonth.quarter);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KRA / KPI Scorecard</h1>
        <p className="text-sm text-gray-500">Real, computed scores for the selected month, against the quarter's approved KRA structure.</p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setSelectedEmployeeId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {isCityLevel ? (
            <div>
              <Label>City</Label>
              <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cityChoices.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employeesForRole.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Month</Label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm h-9" />
          </div>
        </CardContent>
      </Card>

      {selectedRole && !activeTemplate && (
        <p className="text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-6 px-4 text-sm">
          No approved KRA structure exists yet for {selectedRole} in {quarterForMonth.label} — HR needs to author one (KRA Authoring) and Super Admin needs to approve it first.
        </p>
      )}

      {activeTemplate && (selectedEmployeeId || isCityLevel) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              {selectedRole} — {quarterForMonth.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {washerResult && washerResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}
            {supervisorResult && supervisorResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}
            {omResult && omResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}
            {cceResult && cceResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}
            {accountsResult && accountsResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}
            {storeResult && storeResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}
            {procurementResult && procurementResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}
            {cityResult && cityResult.results.map((kra) => {
              if (!maskCityFigures) {
                return <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                  kpis={kra.kpiResults.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />;
              }
              const masked = maskKraResultForCityManager(kra);
              return (
                <div key={kra.kraCode} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{masked.kraName} <span className="text-xs text-gray-400">({masked.kraWeight}% weight)</span></p>
                    <p className="text-xs font-medium flex items-center gap-1">{STATUS_ICON[masked.status]} {masked.status}</p>
                  </div>
                </div>
              );
            })}
            {genericResult && genericResult.results.map((kra) => (
              <KraBlock key={kra.kraCode} name={kra.kraName} weight={kra.kraWeight} score={kra.kraScore}
                kpis={kra.kpis.map((k) => ({ name: k.kpiName, actual: k.actual, target: k.target, pct: k.achievementPct, quarterly: quarterlyFor(k.kpiCode) }))} />
            ))}

            {!washerResult && !supervisorResult && !omResult && !cceResult && !cityResult && !accountsResult && !storeResult && !procurementResult && !genericResult && (
              <p className="text-sm text-gray-400 text-center py-6">Select an employee to see their scorecard.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KraBlock({ name, weight, score, kpis }: {
  name: string; weight: number; score: number | null;
  kpis: { name: string; actual: number | null; target: number; pct: number | null; quarterly?: { value: number | null; reviewed: boolean } }[];
}) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-gray-900">{name} <span className="text-xs text-gray-400">({weight}% weight)</span></p>
        {score !== null ? (
          <p className="text-sm font-semibold text-blue-700">{score}%</p>
        ) : (
          <p className="text-xs font-medium text-amber-700 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Not yet available</p>
        )}
      </div>
      {score !== null ? <Progress value={Math.min(100, score)} className="h-2 mb-2" /> : <div className="h-2 mb-2 bg-amber-100 rounded" />}
      <div className="space-y-1">
        {kpis.map((k) => (
          <div key={k.name} className="text-xs text-gray-600">
            <div className="flex justify-between">
              <span>{k.name}</span>
              <span>{k.actual !== null ? `${k.actual.toLocaleString("en-IN")} / ${k.target.toLocaleString("en-IN")} target (${k.pct}%)` : "No data yet"}</span>
            </div>
            {k.quarterly && (
              <div className="flex justify-end">
                <span className={`text-[11px] ${k.quarterly.reviewed ? "text-green-600" : "text-amber-600"}`}>
                  Quarter figure: {k.quarterly.value !== null ? k.quarterly.value.toLocaleString("en-IN") : "—"}
                  {" · "}{k.quarterly.reviewed ? "Manager reviewed" : "Pending manager review"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default KraScorecardHub;
