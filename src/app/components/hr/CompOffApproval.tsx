/**
 * 🟨 COMP OFF APPROVAL - MANAGER VIEW
 * Manager interface to approve/reject Comp Off requests from team members
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { CheckCircle, XCircle, Clock, Calendar, User, AlertCircle, FileText, Info } from "lucide-react";
import { compOffService, type CompOffRequest } from "../../services/compOffService";
import { useRole } from "../../contexts/RoleContext";
import { toast } from "sonner";

export function CompOffApproval() {
  const { currentUser } = useRole();
  const [requests, setRequests] = useState<CompOffRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CompOffRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const allRequests = compOffService.getPendingCompOffRequests();
    setRequests(allRequests);
  };

  const handleApprove = (request: CompOffRequest) => {
    setSelectedRequest(request);
    setShowApprovalDialog(true);
  };

  const confirmApproval = () => {
    if (!selectedRequest) return;

    const entry = compOffService.approveCompOffRequest(
      selectedRequest.id,
      currentUser.name,
      approvalNotes || undefined
    );

    if (entry) {
      toast.success(
        `✅ Comp Off approved for ${selectedRequest.employeeName}!\n\n+${selectedRequest.suggestedCompOff} day${selectedRequest.suggestedCompOff !== 1 ? "s" : ""} credited\nExpires on: ${new Date(entry.expiryDate).toLocaleDateString("en-IN")}`
      );
      loadRequests();
      setShowApprovalDialog(false);
      setApprovalNotes("");
      setSelectedRequest(null);
    } else {
      toast.error("Failed to approve Comp Off request");
    }
  };

  const handleReject = (request: CompOffRequest) => {
    setSelectedRequest(request);
    setShowRejectionDialog(true);
  };

  const confirmRejection = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    const success = compOffService.rejectCompOffRequest(
      selectedRequest.id,
      currentUser.name,
      rejectionReason
    );

    if (success) {
      toast.success(`Comp Off request rejected for ${selectedRequest.employeeName}`);
      loadRequests();
      setShowRejectionDialog(false);
      setRejectionReason("");
      setSelectedRequest(null);
    } else {
      toast.error("Failed to reject Comp Off request");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Pending Requests</p>
                <p className="text-3xl font-bold text-blue-900">{requests.length}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Total Days Requested</p>
                <p className="text-3xl font-bold text-green-900">
                  {requests.reduce((sum, r) => sum + r.suggestedCompOff, 0)}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Team Members</p>
                <p className="text-3xl font-bold text-purple-900">
                  {new Set(requests.map((r) => r.employeeId)).size}
                </p>
              </div>
              <User className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Comp Off Approval Queue
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve Comp Off requests from your team members
          </p>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">No pending Comp Off requests</p>
              <p className="text-sm text-gray-400 mt-1">
                Requests will appear here when team members work on off-days
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg text-gray-900">
                          {request.employeeName}
                        </h4>
                        <Badge variant="outline">{request.empCode}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">Pending Review</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested on {new Date(request.requestedOn).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Work Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Work Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(request.workDate).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Day Type</p>
                      <Badge variant="outline" className="bg-white">
                        {request.workDayType}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 mb-1">Work Hours</p>
                      <p className="font-semibold text-indigo-600">{request.workHours} hours</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 mb-1">System Suggestion</p>
                      <p className="font-semibold text-green-600">
                        +{request.suggestedCompOff} day{request.suggestedCompOff !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Calculation Logic Display */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">System Calculation:</p>
                        <p>
                          {request.workHours >= 5 ? (
                            <>
                              ✅ Work hours ({request.workHours}h) ≥ 5 hours → <strong>1 full Comp Off day</strong>
                            </>
                          ) : (
                            <>
                              ⚠️ Work hours ({request.workHours}h) &lt; 5 hours → <strong>0.5 Comp Off day</strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Work Evidence */}
                  {request.workEvidence && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-semibold text-green-900 mb-1">Work Evidence:</p>
                      <p className="text-sm text-green-800">{request.workEvidence}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(request)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Credit
                    </Button>
                    <Button
                      onClick={() => handleReject(request)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      {showApprovalDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approve Comp Off Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Employee:</strong> {selectedRequest.employeeName} ({selectedRequest.empCode})
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Work Date:</strong> {new Date(selectedRequest.workDate).toLocaleDateString("en-IN")}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Work Hours:</strong> {selectedRequest.workHours} hours
                </p>
                <p className="text-sm text-green-600 font-semibold">
                  <strong>Comp Off to Credit:</strong> +{selectedRequest.suggestedCompOff} day{selectedRequest.suggestedCompOff !== 1 ? "s" : ""}
                </p>
              </div>

              <div>
                <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                  rows={3}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                <p className="font-semibold mb-1">⏰ Validity Information:</p>
                <p>This Comp Off will be valid for 90 days from today</p>
                <p className="text-xs mt-1 text-blue-700">
                  Expiry Date: {new Date(new Date().setDate(new Date().getDate() + 90)).toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmApproval}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Approval
                </Button>
                <Button
                  onClick={() => {
                    setShowApprovalDialog(false);
                    setApprovalNotes("");
                    setSelectedRequest(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectionDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Reject Comp Off Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Employee:</strong> {selectedRequest.employeeName} ({selectedRequest.empCode})
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Work Date:</strong> {new Date(selectedRequest.workDate).toLocaleDateString("en-IN")}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Requested:</strong> +{selectedRequest.suggestedCompOff} day{selectedRequest.suggestedCompOff !== 1 ? "s" : ""}
                </p>
              </div>

              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  rows={4}
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                The employee will be notified of this rejection with your reason
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmRejection}
                  variant="destructive"
                  className="flex-1"
                  disabled={!rejectionReason.trim()}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setRejectionReason("");
                    setSelectedRequest(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Policy Reference */}
      <Card className="bg-purple-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="text-base text-purple-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Comp Off Approval Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-purple-900">
            <div>
              <p className="font-semibold mb-1">✅ When to Approve:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>Verified attendance/biometric records show actual work</li>
                <li>Work was genuinely required on the off-day</li>
                <li>Work hours calculation is accurate</li>
                <li>Employee has provided valid work evidence</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">❌ When to Reject:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>No verifiable attendance records</li>
                <li>Suspected fake/fraudulent login</li>
                <li>Work hours calculation appears incorrect</li>
                <li>Work was not authorized or required</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">🎯 Calculation Rules:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>Work ≥5 hours → 1 full day Comp Off</li>
                <li>Work &lt;5 hours → 0.5 day Comp Off</li>
                <li>System suggestion is based on recorded work hours</li>
                <li>You can verify actual hours before approving</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">⏰ Validity:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>Each approved Comp Off is valid for 90 days from approval date</li>
                <li>System tracks expiry automatically</li>
                <li>Employees will receive expiry alerts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}