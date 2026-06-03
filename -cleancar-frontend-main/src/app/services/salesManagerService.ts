/**
 * salesManagerService.ts  (v2 — engine-wired incentive + payroll)
 *
 * All incentive calculations now route through salesManagerIncentiveEngine
 * for spec-accurate, auditable results.
 */

import {
  salesManagerIncentiveEngine,
  type SMPayrollBreakdown,
} from "./salesIncentiveEngine";

// ── Types (unchanged from v1) ─────────────────────────────────────────────────

export type LocationStatus =
  | "Pending Approval" | "Active Prospect" | "Active"
  | "At Risk" | "Inactive" | "Rejected";

export type LocationType =
  | "Society" | "Corporate" | "Petrol Pump" | "RWA" | "Shop-in-Shop";

export interface SMLocation {
  id: string; name: string; type: LocationType;
  address: string; gpsLat: number; gpsLng: number;
  contactPerson: string; contactPhone: string;
  status: LocationStatus; approvedDate?: string; qrCodeActive: boolean;
  supervisorId?: string; supervisorName?: string;
  leadsMTD: number; leadsMTDM1: number; leadsMTDM2: number; leadsMTDM3: number;
  conversionsMTD: number; conversionRatePct: number; payingCustomers: number;
  lastSupervisorActivity: string;
  activationBonusStatus: "pending" | "triggered" | "paid";
  previousPayingMilestone: number;
}

export interface SMBlockDeal {
  id: string; locationId: string; locationName: string;
  vehicleCount: number; packageType: string; commitmentTerm: 3 | 6 | 12;
  status: "Pending Approval" | "Approved" | "Active" | "Partially Churned";
  approvedDate?: string; activeVehicles: number;
  phase1Paid: boolean; phase1Amount: number;
  phase2Amount: number; phase2CheckDate: string;
  phase2Status: "pending" | "due" | "paid";
  additionalVehicles: number;
}

export interface SMGateStatus {
  locationGate:   { current: number; target: 5;  met: boolean };
  leadGate:       { current: number; target: 30; met: boolean };
  conversionGate: { current: number; target: 5;  met: boolean };
  allMet: boolean;
}

export interface SMIncentiveBreakdown {
  gateStatus: SMGateStatus;
  perConversionFee: number;
  activationBonus: number;
  blockBonusM1: number;
  blockBonusM3Forecast: number;
  installmentCalendar: Array<{
    label: string; amount: number; dueDate: string;
    status: "on_track" | "at_risk" | "paid";
  }>;
  totalForecast: number;
  fixedSalary: number;
}

export interface SMAlert {
  id: string;
  type: "SUPERVISOR_LATE" | "LOCATION_AT_RISK" | "LOCATION_INACTIVE" |
        "QR_ZERO_SCANS" | "GATE_AT_RISK" | "BLOCK_PENDING" | "CONVERSION_LOW";
  severity: "CRITICAL" | "WARNING" | "INFO";
  locationName?: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
}

export interface SMExpenseClaim {
  id: string; activityDate: string; locationId: string; locationName: string;
  activityType: string; amount: number; hasReceipt: boolean;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Paid";
}

// ── Employee DB helpers ───────────────────────────────────────────────────────

