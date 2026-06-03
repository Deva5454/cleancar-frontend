import { useState, useRef, useMemo, useEffect } from "react";
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
  const [refresh, setRefresh] = useState(0);

  // Re-read draft on every refresh tick — never stale
  const existingDraft = useMemo(() =>
    travelReimbursementService
      .getTripsByEmployee(currentUser?.employeeId || "")
      .find(t => t.status === "Draft"),
    [refresh, currentUser?.employeeId]
  );

  const [stage, setStage] = useState<Stage>(() => existingDraft ? "end" : "start");
  const [activeTrip, setActiveTrip] = useState<TravelTrip | undefined>(() => existingDraft);

  // Sync stage and activeTrip whenever existingDraft changes
  useEffect(() => {
    if (existingDraft && !activeTrip) {
      setActiveTrip(existingDraft);
      setStage("end");
    }
  }, [existingDraft, activeTrip]);

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

  // Validation: max 150km/day, no duplicate dates
  const validateTrip = (tripDate: string, startKm: number, endKm: number): string | null => {
    const totalKm = endKm - startKm;
    if (totalKm <= 0) return "End reading must be greater than start reading";
    if (totalKm > 150) return "Maximum 150 km allowed per trip (fraud detection)";
    if (startKm < 0 || endKm < 0) return "Odometer readings cannot be negative";
    // Check for same-day duplicate
    const existingTrips = travelReimbursementService.getTrips();
    const hasDuplicate = existingTrips.some(t =>
      t.tripDate === tripDate && t.status !== "Rejected"
    );
    if (hasDuplicate) return "A trip already exists for this date";
    return null;
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

  const myTrips = useMemo(() =>
    travelReimbursementService.getTripsByEmployee(currentUser?.employeeId || ""),
    [refresh, currentUser?.employeeId]
  );

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
