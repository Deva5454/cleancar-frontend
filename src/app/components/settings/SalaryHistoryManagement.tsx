import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Users,
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  SALARY_HISTORY,
  getCurrentSalary,
  getSalaryHistory,
} from "../../data/equipmentSalaryHistoryData";
import { AddSalaryRevisionDialog } from "./AddSalaryRevisionDialog";
import { logger } from "../../services/logger";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

// Mock employee data
const EMPLOYEES = [
  { id: "washer-001", name: "Suresh Kumar", role: "Washer", city: "Mumbai" },
  { id: "washer-002", name: "Ramesh Patel", role: "Washer", city: "Mumbai" },
  { id: "washer-003", name: "Dinesh Sharma", role: "Washer", city: "Surat" },
  { id: "washer-004", name: "Vijay Singh", role: "Senior Washer", city: "Ahmedabad" },
  { id: "supervisor-001", name: "Karthik Menon", role: "Supervisor", city: "Mumbai" },
];

export function SalaryHistoryManagement() {
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const handleAddRevision = (data: any) => {
    logger.log("Salary revision:", data);
    toast.success("Salary revision added successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Salary History & Manpower
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Track salary revisions and manpower cost changes over time
          </p>
        </div>
        <Button
          onClick={() => setShowAddRevision(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Salary Revision
        </Button>
      </div>

      {/* Employee Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee Salary Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {EMPLOYEES.map((employee) => {
              const currentSalary = getCurrentSalary(employee.id);
              const salaryHistory = getSalaryHistory(employee.id);
              const isExpanded = expandedEmployee === employee.id;

              return (
                <Collapsible
                  key={employee.id}
                  open={isExpanded}
                  onOpenChange={(open) =>
                    setExpandedEmployee(open ? employee.id : null)
                  }
                >
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Employee Header Row */}
                    <div className="bg-gray-50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div>
                          <div className="font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.role} — {employee.city}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">
                            Current Salary
                          </div>
                          <div className="text-xl font-bold text-green-600">
                            ₹{currentSalary.toLocaleString()}
                            <span className="text-xs font-normal text-gray-600 ml-1">
                              /month
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Revisions</div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {salaryHistory.length} changes
                          </Badge>
                        </div>

                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Hide History
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                View History
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>

                    {/* Salary History Table */}
                    <CollapsibleContent>
                      <div className="p-4 bg-white">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">
                                Effective Date
                              </TableHead>
                              <TableHead className="font-semibold">
                                Monthly Salary
                              </TableHead>
                              <TableHead className="font-semibold">Change</TableHead>
                              <TableHead className="font-semibold">Reason</TableHead>
                              <TableHead className="font-semibold">Reference</TableHead>
                              <TableHead className="font-semibold">
                                Approved By
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salaryHistory.map((record, index) => {
                              const isLatest = index === 0;
                              const previousSalary =
                                index < salaryHistory.length - 1
                                  ? salaryHistory[index + 1].monthlyGrossSalary
                                  : null;
                              const salaryChange = previousSalary
                                ? record.monthlyGrossSalary - previousSalary
                                : null;
                              const salaryChangePercent =
                                previousSalary && salaryChange !== null
                                  ? (salaryChange / previousSalary) * 100
                                  : null;

                              return (
                                <TableRow
                                  key={record.id}
                                  className={
                                    isLatest
                                      ? "bg-green-50 border-l-4 border-l-green-500"
                                      : ""
                                  }
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      <div>
                                        <div className="text-sm font-medium">
                                          {format(
                                            new Date(record.effectiveDate),
                                            "dd MMM yyyy"
                                          )}
                                        </div>
                                        {isLatest && (
                                          <div className="text-xs text-green-600 font-medium">
                                            Current Active
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="text-base font-bold text-gray-900">
                                      ₹{record.monthlyGrossSalary.toLocaleString()}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    {salaryChange !== null &&
                                    salaryChangePercent !== null ? (
                                      <div className="text-sm font-medium flex items-center gap-1 text-green-600">
                                        <TrendingUp className="w-3 h-3" />
                                        <div>
                                          +{salaryChangePercent.toFixed(1)}%
                                          <div className="text-xs text-gray-500">
                                            (+₹{salaryChange.toLocaleString()})
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-gray-500"
                                      >
                                        Initial
                                      </Badge>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        record.reason === "Joining Salary"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : record.reason === "Annual Increment"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : record.reason === "Promotion"
                                          ? "bg-purple-50 text-purple-700 border-purple-200"
                                          : "bg-gray-50 text-gray-700 border-gray-200"
                                      }
                                    >
                                      {record.reason}
                                    </Badge>
                                  </TableCell>

                                  <TableCell>
                                    {record.reference ? (
                                      <div className="text-sm text-gray-600">
                                        {record.reference}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                    {record.notes && (
                                      <div className="text-xs text-gray-500 mt-1 italic">
                                        {record.notes}
                                      </div>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <div className="text-sm text-gray-700">
                                      {record.approvedBy}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Total Employees</div>
              <div className="text-2xl font-bold text-gray-900">
                {EMPLOYEES.length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-xs text-green-700 mb-1">Total Revisions</div>
              <div className="text-2xl font-bold text-green-600">
                {SALARY_HISTORY.length}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-700 mb-1">Avg Current Salary</div>
              <div className="text-xl font-bold text-blue-600">
                ₹
                {Math.round(
                  EMPLOYEES.reduce(
                    (sum, emp) => sum + getCurrentSalary(emp.id),
                    0
                  ) / EMPLOYEES.length
                ).toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-xs text-purple-700 mb-1">Monthly Payroll</div>
              <div className="text-xl font-bold text-purple-600">
                ₹
                {EMPLOYEES.reduce(
                  (sum, emp) => sum + getCurrentSalary(emp.id),
                  0
                ).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Salary Revision Dialog */}
      <AddSalaryRevisionDialog
        open={showAddRevision}
        onOpenChange={setShowAddRevision}
        employees={EMPLOYEES}
        onSave={handleAddRevision}
      />
    </div>
  );
}
