/**
 * TSMCancellationQueue.tsx
 * TSM reviews cancellation requests from customers.
 * Approve → sends to Finance for refund processing
 * Reject → WA sent to customer with reason; CCE notified
 */
import React, { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { sendCancellationRejected } from "../../services/whatsappService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

const TSM_REFUNDS_KEY = "cleancar_tsm_refunds";
const FINANCE_REFUNDS_KEY = "cleancar_finance_refunds";

interface CancellationRequest {
  id: string;
  type: string;
  status: string;
  submittedAt: string;
  customerName: string;
  customerId: string;
  customerMobile: string;
  vehicleReg: string;
  subscriptionId: string;
  invoiceNumber: string;
  packageName: string;
  startDate: string;
  totalDays: number;
  totalAmount: number;
  daysElapsed: number;
  percentElapsed: number;
  prorata: number;
  cancellationFee: number;
  gatewayFee: number;
  refundAmount: number;
  refundZone: "full" | "partial" | "none";
  paymentMethod: string;
  reason: string;
  otherReason?: string;
  customerConsent: boolean;
  tsmDecision?: string;
  tsmRejectionReason?: string;
  tsmProcessedAt?: string;
  tsmProcessedBy?: string;
}

function loadRequests(): CancellationRequest[] {
  try { return JSON.parse(localStorage.getItem(TSM_REFUNDS_KEY) || "[]"); } catch { return []; }
}

function saveRequests(data: CancellationRequest[]) {
  localStorage.setItem(TSM_REFUNDS_KEY, JSON.stringify(data));
}

const INR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function TSMCancellationQueue() {
  const { currentUser } = useRole() as any;
  const { cancelSubscription } = useCustomerSubscriptions();
  const [requests, setRequests] = useState<CancellationRequest[]>(loadRequests);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = requests.filter(r =>
    filter === "all" ? true :
    filter === "pending" ? r.status === "Pending TSM Review" :
    filter === "approved" ? r.status === "Approved — Sent to Finance" :
    r.status === "Rejected"
  );

  const pendingCount = requests.filter(r => r.status === "Pending TSM Review").length;

  const handleApprove = (req: CancellationRequest) => {
    const now = new Date().toISOString();
    const tsmName = currentUser?.name || "TSM";

    // 1. Update request status
    const updated = requests.map(r => r.id === req.id ? {
      ...r,
      status: "Approved — Sent to Finance",
      tsmDecision: "Approved",
      tsmProcessedAt: now,
      tsmProcessedBy: tsmName,
    } : r);
    saveRequests(updated);
    setRequests(updated);

    // 2. Add to Finance refund queue
    const financeRecord = {
      ...req,
      status: "Pending Finance Processing",
      tsmDecision: "Approved",
      tsmProcessedAt: now,
      tsmProcessedBy: tsmName,
      financeStatus: "Pending",
    };
    try {
      const existing = JSON.parse(localStorage.getItem(FINANCE_REFUNDS_KEY) || "[]");
      existing.unshift(financeRecord);
      localStorage.setItem(FINANCE_REFUNDS_KEY, JSON.stringify(existing));
    } catch (_) {}

    // 3. Cancel the subscription in system
    try {
      cancelSubscription(req.subscriptionId);
    } catch (_) {}

    // 4. Log CCE info ticket
    try {
      const complaints = JSON.parse(localStorage.getItem("cleancar_complaints") || "[]");
      complaints.unshift({
        id: `TKT-TSM-${Date.now()}`,
        ticketId: `TKT-TSM-${Date.now()}`,
        customerId: req.customerId,
        customerName: req.customerName,
        customerPhone: req.customerMobile,
        complaintType: "Cancellation Approved by TSM",
        description: `TSM ${tsmName} approved cancellation. Refund of ${INR(req.refundAmount)} sent to Finance for processing. Ref: ${req.id}`,
        priority: "Low", status: "open",
        createdAt: now, loggedAt: now,
        cancellationRef: req.id,
      });
      localStorage.setItem("cleancar_complaints", JSON.stringify(complaints));
    } catch (_) {}

    toast.success(`Cancellation approved. ${INR(req.refundAmount)} refund sent to Finance queue.`);
  };

  const handleReject = (req: CancellationRequest) => {
    if (!rejectReason.trim()) { toast.error("Enter rejection reason"); return; }
    const now = new Date().toISOString();
    const tsmName = currentUser?.name || "TSM";

    const updated = requests.map(r => r.id === req.id ? {
      ...r,
      status: "Rejected",
      tsmDecision: "Rejected",
      tsmRejectionReason: rejectReason,
      tsmProcessedAt: now,
      tsmProcessedBy: tsmName,
    } : r);
    saveRequests(updated);
    setRequests(updated);

    // WA to customer
    try {
      sendCancellationRejected({
        customerPhone: req.customerMobile,
        customerName: req.customerName,
        refId: req.id,
        reason: rejectReason,
      });
    } catch (_) {}

    // CCE ticket for follow-up
    try {
      const complaints = JSON.parse(localStorage.getItem("cleancar_complaints") || "[]");
      complaints.unshift({
        id: `TKT-CANC-REJ-${Date.now()}`,
        ticketId: `TKT-CANC-REJ-${Date.now()}`,
        customerId: req.customerId,
        customerName: req.customerName,
        customerPhone: req.customerMobile,
        complaintType: "Cancellation Rejected — CCE Follow-up",
        description: `TSM rejected cancellation (Reason: ${rejectReason}). CCE to call customer and resolve. Ref: ${req.id}`,
        priority: "High", status: "open",
        createdAt: now, loggedAt: now,
        cancellationRef: req.id,
      });
      localStorage.setItem("cleancar_complaints", JSON.stringify(complaints));
    } catch (_) {}

    setRejectingId(null);
    setRejectReason("");
    toast.info("Cancellation rejected. Customer notified via WA. CCE follow-up ticket created.");
  };

  const zoneColor = (zone: string) => ({
    full: "bg-green-100 text-green-800",
    partial: "bg-amber-100 text-amber-800",
    none: "bg-red-100 text-red-800",
  }[zone] || "bg-gray-100 text-gray-600");

  const statusColor = (status: string) => {
    if (status === "Pending TSM Review") return "bg-amber-100 text-amber-800";
    if (status.includes("Approved")) return "bg-green-100 text-green-800";
    if (status === "Rejected") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cancellation Queue</h2>
          <p className="text-xs text-gray-500 mt-0.5">Review customer cancellation requests and process refunds</p>
        </div>
        {pendingCount > 0 && <Badge className="bg-red-100 text-red-700">{pendingCount} pending</Badge>}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(["pending","approved","rejected","all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize ${filter === f ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
            {f === "pending" ? `Pending (${pendingCount})` : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
          <p className="text-sm font-medium">{filter === "pending" ? "No pending requests" : `No ${filter} requests`}</p>
        </div>
      ) : filtered.map(req => (
        <Card key={req.id} className={`border-l-4 ${req.status === "Pending TSM Review" ? "border-l-amber-400" : req.status.includes("Approved") ? "border-l-green-400" : "border-l-red-400"}`}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{req.customerName}</p>
                <p className="text-xs text-gray-500">{req.customerMobile} · {req.vehicleReg}</p>
                <p className="text-xs text-gray-400 mt-0.5">{req.packageName} · Ref: {req.id}</p>
              </div>
              <div className="text-right space-y-1">
                <Badge className={statusColor(req.status)} style={{fontSize:10}}>{req.status}</Badge>
                <div><Badge className={zoneColor(req.refundZone)} style={{fontSize:10}}>
                  {req.refundZone === "none" ? "No Refund" : req.refundZone === "full" ? "Full Refund" : "Partial Refund"}
                </Badge></div>
              </div>
            </div>

            {/* Refund summary */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Total Paid</p>
                <p className="text-sm font-bold">{INR(req.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Days Elapsed</p>
                <p className="text-sm font-bold">{req.daysElapsed}/{req.totalDays} ({req.percentElapsed?.toFixed(0)}%)</p>
              </div>
              <div className={`rounded-lg p-2 ${req.refundAmount > 0 ? "bg-green-50" : "bg-red-50"}`}>
                <p className="text-xs text-gray-500">Refund</p>
                <p className={`text-sm font-bold ${req.refundAmount > 0 ? "text-green-700" : "text-red-600"}`}>
                  {req.refundAmount > 0 ? INR(req.refundAmount) : "Nil"}
                </p>
              </div>
            </div>

            {/* Expand for full details */}
            <button className="text-xs text-blue-600 flex items-center gap-1 mb-3"
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}>
              {expanded === req.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded === req.id ? "Less details" : "Full breakdown"}
            </button>

            {expanded === req.id && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1 mb-3">
                <p><strong>Reason:</strong> {req.reason}{req.otherReason ? ` — ${req.otherReason}` : ""}</p>
                <p><strong>Pro-rata used:</strong> {INR(req.prorata)}</p>
                <p><strong>Cancellation fee (10%):</strong> {INR(req.cancellationFee)}</p>
                <p><strong>Gateway fee:</strong> {INR(req.gatewayFee)}</p>
                <p><strong>Net refund:</strong> {req.refundAmount > 0 ? INR(req.refundAmount) : "Nil"}</p>
                <p><strong>Payment method:</strong> {req.paymentMethod || "N/A"}</p>
                <p><strong>Submitted:</strong> {new Date(req.submittedAt).toLocaleString("en-IN")}</p>
                {req.tsmProcessedBy && <p><strong>TSM Action:</strong> {req.tsmDecision} by {req.tsmProcessedBy}</p>}
                {req.tsmRejectionReason && <p><strong>Rejection reason:</strong> {req.tsmRejectionReason}</p>}
              </div>
            )}

            {/* Actions — only for pending */}
            {req.status === "Pending TSM Review" && (
              rejectingId === req.id ? (
                <div className="space-y-2">
                  <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                    placeholder="Reason for rejection (sent to customer via WA)..."
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRejectingId(null)} className="flex-1">Cancel</Button>
                    <Button size="sm" onClick={() => handleReject(req)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setRejectingId(req.id); setRejectReason(""); }}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => handleApprove(req)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    {req.refundAmount > 0 ? `Approve — ${INR(req.refundAmount)} refund` : "Approve — No refund"}
                  </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default TSMCancellationQueue;
