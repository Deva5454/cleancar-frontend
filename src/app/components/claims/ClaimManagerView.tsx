import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { expenseClaimService, type ExpenseClaim } from "../../services/expenseClaimService";
import { ClaimEmployeeView } from "./ClaimEmployeeView";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { CheckCircle, XCircle, IndianRupee, Clock } from "lucide-react";
import { toast } from "sonner";

export function ClaimManagerView() {
  const { currentUser } = useRole();
  const [tab, setTab] = useState<"approvals" | "my_claims">("my_claims");
  const [refresh, setRefresh] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pending = useMemo(
    () => expenseClaimService.getPendingForManager(currentUser?.employeeId || ""),
    [refresh, currentUser?.employeeId]
  );

  const handleApprove = (claim: ExpenseClaim) => {
    expenseClaimService.managerApprove(claim.id, currentUser?.name || "Manager");
    toast.success(`Approved — sent to HR for final approval`);
    setRefresh((r) => r + 1);
  };

  const confirmReject = (claim: ExpenseClaim) => {
    if (!rejectReason.trim()) { toast.error("Add a reason for rejection"); return; }
    expenseClaimService.reject(claim.id, currentUser?.name || "Manager", rejectReason);
    toast.success("Claim rejected");
    setRejectingId(null);
    setRejectReason("");
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab("my_claims")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "my_claims" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          My Claims
        </button>
        <button
          onClick={() => setTab("approvals")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "approvals" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
        >
          Team Approvals ({pending.length})
        </button>
      </div>

      {tab === "my_claims" && <ClaimEmployeeView />}

      {tab === "approvals" && (
        <div className="space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No claims pending your approval.</p>
          )}
          {pending.map((claim) => (
            <Card key={claim.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{claim.employeeName} <span className="text-gray-400 font-normal">({claim.designation})</span></p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{claim.category}</Badge>
                      <span className="text-xs text-gray-400">{claim.expenseDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-lg">
                    <IndianRupee className="w-4 h-4" /> {claim.amount.toLocaleString("en-IN")}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{claim.description}</p>
                {claim.receiptDataUrl && (
                  <img src={claim.receiptDataUrl} alt="Receipt" className="h-24 rounded border object-cover" />
                )}

                {rejectingId === claim.id ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => confirmReject(claim)}>Confirm Reject</Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(claim)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(claim.id)}>
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClaimManagerView;
