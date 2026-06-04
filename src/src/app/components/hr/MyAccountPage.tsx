/**
 * MyAccountPage — Universal account page for ALL roles
 * Tabs: Profile · Leave · Payslip · Travel · Mobile Change
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  User, FileText, Calendar, Clock, Phone,
  CheckCircle, AlertTriangle, Building2, Mail,
  Briefcase, MapPin, Shield, Download, Bell, Car,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useApprovals } from "../../contexts/AppProvider";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { TravelEmployeeView } from "../travel/TravelEmployeeView";
import { toast } from "sonner";

const roleBadgeColor: Record<string, string> = {
  "Super Admin":            "bg-purple-100 text-purple-800",
  "Admin":                  "bg-blue-100 text-blue-800",
  "City Manager":           "bg-indigo-100 text-indigo-800",
  "Cluster Manager":        "bg-cyan-100 text-cyan-800",
  "Sr Operations Manager":  "bg-teal-100 text-teal-800",
  "Operations Manager":     "bg-green-100 text-green-800",
  "Manager":                "bg-emerald-100 text-emerald-800",
  "Supervisor":             "bg-yellow-100 text-yellow-800",
  "Car Washer":             "bg-orange-100 text-orange-800",
  "TSM":                    "bg-pink-100 text-pink-800",
  "TSE":                    "bg-rose-100 text-rose-800",
  "CCE":                    "bg-red-100 text-red-800",
  "Store Manager":          "bg-amber-100 text-amber-800",
  "Procurement Manager":    "bg-lime-100 text-lime-800",
  "Accounts":               "bg-sky-100 text-sky-800",
  "HR":                     "bg-violet-100 text-violet-800",
  "Sales Head":             "bg-fuchsia-100 text-fuchsia-800",
  "Sales Manager":          "bg-cyan-100 text-cyan-800",
  "Marketing Agency":       "bg-slate-100 text-slate-800",
};

export function MyAccountPage() {
  const { currentUser, currentRole } = useRole();
  const { addApproval, approvals } = useApprovals();
  const [activeTab, setActiveTab] = useState("profile");

  const employees = employeeDatabaseService.getAll();
  const emp = employees.find(
    e =>
      e.id === currentUser.employeeId ||
      (e as any).employeeId === currentUser.employeeId ||
      e.designation === currentRole
  );

  // Mobile change state
  const [newMobile, setNewMobile]             = useState("");
  const [mobileReason, setMobileReason]       = useState("");
  const [mobileError, setMobileError]         = useState("");
  const [mobileSubmitted, setMobileSubmitted] = useState(false);

  const existingMobileRequest = approvals.find(
    a => a.type === "Mobile Number Change" &&
         a.relatedId === currentUser.employeeId &&
         a.status === "Pending"
  );

  const validateMobile = (m: string) => {
    if (m.length !== 10)    return "Must be exactly 10 digits";
    if (!/^[6-9]/.test(m)) return "Must start with 6, 7, 8 or 9";
    if (m === emp?.mobile)  return "New number is same as current number";
    return "";
  };

  const handleMobileSubmit = () => {
    const err = validateMobile(newMobile);
    if (err) { setMobileError(err); return; }
    if (!mobileReason.trim()) { toast.error("Please provide a reason"); return; }
    addApproval({
      type: "Mobile Number Change",
      requester: emp?.fullName || currentRole,
      description: `Mobile change\nEmployee: ${emp?.fullName || currentRole}\nCurrent: ${emp?.mobile || "—"}\nNew: ${newMobile}\nReason: ${mobileReason}`,
      priority: "Medium",
      relatedId: currentUser.employeeId,
      status: "Pending",
    } as any);
    setMobileSubmitted(true);
    toast.success("Mobile change request submitted for approval");
  };

  const displayName    = emp?.fullName     || currentUser.name || currentRole;
  const displayMobile  = emp?.mobile       || emp?.loginMobile || "—";
  const displayEmail   = emp?.email        || "—";
  const displayCity    = currentUser.city  || "Surat";
  const displayJoining = emp?.joiningDate  || emp?.dateOfJoining || "—";
  const displayEmpCode = emp?.employeeCode || emp?.id || currentUser.employeeId || "—";
  const initials       = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const badgeClass     = roleBadgeColor[currentRole] || "bg-gray-100 text-gray-800";

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{displayName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                  {currentRole}
                </span>
                <span className="text-blue-200 text-sm">· {displayCity}</span>
              </div>
              <p className="text-blue-200 text-xs mt-1">ID: {displayEmpCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — 5 tabs now including Travel */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
            <User className="w-4 h-4" /><span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
            <Calendar className="w-4 h-4" /><span>Leave</span>
          </TabsTrigger>
          <TabsTrigger value="payslip" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4" /><span>Payslip</span>
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
            <Car className="w-4 h-4" /><span>Travel</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
            <Phone className="w-4 h-4" /><span>Mobile</span>
          </TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<User className="w-4 h-4" />}      label="Full Name"     value={displayName} />
                <InfoRow icon={<Shield className="w-4 h-4" />}    label="Role"          value={currentRole} />
                <InfoRow icon={<Phone className="w-4 h-4" />}     label="Mobile"        value={displayMobile} />
                <InfoRow icon={<Mail className="w-4 h-4" />}      label="Email"         value={displayEmail} />
                <InfoRow icon={<MapPin className="w-4 h-4" />}    label="City"          value={displayCity} />
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Joining Date"  value={displayJoining} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Department"    value={emp?.department || "—"} />
                <InfoRow icon={<User className="w-4 h-4" />}      label="Employee Code" value={displayEmpCode} />
              </div>
              <div className="pt-4 border-t flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Account Status</span>
                <Badge className="bg-green-100 text-green-800 border-0 text-xs">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAVE */}
        <TabsContent value="leave" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />Leave Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Casual Leave", total: 12, used: 3,  color: "blue"   },
                  { label: "Sick Leave",   total: 8,  used: 1,  color: "red"    },
                  { label: "Earned Leave", total: 15, used: 5,  color: "green"  },
                  { label: "Comp Off",     total: 2,  used: 0,  color: "purple" },
                ].map(lt => (
                  <div key={lt.label} className={`bg-${lt.color}-50 rounded-xl p-4 text-center`}>
                    <div className={`text-2xl font-bold text-${lt.color}-700`}>{lt.total - lt.used}</div>
                    <div className="text-xs text-gray-600 mt-1">{lt.label}</div>
                    <div className="text-xs text-gray-400">{lt.used} used of {lt.total}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                {[
                  { type: "Casual Leave", from: "2026-04-10", to: "2026-04-11", status: "Approved", days: 2 },
                  { type: "Sick Leave",   from: "2026-03-05", to: "2026-03-05", status: "Approved", days: 1 },
                ].map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <div className="font-medium text-gray-800">{l.type} — {l.days} day{l.days > 1 ? "s" : ""}</div>
                      <div className="text-xs text-gray-500">{l.from} → {l.to}</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-0">{l.status}</Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1">
                  <Calendar className="w-4 h-4 mr-2" />Apply for Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYSLIP */}
        <TabsContent value="payslip" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />Payslips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { month: "April 2026",    gross: 28500, deductions: 3420, net: 25080 },
                { month: "March 2026",    gross: 28500, deductions: 3420, net: 25080 },
                { month: "February 2026", gross: 28500, deductions: 3420, net: 25080 },
                { month: "January 2026",  gross: 28000, deductions: 3360, net: 24640 },
              ].map((ps, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{ps.month}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Gross: ₹{ps.gross.toLocaleString("en-IN")} · Deductions: ₹{ps.deductions.toLocaleString("en-IN")} ·{" "}
                      <span className="text-green-700 font-medium">Net: ₹{ps.net.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-0 text-xs">Processed</Badge>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />This Month Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: "Present", value: 22, color: "text-green-700"  },
                  { label: "Absent",  value: 1,  color: "text-red-600"    },
                  { label: "Late",    value: 2,  color: "text-yellow-600" },
                  { label: "Leave",   value: 2,  color: "text-blue-600"   },
                ].map(a => (
                  <div key={a.label} className="bg-gray-50 rounded-xl p-3">
                    <div className={`text-2xl font-bold ${a.color}`}>{a.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{a.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRAVEL — plugs in the full TravelEmployeeView component */}
        <TabsContent value="travel" className="mt-4">
          <TravelEmployeeView />
        </TabsContent>

        {/* MOBILE CHANGE */}
        <TabsContent value="mobile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />Change Mobile Number
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mobileSubmitted || existingMobileRequest ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Request Submitted</h3>
                  <p className="text-sm text-gray-600 max-w-xs mx-auto">
                    Pending approval from HR. Your current number stays active until approved.
                  </p>
                  <Badge className="mt-4 bg-yellow-100 text-yellow-800 border-0">Pending Approval</Badge>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Current Mobile Number</p>
                    <p className="font-semibold text-gray-900 text-lg tracking-widest">{displayMobile}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-mobile">New Mobile Number</Label>
                    <Input
                      id="new-mobile" type="tel" maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      value={newMobile}
                      onChange={e => { setNewMobile(e.target.value.replace(/\D/g, "")); setMobileError(""); }}
                      className="font-mono"
                    />
                    {mobileError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{mobileError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile-reason">Reason for Change</Label>
                    <Textarea
                      id="mobile-reason"
                      placeholder="e.g. Lost old phone, SIM card changed..."
                      value={mobileReason}
                      onChange={e => setMobileReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex gap-2">
                    <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>This request will be sent to HR for approval. Your current number remains active until approved.</span>
                  </div>
                  <Button
                    onClick={handleMobileSubmit}
                    disabled={newMobile.length !== 10 || !mobileReason.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Change Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
