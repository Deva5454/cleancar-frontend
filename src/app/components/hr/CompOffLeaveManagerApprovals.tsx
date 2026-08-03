/**
 * CompOffLeaveManagerApprovals.tsx — real screen: a reporting manager
 * reviews and approves or rejects their team's real comp-off leave
 * requests. A rejection always requires a real, mandatory comment.
 */

import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  getPendingManagerCompOffApprovals, managerApproveCompOffLeave, managerRejectCompOffLeave,
} from "../../services/compOffLeaveRequestService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function CompOffLeaveManagerApprovals() {
  const { currentUser } = useRole();
  const [refreshTick, setRefreshTick] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const pending = getPendingManagerCompOffApprovals(currentUser?.employeeId || "");

  const handleApprove = (requestId: string) => {
    managerApproveCompOffLeave(requestId, currentUser?.employeeId || "", currentUser?.name || "Manager");
    toast.success("Approved — forwarded to the City Manager");
    setRefreshTick((t) => t + 1);
  };

  const handleReject = (requestId: string) => {
    const result = managerRejectCompOffLeave(requestId, currentUser?.employeeId || "", currentUser?.name || "Manager", rejectComment);
    if (result.success) {
      toast.success("Request rejected — employee notified");
      setRejectingId(null); setRejectComment("");
      setRefreshTick((t) => t + 1);
    } else {
      toast.error(result.error || "Could not reject");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending Comp Off Approvals</CardTitle>
        <p className="text-xs text-gray-500">Your real team's comp-off requests, awaiting your decision</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">No pending requests.</p>
        ) : (
          pending.map((req) => (
            <div key={req.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{req.employeeName}</p>
                  <p className="text-xs text-gray-500">Wants {req.date} off</p>
                  {req.isResubmission && (
                    <p className="text-xs text-blue-600">Resubmission — was rejected once before: {req.resubmissionComment}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700">{req.reason}</p>
              {rejectingId === req.id ? (
                <div className="space-y-2 pt-2 border-t">
                  <Textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Reason for rejection (required)" rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>Confirm Reject</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectComment(""); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectingId(req.id)}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default CompOffLeaveManagerApprovals;
