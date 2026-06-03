/**
 * Other Earnings Module
 * HR interface for managing ad-hoc earnings added to employee payroll
 */

import { useState, useEffect } from "react";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useRole } from "../../contexts/RoleContext";
import { otherAdjustmentsService, EARNING_CATEGORIES, type OtherAdjustment } from "../../services/otherAdjustmentsService";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import {
  PlusCircle,
  CheckCircle,
  XCircle,
  Search,
  Download,
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";

type TabType = "add" | "approvals" | "records";

export function OtherEarningsModule() {
  const { employees } = useEmployee();
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<TabType>("add");
  const [allEarnings, setAllEarnings] = useState<OtherAdjustment[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState<OtherAdjustment[]>([]);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [payrollMonth, setPayrollMonth] = useState("");
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Filters for records tab
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Rejection state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadData();
    // Set default month to current month
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    setPayrollMonth(currentMonth);
  }, []);

  const loadData = () => {
    const earnings = otherAdjustmentsService.getAllEarnings();
    setAllEarnings(earnings);
    const pending = earnings.filter(e => e.status === "Pending");
    setPendingEarnings(pending);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !payrollMonth || !category || !amount || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) {
      toast.error("Employee not found");
      return;
    }

    const finalCategory = category === "Other" ? customCategory : category;
    if (category === "Other" && !customCategory) {
      toast.error("Please specify the category");
      return;
    }

    const earning = otherAdjustmentsService.create({
      type: "OtherEarning",
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: employee.role,
      city: employee.city || "Unknown",
      amount: parseFloat(amount),
      reason,
      category: finalCategory,
      payrollMonth: `${payrollMonth} ${payrollYear}`,
      payrollYear,
      createdBy: currentUser?.name || "HR Manager",
    });

    toast.success(
      `₹${parseFloat(amount).toLocaleString()} other earning added for ${employee.name} — ${payrollMonth} ${payrollYear}. Pending approval.`
    );

    // Reset form
    setSelectedEmployee("");
    setCategory("");
    setCustomCategory("");
    setAmount("");
    setReason("");
    setEmployeeSearch("");
    loadData();
  };

  const handleApprove = (id: string) => {
    otherAdjustmentsService.approve(id, currentUser?.name || "HR Manager");
    toast.success("Earning approved successfully");
    loadData();
  };

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    otherAdjustmentsService.reject(id, rejectionReason);
    toast.success("Earning rejected");
    setRejectingId(null);
    setRejectionReason("");
    loadData();
  };

  const exportToCSV = () => {
    const filtered = getFilteredRecords();
    const headers = [
      "ID", "Employee ID", "Employee Name", "Role", "City", "Category",
      "Amount", "Payroll Month", "Status", "Reason", "Created By",
      "Created At", "Approved By", "Approved At", "Applied In Payroll Run"
    ];

    const rows = filtered.map(e => [
      e.id,
      e.employeeId,
      e.employeeName,
      e.employeeRole,
      e.city,
      e.category,
      e.amount,
      e.payrollMonth,
      e.status,
      e.reason,
      e.createdBy,
      e.createdAt,
      e.approvedBy || "",
      e.approvedAt || "",
      e.appliedInPayrollRunId || "",
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `other-earnings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info("Export feature coming in Phase 2.");
  };

  const getFilteredRecords = () => {
    return allEarnings.filter(e => {
      if (filterEmployee && !e.employeeName.toLowerCase().includes(filterEmployee.toLowerCase()) &&
          !e.employeeId.toLowerCase().includes(filterEmployee.toLowerCase())) {
        return false;
      }
      if (filterMonth && !e.payrollMonth.includes(filterMonth)) return false;
      if (filterCategory && e.category !== filterCategory) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    });
  };

  const filteredEmployees = employees.filter(emp =>
    employeeSearch === "" ||
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.id.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const selectedEmp = employees.find(emp => emp.id === selectedEmployee);

  const totalPendingAmount = pendingEarnings.reduce((sum, e) => sum + e.amount, 0);
  const filteredRecords = getFilteredRecords();
  const totalRecordsAmount = filteredRecords.reduce((sum, e) => sum + e.amount, 0);
  const affectedEmployees = new Set(filteredRecords.map(e => e.employeeId)).size;
  const largestEntry = filteredRecords.length > 0
    ? Math.max(...filteredRecords.map(e => e.amount))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Other Earnings</h1>
          <p className="text-sm text-gray-600 mt-2">
            Manage ad-hoc earnings added to employee payroll
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-900">
                Other earnings entered here are added to the employee's net pay during the monthly payroll run.
                They require HR approval before they are included.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("add")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "add"
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Add Earning
                </div>
              </button>

              <button
                onClick={() => setActiveTab("approvals")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "approvals"
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Pending Approvals
                  {pendingEarnings.length > 0 && (
                    <Badge className="bg-amber-600">{pendingEarnings.length}</Badge>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("records")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "records"
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  All Records
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "add" && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Selection */}
                <div>
                  <Label htmlFor="employee-search">Employee *</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="employee-search"
                      placeholder="Search by name or ID..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {employeeSearch && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {filteredEmployees.slice(0, 10).map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployee(emp.id);
                            setEmployeeSearch(emp.name);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-600">
                            {emp.id} • {emp.role} • {emp.city}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payroll Month */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payroll-month">Payroll Month *</Label>
                    <select
                      id="payroll-month"
                      value={payrollMonth}
                      onChange={(e) => setPayrollMonth(e.target.value)}
                      className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select month</option>
                      {["January", "February", "March", "April", "May", "June", "July",
                        "August", "September", "October", "November", "December"].map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="payroll-year">Payroll Year *</Label>
                    <Input
                      id="payroll-year"
                      type="number"
                      value={payrollYear}
                      onChange={(e) => setPayrollYear(parseInt(e.target.value))}
                      className="mt-2"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select category</option>
                    {EARNING_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {category === "Other" && (
                    <Input
                      placeholder="Specify category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2"
                      required
                    />
                  )}
                </div>

                {/* Amount */}
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-2"
                    required
                  />
                  {selectedEmp && amount && parseFloat(amount) > 0 && (
                    <p className="text-sm text-teal-600 mt-2">
                      This amount will be added to {selectedEmp.name}'s net pay for {payrollMonth} {payrollYear}.
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        setReason(e.target.value);
                      }
                    }}
                    placeholder="Enter reason for this earning"
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {reason.length}/200 characters
                  </p>
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add to Payroll
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "approvals" && (
          <>
            {/* KPI Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card className="border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Pending Count</p>
                      <p className="text-3xl font-bold text-amber-600">{pendingEarnings.length}</p>
                    </div>
                    <Users className="w-10 h-10 text-amber-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-teal-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Pending Amount</p>
                      <p className="text-2xl font-bold text-teal-600">
                        ₹{totalPendingAmount.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-teal-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Approvals Table */}
            <Card>
              <CardContent className="p-6">
                {pendingEarnings.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                    <p className="text-gray-600">No pending approvals</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payroll Month</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reason</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Added By</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingEarnings.map((earning) => (
                          <tr key={earning.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{earning.employeeName}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.employeeId}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.employeeRole}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-teal-600">
                              ₹{(earning?.amount ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.category}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.payrollMonth}</td>
                            <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate" title={earning.reason}>
                              {earning.reason}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.createdBy}</td>
                            <td className="py-3 px-4 text-sm text-right">
                              {rejectingId === earning.id ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <Input
                                    placeholder="Rejection reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-48 text-xs"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(earning.id)}
                                    className="text-red-600"
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectionReason("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(earning.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRejectingId(earning.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "records" && (
          <>
            {/* Filter Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-4 gap-4">
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
                    <Label htmlFor="filter-month" className="text-xs">Month</Label>
                    <Input
                      id="filter-month"
                      placeholder="e.g. April 2026"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter-category" className="text-xs">Category</Label>
                    <select
                      id="filter-category"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">All</option>
                      {EARNING_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
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
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-teal-600">₹{totalRecordsAmount.toLocaleString()}</p>
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

            {/* Export Button */}
            <div className="mb-4 flex justify-end">
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Records Table */}
            <Card>
              <CardContent className="p-6">
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No records found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created By</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Approved By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((earning) => (
                          <tr
                            key={earning.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              earning.status === "Pending" ? "bg-amber-50" :
                              earning.status === "Approved" ? "bg-green-50" :
                              earning.status === "Rejected" ? "bg-red-50" :
                              earning.status === "Applied" ? "bg-blue-50" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-sm text-gray-700 font-mono">{earning.id}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{earning.employeeName}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.employeeRole}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-teal-600">
                              ₹{(earning?.amount ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.category}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.payrollMonth}</td>
                            <td className="py-3 px-4 text-sm">
                              <Badge className={
                                earning.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                earning.status === "Approved" ? "bg-green-100 text-green-700" :
                                earning.status === "Rejected" ? "bg-red-100 text-red-700" :
                                "bg-blue-100 text-blue-700"
                              }>
                                {earning.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.createdBy}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{earning.approvedBy || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
