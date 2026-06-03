/**
 * ATTENDANCE PENALTIES & PLRG/HPLRG MANAGEMENT
 * System-enforced PL adjustments for attendance violations
 */

import { DataService } from "../../services/DataService";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import {
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle,
  AlertTriangle,
  FileText,
  Info,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import {
  attendancePenaltyService,
  type AttendanceViolation,
  type ViolationType,
} from "../../services/attendancePenaltyService";
import {
  getViolationDescription,
  getPenaltyTypeDisplay,
  ATTENDANCE_PENALTY_RULES,
  ATTENDANCE_POLICY_CONFIG,
} from "../../config/attendancePenaltyPolicy";
import { leaveBalanceService } from "../../services/leaveBalanceService";
import { generateEmployeeId } from "../../utils/employeeUtils";

export function AttendancePenaltyManagement() {
  const { currentUser } = useRole();
  const isHR = currentUser.role === "HR Manager" || currentUser.role === "Super Admin";
  const employeeId = generateEmployeeId(currentUser.role);

  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [violations, setViolations] = useState<AttendanceViolation[]>([]);
  const [selectedViolation, setSelectedViolation] =
    useState<AttendanceViolation | null>(null);
  const [showWaiverForm, setShowWaiverForm] = useState(false);
  const [waiverReason, setWaiverReason] = useState("");

  useEffect(() => {
    loadViolations();
  }, [currentMonth]);

  const loadViolations = () => {
    if (isHR) {
      // HR sees all violations
      setViolations(
        attendancePenaltyService.getAllViolations({
          fromDate: `${currentMonth}-01`,
          toDate: `${currentMonth}-31`,
        })
      );
    } else {
      // Employee sees only their violations
      setViolations(
        attendancePenaltyService.getEmployeeViolations(employeeId, currentMonth)
      );
    }
  };

  const handleWaiver = () => {
    if (!selectedViolation || !waiverReason.trim()) {
      toast.error("Please enter a waiver reason");
      return;
    }

    const result = attendancePenaltyService.waiverPenalty(
      selectedViolation.id,
      currentUser.name,
      waiverReason
    );

    if (result.success) {
      toast.success(`✅ ${result.message}`);
      loadViolations();
      setShowWaiverForm(false);
      setSelectedViolation(null);
      setWaiverReason("");
    } else {
      toast.info(`❌ ${result.message}`);
    }
  };

  const employeeBalance = leaveBalanceService.getEmployeeBalance(employeeId);
  const adjustments = attendancePenaltyService.getPLAdjustments(
    employeeId,
    currentMonth
  );
  const lwpPenalties = attendancePenaltyService.getLWPPenalties(
    employeeId,
    currentMonth
  );
  const stats = attendancePenaltyService.getViolationStats({
    employeeId: isHR ? undefined : employeeId,
    month: currentMonth,
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold mt-2">
            {isHR ? "Attendance Penalties Management" : "My Attendance Penalties"}
          </h1>
          <p className="text-sm text-gray-600">
            System-enforced PLRG/HPLRG adjustments for attendance violations
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Violations</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.totalViolations}
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">PLRG (Full Day)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.byPenalty.PLRG}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  = {stats.byPenalty.PLRG * 1} days
                </p>
              </div>
              <XCircle className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">HPLRG (Half Day)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.byPenalty.HPLRG}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  = {stats.byPenalty.HPLRG * 0.5} days
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Deducted</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalPenaltyDays}
                </p>
                <p className="text-xs text-gray-500 mt-1">Days from PL</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PL Adjustments Summary */}
      {adjustments.totalDeducted > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              PL Balance Adjustments This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">PLRG Deductions:</span>
                <span className="font-semibold text-red-600">
                  -{adjustments.plrgCount} × 1 = -{adjustments.plrgCount} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">
                  HPLRG Deductions:
                </span>
                <span className="font-semibold text-orange-600">
                  -{adjustments.hplrgCount} × 0.5 = -
                  {adjustments.hplrgCount * 0.5} days
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Total Deducted:
                </span>
                <span className="font-bold text-red-700">
                  -{adjustments.totalDeducted} days
                </span>
              </div>
              {employeeBalance && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                  <p className="text-sm text-gray-600">Current PL Balance:</p>
                  <p className="text-lg font-bold text-gray-900">
                    {employeeBalance.balances.PL?.available || 0} days
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LWP Conversions */}
      {lwpPenalties.count > 0 && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              LWP Conversions (Insufficient PL Balance)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">
                  Penalties Converted to LWP:
                </span>
                <span className="font-semibold text-red-600">
                  {lwpPenalties.count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Total LWP Days:</span>
                <span className="font-semibold text-red-600">
                  {lwpPenalties.totalDays} days
                </span>
              </div>
              <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                <p className="text-xs text-red-700 font-semibold">
                  ⚠️ Salary Deduction Applied
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  These penalties were converted to LWP because your PL balance
                  was insufficient. Salary deduction will be applied in payroll.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Attendance Penalty Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ATTENDANCE_PENALTY_RULES.map((rule, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {getViolationDescription(rule.violationType)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {rule.description}
                    </p>
                  </div>
                  <Badge
                    variant={rule.penaltyType === "PLRG" ? "destructive" : "default"}
                    className="ml-2"
                  >
                    {getPenaltyTypeDisplay(rule.penaltyType)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              📌 Important Notes:
            </p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>
                Grace Period: Up to{" "}
                {ATTENDANCE_POLICY_CONFIG.lateComing.gracePeriodMinutes} minutes
                is allowed
              </li>
              <li>
                Late marks count resets every{" "}
                {ATTENDANCE_PENALTY_RULES[0].resetPeriod.toLowerCase()}
              </li>
              <li>
                If PL balance is insufficient, penalty converts to LWP with
                salary deduction
              </li>
              {isHR && <li>HR can waive penalties with proper justification</li>}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {isHR ? "All Violations" : "My Violations"} - {currentMonth}
            </CardTitle>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No violations recorded for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((violation) => (
                <div
                  key={violation.id}
                  className={`p-4 rounded-lg border-2 ${
                    violation.status === "Applied"
                      ? "bg-red-50 border-red-200"
                      : violation.status === "Waived"
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            violation.status === "Applied"
                              ? "destructive"
                              : violation.status === "Waived"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {violation.status}
                        </Badge>
                        <Badge variant="outline">{violation.id}</Badge>
                        {isHR && (
                          <span className="text-xs text-gray-600">
                            {violation.employeeName}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-gray-900">
                        {getViolationDescription(violation.violationType)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {violation.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Date: {violation.date}
                      </p>

                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-gray-600">Penalty: </span>
                          <span className="font-semibold text-red-600">
                            {getPenaltyTypeDisplay(violation.penaltyApplied)} (
                            {violation.penaltyDays} days)
                          </span>
                        </div>
                        {violation.convertedToLWP && (
                          <Badge variant="destructive" className="text-xs">
                            Converted to LWP
                          </Badge>
                        )}
                      </div>

                      {!violation.convertedToLWP && (
                        <div className="mt-2 text-xs text-gray-600">
                          PL Balance: {violation.plBalanceBefore} →{" "}
                          {violation.plBalanceAfter} days
                        </div>
                      )}

                      {violation.status === "Waived" && (
                        <div className="mt-3 p-2 bg-green-100 rounded border border-green-200">
                          <p className="text-xs text-green-800">
                            <strong>Waived by:</strong> {violation.waivedBy} on{" "}
                            {violation.waivedOn}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            <strong>Reason:</strong> {violation.waiverReason}
                          </p>
                        </div>
                      )}

                      {violation.hrNotes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-blue-800">
                            <strong>HR Notes:</strong> {violation.hrNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {isHR && violation.status === "Applied" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-4"
                        onClick={() => {
                          setSelectedViolation(violation);
                          setShowWaiverForm(true);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Waive
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiver Form (HR Only) */}
      {showWaiverForm && selectedViolation && (
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="text-base">
              Waive Penalty: {selectedViolation.id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Employee:</strong> {selectedViolation.employeeName}
                </p>
                <p className="text-sm">
                  <strong>Violation:</strong>{" "}
                  {getViolationDescription(selectedViolation.violationType)}
                </p>
                <p className="text-sm">
                  <strong>Penalty:</strong>{" "}
                  {getPenaltyTypeDisplay(selectedViolation.penaltyApplied)} (
                  {selectedViolation.penaltyDays} days)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Waiver Reason *
                </label>
                <textarea
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Enter detailed reason for waiving this penalty..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowWaiverForm(false);
                    setSelectedViolation(null);
                    setWaiverReason("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleWaiver} className="bg-blue-600">
                  Confirm Waiver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
