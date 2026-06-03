/**
 * salesHeadService.ts  (v2 — full management visibility layer)
 *
 * Adds to the existing SH service:
 *   getReporteesSummary()  — aggregates TSM pipeline + SM locations + TCE
 *                            drill-down for the Management Visibility tab
 *   getPayrollPreview()    — wires salesIncentiveEngine for payroll output
 *
 * Management Visibility Layer (Section 12 of Sales Head Module v1.1):
 *   SH sees: own TCE data (existing), TSM pipeline, all SM locations,
 *            all TCEs under TSM, installment tranche liability,
 *            incentive forecasts for every reportee.
 */

import { DataService } from "./DataService";
import {
  salesHeadIncentiveEngine,
  type SHPayrollBreakdown,
} from "./salesIncentiveEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TCEGateColor = "RED" | "AMBER" | "GREEN" | "GOLD";

export interface TCEStatus {
  id: string;
  name: string;
  closuresMTD: number;
  gateColor: TCEGateColor;
  slaCompliancePct: number;
  planMixPct: number;
  churnCount30d: number;
  lastCallTime: string;
  incentiveForecast: number;
  status: "ACTIVE" | "ON_CALL" | "OFFLINE";
}

export interface SHLead {
  id: string;
  customerName: string;
  phone: string;
  vehicleType: "2W" | "4W";
  vehicleCategory: string;
  source: "Digital-Inbound" | "SM-Alliance-Supervisor" | "SM-Alliance-QR" |
          "SM-Alliance-WhatsApp" | "Referral" | "SM-Direct";
  status: "New" | "Assigned" | "Contacted" | "Demo Done" |
          "Negotiation" | "Closed Won" | "Closed Lost";
  assignedTo: string | null;
  ageMinutes: number;
  estimatedValue: number;
  smId?: string;
  smLocationName?: string;
}

export interface SHCoachingNote {
  id: string;
  tceId: string;
  tceName: string;
  date: string;
  issue: string;
  action: string;
  nextCheckDate: string;
}

export interface SHCommandMetrics {
  tceStatuses: TCEStatus[];
  unassignedLeads: number;
  overdueLeads: number;
  slaTeamPct: number;
  planMixTeamPct: number;
  churnTeamCount: number;
  personalClosuresMTD: number;
  personalTarget: number;
  alertCount: number;
}

export interface SHIncentiveBreakdown {
  lowestTCECount: number;
  coachingBonusLevel: 0 | 1 | 2 | 3;
  coachingBonus: number;
  slaBonus: number;
  zeroChurnBonus: number;
  planMixBonus: number;
  personalIncentive: number;
  installmentCalendar: Array<{
    label: string; amount: number; dueDate: string;
    status: "on_track" | "at_risk";
  }>;
  totalForecast: number;
}

export interface SHAlert {
  id: string;
  type: "UNASSIGNED_LEAD" | "SLA_BREACH" | "TCE_OFFLINE" | "COACHING_REQUIRED" |
        "CHURN_EVENT" | "MONTH_END" | "GPS_FAIL" | "LOCATION_AT_RISK";
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  timestamp: string;
  actionRequired: boolean;
}

// ── Management visibility types (Section 12) ──────────────────────────────────

export interface TSMSummary {
  id: string;
  name: string;
  // Pipeline metrics
  leadsNew: number;
  leadsConverted: number;
  conversionRatePct: number;
  revenueMTD: number;
  revenueTarget: number;
  slaBreaches: number;
  // Team (TSEs under TSM)
  tseCount: number;
  tsePerformance: Array<{
    id: string; name: string; status: string;
    closuresMTD: number; slaCompliancePct: number; planMixPct: number;
    incentiveForecast: number; health: "GREEN" | "AMBER" | "RED";
  }>;
  // Incentive
  incentiveForecast: number;
  // Tranche exposure
  pendingTranches: number;
}

export interface SMSummaryForSH {
  id: string;
  name: string;
  activeLocations: number;
  leadsMTD: number;
  conversionsMTD: number;
  conversionRatePct: number;
  gateCleared: boolean;
  blockDealsActive: number;
  incentiveForecast: number;
  atRiskLocations: number;
  inactiveLocations: number;
  pendingApprovals: number;
}

