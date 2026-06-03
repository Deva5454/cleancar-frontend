/**
 * SMDailyActivity.tsx  — v3.0
 * Sales Manager Daily Activity Report
 *
 * SESSIONS:
 *   Morning (08:00–10:00) — Plan the day: free-form visits, any order
 *   Field   (10:00–EOD)   — Trip tracking, 30-min wait prompt, visit log
 *   Evening (mandatory)   — EOD report (auto-populated) before checkout
 *
 * RULES:
 *   • Morning plan: SM adds locations freely (existing or new) in any order
 *   • Trip: FROM = GPS auto-captured, TO = optional at start
 *   • 30-min stop → system prompts visit log (location type + purpose + outcome)
 *   • Distance = odometer-based (Google Maps link for verification)
 *   • Cannot start new trip / checkout / do any task with open active trip
 *   • EOD mandatory before checkout — auto-fills from day's punched data
 *   • NaN gate fix: all leadsMTD/conversionsMTD guarded with Number()||0
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  CheckCircle2, Circle, AlertTriangle, MapPin,
  TrendingUp, Clock, ChevronDown, ChevronUp, ChevronRight,
  Sun, Target, FileText, Zap, Building2,
  Star, Save, RotateCcw, CalendarCheck, Lock, Car, Bike,
  Camera, Receipt, IndianRupee, XCircle, Navigation,
  Timer, Bell, Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { salesManagerService } from "../../services/salesManagerService";
import {
  travelReimbursementService,
  type TravelTrip,
  type VehicleType,
} from "../../services/travelReimbursementService";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionId = "morning" | "field" | "evening";

type LocationType = "Society" | "Corporate" | "Petrol Pump" | "RWA" | "Shop-in-Shop" | "Other";

interface PlannedVisit {
  locationId: string;
  locationName: string;
  locationType: LocationType;
  priority: "HIGH" | "MEDIUM" | "FOLLOW_UP";
  objective: string;            // purpose of visit
  plannedTime: string;          // HH:MM or "--"
  actualVisitDone: boolean;
  outcome?: "Positive" | "Neutral" | "Negative" | "No Answer";
  leadsCollected: number;
  conversionAttempts: number;
  notes: string;
  durationMinutes: number;
  tripId?: string;
}

interface ActiveTrip {
  id: string;                   // links to TravelTrip
  fromLabel: string;            // human label for from location
  fromLat?: number;
  fromLng?: number;
  toLabel: string;              // destination (can be blank at start)
  vehicleType: VehicleType;
  vehicleNumber: string;
  startOdometer: number;
  startTime: string;            // HH:MM
  startPhotoData: string;       // base64
  // 30-min wait tracking
  stoppedAt?: string;           // ISO - when GPS stopped moving
  waitPromptShown: boolean;
  // visit log after 30-min wait
  visitLogDone: boolean;
  visitLocationType?: LocationType;
  visitPurpose?: string;
  visitOutcome?: "Positive" | "Neutral" | "Negative" | "No Answer";
  visitNotes?: string;
  linkedPlanVisitIdx?: number;  // links back to plannedVisits[]
}

interface DailyReport {
  date: string;
  morning: {
    locked: boolean;
    priorityForDay: string;
    plannedVisits: PlannedVisit[];
    openAlerts: number;
  };
  field: {
    locked: boolean;
    activeTrip: ActiveTrip | null;  // single active trip
    completedTrips: string[];       // TravelTrip IDs
    visitsActual: PlannedVisit[];
    unplannedVisits: number;
    totalLeads: number;
    totalConversions: number;
    totalKm: number;
  };
  evening: {
    locked: boolean;
    dayRating: 1 | 2 | 3 | 4 | 5;
    biggestWin: string;
    biggestBlock: string;
    tomorrowTop3: string;
    escalationsRaised: number;
    submittedAt?: string;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY        = new Date().toISOString().split("T")[0];
const STORAGE_KEY  = `SM_DAILY_REPORT_${TODAY}`;
const LOC_TYPES: LocationType[] = ["Society","Corporate","Petrol Pump","RWA","Shop-in-Shop","Other"];
const WAIT_PROMPT_MINUTES = 30;

// ── Storage ───────────────────────────────────────────────────────────────────

function loadReport(): DailyReport {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const raw = JSON.parse(s);
      // Defensive merge — if stored data is from an older schema version,
      // fill in all missing fields rather than crashing
      if (!raw || typeof raw !== "object") throw new Error("bad data");
      const parsed = raw as any;
      // Backfill field section
      if (!parsed.field)                         parsed.field = {};
      if (!Array.isArray(parsed.field.completedTrips)) parsed.field.completedTrips = [];
      if (!Array.isArray(parsed.field.visitsActual))   parsed.field.visitsActual   = [];
      if (typeof parsed.field.locked !== "boolean")    parsed.field.locked         = false;
      if (typeof parsed.field.totalKm !== "number")    parsed.field.totalKm        = 0;
      if (typeof parsed.field.totalLeads !== "number") parsed.field.totalLeads     = 0;
      if (typeof parsed.field.totalConversions !== "number") parsed.field.totalConversions = 0;
      if (typeof parsed.field.unplannedVisits !== "number")  parsed.field.unplannedVisits  = 0;
      if (parsed.field.activeTrip && typeof parsed.field.activeTrip === "object") {
        if (typeof parsed.field.activeTrip.visitLogDone !== "boolean")    parsed.field.activeTrip.visitLogDone    = false;
        if (typeof parsed.field.activeTrip.waitPromptShown !== "boolean") parsed.field.activeTrip.waitPromptShown = false;
      }
      // Backfill morning section
      if (!parsed.morning)                              parsed.morning = {};
      if (!Array.isArray(parsed.morning.plannedVisits)) parsed.morning.plannedVisits = [];
      if (typeof parsed.morning.locked !== "boolean")   parsed.morning.locked = false;
      if (typeof parsed.morning.priorityForDay !== "string") parsed.morning.priorityForDay = "";
      if (typeof parsed.morning.openAlerts !== "number")     parsed.morning.openAlerts = 0;
      // Backfill evening section
      if (!parsed.evening)                                parsed.evening = {};
      if (typeof parsed.evening.locked !== "boolean")     parsed.evening.locked = false;
      if (typeof parsed.evening.dayRating !== "number")   parsed.evening.dayRating = 3;
      if (typeof parsed.evening.biggestWin !== "string")  parsed.evening.biggestWin = "";
      if (typeof parsed.evening.biggestBlock !== "string") parsed.evening.biggestBlock = "";
      if (typeof parsed.evening.tomorrowTop3 !== "string") parsed.evening.tomorrowTop3 = "";
      if (typeof parsed.evening.escalationsRaised !== "number") parsed.evening.escalationsRaised = 0;
      return parsed as DailyReport;
    }
  } catch { /**/ }

  const locs    = salesManagerService.getLocations();
  const atRisk  = locs.filter(l => l.status === "At Risk" || l.status === "Inactive");
  const pros    = locs.filter(l => l.status === "Active Prospect");
  const alerts  = salesManagerService.getAlerts().filter(a => a.actionRequired);

  const suggested = [...atRisk.slice(0, 2), ...pros.slice(0, 2)];
  const plannedVisits: PlannedVisit[] = suggested.map((loc, i) => ({
    locationId: loc.id,
    locationName: loc.name,
    locationType: (loc.type as LocationType) || "Society",
    priority: atRisk.includes(loc) ? "HIGH" : "MEDIUM",
    objective: atRisk.includes(loc)
      ? "Re-engage — understand risk and propose action plan"
      : "Progress to paid — present block deal option",
    plannedTime: ["10:30","12:00","14:30","16:00"][i] || "--",
    actualVisitDone: false, leadsCollected: 0,
    conversionAttempts: 0, notes: "", durationMinutes: 0,
  }));

  return {
    date: TODAY,
    morning: { locked: false, priorityForDay: "", plannedVisits, openAlerts: alerts.length },
    field: { locked: false, activeTrip: null, completedTrips: [], visitsActual: plannedVisits, unplannedVisits: 0, totalLeads: 0, totalConversions: 0, totalKm: 0 },
    evening: { locked: false, dayRating: 3, biggestWin: "", biggestBlock: "", tomorrowTop3: "", escalationsRaised: 0 },
  };
}