function getEmployeeDB(): any[] {
  try {
    const raw = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function supById(id: string): { id: string; name: string } {
  const db = getEmployeeDB();
  const e  = db.find((x: any) => x.id === id);
  return e ? { id: e.id, name: e.fullName } : { id, name: id };
}

function smById(id: string): { id: string; name: string } {
  const db = getEmployeeDB();
  const e  = db.find((x: any) => x.id === id);
  return e ? { id: e.id, name: e.fullName } : { id, name: id };
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

const minsAgo = (n: number) => new Date(Date.now() - n * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function seedLocations(): SMLocation[] {
  // If seedAllData has already written sm_locations, use those (they have real IDs).
  // This seed function only fires if localStorage has nothing — i.e. very first load.
  // Supervisors and SMs use real seeded employee IDs so any lookup in the employee DB works.
  const sup1 = supById("EDB-SUP-SUR1");
  const sup2 = supById("EDB-SUP-SUR2");
  const sm1  = smById("EDB-SMGR-SUR1");
  const sm2  = smById("EDB-SMGR-SUR2");

  return [
    {
      id: "LOC-001", name: "Adajan Heights Society", type: "Society",
      address: "Adajan, Surat", gpsLat: 21.2154, gpsLng: 72.7872,
      contactPerson: "Mr. Mehta (Secretary)", contactPhone: "+91 98765 11111",
      status: "Active", approvedDate: daysAgo(45), qrCodeActive: true,
      supervisorId: sup1.id, supervisorName: sup1.name,
      leadsMTD: 18, leadsMTDM1: 12, leadsMTDM2: 4, leadsMTDM3: 2,
      conversionsMTD: 7, conversionRatePct: 39, payingCustomers: 12,
      lastSupervisorActivity: minsAgo(180), activationBonusStatus: "paid",
      previousPayingMilestone: 10,
    },
    {
      id: "LOC-002", name: "Reliance Corporate Park", type: "Corporate",
      address: "Ring Road, Surat", gpsLat: 21.2048, gpsLng: 72.8358,
      contactPerson: "HR Dept — Anita Shah", contactPhone: "+91 98765 22222",
      status: "Active", approvedDate: daysAgo(30), qrCodeActive: true,
      supervisorId: sup2.id, supervisorName: sup2.name,
      leadsMTD: 9, leadsMTDM1: 6, leadsMTDM2: 3, leadsMTDM3: 0,
      conversionsMTD: 4, conversionRatePct: 44, payingCustomers: 7,
      lastSupervisorActivity: minsAgo(360), activationBonusStatus: "triggered",
      previousPayingMilestone: 5,
    },
    {
      id: "LOC-003", name: "HP Petrol Pump - Vesu", type: "Petrol Pump",
      address: "Vesu, Surat", gpsLat: 21.1622, gpsLng: 72.7889,
      contactPerson: "Rajesh Patel (Owner)", contactPhone: "+91 98765 33333",
      status: "At Risk", approvedDate: daysAgo(25), qrCodeActive: true,
      supervisorId: sup1.id, supervisorName: sup1.name,
      leadsMTD: 3, leadsMTDM1: 3, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 1, conversionRatePct: 33, payingCustomers: 2,
      lastSupervisorActivity: minsAgo(2880), activationBonusStatus: "pending",
      previousPayingMilestone: 0,
    },
    {
      id: "LOC-004", name: "Ghod Dod RWA", type: "RWA",
      address: "Ghod Dod Road, Surat", gpsLat: 21.1930, gpsLng: 72.8052,
      contactPerson: "President RWA - Mr. Iyer", contactPhone: "+91 98765 44444",
      status: "Active Prospect", approvedDate: daysAgo(8), qrCodeActive: true,
      supervisorId: sup2.id, supervisorName: sup2.name,
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 0,
      lastSupervisorActivity: "", activationBonusStatus: "pending",
      previousPayingMilestone: 0,
    },
    {
      id: "LOC-005", name: "VIP Road Mall", type: "Shop-in-Shop",
      address: "VIP Road, Surat", gpsLat: 21.2178, gpsLng: 72.8340,
      contactPerson: "Mall Manager", contactPhone: "+91 98765 55555",
      status: "Inactive", approvedDate: daysAgo(60), qrCodeActive: false,
      supervisorId: sup2.id, supervisorName: sup2.name,
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 8,
      lastSupervisorActivity: minsAgo(8640), activationBonusStatus: "paid",
      previousPayingMilestone: 5,
    },
    {
      id: "LOC-006", name: "Piplod Township Society", type: "Society",
      address: "Piplod, Surat", gpsLat: 21.1512, gpsLng: 72.7802,
      contactPerson: "Secretary", contactPhone: "+91 98765 66666",
      status: "Pending Approval", qrCodeActive: false,
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 0,
      lastSupervisorActivity: "", activationBonusStatus: "pending",
      previousPayingMilestone: 0,
    },
  ];
}

function seedBlockDeals(): SMBlockDeal[] {
  return [
    {
      id: "BD-001", locationId: "LOC-001", locationName: "Adajan Heights Society",
      vehicleCount: 12, packageType: "Water + Shampoo", commitmentTerm: 3,
      status: "Active", approvedDate: daysAgo(30),
      activeVehicles: 10, phase1Paid: true, phase1Amount: 3750,
      phase2Amount: 3125, phase2CheckDate: daysAgo(-60), phase2Status: "pending",
      additionalVehicles: 2,
    },
  ];
}

function seedAlerts(): SMAlert[] {
  return [
    {
      id: "SA-001", type: "LOCATION_AT_RISK", severity: "WARNING",
      locationName: "HP Petrol Pump - Vesu",
      message: "HP Petrol Pump - Vesu has only 3 leads this month — at risk. Re-engage within 48 hours.",
      timestamp: minsAgo(30), actionRequired: true,
    },
    {
      id: "SA-002", type: "LOCATION_INACTIVE", severity: "CRITICAL",
      locationName: "VIP Road Mall",
      message: "VIP Road Mall — 0 leads this month. Contact location contact within 24 hours.",
      timestamp: minsAgo(60), actionRequired: true,
    },
    {
      id: "SA-003", type: "QR_ZERO_SCANS", severity: "INFO",
      locationName: "Ghod Dod RWA",
      message: "Ghod Dod RWA — QR code 0 scans since placement. Confirm QR is displayed.",
      timestamp: minsAgo(180), actionRequired: false,
    },
  ];
}

function seedExpenseClaims(): SMExpenseClaim[] {
  return [
    {
      id: "EC-001", activityDate: daysAgo(3), locationId: "LOC-001",
      locationName: "Adajan Heights Society", activityType: "Standee & Print Materials",
      amount: 850, hasReceipt: true, status: "Approved",
    },
    {
      id: "EC-002", activityDate: daysAgo(1), locationId: "LOC-003",
      locationName: "HP Petrol Pump - Vesu", activityType: "Travel & Refreshments",
      amount: 350, hasReceipt: true, status: "Submitted",
    },
  ];
}

// ── Service ───────────────────────────────────────────────────────────────────

class SalesManagerService {
  private readonly KEYS = {
    LOCATIONS:   "sm_locations",
    BLOCK_DEALS: "sm_block_deals",
    ALERTS:      "sm_alerts",
    EXPENSES:    "sm_expenses",
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

  getLocations():      SMLocation[]     { return this.load(this.KEYS.LOCATIONS,   seedLocations);    }
  getBlockDeals():     SMBlockDeal[]    { return this.load(this.KEYS.BLOCK_DEALS, seedBlockDeals);   }
  getAlerts():         SMAlert[]        { return this.load(this.KEYS.ALERTS,      seedAlerts);       }
  getExpenseClaims():  SMExpenseClaim[] { return this.load(this.KEYS.EXPENSES,    seedExpenseClaims);}

  getGateStatus(): SMGateStatus {
    const locs = this.getLocations();
    const active = locs.filter(l => l.status === "Active" || l.status === "Active Prospect").length;
    const leads  = locs.reduce((s, l) => s + (Number(l.leadsMTD) || 0), 0);
    const conv   = locs.reduce((s, l) => s + (Number(l.conversionsMTD) || 0), 0);
    return {
      locationGate:   { current: active, target: 5,  met: active >= 5  },
      leadGate:       { current: leads,  target: 30, met: leads >= 30  },
      conversionGate: { current: conv,   target: 5,  met: conv >= 5    },
      allMet: active >= 5 && leads >= 30 && conv >= 5,
    };
  }

  getIncentiveBreakdown(): SMIncentiveBreakdown {
    const gate    = this.getGateStatus();
    const locs    = this.getLocations();
    const blocks  = this.getBlockDeals();
    const month   = new Date().toISOString().slice(0, 7);

    // Build inputs for the engine
    const gateInput = {
      activeLocations:  gate.locationGate.current,
      leadsMTD:         gate.leadGate.current,
      conversionsMTD:   gate.conversionGate.current,
    };
    // Estimate term mix from total conversions (simplified seed: 60% 3M, 30% 1M, 10% 6M)
    const total = gate.conversionGate.current;
    const convInput = {
      byTerm: {
        "1":  Math.round(total * 0.30),
        "3":  Math.round(total * 0.60),
        "6":  Math.round(total * 0.10),
        "12": 0,
      },
    };
    const activInput = {
      locations: locs.map(l => ({
        locationId: l.id,
        payingCustomers: l.payingCustomers,
        previousMilestone: l.previousPayingMilestone,
      })),
    };
    const blockInput = {
      deals: blocks.map(b => ({
        dealId: b.id,
        totalVehicles: b.vehicleCount,
        activeVehicles: b.activeVehicles,
        additionalVehicles: b.additionalVehicles,
        phase1Paid: b.phase1Paid,
      })),
    };

    const result = salesManagerIncentiveEngine.computeFullPayroll(
      gateInput, convInput, activInput, blockInput, month
    );

    return {
      gateStatus: gate,
      perConversionFee:    result.perConversion.m1Total,
      activationBonus:     result.activationBonus.totalAmount,
      blockBonusM1:        result.blockBonus.phase1Total,
      blockBonusM3Forecast:result.blockBonus.phase2Total,
      installmentCalendar: result.perConversion.futureTransches.slice(0, 6).map(t => ({
        label: `${t.term}M conv (M${t.checkMonth} check)`,
        amount: t.amount,
        dueDate: t.dueDate,
        status: "on_track" as const,
      })),
      totalForecast: result.totalM1 - result.fixedSalary,
      fixedSalary:   result.fixedSalary,
    };
  }

  /** Full payroll breakdown for payroll run */
  getPayrollPreview(month: string): SMPayrollBreakdown {
    const gate   = this.getGateStatus();
    const locs   = this.getLocations();
    const blocks = this.getBlockDeals();
    const total  = gate.conversionGate.current;
    return salesManagerIncentiveEngine.computeFullPayroll(
      { activeLocations: gate.locationGate.current, leadsMTD: gate.leadGate.current, conversionsMTD: total },
      { byTerm: { "1": Math.round(total*0.3), "3": Math.round(total*0.6), "6": Math.round(total*0.1), "12": 0 } },
      { locations: locs.map(l => ({ locationId: l.id, payingCustomers: l.payingCustomers, previousMilestone: l.previousPayingMilestone })) },
      { deals: blocks.map(b => ({ dealId: b.id, totalVehicles: b.vehicleCount, activeVehicles: b.activeVehicles, additionalVehicles: b.additionalVehicles, phase1Paid: b.phase1Paid })) },
      month
    );
  }

  submitLocation(location: Omit<SMLocation,
    "id" | "qrCodeActive" | "leadsMTD" | "leadsMTDM1" | "leadsMTDM2" | "leadsMTDM3" |
    "conversionsMTD" | "conversionRatePct" | "payingCustomers" |
    "lastSupervisorActivity" | "activationBonusStatus" | "previousPayingMilestone">
  ): SMLocation {
    const locs = this.getLocations();
    const newLoc: SMLocation = {
      ...location, id: `LOC-${Date.now()}`, qrCodeActive: false,
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 0,
      lastSupervisorActivity: "", activationBonusStatus: "pending",
      previousPayingMilestone: 0,
    };
    localStorage.setItem(this.KEYS.LOCATIONS, JSON.stringify([...locs, newLoc]));
    return newLoc;
  }

  dismissAlert(alertId: string): void {
    const updated = this.getAlerts().map(a => a.id === alertId ? { ...a, actionRequired: false } : a);
    localStorage.setItem(this.KEYS.ALERTS, JSON.stringify(updated));
  }
}

export const salesManagerService = new SalesManagerService();
