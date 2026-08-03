import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { useTravelPayableBridge } from "../../hooks/useTravelPayableBridge";
import { travelReimbursementService, type TravelTrip } from "../../services/travelReimbursementService";
import { travelWeeklyPayoutService, getPreviousWeekRange } from "../../services/travelWeeklyPayoutService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { CheckCircle, XCircle, Download, Search, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export function TravelHRView() {
  const { currentUser } = useRole();
  const { city } = useCity();
  const { finalizeTravelApproval } = useTravelPayableBridge();
  const [tab, setTab]         = useState<"pending" | "history" | "weekly">("pending");
  const [selected, setSelected] = useState<TravelTrip | null>(null);
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [searchQ, setSearchQ]  = useState("");
  const [refresh, setRefresh]  = useState(0);
  const [payImmediately, setPayImmediately] = useState(false);

  const pending = useMemo(() =>
    travelReimbursementService.getPendingHRApproval(city),
    [refresh, city]
  );
  const allTrips = travelReimbursementService.getTripsByCity(city);

  const filtered = allTrips.filter(t =>
    !searchQ ||
    t.employeeName.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.purposeOfVisit.toLowerCase().includes(searchQ.toLowerCase())
  );

  const STATUS_COLORS: Record<string, string> = {
    "Draft":                "bg-gray-100 text-gray-700",
    "Pending Manager":      "bg-amber-100 text-amber-700",
    "Manager Rejected":     "bg-red-100 text-red-700",
    "Pending City Manager": "bg-orange-100 text-orange-700",
    "City Manager Rejected":"bg-red-100 text-red-700",
    "Pending HR":           "bg-blue-100 text-blue-700",
    "HR Rejected":          "bg-red-100 text-red-700",
    "HR Applied":           "bg-green-100 text-green-700",
    "Auto-Rejected":        "bg-red-100 text-red-700",
    "Approved":             "bg-green-100 text-green-700",
    "Rejected":             "bg-red-100 text-red-700",
    "Added to Payroll":     "bg-purple-100 text-purple-700",
  };

  const handleApprove = () => {
    if (!selected) return;
    const updatedTrip = travelReimbursementService.hrApply(selected.id, currentUser?.name || "HR", comments);

    if (updatedTrip.payoutTrack === "Weekly") {
      toast.success(`Approved. ₹${updatedTrip.netPayableAmount?.toLocaleString()} will be included in the next weekly reconciliation (Monday) for ${updatedTrip.employeeName}.`);
      setSelected(null); setComments(""); setPayImmediately(false); setRefresh(r => r + 1);
      return;
    }

    // Bridge: create Finance payable so salary processing picks it up
    finalizeTravelApproval(updatedTrip, { isAdhoc: payImmediately });

    toast.success(payImmediately
      ? `Approved for immediate payment. ₹${selected.netPayableAmount?.toLocaleString()} sent to Accounts for urgent processing.`
      : `Approved and added to payroll. ₹${selected.netPayableAmount?.toLocaleString()} will appear in ${selected.employeeName}'s next salary. No TDS/Tax deducted.`);
    setSelected(null); setComments(""); setPayImmediately(false); setRefresh(r => r + 1);
  };

  const handleReject = () => {
    if (!selected) return;
    const result = travelReimbursementService.hrReject(selected.id, currentUser?.name || "HR", rejectReason);
    if (!result.success) { toast.error(result.error || "Rejection reason is required"); return; }
    toast.success("Trip rejected.");
    setSelected(null); setShowReject(false); setRejectReason(""); setRefresh(r => r + 1);
  };

  // ── Weekly reconciliation (Car Washer / Supervisor claims) ──
  const defaultWeek = getPreviousWeekRange();
  const [reconWeekStart, setReconWeekStart] = useState(defaultWeek.weekStartDate);
  const eligibleForRecon = travelWeeklyPayoutService.getEligibleTrips(
    city, reconWeekStart, (() => { const d = new Date(reconWeekStart + "T00:00:00"); d.setDate(d.getDate() + 6); return d.toISOString().split("T")[0]; })()
  );
  const cityBatches = travelWeeklyPayoutService.getBatches(city);

  const runReconciliation = () => {
    const result = travelWeeklyPayoutService.runWeeklyReconciliation(city, reconWeekStart, currentUser?.employeeId || "", currentUser?.name || "HR");
    if (!result.success || !result.batch) { toast.error(result.error || "Could not run reconciliation"); return; }
    toast.success(`Reconciliation batch created: ${result.batch.tripIds.length} claim(s), ₹${result.batch.totalAmount.toLocaleString()}. Sent to Super Admin for approval.`);
    setRefresh(r => r + 1);
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
          { label: "Applied",       value: allTrips.filter(t => t.status === "HR Applied" || t.status === "Approved" || t.status === "Added to Payroll").length, color: "text-green-700" },
          { label: "Total Amount",  value: `₹${allTrips.filter(t => !t.status.includes("Rejected") && t.status !== "Draft").reduce((s,t) => s + (t.netPayableAmount||0), 0).toLocaleString()}`, color: "text-purple-700" },
          { label: "Weekly Track",  value: allTrips.filter(t => t.payoutTrack === "Weekly" && t.status === "HR Applied").length, color: "text-gray-700" },
        ].map(k => (
          <div key={k.label} className="bg-white border rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {(["pending","weekly","history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
            {t === "pending" ? `Pending HR Approval (${pending.length})` : t === "weekly" ? "Weekly Reconciliation" : `All Records (${allTrips.length})`}
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

      {/* Weekly reconciliation tab (Car Washer / Supervisor claims) */}
      {tab === "weekly" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Run Weekly Reconciliation</span>
              </div>
              <p className="text-xs text-gray-500">
                Gathers every HR-applied Car Washer / Supervisor claim for the selected Mon-Sun week that isn't
                already in another batch, and sends it to Super Admin for approval before Accounts disburses it.
              </p>
              <div>
                <label className="block text-xs font-medium mb-1">Week starting (Monday)</label>
                <Input type="date" value={reconWeekStart} onChange={e => setReconWeekStart(e.target.value)} />
              </div>
              <p className="text-xs text-gray-600">
                {eligibleForRecon.length} eligible claim(s) totalling ₹{eligibleForRecon.reduce((s,t) => s + (t.netPayableAmount||0), 0).toLocaleString()}
              </p>
              <Button className="w-full" disabled={eligibleForRecon.length === 0} onClick={runReconciliation}>
                Run Reconciliation
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Past batches</p>
            {cityBatches.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No batches yet.</p>}
            {cityBatches.map(batch => (
              <div key={batch.id} className="p-3 bg-white border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{batch.weekStartDate} to {batch.weekEndDate}</p>
                  <p className="text-xs text-gray-400">{batch.tripIds.length} claim(s) · ₹{batch.totalAmount.toLocaleString()} · Disbursement: {batch.disbursementDate}</p>
                </div>
                <Badge className={
                  batch.status === "Approved" ? "bg-green-100 text-green-700"
                  : batch.status === "Super Admin Rejected" ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
                }>{batch.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {tab !== "weekly" && !selected && (
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
                [selected.firstApproverRole || "Manager", selected.managerApprovedBy || "—"],
                ["Their Comments", selected.managerComments || "—"],
                ["City Manager",   selected.cityManagerApprovedBy || "—"],
                ["CM Comments",    selected.cityManagerComments || "—"],
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
                {selected.payoutTrack === "Weekly" ? (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                    {selected.designation} claims are paid weekly — this will be included in the next Monday reconciliation, approved by Super Admin, and disbursed by Accounts the following Wednesday.
                  </p>
                ) : (
                  <>
                    <label className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded p-2 cursor-pointer">
                      <Checkbox checked={payImmediately} onCheckedChange={(c) => setPayImmediately(c as boolean)} />
                      Pay immediately (urgent / ad-hoc — skip next payroll cycle)
                    </label>
                    <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                      {payImmediately
                        ? "Approving will send this to Accounts for immediate payment today, outside the normal payroll run."
                        : `Approving will mark this for addition to ${selected.employeeName}'s salary for ${new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}. No TDS will be deducted.`}
                    </p>
                  </>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowReject(true)}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Final Approve
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
            {selected.history?.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600">Full history</summary>
                <div className="mt-1 space-y-1 pl-2 border-l-2 border-gray-200">
                  {selected.history.map((h, i) => (
                    <div key={i} className="text-gray-500">
                      <span className="font-medium text-gray-700">{h.stage}</span> {h.action.toLowerCase()}
                      {h.actorName ? ` by ${h.actorName}` : ""}
                      {h.comment ? ` — "${h.comment}"` : ""}
                      <span className="text-gray-400"> · {new Date(h.at).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
