// Dashboard for Accounts role
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DollarSign, CheckCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { MASTER_KPI_DATA, MASTER_APPROVALS } from "../../data/masterData";
import { toast } from "sonner";

export function FinanceDashboard() {
  // Payroll data from centralized source
  const payroll = [
    { id: 1, employee: "Suresh Kumar", role: "Car Washer", baseSalary: 15000, adhocEarnings: 1400, deductions: 400, netSalary: 16000, status: "Approved", month: "Mar 2026" },
    { id: 2, employee: "Ramesh K.", role: "Car Washer", baseSalary: 15000, adhocEarnings: 1000, deductions: 0, netSalary: 16000, status: "Approved", month: "Mar 2026" },
    { id: 3, employee: "Mahesh S.", role: "Car Washer", baseSalary: 15000, adhocEarnings: 600, deductions: 0, netSalary: 15600, status: "Approved", month: "Mar 2026" },
    { id: 4, employee: "Ramesh Patel", role: "Supervisor", baseSalary: 25000, adhocEarnings: 2000, deductions: 500, netSalary: 26500, status: "Pending", month: "Mar 2026" },
  ];

  // Cash deposits from centralized approvals data
  const cashDeposits = MASTER_APPROVALS
    .filter(approval => approval.type === "Cash Collection" && approval.status === "Pending")
    .map(approval => ({
      supervisor: approval.requesterName,
      amount: approval.amount || 0,
      status: approval.status,
    }));

  const stats = {
    pendingPayroll: payroll.filter(p => p.status === "Pending").length,
    monthlyPayroll: payroll.reduce((sum, p) => sum + p.netSalary, 0),
    cashPending: cashDeposits.reduce((sum, d) => sum + d.amount, 0),
    vendorPayables: Math.round(MASTER_KPI_DATA.monthlyRevenue * 0.15), // 15% of revenue as vendor payables
    approvedToday: payroll.filter(p => p.status === "Approved").length,
  };

  const handleApprovePayroll = (employeeName: string) => {
    toast.success(`Payroll approved for ${employeeName}`);
  };

  const handleVerifyDeposit = (supervisorName: string, amount: number) => {
    toast.success(`Cash deposit of ₹${amount.toLocaleString()} from ${supervisorName} verified`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Finance Control Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Manage payments and approvals</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          {stats.pendingPayroll} Pending Approvals
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingPayroll}</p>
              <p className="text-xs text-gray-500">Payroll Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">₹{(stats.monthlyPayroll / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Monthly Payroll</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">₹{(stats.cashPending / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Cash Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-red-50 text-red-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">₹{(stats.vendorPayables / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Vendor Payables</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.approvedToday}</p>
              <p className="text-xs text-gray-500">Approved Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payroll Approvals */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Pending Payroll Approvals</h3>
          <div className="space-y-3">
            {payroll.filter(p => p.status === "Pending").map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{record.employee}</p>
                  <p className="text-sm text-gray-600">{record.role} • {record.month}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-600">Base: ₹{record.baseSalary.toLocaleString()}</span>
                    <span className="text-green-600">+₹{record.adhocEarnings.toLocaleString()}</span>
                    <span className="text-red-600">-₹{record.deductions.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Net Salary</p>
                    <p className="text-xl font-bold">₹{record.netSalary.toLocaleString()}</p>
                  </div>
                  <Button size="sm" onClick={() => handleApprovePayroll(record.employee)}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Deposit Verification */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Cash Deposit Verification</h3>
          <div className="space-y-3">
            {cashDeposits.map((deposit, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div>
                  <p className="font-medium">{deposit.supervisor}</p>
                  <p className="text-sm text-gray-600">Cash collection pending deposit</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p className="text-2xl font-bold">₹{deposit.amount.toLocaleString()}</p>
                  <Button size="sm" onClick={() => handleVerifyDeposit(deposit.supervisor, deposit.amount)}>Verify Deposit</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}