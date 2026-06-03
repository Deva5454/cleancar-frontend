import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown, Users, DollarSign, Award, AlertCircle } from "lucide-react";

export function PayrollDashboard() {
  const monthlyData = {
    currentMonth: "March 2026",
    totalPayroll: 3118000,
    totalEmployees: 127,
    fixedSalary: 2850000,
    incentives: 485000,
    bonuses: 125000,
    deductions: 342000,
    changeVsLastMonth: 2.5,
  };

  const departmentBreakdown = [
    { department: "Operations", employees: 45, amount: 985000, percentage: 31.6 },
    { department: "Sales", employees: 32, amount: 1125000, percentage: 36.1 },
    { department: "Technology", employees: 18, amount: 645000, percentage: 20.7 },
    { department: "Admin & HR", employees: 12, amount: 215000, percentage: 6.9 },
    { department: "Support", employees: 20, amount: 148000, percentage: 4.7 },
  ];

  const topEarners = [
    { name: "Vikram Patel", role: "City Manager", amount: 116000 },
    { name: "Anjali Mehta", role: "Tech Lead", amount: 95000 },
    { name: "Suresh Kumar", role: "Sales Manager", amount: 88000 },
    { name: "Priya Singh", role: "Cluster Manager", amount: 72000 },
    { name: "Rahul Sharma", role: "Operations Head", amount: 68000 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payroll Dashboard - {monthlyData.currentMonth}</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Payroll</p>
                <p className="text-3xl font-bold text-blue-900">
                  ₹{(monthlyData.totalPayroll / 100000).toFixed(2)}L
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    +{monthlyData.changeVsLastMonth}% vs last month
                  </span>
                </div>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-purple-700 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-purple-900">{monthlyData.totalEmployees}</p>
                <p className="text-sm text-purple-600 mt-2">Active in payroll</p>
              </div>
              <Users className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-700 mb-1">Incentives Paid</p>
                <p className="text-3xl font-bold text-green-900">
                  ₹{(monthlyData.incentives / 100000).toFixed(2)}L
                </p>
                <p className="text-sm text-green-600 mt-2">
                  {((monthlyData.incentives / monthlyData.totalPayroll) * 100).toFixed(1)}% of payroll
                </p>
              </div>
              <Award className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-orange-700 mb-1">Total Deductions</p>
                <p className="text-3xl font-bold text-orange-900">
                  ₹{(monthlyData.deductions / 100000).toFixed(2)}L
                </p>
                <p className="text-sm text-orange-600 mt-2">PF, ESI, Tax</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Payroll Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentBreakdown.map((dept) => (
              <div key={dept.department}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-medium">{dept.department}</span>
                    <Badge variant="outline">{dept.employees} employees</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{(dept.amount / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500">{dept.percentage}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Earners */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Earners - {monthlyData.currentMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topEarners.map((earner, index) => (
              <div key={earner.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{earner.name}</p>
                    <p className="text-sm text-gray-600">{earner.role}</p>
                  </div>
                </div>
                <p className="font-bold text-blue-600">₹{(earner?.amount ?? 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payroll Composition */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Fixed Salary</p>
              <p className="text-2xl font-bold text-blue-900">
                ₹{(monthlyData.fixedSalary / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {((monthlyData.fixedSalary / monthlyData.totalPayroll) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Incentives</p>
              <p className="text-2xl font-bold text-purple-900">
                ₹{(monthlyData.incentives / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {((monthlyData.incentives / monthlyData.totalPayroll) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Bonuses</p>
              <p className="text-2xl font-bold text-orange-900">
                ₹{(monthlyData.bonuses / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {((monthlyData.bonuses / monthlyData.totalPayroll) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600 mb-1">Deductions</p>
              <p className="text-2xl font-bold text-red-900">
                ₹{(monthlyData.deductions / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-red-600 mt-1">
                {((monthlyData.deductions / monthlyData.totalPayroll) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