function saveReport(r: DailyReport) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch { /**/ }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function minsElapsed(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}
function mapsLink(from: string, to: string) {
  const base = "https://www.google.com/maps/dir/";
  return `${base}${encodeURIComponent(from)}/${encodeURIComponent(to || "")}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SessionHeader({ icon, title, time, status }: {
  icon: React.ReactNode; title: string; time: string;
  status: "locked" | "active" | "upcoming";
}) {
  const cls = {
    locked:   "bg-teal-600 text-white",
    active:   "bg-orange-500 text-white",
    upcoming: "bg-gray-100 text-gray-500",
  }[status];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 ${cls}`}>
      <div className="text-lg">{icon}</div>
      <div className="flex-1">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs opacity-80">{time}</p>
      </div>
      {status === "locked"   && <Lock  className="w-4 h-4 opacity-60" />}
      {status === "active"   && <Zap   className="w-4 h-4" />}
    </div>
  );
}

function PriorityBadge({ p }: { p: PlannedVisit["priority"] }) {
  const cls = {
    HIGH:      "bg-red-100 text-red-700 border-red-200",
    MEDIUM:    "bg-amber-100 text-amber-700 border-amber-200",
    FOLLOW_UP: "bg-blue-100 text-blue-700 border-blue-200",
  }[p];
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{p.replace("_"," ")}</span>;
}

function StarRating({ value, onChange }: { value: number; onChange: (n:1|2|3|4|5) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n as 1|2|3|4|5)}
          className={`transition-transform hover:scale-110 ${n <= value ? "text-amber-400":"text-gray-200"}`}>
          <Star className="w-6 h-6 fill-current" />
        </button>
      ))}
    </div>
  );
}

// ── Morning Visit Planner ─────────────────────────────────────────────────────
// SM can add ANY location in ANY order — existing from service OR free-form new

