Travel Reimbursement allows employees to claim km-based travel allowance for official visits. The flow is:
Employee submits trip (with odometer photos + readings) → Reporting Manager approves → HR approves → Auto-added to monthly salary as non-taxable reimbursement

NEW FILE 1 — src/app/services/travelReimbursementService.ts
ts/**
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
    const all = DataService.get<TripPhoto>(KEYS.PHOTOS);
    const newPhoto: TripPhoto = { ...photo, id: `TPHOTO-${Date.now()}` };
    DataService.setAll(KEYS.PHOTOS, [...all, newPhoto]);
    return newPhoto;
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

  getPendingHRApproval(): TravelTrip[] {
    return this.getTrips().filter(t => t.status === "Pending HR");
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

NEW FILE 2 — src/app/components/travel/TravelReimbursementModule.tsx
This is the root module that routes to the correct view based on role.
tsximport { useRole } from "../../contexts/RoleContext";
import { TravelEmployeeView }   from "./TravelEmployeeView";
import { TravelManagerView }    from "./TravelManagerView";
import { TravelHRView }         from "./TravelHRView";
import { TravelAdminSettings }  from "./TravelAdminSettings";
import { travelReimbursementService } from "../../services/travelReimbursementService";

export default function TravelReimbursementModule() {
  const { currentRole, currentUser } = useRole();
  const isEnabled = travelReimbursementService.isEmployeeEnabled(currentUser?.employeeId || "");

  // Super Admin and City Manager see the full admin panel
  if (currentRole === "Super Admin" || currentRole === "Admin") {
    return <TravelAdminSettings />;
  }
  if (currentRole === "City Manager") {
    return <TravelAdminSettings cityManagerMode />;
  }
  if (currentRole === "HR") {
    return <TravelHRView />;
  }
  // Manager view includes their own trips + pending approvals tab
  if (["Operations Manager", "Sr Operations Manager", "Cluster Manager",
       "Supervisor", "TSM", "Store Manager"].includes(currentRole)) {
    return <TravelManagerView />;
  }
  // All others: employee view (if enabled)
  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🚗</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Travel Reimbursement</h2>
        <p className="text-gray-500 text-center max-w-sm">
          This module has not been activated for your account yet.
          Please contact your City Manager or HR to enable it.
        </p>
      </div>
    );
  }
  return <TravelEmployeeView />;
}

NEW FILE 3 — src/app/components/travel/TravelEmployeeView.tsx
The employee-facing trip submission screen. Two-stage flow: Start Trip → End Trip → Review & Submit.
tsximport { useState, useRef } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { travelReimbursementService, type VehicleType, type TravelTrip } from "../../services/travelReimbursementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Camera, MapPin, CheckCircle, Clock, ChevronRight, Car, Bike, FileText, History } from "lucide-react";
import { toast } from "sonner";

type Tab = "new_trip" | "my_trips";
type Stage = "start" | "end" | "review";

export function TravelEmployeeView() {
  const { currentUser } = useRole();
  const { employees } = useEmployee();
  const { city, cityInfo } = useCity();

  const [tab, setTab] = useState<Tab>("new_trip");

  // Existing incomplete trip (Draft)
  const existingDraft = travelReimbursementService
    .getTripsByEmployee(currentUser?.employeeId || "")
    .find(t => t.status === "Draft");

  const [stage, setStage] = useState<Stage>(existingDraft ? "end" : "start");
  const [activeTrip, setActiveTrip] = useState<TravelTrip | undefined>(existingDraft);
  const [refresh, setRefresh] = useState(0);

  // ── Start trip form state ──
  const [vehicleType, setVehicleType] = useState<VehicleType>("2W");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [tripDate, setTripDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(
    new Date().toTimeString().slice(0,5)
  );
  const [purposeOfVisit, setPurposeOfVisit] = useState("");
  const [visitLocation, setVisitLocation] = useState("");
  const [startReading, setStartReading] = useState<number | "">("");
  const [startPhotoData, setStartPhotoData] = useState<string>("");

  // ── End trip form state ──
  const [endTime, setEndTime] = useState(new Date().toTimeString().slice(0,5));
  const [endReading, setEndReading] = useState<number | "">("");
  const [outcomeOfVisit, setOutcomeOfVisit] = useState("");
  const [endPhotoData, setEndPhotoData] = useState<string>("");

  const startFileRef = useRef<HTMLInputElement>(null);
  const endFileRef   = useRef<HTMLInputElement>(null);

  const emp = employees.find(e => e.id === currentUser?.employeeId);
  const reportingMgr = employees.find(e =>
    e.fullName === emp?.reportingManager || e.id === emp?.reportingManager
  );

  const rate2W = travelReimbursementService.getEffectiveRate(currentUser?.employeeId || "", "2W");
  const rate4W = travelReimbursementService.getEffectiveRate(currentUser?.employeeId || "", "4W");

  // Photo capture helper
  const capturePhoto = (file: File, cb: (data: string) => void) => {
    const reader = new FileReader();
    reader.onload = e => cb(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleStartTrip = () => {
    if (!purposeOfVisit.trim()) { toast.error("Purpose of visit is required"); return; }
    if (!visitLocation.trim())  { toast.error("Visit location is required"); return; }
    if (!vehicleNumber.trim())  { toast.error("Vehicle number is required"); return; }
    if (startReading === "")    { toast.error("Start odometer reading is required"); return; }

    let startPhotoId: string | undefined;
    if (startPhotoData) {
      const photo = travelReimbursementService.savePhoto({
        tripId: "", type: "start_odometer",
        dataUrl: startPhotoData, capturedAt: new Date().toISOString(),
        fileName: `start_${Date.now()}.jpg`,
      });
      startPhotoId = photo.id;
    }

    const trip = travelReimbursementService.startTrip({
      employeeId: currentUser?.employeeId || "",
      employeeName: emp?.fullName || currentUser?.name || "",
      designation: emp?.designation || "",
      cityId: city, city: cityInfo.displayName,
      reportingManagerId: reportingMgr?.id || emp?.reportingManager || "",
      reportingManagerName: reportingMgr?.fullName || emp?.reportingManager || "",
      vehicleType, vehicleNumber, tripDate, startTime,
      purposeOfVisit, visitLocation,
      startReading: Number(startReading),
      startPhotoId,
    });
    setActiveTrip(trip);
    setStage("end");
    toast.success("Trip started. Complete your visit and mark end of trip.");
  };

  const handleEndTrip = () => {
    if (!activeTrip) return;
    if (endReading === "")      { toast.error("End odometer reading is required"); return; }
    if (Number(endReading) <= activeTrip.startReading) { toast.error("End reading must be greater than start reading"); return; }
    if (!outcomeOfVisit.trim()) { toast.error("Outcome of visit is required"); return; }

    let endPhotoId: string | undefined;
    if (endPhotoData) {
      const photo = travelReimbursementService.savePhoto({
        tripId: activeTrip.id, type: "end_odometer",
        dataUrl: endPhotoData, capturedAt: new Date().toISOString(),
        fileName: `end_${Date.now()}.jpg`,
      });
      endPhotoId = photo.id;
    }

    const updated = travelReimbursementService.endTrip(activeTrip.id, {
      endTime, endReading: Number(endReading),
      outcomeOfVisit, endPhotoId,
    });
    setActiveTrip(updated);
    setStage("review");
  };

  const handleSubmit = () => {
    if (!activeTrip) return;
    travelReimbursementService.submitTrip(activeTrip.id);
    toast.success(`Trip submitted for approval. ₹${activeTrip.netPayableAmount?.toLocaleString()} will be reimbursed after approval.`);
    // Reset
    setStage("start"); setActiveTrip(undefined);
    setPurposeOfVisit(""); setVisitLocation(""); setVehicleNumber("");
    setStartReading(""); setEndReading(""); setStartPhotoData(""); setEndPhotoData("");
    setTab("my_trips"); setRefresh(r => r + 1);
  };

  const myTrips = travelReimbursementService.getTripsByEmployee(currentUser?.employeeId || "");

  const STATUS_COLORS: Record<string, string> = {
    "Draft":          "bg-gray-100 text-gray-700",
    "Pending Manager":"bg-amber-100 text-amber-700",
    "Pending HR":     "bg-blue-100 text-blue-700",
    "Approved":       "bg-green-100 text-green-700",
    "Rejected":       "bg-red-100 text-red-700",
    "Added to Payroll":"bg-purple-100 text-purple-700",
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Travel Reimbursement</h1>
          <p className="text-sm text-gray-500">
            Rate: 2W = ₹{rate2W}/km &nbsp;|&nbsp; 4W = ₹{rate4W}/km &nbsp;|&nbsp; No tax deduction
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["new_trip","my_trips"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "new_trip" ? "New Trip" : `My Trips (${myTrips.length})`}
          </button>
        ))}
      </div>

      {/* ── New Trip Tab ── */}
      {tab === "new_trip" && (
        <>
          {/* Stage indicator */}
          <div className="flex items-center gap-2 text-sm">
            {(["start","end","review"] as Stage[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  stage === s ? "bg-blue-600 text-white"
                  : (["end","review"].indexOf(s) <= ["end","review"].indexOf(stage))
                  ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>{i + 1}</div>
                <span className={stage === s ? "text-blue-600 font-medium" : "text-gray-400"}>
                  {s === "start" ? "Start Trip" : s === "end" ? "End Trip" : "Review & Submit"}
                </span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              </div>
            ))}
          </div>

          {/* ── STAGE: Start Trip ── */}
          {stage === "start" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Start Trip Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                  <div className="flex gap-3">
                    {(["2W","4W"] as VehicleType[]).map(vt => (
                      <button key={vt} onClick={() => setVehicleType(vt)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                          vehicleType === vt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                        }`}>
                        {vt === "2W" ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                        <span className="font-medium">{vt === "2W" ? "2 Wheeler" : "4 Wheeler"}</span>
                        <span className="text-xs">(₹{vt === "2W" ? rate2W : rate4W}/km)</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Number *</label>
                    <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="GJ05AB1234" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Trip Date *</label>
                    <Input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Purpose of Visit *</label>
                  <Input value={purposeOfVisit} onChange={e => setPurposeOfVisit(e.target.value)} placeholder="e.g. Customer demo at Adajan, Lead follow-up in Vesu" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Visit Location / Area *</label>
                  <Input value={visitLocation} onChange={e => setVisitLocation(e.target.value)} placeholder="e.g. 45 Silver Heights, Adajan" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Time *</label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Odometer Reading (km) *</label>
                  <Input type="number" value={startReading} onChange={e => setStartReading(Number(e.target.value))} placeholder="e.g. 12450" min={0} />
                </div>

                {/* Start odometer photo */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Odometer Photo <span className="text-gray-400 text-xs">(recommended)</span>
                  </label>
                  <input ref={startFileRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => e.target.files?.[0] && capturePhoto(e.target.files[0], setStartPhotoData)} />
                  {startPhotoData ? (
                    <div className="relative">
                      <img src={startPhotoData} alt="Start odometer" className="w-full h-36 object-cover rounded-lg border" />
                      <button onClick={() => setStartPhotoData("")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => startFileRef.current?.click()}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500">
                      <Camera className="w-6 h-6" />
                      <span className="text-sm">Tap to capture odometer photo</span>
                    </button>
                  )}
                </div>

                <Button className="w-full" onClick={handleStartTrip}>
                  Start Trip →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── STAGE: End Trip ── */}
          {stage === "end" && activeTrip && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">End Trip</CardTitle>
                <p className="text-sm text-gray-500">
                  Started: {activeTrip.visitLocation} at {activeTrip.startTime} — Odo: {activeTrip.startReading} km
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">End Time *</label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Odometer Reading (km) *</label>
                  <Input type="number" value={endReading} onChange={e => setEndReading(Number(e.target.value))}
                    placeholder={`Must be > ${activeTrip.startReading}`} min={activeTrip.startReading + 1} />
                  {endReading !== "" && Number(endReading) > activeTrip.startReading && (
                    <p className="text-sm text-blue-600 mt-1">
                      Distance: {Number(endReading) - activeTrip.startReading} km →
                      ₹{Math.round((Number(endReading) - activeTrip.startReading) * activeTrip.ratePerKm).toLocaleString()} estimated
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Outcome of Visit *</label>
                  <Input value={outcomeOfVisit} onChange={e => setOutcomeOfVisit(e.target.value)}
                    placeholder="e.g. Demo conducted, subscription booked. Customer confirmed joining on 5th May." />
                </div>

                {/* End odometer photo */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Odometer Photo <span className="text-gray-400 text-xs">(recommended)</span>
                  </label>
                  <input ref={endFileRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => e.target.files?.[0] && capturePhoto(e.target.files[0], setEndPhotoData)} />
                  {endPhotoData ? (
                    <div className="relative">
                      <img src={endPhotoData} alt="End odometer" className="w-full h-36 object-cover rounded-lg border" />
                      <button onClick={() => setEndPhotoData("")}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => endFileRef.current?.click()}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500">
                      <Camera className="w-6 h-6" />
                      <span className="text-sm">Tap to capture odometer photo</span>
                    </button>
                  )}
                </div>

                <Button className="w-full" onClick={handleEndTrip}>
                  Mark Trip Complete →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── STAGE: Review & Submit ── */}
          {stage === "review" && activeTrip && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Review & Submit
              </CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Summary table */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  {[
                    ["Date",             activeTrip.tripDate],
                    ["Vehicle",          `${activeTrip.vehicleType === "2W" ? "2 Wheeler" : "4 Wheeler"} — ${activeTrip.vehicleNumber}`],
                    ["Purpose",          activeTrip.purposeOfVisit],
                    ["Location",         activeTrip.visitLocation],
                    ["Outcome",          activeTrip.outcomeOfVisit || ""],
                    ["Start Reading",    `${activeTrip.startReading} km`],
                    ["End Reading",      `${activeTrip.endReading} km`],
                    ["Total Distance",   `${activeTrip.totalKm} km`],
                    ["Rate",             `₹${activeTrip.ratePerKm}/km`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-gray-900">{v}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>Reimbursement Amount</span>
                    <span className="text-green-700">₹{activeTrip.netPayableAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Tax / TDS</span>
                    <span>₹0 (No deduction as per policy)</span>
                  </div>
                </div>

                {/* Photos */}
                {(activeTrip.startPhotoId || activeTrip.endPhotoId) && (
                  <div className="grid grid-cols-2 gap-3">
                    {activeTrip.startPhotoId && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Start Odometer</p>
                        <img src={travelReimbursementService.getPhoto(activeTrip.startPhotoId)?.dataUrl}
                          alt="Start" className="w-full h-28 object-cover rounded-lg border" />
                      </div>
                    )}
                    {activeTrip.endPhotoId && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">End Odometer</p>
                        <img src={travelReimbursementService.getPhoto(activeTrip.endPhotoId)?.dataUrl}
                          alt="End" className="w-full h-28 object-cover rounded-lg border" />
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  This will be submitted to <strong>{activeTrip.reportingManagerName || "your reporting manager"}</strong> for approval, then to HR. Amount will be added to your monthly salary.
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStage("end")}>← Edit</Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSubmit}>
                    Submit for Approval
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── My Trips Tab ── */}
      {tab === "my_trips" && (
        <div className="space-y-3">
          {myTrips.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No trips submitted yet.</p>
            </div>
          ) : (
            [...myTrips].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(trip => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{trip.purposeOfVisit}</p>
                      <p className="text-xs text-gray-500">{trip.visitLocation} · {trip.tripDate}</p>
                    </div>
                    <Badge className={STATUS_COLORS[trip.status] || "bg-gray-100 text-gray-700"}>
                      {trip.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>{trip.totalKm ?? "—"} km</span>
                    <span>·</span>
                    <span className="font-semibold text-green-700">₹{trip.netPayableAmount?.toLocaleString() ?? "—"}</span>
                    <span>·</span>
                    <span>{trip.vehicleType}</span>
                  </div>
                  {trip.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 rounded p-1">
                      Rejected: {trip.rejectionReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

NEW FILE 4 — src/app/components/travel/TravelManagerView.tsx
Manager sees two tabs: their own trips (as employee) + pending approvals from their team.
tsximport { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { travelReimbursementService, type TravelTrip } from "../../services/travelReimbursementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { TravelEmployeeView } from "./TravelEmployeeView";

export function TravelManagerView() {
  const { currentUser } = useRole();
  const [tab, setTab] = useState<"approvals" | "my_trips">("approvals");
  const [selected, setSelected] = useState<TravelTrip | null>(null);
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const pending = travelReimbursementService.getPendingManagerApproval(
    currentUser?.employeeId || ""
  );

  const handleApprove = (trip: TravelTrip) => {
    travelReimbursementService.managerApprove(
      trip.id,
      currentUser?.employeeId || "",
      currentUser?.name || "Manager",
      comments
    );
    toast.success(`Trip approved. Forwarded to HR for final approval.`);
    setSelected(null); setComments(""); setRefresh(r => r + 1);
  };

  const handleReject = (trip: TravelTrip) => {
    if (!rejectReason.trim()) { toast.error("Rejection reason is required"); return; }
    travelReimbursementService.reject(trip.id, currentUser?.name || "Manager", rejectReason);
    toast.success("Trip rejected. Employee has been notified.");
    setSelected(null); setShowReject(false); setRejectReason(""); setRefresh(r => r + 1);
  };

  const getPhoto = (id?: string) => id ? travelReimbursementService.getPhoto(id) : undefined;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("approvals")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "approvals" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
          Pending Approvals {pending.length > 0 && <span className="ml-1 bg-red-500 text-white rounded-full text-xs px-1.5">{pending.length}</span>}
        </button>
        <button onClick={() => setTab("my_trips")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "my_trips" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
          My Trips
        </button>
      </div>

      {tab === "my_trips" && <TravelEmployeeView />}

      {tab === "approvals" && (
        <>
          {pending.length === 0 && !selected && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No pending approvals.</p>
            </div>
          )}

          {!selected && pending.map(trip => (
            <Card key={trip.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelected(trip)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{trip.employeeName}</p>
                    <p className="text-xs text-gray-500">{trip.designation} · {trip.tripDate}</p>
                    <p className="text-xs text-gray-600 mt-1">{trip.purposeOfVisit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">₹{trip.netPayableAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{trip.totalKm} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {selected && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Review Trip — {selected.employeeName}</CardTitle>
                  <button onClick={() => { setSelected(null); setShowReject(false); }}
                    className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trip details */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  {[
                    ["Employee",  `${selected.employeeName} (${selected.designation})`],
                    ["Date",      selected.tripDate],
                    ["Vehicle",   `${selected.vehicleType} — ${selected.vehicleNumber}`],
                    ["Purpose",   selected.purposeOfVisit],
                    ["Location",  selected.visitLocation],
                    ["Outcome",   selected.outcomeOfVisit || "Not entered"],
                    ["Distance",  `${selected.startReading} → ${selected.endReading} km (${selected.totalKm} km)`],
                    ["Rate",      `₹${selected.ratePerKm}/km`],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-right max-w-[60%]">{v}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Reimbursement</span>
                    <span className="text-green-700">₹{selected.netPayableAmount?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Odometer photos */}
                <div className="grid grid-cols-2 gap-3">
                  {["start_odometer","end_odometer"].map(type => {
                    const photoId = type === "start_odometer" ? selected.startPhotoId : selected.endPhotoId;
                    const photo = getPhoto(photoId);
                    return (
                      <div key={type}>
                        <p className="text-xs text-gray-500 mb-1">
                          {type === "start_odometer" ? "Start Odometer" : "End Odometer"}
                        </p>
                        {photo ? (
                          <img src={photo.dataUrl} alt={type}
                            className="w-full h-32 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                            <p className="text-xs text-gray-400">No photo uploaded</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Approve / Reject */}
                {!showReject ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Comments (optional)</label>
                      <Input value={comments} onChange={e => setComments(e.target.value)}
                        placeholder="Any notes for HR..." />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setShowReject(true)}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(selected)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve & Forward to HR
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason for Rejection *</label>
                      <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        placeholder="e.g. Odometer readings inconsistent, photos unclear" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowReject(false)}>Cancel</Button>
                      <Button className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => handleReject(selected)}>
                        Confirm Rejection
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

NEW FILE 5 — src/app/components/travel/TravelHRView.tsx
HR sees all trips pending HR approval across all cities, plus full history.
tsximport { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { travelReimbursementService, type TravelTrip, type TripStatus } from "../../services/travelReimbursementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, Download, Search } from "lucide-react";
import { toast } from "sonner";

export function TravelHRView() {
  const { currentUser } = useRole();
  const { city } = useCity();
  const [tab, setTab]         = useState<"pending" | "history">("pending");
  const [selected, setSelected] = useState<TravelTrip | null>(null);
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [searchQ, setSearchQ]  = useState("");
  const [refresh, setRefresh]  = useState(0);

  const pending = travelReimbursementService.getPendingHRApproval();
  const allTrips = travelReimbursementService.getTripsByCity(city);

  const filtered = allTrips.filter(t =>
    !searchQ ||
    t.employeeName.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.purposeOfVisit.toLowerCase().includes(searchQ.toLowerCase())
  );

  const STATUS_COLORS: Record<string, string> = {
    "Draft":           "bg-gray-100 text-gray-700",
    "Pending Manager": "bg-amber-100 text-amber-700",
    "Pending HR":      "bg-blue-100 text-blue-700",
    "Approved":        "bg-green-100 text-green-700",
    "Rejected":        "bg-red-100 text-red-700",
    "Added to Payroll":"bg-purple-100 text-purple-700",
  };

  const handleApprove = () => {
    if (!selected) return;
    travelReimbursementService.hrApprove(selected.id, currentUser?.name || "HR", comments);
    toast.success(`Approved. ₹${selected.netPayableAmount?.toLocaleString()} will be added to ${selected.employeeName}'s next salary. No TDS/Tax deducted.`);
    setSelected(null); setComments(""); setRefresh(r => r + 1);
  };

  const handleReject = () => {
    if (!selected) return;
    if (!rejectReason.trim()) { toast.error("Rejection reason is required"); return; }
    travelReimbursementService.reject(selected.id, currentUser?.name || "HR", rejectReason);
    toast.success("Trip rejected.");
    setSelected(null); setShowReject(false); setRejectReason(""); setRefresh(r => r + 1);
  };

  // CSV Export
  const handleExport = () => {
    const rows = [
      ["Employee","Date","Vehicle","Purpose","Distance (km)","Rate","Amount","Status","Manager","HR","Payroll Month"],
      ...allTrips.map(t => [
        t.employeeName, t.tripDate, t.vehicleType, t.purposeOfVisit,
        t.totalKm || "", t.ratePerKm, t.netPayableAmount || "",
        t.status, t.managerApprovedBy || "", t.hrApprovedBy || "", t.payrollMonth || "",
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = `travel_reimbursements_${city}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Travel Reimbursements — HR</h1>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending HR",    value: pending.length,                             color: "text-blue-700"  },
          { label: "Approved",      value: allTrips.filter(t => t.status === "Approved" || t.status === "Added to Payroll").length, color: "text-green-700" },
          { label: "Total Amount",  value: `₹${allTrips.filter(t => t.status !== "Rejected" && t.status !== "Draft").reduce((s,t) => s + (t.netPayableAmount||0), 0).toLocaleString()}`, color: "text-purple-700" },
          { label: "In Payroll",    value: allTrips.filter(t => t.status === "Added to Payroll").length, color: "text-gray-700" },
        ].map(k => (
          <div key={k.label} className="bg-white border rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {(["pending","history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
            {t === "pending" ? `Pending HR Approval (${pending.length})` : `All Records (${allTrips.length})`}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by employee or purpose..."
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
      )}

      {/* List */}
      {!selected && (
        <div className="space-y-3">
          {(tab === "pending" ? pending : filtered).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{tab === "pending" ? "No trips pending HR approval." : "No records found."}</p>
            </div>
          )}
          {(tab === "pending" ? pending : filtered).map(trip => (
            <Card key={trip.id} className="hover:shadow-md cursor-pointer" onClick={() => setSelected(trip)}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{trip.employeeName}</p>
                    <Badge className={`text-xs ${STATUS_COLORS[trip.status]}`}>{trip.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{trip.designation} · {trip.tripDate} · {trip.totalKm} km</p>
                  <p className="text-xs text-gray-600 mt-0.5">{trip.purposeOfVisit}</p>
                </div>
                <p className="font-bold text-green-700 text-sm">₹{trip.netPayableAmount?.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail / Approve panel */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">HR Review — {selected.employeeName}</CardTitle>
              <button onClick={() => { setSelected(null); setShowReject(false); }} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              {[
                ["Employee",     `${selected.employeeName} — ${selected.designation}`],
                ["Date",         selected.tripDate],
                ["Vehicle",      `${selected.vehicleType} — ${selected.vehicleNumber}`],
                ["Purpose",      selected.purposeOfVisit],
                ["Outcome",      selected.outcomeOfVisit || "—"],
                ["Distance",     `${selected.totalKm} km`],
                ["Rate",         `₹${selected.ratePerKm}/km`],
                ["Manager",      selected.managerApprovedBy || "—"],
                ["Mgr Comments", selected.managerComments || "—"],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-right max-w-[60%]">{v}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Amount</span>
                <span className="text-green-700">₹{selected.netPayableAmount?.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-400 flex justify-between">
                <span>Tax / TDS</span><span>₹0 — No deduction (travel allowance per IT Act)</span>
              </div>
            </div>

            {/* Photos */}
            <div className="grid grid-cols-2 gap-3">
              {([["start_odometer", selected.startPhotoId],["end_odometer", selected.endPhotoId]] as const).map(([type, photoId]) => {
                const photo = photoId ? travelReimbursementService.getPhoto(photoId) : undefined;
                return (
                  <div key={type}>
                    <p className="text-xs text-gray-500 mb-1">{type === "start_odometer" ? "Start Odometer" : "End Odometer"}</p>
                    {photo ? (
                      <img src={photo.dataUrl} alt={type} className="w-full h-32 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <p className="text-xs text-gray-400">No photo</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selected.status === "Pending HR" && !showReject && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">HR Comments (optional)</label>
                  <Input value={comments} onChange={e => setComments(e.target.value)} placeholder="Any notes for records..." />
                </div>
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                  Approving will mark this for addition to {selected.employeeName}'s salary for {new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}. No TDS will be deducted.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowReject(true)}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Final Approve & Add to Salary
                  </Button>
                </div>
              </>
            )}
            {showReject && (
              <>
                <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection *" />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowReject(false)}>Cancel</Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleReject}>Confirm Rejection</Button>
                </div>
              </>
            )}
            {selected.status !== "Pending HR" && (
              <div className={`rounded-lg p-3 text-sm ${STATUS_COLORS[selected.status] || "bg-gray-50"}`}>
                Status: <strong>{selected.status}</strong>
                {selected.hrApprovedBy && ` · Approved by ${selected.hrApprovedBy}`}
                {selected.payrollMonth && ` · Payroll: ${selected.payrollMonth}`}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

NEW FILE 6 — src/app/components/travel/TravelAdminSettings.tsx
Super Admin sets rates + exceptions. City Manager can only manage permissions for their city.
tsximport { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { travelReimbursementService, type VehicleType, type TravelExceptionPolicy } from "../../services/travelReimbursementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Settings, Users, Bike, Car, Plus, Trash2, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface Props { cityManagerMode?: boolean; }

export function TravelAdminSettings({ cityManagerMode = false }: Props) {
  const { currentUser, currentRole } = useRole();
  const { employees } = useEmployee();
  const { city, availableCities } = useCity();
  const isSuperAdmin = currentRole === "Super Admin" || currentRole === "Admin";

  const [tab, setTab] = useState<"rates" | "permissions" | "exceptions">(cityManagerMode ? "permissions" : "rates");
  const [refresh, setRefresh] = useState(0);

  // ── Rates state ──
  const rates = travelReimbursementService.getRates();
  const [editing2W, setEditing2W] = useState(false);
  const [editing4W, setEditing4W] = useState(false);
  const [new2W, setNew2W] = useState(rates.find(r => r.vehicleType === "2W")?.ratePerKm || 3);
  const [new4W, setNew4W] = useState(rates.find(r => r.vehicleType === "4W")?.ratePerKm || 6);

  const saveRate = (vt: VehicleType, rate: number) => {
    travelReimbursementService.setRate(vt, rate, currentUser?.name || "Super Admin");
    toast.success(`${vt} rate updated to ₹${rate}/km`);
    if (vt === "2W") setEditing2W(false);
    else setEditing4W(false);
    setRefresh(r => r + 1);
  };

  // ── Permissions state ──
  const permissions = travelReimbursementService.getPermissions(city);
  const cityEmps = employees.filter(e =>
    e.status === "Active" && (e.workLocation === city || e.cityId === city)
  );

  const togglePermission = (emp: typeof cityEmps[0]) => {
    const isEnabled = travelReimbursementService.isEmployeeEnabled(emp.id);
    const perm = permissions.find(p => p.employeeId === emp.id);
    travelReimbursementService.setPermission(
      emp.id, emp.fullName, emp.designation, city,
      (perm?.vehicleType as VehicleType) || "2W",
      !isEnabled, currentUser?.name || "Manager"
    );
    toast.success(`Travel module ${!isEnabled ? "enabled" : "disabled"} for ${emp.fullName}`);
    setRefresh(r => r + 1);
  };

  const updateVehicleType = (empId: string, vt: VehicleType) => {
    const emp = cityEmps.find(e => e.id === empId);
    if (!emp) return;
    const isEnabled = travelReimbursementService.isEmployeeEnabled(empId);
    travelReimbursementService.setPermission(
      empId, emp.fullName, emp.designation, city,
      vt, isEnabled, currentUser?.name || "Manager"
    );
    setRefresh(r => r + 1);
  };

  // ── Exceptions state ──
  const exceptions = travelReimbursementService.getExceptions();
  const [excType, setExcType]         = useState<"individual" | "uniform">("individual");
  const [excEmpId, setExcEmpId]       = useState("");
  const [excVehicle, setExcVehicle]   = useState<VehicleType>("2W");
  const [excRate, setExcRate]         = useState<number | "">("");
  const [excReason, setExcReason]     = useState("");
  const [excFrom, setExcFrom]         = useState(new Date().toISOString().split("T")[0]);
  const [excTo, setExcTo]             = useState("");

  const addException = () => {
    if (excRate === "" || excRate <= 0) { toast.error("Override rate is required"); return; }
    if (!excReason.trim())             { toast.error("Reason is required"); return; }
    if (excType === "individual" && !excEmpId) { toast.error("Select an employee"); return; }

    const emp = employees.find(e => e.id === excEmpId);
    travelReimbursementService.saveException({
      type: excType, vehicleType: excVehicle,
      employeeId: excType === "individual" ? excEmpId : undefined,
      employeeName: excType === "individual" ? emp?.fullName : "All Employees",
      overrideRatePerKm: Number(excRate),
      reason: excReason, validFrom: excFrom, validTo: excTo || undefined,
      setBy: currentUser?.name || "Super Admin", isActive: true,
    });
    toast.success("Exception policy saved.");
    setExcRate(""); setExcReason(""); setExcEmpId("");
    setRefresh(r => r + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Travel Reimbursement — Settings</h1>
          <p className="text-sm text-gray-500">
            {cityManagerMode ? "Manage employee access for your city" : "Global rates, permissions and exceptions"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(!cityManagerMode ? ["rates","permissions","exceptions"] : ["permissions"]).map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? "border-slate-700 text-slate-900" : "border-transparent text-gray-500"
            }`}>{t}</button>
        ))}
      </div>

      {/* ── RATES TAB ── (Super Admin only) */}
      {tab === "rates" && (
        <div className="grid grid-cols-2 gap-4">
          {([["2W", new2W, editing2W, setNew2W, setEditing2W],
             ["4W", new4W, editing4W, setNew4W, setEditing4W]] as const).map(([vt, val, editing, setVal, setEdit]) => {
            const stored = rates.find(r => r.vehicleType === vt);
            return (
              <Card key={vt}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {vt === "2W" ? <Bike className="w-5 h-5 text-blue-600" /> : <Car className="w-5 h-5 text-green-600" />}
                    <span className="font-semibold">{vt === "2W" ? "Two Wheeler" : "Four Wheeler"}</span>
                  </div>
                  {!editing ? (
                    <>
                      <div className="text-3xl font-bold text-gray-900 mb-1">₹{stored?.ratePerKm ?? (vt === "2W" ? 3 : 6)}<span className="text-sm font-normal text-gray-400">/km</span></div>
                      <p className="text-xs text-gray-400 mb-3">Set by: {stored?.setBy || "System"} · {stored?.effectiveFrom}</p>
                      {isSuperAdmin && (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setEdit(true)}>
                          Change Rate
                        </Button>
                      )}
                      {!isSuperAdmin && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          <Shield className="w-3 h-3" /> Only Super Admin can change rates
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Input type="number" value={val} onChange={e => setVal(Number(e.target.value) as any)} min={1} max={50} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setEdit(false)}>Cancel</Button>
                        <Button size="sm" className="flex-1" onClick={() => saveRate(vt, Number(val))}>Save</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── PERMISSIONS TAB ── */}
      {tab === "permissions" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Toggle which employees can submit travel reimbursements. Only enabled employees will see the module.
          </p>
          {cityEmps.length === 0 && (
            <p className="text-center text-gray-400 py-8">No active employees found for this city.</p>
          )}
          {cityEmps.map(emp => {
            const enabled = travelReimbursementService.isEmployeeEnabled(emp.id);
            const perm = permissions.find(p => p.employeeId === emp.id);
            return (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm">
                <div>
                  <p className="font-medium text-sm text-gray-900">{emp.fullName}</p>
                  <p className="text-xs text-gray-500">{emp.designation} · {emp.pinCodes?.[0] || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {enabled && (
                    <select className="text-xs border rounded px-1.5 py-1"
                      value={perm?.vehicleType || "2W"}
                      onChange={e => updateVehicleType(emp.id, e.target.value as VehicleType)}>
                      <option value="2W">2 Wheeler</option>
                      <option value="4W">4 Wheeler</option>
                    </select>
                  )}
                  <button onClick={() => togglePermission(emp)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      enabled ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                    }`}>
                    {enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EXCEPTIONS TAB ── (Super Admin only) */}
      {tab === "exceptions" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Add Exception Policy</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                {(["individual","uniform"] as const).map(t => (
                  <button key={t} onClick={() => setExcType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                      excType === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600 border-gray-200"
                    }`}>{t}</button>
                ))}
              </div>
              {excType === "individual" && (
                <select className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={excEmpId} onChange={e => setExcEmpId(e.target.value)}>
                  <option value="">— Select employee —</option>
                  {employees.filter(e => e.status === "Active").map(e => (
                    <option key={e.id} value={e.id}>{e.fullName} — {e.designation}</option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Vehicle Type</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={excVehicle} onChange={e => setExcVehicle(e.target.value as VehicleType)}>
                    <option value="2W">2 Wheeler</option>
                    <option value="4W">4 Wheeler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Override Rate (₹/km)</label>
                  <Input type="number" value={excRate} onChange={e => setExcRate(Number(e.target.value))} min={1} placeholder="e.g. 4" />
                </div>
              </div>
              <Input value={excReason} onChange={e => setExcReason(e.target.value)} placeholder="Reason for exception *" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Valid From</label>
                  <Input type="date" value={excFrom} onChange={e => setExcFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Valid To (blank = indefinite)</label>
                  <Input type="date" value={excTo} onChange={e => setExcTo(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={addException}>
                <Plus className="w-4 h-4 mr-1" /> Save Exception
              </Button>
            </CardContent>
          </Card>

          {/* Existing exceptions */}
          <div className="space-y-2">
            {exceptions.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No exception policies defined.</p>
            )}
            {exceptions.map(exc => (
              <div key={exc.id} className="flex items-center justify-between p-3 bg-white border rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={exc.type === "uniform" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                      {exc.type === "uniform" ? "All Employees" : exc.employeeName}
                    </Badge>
                    <span className="text-xs text-gray-500">{exc.vehicleType}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-1">₹{exc.overrideRatePerKm}/km</p>
                  <p className="text-xs text-gray-400">{exc.reason} · From {exc.validFrom}{exc.validTo ? ` to ${exc.validTo}` : " (indefinite)"}</p>
                </div>
                <button onClick={() => { travelReimbursementService.deleteException(exc.id); setRefresh(r => r + 1); }}
                  className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

CHANGE 1 — src/app/types/permissions.ts
Find the Module type. Add "travel" to the union:
ts| "travel"

CHANGE 2 — src/app/config/navigationConfig.ts
Add the following entry inside the HR & People children array, after the "Advances" entry:
ts{ label: "Travel Reimbursement", path: "/travel", icon: Car, module: "hr", match: "prefix" },
Add Car to the lucide-react imports at the top of this file if not already present.

CHANGE 3 — src/app/routes.tsx
Add the lazy import:
tsconst TravelReimbursementModule = lazy(() => import("./components/travel/TravelReimbursementModule"));
Add the route inside the main routes array:
ts{ path: "travel", element: <TravelReimbursementModule /> },
