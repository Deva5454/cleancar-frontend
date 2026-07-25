import { DataService } from "../../services/DataService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import {
  Users,
  UserPlus,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Eye,
  LogOut,
  UserCheck,
  UserX,
  Calendar,
  Building,
  ArrowRight,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { EmployeeDatabase } from "./EmployeeDatabase";
import { LettersDocuments } from "./LettersDocuments";
import { EmployeeOnboarding } from "./EmployeeOnboarding";
import { DocumentManagement } from "./DocumentManagement";
import { IDCardGenerator } from "./IDCardGenerator";
import { ExitManagement } from "./ExitManagement";
import { HRReporting } from "./HRReporting";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { exitWorkflowService } from "../../services/exitWorkflowService";

export function EmployeeLifecycleManagement() {
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [triggerAddEmployee, setTriggerAddEmployee] = useState(false);
  
  // Handler to switch to employee tab and open modal when Add New Employee is clicked
  const handleAddEmployee = () => {
    setActiveTab("employees");
    setTriggerAddEmployee(true);
    // Reset trigger after a brief moment to allow re-triggering
    setTimeout(() => setTriggerAddEmployee(false), 100);
  };

  // ✅ FIX (HR-DEF-04): previously a fully static object
  // (totalEmployees: 156, activeEmployees: 142, ...) shown to every user
  // regardless of real data. Now computed from the same real sources
  // HRModule.tsx's dashboard already uses.
  const dashboardMetrics = (() => {
    const employees = employeeDatabaseService.getAll();
    const today = new Date();
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e: any) => e.status === "Active").length;
    const newJoinersThisMonth = employees.filter((e: any) => {
      const j = new Date(e.dateOfJoining);
      return j.getMonth() === today.getMonth() && j.getFullYear() === today.getFullYear();
    }).length;
    const onLeave = employees.filter((e: any) => e.status === "On Leave").length;
    const pendingApprovals = DataService.get<any>("LEAVE_REQUESTS").filter((r: any) => r.status === "Pending").length;
    const upcomingConfirmations = employees.filter((e: any) => {
      if (e.status !== "Active" || e.confirmationDate) return false;
      const probationMonths = e.probationPeriod?.match(/(\d+)\s*month/i);
      const months = probationMonths ? parseInt(probationMonths[1], 10) : 3;
      const joiningDate = new Date(e.dateOfJoining);
      const probationEndDate = new Date(joiningDate);
      probationEndDate.setMonth(probationEndDate.getMonth() + months);
      const daysUntil = Math.ceil((probationEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    }).length;
    const activeExits = exitWorkflowService.getActive();
    const resignations = activeExits.filter((w: any) => w.resignationType === "Voluntary").length;
    const exitInProcess = activeExits.length;
    return { totalEmployees, activeEmployees, newJoinersThisMonth, onLeave, pendingApprovals, upcomingConfirmations, resignations, exitInProcess };
  })();

  // Recent Activities
  // ✅ FIX (HR-DEF-04): previously a fully static array with fictional
  // named events ("Rahul Sharma — Joined as Car Washer — 2 hours ago").
  // Built from real recent joiners, real leave requests, and real exit
  // workflow activity instead.
  const recentActivities = (() => {
    const employees = employeeDatabaseService.getAll();
    const leaveRequests = DataService.get<any>("LEAVE_REQUESTS");
    const exits = exitWorkflowService.getAll();
    type Activity = { id: string; type: string; employee: string; action: string; at: number; icon: any; color: string };
    const items: Activity[] = [];

    employees.forEach((e: any) => {
      const at = new Date(e.dateOfJoining).getTime();
      if (!isNaN(at)) items.push({ id: `join-${e.id}`, type: "joining", employee: e.fullName || `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(), action: `Joined as ${e.designation || "Employee"}`, at, icon: UserPlus, color: "text-green-600" });
    });
    leaveRequests.forEach((r: any) => {
      const at = new Date(r.appliedAt || r.appliedOn || 0).getTime();
      if (!isNaN(at) && at > 0) items.push({ id: `leave-${r.id}`, type: "leave", employee: employees.find((e: any) => e.id === r.employeeId)?.fullName || r.employeeId, action: `${r.leaveType} leave request ${r.status.toLowerCase()}`, at, icon: FileText, color: "text-blue-600" });
    });
    exits.forEach((w: any) => {
      const at = new Date(w.updatedAt || w.createdAt || 0).getTime();
      if (!isNaN(at) && at > 0) items.push({ id: `exit-${w.exitWorkflowId}`, type: "exit", employee: w.employeeName, action: `Exit: ${w.currentStage}`, at, icon: LogOut, color: "text-red-600" });
    });

    return items.sort((a, b) => b.at - a.at).slice(0, 5).map((i, idx) => ({
      id: idx + 1, type: i.type, employee: i.employee, action: i.action,
      timestamp: new Date(i.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      icon: i.icon, color: i.color,
    }));
  })();

  // ✅ FIX (HR-DEF-04): real pending approvals — leave requests and exit
  // clearance stages actually awaiting action, instead of fictional names.
  const pendingApprovals = (() => {
    const employees = employeeDatabaseService.getAll();
    const leaveRequests = DataService.get<any>("LEAVE_REQUESTS").filter((r: any) => r.status === "Pending");
    const exits = exitWorkflowService.getActive().filter((w: any) => w.currentStage === "Clearance" || w.currentStage === "F&F Settlement");
    return [
      ...leaveRequests.map((r: any, idx: number) => ({
        id: idx + 1, type: "Leave Request",
        employee: employees.find((e: any) => e.id === r.employeeId)?.fullName || r.employeeId,
        position: employees.find((e: any) => e.id === r.employeeId)?.designation || "",
        submittedBy: r.employeeId, submittedOn: r.appliedAt || r.appliedOn || "",
      })),
      ...exits.map((w: any, idx: number) => ({
        id: leaveRequests.length + idx + 1, type: w.currentStage,
        employee: w.employeeName, position: w.roleId || "",
        submittedBy: "HR", submittedOn: w.updatedAt || w.createdAt || "",
      })),
    ];
  })();

  // ✅ FIX (HR-DEF-04): real employees with probation ending within 30
  // days, instead of fictional names.
  const upcomingConfirmationsList = (() => {
    const employees = employeeDatabaseService.getAll();
    const today = new Date();
    return employees
      .filter((e: any) => {
        if (e.status !== "Active" || e.confirmationDate) return false;
        const probationMonths = e.probationPeriod?.match(/(\d+)\s*month/i);
        const months = probationMonths ? parseInt(probationMonths[1], 10) : 3;
        const joiningDate = new Date(e.dateOfJoining);
        const probationEndDate = new Date(joiningDate);
        probationEndDate.setMonth(probationEndDate.getMonth() + months);
        const daysUntil = Math.ceil((probationEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 30;
      })
      .map((e: any, idx: number) => {
        const probationMonths = e.probationPeriod?.match(/(\d+)\s*month/i);
        const months = probationMonths ? parseInt(probationMonths[1], 10) : 3;
        const joiningDate = new Date(e.dateOfJoining);
        const probationEndDate = new Date(joiningDate);
        probationEndDate.setMonth(probationEndDate.getMonth() + months);
        const daysLeft = Math.ceil((probationEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: idx + 1, employee: e.fullName || `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
          position: e.designation || "", joiningDate: e.dateOfJoining,
          confirmationDate: probationEndDate.toISOString().split("T")[0], daysLeft,
        };
      });
  })();

  // ✅ FIX (HR-DEF-04): real department-wise counts instead of a fully
  // fabricated breakdown.
  const departmentData = (() => {
    const employees = employeeDatabaseService.getAll();
    const total = employees.length || 1;
    const counts: Record<string, number> = {};
    employees.forEach((e: any) => { counts[e.department || "Unassigned"] = (counts[e.department || "Unassigned"] || 0) + 1; });
    return Object.entries(counts).map(([department, count]) => ({
      department, count, percentage: Math.round((count / total) * 1000) / 10,
    }));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Employee Lifecycle Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete HR automation from offer letter to exit settlement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button onClick={handleAddEmployee}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Employee
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="letters">Letters &amp; Offers</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="id-card">ID Card</TabsTrigger>
          <TabsTrigger value="exit">Exit</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Total Employees</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {dashboardMetrics.totalEmployees}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">All time</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Active</p>
                    <p className="text-3xl font-bold text-green-600">
                      {dashboardMetrics.activeEmployees}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Working</p>
                  </div>
                  <UserCheck className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">New Joiners</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {dashboardMetrics.newJoinersThisMonth}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">This month</p>
                  </div>
                  <UserPlus className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">Pending Approvals</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {dashboardMetrics.pendingApprovals}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Action needed</p>
                  </div>
                  <Clock className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">On Leave</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.onLeave}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Confirmations Due</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.upcomingConfirmations}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <LogOut className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Resignations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.resignations}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <UserX className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Exit in Process</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardMetrics.exitInProcess}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Recent Activities */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Icon className={`w-5 h-5 ${activity.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.employee}
                          </p>
                          <p className="text-xs text-gray-600">{activity.action}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Pending Approvals
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    {pendingApprovals.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="p-3 border border-orange-200 bg-orange-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {approval.employee}
                          </p>
                          <p className="text-xs text-gray-600">{approval.position}</p>
                          <Badge className="mt-2 bg-orange-200 text-orange-800 text-xs">
                            {approval.type}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {approval.submittedOn}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Confirmations */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Confirmations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingConfirmationsList.map((conf) => (
                    <div
                      key={conf.id}
                      className="p-3 border border-blue-200 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {conf.employee}
                          </p>
                          <p className="text-xs text-gray-600">{conf.position}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <p className="text-xs text-blue-600">
                              {conf.confirmationDate}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-blue-200 text-blue-800">
                          {conf.daysLeft}d
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Employee Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentData.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {dept.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="text-sm text-gray-600">
                          {dept.count} employees
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {dept.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${dept.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Letter Management Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="border-blue-200 hover:border-blue-400 transition-all cursor-pointer">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Offer & Appointment Letters
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create and manage offer and appointment letters for new hires
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() => navigate("/hr/letters-documents")}
                    >
                      Go to Letters & Documents
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:border-green-400 transition-all cursor-pointer">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Confirmation Letters
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Track probation and issue confirmation letters
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        navigate("/hr/letters-documents");
                        // Trigger confirmation tab after navigation
                        setTimeout(() => {
                          const confirmationTab = document.querySelector('[value="confirmation"]') as HTMLElement;
                          if (confirmationTab) confirmationTab.click();
                        }, 100);
                      }}
                    >
                      Go to Confirmation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employee Database Tab */}
        <TabsContent value="employees">
          <EmployeeDatabase openAddModal={triggerAddEmployee} />
        </TabsContent>

        {/* Letters & Offers Tab — sits between Employees and Onboarding to reflect
            the real sequence: Add Employee -> Offer -> Appointment -> Onboarding */}
        <TabsContent value="letters">
          <LettersDocuments />
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding">
          <EmployeeOnboarding />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentManagement />
        </TabsContent>

        {/* ID Card Tab */}
        <TabsContent value="id-card">
          <IDCardGenerator />
        </TabsContent>

        {/* Exit Tab */}
        <TabsContent value="exit">
          <ExitManagement />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <HRReporting />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmployeeLifecycleManagement;
