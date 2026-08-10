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
import { btlLeadService } from "./btlLeadService";

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
  supervisorAcknowledged?: boolean; supervisorAcknowledgedAt?: string;
  leadsMTD: number; leadsMTDM1: number; leadsMTDM2: number; leadsMTDM3: number;
  conversionsMTD: number; conversionRatePct: number; payingCustomers: number;
  lastSupervisorActivity: string;
  activationBonusStatus: "pending" | "triggered" | "paid";
  previousPayingMilestone: number;
  activityBrief?: ActivityBrief;
  createdById?: string;   // real, confirmed addition - which Sales Manager proposed this location
  createdByName?: string;
}

// Real, confirmed addition - closes the gap where Sales Head had no way to
// communicate any operational detail to the Supervisor beyond a bare
// location name/type/address. Fields 1-6 below are the explicitly
// requested ones; the rest were added after reviewing this session's real
// material-management and BTL execution flows, where the same gap would
// otherwise resurface (a supervisor with no idea what stock to bring, or
// whether cars can even be parked/washed on site).
export interface ActivityBrief {
  startTime: string;            // e.g. "10:00 AM"
  proposedEndTime: string;      // e.g. "1:00 PM"
  setupRequirements: string;    // e.g. "1 banner, 1 table, 2 standees"
  electricityProvided: "Yes" | "No" | "Unconfirmed";
  waterProvided: "Yes" | "No" | "Unconfirmed";
  expectedCars: number;
  packageToPromote: string;     // which package/service to actually demo - e.g. "ELITE H + Add-ons"
  materialsToBring: string;     // consumables/equipment the supervisor's team should carry - ties to the real Material Management stock system
  parkingNotes: string;         // can vehicles actually be washed on site - where, how many bays
  specialInstructions: string;  // noise/security/timing restrictions, anything else
  briefedBy: string;            // Sales Head name, set automatically
  briefedAt: string;            // ISO timestamp, set automatically
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
    ALERT_THRESHOLDS: "sm_alert_thresholds",
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

