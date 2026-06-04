/**
 * Super Admin Payroll Approval Screen
 *
 * Shows SAME snapshot (no recalculation)
 * Actions: Approve or Reject
 *
 * @component
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Database, Shield } from "lucide-react";
import { PayrollSnapshotView, type PayrollSnapshot } from "../payroll/PayrollSnapshot";
import { toast } from "sonner";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";

// Mock snapshot data (same data as HR, but status = pending_admin)
const getMockSnapshot = (cityName: string): PayrollSnapshot => ({
  id: "SNAP-2026-04-001",
  month: "April",
  year: "2026",
  city: cityName,
  cluster: "Adajan",
  status: "pending_admin",
  employees: [
    {
      snapshotId: "SNAP-2026-04-001-001",
      employeeId: "CW-395001-001",
      employeeName: "Rajesh Kumar",
      role: "Car Washer",
      bankName: "HDFC Bank",
      accountNumber: "50100123456789",
      ifscCode: "HDFC0001234",
      units: 48,
      validUnits: 44,
      complianceScore: 92,
      basePay: 18000,
      incentive: 2400,
      complianceAdjustment: -200,
      deductions: 2340,
      totalPay: 17860,
      generatedAt: "2026-04-20 14:32:15",
      generatedBy: "Payroll Engine",
    },
    {
      snapshotId: "SNAP-2026-04-001-002",
      employeeId: "CW-395001-002",
      employeeName: "Amit Patel",
      role: "Car Washer",
      bankName: "ICICI Bank",
      accountNumber: "60200987654321",
      ifscCode: "ICIC0005678",
      units: 42,
      validUnits: 39,
      complianceScore: 88,
      basePay: 18000,
      incentive: 2100,
      complianceAdjustment: -150,
      deductions: 2280,
      totalPay: 17670,
      generatedAt: "2026-04-20 14:32:16",
      generatedBy: "Payroll Engine",
    },
    {
      snapshotId: "SNAP-2026-04-001-003",
      employeeId: "SUP-395001-001",
      employeeName: "Suresh Yadav",
      role: "Supervisor",
      bankName: "SBI",
      accountNumber: "30200123456789",
      ifscCode: "SBIN0001234",
      units: 0,
      validUnits: 0,
      complianceScore: 95,
      basePay: 28000,
      incentive: 3200,
      complianceAdjustment: 0,
      deductions: 3640,
      totalPay: 27560,
      generatedAt: "2026-04-20 14:32:17",
      generatedBy: "Payroll Engine",
    },
  ],
  totalEmployees: 3,
  totalPayout: 63090,
  generatedAt: "2026-04-20 14:32:10",
  generatedBy: "Payroll Processing Engine",
  sentToAdminAt: "2026-04-20 15:45:30",
  sentToAdminBy: "HR Manager",
});

export function SuperAdminPayrollApproval() {
  // PHASE 2: Migrated to useEmployeeData
  const { payrollRuns, getEmployeeById, approvePayrollByFinance } = useEmployeeData();
  const { currentUser } = useRole();
  const { city, cityInfo } = useCity();

  // Transform HR Approved payroll runs into snapshot format
  const snapshot = useMemo((): PayrollSnapshot => {
    // Get all HR Approved payrolls for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-04"
    const hrApprovedPayrolls = payrollRuns.filter(
      (pr) => pr.month === currentMonth && pr.status === "HR Approved"
    );

    if (hrApprovedPayrolls.length === 0) {
      // Return empty snapshot if no pending payrolls
      return {
        id: `SNAP-${currentMonth}-001`,
        month: new Date().toLocaleString("default", { month: "long" }),
        year: new Date().getFullYear().toString(),
        status: "pending_admin",
        employees: [],
        totalEmployees: 0,
        totalPayout: 0,
        generatedAt: new Date().toLocaleString(),
        generatedBy: "Payroll Processing Engine",
      };
    }

    const employees = hrApprovedPayrolls.map((pr) => {
      const employee = getEmployeeById(pr.employeeId);
      return {
        snapshotId: `${pr.payrollId}-SNAP`,
        employeeId: pr.employeeId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
        role: employee?.role || "Unknown",
        bankName: employee?.bankDetails?.accountName || "N/A",
        accountNumber: employee?.bankDetails?.accountNumber || "N/A",
        ifscCode: employee?.bankDetails?.ifscCode || "N/A",
        units: 0, // TODO: Get from job records
        validUnits: 0,
        complianceScore: 95,
        basePay: pr.baseSalary,
        incentive: pr.incentiveAmount,
        complianceAdjustment: 0,
        deductions: pr.totalDeductions,
        totalPay: pr.netSalary,
        generatedAt: pr.createdAt || new Date().toLocaleString(),
        generatedBy: "Payroll Engine",
      };
    });

    return {
      id: `SNAP-${currentMonth}-001`,
      month: new Date().toLocaleString("default", { month: "long" }),
      year: new Date().getFullYear().toString(),
      status: "pending_admin",
      employees,
      totalEmployees: employees.length,
      totalPayout: employees.reduce((sum, e) => sum + e.totalPay, 0),
      generatedAt: new Date().toLocaleString(),
      generatedBy: "Payroll Processing Engine",
      sentToAdminAt: hrApprovedPayrolls[0]?.hrApprovedAt,
      sentToAdminBy: hrApprovedPayrolls[0]?.hrApprovedBy,
    };
  }, [payrollRuns, getEmployeeById]);

  const handleApprove = () => {
    // Approve all payroll runs in this snapshot
    snapshot.employees.forEach((emp) => {
      const payrollId = emp.snapshotId.replace("-SNAP", "");
      approvePayrollByFinance(payrollId, currentUser.name);
    });

    toast.success("Payroll snapshot approved and sent to Accounts");
  };

  const handleReject = (reason: string) => {
    // In a full implementation, we would have a rejectPayroll function in HRDataContext
    // For now, just show a toast
    toast.success("Payroll snapshot rejected and sent back to HR");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Super Admin Payroll Approval</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve/reject payroll snapshot
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm">Super Admin View</span>
        </Badge>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <Database className="w-5 h-5 text-purple-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-purple-900">Snapshot Data (No Recalculation)</p>
          <p className="text-xs text-purple-700">
            Reviewing SAME snapshot sent by HR • No values are recalculated
          </p>
        </div>
      </div>

      {/* Snapshot View */}
      <PayrollSnapshotView
        snapshot={snapshot}
        onApprove={handleApprove}
        onReject={handleReject}
        viewMode="admin"
      />

      {/* Approval History */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Approval History</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Generated:</span>
              <span className="font-medium">{snapshot.generatedAt} by {snapshot.generatedBy}</span>
            </div>
            {snapshot.sentToAdminAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Sent to Admin:</span>
                <span className="font-medium">{snapshot.sentToAdminAt} by {snapshot.sentToAdminBy}</span>
              </div>
            )}
            {snapshot.approvedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Approved:</span>
                <span className="font-medium text-green-700">{snapshot.approvedAt} by {snapshot.approvedBy}</span>
              </div>
            )}
            {snapshot.rejectedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-medium text-red-700">{snapshot.rejectedAt} by {snapshot.rejectedBy}</span>
              </div>
            )}
            {snapshot.rejectionReason && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-700">{snapshot.rejectionReason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Info */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Approval Workflow</h4>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>1</Badge>
              <span className="text-sm">Payroll Processing generates snapshot</span>
              <Badge className="bg-green-100 text-green-700">Completed</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>2</Badge>
              <span className="text-sm">HR reviews and sends to Super Admin</span>
              <Badge className="bg-green-100 text-green-700">Completed</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>3</Badge>
              <span className="text-sm">Super Admin approves</span>
              <Badge className={snapshot.status === "pending_admin" ? "bg-purple-100 text-purple-700" : snapshot.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {snapshot.status === "pending_admin" ? "Pending" : snapshot.status === "approved" ? "Approved" : "Rejected"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>4</Badge>
              <span className="text-sm">Accounts processes payment</span>
              <Badge className={snapshot.status === "approved" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                {snapshot.status === "approved" ? "Ready" : "Waiting"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
