/**
 * Adjustments Report
 * Combined reporting screen for Other Earnings and Other Deductions
 */

import { useState, useEffect } from "react";
import { otherAdjustmentsService, type OtherAdjustment } from "../../services/otherAdjustmentsService";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import {
  FileBarChart,
  Download,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  PlusCircle,
  MinusCircle,
} from "lucide-react";

type TabType = "earnings" | "deductions" | "combined";

export function AdjustmentsReport() {
  const [activeTab, setActiveTab] = useState<TabType>("combined");
  const [allEarnings, setAllEarnings] = useState<OtherAdjustment[]>([]);
  const [allDeductions, setAllDeductions] = useState<OtherAdjustment[]>([]);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const earnings = otherAdjustmentsService.getAllEarnings();
    const deductions = otherAdjustmentsService.getAllDeductions();
    setAllEarnings(earnings);
    setAllDeductions(deductions);
  };

  const getFilteredRecords = (type: "earnings" | "deductions" | "all") => {
    let records: OtherAdjustment[] = [];

    if (type === "earnings") {
      records = allEarnings;
    } else if (type === "deductions") {
      records = allDeductions;
    } else {
      records = [...allEarnings, ...allDeductions];
    }

    return records.filter(r => {
      if (filterEmployee && !r.employeeName.toLowerCase().includes(filterEmployee.toLowerCase()) &&
          !r.employeeId.toLowerCase().includes(filterEmployee.toLowerCase())) {
        return false;
      }
      if (filterMonth && !r.payrollMonth.includes(filterMonth)) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterCity && r.city !== filterCity) return false;
      if (filterRole && r.employeeRole !== filterRole) return false;

      // Time range filter
      if (timeRange !== "all") {
        const recordDate = new Date(r.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

        if (timeRange === "thisMonth" && diffDays > 30) return false;
        if (timeRange === "lastMonth" && (diffDays < 30 || diffDays > 60)) return false;
        if (timeRange === "3months" && diffDays > 90) return false;
        if (timeRange === "6months" && diffDays > 180) return false;
        if (timeRange === "thisFY" && diffDays > 365) return false;
      }

      return true;
    });
  };

  const exportToCSV = (type: "earnings" | "deductions" | "combined") => {
    const filtered = getFilteredRecords(type === "combined" ? "all" : type);
    const headers = [
      "ID", "Type", "Employee ID", "Employee Name", "Role", "City", "Category",
      "Amount", "Payroll Month", "Status", "Reason", "Created By",
      "Created At", "Approved By", "Approved At", "Applied In Payroll Run"
    ];

    const rows = filtered.map(r => [
      r.id,
      r.type === "OtherEarning" ? "Earning" : "Deduction",
      r.employeeId,
      r.employeeName,
      r.employeeRole,
      r.city,
      r.category,
      r.amount,
      r.payrollMonth,
      r.status,
      r.reason,
      r.createdBy,
      r.createdAt,
      r.approvedBy || "",
      r.approvedAt || "",
      r.appliedInPayrollRunId || "",
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const currentRecords = getFilteredRecords(
    activeTab === "earnings" ? "earnings" :
    activeTab === "deductions" ? "deductions" :
    "all"
  );

  const totalAmount = currentRecords.reduce((sum, r) => sum + r.amount, 0);
  const affectedEmployees = new Set(currentRecords.map(r => r.employeeId)).size;
  const largestEntry = currentRecords.length > 0
    ? Math.max(...currentRecords.map(r => r.amount))
    : 0;

  // For combined tab, calculate net impact
  const totalEarnings = currentRecords
    .filter(r => r.type === "OtherEarning")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalDeductions = currentRecords
    .filter(r => r.type === "OtherDeduction")
    .reduce((sum, r) => sum + r.amount, 0);
  const netImpact = totalEarnings - totalDeductions;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Adjustments Report</h1>
          <p className="text-sm text-gray-600 mt-2">
            Comprehensive report of all payroll adjustments
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("earnings")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "earnings"
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Other Earnings
                </div>
              </button>

              <button
                onClick={() => setActiveTab("deductions")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "deductions"
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MinusCircle className="w-4 h-4" />
                  Other Deductions
                </div>
              </button>

              <button
                onClick={() => setActiveTab("combined")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "combined"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileBarChart className="w-4 h-4" />
                  Combined
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="filter-employee" className="text-xs">Employee</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    id="filter-employee"
                    placeholder="Search..."
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="time-range" className="text-xs">Time Range</Label>
                <select
                  id="time-range"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="thisFY">This Financial Year</option>
                </select>
              </div>
              <div>
                <Label htmlFor="filter-status" className="text-xs">Status</Label>
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Applied">Applied</option>
                </select>
              </div>
              <div>
                <Label htmlFor="filter-category" className="text-xs">Category</Label>
                <Input
                  id="filter-category"
                  placeholder="Any category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="filter-city" className="text-xs">City</Label>
                <Input
                  id="filter-city"
                  placeholder="Any city"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="filter-role" className="text-xs">Role</Label>
                <Input
                  id="filter-role"
                  placeholder="Any role"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {activeTab === "combined" ? (
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{currentRecords.length}</p>
              </CardContent>
            </Card>
            <Card className="border-teal-200">
              <CardContent className="p-4">
                <p className="text-xs text-teal-700 mb-1">Total Earnings</p>
                <p className="text-xl font-bold text-teal-600">₹{totalEarnings.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="p-4">
                <p className="text-xs text-amber-700 mb-1">Total Deductions</p>
                <p className="text-xl font-bold text-amber-600">₹{totalDeductions.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className={`border-2 ${netImpact >= 0 ? "border-green-300" : "border-red-300"}`}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Net Impact</p>
                <p className={`text-xl font-bold ${netImpact >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {netImpact >= 0 ? "+" : ""}₹{netImpact.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Employees Affected</p>
                <p className="text-2xl font-bold text-gray-900">{affectedEmployees}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{currentRecords.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                <p className={`text-2xl font-bold ${activeTab === "earnings" ? "text-teal-600" : "text-amber-600"}`}>
                  ₹{totalAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Employees Affected</p>
                <p className="text-2xl font-bold text-gray-900">{affectedEmployees}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Largest Entry</p>
                <p className="text-2xl font-bold text-gray-900">₹{largestEntry.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export Button */}
        <div className="mb-4 flex justify-end">
          <Button onClick={() => exportToCSV(activeTab)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Records Table */}
        <Card>
          <CardContent className="p-6">
            {currentRecords.length === 0 ? (
              <div className="text-center py-12">
                <FileBarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No records found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                      {activeTab === "combined" && (
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">City</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payroll Month</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created By</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Approved By</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Applied In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((record) => (
                      <tr
                        key={record.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          record.status === "Pending" ? "bg-amber-50" :
                          record.status === "Approved" ? "bg-green-50" :
                          record.status === "Rejected" ? "bg-red-50" :
                          record.status === "Applied" ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-700 font-mono">{record.id}</td>
                        {activeTab === "combined" && (
                          <td className="py-3 px-4 text-sm">
                            <Badge className={
                              record.type === "OtherEarning"
                                ? "bg-teal-100 text-teal-700"
                                : "bg-amber-100 text-amber-700"
                            }>
                              {record.type === "OtherEarning" ? (
                                <><PlusCircle className="w-3 h-3 mr-1 inline" />Earning</>
                              ) : (
                                <><MinusCircle className="w-3 h-3 mr-1 inline" />Deduction</>
                              )}
                            </Badge>
                          </td>
                        )}
                        <td className="py-3 px-4 text-sm text-gray-900">{record.employeeName}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.employeeRole}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.city}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.category}</td>
                        <td className={`py-3 px-4 text-sm text-right font-semibold ${
                          record.type === "OtherEarning" ? "text-teal-600" : "text-amber-600"
                        }`}>
                          {record.type === "OtherEarning" ? "+" : "-"}₹{(record?.amount ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.payrollMonth}</td>
                        <td className="py-3 px-4 text-sm">
                          <Badge className={
                            record.status === "Pending" ? "bg-amber-100 text-amber-700" :
                            record.status === "Approved" ? "bg-green-100 text-green-700" :
                            record.status === "Rejected" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          }>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.createdBy}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{record.approvedBy || "—"}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-mono text-xs">
                          {record.appliedInPayrollRunId || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