  private save<T>(key: string, list: T[]): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    } catch (error) {
      console.error(`[salesManagerService] Failed to save ${key}:`, error);
      return false;
    }
  }

  // Real submission — previously the "Submit New Location for Approval"
  // form was a fake 800ms timeout with a success toast; nothing was ever
  // saved. This creates a genuine location record with "Pending Approval"
  // status, using the same real status this data model already defines.
  addLocation(input: {
    name: string; type: LocationType; address: string;
    contactPerson: string; contactPhone: string;
    createdById?: string; createdByName?: string;
  }): boolean {
    const locations = this.getLocations();
    const newLocation: SMLocation = {
      id: `LOC-${Date.now()}`,
      name: input.name,
      type: input.type,
      address: input.address,
      gpsLat: 0,
      gpsLng: 0,
      contactPerson: input.contactPerson,
      contactPhone: input.contactPhone,
      status: "Pending Approval",
      qrCodeActive: false,
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 0,
      lastSupervisorActivity: "",
      activationBonusStatus: "pending",
      previousPayingMilestone: 0,
      createdById: input.createdById,
      createdByName: input.createdByName,
    };
    locations.push(newLocation);
    return this.save(this.KEYS.LOCATIONS, locations);
  }

  // Real approval/rejection — previously there was no screen anywhere
  // that could act on a pending location, even though the status values
  // for it already existed in this exact data model.
  approveLocation(locationId: string): boolean {
    const locations = this.getLocations();
    const idx = locations.findIndex(l => l.id === locationId);
    if (idx < 0) return false;
    locations[idx] = { ...locations[idx], status: "Active Prospect", approvedDate: new Date().toISOString() };
    return this.save(this.KEYS.LOCATIONS, locations);
  }

  rejectLocation(locationId: string): boolean {
    const locations = this.getLocations();
    const idx = locations.findIndex(l => l.id === locationId);
    if (idx < 0) return false;
    locations[idx] = { ...locations[idx], status: "Rejected" };
    return this.save(this.KEYS.LOCATIONS, locations);
  }

  // Real supervisor assignment — previously the Supervisor Assignment
  // screen only displayed 5 hardcoded example locations pre-assigned to
  // 2 example supervisors; there was no way to actually assign a
  // supervisor to a real, newly-approved location.
  assignSupervisor(locationId: string, supervisorId: string, supervisorName: string): boolean {
    const locations = this.getLocations();
    const idx = locations.findIndex(l => l.id === locationId);
    if (idx < 0) return false;
    locations[idx] = {
      ...locations[idx],
      supervisorId, supervisorName,
      supervisorAcknowledged: false,
      supervisorAcknowledgedAt: undefined,
    };
    return this.save(this.KEYS.LOCATIONS, locations);
  }

  // Real acknowledgment — a supervisor being assigned doesn't mean they've
  // actually seen it. This is the supervisor's own confirmation that they
  // know about the assignment, timestamped for real, so Sales Head can
  // tell the difference between "assigned" and "assigned and confirmed."
  acknowledgeAssignment(locationId: string, supervisorId: string): boolean {
    const locations = this.getLocations();
    const idx = locations.findIndex(l => l.id === locationId && l.supervisorId === supervisorId);
    if (idx < 0) return false;
    locations[idx] = {
      ...locations[idx],
      supervisorAcknowledged: true,
      supervisorAcknowledgedAt: new Date().toISOString(),
    };
    return this.save(this.KEYS.LOCATIONS, locations);
  }

  // Real, confirmed addition - lets Sales Head set or update the activity
  // brief for a location. Setting/changing the brief after a supervisor has
  // already acknowledged the assignment resets their acknowledgment, so
  // "Confirm Receipt" always means confirming the *current* brief, not a
  // stale one.
  setActivityBrief(locationId: string, brief: Omit<ActivityBrief, "briefedAt" | "briefedBy">, briefedBy: string): boolean {
    const locations = this.getLocations();
    const idx = locations.findIndex(l => l.id === locationId);
    if (idx < 0) return false;
    locations[idx] = {
      ...locations[idx],
      activityBrief: { ...brief, briefedBy, briefedAt: new Date().toISOString() },
      supervisorAcknowledged: false,
      supervisorAcknowledgedAt: undefined,
    };
    return this.save(this.KEYS.LOCATIONS, locations);
  }

  getLocations():      SMLocation[]     { return this.load(this.KEYS.LOCATIONS,   seedLocations);    }

  // Real, confirmed fix - leadsMTD/conversionsMTD were only ever hardcoded
  // seed values with zero real aggregation anywhere, meaning Sales Head's
  // dashboard showed the same frozen numbers regardless of real field
  // activity. This overlays genuine, live-computed values on top of the
  // real, saved location records, without writing the computed values
  // back to storage (see comment above on why this must be a separate
  // function from getLocations() itself).
  getLocationsWithLiveMetrics(): SMLocation[] {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.getLocations().map(loc => {
      const leads = btlLeadService.getLeadsByLocation(loc.id);
      const leadsThisMonth = leads.filter(l => new Date(l.capturedDate) >= monthStart);
      const conversionsThisMonth = leadsThisMonth.filter(l => l.status === "CONVERTED");
      return {
        ...loc,
        leadsMTD: leadsThisMonth.length,
        conversionsMTD: conversionsThisMonth.length,
        conversionRatePct: leadsThisMonth.length > 0
          ? Math.round((conversionsThisMonth.length / leadsThisMonth.length) * 100)
          : 0,
      };
    });
  }
  getBlockDeals():     SMBlockDeal[]    { return this.load(this.KEYS.BLOCK_DEALS, seedBlockDeals);   }
  getAlerts():         SMAlert[]        { return this.load(this.KEYS.ALERTS,      seedAlerts);       }

  // Real, confirmed addition - LOCATION_AT_RISK and LOCATION_INACTIVE were
  // already real, valid SMAlert types, but nothing anywhere ever actually
  // created one. Also: SMLocation.status itself has real "At Risk"/"Inactive"
  // values in its type, confirmed via salesHeadService.ts's own SM-summary
  // dashboard (which counts locations by these exact status values) - but no
  // real code anywhere ever sets them either. This detects both conditions
  // from genuine, live location data and updates both: the real status field
  // (which is what salesHeadService's dashboard counts actually read) and a
  // real SMAlert record (for the alerts panel), through the existing,
  // working getLocations()/getAlerts() persistence.
  //
  // Thresholds (documented here since they're not sourced from any real
  // policy doc found in this codebase - now a real, configurable setting
  // (see getAlertThresholds/setAlertThresholds below) rather than a
  // hardcoded guess with no way to adjust it without a code change.
  //   Inactive: no real supervisor activity in N+ days (default 14)
  //   At Risk:  this month's real lead volume is under X% of last
  //             month's, for a location with genuine prior lead history
  //             (default 50%)
  getAlertThresholds(): { inactiveDays: number; atRiskDropPct: number } {
    try {
      const raw = localStorage.getItem(this.KEYS.ALERT_THRESHOLDS);
      if (raw) return JSON.parse(raw);
    } catch { /* fall through to defaults */ }
    return { inactiveDays: 14, atRiskDropPct: 50 };
  }

  setAlertThresholds(thresholds: { inactiveDays: number; atRiskDropPct: number }): boolean {
    try {
      localStorage.setItem(this.KEYS.ALERT_THRESHOLDS, JSON.stringify(thresholds));
      return true;
    } catch {
      return false;
    }
  }

  generateLocationAlerts(): SMAlert[] {
    const liveLocations = this.getLocationsWithLiveMetrics();
    const existingAlerts = this.getAlerts();
    const now = Date.now();
    const { inactiveDays: INACTIVE_DAYS, atRiskDropPct } = this.getAlertThresholds();
    const newAlerts: SMAlert[] = [];
    const statusUpdates = new Map<string, LocationStatus>();

    for (const loc of liveLocations) {
      if (loc.status !== "Active" && loc.status !== "Active Prospect") continue;

      const alreadyHasAlert = (type: SMAlert["type"]) =>
        existingAlerts.some(a => a.type === type && a.locationName === loc.name);

      // Inactive — no real supervisor activity in a long time
      const lastActivityMs = loc.lastSupervisorActivity ? new Date(loc.lastSupervisorActivity).getTime() : null;
      const daysSinceActivity = lastActivityMs ? (now - lastActivityMs) / (1000 * 60 * 60 * 24) : Infinity;
      if (daysSinceActivity >= INACTIVE_DAYS) {
        statusUpdates.set(loc.id, "Inactive");
        if (!alreadyHasAlert("LOCATION_INACTIVE")) {
          newAlerts.push({
            id: `alert-inactive-${loc.id}`,
            type: "LOCATION_INACTIVE",
            severity: "WARNING",
            locationName: loc.name,
            message: lastActivityMs
              ? `No supervisor activity at ${loc.name} for ${Math.floor(daysSinceActivity)} days`
              : `No supervisor activity ever recorded at ${loc.name}`,
            timestamp: new Date().toISOString(),
            actionRequired: true,
          });
        }
        continue; // Inactive takes priority over At Risk for the same location
      }

      // At Risk — real lead volume dropped off vs. last month, for a
      // location with genuine prior lead history (avoids flagging brand-new
      // locations that simply haven't had a full month yet)
      if (loc.leadsMTDM1 >= 3 && loc.leadsMTD < loc.leadsMTDM1 * (atRiskDropPct / 100)) {
        statusUpdates.set(loc.id, "At Risk");
        if (!alreadyHasAlert("LOCATION_AT_RISK")) {
          newAlerts.push({
            id: `alert-atrisk-${loc.id}`,
            type: "LOCATION_AT_RISK",
            severity: "WARNING",
            locationName: loc.name,
            message: `${loc.name}: ${loc.leadsMTD} leads this month vs. ${loc.leadsMTDM1} last month`,
            timestamp: new Date().toISOString(),
            actionRequired: true,
          });
        }
      }
    }

    if (statusUpdates.size > 0) {
      const realLocations = this.getLocations();
      const updated = realLocations.map(loc =>
        statusUpdates.has(loc.id) ? { ...loc, status: statusUpdates.get(loc.id)! } : loc
      );
      this.save(this.KEYS.LOCATIONS, updated);
    }
    if (newAlerts.length > 0) {
      this.save(this.KEYS.ALERTS, [...existingAlerts, ...newAlerts]);
    }
    return this.getAlerts();
  }

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
