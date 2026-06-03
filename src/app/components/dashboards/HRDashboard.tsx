// ✅ FIXED: HRDashboard now reads from live contexts instead of static masterData
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Users, Calendar, CheckCircle, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import { useCity } from "../../contexts/CityContext";
import { useAttendance } from "../../contexts/AttendanceContext";

export function HRDashboard() {
  const navigate = useNavigate();
  const { city } = useCity();
  const { employees } = useEmployee();
  const { payrollRuns, getPayrollForMonth } = useEmployeeData();
  const { getMonthlyAttendanceSummary } = useAttendance();

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Live employee counts
  const cityEmployees = employees.filter(e => e.cityId === city || !e.cityId);
  const activeCount = cityEmployees.filter(e => e.status === "Active").length;
  const onLeaveCount = cityEmployees.filter(e => e.status === "On Leave").length;

  // Live payroll for current month
  const currentPayroll = getPayrollForMonth(currentMonth);
  const totalNetPayroll = currentPayroll.reduce((s, p) => s + (p.netSalary || 0), 0);
  const pendingApprovals = currentPayroll.filter(p => p.status === "Draft" || p.status === "HR Approved").length;

  const handleApproveLeave = (name: string) => toast.success(`Leave approved for ${name}`);
  const handleRejectLeave  = (name: string) => toast.error(`Leave rejected for ${name}`);

  // Leave requests — from AttendanceContext (status: Leave)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Management Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Employee lifecycle management</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/hr/lifecycle-management")}>
          <Users className="w-4 h-4 mr-2" />
          Add New Employee
        </Button>
      </div>

      {/* Stats — live data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-gray-500">Active Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{onLeaveCount}</p>
            <p className="text-xs text-gray-500">On Leave Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">
              {totalNetPayroll > 0 ? `₹${(totalNetPayroll / 100000).toFixed(2)}L` : "—"}
            </p>
            <p className="text-xs text-gray-500">Net Payroll {currentMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="bg-amber-50 text-amber-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{pendingApprovals}</p>
            <p className="text-xs text-gray-500">Payroll Pending Approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick navigation */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Attendance", path: "/hr" },
              { label: "Payroll Run", path: "/payroll/run" },
              { label: "Leave Management", path: "/hr/professional-leave" },
              { label: "Onboarding", path: "/hr/onboarding" },
            ].map(action => (
              <Button key={action.path} variant="outline" onClick={() => navigate(action.path)} className="h-12">
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee list summary */}
      {cityEmployees.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No employees loaded. Data loads from Supabase on login.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
