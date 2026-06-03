import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  LayoutGrid,
  Users,
  FileText,
  Download,
  DollarSign,
  Award,
  TrendingUp,
  Eye,
  BarChart3,
  Calendar,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface Employee {
  id: string;
  name: string;
  empId: string;
  role: string;
  department: string;
  netSalary: number;
  incentive: number;
  status: "Active" | "Inactive";
  joinDate: string;
}

interface TopPerformer {
  id: string;
  name: string;
  empId: string;
  units: number;
  incentive: number;
  rank: number;
}

const EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "Ramesh Kumar",
    empId: "EMP-2024-0042",
    role: "Car Washer",
    department: "Operations",
    netSalary: 31245,
    incentive: 1850,
    status: "Active",
    joinDate: "2024-03-15",
  },
  {
    id: "emp-2",
    name: "Suresh Patel",
    empId: "EMP-2024-0089",
    role: "Car Washer",
    department: "Operations",
    netSalary: 29560,
    incentive: 1625,
    status: "Active",
    joinDate: "2024-02-20",
  },
  {
    id: "emp-3",
    name: "Amit Singh",
    empId: "EMP-2024-0156",
    role: "Supervisor",
    department: "Operations",
    netSalary: 42800,
    incentive: 2400,
    status: "Active",
    joinDate: "2023-11-10",
  },
  {
    id: "emp-4",
    name: "Rajesh Sharma",
    empId: "EMP-2024-0203",
    role: "Car Washer",
    department: "Operations",
    netSalary: 28900,
    incentive: 1450,
    status: "Active",
    joinDate: "2024-04-05",
  },
  {
    id: "emp-5",
    name: "Vijay Gupta",
    empId: "EMP-2024-0187",
    role: "Car Washer",
    department: "Operations",
    netSalary: 30120,
    incentive: 1720,
    status: "Active",
    joinDate: "2024-01-18",
  },
];

const TOP_PERFORMERS: TopPerformer[] = [
  { id: "tp-1", name: "Ramesh Kumar", empId: "EMP-2024-0042", units: 48, incentive: 1850, rank: 1 },
  { id: "tp-2", name: "Amit Singh", empId: "EMP-2024-0156", units: 45, incentive: 2400, rank: 2 },
  { id: "tp-3", name: "Vijay Gupta", empId: "EMP-2024-0187", units: 42, incentive: 1720, rank: 3 },
  { id: "tp-4", name: "Suresh Patel", empId: "EMP-2024-0089", units: 40, incentive: 1625, rank: 4 },
  { id: "tp-5", name: "Rajesh Sharma", empId: "EMP-2024-0203", units: 38, incentive: 1450, rank: 5 },
];

const REPORTS = [
  { id: "rep-1", name: "Monthly Payroll Summary", month: "April 2026", size: "2.4 MB" },
  { id: "rep-2", name: "Incentive Breakdown Report", month: "April 2026", size: "1.8 MB" },
  { id: "rep-3", name: "Employee Attendance Summary", month: "April 2026", size: "892 KB" },
  { id: "rep-4", name: "Tax Deduction Statement", month: "April 2026", size: "1.2 MB" },
];

export function ClientPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const totalPayout = EMPLOYEES.reduce((sum, emp) => sum + emp.netSalary, 0);
  const totalIncentive = EMPLOYEES.reduce((sum, emp) => sum + emp.incentive, 0);
  const avgSalary = Math.round(totalPayout / EMPLOYEES.length);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-gray-600 mt-2">
            View payroll data, employee information, and download reports
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>Read-only Access</span>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Employees</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Payroll</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-blue-700 mb-1">Total Payout</div>
                    <div className="text-3xl font-bold text-blue-900">
                      ₹{(totalPayout / 100000).toFixed(2)}L
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {EMPLOYEES.length} employees
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-purple-700 mb-1">Total Incentives</div>
                    <div className="text-3xl font-bold text-purple-900">
                      ₹{totalIncentive.toLocaleString()}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">Performance based</div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-green-700 mb-1">Avg Salary</div>
                    <div className="text-3xl font-bold text-green-900">
                      ₹{avgSalary.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 mt-1">Per employee</div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TOP_PERFORMERS.map((performer) => (
                  <div
                    key={performer.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-lg">
                      {performer.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{performer.name}</div>
                      <div className="text-sm text-gray-500">{performer.empId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{performer.units} units</div>
                      <div className="font-semibold text-green-600">
                        ₹{performer.incentive.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead className="text-right">Incentive</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EMPLOYEES.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.empId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{employee.netSalary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        ₹{employee.incentive.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            employee.status === "Active"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Month Selector */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-900">Current Period</div>
                  <div className="text-sm text-blue-700">April 2026</div>
                </div>
              </div>

              {/* Payroll Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-green-200">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-1">Gross Earnings</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{(totalPayout * 1.18 / 100000).toFixed(2)}L
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-red-200">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-1">Total Deductions</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{(totalPayout * 0.18 / 100000).toFixed(2)}L
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-blue-200">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-1">Net Payout</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{(totalPayout / 100000).toFixed(2)}L
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-purple-200">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-1">Incentives Paid</div>
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{totalIncentive.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Read-only Notice */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Read-Only Access</div>
                    <div className="text-sm text-gray-600 mt-1">
                      You can view payroll data but cannot make any modifications. Contact your
                      account manager for changes.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Download Center */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {REPORTS.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-500">
                          {report.month} • {report.size}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incentive Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Incentive Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-700 mb-1">Total Incentives Paid</div>
                  <div className="text-2xl font-bold text-purple-900">
                    ₹{totalIncentive.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700 mb-1">Avg Incentive/Employee</div>
                  <div className="text-2xl font-bold text-green-900">
                    ₹{Math.round(totalIncentive / EMPLOYEES.length).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 mb-1">Incentive % of Payroll</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {((totalIncentive / totalPayout) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Incentive Distribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Top 20% Performers</span>
                    <span className="font-semibold">
                      ₹{Math.round(totalIncentive * 0.45).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Middle 60% Performers</span>
                    <span className="font-semibold">
                      ₹{Math.round(totalIncentive * 0.42).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Bottom 20% Performers</span>
                    <span className="font-semibold">
                      ₹{Math.round(totalIncentive * 0.13).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Profile Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
            <DialogDescription>View employee details and salary information</DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-semibold text-gray-900">{selectedEmployee.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Employee ID</div>
                  <div className="font-semibold text-gray-900">{selectedEmployee.empId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="font-semibold text-gray-900">{selectedEmployee.role}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Department</div>
                  <div className="font-semibold text-gray-900">{selectedEmployee.department}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Join Date</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(selectedEmployee.joinDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <Badge
                    className={
                      selectedEmployee.status === "Active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  >
                    {selectedEmployee.status}
                  </Badge>
                </div>
              </div>

              {/* Salary Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Salary Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="border border-blue-200">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">Net Salary</div>
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{selectedEmployee.netSalary.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-purple-200">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">Incentive</div>
                      <div className="text-2xl font-bold text-purple-600">
                        ₹{selectedEmployee.incentive.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Read-only Notice */}
              <div className="p-3 bg-gray-50 rounded-lg border text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Lock className="w-4 h-4" />
                  <span>Read-only view - Contact administrator for modifications</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
