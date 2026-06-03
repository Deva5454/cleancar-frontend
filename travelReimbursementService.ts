/**
 * Travel Reimbursement Service
 * Handles all CRUD, approval workflow, and rate management
 * No TDS/Tax applied on reimbursements (per company policy)
 */

import { DataService } from "./DataService";

// ── Types ──────────────────────────────────────────────────────────────────

export type VehicleType = "2W" | "4W";
export type TripStatus =
  | "Draft"
  | "Pending Manager"
  | "Pending HR"
  | "Approved"
  | "Rejected"
  | "Added to Payroll";

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
  reportingManagerId: string;
  reportingManagerName: string;
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

  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  payrollMonth?: string;       // "2026-05" — set when Added to Payroll
  payrollRunId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Keys ──────────────────────────────────────────────────────────────────

const KEYS = {
  RATES:       "TRAVEL_RATES",
  EXCEPTIONS:  "TRAVEL_EXCEPTIONS",
  PERMISSIONS: "TRAVEL_PERMISSIONS",
  TRIPS:       "TRAVEL_TRIPS",
  PHOTOS:      "TRAVEL_PHOTOS",
};

// ── Default rates ─────────────────────────────────────────────────────────

const DEFAULT_RATES: TravelRate[] = [
  { vehicleType: "2W", ratePerKm: 3, effectiveFrom: "2026-01-01", setBy: "System", updatedAt: new Date().toISOString() },
  { vehicleType: "4W", ratePerKm: 6, effectiveFrom: "2026-01-01", setBy: "System", updatedAt: new Date().toISOString() },
];

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

  // ── Trips ─────────────────────────────────────────────────────────────────

  getTrips(): TravelTrip[] {
    return DataService.get<TravelTrip>(KEYS.TRIPS);
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

  private saveTrip(trip: TravelTrip): void {
    const all = this.getTrips().filter(t => t.id !== trip.id);
    DataService.setAll(KEYS.TRIPS, [...all, { ...trip, updatedAt: new Date().toISOString() }]);
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

  submitTrip(tripId: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const updated = { ...trip, status: "Pending Manager" as TripStatus, submittedAt: new Date().toISOString() };
    this.saveTrip(updated);

    // localStorage-only: no remote sync

    return updated;
  }

  managerApprove(tripId: string, managerId: string, managerName: string, comments: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const updated = {
      ...trip, status: "Pending HR" as TripStatus,
      managerApprovedBy: managerName, managerApprovedAt: new Date().toISOString(),
      managerComments: comments,
    };
    this.saveTrip(updated);
    return updated;
  }

  hrApprove(tripId: string, hrName: string, comments: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const updated = {
      ...trip, status: "Approved" as TripStatus,
      hrApprovedBy: hrName, hrApprovedAt: new Date().toISOString(),
      hrComments: comments,
    };
    this.saveTrip(updated);
    return updated;
  }

  reject(tripId: string, rejectedBy: string, reason: string): TravelTrip {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const updated = {
      ...trip, status: "Rejected" as TripStatus,
      rejectedBy, rejectedAt: new Date().toISOString(), rejectionReason: reason,
    };
    this.saveTrip(updated);
    return updated;
  }

  markAddedToPayroll(tripId: string, payrollMonth: string, payrollRunId: string): void {
    const trip = this.getTrips().find(t => t.id === tripId);
    if (!trip) return;
    this.saveTrip({ ...trip, status: "Added to Payroll", payrollMonth, payrollRunId });
  }

  // Monthly summary for payroll integration
  getApprovedTotalForEmployee(employeeId: string, month: string): number {
    return this.getTrips()
      .filter(t => t.employeeId === employeeId && t.status === "Approved" && t.tripDate.startsWith(month))
      .reduce((s, t) => s + (t.netPayableAmount || 0), 0);
  }
}

export const travelReimbursementService = new TravelReimbursementService();