export interface TrancheItem {
  id: string;
  ownerName: string;
  ownerRole: "SH" | "TSM" | "SM" | "TCE";
  label: string;
  amount: number;
  dueDate: string;
  subscriptionActive: boolean;
  status: "on_track" | "at_risk" | "forfeited";
}

export interface ReporteesSummary {
  // TSM the SH manages
  tsmSummary: TSMSummary;
  // Sales Managers reporting to this SH
  smSummaries: SMSummaryForSH[];
  // All TCEs across the team (SH's own 3 + TSM's TCEs)
  allTCEs: Array<{
    id: string; name: string; teamOwner: "SH-Direct" | "TSM";
    closuresMTD: number; slaCompliancePct: number; planMixPct: number;
    churnCount30d: number; incentiveForecast: number;
    health: "GREEN" | "AMBER" | "RED";
  }>;
  // Tranche liability calendar
  trancheLiability: TrancheItem[];
  // Incentive cost forecast
  totalTeamIncentiveForecast: number;
  shPersonalForecast: number;
  tsmForecast: number;
  smsTotalForecast: number;
  tcesForecast: number;
}

// ── Employee DB helpers ───────────────────────────────────────────────────────
// Read from EMPLOYEE_DATABASE_RECORDS (written by seedAllData).
// Never hardcode names or IDs — always derive from the single source of truth.

