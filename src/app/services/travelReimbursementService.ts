/**
 * Travel Reimbursement Service
 * Handles all CRUD, approval workflow, and rate management
 * No TDS/Tax applied on reimbursements (per company policy)
 *
 * Real approval chain (rebuilt to match the same 3-stage pattern as
 * attendance regularization / comp-off leave):
 *   Stage 1 (role-dependent) → City Manager → HR (final approval + record update)
 *   - Car Washer   → TSM
 *   - Supervisor   → Sales Head
 *   - Everyone else → Reporting Manager
 * City Manager approval is now always required (the old ₹2000-threshold
 * conditional skip has been removed). Every stage requires a real,
 * mandatory comment to reject — never a silent reject — and every
 * request keeps an append-only history[] visible to everyone in the
 * chain. A rejected claim can be resubmitted.
 *
 * Payout timing differs by role:
 *   - Car Washer / Supervisor (payoutTrack "Weekly"): NOT bridged into a
 *     monthly Finance Payable on HR Apply. Instead it becomes eligible
 *     for the weekly reconciliation batch (travelWeeklyPayoutService.ts)
 *     — HR reconciles Mon-Sun every Monday, Super Admin approves, then
 *     it's disbursed by Accounts (via the existing PayablesDashboard).
 *   - Everyone else (payoutTrack "Monthly"): unchanged from before — HR
 *     Apply bridges into a Finance Payable due next payroll cycle
 *     (useTravelPayableBridge.ts), same as Expense Claims.
 * Still-unresolved claims auto-reject when payroll approves for that
 * period — same real policy as regularization/comp-off, tied to the
 * monthly payroll cycle regardless of payout track (the approval
 * deadline is enterprise-wide; only disbursement timing differs).
 */

import { DataService } from "./DataService";
import { employeeDatabaseService } from "./employeeDatabaseService";
import { findCityManagerForCity, findTSMForCity, findSalesHeadForCity } from "./orgResolution";
import { CITIES } from "../contexts/CityContext";

// ── Types ──────────────────────────────────────────────────────────────────

export type VehicleType = "2W" | "4W";

export type TripStatus =
  | "Draft"
  | "Pending Manager"
  | "Manager Rejected"
  | "Pending City Manager"
  | "City Manager Rejected"
  | "Pending HR"
  | "HR Rejected"
  | "HR Applied"
  | "Auto-Rejected"
  // Legacy statuses tolerated on read from records created before this
  // rewrite — never produced by new code. getTrips() migrates these
  // forward the first time they're read (see migrateLegacyTrip()).
  | "Approved"
  | "Rejected"
  | "Added to Payroll";

export type TravelApproverRole = "Reporting Manager" | "TSM" | "Sales Head";
export type PayoutTrack = "Monthly" | "Weekly";

export type TravelHistoryStage = "Employee" | "Manager" | "City Manager" | "HR" | "System";
export type TravelHistoryAction = "Submitted" | "Resubmitted" | "Approved" | "Rejected" | "Applied" | "Auto-Rejected" | "Migrated";

export interface TravelHistoryEntry {
  stage: TravelHistoryStage;
  action: TravelHistoryAction;
  actorId?: string;
  actorName?: string;
  comment?: string;
  at: string;
}

export interface TravelRate {
  vehicleType: VehicleType;
  ratePerKm: number;           // INR per km
  effectiveFrom: string;       // ISO date
  setBy: string;               // Super Admin name
  updatedAt: string;
}

export interface TravelExceptionPolicy {
  id: string;
  type: "individual" | "uniform";
  employeeId?: string;         // If individual
  employeeName?: string;
  vehicleType: VehicleType;
  overrideRatePerKm: number;
  reason: string;
  validFrom: string;
  validTo?: string;            // If blank = indefinite
  setBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface TravelModulePermission {
  employeeId: string;
  employeeName: string;
  designation: string;
  cityId: string;
  isEnabled: boolean;
  enabledBy: string;           // Super Admin or City Manager name
  enabledAt: string;
  vehicleType: VehicleType;
}

export interface TripPhoto {
  id: string;
  tripId: string;
  type: "start_odometer" | "end_odometer";
  dataUrl: string;             // base64 image stored in localStorage
  capturedAt: string;
  fileName: string;
}

export interface TravelTrip {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  cityId: string;
  city: string;
  // Stage-1 approver — whoever it resolves to (Reporting Manager / TSM /
  // Sales Head). See firstApproverRole for which one it actually is.
  reportingManagerId: string;
  reportingManagerName: string;
  firstApproverRole?: TravelApproverRole;
  cityManagerId?: string;
  cityManagerName?: string;
  payoutTrack?: PayoutTrack;
  vehicleType: VehicleType;
  vehicleNumber: string;

