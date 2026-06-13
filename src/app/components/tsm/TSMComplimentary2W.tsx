/**
 * TSMComplimentary2W.tsx
 * TSM screen: approve/reject 2W offers + set TSE caps
 */
import { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import {
  getPendingOffersForTSM, approveOffer, rejectOffer,
  getAllTseCapStatuses, setTseCap, getMarketingExpenseSummary,
  Complimentary2WOffer
} from "../../services/complimentary2WService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bike, CheckCircle, XCircle, Settings, TrendingUp } from "lucide-react";

type Tab = "pending" | "caps" | "summary";

export function TSMComplimentary2W() {
  const { currentUser } = useRole() as any;
  const [tab, setTab] = useState<Tab>("pending");
  const [offers, setOffers] = useState<Complimentary2WOffer[]>(() => getPendingOffersForTSM());
  const [capStatuses, setCapStatuses] = useState(() => getAllTseCapStatuses());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [capEdits, setCapEdits] = useState<Record<string, string>>({});

  const currentMonth = new Date().toISOString().slice(0, 7);
  const summary = getMarketingExpenseSummary(currentMonth);

  const handleApprove = (offerId: string) => {
    const result = approveOffer(offerId, currentUser?.employeeId || "TSM-001", currentUser?.name || "TSM");
    if (result.success) {
      toast.success("Offer approved. Job created and customer notified.");
      setOffers(getPendingOffersForTSM());
    } else {
      toast.error(result.error || "Approval failed");
    }
  };

  const handleReject = (offerId: string) => {
    if (!rejectReason.trim()) { toast.error("Enter rejection reason"); return; }
    rejectOffer(offerId, currentUser?.employeeId || "TSM-001", rejectReason);
    toast.info("Offer rejected. TSE notified.");
    setRejectingId(null);
    setRejectReason("");
    setOffers(getPendingOffersForTSM());
  };

  const handleSetCap = (tseId: string) => {
    const val = parseInt(capEdits[tseId] || "");
    if (isNaN(val) || val < 0) { toast.error("Enter valid cap (0 or more)"); return; }
    setTseCap(tseId, val, currentUser?.employeeId || "TSM-001");
    toast.success("Cap updated");
    setCapStatuses(getAllTseCapStatuses());
    setCapEdits(e => ({ ...e, [tseId]: "" }));
  };

  const reasonLabel = (r: string) => r === "NEW_CONVERSION_INCENTIVE" ? "New Conversion" : "Retention";
  const reasonColor = (r: string) => r === "NEW_CONVERSION_INCENTIVE" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Bike className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Complimentary 2W Washes</h2>
          <p className="text-xs text-gray-500">Approve offers · Set TSE caps · View marketing spend</p>
        </div>
        {offers.length > 0 && (
          <Badge className="bg-red-100 text-red-700 ml-auto">{offers.length} pending</Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(["pending","caps","summary"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-md capitalize ${tab === t ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
            {t === "pending" ? `Pending (${offers.length})` : t === "caps" ? "TSE Caps" : "Summary"}
          </button>
        ))}
      </div>

      {/* PENDING APPROVALS */}
      {tab === "pending" && (
        <div className="space-y-3">
          {offers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p className="text-sm font-medium text-green-600">All caught up</p>
              <p className="text-xs mt-1">No pending offers</p>
            </div>
          ) : offers.map(o => (
            <Card key={o.offerId} className="border-l-4 border-l-amber-400">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{o.customerName}</p>
                    <p className="text-xs text-gray-500">{o.customerPhone}</p>
                    <p className="text-xs text-gray-500 mt-0.5">TSE: {o.offeredByTseName}</p>
                  </div>
                  <Badge className={reasonColor(o.reasonCode)}>{reasonLabel(o.reasonCode)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  <div><span className="font-medium">4W Reg:</span> {o.vehicle4WReg}</div>
                  <div><span className="font-medium">2W Reg:</span> {o.vehicle2WReg}</div>
                  <div><span className="font-medium">Type:</span> {o.vehicle2WType}</div>
                  <div><span className="font-medium">Brand:</span> {o.vehicle2WBrand}</div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Est. cost: ₹{o.estimatedCost} (marketing expense)</p>

                {rejectingId === o.offerId ? (
                  <div className="space-y-2">
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Rejection reason..." value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setRejectingId(null)} className="flex-1">Cancel</Button>
                      <Button size="sm" onClick={() => handleReject(o.offerId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">Confirm Reject</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRejectingId(o.offerId)} className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(o.offerId)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TSE CAPS */}
      {tab === "caps" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Set monthly complimentary offer cap per TSE. Resets on the 1st of each month.</p>
          {capStatuses.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No TSEs found in this city</div>
          ) : capStatuses.map(c => (
            <Card key={c.tseId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{c.tseName || c.tseId}</p>
                    <p className="text-xs text-gray-500">{c.used}/{c.cap} used this month</p>
                  </div>
                  <Badge className={c.remaining > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {c.remaining} left
                  </Badge>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    type="number" min="0" max="20"
                    placeholder={`Current: ${c.cap}`}
                    value={capEdits[c.tseId] || ""}
                    onChange={e => setCapEdits(prev => ({ ...prev, [c.tseId]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => handleSetCap(c.tseId)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Settings className="w-3.5 h-3.5 mr-1" /> Set
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SUMMARY */}
      {tab === "summary" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{currentMonth} — Marketing expense summary</p>
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-600">{summary.totalOffers}</div>
              <div className="text-xs text-gray-500">Total Offers</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-purple-600">₹{summary.totalCost.toLocaleString("en-IN")}</div>
              <div className="text-xs text-gray-500">Marketing Spend</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-amber-600">{summary.pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </CardContent></Card>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">By Reason</p>
            {Object.entries(summary.byReason).map(([r, data]: [string, any]) => (
              <div key={r} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                <span className={`text-xs px-2 py-0.5 rounded-full ${reasonColor(r)}`}>{reasonLabel(r)}</span>
                <span className="text-gray-700">{data.count} offers · ₹{data.cost.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          {/* Month-over-month trend — last 4 months */}
          {(() => {
            const months: string[] = [];
            const d = new Date();
            for (let i = 3; i >= 0; i--) {
              const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
              months.push(m.toISOString().slice(0, 7));
            }
            const trend = months.map(m => ({
              month: m,
              label: new Date(m + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
              ...getMarketingExpenseSummary(m),
            }));
            const maxCost = Math.max(...trend.map(t => t.totalCost), 1);
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">📊 4-Month Trend</p>
                <div className="space-y-2">
                  {trend.map(t => (
                    <div key={t.month} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-700">{t.label}</span>
                        <span className="text-xs text-gray-500">{t.totalOffers} offers · ₹{t.totalCost.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.round((t.totalCost / maxCost) * 100)}%` }} />
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>✅ {t.completed} done</span>
                        <span>🆕 {t.newConversions} conv</span>
                        <span>🔄 {t.retentions} ret</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default TSMComplimentary2W;