function getEmployeeDB(): any[] {
  try {
    const raw = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function empById(id: string, db: any[]): { id: string; name: string } {
  const e = db.find((x: any) => x.id === id);
  return e ? { id: e.id, name: e.fullName || id } : { id, name: id };
}

function empsByDesignation(designation: string, db: any[]): any[] {
  return db.filter((e: any) => e.designation === designation && e.accountStatus === "active");
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

const minsAgo = (n: number) => new Date(Date.now() - n * 60 * 1000).toISOString();

function seedTCEStatuses(): TCEStatus[] {
  // Read sh_tce_performance written by seedAllData (step 25) if present.
  // Otherwise build from real employee records so IDs and names always match.
  try {
    const raw = localStorage.getItem("sh_tce_performance");
    if (raw) {
      const seeded: TCEStatus[] = JSON.parse(raw);
      if (seeded.length > 0) return seeded;
    }
  } catch { /* fall through */ }

  const db   = getEmployeeDB();
  const tses = empsByDesignation("TSE", db);

  if (tses.length === 0) {
    // Absolute last resort — will be replaced once seedAllData runs
    return [
      { id: "EDB-TSE-SUR1", name: "Pooja Sharma",  closuresMTD: 28, gateColor: "AMBER", slaCompliancePct: 88, planMixPct: 65, churnCount30d: 1, lastCallTime: minsAgo(18), incentiveForecast: 4200, status: "ON_CALL" },
      { id: "EDB-TSE-SUR2", name: "Ankit Trivedi", closuresMTD: 14, gateColor: "RED",   slaCompliancePct: 72, planMixPct: 48, churnCount30d: 3, lastCallTime: minsAgo(95), incentiveForecast: 1800, status: "ACTIVE"  },
    ];
  }

  // Build from real employees — use seeded performance numbers where available
  const perfDefaults = [
    { closuresMTD: 28, gateColor: "AMBER" as TCEGateColor, slaCompliancePct: 88, planMixPct: 65, churnCount30d: 1, incentiveForecast: 4200, status: "ON_CALL"  as const },
    { closuresMTD: 14, gateColor: "RED"   as TCEGateColor, slaCompliancePct: 72, planMixPct: 48, churnCount30d: 3, incentiveForecast: 1800, status: "ACTIVE"   as const },
    { closuresMTD: 21, gateColor: "AMBER" as TCEGateColor, slaCompliancePct: 81, planMixPct: 55, churnCount30d: 2, incentiveForecast: 3100, status: "ACTIVE"   as const },
  ];

  return tses.slice(0, 3).map((e: any, i: number) => ({
    id:              e.id,
    name:            e.fullName,
    lastCallTime:    minsAgo(10 + i * 30),
    ...perfDefaults[i % perfDefaults.length],
  }));
}

function seedLeads(): SHLead[] {
  // SM IDs reference real seeded Sales Manager employees so lookups work
  const db   = getEmployeeDB();
  const sms  = empsByDesignation("Sales Manager", db);
  const tses = empsByDesignation("TSE", db);

  const sm1  = sms[0] ? { id: sms[0].id, name: sms[0].fullName } : { id: "EDB-SMGR-SUR1", name: "Nayan Joshi" };
  const sm2  = sms[1] ? { id: sms[1].id, name: sms[1].fullName } : { id: "EDB-SMGR-SUR2", name: "Kalpesh Rathod" };
  const tse1 = tses[0] ? tses[0].id : "EDB-TSE-SUR1";
  const tse2 = tses[1] ? tses[1].id : "EDB-TSE-SUR2";

  return [
    { id: "SH-L-001", customerName: "Vikram Singh",  phone: "+91 98765 43219", vehicleType: "4W", vehicleCategory: "SUV",      source: "SM-Alliance-Supervisor", status: "New",        assignedTo: null,  ageMinutes: 35,  estimatedValue: 1999, smId: sm1.id, smLocationName: "Adajan Heights Society" },
    { id: "SH-L-002", customerName: "Kavita Rao",    phone: "+91 98765 43220", vehicleType: "4W", vehicleCategory: "Hatchback", source: "Digital-Inbound",        status: "New",        assignedTo: null,  ageMinutes: 12,  estimatedValue: 899  },
    { id: "SH-L-003", customerName: "Suresh Iyer",   phone: "+91 98765 43221", vehicleType: "2W", vehicleCategory: "Bike",      source: "Referral",               status: "Assigned",   assignedTo: tse1,  ageMinutes: 45,  estimatedValue: 399  },
    { id: "SH-L-004", customerName: "Meera Desai",   phone: "+91 98765 43222", vehicleType: "4W", vehicleCategory: "Sedan",     source: "SM-Alliance-QR",         status: "Contacted",  assignedTo: tse2,  ageMinutes: 90,  estimatedValue: 699,  smId: sm2.id, smLocationName: "Ghod Dod RWA" },
    { id: "SH-L-005", customerName: "Deepak Nair",   phone: "+91 98765 43223", vehicleType: "4W", vehicleCategory: "Luxury",    source: "SM-Direct",              status: "Negotiation",assignedTo: "SELF",ageMinutes: 200, estimatedValue: 1299 },
  ];
}

function seedAlerts(): SHAlert[] {
  const db   = getEmployeeDB();
  const tses = empsByDesignation("TSE", db);
  const t1   = tses[0] ? tses[0].fullName : "Pooja Sharma";
  const t2   = tses[1] ? tses[1].fullName : "Ankit Trivedi";
  return [
    { id: "A-001", type: "UNASSIGNED_LEAD",   severity: "CRITICAL", message: "Lead from Adajan Heights Society unassigned — 35 minutes in queue",            timestamp: minsAgo(5),   actionRequired: true  },
    { id: "A-002", type: "COACHING_REQUIRED", severity: "WARNING",  message: `${t2} tracking to close only 14 subs by month-end — coaching needed`,          timestamp: minsAgo(15),  actionRequired: true  },
    { id: "A-003", type: "SLA_BREACH",        severity: "WARNING",  message: `${t1} — SLA compliance at 88%, approaching 90% threshold`,                     timestamp: minsAgo(60),  actionRequired: false },
    { id: "A-004", type: "GPS_FAIL",          severity: "INFO",     message: "GPS mismatch on BTL lead from Ghod Dod RWA — Supervisor outside 500m",          timestamp: minsAgo(120), actionRequired: false },
  ];
}

function seedCoachingNotes(): SHCoachingNote[] {
  const db   = getEmployeeDB();
  const tses = empsByDesignation("TSE", db);
  const t1   = tses[0] ? { id: tses[0].id, name: tses[0].fullName } : { id: "EDB-TSE-SUR1", name: "Pooja Sharma"  };
  const t2   = tses[1] ? { id: tses[1].id, name: tses[1].fullName } : { id: "EDB-TSE-SUR2", name: "Ankit Trivedi" };
  return [
    { id: "CN-001", tceId: t2.id, tceName: t2.name, date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), issue: "Plan mix below 50% — not pitching 3-month commitment",          action: "Role-play on 3-month pitch. Daily check-in for 1 week.",       nextCheckDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10) },
    { id: "CN-002", tceId: t1.id, tceName: t1.name, date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), issue: "SLA compliance falling — missing callbacks within 30 min", action: "Reviewed call schedule. Set morning callback block 10–11 AM.", nextCheckDate: new Date(Date.now() + 0 * 86400000).toISOString().slice(0, 10) },
  ];
}