  // Trip details
  tripDate: string;            // ISO date
  startTime: string;
  endTime?: string;
  purposeOfVisit: string;
  visitLocation: string;
  outcomeOfVisit?: string;

  // Odometer
  startReading: number;        // km
  endReading?: number;         // km
  totalKm?: number;            // derived: endReading - startReading

  // Photos (IDs to TripPhoto records)
  startPhotoId?: string;
  endPhotoId?: string;

  // Financials (no tax)
  ratePerKm: number;
  calculatedAmount?: number;   // totalKm × ratePerKm
  taxAmount: number;           // Always 0 per policy
  tdsAmount: number;           // Always 0 per policy
  netPayableAmount?: number;   // Same as calculatedAmount

  // Workflow
  status: TripStatus;
  submittedAt?: string;

  managerApprovedBy?: string;
  managerApprovedAt?: string;
  managerComments?: string;

  hrApprovedBy?: string;
  hrApprovedAt?: string;
  hrComments?: string;

  cityManagerApprovedBy?: string;
  cityManagerApprovedAt?: string;
  cityManagerComments?: string;

  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  isResubmission?: boolean;
  originalRequestId?: string;
  resubmissionComment?: string;
  history: TravelHistoryEntry[];

  // Weekly payout (Car Washer / Supervisor track) — set once this trip is
  // claimed by a reconciliation batch, see travelWeeklyPayoutService.ts.
  travelBatchId?: string;

  payrollMonth?: string;       // "2026-05" — set when Added to Payroll
  payrollRunId?: string;
  createdAt: string;
  updatedAt: string;

  // ── GPS auto-submit fields (set when trip was auto-created from field tracking) ──
  autoSubmittedFromFieldTracking?: boolean;  // true = created by fieldTrackingService on checkout
  fieldSessionId?: string;                   // links back to FieldSession.id
  gpsDistanceKm?: number;                    // raw GPS haversine distance used
  gpsTrailPoints?: number;                   // how many GPS points in the trail

  // Internal migration marker — do not read/set outside migrateLegacyTrip().
  legacySkipFinalHR?: boolean;
}

export interface TravelNotification {
  id: string;
  employeeId: string;
  type: "travel_manager_approved" | "travel_hr_approved" | "travel_pending_city_manager" | "travel_city_manager_approved" | "travel_rejected";
  message: string;
  read: boolean;
  createdAt: string;
}

const PENDING_STATUSES: TripStatus[] = ["Pending Manager", "Pending City Manager", "Pending HR"];
const REJECTED_STATUSES: TripStatus[] = ["Manager Rejected", "City Manager Rejected", "HR Rejected"];

// ── Keys ──────────────────────────────────────────────────────────────────

const KEYS = {
  RATES:               "TRAVEL_RATES",
  EXCEPTIONS:          "TRAVEL_EXCEPTIONS",
  PERMISSIONS:         "TRAVEL_PERMISSIONS",
  TRIPS:               "TRAVEL_TRIPS",
  PHOTOS:              "TRAVEL_PHOTOS",
  NOTIFICATIONS:       "TRAVEL_NOTIFICATIONS",
} as const;

// ── Default rates ─────────────────────────────────────────────────────────

const DEFAULT_RATES: TravelRate[] = [
  { vehicleType: "2W", ratePerKm: 3, effectiveFrom: "2026-01-01", setBy: "System", updatedAt: new Date().toISOString() },
  { vehicleType: "4W", ratePerKm: 6, effectiveFrom: "2026-01-01", setBy: "System", updatedAt: new Date().toISOString() },
];

function payoutTrackForDesignation(designation: string): PayoutTrack {
  return (designation === "Car Washer" || designation === "Supervisor") ? "Weekly" : "Monthly";
}

class TravelReimbursementService {

  // ── Rates ────────────────────────────────────────────────────────────────

  getRates(): TravelRate[] {
    const stored = DataService.get<TravelRate>(KEYS.RATES);
    if (stored.length > 0) return stored;
    DataService.setAll(KEYS.RATES, DEFAULT_RATES);
    return DEFAULT_RATES;
  }

  getRate(vehicleType: VehicleType): number {
    const rates = this.getRates();
    return rates.find(r => r.vehicleType === vehicleType)?.ratePerKm
      ?? (vehicleType === "2W" ? 3 : 6);
  }

