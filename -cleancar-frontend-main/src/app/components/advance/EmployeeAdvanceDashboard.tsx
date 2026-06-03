/**
 * Employee Advance Dashboard
 * Employee-facing interface for advance management
 * Shows: Apply, Status, Repayment Tracker
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { advanceManagementService } from "../../services/advanceManagementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Lock,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import type { EmployeeAdvanceSummary, LongTermAdvance, ShortTermAdvance } from "../../types/advanceManagement";

export function EmployeeAdvanceDashboard() {
  const navigate = useNavigate();
  const { currentUser, currentRole } = useRole();

  const [summary, setSummary] = useState<EmployeeAdvanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch employee advance summary
    const employeeSummary = advanceManagementService.getEmployeeSummary(currentUser.name);
    setSummary(employeeSummary);
    setLoading(false);
  }, [currentUser.name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advance information...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Unable to load advance information</p>
      </div>
    );
  }

  const hasActiveAdvances = summary.activeAdvances.length > 0;

  const handleBack = () => {
    // Navigate based on role - washers go back to car washer module, others to home
    if (currentRole === "Car Washer" || currentRole === "washer") {
      navigate("/car-washer");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header with Apply Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Advances</h2>
            <p className="text-sm text-gray-600 mt-1">
              Apply for advance • Track status • Monitor repayment
            </p>
          </div>
          <Button
            onClick={() => navigate("/advance")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply for Advance
          </Button>
        </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{(summary?.totalOutstanding ?? 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-300" />
            </div>
          </CardContent>
        </Card>

        {/* Active Advances */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Active Advances</p>
                <p className="text-2xl font-bold text-blue-600">{summary.activeAdvances.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        {/* Next EMI Date */}
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Next EMI Date</p>
                <p className="text-sm font-bold text-amber-900">
                  {summary.nextEmiDate
                    ? new Date(summary.nextEmiDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    : "N/A"}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>

        {/* Next EMI Amount */}
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Next EMI Amount</p>
                <p className="text-lg font-bold text-green-600">
                  {summary.nextEmiAmount ? `₹${(summary?.nextEmiAmount ?? 0).toLocaleString()}` : "N/A"}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Advances List */}
      {hasActiveAdvances ? (
        <Card>
          <CardHeader>
            <CardTitle>Active Advances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.activeAdvances.map((advance: any) => (
                <AdvanceCard key={advance.id} advance={advance} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Advances</h3>
              <p className="text-sm text-gray-600 mb-6">
                You don't have any active advances at the moment. Apply for an advance if you need
                financial assistance.
              </p>
              <Button onClick={() => navigate("/advance")} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Apply for Advance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eligibility Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Eligibility Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Long-Term Eligibility */}
            <div
              className={`p-4 rounded-lg border-2 ${
                summary.isEligibleForLongTerm
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">Long-Term Advance</p>
                  <p className="text-xs text-gray-600 mt-1">EMI-based repayment</p>
                </div>
                {summary.isEligibleForLongTerm ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <Badge
                variant={summary.isEligibleForLongTerm ? "default" : "destructive"}
                className="mt-2"
              >
                {summary.isEligibleForLongTerm ? "✓ Eligible" : "✗ Not Eligible"}
              </Badge>
              {!summary.isEligibleForLongTerm && (
                <p className="text-xs text-red-700 mt-2">
                  Clear existing advance to become eligible
                </p>
              )}
            </div>

            {/* Short-Term Eligibility */}
            <div
              className={`p-4 rounded-lg border-2 ${
                summary.isEligibleForShortTerm
                  ? "border-green-300 bg-green-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">Short-Term Advance</p>
                  <p className="text-xs text-gray-600 mt-1">Quick salary advance</p>
                </div>
                {summary.isEligibleForShortTerm ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <Badge
                variant={summary.isEligibleForShortTerm ? "default" : "outline"}
                className={
                  summary.isEligibleForShortTerm
                    ? ""
                    : "border-amber-400 text-amber-700 bg-amber-100"
                }
              >
                {summary.isEligibleForShortTerm ? "✓ Eligible" : "⏳ Pending Recovery"}
              </Badge>
              {!summary.isEligibleForShortTerm && (
                <p className="text-xs text-amber-700 mt-2">
                  Previous advance must be recovered first
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment History Summary */}
      {summary.completedAdvances > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Good Repayment History</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {summary.completedAdvances} advance(s) completed • ₹
                    {(summary?.totalRepaid ?? 0).toLocaleString()} repaid
                  </p>
                </div>
              </div>
              {summary.missedEmis === 0 && (
                <Badge className="bg-blue-600">Perfect Record</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missed EMIs Alert */}
      {summary.missedEmis > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">
                  ⚠️ {summary.missedEmis} Missed EMI(s)
                </p>
                <p className="text-xs text-red-800 mt-1">
                  Please contact HR immediately to resolve pending EMIs and avoid further action.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

// Individual Advance Card Component
function AdvanceCard({ advance }: { advance: LongTermAdvance | ShortTermAdvance }) {
  const navigate = useNavigate();
  const isLongTerm = "emiSchedule" in advance;

  const getStatusBadge = () => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      PENDING_APPROVAL: { color: "bg-amber-100 text-amber-800 border-amber-300", label: "Pending Approval" },
      APPROVED: { color: "bg-green-100 text-green-800 border-green-300", label: "Approved" },
      REJECTED: { color: "bg-red-100 text-red-800 border-red-300", label: "Rejected" },
      CHEQUE_PENDING: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Cheque Pending" },
      DISBURSED: { color: "bg-purple-100 text-purple-800 border-purple-300", label: "Disbursed" },
      ACTIVE: { color: "bg-green-100 text-green-800 border-green-300", label: "Active" },
      COMPLETED: { color: "bg-gray-100 text-gray-800 border-gray-300", label: "Completed" },
    };

    const config = statusConfig[advance.status] || statusConfig.ACTIVE;
    return (
      <Badge variant="outline" className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {isLongTerm ? "Long-Term" : "Short-Term"} Advance
            </span>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-gray-600">ID: {advance.id}</p>
        </div>
        <p className="text-xl font-bold text-blue-600">
          ₹{isLongTerm ? (advance as LongTermAdvance).advanceAmount.toLocaleString() : (advance as ShortTermAdvance).requestedAmount.toLocaleString()}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {isLongTerm ? (
          <>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Remaining</p>
              <p className="text-sm font-semibold text-red-600">
                ₹{(advance as LongTermAdvance).remainingAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">EMI Amount</p>
              <p className="text-sm font-semibold text-gray-900">
                ₹{(advance as LongTermAdvance).emiAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Next EMI</p>
              <p className="text-sm font-semibold text-amber-600">
                {(advance as LongTermAdvance).nextEmiDate
                  ? new Date((advance as LongTermAdvance).nextEmiDate!).toLocaleDateString("en-IN")
                  : "N/A"}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Total Paid</p>
              <p className="text-sm font-semibold text-green-600">
                ₹{(advance as LongTermAdvance).totalPaid.toLocaleString()}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Recovery Status</p>
              <p className="text-sm font-semibold text-gray-900">
                {(advance as ShortTermAdvance).isRecovered ? "✓ Recovered" : "⏳ Pending"}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">Recovery Month</p>
              <p className="text-sm font-semibold text-gray-900">
                {(advance as ShortTermAdvance).recoveryMonth}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Progress Bar (Long-term only) */}
      {isLongTerm && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Repayment Progress</span>
            <span>
              {Math.round(
                ((advance as LongTermAdvance).totalPaid / (advance as LongTermAdvance).advanceAmount) * 100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  ((advance as LongTermAdvance).totalPaid / (advance as LongTermAdvance).advanceAmount) * 100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Disbursement Lock Warning */}
      {advance.status === "APPROVED" && isLongTerm && (advance as LongTermAdvance).isDisbursementLocked && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Disbursement Locked:</strong> Waiting for cheque deposit
          </p>
        </div>
      )}

      {/* View Details Button */}
      <Button
        onClick={() => navigate(`/advance/status/${advance.id}`)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        View Details
      </Button>
    </div>
  );
}
