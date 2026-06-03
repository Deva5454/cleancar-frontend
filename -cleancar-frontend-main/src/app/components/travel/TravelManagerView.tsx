import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { travelReimbursementService, type TravelTrip } from "../../services/travelReimbursementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { TravelEmployeeView } from "./TravelEmployeeView";

export function TravelManagerView() {
  const { currentUser } = useRole();
  const [tab, setTab] = useState<"approvals" | "my_trips">("my_trips"); // Default: own claims first
  const [selected, setSelected] = useState<TravelTrip | null>(null);
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const pending = useMemo(() =>
    travelReimbursementService.getPendingManagerApproval(currentUser?.employeeId || ""),
    [refresh, currentUser?.employeeId]
  );

  const handleApprove = (trip: TravelTrip) => {
    travelReimbursementService.managerApprove(
      trip.id,
      currentUser?.employeeId || "",
      currentUser?.name || "Manager",
      comments
    );
    toast.success(`Trip approved. Forwarded to HR for final approval.`);
    setSelected(null); setComments(""); setRefresh(r => r + 1);
  };

  const handleReject = (trip: TravelTrip) => {
    if (!rejectReason.trim()) { toast.error("Rejection reason is required"); return; }
    travelReimbursementService.reject(trip.id, currentUser?.name || "Manager", rejectReason);
    toast.success("Trip rejected. Employee has been notified.");
    setSelected(null); setShowReject(false); setRejectReason(""); setRefresh(r => r + 1);
  };

  const getPhoto = (id?: string) => id ? travelReimbursementService.getPhoto(id) : undefined;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("approvals")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "approvals" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
          📋 Pending Approvals {pending.length > 0 && <span className="ml-1 bg-red-500 text-white rounded-full text-xs px-1.5">{pending.length}</span>}
        </button>
        <button onClick={() => setTab("my_trips")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "my_trips" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
          My Trips
        </button>
      </div>

      {tab === "my_trips" && <TravelEmployeeView />}

      {tab === "approvals" && (
        <>
          {pending.length === 0 && !selected && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No pending approvals.</p>
            </div>
          )}

          {!selected && pending.map(trip => (
            <Card key={trip.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelected(trip)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{trip.employeeName}</p>
                    <p className="text-xs text-gray-500">{trip.designation} · {trip.tripDate}</p>
                    <p className="text-xs text-gray-600 mt-1">{trip.purposeOfVisit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">₹{trip.netPayableAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{trip.totalKm} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {selected && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Review Trip — {selected.employeeName}</CardTitle>
                  <button onClick={() => { setSelected(null); setShowReject(false); }}
                    className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trip details */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  {[
                    ["Employee",  `${selected.employeeName} (${selected.designation})`],
                    ["Date",      selected.tripDate],
                    ["Vehicle",   `${selected.vehicleType} — ${selected.vehicleNumber}`],
                    ["Purpose",   selected.purposeOfVisit],
                    ["Location",  selected.visitLocation],
                    ["Outcome",   selected.outcomeOfVisit || "Not entered"],
                    ["Distance",  `${selected.startReading} → ${selected.endReading} km (${selected.totalKm} km)`],
                    ["Rate",      `₹${selected.ratePerKm}/km`],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-right max-w-[60%]">{v}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Reimbursement</span>
                    <span className="text-green-700">₹{selected.netPayableAmount?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Odometer photos */}
                <div className="grid grid-cols-2 gap-3">
                  {["start_odometer","end_odometer"].map(type => {
                    const photoId = type === "start_odometer" ? selected.startPhotoId : selected.endPhotoId;
                    const photo = getPhoto(photoId);
                    return (
                      <div key={type}>
                        <p className="text-xs text-gray-500 mb-1">
                          {type === "start_odometer" ? "Start Odometer" : "End Odometer"}
                        </p>
                        {photo ? (
                          <img src={photo.dataUrl} alt={type}
                            className="w-full h-32 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                            <p className="text-xs text-gray-400">No photo uploaded</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Approve / Reject */}
                {!showReject ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Comments (optional)</label>
                      <Input value={comments} onChange={e => setComments(e.target.value)}
                        placeholder="Any notes for HR..." />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setShowReject(true)}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(selected)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve & Forward to HR
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason for Rejection *</label>
                      <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        placeholder="e.g. Odometer readings inconsistent, photos unclear" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowReject(false)}>Cancel</Button>
                      <Button className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => handleReject(selected)}>
                        Confirm Rejection
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
