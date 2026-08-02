/**
 * Advance Detail View
 * Shows detailed information about a specific advance request
 * Includes: Status, Amount, Repayment Schedule, Documents, Timeline
 */

import { useEffect, useState } from "react";
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
import type { LongTermAdvance, ShortTermAdvance, AdvanceStatus } from "../../types/advanceManagement";

type Advance = LongTermAdvance | ShortTermAdvance;

const STATUS_COLOR: Record<AdvanceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CHEQUE_PENDING: "bg-amber-100 text-amber-800",
  DISBURSED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  DEFAULTED: "bg-red-100 text-red-800",
  SETTLED: "bg-purple-100 text-purple-800",
};

const STATUS_ICON: Record<AdvanceStatus, JSX.Element> = {
  DRAFT: <FileText className="w-5 h-5 text-gray-500" />,
  PENDING_APPROVAL: <Clock className="w-5 h-5 text-yellow-500" />,
  APPROVED: <CheckCircle className="w-5 h-5 text-green-500" />,
  REJECTED: <XCircle className="w-5 h-5 text-red-500" />,
  CHEQUE_PENDING: <Clock className="w-5 h-5 text-amber-500" />,
  DISBURSED: <CheckCircle className="w-5 h-5 text-blue-500" />,
  ACTIVE: <TrendingDown className="w-5 h-5 text-blue-500" />,
  COMPLETED: <CheckCircle className="w-5 h-5 text-green-500" />,
  DEFAULTED: <AlertCircle className="w-5 h-5 text-red-500" />,
  SETTLED: <CheckCircle className="w-5 h-5 text-purple-500" />,
};

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

    // Real fix: previously (a) keyed off currentUser.name instead of the
    // real employeeId PayrollRun actually matches against, (b) read a
    // `summary.history` field that never existed on EmployeeAdvanceSummary
    // (crashed every load with "summary.history is not iterable"), and
    // (c) matched records via `.advanceId`, a field neither LongTermAdvance
    // nor ShortTermAdvance actually has (real field is `.id`) — so even
    // once the crash was fixed, the lookup could never succeed.
    const summary = advanceManagementService.getEmployeeSummary(currentUser.employeeId || "");
    const allAdvances = [...summary.activeAdvances, ...summary.history];
    const foundAdvance = allAdvances.find((adv) => adv.id === advanceId);

    setAdvance(foundAdvance || null);
    setLoading(false);
  }, [advanceId, currentUser.employeeId, navigate]);

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

  const isLongTerm = "tenureMonths" in advance;
  const amount = isLongTerm ? advance.advanceAmount : advance.requestedAmount;
  const statusLabel = advance.status.replace(/_/g, " ");

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
                <p className="text-sm text-gray-600 mt-1">Request ID: {advance.id}</p>
              </div>
              <Badge className={STATUS_COLOR[advance.status]}>
                {STATUS_ICON[advance.status]}
                <span className="ml-2 capitalize">{statusLabel}</span>
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
                    <p className="text-2xl font-bold text-gray-900">₹{amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Request Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-base text-gray-900">{advance.appliedDate}</p>
                  </div>
                </div>

                {isLongTerm && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Repayment Period</label>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingDown className="w-4 h-4 text-gray-400" />
                      <p className="text-base text-gray-900">{advance.tenureMonths} months</p>
                    </div>
                  </div>
                )}

                {advance.approvedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved By</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-base text-gray-900">{advance.approvedBy}</p>
                    </div>
                  </div>
                )}

                {advance.status === "REJECTED" && advance.rejectionReason && (
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
            {isLongTerm && (advance.status === "ACTIVE" || advance.status === "COMPLETED") && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Repayment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Monthly Deduction (EMI)</p>
                      <p className="text-xl font-bold text-blue-900">₹{advance.emiAmount.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Amount Repaid</p>
                      <p className="text-xl font-bold text-green-900">₹{advance.totalPaid.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Balance</p>
                      <p className="text-xl font-bold text-yellow-900">
                        ₹{advance.remainingAmount.toLocaleString()}
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
                    <p className="text-xs text-gray-500">{advance.appliedDate}</p>
                  </div>
                </div>

                {(advance.status === "APPROVED" || advance.status === "ACTIVE" || advance.status === "DISBURSED" || advance.status === "COMPLETED") && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approved</p>
                      <p className="text-xs text-gray-500">Approved by {advance.approvedBy || "system (auto-approved)"}</p>
                    </div>
                  </div>
                )}

                {advance.status === "REJECTED" && (
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

                {advance.status === "PENDING_APPROVAL" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pending Review</p>
                      <p className="text-xs text-gray-500">Awaiting approval</p>
                    </div>
                  </div>
                )}

                {advance.status === "COMPLETED" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fully Repaid</p>
                      <p className="text-xs text-gray-500">All dues cleared</p>
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

export default AdvanceDetailView;
