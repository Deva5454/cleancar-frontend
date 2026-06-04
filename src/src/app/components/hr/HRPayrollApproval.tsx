import { BackButton } from "../ui/back-button";
/**
 * HR Payroll Approval Screen
 *
 * Shows snapshot data only (no live calculation)
 * Action: Send to Super Admin
 *
 * @component
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Database, Users, Send, CheckCircle, Calendar, DollarSign, UserCheck } from "lucide-react";
import { PayrollSnapshotView, type PayrollSnapshot } from "../payroll/PayrollSnapshot";
import { toast } from "sonner";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
import { offerLetterService } from "../../services/offerLetterService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useCity } from "../../contexts/CityContext";
import { hasPermission } from "../../utils/permissionEngine";
import { useRole } from "../../contexts/RoleContext";

// Payroll Activation Record
interface PayrollActivationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  confirmationDate: string;
  joiningDate: string;
  salaryStartDate: string;
  revisedEffectiveDate?: string; // Only if salary revision at confirmation
  monthlyGross: number;
  salaryStructureId?: string;
  status: "Pending Activation" | "Activated";
  activatedBy?: string;
  activatedOn?: string;
}

// Mock snapshot data
const getMockSnapshot = (cityName: string): PayrollSnapshot => ({
  id: "SNAP-2026-04-001",
  month: "April",
  year: "2026",
  city: cityName,
  cluster: "Adajan",
  status: "pending_hr",
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
});

export function HRPayrollApproval() {
  const { city, cityInfo } = useCity();
  const { currentUser } = useRole();
  const canApprove = hasPermission(currentUser, "payroll", "approve");
  const [snapshot, setSnapshot] = useState<PayrollSnapshot>(() => getMockSnapshot(cityInfo.displayName));
  const [payrollActivations, setPayrollActivations] = useState<PayrollActivationRecord[]>([]);

  // Load employees who need payroll activation (confirmed but not yet activated)
  useEffect(() => {
    const loadPayrollActivations = () => {
      const employees = employeeDatabaseService.getAll();
      const allOffers = offerLetterService.getAll();

      // Find employees with confirmationDate but no payroll activation yet
      const activationsNeeded = employees
        .filter(emp => emp.confirmationDate && emp.status === "Active")
        .map(emp => {
          // Find the employee's accepted offer letter to get salary structure
          const acceptedOffer = allOffers.find(
            offer =>
              (offer.employeeTempId === emp.tempId || offer.employeeTempId === emp.id) &&
              offer.status === "Accepted"
          );

          return {
            id: `PAYROLL-ACT-${emp.id}`,
            employeeId: emp.id,
            employeeName: emp.fullName,
            designation: emp.designation,
            confirmationDate: emp.confirmationDate!,
            joiningDate: emp.dateOfJoining,
            salaryStartDate: emp.dateOfJoining,
            // For now, assume no salary revision at confirmation
            // In production, this would check if salary changed between offer and confirmation
            revisedEffectiveDate: undefined,
            monthlyGross: acceptedOffer?.salaryComponents.monthlyGross || 0,
            salaryStructureId: acceptedOffer?.salaryStructureId,
            status: "Pending Activation" as const,
          };
        });

      // Filter out already activated employees (keep only those not in the activated state)
      setPayrollActivations(prev => {
        const activatedIds = prev.filter(p => p.status === "Activated").map(p => p.employeeId);
        const newRecords = activationsNeeded.filter(record => !activatedIds.includes(record.employeeId));
        const stillActivated = prev.filter(p => p.status === "Activated");
        return [...newRecords, ...stillActivated];
      });
    };

    loadPayrollActivations();

    // Subscribe to employee database changes
    const unsubscribe = employeeDatabaseService.subscribe(() => {
      loadPayrollActivations();
    });

    return unsubscribe;
  }, []);

  const handleActivatePayroll = (record: PayrollActivationRecord) => {
    const today = new Date().toISOString().split("T")[0];

    // Update the record to Activated status
    const updatedActivations = payrollActivations.map(activation =>
      activation.id === record.id
        ? {
            ...activation,
            status: "Activated" as const,
            activatedBy: "HR Manager",
            activatedOn: today,
          }
        : activation
    );

    setPayrollActivations(updatedActivations);

    toast.success(
      `Payroll activated for ${record.employeeName} — effective ${record.confirmationDate}`,
      {
        description: `Salary structure will be applied starting from ${new Date(record.confirmationDate).toLocaleDateString("en-IN")}`,
      }
    );
  };

  const handleSendToAdmin = () => {
    // In production: await payrollSnapshotService.sendToAdmin(snapshot.id)

    setSnapshot({
      ...snapshot,
      status: "pending_admin",
      sentToAdminAt: new Date().toLocaleString(),
      sentToAdminBy: "HR Manager",
    });

    toast.success("Payroll snapshot sent to Super Admin for approval");
  };

  return (
    <div className="space-y-6 p-6">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Payroll Approval</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review payroll snapshot and send to Super Admin
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm">HR View</span>
        </Badge>
      </div>

      {/* Payroll Activation Queue */}
      {payrollActivations.filter(a => a.status === "Pending Activation").length > 0 && (
        <Card className="border-2 border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <UserCheck className="w-5 h-5" />
              Payroll Activation Queue
              <Badge className="bg-green-600 text-white ml-2">
                {payrollActivations.filter(a => a.status === "Pending Activation").length} Pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[800px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Salary Details</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {payrollActivations
                  .filter(activation => activation.status === "Pending Activation")
                  .map(activation => (
                    <TableRow key={activation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{activation.employeeName}</p>
                          <p className="text-xs text-gray-500">{activation.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{activation.designation}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-medium">
                              ₹{(activation?.monthlyGross ?? 0).toLocaleString()}/month
                            </span>
                          </div>
                          {activation.salaryStructureId && (
                            <p className="text-xs text-gray-500">
                              Structure: {activation.salaryStructureId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span className="font-medium">Salary Start Date:</span>
                            <span>{new Date(activation.salaryStartDate).toLocaleDateString("en-IN")}</span>
                          </div>
                          {activation.revisedEffectiveDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-green-600" />
                              <span className="font-medium">Revised Effective Date:</span>
                              <span>{new Date(activation.revisedEffectiveDate).toLocaleDateString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className="bg-orange-100 text-orange-800">
                            {activation.status}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">
                            Confirmation letter issued — activate payroll
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {canApprove && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleActivatePayroll(activation)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activate Payroll
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Snapshot Data (No Live Calculation)</p>
          <p className="text-xs text-blue-700">
            Viewing payroll snapshot generated by payrollEngine • Values are read-only
          </p>
        </div>
      </div>

      {/* Snapshot View */}
      <PayrollSnapshotView
        snapshot={snapshot}
        onSendToAdmin={handleSendToAdmin}
        viewMode="hr"
      />

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
              <Badge className={snapshot.status === "pending_hr" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                {snapshot.status === "pending_hr" ? "Pending" : "Completed"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>3</Badge>
              <span className="text-sm">Super Admin approves</span>
              <Badge className="bg-gray-100 text-gray-700">Waiting</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge>4</Badge>
              <span className="text-sm">Accounts processes payment</span>
              <Badge className="bg-gray-100 text-gray-700">Waiting</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
