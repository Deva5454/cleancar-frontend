import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { isFieldTrackingRole, FIELD_TRACKING_ROLES } from "../../services/fieldTrackingService";
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
    // Field tracking is auto-activated for Sales Head, Sales Manager, Supervisor
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