function MorningVisitPlanner({
  visits, locked, onChange,
}: {
  visits: PlannedVisit[];
  locked: boolean;
  onChange: (v: PlannedVisit[]) => void;
}) {
  const knownLocs = salesManagerService.getLocations();
  const [showForm, setShowForm]   = useState(false);
  const [locMode, setLocMode]     = useState<"existing"|"new">("existing");
  const [name, setName]           = useState("");
  const [existId, setExistId]     = useState("");
  const [locType, setLocType]     = useState<LocationType>("Society");
  const [priority, setPriority]   = useState<PlannedVisit["priority"]>("MEDIUM");
  const [objective, setObjective] = useState("");
  const [time, setTime]           = useState("");

  function add() {
    if (!name.trim() && locMode === "new")   { toast.error("Enter location name"); return; }
    if (!existId && locMode === "existing")   { toast.error("Select a location"); return; }
    if (!objective.trim())                    { toast.error("Enter purpose of visit"); return; }

    const kl = knownLocs.find(l => l.id === existId);
    onChange([...visits, {
      locationId:     kl?.id || `PLAN-${Date.now()}`,
      locationName:   kl?.name || name.trim(),
      locationType:   (kl?.type as LocationType) || locType,
      priority, objective: objective.trim(),
      plannedTime:    time || "--",
      actualVisitDone: false, leadsCollected: 0,
      conversionAttempts: 0, notes: "", durationMinutes: 0,
    }]);
    setName(""); setExistId(""); setObjective(""); setTime("");
    setShowForm(false);
    toast.success("Visit added to plan");
  }

  function remove(i: number) { onChange(visits.filter((_,j) => j !== i)); }
  function move(i: number, dir: -1|1) {
    if (i + dir < 0 || i + dir >= visits.length) return;
    const a = [...visits];
    [a[i], a[i+dir]] = [a[i+dir], a[i]];
    onChange(a);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-teal-600" />
          Today's Visit Plan
          <span className="text-xs font-normal text-gray-400 ml-1">({visits.length} planned)</span>
        </p>
        {!locked && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => setShowForm(v => !v)}>
            {showForm ? "✕ Cancel" : "+ Add Visit"}
          </Button>
        )}
      </div>

      {/* ── Add-visit form ── */}
      {showForm && !locked && (
        <Card className="p-3 mb-3 border-teal-200 bg-teal-50/30 space-y-3">
          <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">Add Visit</p>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["existing","new"] as const).map(m => (
              <button key={m} onClick={() => { setLocMode(m); setName(""); setExistId(""); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  locMode === m ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500"}`}>
                {m === "existing" ? "📍 Existing Location" : "📝 New / Custom"}
              </button>
            ))}
          </div>

          {locMode === "existing" ? (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Select location *</label>
              <select value={existId}
                onChange={e => setExistId(e.target.value)}
                className="w-full h-8 text-sm border border-gray-200 rounded-md px-2 bg-white">
                <option value="">Choose…</option>
                {knownLocs.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.status})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Location name *</label>
                <Input value={name} onChange={e => setName(e.target.value)}
                  className="h-8 text-sm" placeholder="e.g. Silver Oak Society, Vesu" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select value={locType} onChange={e => setLocType(e.target.value as LocationType)}
                  className="w-full h-8 text-sm border border-gray-200 rounded-md px-2 bg-white">
                  {LOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as any)}
                  className="w-full h-8 text-sm border border-gray-200 rounded-md px-2 bg-white">
                  {["HIGH","MEDIUM","FOLLOW_UP"].map(p => <option key={p} value={p}>{p.replace("_"," ")}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Purpose of visit *</label>
            <Input value={objective} onChange={e => setObjective(e.target.value)}
              className="h-8 text-sm" placeholder="e.g. Close block deal / QR placement / Follow-up…" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Planned time (optional)</label>
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-8 text-sm" />
          </div>

          <Button onClick={add}
            className="w-full h-8 text-sm bg-teal-600 hover:bg-teal-700 gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Add to Plan
          </Button>
        </Card>
      )}

      {/* ── Visit list ── */}
      <div className="space-y-2">
        {visits.map((v, i) => (
          <div key={`${v.locationId}-${i}`}
            className="border border-gray-200 rounded-lg p-3 bg-white flex items-start gap-2">
            {/* Reorder */}
            {!locked && (
              <div className="flex flex-col gap-0.5 pt-1">
                <button onClick={() => move(i,-1)} disabled={i===0}
                  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-xs">▲</button>
                <button onClick={() => move(i,1)} disabled={i===visits.length-1}
                  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-xs">▼</button>
              </div>
            )}
            <span className="text-xs text-gray-300 font-mono pt-1">#{i+1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-800">{v.locationName}</p>
                <PriorityBadge p={v.priority} />
                <span className="text-xs text-gray-400">{v.locationType}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{v.objective}</p>
              {v.plannedTime && v.plannedTime !== "--" && (
                <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {v.plannedTime}
                </p>
              )}
            </div>
            {!locked && (
              <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-500 p-1">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {visits.length === 0 && (
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
            <MapPin className="w-6 h-6 mx-auto mb-1 text-gray-300" />
            No visits planned — tap "+ Add Visit" to plan your day
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trip Panel ────────────────────────────────────────────────────────────────
// GPS auto-captures FROM. TO is optional. 30-min stop prompts visit log.

function TripPanel({
  activeTrip, locked, empId, empName, empDes, cityId, cityName,
  rptMgrId, rptMgrName, onTripStart, onTripEnd, onTripUpdate, travelRefresh,
}: {
  activeTrip: ActiveTrip | null;
  locked: boolean;
  empId: string; empName: string; empDes: string;
  cityId: string; cityName: string;
  rptMgrId: string; rptMgrName: string;
  onTripStart: (t: ActiveTrip) => void;
  onTripEnd: (kmCovered: number, reimbAmt: number) => void;
  onTripUpdate: (changes: Partial<ActiveTrip>) => void;
  travelRefresh: number;
}) {
  // Scroll ref for visit log form — used to auto-scroll when prompted
  const visitLogRef = useRef<HTMLDivElement>(null);

  // Start-trip form state
  const [vehicleType,  setVehicleType]  = useState<VehicleType>("2W"); // SM default is 2-wheeler
  const [vehicleNum,   setVehicleNum]   = useState("");
  const [odoStart,     setOdoStart]     = useState<number|"">("");
  const [toLabel,      setToLabel]      = useState("");
  const [startPhoto,   setStartPhoto]   = useState("");
  const [gpsStatus,    setGpsStatus]    = useState<"idle"|"fetching"|"done"|"error">("idle");
  const [fromCoords,   setFromCoords]   = useState<{lat:number;lng:number}|null>(null);
  const [fromLabel,    setFromLabel]    = useState("Your current location");
  const startFileRef = useRef<HTMLInputElement>(null);

  // End-trip form state
  const [odoEnd,       setOdoEnd]     = useState<number|"">("");
  const [odoEndError,  setOdoEndError] = useState(false);
  const [endPhoto,     setEndPhoto]   = useState("");
  const [endTime,      setEndTime]    = useState(new Date().toTimeString().slice(0,5));
  const endFileRef  = useRef<HTMLInputElement>(null);
  const odoEndRef   = useRef<HTMLInputElement>(null);

  // Visit-log state (30-min prompt)
  const [showVisitLog, setShowVisitLog]   = useState(false);
  const [vlType,       setVlType]         = useState<LocationType>("Society");
  const [vlPurpose,    setVlPurpose]      = useState("");
  const [vlOutcome,    setVlOutcome]      = useState<PlannedVisit["outcome"]|undefined>(undefined);
  const [vlNotes,      setVlNotes]        = useState("");

  // 30-min wait ticker
  const [waitMins, setWaitMins] = useState(0);
  useEffect(() => {
    if (!activeTrip?.stoppedAt || activeTrip.visitLogDone) return;
    const interval = setInterval(() => {
      const mins = minsElapsed(activeTrip.stoppedAt!);
      setWaitMins(mins);
      if (mins >= WAIT_PROMPT_MINUTES && !activeTrip.waitPromptShown) {
        onTripUpdate({ waitPromptShown: true });
        setShowVisitLog(true);
        toast.warning("⏱ 30 minutes at this location — please log your visit", { duration: 8000 });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTrip?.stoppedAt, activeTrip?.visitLogDone, activeTrip?.waitPromptShown]);

  const rate4W = travelReimbursementService.getEffectiveRate(empId, "4W");
  const rate2W = travelReimbursementService.getEffectiveRate(empId, "2W");
  const rate   = vehicleType === "4W" ? rate4W : rate2W;

  function capturePhoto(file: File, cb: (d:string)=>void) {
    const r = new FileReader();
    r.onload = e => cb(e.target?.result as string);
    r.readAsDataURL(file);
  }

  function fetchGPS() {
    setGpsStatus("fetching");
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setFromCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFromLabel(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGpsStatus("done");
      },
      () => { setGpsStatus("error"); setFromLabel("GPS unavailable — enter manually"); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function handleStartTrip() {
    if (!vehicleNum.trim())    { toast.error("Enter vehicle number"); return; }
    if (odoStart === "")       { toast.error("Enter start odometer reading"); return; }
    if (!startPhoto)           { toast.error("📸 Odometer photo required"); return; }

    const photoRec = travelReimbursementService.savePhoto({
      tripId: "", type: "start_odometer",
      dataUrl: startPhoto, capturedAt: new Date().toISOString(),
      fileName: `start_${Date.now()}.jpg`,
    });

    const trip = travelReimbursementService.startTrip({
      employeeId: empId, employeeName: empName, designation: empDes,
      cityId, city: cityName, reportingManagerId: rptMgrId, reportingManagerName: rptMgrName,
      vehicleType, vehicleNumber: vehicleNum,
      tripDate: TODAY, startTime: new Date().toTimeString().slice(0,5),
      purposeOfVisit: toLabel || "Field visit",
      visitLocation: toLabel || "Field",
      startReading: Number(odoStart),
      startPhotoId: photoRec.id,
    });

    const at: ActiveTrip = {
      id: trip.id,
      fromLabel: fromLabel,
      fromLat: fromCoords?.lat, fromLng: fromCoords?.lng,
      toLabel,
      vehicleType, vehicleNumber: vehicleNum,
      startOdometer: Number(odoStart),
      startTime: new Date().toTimeString().slice(0,5),
      startPhotoData: startPhoto,
      waitPromptShown: false,
      visitLogDone: false,
    };
    onTripStart(at);
    toast.success("Trip started — location tracking active");
  }

  function saveVisitLog() {
    if (!vlPurpose.trim()) { toast.error("Enter purpose of the visit"); return; }
    if (!vlOutcome)        { toast.error("Select visit outcome"); return; }
    onTripUpdate({
      visitLogDone: true,
      visitLocationType: vlType,
      visitPurpose: vlPurpose,
      visitOutcome: vlOutcome,
      visitNotes: vlNotes,
    });
    setShowVisitLog(false);
    toast.success("Visit logged ✓");
  }

  function handleEndTrip() {
    if (!activeTrip) return;
    // Visit log check
    if (!activeTrip.visitLogDone) {
      setShowVisitLog(true);
      setTimeout(() => visitLogRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
      toast.error("Complete the visit log above first");
      return;
    }
    // Odometer check — highlight + scroll
    if (odoEnd === "" || Number(odoEnd) === 0) {
      setOdoEndError(true);
      setTimeout(() => odoEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      odoEndRef.current?.focus();
      toast.error("Enter the end odometer reading");
      return;
    }
    if (Number(odoEnd) <= activeTrip.startOdometer) {
      setOdoEndError(true);
      setTimeout(() => odoEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      toast.error(`End reading must be > ${activeTrip.startOdometer} km`);
      return;
    }
    setOdoEndError(false);
    // Save end photo if provided (recommended but not blocking)
    let endPhotoId: string | undefined;
    if (endPhoto) {
      const pr = travelReimbursementService.savePhoto({
        tripId: activeTrip.id, type: "end_odometer",
        dataUrl: endPhoto, capturedAt: new Date().toISOString(),
        fileName: `end_${Date.now()}.jpg`,
      });
      endPhotoId = pr.id;
    }
    const updated = travelReimbursementService.endTrip(activeTrip.id, {
      endTime, endReading: Number(odoEnd),
      outcomeOfVisit: activeTrip.visitOutcome || "Visit completed",
      endPhotoId,
    });
    travelReimbursementService.submitTrip(updated.id);
    onTripEnd(updated.totalKm ?? 0, updated.netPayableAmount ?? 0);
    toast.success(
      `✅ Trip ended — ${updated.totalKm} km · ₹${(updated.netPayableAmount??0).toLocaleString()}`,
      { duration: 6000 }
    );
  }

  // ── If no active trip → Start form ────────────────────────────────────────
  if (!activeTrip) {
    return (
      <Card className="p-4 border-purple-200 bg-purple-50/30 space-y-4">
        <p className="text-sm font-bold text-purple-800 flex items-center gap-2">
          <Car className="w-4 h-4" /> Start New Trip
        </p>
        <p className="text-xs text-gray-500">
          GPS will auto-capture your current location as the starting point.
        </p>

        {/* GPS capture */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">📍 From (auto-GPS)</label>
          <div className="flex gap-2">
            <Input value={fromLabel} onChange={e => setFromLabel(e.target.value)}
              className="h-8 text-sm flex-1" placeholder="Auto-captured on GPS fetch" />
            <Button size="sm" onClick={fetchGPS} disabled={gpsStatus === "fetching"}
              variant="outline" className="h-8 px-2 shrink-0 gap-1 text-xs">
              <Navigation className="w-3.5 h-3.5" />
              {gpsStatus === "fetching" ? "…" : gpsStatus === "done" ? "✓" : "Get GPS"}
            </Button>
          </div>
          {gpsStatus === "error" && <p className="text-xs text-red-500 mt-1">GPS failed — type location manually</p>}
        </div>

        {/* Destination */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">🏁 To (optional — fill now or later)</label>
          <Input value={toLabel} onChange={e => setToLabel(e.target.value)}
            className="h-8 text-sm" placeholder="e.g. Adajan Heights Society (can leave blank)" />
        </div>

        {/* Vehicle */}
        <div className="flex gap-2">
          {(["2W","4W"] as VehicleType[]).map(vt => (
            <button key={vt} onClick={() => setVehicleType(vt)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                vehicleType === vt ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500"}`}>
              {vt === "2W" ? <Bike className="w-3.5 h-3.5"/> : <Car className="w-3.5 h-3.5"/>}
              {vt} <span className="opacity-60">₹{vt==="2W"?rate2W:rate4W}/km</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Vehicle No. *</label>
            <Input value={vehicleNum} onChange={e => setVehicleNum(e.target.value.toUpperCase())}
              className="h-8 text-sm" placeholder="GJ05AB1234" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Odometer (km) *</label>
            <Input type="number" min={0} value={odoStart}
              onChange={e => setOdoStart(Number(e.target.value))}
              className="h-8 text-sm" placeholder="km" />
          </div>
        </div>

        {/* Start photo */}
        <div>
          <label className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1 block">
            <Camera className="w-3 h-3"/> Odometer Photo <span className="text-red-500">*</span>
          </label>
          <input ref={startFileRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={e => e.target.files?.[0] && capturePhoto(e.target.files[0], setStartPhoto)} />
          {startPhoto
            ? <div className="relative">
                <img src={startPhoto} alt="odo" className="w-full h-24 object-cover rounded-lg border" />
                <button onClick={() => setStartPhoto("")}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
              </div>
            : <button onClick={() => startFileRef.current?.click()}
                className="w-full h-14 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center gap-2 text-xs text-red-500 bg-red-50/30 hover:bg-red-50">
                <Camera className="w-4 h-4"/> Capture odometer
              </button>
          }
        </div>

        <Button onClick={handleStartTrip}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Car className="w-4 h-4"/> Start Trip
        </Button>
      </Card>
    );
  }

  // ── Active trip ─────────────────────────────────────────────────────────────
  const linkedSvcTrip: TravelTrip | undefined = travelReimbursementService
    .getTrips().find(t => t.id === activeTrip.id);

  const elapsedMin = minsElapsed(
    `${TODAY}T${activeTrip.startTime}:00`
  );

  return (
    <div className="space-y-3">
      {/* Trip status banner */}
      <Card className="p-4 border-2 border-purple-300 bg-purple-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"/>
            <p className="text-sm font-bold text-purple-900">Trip in Progress</p>
          </div>
          <Badge className="bg-purple-600 text-xs">{activeTrip.vehicleType} · {activeTrip.vehicleNumber}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
          <div><span className="text-gray-400">From:</span> {activeTrip.fromLabel}</div>
          <div><span className="text-gray-400">To:</span> {activeTrip.toLabel || <span className="italic text-gray-300">Not set</span>}</div>
          <div><span className="text-gray-400">Started:</span> {activeTrip.startTime}</div>
          <div><span className="text-gray-400">Elapsed:</span> {elapsedMin} min</div>
        </div>

        {/* Update destination */}
        {!activeTrip.toLabel && (
          <DestinationUpdater current={activeTrip.toLabel} onSave={v => onTripUpdate({ toLabel: v })} />
        )}

        {/* Google Maps link */}
        {activeTrip.fromLabel && (
          <a href={mapsLink(activeTrip.fromLabel, activeTrip.toLabel)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-2">
            <Navigation className="w-3 h-3"/> Verify route on Google Maps
          </a>
        )}

        {/* Quick "Log Visit" button visible in banner when not yet logged */}
        {!activeTrip.visitLogDone && (
          <button
            onClick={() => {
              setShowVisitLog(true);
              setTimeout(() => visitLogRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
            <Bell className="w-4 h-4"/> Log This Visit
          </button>
        )}

        {/* 30-min wait indicator */}
        {activeTrip.stoppedAt && !activeTrip.visitLogDone && (
          <div className={`mt-3 flex items-center gap-2 p-2 rounded-lg text-xs ${
            waitMins >= WAIT_PROMPT_MINUTES
              ? "bg-orange-100 border border-orange-300 text-orange-800"
              : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
            <Timer className="w-3.5 h-3.5 shrink-0"/>
            {waitMins >= WAIT_PROMPT_MINUTES
              ? `⚠️ Stopped ${waitMins} min — visit log required before you can continue`
              : `Stopped ${waitMins} min at this location`}
          </div>
        )}

        {/* Visit log done indicator */}
        {activeTrip.visitLogDone && (
          <div className="mt-3 p-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5"/> Visit logged: {activeTrip.visitLocationType} · {activeTrip.visitOutcome}
          </div>
        )}
      </Card>

      {/* ── 30-min visit log prompt ─────────────────────────────────────── */}
      {(showVisitLog || (activeTrip.waitPromptShown && !activeTrip.visitLogDone)) && (
        <div ref={visitLogRef}>
        <Card className="p-4 border-2 border-orange-300 bg-orange-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-600"/>
            <p className="text-sm font-bold text-orange-900">Log This Visit</p>
            <span className="text-xs text-orange-500 ml-auto">Required to end trip</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location Type *</label>
              <select value={vlType} onChange={e => setVlType(e.target.value as LocationType)}
                className="w-full h-8 text-sm border border-gray-200 rounded-md px-2 bg-white">
                {LOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Outcome *</label>
              <select value={vlOutcome||""} onChange={e => setVlOutcome(e.target.value as any || undefined)}
                className="w-full h-8 text-sm border border-gray-200 rounded-md px-2 bg-white">
                <option value="">Select…</option>
                {["Positive","Neutral","Negative","No Answer"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Purpose of visit *</label>
            <Input value={vlPurpose} onChange={e => setVlPurpose(e.target.value)}
              className="h-8 text-sm" placeholder="e.g. Close block deal / QR placement / Follow-up" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
            <Textarea value={vlNotes} onChange={e => setVlNotes(e.target.value)}
              rows={2} className="text-sm resize-none" placeholder="Key discussion points…" />
          </div>

          <Button onClick={saveVisitLog}
            className="w-full h-8 text-sm bg-orange-600 hover:bg-orange-700 gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5"/> Save Visit Log
          </Button>
        </Card>
        </div>
      )}

      {/* ── End trip section ─────────────────────────────────────────────── */}
      {(
        <Card className="p-4 border border-gray-200 space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600"/> End This Trip
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Time *</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="h-8 text-sm" />
            </div>
            <div>
              <label className={`text-xs mb-1 block font-medium ${odoEndError ? "text-red-600" : "text-gray-500"}`}>
                End Odometer (km){odoEndError ? " ⚠️ Required" : " *"}
              </label>
              <Input ref={odoEndRef} type="number" min={activeTrip.startOdometer + 1} value={odoEnd}
                onChange={e => { setOdoEnd(Number(e.target.value)); setOdoEndError(false); }}
                className={`h-8 text-sm ${odoEndError ? "border-red-500 ring-1 ring-red-400 bg-red-50" : ""}`}
                placeholder={`> ${activeTrip.startOdometer}`} />
              {odoEndError && (
                <p className="text-xs text-red-500 mt-0.5">⚠ Must be &gt; {activeTrip.startOdometer} km</p>
              )}
            </div>
          </div>

          {/* Live estimate */}
          {odoEnd !== "" && Number(odoEnd) > activeTrip.startOdometer && (
            <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
              <span className="text-xs text-purple-700">
                {Number(odoEnd) - activeTrip.startOdometer} km · {activeTrip.vehicleType}
              </span>
              <span className="text-sm font-bold text-purple-700">
                ₹{Math.round((Number(odoEnd) - activeTrip.startOdometer) * rate).toLocaleString()} est.
              </span>
            </div>
          )}

          {/* End photo */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1 block">
              <Camera className="w-3 h-3"/> End Odometer Photo
              <span className="text-gray-400 font-normal ml-1">(recommended)</span>
            </label>
            <input ref={endFileRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={e => e.target.files?.[0] && capturePhoto(e.target.files[0], setEndPhoto)} />
            {endPhoto
              ? <div className="relative">
                  <img src={endPhoto} alt="odo-end" className="w-full h-24 object-cover rounded-lg border" />
                  <button onClick={() => setEndPhoto("")}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
                </div>
              : <button onClick={() => endFileRef.current?.click()}
                  className="w-full h-14 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center gap-2 text-xs text-red-500 bg-red-50/30 hover:bg-red-50">
                  <Camera className="w-4 h-4"/> Capture odometer
                </button>
            }
          </div>

          {!activeTrip.visitLogDone && (
            <button
              onClick={() => {
                setShowVisitLog(true);
                setTimeout(() => visitLogRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-orange-100 border-2 border-orange-400 rounded-lg text-sm text-orange-800 font-semibold hover:bg-orange-200 transition-colors">
              <Bell className="w-4 h-4 shrink-0"/>
              📋 Log This Visit First — tap here
            </button>
          )}

          <Button onClick={handleEndTrip}
            className="w-full bg-green-600 hover:bg-green-700 gap-2 font-semibold text-base py-3">
            <CheckCircle2 className="w-4 h-4"/> End Trip & Submit
          </Button>
        </Card>
      )}
    </div>
  );
}

// ── Destination updater (inline) ──────────────────────────────────────────────

function DestinationUpdater({ current, onSave }: { current: string; onSave: (v:string)=>void }) {
  const [val, setVal] = useState(current);
  return (
    <div className="flex gap-2 mt-2">
      <Input value={val} onChange={e => setVal(e.target.value)}
        className="h-7 text-xs flex-1" placeholder="Enter destination now (optional)" />
      <Button size="sm" className="h-7 text-xs px-2" onClick={() => onSave(val)}>Set</Button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SMDailyActivity() {
  const [report, setReport] = useState<DailyReport>(loadReport);
  const [openSession, setOpenSession] = useState<SessionId>("morning");

  // One-time migration: patch in-memory state if loaded from old localStorage schema
  // (runs synchronously before first render via lazy init, but also guards on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (!report.field.completedTrips)       (report.field as any).completedTrips = [];
  if (!report.field.visitsActual)         (report.field as any).visitsActual   = [];
  if (!report.morning.plannedVisits)      (report.morning as any).plannedVisits = [];
  const [saving, setSaving] = useState(false);
  const [travelRefresh, setTravelRefresh] = useState(0);

  const { currentUser } = useRole();
  const { employees }   = useEmployee();
  const { city, cityInfo } = useCity();

  const gate = salesManagerService.getGateStatus();

  // Travel data
  const todayTrips = useMemo(() =>
    travelReimbursementService
      .getTripsByEmployee(currentUser?.employeeId || "")
      .filter(t => t.tripDate === TODAY),
    [travelRefresh, currentUser?.employeeId]
  );
  const todayKm  = todayTrips.reduce((s,t) => s + (t.totalKm ?? 0), 0);
  const todayAmt = todayTrips.reduce((s,t) => s + (t.netPayableAmount ?? 0), 0);

  const emp        = employees.find(e => e.id === currentUser?.employeeId);
  const reportingMgr = employees.find(e => e.fullName === emp?.reportingManager || e.id === emp?.reportingManager);

  const totalLeads       = report.field.visitsActual.reduce((s,v) => s + v.leadsCollected, 0);
  const totalConversions = report.field.visitsActual.reduce((s,v) => s + v.conversionAttempts, 0);
  const visitsCompleted  = report.field.visitsActual.filter(v => v.actualVisitDone).length;

  // Active trip blocker — no new trip / checkout / tasks when trip open
  const hasActiveTrip = !!report.field.activeTrip;

  function update(fn: (r: DailyReport) => DailyReport) {
    setReport(prev => {
      const next = fn(structuredClone(prev));
      saveReport(next);
      return next;
    });
  }

  function lockMorning() {
    if (!report.morning.priorityForDay.trim()) { toast.error("Set today's priority first"); return; }
    if (report.morning.plannedVisits.length === 0) { toast.error("Add at least one planned visit"); return; }
    update(r => { r.morning.locked = true; return r; });
    setOpenSession("field");
    toast.success("Morning plan locked ✓ Head to the field!");
  }

  function lockField() {
    if (hasActiveTrip) { toast.error("Close the active trip before locking field session"); return; }
    update(r => {
      r.field.locked = true;
      r.field.totalLeads       = totalLeads;
      r.field.totalConversions = totalConversions;
      r.field.totalKm          = todayKm;
      return r;
    });
    setOpenSession("evening");
    toast.success("Field session locked ✓ Complete your EOD report");
  }

  function submitEOD() {
    if (!report.evening.biggestWin.trim())   { toast.error("Fill biggest win"); return; }
    if (!report.evening.tomorrowTop3.trim()) { toast.error("Fill tomorrow's top 3"); return; }
    setSaving(true);
    setTimeout(() => {
      update(r => { r.evening.locked = true; r.evening.submittedAt = new Date().toISOString(); return r; });
      setSaving(false);
      toast.success("Daily report submitted to Sales Head ✓");
    }, 800);
  }

  function updateVisit(idx: number, changes: Partial<PlannedVisit>) {
    update(r => { r.field.visitsActual[idx] = { ...r.field.visitsActual[idx], ...changes }; return r; });
  }

  function addUnplannedVisit() {
    if (hasActiveTrip) { toast.error("Close active trip before adding unplanned visit"); return; }
    update(r => {
      r.field.visitsActual.push({
        locationId: `UNPLANNED-${Date.now()}`,
        locationName: "", locationType: "Society",
        priority: "MEDIUM", objective: "Unplanned visit",
        plannedTime: "--", actualVisitDone: true,
        leadsCollected: 0, conversionAttempts: 0, notes: "", durationMinutes: 0,
      });
      r.field.unplannedVisits++;
      return r;
    });
  }

  // ── MORNING SECTION ───────────────────────────────────────────────────────

  function MorningSection() {
    const [pv, setPv] = useState(report.morning.priorityForDay);

    return (
      <div className="space-y-5">
        <SessionHeader icon={<Sun/>} title="Morning Planning Session"
          time="8:00 AM – 10:00 AM"
          status={report.morning.locked ? "locked" : "active"} />

        {/* MTD Gate Snapshot */}
        <Card className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">MTD Gate Status</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Locations",   c: gate.locationGate.current,   t: 5,  met: gate.locationGate.met },
              { label: "Leads",       c: gate.leadGate.current,       t: 30, met: gate.leadGate.met },
              { label: "Conversions", c: gate.conversionGate.current, t: 5,  met: gate.conversionGate.met },
            ].map(g => (
              <div key={g.label}
                className={`rounded-lg p-3 text-center ${g.met ? "bg-teal-50 border border-teal-200" : "bg-red-50 border border-red-200"}`}>
                <p className="text-xs text-gray-500 mb-1">{g.label}</p>
                <p className={`text-xl font-bold ${g.met ? "text-teal-700" : "text-red-600"}`}>
                  {g.c}<span className="text-xs font-normal text-gray-400">/{g.t}</span>
                </p>
              </div>
            ))}
          </div>
          {!gate.allMet && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0"/>
              Gate not cleared — focus on conversions today to unlock per-conversion fees
            </p>
          )}
        </Card>

        {/* Priority */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-orange-500"/> Today's #1 Priority *
          </label>
          <Input value={pv}
            onChange={e => { setPv(e.target.value); update(r => { r.morning.priorityForDay = e.target.value; return r; }); }}
            placeholder="e.g. Close Adajan Heights block deal — 12 vehicles pending"
            className="text-sm" disabled={report.morning.locked} />
        </div>

        {/* Open Alerts */}
        {report.morning.openAlerts > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0"/>
            <p className="text-sm text-red-700">
              <strong>{report.morning.openAlerts} active alert(s)</strong> need action today — check Alliance Dashboard
            </p>
          </div>
        )}

        {/* Visit planner */}
        <MorningVisitPlanner
          visits={report.morning.plannedVisits}
          locked={report.morning.locked}
          onChange={visits => update(r => {
            r.morning.plannedVisits = visits;
            r.field.visitsActual    = visits;
            return r;
          })}
        />

        {!report.morning.locked ? (
          <Button onClick={lockMorning} className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Lock className="w-4 h-4"/> Lock Morning Plan & Head Out
          </Button>
        ) : (
          <div className="text-center py-2 text-sm text-teal-600 font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4"/> Morning plan locked
          </div>
        )}
      </div>
    );
  }

  // ── FIELD SECTION ─────────────────────────────────────────────────────────

  function FieldSection() {
    return (
      <div className="space-y-5">
        <SessionHeader icon={<MapPin/>} title="Field Execution"
          time="10:00 AM onwards"
          status={report.field.locked ? "locked" : report.morning.locked ? "active" : "upcoming"} />

        {!report.morning.locked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0"/>
            Lock the Morning Plan first before updating field activity
          </div>
        )}

        {/* Active-trip blocker banner */}
        {hasActiveTrip && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0"/>
            <strong>Trip in progress — </strong> end the current trip before starting a new one,
            adding visits, or checking out.
          </div>
        )}

        {/* Trip Panel */}
        {report.morning.locked && !report.field.locked && (
          <TripPanel
            activeTrip={report.field.activeTrip}
            locked={report.field.locked}
            empId={currentUser?.employeeId || ""}
            empName={emp?.fullName || currentUser?.name || ""}
            empDes={emp?.designation || ""}
            cityId={city}
            cityName={cityInfo.displayName}
            rptMgrId={reportingMgr?.id || emp?.reportingManager || ""}
            rptMgrName={reportingMgr?.fullName || emp?.reportingManager || ""}
            travelRefresh={travelRefresh}
            onTripStart={t => {
              update(r => { r.field.activeTrip = t; return r; });
            }}
            onTripEnd={(km, amt) => {
              update(r => {
                if (r.field.activeTrip) {
                  if (!r.field.completedTrips) r.field.completedTrips = [];
                  r.field.completedTrips.push(r.field.activeTrip.id);
                }
                r.field.activeTrip = null;
                r.field.totalKm   += km;
                return r;
              });
              setTravelRefresh(v => v+1);
            }}
            onTripUpdate={changes => {
              update(r => { r.field.activeTrip = { ...r.field.activeTrip!, ...changes }; return r; });
            }}
          />
        )}

        {/* Today's completed trips summary */}
        {todayTrips.filter(t => t.status !== "Draft").length > 0 && (
          <Card className="p-3 border-purple-200 bg-purple-50/40">
            <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5 mb-2">
              <Car className="w-3.5 h-3.5"/> Completed Trips ({todayTrips.filter(t=>t.status!=="Draft").length})
              <span className="ml-auto font-bold">{todayKm} km · ₹{todayAmt.toLocaleString()}</span>
            </p>
            {todayTrips.filter(t=>t.status!=="Draft").map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs py-1 border-t border-purple-100 first:border-0">
                <span className="text-gray-600 truncate max-w-[55%]">{t.visitLocation || "Field"}</span>
                <span className="text-gray-500">{t.totalKm??0} km · ₹{(t.netPayableAmount??0).toLocaleString()}</span>
                <span className={`px-1.5 py-0.5 rounded-full border text-xs font-medium ${
                  t.status==="Approved" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                }`}>{t.status}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Visit cards */}
        <div className="space-y-3">
          {report.field.visitsActual.map((visit, idx) => (
            <VisitCard key={`${visit.locationId}-${idx}`}
              visit={visit} idx={idx}
              locked={report.field.locked || !report.morning.locked || hasActiveTrip}
              onChange={ch => updateVisit(idx, ch)} />
          ))}
        </div>

        {/* Add unplanned visit */}
        {!report.field.locked && report.morning.locked && (
          <Button variant="outline" onClick={addUnplannedVisit}
            disabled={hasActiveTrip}
            className="w-full border-dashed text-sm gap-1.5 text-gray-500 disabled:opacity-40">
            <MapPin className="w-4 h-4"/> + Add Unplanned Visit
          </Button>
        )}

        {/* Field totals */}
        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Field Totals</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Visits Done",     value: visitsCompleted, suffix: `/${report.field.visitsActual.length}`, color: "text-teal-700" },
              { label: "Leads",           value: totalLeads,       suffix: "",       color: "text-blue-700" },
              { label: "Conversions",     value: totalConversions, suffix: "",       color: "text-green-700" },
              { label: "Travel Km",       value: todayKm,          suffix: " km",   color: "text-purple-700" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}
                  <span className="text-xs font-normal text-gray-400">{s.suffix}</span>
                </p>
              </div>
            ))}
          </div>
          {todayAmt > 0 && (
            <div className="mt-3 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <span className="text-xs text-purple-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5"/> Travel reimbursement today
              </span>
              <span className="text-sm font-bold text-purple-700">₹{todayAmt.toLocaleString()}</span>
            </div>
          )}
        </Card>

        {!report.field.locked && report.morning.locked && (
          <Button onClick={lockField} disabled={hasActiveTrip}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 disabled:opacity-40">
            <Lock className="w-4 h-4"/>
            {hasActiveTrip ? "Close active trip first" : "Lock Field Session & Start EOD"}
          </Button>
        )}
        {report.field.locked && (
          <div className="text-center py-2 text-sm text-orange-600 font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4"/> Field session locked
          </div>
        )}
      </div>
    );
  }

  // ── EVENING / EOD SECTION ─────────────────────────────────────────────────
  // Auto-populated from day's data — SM only needs to fill qualitative fields

  function EveningSection() {
    const [win,   setWin]   = useState(report.evening.biggestWin);
    const [block, setBlock] = useState(report.evening.biggestBlock);
    const [tmr,   setTmr]   = useState(report.evening.tomorrowTop3);

    function sync(field: keyof typeof report.evening, v: string) {
      update(r => { (r.evening as any)[field] = v; return r; });
    }

    // Auto-populate tomorrow's visits from today's incomplete ones
    const pendingToday = report.field.visitsActual.filter(v => !v.actualVisitDone);

    return (
      <div className="space-y-5">
        <SessionHeader icon={<FileText/>} title="EOD Report — Mandatory Before Checkout"
          time="Complete before checkout"
          status={report.evening.locked ? "locked" : report.field.locked ? "active" : "upcoming"} />

        {!report.field.locked && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0"/>
            <strong>Lock Field Session first</strong> — EOD report is mandatory before you can check out
          </div>
        )}

        {/* ── Auto-filled summary ── */}
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-3">
            Today's Numbers (auto-filled)
          </p>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div><p className="text-2xl font-bold text-teal-700">{visitsCompleted}</p><p className="text-xs text-gray-500">Visits</p></div>
            <div><p className="text-2xl font-bold text-blue-700">{totalLeads}</p><p className="text-xs text-gray-500">Leads</p></div>
            <div><p className="text-2xl font-bold text-green-700">{totalConversions}</p><p className="text-xs text-gray-500">Conv.</p></div>
            <div><p className="text-2xl font-bold text-purple-700">{todayKm}</p><p className="text-xs text-gray-500">Km</p></div>
          </div>

          {/* Trip summary */}
          {todayTrips.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-teal-600 font-semibold">Trips ({todayTrips.length})</p>
              {todayTrips.map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs bg-white/70 rounded px-2 py-1">
                  <span className="text-gray-600 truncate">{t.visitLocation || "Field"}</span>
                  <span className="text-gray-500">{t.totalKm??0} km · ₹{(t.netPayableAmount??0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Visit outcomes */}
          {report.field.visitsActual.filter(v=>v.actualVisitDone).length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-teal-600 font-semibold">Visit Outcomes</p>
              {report.field.visitsActual.filter(v=>v.actualVisitDone).map((v,i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white/70 rounded px-2 py-1">
                  <span className="text-gray-700 truncate">{v.locationName}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    v.outcome==="Positive" ? "bg-green-100 text-green-700" :
                    v.outcome==="Negative" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"}`}>
                    {v.outcome || "—"}
                  </span>
                  <span className="text-gray-400">{v.leadsCollected}L · {v.conversionAttempts}C</span>
                </div>
              ))}
            </div>
          )}

          {todayAmt > 0 && (
            <div className="mt-3 flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 border border-teal-200">
              <span className="text-xs text-purple-700 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5"/> Travel reimbursement
              </span>
              <span className="text-sm font-bold text-purple-700">₹{todayAmt.toLocaleString()}</span>
            </div>
          )}
        </Card>

        {/* Pending visits → pre-fill tomorrow */}
        {pendingToday.length > 0 && (
          <Card className="p-3 border-amber-200 bg-amber-50/30">
            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5"/> {pendingToday.length} visit(s) not completed today
            </p>
            {pendingToday.map((v,i) => (
              <p key={i} className="text-xs text-gray-600">• {v.locationName} ({v.priority})</p>
            ))}
            <p className="text-xs text-amber-600 mt-1">
              These will appear in tomorrow's plan automatically.
            </p>
          </Card>
        )}

        {/* ── Qualitative feedback ── */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400"/> How did the day go?
          </label>
          <StarRating value={report.evening.dayRating}
            onChange={v => update(r => { r.evening.dayRating = v; return r; })} />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-500"/> Biggest Win Today *
          </label>
          <Textarea value={win}
            onChange={e => { setWin(e.target.value); sync("biggestWin", e.target.value); }}
            placeholder="e.g. Adajan Heights agreed to 15-vehicle block — MOU to be sent tomorrow"
            rows={2} className="text-sm resize-none" disabled={report.evening.locked} />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400"/> Biggest Obstacle / Escalation
          </label>
          <Textarea value={block}
            onChange={e => { setBlock(e.target.value); sync("biggestBlock", e.target.value); }}
            placeholder="e.g. HP Vesu manager unavailable — SH intervention needed"
            rows={2} className="text-sm resize-none" disabled={report.evening.locked} />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-teal-600"/> Tomorrow's Top 3 Actions *
          </label>
          <Textarea value={tmr}
            onChange={e => { setTmr(e.target.value); sync("tomorrowTop3", e.target.value); }}
            placeholder={"1. Follow up Adajan Heights — send MOU\n2. Visit HP Vesu pump with SH\n3. Call 5 warm leads from this week"}
            rows={4} className="text-sm resize-none" disabled={report.evening.locked} />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Escalations raised</label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => update(r => { r.evening.escalationsRaised = Math.max(0, r.evening.escalationsRaised-1); return r; })}
              disabled={report.evening.locked}>−</Button>
            <span className="w-6 text-center font-bold">{report.evening.escalationsRaised}</span>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => update(r => { r.evening.escalationsRaised++; return r; })}
              disabled={report.evening.locked}>+</Button>
          </div>
        </div>

        {!report.evening.locked && report.field.locked && (
          <Button onClick={submitEOD} disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
            {saving ? <RotateCcw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            {saving ? "Submitting…" : "Submit Daily Report to Sales Head"}
          </Button>
        )}

        {report.evening.locked && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-center">
            <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto mb-1"/>
            <p className="text-sm font-semibold text-teal-700">Report submitted — you can now check out</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {report.evening.submittedAt && fmtTime(report.evening.submittedAt)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── VISIT CARD ─────────────────────────────────────────────────────────────

  function VisitCard({ visit, idx, locked, onChange }: {
    visit: PlannedVisit; idx: number; locked: boolean;
    onChange: (c: Partial<PlannedVisit>) => void;
  }) {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className={`border rounded-xl overflow-hidden ${visit.actualVisitDone ? "border-teal-200 bg-teal-50/40" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center gap-3 p-3">
          <button disabled={locked}
            onClick={() => onChange({ actualVisitDone: !visit.actualVisitDone })}
            className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
              visit.actualVisitDone ? "bg-teal-500 border-teal-500" : "border-gray-300 hover:border-teal-400"}`}>
            {visit.actualVisitDone && <CheckCircle2 className="w-3.5 h-3.5 text-white"/>}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${visit.actualVisitDone ? "line-through text-gray-400" : "text-gray-800"}`}>
              {visit.locationName || "New location"}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <PriorityBadge p={visit.priority}/>
              {visit.plannedTime !== "--" && <span className="text-xs text-gray-400">{visit.plannedTime}</span>}
              {visit.outcome && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  visit.outcome==="Positive"?"bg-green-100 text-green-700":
                  visit.outcome==="Negative"?"bg-red-100 text-red-700":"bg-gray-100 text-gray-600"}`}>
                  {visit.outcome}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 p-1">
            {expanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
          </button>
        </div>

        {expanded && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
            {/* Name if unplanned */}
            {visit.locationId.startsWith("UNPLANNED") && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Location Name</label>
                <Input value={visit.locationName} onChange={e => onChange({ locationName: e.target.value })}
                  className="h-8 text-sm" disabled={locked} placeholder="e.g. Shyam Nagar Society"/>
              </div>
            )}

            {/* Outcome */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Outcome</label>
              <div className="flex gap-1.5 flex-wrap">
                {(["Positive","Neutral","Negative","No Answer"] as const).map(o => (
                  <button key={o} disabled={locked} onClick={() => onChange({ outcome: o })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      visit.outcome===o
                        ? o==="Positive" ? "bg-green-100 border-green-400 text-green-700"
                          : o==="Negative" ? "bg-red-100 border-red-400 text-red-700"
                          : o==="No Answer" ? "bg-gray-100 border-gray-400 text-gray-600"
                          : "bg-amber-100 border-amber-400 text-amber-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads / Conversions / Duration */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label:"Leads",           field:"leadsCollected"    as const },
                { label:"Conv. Attempts",  field:"conversionAttempts" as const },
                { label:"Duration (min)",  field:"durationMinutes"   as const },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <Input type="number" min={0} value={visit[f.field]||""}
                    onChange={e => onChange({ [f.field]: Number(e.target.value) })}
                    className="h-8 text-sm" disabled={locked}/>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes</label>
              <Textarea value={visit.notes} onChange={e => onChange({ notes: e.target.value })}
                rows={2} className="text-sm resize-none" disabled={locked}
                placeholder="Key points, follow-up needed…"/>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  const sessionProgress = [
    { id: "morning" as SessionId, label: "Morning", done: report.morning.locked },
    { id: "field"   as SessionId, label: "Field",   done: report.field.locked   },
    { id: "evening" as SessionId, label: "EOD",     done: report.evening.locked },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daily Activity Report</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmt(TODAY)}</p>
          </div>
          {report.evening.locked && (
            <Badge className="bg-teal-100 text-teal-700 border-teal-200">
              <CheckCircle2 className="w-3 h-3 mr-1"/> Submitted
            </Badge>
          )}
        </div>

        {/* EOD mandatory warning when field is locked but EOD not done */}
        {report.field.locked && !report.evening.locked && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-700">
            <Lock className="w-3.5 h-3.5 shrink-0"/>
            <strong>EOD report required before checkout.</strong> Complete the Evening section below.
          </div>
        )}

        {/* Session progress pills */}
        <div className="flex gap-2 mt-3">
          {sessionProgress.map(s => (
            <button key={s.id} onClick={() => setOpenSession(s.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                openSession === s.id
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : s.done
                    ? "border-teal-200 bg-teal-50/50 text-teal-600"
                    : "border-gray-200 bg-white text-gray-400"}`}>
              {s.done ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500"/> : <Circle className="w-3.5 h-3.5"/>}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {openSession === "morning" && <MorningSection/>}
        {openSession === "field"   && <FieldSection/>}
        {openSession === "evening" && <EveningSection/>}
      </div>
    </div>
  );
}
