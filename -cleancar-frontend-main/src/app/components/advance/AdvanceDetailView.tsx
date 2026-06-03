/**
 * Advance Detail View
 * Shows detailed information about a specific advance request
 * Includes: Status, Amount, Repayment Schedule, Documents, Timeline
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { advanceManagementService } from "../../services/advanceManagementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  TrendingDown,
} from "lucide-react";
import type { LongTermAdvance, ShortTermAdvance } from "../../types/advanceManagement";

type Advance = LongTermAdvance | ShortTermAdvance;

export function AdvanceDetailView() {
  const { advanceId } = useParams<{ advanceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useRole();

  const [advance, setAdvance] = useState<Advance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!advanceId) {
      navigate("/advance/my-advances");
      return;
    }

    // Fetch advance details
    const summary = advanceManagementService.getEmployeeSummary(currentUser.name);
    const allAdvances = [...summary.activeAdvances, ...summary.history];
    const foundAdvance = allAdvances.find(adv => adv.advanceId === advanceId);

    if (foundAdvance) {
      setAdvance(foundAdvance);
    }
    setLoading(false);
  }, [advanceId, currentUser.name, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advance details...</p>
        </div>
      </div>
    );
  }

  if (!advance) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advance Not Found</h3>
              <p className="text-gray-600 mb-4">
                The advance request you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/advance/my-advances")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Advances
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isLongTerm = "repaymentPeriod" in advance;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/advance/my-advances")}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Advances
        </Button>

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Advance Request Details</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Request ID: {advance.advanceId}</p>
              </div>
              <Badge className={getStatusColor(advance.status)}>
                {getStatusIcon(advance.status)}
                <span className="ml-2 capitalize">{advance.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Advance Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p className="text-base font-medium text-gray-900">
                      {isLongTerm ? "Long-term Advance" : "Short-term Advance"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Requested Amount</label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p className="text-2xl font-bold text-gray-900">₹{(advance?.amount ?? 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Purpose</label>
                  <p className="text-base text-gray-900 mt-1">{advance.purpose}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Request Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-base text-gray-900">{advance.requestDate}</p>
                  </div>
                </div>

                {isLongTerm && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Repayment Period</label>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <p className="text-base text-gray-900">{advance.repaymentPeriod} months</p>
                    </div>
                  </div>
                )}

                {advance.status === "approved" && advance.approvedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved By</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-base text-gray-900">{advance.approvedBy}</p>
                    </div>
                  </div>
                )}

                {advance.status === "rejected" && advance.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                    <div className="flex items-center gap-2 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="text-base text-red-700">{advance.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Repayment Details for Long-term */}
            {isLongTerm && advance.status === "approved" && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Repayment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Monthly Deduction</p>
                      <p className="text-xl font-bold text-blue-900">
                        ₹{Math.round(advance.amount / advance.repaymentPeriod).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Amount Repaid</p>
                      <p className="text-xl font-bold text-green-900">₹0</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Balance</p>
                      <p className="text-xl font-bold text-yellow-900">
                        ₹{(advance?.amount ?? 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Request Submitted</p>
                    <p className="text-xs text-gray-500">{advance.requestDate}</p>
                  </div>
                </div>

                {advance.status === "approved" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approved</p>
                      <p className="text-xs text-gray-500">Approved by {advance.approvedBy}</p>
                    </div>
                  </div>
                )}

                {advance.status === "rejected" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rejected</p>
                      <p className="text-xs text-gray-500">{advance.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {advance.status === "pending" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pending Review</p>
                      <p className="text-xs text-gray-500">Awaiting HR approval</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