// ── Service class ─────────────────────────────────────────────────────────────

class SalesHeadService {
  private readonly STORE_KEYS = {
    TCE_STATUSES:    "sh_tce_statuses",
    LEADS:           "sh_leads",
    ALERTS:          "sh_alerts",
    COACHING_NOTES:  "sh_coaching_notes",
  } as const;

  private load<T>(key: string, seed: () => T[]): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T[];
    } catch {}
    const data = seed();
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }

  // ── Existing getters ──────────────────────────────────────────────────────

  getCommandMetrics(): SHCommandMetrics {
    const tces    = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const leads   = this.load<SHLead>(this.STORE_KEYS.LEADS, seedLeads);
    const alerts  = this.load<SHAlert>(this.STORE_KEYS.ALERTS, seedAlerts);
    const personal = parseInt(localStorage.getItem("sh_personal_closures_count") || "14");
    return {
      tceStatuses: tces,
      unassignedLeads: leads.filter(l => !l.assignedTo).length,
      overdueLeads: leads.filter(l => l.assignedTo && l.ageMinutes > 30 && l.status === "Assigned").length,
      slaTeamPct: Math.round(tces.reduce((s, t) => s + t.slaCompliancePct, 0) / tces.length),
      planMixTeamPct: Math.round(tces.reduce((s, t) => s + t.planMixPct, 0) / tces.length),
      churnTeamCount: tces.reduce((s, t) => s + t.churnCount30d, 0),
      personalClosuresMTD: personal,
      personalTarget: 10,
      alertCount: alerts.filter(a => a.actionRequired).length,
    };
  }

  getLeads(): SHLead[] { return this.load<SHLead>(this.STORE_KEYS.LEADS, seedLeads); }
  getAlerts(): SHAlert[] { return this.load<SHAlert>(this.STORE_KEYS.ALERTS, seedAlerts).slice(0, 10); }
  getCoachingNotes(): SHCoachingNote[] { return this.load<SHCoachingNote>(this.STORE_KEYS.COACHING_NOTES, seedCoachingNotes); }

  getIncentiveBreakdown(): SHIncentiveBreakdown {
    const tces    = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const personal = parseInt(localStorage.getItem("sh_personal_closures_count") || "14");
    const avgSLA  = tces.reduce((s, t) => s + t.slaCompliancePct, 0) / tces.length;
    const avgMix  = tces.reduce((s, t) => s + t.planMixPct, 0) / tces.length;
    const churn   = tces.reduce((s, t) => s + t.churnCount30d, 0);

    // Use the engine for precise calculation
    const month = new Date().toISOString().slice(0, 7);
    const payroll = salesHeadIncentiveEngine.computeFullPayroll(
      { tceClosures: tces.map(t => t.closuresMTD), teamSLAPct: avgSLA, teamPlanMixPct: avgMix, teamChurnCount: churn },
      { personalClosures: personal, byTerm: { "1": 4, "3": 6, "6": 2, "12": 2 } },
      month
    );

    const lowest = Math.min(...tces.map(t => t.closuresMTD));
    return {
      lowestTCECount: lowest,
      coachingBonusLevel: payroll.coachingBonus.level,
      coachingBonus: payroll.coachingBonus.bonus,
      slaBonus: payroll.qualityBonuses.slaBonus.amount,
      zeroChurnBonus: payroll.qualityBonuses.zeroChurnBonus.amount,
      planMixBonus: payroll.qualityBonuses.planMixBonus.amount,
      personalIncentive: payroll.personalIncentive.totalM1,
      installmentCalendar: payroll.personalIncentive.futureTransches.slice(0, 5).map(t => ({
        label: `${t.term}M sub (M${t.checkMonth} check)`,
        amount: t.amount,
        dueDate: t.dueDate,
        status: "on_track" as const,
      })),
      totalForecast: payroll.totalVariableM1,
    };
  }

  // ── Payroll line items ─────────────────────────────────────────────────────

  getPayrollPreview(month: string): SHPayrollBreakdown {
    const tces   = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const personal = parseInt(localStorage.getItem("sh_personal_closures_count") || "14");
    const avgSLA = tces.reduce((s, t) => s + t.slaCompliancePct, 0) / tces.length;
    const avgMix = tces.reduce((s, t) => s + t.planMixPct, 0) / tces.length;
    const churn  = tces.reduce((s, t) => s + t.churnCount30d, 0);
    return salesHeadIncentiveEngine.computeFullPayroll(
      { tceClosures: tces.map(t => t.closuresMTD), teamSLAPct: avgSLA, teamPlanMixPct: avgMix, teamChurnCount: churn },
      { personalClosures: personal, byTerm: { "1": 4, "3": 6, "6": 2, "12": 2 } },
      month
    );
  }

  // ── Management Visibility Layer (Section 12) ───────────────────────────────

  getReporteesSummary(): ReporteesSummary {
    const db = getEmployeeDB();

    // ── TSM summary — built from real TSM employees ──────────────────────────
    const tsmEmps = empsByDesignation("TSM", db);
    const tsm0 = tsmEmps[0] || { id: "EDB-TSM-SUR1", fullName: "Sanjay Kapoor" };

    // TSEs under TSM — all TSE employees in the same city
    const tsmCityId = tsm0.workLocation || "CITY-SURAT";
    const tsmTSEs   = empsByDesignation("TSE", db).filter(
      (e: any) => (e.workLocation || "CITY-SURAT") === tsmCityId
    );

    const tsmTCEs: AllTCESummary[] = tsmTSEs.map((e: any, i: number) => ({
      id: e.id, name: e.fullName,
      teamOwner: "TSM" as const,
      closuresMTD:       [45, 38, 22, 31][i % 4],
      slaCompliancePct:  [92, 88, 75, 84][i % 4],
      planMixPct:        [68, 55, 42, 60][i % 4],
      churnCount30d:     [0, 1, 2, 0][i % 4],
      incentiveForecast: [900, 760, 330, 620][i % 4],
      health: (i === 2 ? "AMBER" : "GREEN") as "GREEN" | "AMBER" | "RED",
    }));

    const tsmSummary: TSMSummary = {
      id: tsm0.id, name: tsm0.fullName,
      leadsNew: 45, leadsConverted: 35, conversionRatePct: 42,
      revenueMTD: 4850000, revenueTarget: 5500000,
      slaBreaches: 12, tseCount: tsmTSEs.length,
      tsePerformance: tsmTCEs,
      incentiveForecast: 52000,
      pendingTranches: 3,
    };

    // ── SM summaries — built from real Sales Manager employees ───────────────
    const smEmps = empsByDesignation("Sales Manager", db);
    const smSummaries: SMSummaryForSH[] = smEmps.map((e: any, i: number) => {
      // Read actual location counts from salesManagerService localStorage if available
      let activeLocations = [4, 6][i % 2];
      let atRiskLocations = [1, 0][i % 2];
      let inactiveLocations = [1, 0][i % 2];
      try {
        const locs: any[] = JSON.parse(localStorage.getItem("sm_locations") || "[]");
        const myLocs = locs.filter((l: any) => l.smId === e.id);
        if (myLocs.length > 0) {
          activeLocations   = myLocs.filter((l: any) => l.status === "Active").length;
          atRiskLocations   = myLocs.filter((l: any) => l.status === "At Risk").length;
          inactiveLocations = myLocs.filter((l: any) => l.status === "Inactive").length;
        }
      } catch { /* use defaults */ }

      return {
        id: e.id, name: e.fullName,
        activeLocations,
        leadsMTD:          [30, 48][i % 2],
        conversionsMTD:    [6, 9][i % 2],
        conversionRatePct: [20, 19][i % 2],
        gateCleared:       i % 2 === 1,
        blockDealsActive:  [1, 0][i % 2],
        incentiveForecast: [8200, 6800][i % 2],
        atRiskLocations,
        inactiveLocations,
        pendingApprovals:  [1, 0][i % 2],
      };
    });

    // ── All TCEs = SH's direct team + TSM's team ─────────────────────────────
    const shTCEs = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const allTCEs: AllTCESummary[] = [
      ...shTCEs.map(t => ({
        id: t.id, name: t.name, teamOwner: "SH-Direct" as const,
        closuresMTD: t.closuresMTD, slaCompliancePct: t.slaCompliancePct,
        planMixPct: t.planMixPct, churnCount30d: t.churnCount30d,
        incentiveForecast: t.incentiveForecast,
        health: (t.gateColor === "RED" ? "RED" : t.slaCompliancePct < 85 ? "AMBER" : "GREEN") as "GREEN" | "AMBER" | "RED",
      })),
      ...tsmTCEs,
    ];

    // ── Tranche liability — uses real employee names ───────────────────────
    const tce1 = shTCEs[0] || { id: "EDB-TSE-SUR1", name: "Pooja Sharma" };
    const shSelf = { name: db.find((e: any) => e.designation === "Sales Head")?.fullName || "Sales Head" };
    const sm1    = smEmps[0] || { fullName: "Sales Manager 1" };
    const tsmN   = tsmEmps[0]?.fullName || "TSM";

    const trancheLiability: TrancheItem[] = [
      { id: "TL-001", ownerName: `${tce1.name} (TCE)`,   ownerRole: "TCE", label: "3M sub M3 check",    amount: 30,   dueDate: "2026-05-31", subscriptionActive: true,  status: "on_track" },
      { id: "TL-002", ownerName: `${shSelf.name} (SH)`, ownerRole: "SH",  label: "6M sub M3 tranche",  amount: 36,   dueDate: "2026-05-31", subscriptionActive: true,  status: "on_track" },
      { id: "TL-003", ownerName: `${sm1.fullName} (SM)`, ownerRole: "SM",  label: "3M block M3 pro-rata",amount: 3125, dueDate: "2026-05-31", subscriptionActive: true,  status: "on_track" },
      { id: "TL-004", ownerName: `${tce1.name} (TSE-TSM)`,ownerRole:"TCE", label: "12M sub M3 check",   amount: 100,  dueDate: "2026-05-31", subscriptionActive: false, status: "at_risk"  },
      { id: "TL-005", ownerName: `${tsmN} (TSM)`,        ownerRole: "TSM", label: "Q1 conversion M3",    amount: 2400, dueDate: "2026-06-30", subscriptionActive: true,  status: "on_track" },
    ];

    const shForecast  = this.getIncentiveBreakdown().totalForecast;
    const smForecast  = smSummaries.reduce((s, sm) => s + sm.incentiveForecast, 0);
    const tceForecast = allTCEs.reduce((s, t) => s + t.incentiveForecast, 0);

    return {
      tsmSummary,
      smSummaries,
      allTCEs,
      trancheLiability,
      totalTeamIncentiveForecast: shForecast + tsmSummary.incentiveForecast + smForecast + tceForecast,
      shPersonalForecast: shForecast,
      tsmForecast: tsmSummary.incentiveForecast,
      smsTotalForecast: smForecast,
      tcesForecast: tceForecast,
    };
  }

  // ── Mutators ───────────────────────────────────────────────────────────────

  assignLead(leadId: string, toTCEId: string | "SELF"): void {
    const leads = this.getLeads();
    const updated = leads.map(l =>
      l.id === leadId ? { ...l, assignedTo: toTCEId, status: "Assigned" as const } : l
    );
    localStorage.setItem(this.STORE_KEYS.LEADS, JSON.stringify(updated));
  }

  logCoachingNote(note: Omit<SHCoachingNote, "id">): SHCoachingNote {
    const notes = this.getCoachingNotes();
    const n: SHCoachingNote = { ...note, id: `CN-${Date.now()}` };
    localStorage.setItem(this.STORE_KEYS.COACHING_NOTES, JSON.stringify([n, ...notes]));
    return n;
  }

  dismissAlert(alertId: string): void {
    const alerts = this.getAlerts();
    localStorage.setItem(
      this.STORE_KEYS.ALERTS,
      JSON.stringify(alerts.map(a => a.id === alertId ? { ...a, actionRequired: false } : a))
    );
  }
}

export const salesHeadService = new SalesHeadService();