  // Only Super Admin can call this
  setRate(vehicleType: VehicleType, ratePerKm: number, setBy: string): TravelRate {
    const rates = this.getRates().filter(r => r.vehicleType !== vehicleType);
    const updated: TravelRate = {
      vehicleType, ratePerKm,
      effectiveFrom: new Date().toISOString().split("T")[0],
      setBy, updatedAt: new Date().toISOString(),
    };
    DataService.setAll(KEYS.RATES, [...rates, updated]);
    return updated;
  }

  // ── Exception Policies ───────────────────────────────────────────────────

  getExceptions(): TravelExceptionPolicy[] {
    return DataService.get<TravelExceptionPolicy>(KEYS.EXCEPTIONS);
  }

  saveException(policy: Omit<TravelExceptionPolicy, "id" | "createdAt">): TravelExceptionPolicy {
    const all = this.getExceptions();
    const newPolicy: TravelExceptionPolicy = {
      ...policy,
      id: `TEXC-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    DataService.setAll(KEYS.EXCEPTIONS, [...all, newPolicy]);
    return newPolicy;
  }

  deleteException(id: string): void {
    DataService.setAll(KEYS.EXCEPTIONS,
      this.getExceptions().filter(e => e.id !== id));
  }

  // Get effective rate for employee (considers exceptions)
  getEffectiveRate(employeeId: string, vehicleType: VehicleType): number {
    const today = new Date().toISOString().split("T")[0];
    const exceptions = this.getExceptions().filter(e =>
      e.isActive &&
      e.vehicleType === vehicleType &&
      e.validFrom <= today &&
      (!e.validTo || e.validTo >= today) &&
      (e.type === "uniform" || e.employeeId === employeeId)
    );
    if (exceptions.length > 0) return exceptions[0].overrideRatePerKm;
    return this.getRate(vehicleType);
  }

  // ── Module Permissions ───────────────────────────────────────────────────

  getPermissions(cityId?: string): TravelModulePermission[] {
    const all = DataService.get<TravelModulePermission>(KEYS.PERMISSIONS);
    return cityId ? all.filter(p => p.cityId === cityId) : all;
  }

  isEmployeeEnabled(employeeId: string): boolean {
    const all = this.getPermissions();
    return all.some(p => p.employeeId === employeeId && p.isEnabled);
  }

  setPermission(
    employeeId: string, employeeName: string, designation: string,
    cityId: string, vehicleType: VehicleType,
    enable: boolean, enabledBy: string
  ): void {
    const all = this.getPermissions().filter(p => p.employeeId !== employeeId);
    if (enable) {
      all.push({
        employeeId, employeeName, designation, cityId,
        isEnabled: true, enabledBy, vehicleType,
        enabledAt: new Date().toISOString(),
      });
    }
    DataService.setAll(KEYS.PERMISSIONS, all);
  }

  // ── Photos ───────────────────────────────────────────────────────────────

  savePhoto(photo: Omit<TripPhoto, "id">): TripPhoto {
    // Compress base64 image to stay within localStorage quota
    const compressedDataUrl = this.compressImage(photo.dataUrl, 800, 0.6);
    const all = DataService.get<TripPhoto>(KEYS.PHOTOS);
    const newPhoto: TripPhoto = { ...photo, dataUrl: compressedDataUrl, id: `TPHOTO-${Date.now()}` };
    try {
      DataService.setAll(KEYS.PHOTOS, [...all, newPhoto]);
    } catch (e) {
      // localStorage quota exceeded — keep photo in memory only
      console.warn("Photo storage quota exceeded. Photo will not persist across sessions.", e);
    }
    return newPhoto;
  }

  private compressImage(dataUrl: string, maxWidth: number, quality: number): string {
    if (!dataUrl.startsWith("data:image")) return dataUrl;
    const canvas  = document.createElement("canvas");
    const img     = document.createElement("img");
    img.src       = dataUrl;
    const ratio   = Math.min(1, maxWidth / (img.naturalWidth || maxWidth));
    canvas.width  = (img.naturalWidth || maxWidth) * ratio;
    canvas.height = (img.naturalHeight || 600) * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  }

  getPhoto(id: string): TripPhoto | undefined {
    return DataService.get<TripPhoto>(KEYS.PHOTOS).find(p => p.id === id);
  }

  // ── Legacy migration ──────────────────────────────────────────────────────

  /**
   * Best-effort, one-time forward-migration for trips created before this
   * approval-chain rewrite (real fix — this app has live production travel
   * claims, unlike regularization/comp-off which started from zero data).
   * Idempotent: a trip with firstApproverRole + a real history[] is treated
   * as already-migrated and returned unchanged.
   */
  private migrateLegacyTrip(t: any): TravelTrip {
    if (t.firstApproverRole && Array.isArray(t.history)) return t as TravelTrip;

    const history: TravelHistoryEntry[] = Array.isArray(t.history) ? [...t.history] : [];
    const payoutTrack: PayoutTrack = t.payoutTrack ?? payoutTrackForDesignation(t.designation);
    const now = new Date().toISOString();
    let status: TripStatus = t.status;
    let legacySkipFinalHR: boolean | undefined;

    if (status === "Approved") {
      status = "HR Applied";
    } else if (status === "Pending HR" && !t.cityManagerApprovedBy) {
      // Legacy "Pending HR" meant "manager-approved, awaiting HR's first
      // pass (possibly forwarding to City Manager if over the old
      // threshold)". City Manager approval is now always required and
      // hasn't happened yet for this claim — route it there.
      status = "Pending City Manager";
      history.push({ stage: "System", action: "Migrated", comment: "Legacy record migrated to the new approval order — routed to City Manager (was awaiting first HR review under the old flow).", at: now });
    } else if (status === "Pending City Manager" && t.hrApprovedBy) {
      // Legacy conditional-threshold claim: HR already reviewed under the
      // old rules before City Manager. Let City Manager's approval finalize
      // it directly rather than sending it back through a second HR pass.
      legacySkipFinalHR = true;
      history.push({ stage: "System", action: "Migrated", comment: "Legacy record — HR already reviewed this claim under the old flow; City Manager approval will finalize it directly.", at: now });
    }

    if (history.length === 0) {
      history.push({ stage: "System", action: "Migrated", comment: "Legacy travel record — no history was captured before this workflow was rebuilt.", at: now });
    }

    return {
      ...t,
      status,
      payoutTrack,
      firstApproverRole: t.firstApproverRole ?? "Reporting Manager",
      history,
      legacySkipFinalHR,
    } as TravelTrip;
  }

  // ── Trips ─────────────────────────────────────────────────────────────────

  getTrips(): TravelTrip[] {
    const raw = DataService.get<any>(KEYS.TRIPS);
    const needsMigration = raw.some(t => !t.firstApproverRole || !Array.isArray(t.history));
    const migrated = raw.map(t => this.migrateLegacyTrip(t));
    if (needsMigration && migrated.length > 0) DataService.setAll(KEYS.TRIPS, migrated);
    return migrated;
  }

  getTripsByEmployee(employeeId: string): TravelTrip[] {
    return this.getTrips().filter(t => t.employeeId === employeeId);
  }

  getTripsByCity(cityId: string): TravelTrip[] {
    return this.getTrips().filter(t => t.cityId === cityId);
  }

  getPendingManagerApproval(managerId: string): TravelTrip[] {
    return this.getTrips().filter(t =>
      t.status === "Pending Manager" && t.reportingManagerId === managerId
    );
  }

  getPendingHRApproval(cityId?: string): TravelTrip[] {
    return this.getTrips().filter(t =>
      t.status === "Pending HR" && (!cityId || t.cityId === cityId)
    );
  }

  getPendingCityManagerApproval(cityManagerId: string): TravelTrip[] {
    return this.getTrips().filter(t =>
      t.status === "Pending City Manager" && t.cityManagerId === cityManagerId
    );
  }

  private saveTrip(trip: TravelTrip): void {
    const all = this.getTrips().filter(t => t.id !== trip.id);
    DataService.setAll(KEYS.TRIPS, [...all, { ...trip, updatedAt: new Date().toISOString() }]);
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  getNotificationsForEmployee(employeeId: string): TravelNotification[] {
    return DataService.get<TravelNotification>(KEYS.NOTIFICATIONS)
      .filter(n => n.employeeId === employeeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  markNotificationRead(id: string): void {
    const all = DataService.get<TravelNotification>(KEYS.NOTIFICATIONS);
    DataService.setAll(KEYS.NOTIFICATIONS, all.map(n => n.id === id ? { ...n, read: true } : n));
  }

  private pushNotification(
    employeeId: string, type: TravelNotification["type"], message: string
  ): void {
    const all = DataService.get<TravelNotification>(KEYS.NOTIFICATIONS);
    const notif: TravelNotification = {
      id: `TNOTIF-${Date.now()}`, employeeId, type, message,
      read: false, createdAt: new Date().toISOString(),
    };
    DataService.setAll(KEYS.NOTIFICATIONS, [...all, notif].slice(-500));
  }

  startTrip(data: {
    employeeId: string; employeeName: string; designation: string;
    cityId: string; city: string; reportingManagerId: string; reportingManagerName: string;
    vehicleType: VehicleType; vehicleNumber: string;
    tripDate: string; startTime: string;
    purposeOfVisit: string; visitLocation: string;
    startReading: number; startPhotoId?: string;
  }): TravelTrip {
    const ratePerKm = this.getEffectiveRate(data.employeeId, data.vehicleType);
    const trip: TravelTrip = {
      id: `TRIP-${Date.now()}`,
      ...data,
      taxAmount: 0, tdsAmount: 0,
      status: "Draft",
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ratePerKm,
    };
    this.saveTrip(trip);
    return trip;
  }

  endTrip(tripId: string, data: {
    endTime: string; endReading: number;
    outcomeOfVisit: string; endPhotoId?: string;
  }): TravelTrip {
    const trips = this.getTrips();
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const totalKm = Math.max(0, data.endReading - trip.startReading);
    const calculatedAmount = Math.round(totalKm * trip.ratePerKm);
    const updated: TravelTrip = {
      ...trip, ...data,
      totalKm, calculatedAmount,
      netPayableAmount: calculatedAmount,
      taxAmount: 0, tdsAmount: 0,
    };
    this.saveTrip(updated);
    return updated;
  }

  /**
   * Real routing decision for a claim's approval chain — resolved fresh
   * every time a trip actually enters the approval queue (first
   * submission AND every resubmission), so org changes since a previous
   * attempt are always picked up.
   */
  private resolveApprovalRouting(designation: string, cityId: string, fallbackApproverId?: string, fallbackApproverName?: string): {
    status: TripStatus;
    firstApproverRole: TravelApproverRole;
    approverId?: string;
    approverName?: string;
    cityManagerId?: string;
    cityManagerName?: string;
    payoutTrack: PayoutTrack;
    systemNotes: TravelHistoryEntry[];
  } {
    const now = new Date().toISOString();
    const systemNotes: TravelHistoryEntry[] = [];
    const payoutTrack = payoutTrackForDesignation(designation);
    const cm = findCityManagerForCity(cityId);
    const cityManagerId = cm?.id;
    const cityManagerName = cm?.name;

    let firstApproverRole: TravelApproverRole = "Reporting Manager";
    let approverId = fallbackApproverId;
    let approverName = fallbackApproverName;

    if (designation === "Car Washer") {
      firstApproverRole = "TSM";
      const tsm = findTSMForCity(cityId);
      approverId = tsm?.id; approverName = tsm?.name;
    } else if (designation === "Supervisor") {
      firstApproverRole = "Sales Head";
      const sh = findSalesHeadForCity(cityId);
      approverId = sh?.id; approverName = sh?.name;
    }

    if (approverId) {
      return { status: "Pending Manager", firstApproverRole, approverId, approverName, cityManagerId, cityManagerName, payoutTrack, systemNotes };
    }

    // No real stage-1 approver found for this city/role — skip straight to
    // City Manager (or HR if there's no City Manager either), same
    // fallback pattern already used by attendance regularization / comp-off.
    systemNotes.push({
      stage: "System", action: "Approved",
      comment: `No ${firstApproverRole} found for this city — routed directly to ${cityManagerId ? "City Manager" : "HR"}.`,
      at: now,
    });
    if (cityManagerId) {
      return { status: "Pending City Manager", firstApproverRole, cityManagerId, cityManagerName, payoutTrack, systemNotes };
    }
    return { status: "Pending HR", firstApproverRole, payoutTrack, systemNotes };
  }

  submitTrip(tripId: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const routing = this.resolveApprovalRouting(trip.designation, trip.cityId, trip.reportingManagerId, trip.reportingManagerName);
    const now = new Date().toISOString();
    const updated: TravelTrip = {
      ...trip,
      status: routing.status,
      submittedAt: now,
      firstApproverRole: routing.firstApproverRole,
      reportingManagerId: routing.approverId || "",
      reportingManagerName: routing.approverName || "",
      cityManagerId: routing.cityManagerId,
      cityManagerName: routing.cityManagerName,
      payoutTrack: routing.payoutTrack,
      history: [
        ...trip.history,
        ...routing.systemNotes,
        { stage: "Employee", action: "Submitted", actorId: trip.employeeId, actorName: trip.employeeName, at: now },
      ],
    };
    this.saveTrip(updated);
    return updated;
  }

  managerApprove(tripId: string, managerId: string, managerName: string, comments?: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const now = new Date().toISOString();
    const hasCityManager = !!trip.cityManagerId;
    const updated: TravelTrip = {
      ...trip, status: hasCityManager ? "Pending City Manager" : "Pending HR",
      managerApprovedBy: managerName, managerApprovedAt: now,
      managerComments: comments,
      history: [
        ...trip.history,
        { stage: "Manager", action: "Approved", actorId: managerId, actorName: managerName, comment: comments, at: now },
        ...(hasCityManager ? [] : [{ stage: "System" as const, action: "Approved" as const, comment: "No City Manager assigned for this city — routed directly to HR", at: now }]),
      ],
    };
    this.saveTrip(updated);
    this.pushNotification(trip.employeeId, hasCityManager ? "travel_pending_city_manager" : "travel_manager_approved",
      `Your travel claim of ₹${trip.netPayableAmount} for ${trip.tripDate} was approved by your ${(trip.firstApproverRole || "Manager").toLowerCase()} — forwarded to ${hasCityManager ? "City Manager" : "HR"}.`);
    return updated;
  }

  managerReject(tripId: string, managerId: string, managerName: string, comment: string): { success: boolean; error?: string } {
    if (!comment.trim()) return { success: false, error: "A comment is required to reject a claim" };
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) return { success: false, error: "Trip not found" };
    const now = new Date().toISOString();
    this.saveTrip({
      ...trip, status: "Manager Rejected",
      managerApprovedBy: managerName, managerApprovedAt: now, managerComments: comment,
      history: [...trip.history, { stage: "Manager", action: "Rejected", actorId: managerId, actorName: managerName, comment, at: now }],
    });
    this.pushNotification(trip.employeeId, "travel_rejected", `Your travel claim for ${trip.tripDate} was rejected by your ${(trip.firstApproverRole || "Manager").toLowerCase()}: ${comment}`);
    return { success: true };
  }

  cityManagerApprove(tripId: string, cmId: string, cmName: string, comments?: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const now = new Date().toISOString();
    const skipToApplied = trip.legacySkipFinalHR === true;
    const updated: TravelTrip = {
      ...trip, status: skipToApplied ? "HR Applied" : "Pending HR",
      cityManagerApprovedBy: cmName, cityManagerApprovedAt: now, cityManagerComments: comments,
      history: [
        ...trip.history,
        { stage: "City Manager", action: "Approved", actorId: cmId, actorName: cmName, comment: comments, at: now },
        ...(skipToApplied ? [{ stage: "System" as const, action: "Applied" as const, comment: "Routed directly to HR-Applied — HR already approved this legacy claim before City Manager.", at: now }] : []),
      ],
    };
    this.saveTrip(updated);
    this.pushNotification(trip.employeeId, skipToApplied ? "travel_city_manager_approved" : "travel_city_manager_approved",
      skipToApplied
        ? `Your travel claim of ₹${trip.netPayableAmount} for ${trip.tripDate} was approved by the City Manager and finalized.`
        : `Your travel claim of ₹${trip.netPayableAmount} for ${trip.tripDate} was approved by the City Manager — forwarded to HR for final approval.`);
    return updated;
  }

  cityManagerReject(tripId: string, cmId: string, cmName: string, comment: string): { success: boolean; error?: string } {
    if (!comment.trim()) return { success: false, error: "A comment is required to reject a claim" };
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) return { success: false, error: "Trip not found" };
    const now = new Date().toISOString();
    this.saveTrip({
      ...trip, status: "City Manager Rejected",
      cityManagerApprovedBy: cmName, cityManagerApprovedAt: now, cityManagerComments: comment,
      history: [...trip.history, { stage: "City Manager", action: "Rejected", actorId: cmId, actorName: cmName, comment, at: now }],
    });
    this.pushNotification(trip.employeeId, "travel_rejected", `Your travel claim for ${trip.tripDate} was rejected by the City Manager: ${comment}`);
    return { success: true };
  }

  /**
   * Final stage. Marks the claim applied. Does NOT itself create the
   * Finance Payable / weekly-batch inclusion — the caller (TravelHRView)
   * does that immediately after, since it needs useFinance()'s
   * createPayable (a hook, unavailable inside this plain service module).
   */
  hrApply(tripId: string, hrName: string, comments?: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const now = new Date().toISOString();
    const updated: TravelTrip = {
      ...trip, status: "HR Applied",
      hrApprovedBy: hrName, hrApprovedAt: now, hrComments: comments,
      history: [...trip.history, { stage: "HR", action: "Applied", actorName: hrName, comment: comments, at: now }],
    };
    this.saveTrip(updated);
    this.pushNotification(trip.employeeId, "travel_hr_approved",
      trip.payoutTrack === "Weekly"
        ? `Your travel claim of ₹${trip.netPayableAmount} for ${trip.tripDate} was approved by HR and will be paid in the next weekly reimbursement cycle.`
        : `Your travel claim of ₹${trip.netPayableAmount} for ${trip.tripDate} was approved by HR and will be added to your payroll.`);
    return updated;
  }

  hrReject(tripId: string, hrName: string, comment: string): { success: boolean; error?: string } {
    if (!comment.trim()) return { success: false, error: "A comment is required to reject a claim" };
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) return { success: false, error: "Trip not found" };
    const now = new Date().toISOString();
    this.saveTrip({
      ...trip, status: "HR Rejected",
      hrApprovedBy: hrName, hrApprovedAt: now, hrComments: comment,
      history: [...trip.history, { stage: "HR", action: "Rejected", actorName: hrName, comment, at: now }],
    });
    this.pushNotification(trip.employeeId, "travel_rejected", `Your travel claim for ${trip.tripDate} was rejected by HR: ${comment}`);
    return { success: true };
  }

  /**
   * Reopens a rejected claim for editing. The employee then edits and
   * calls submitTrip() again (same as any other Draft) to actually
   * resubmit it — routing (stage-1 approver / City Manager) is re-resolved
   * fresh at that point.
   */
  reopenForResubmission(tripId: string, employeeName: string, comment: string): { success: boolean; error?: string; trip?: TravelTrip } {
    if (!comment.trim()) return { success: false, error: "A comment explaining the resubmission is required" };
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) return { success: false, error: "Trip not found" };
    if (!REJECTED_STATUSES.includes(trip.status)) return { success: false, error: "Only a rejected claim can be resubmitted" };
    const now = new Date().toISOString();
    const updated: TravelTrip = {
      ...trip,
      status: "Draft",
      isResubmission: true,
      originalRequestId: trip.originalRequestId || trip.id,
      resubmissionComment: comment,
      history: [...trip.history, { stage: "Employee", action: "Resubmitted", actorId: trip.employeeId, actorName: employeeName, comment, at: now }],
    };
    this.saveTrip(updated);
    return { success: true, trip: updated };
  }

  markAddedToPayroll(tripId: string, payrollMonth: string, payrollRunId: string): void {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) return;
    this.saveTrip({ ...trip, payrollMonth, payrollRunId });
  }

  /** Stamps a trip as claimed by a weekly reconciliation batch (see travelWeeklyPayoutService.ts). */
  markInWeeklyBatch(tripId: string, travelBatchId: string | undefined): void {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) return;
    this.saveTrip({ ...trip, travelBatchId });
  }

  // Monthly summary for payroll integration
  getApprovedTotalForEmployee(employeeId: string, month: string): number {
    return this.getTrips()
      .filter(t => t.employeeId === employeeId && t.status === "HR Applied" && t.tripDate.startsWith(month))
      .reduce((s, t) => s + (t.netPayableAmount || 0), 0);
  }

  /**
   * Real, confirmed policy — if a claim is still pending at any stage
   * when payroll runs for that period, it auto-rejects rather than
   * blocking payroll. Applies to every employee regardless of payout
   * track: the approval deadline is enterprise-wide (tied to the monthly
   * payroll cycle); only disbursement timing differs for Washers/Supervisors.
   */
  autoRejectPendingForPayrollPeriod(cityId: string, periodEndDate: string): number {
    const all = this.getTrips();
    let count = 0;
    const updated = all.map(t => {
      if (t.cityId === cityId && t.tripDate <= periodEndDate && PENDING_STATUSES.includes(t.status)) {
        count++;
        const now = new Date().toISOString();
        return {
          ...t, status: "Auto-Rejected" as TripStatus,
          history: [...t.history, { stage: "System" as const, action: "Auto-Rejected" as const, comment: "Auto-rejected: payroll approved before this claim was resolved", at: now }],
        };
      }
      return t;
    });
    if (count > 0) DataService.setAll(KEYS.TRIPS, updated);
    return count;
  }

  /**
   * Auto-create and submit a TravelTrip from a completed FieldSession.
   * Called by fieldTrackingService._finaliseSession() on every checkout.
   * Only fires if the employee has travel reimbursement enabled.
   *
   * @returns the created TravelTrip, or null if employee not enabled / already submitted today
   */
  autoSubmitFromSession(session: {
    id: string;
    employeeId: string;
    employeeName: string;
    role: string;
    date: string;
    checkInTime: string;
    checkOutTime: string;
    trail: Array<{ lat: number; lng: number; ts: string; accuracy: number }>;
    totalDistanceKm: number;
  }): TravelTrip | null {
    // 1. Check employee is enabled for travel reimbursement
    if (!this.isEmployeeEnabled(session.employeeId)) return null;

    // 2. Prevent duplicate: if a GPS-auto trip already exists for this session, skip
    const existing = this.getTrips().find(
      t => t.fieldSessionId === session.id
    );
    if (existing) return existing;

    // 3. Resolve the employee's real city — real fix: this used to be
    //    hardcoded to CITY-SURAT regardless of the employee's actual city,
    //    which would silently misroute stage-1/City-Manager approval for
    //    anyone outside Surat.
    const allEmployees = employeeDatabaseService.getAll();
    const emp = allEmployees.find(e => e.id === session.employeeId || e.tempId === session.employeeId);
    const cityId = emp?.workLocation || emp?.cityId || "CITY-SURAT";

    // 4. Get employee permission record for vehicle type
    const permission = this.getPermissions().find(
      p => p.employeeId === session.employeeId && p.isEnabled
    );
    const vehicleType: VehicleType = permission?.vehicleType ?? "2W";

    // 5. Get effective rate (respects individual / uniform exceptions)
    const ratePerKm = this.getEffectiveRate(session.employeeId, vehicleType);

    // 6. Compute financials from GPS distance
    const totalKm = session.totalDistanceKm;
    const calculatedAmount = Math.round(totalKm * ratePerKm);

    // 7. Extract location label from last GPS point
    const lastPoint = session.trail[session.trail.length - 1];
    const visitLocation = lastPoint
      ? `${lastPoint.lat.toFixed(4)}, ${lastPoint.lng.toFixed(4)} (GPS)`
      : "Field location (GPS)";

    // 8. Build check-in / check-out times for the trip
    const startTime = new Date(session.checkInTime).toTimeString().slice(0, 5);
    const endTime   = new Date(session.checkOutTime).toTimeString().slice(0, 5);

    // 9. Resolve the real approval routing (stage-1 approver by
    //    designation, City Manager, payout track) exactly like a manually
    //    submitted trip.
    const designation = emp?.designation || session.role;
    const routing = this.resolveApprovalRouting(designation, cityId);
    const now = new Date().toISOString();

    // 10. Build the trip — use GPS distance as odometer
    //     startReading = 0, endReading = totalDistanceKm (relative)
    const trip: TravelTrip = {
      id:                  `TRIP-GPS-${Date.now()}`,
      employeeId:          session.employeeId,
      employeeName:        session.employeeName,
      designation,
      cityId,
      city:                (CITIES as any)[cityId]?.displayName || cityId,
      reportingManagerId:  routing.approverId || "",
      reportingManagerName:routing.approverName || "",
      firstApproverRole:   routing.firstApproverRole,
      cityManagerId:       routing.cityManagerId,
      cityManagerName:     routing.cityManagerName,
      payoutTrack:         routing.payoutTrack,
      vehicleType,
      vehicleNumber:       "GPS-TRACKED",
      tripDate:            session.date,
      startTime,
      endTime,
      purposeOfVisit:      `Field day — GPS auto-submitted (${session.role})`,
      visitLocation,
      outcomeOfVisit:      "Auto-submitted from GPS field tracking",
      startReading:        0,
      endReading:          totalKm,
      totalKm,
      ratePerKm,
      calculatedAmount,
      taxAmount:           0,
      tdsAmount:           0,
      netPayableAmount:    calculatedAmount,
      status:              routing.status,
      submittedAt:         now,
      createdAt:           now,
      updatedAt:           now,
      history: [
        ...routing.systemNotes,
        { stage: "Employee", action: "Submitted", actorId: session.employeeId, actorName: session.employeeName, comment: "Auto-submitted from GPS field tracking at checkout", at: now },
      ],
      // GPS metadata
      autoSubmittedFromFieldTracking: true,
      fieldSessionId:      session.id,
      gpsDistanceKm:       totalKm,
      gpsTrailPoints:      session.trail.length,
    };

    // 11. Save and return
    this.saveTrip(trip);
    console.log(
      `[Travel] Auto-submitted TRIP-GPS from session ${session.id}:`,
      `${totalKm} km × ₹${ratePerKm} = ₹${calculatedAmount}`
    );
    return trip;
  }
}

export const travelReimbursementService = new TravelReimbursementService();
