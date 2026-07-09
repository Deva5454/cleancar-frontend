import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { expenseClaimService, type ExpenseClaim } from "../../services/expenseClaimService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CheckCircle, XCircle, IndianRupee, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "Added to Payroll": "bg-purple-100 text-purple-700",
};

export function ClaimHRView() {
  const { currentUser } = useRole();
  const { cityInfo } = useCity();
  const [refresh, setRefresh] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pending = useMemo(
    () => expenseClaimService.getPendingForHR(cityInfo?.id),
    [refresh, cityInfo?.id]
  );

  const allForCity = useMemo(
    () => expenseClaimService.getAll().filter((c) => !cityInfo?.id || c.cityId === cityInfo.id),
    [refresh, cityInfo?.id]
  );

  const approvedNotYetPaid = allForCity.filter((c) => c.status === "Approved");

  const handleApprove = (claim: ExpenseClaim) => {
    expenseClaimService.hrApprove(claim.id, currentUser?.name || "HR");
    toast.success("Approved — ready to be added to next payroll run");
    setRefresh((r) => r + 1);
  };

  const confirmReject = (claim: ExpenseClaim) => {
    if (!rejectReason.trim()) { toast.error("Add a reason for rejection"); return; }
    expenseClaimService.reject(claim.id, currentUser?.name || "HR", rejectReason);
    toast.success("Claim rejected");
    setRejectingId(null);
    setRejectReason("");
    setRefresh((r) => r + 1);
  };

  const handleMarkPaid = (claim: ExpenseClaim) => {
    const month = new Date().toISOString().slice(0, 7);
    expenseClaimService.markAddedToPayroll(claim.id, month, `MANUAL_${Date.now()}`);
    toast.success(`Marked as added to ${month} payroll`);
    setRefresh((r) => r + 1);
  };

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-1" /> Pending Approval ({pending.length})</TabsTrigger>
        <TabsTrigger value="approved"><ListChecks className="w-4 h-4 mr-1" /> Approved — Add to Payroll ({approvedNotYetPaid.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-3">
        {pending.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No claims pending HR approval.</p>
        )}
        {pending.map((claim) => (
          <Card key={claim.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{claim.employeeName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{claim.category}</Badge>
                    <span className="text-xs text-gray-400">{claim.expenseDate}</span>
                    <span className="text-xs text-gray-400">Manager-approved by {claim.managerApprovedBy}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-semibold text-lg">
                  <IndianRupee className="w-4 h-4" /> {claim.amount.toLocaleString("en-IN")}
                </div>
              </div>
              <p className="text-sm text-gray-600">{claim.description}</p>

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
      </TabsContent>

      <TabsContent value="approved" className="space-y-3">
        {approvedNotYetPaid.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">Nothing waiting to be added to payroll.</p>
        )}
        {approvedNotYetPaid.map((claim) => (
          <Card key={claim.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{claim.employeeName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={STATUS_COLOR[claim.status]}>{claim.status}</Badge>
                  <Badge variant="outline">{claim.category}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" /> {claim.amount.toLocaleString("en-IN")}
                </span>
                <Button size="sm" onClick={() => handleMarkPaid(claim)}>Add to Payroll</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}

export default ClaimHRView;
