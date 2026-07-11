/**
 * Washer GPS Re-Check-In Approvals
 *
 * City Manager screen for reviewing washers who were auto-checked-out
 * after their GPS/location was turned off mid-shift. They can't check in
 * again the same day until a City Manager approves or rejects their
 * request here.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { washerGpsViolationService, type WasherGpsViolation } from "../../services/washerGpsViolationService";
import { toast } from "sonner";

export function WasherGpsApprovals() {
  const { currentUser, currentRole } = useRole();
  const { city } = useCity();
  const [violations, setViolations] = useState<WasherGpsViolation[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const reload = () => setViolations(washerGpsViolationService.getPendingForCity(city));
  useEffect(() => { reload(); }, [city]);

  const handleApprove = (v: WasherGpsViolation) => {
    const result = washerGpsViolationService.approve(
      v.id, city, (currentUser as any)?.name || currentRole, currentRole, noteDrafts[v.id]
    );
    if (result.success) {
      toast.success(`${v.washerName} can now check in again today.`);
      reload();
    } else {
      toast.error(result.error || "Couldn't approve — please try again.");
    }
  };

  const handleReject = (v: WasherGpsViolation) => {
    if (!noteDrafts[v.id]?.trim()) {
      toast.error("Add a note explaining why, before rejecting.");
      return;
    }
    const result = washerGpsViolationService.reject(
      v.id, city, (currentUser as any)?.name || currentRole, currentRole, noteDrafts[v.id]
    );
    if (result.success) {
      toast.success(`Request declined for ${v.washerName}.`);
      reload();
    } else {
      toast.error(result.error || "Couldn't reject — please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Washer Re-Check-In Approvals</h2>
        <p className="text-sm text-gray-500 mt-1">
          Washers auto-checked-out for turning off their location need your approval to check in again the same day.
        </p>
      </div>

      {violations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-gray-600 font-medium">No pending GPS violation approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map((v) => (
            <Card key={v.id} className={v.status === "Rejected" ? "border-red-200" : "border-amber-200"}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{v.washerName}</CardTitle>
                  <Badge className={v.status === "Rejected" ? "bg-red-100 text-red-800 border-red-300" : "bg-amber-100 text-amber-800 border-amber-300"}>
                    {v.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Auto-checked-out at {new Date(v.autoCheckoutAt).toLocaleString("en-IN")}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {v.requestedAt ? (
                  <p className="text-sm text-gray-600">
                    <strong>Requested:</strong> {v.requestReason || "Requesting approval to check in again."}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Washer hasn't requested reinstatement yet.</p>
                )}
                {v.status === "Rejected" && v.reviewNote && (
                  <p className="text-sm text-red-600"><strong>Previously declined:</strong> "{v.reviewNote}"</p>
                )}
                {v.requestedAt && (
                  <>
                    <Textarea
                      placeholder="Note (required to reject, optional to approve)"
                      value={noteDrafts[v.id] || ""}
                      onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(v)}>
                        Approve — Let them check in
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleReject(v)}>
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default WasherGpsApprovals;
