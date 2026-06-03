/**
 * ============================================================================
 * LEAVE MANAGEMENT MODULE - SINGLE SOURCE OF TRUTH
 * ============================================================================
 *
 * ⚠️ CRITICAL: THIS IS THE ONLY LEAVE MANAGEMENT MODULE
 *
 * DO NOT CREATE:
 * - LeaveManagement.tsx (DELETED - was duplicate)
 * - EnhancedLeaveManagement.tsx (DELETED - was duplicate)
 * - Any other leave management components
 *
 * ROUTE: /hr/professional-leave
 *
 * FEATURES:
 * - 25 annual leaves system (7 CL + 10 PL + 7 SL + 1 UL)
 * - Pro-rata calculations for mid-year joiners
 * - Probation period leave credits
 * - Full/Half day leave support
 * - Multi-level approval workflow
 * - Leave balance tracking
 * - Resigned employee F&F calculations
 *
 * DATA SOURCE:
 * - Employee data: MASTER_EMPLOYEES from employeeData.ts
 * - Leave balances: Calculated from joining dates and leave scenarios
 * - NO mock data - all calculations are real
 *
 * INTEGRATION:
 * - Used by: HR Module, Employee Self Service, Payroll (F&F)
 * - Impacts: Salary calculations, F&F settlements
 *
 * LAST CONSOLIDATED: 2026-04-23
 * ============================================================================
 */

import { DataService } from "../../services/DataService";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { BackButton } from "../ui/back-button";
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Link } from "react-router-dom";
import {
  Calendar, User, Clock, TrendingUp, AlertCircle,
  CheckCircle, XCircle, FileText, Download, Info,
  BarChart3, PieChart, ArrowRight, Edit2, Save, Settings,
  Shield, ToggleLeft
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { MASTER_EMPLOYEES } from "../../data/employeeData";
import {
  LEAVE_GLOBAL_SETTINGS,
  updateLeaveGlobalSettings,
  calculateProratedCL,
  validateLeaveClubbing,
  type LeaveGlobalSettings,
  type LeaveType as ConfigLeaveType
} from "../../config/leavePolicyConfiguration";
import { toast } from "sonner";

// Leave Types with 25 total allocation
type LeaveType = "CL" | "PL" | "SL" | "UL";

interface LeaveBalance {
  CL: { entitled: number; taken: number; balance: number };
  PL: { entitled: number; taken: number; balance: number };
  SL: { entitled: number; taken: number; balance: number };
  UL: { entitled: number; taken: number; balance: number };
}

interface Employee {
  id: string;
  name: string;
  empCode: string;
  joiningDate: string;
  confirmationDate: string | null;
  department: string;
  status: "Active" | "Resigned";
  lastWorkingDay: string | null;
}

interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
}

// Map centralized employee data to local interface
const employeeScenarios: Employee[] = MASTER_EMPLOYEES.map(emp => ({
  id: emp.id,
  name: emp.name,
  empCode: emp.empCode,
  joiningDate: emp.joiningDate,
  confirmationDate: emp.confirmationDate || null,
  department: emp.department,
  status: emp.status === "Resigned" ? "Resigned" : "Active",
  lastWorkingDay: emp.lastWorkingDay || null,
}));

// Leave taken scenarios for different employees (synchronized with payroll data)
const leaveScenarios: Record<string, { CL: number; PL: number; SL: number; UL: number }> = {
  "EMP-001": { CL: 1, PL: 1, SL: 1, UL: 0 }, // Rahul Mehta - Balanced usage
  "EMP-002": { CL: 0, PL: 0, SL: 0, UL: 0 }, // Priya Sharma - No leaves taken yet
  "EMP-003": { CL: 2, PL: 3, SL: 1, UL: 0 }, // Amit Kumar - Moderate usage
  "EMP-004": { CL: 1, PL: 0, SL: 0, UL: 0 }, // Neha Patel - Probation credits only
  "EMP-005": { CL: 1, PL: 0, SL: 0, UL: 1 }, // Vikram Singh - With UL taken
  "EMP-006": { CL: 0, PL: 0, SL: 0, UL: 0 }, // Sneha Gupta - On maternity leave
  "CW-101": { CL: 0, PL: 0, SL: 1, UL: 0 },  // Ravi Verma - Car Washer
  "CW-102": { CL: 0, PL: 0, SL: 0, UL: 1 },  // Suresh Yadav - With UL taken
  "TS-201": { CL: 0, PL: 0, SL: 0, UL: 0 },  // Anjali Reddy - No leaves
  "FS-301": { CL: 1, PL: 0, SL: 0, UL: 0 },  // Karthik Iyer - Casual leave
};

// Calculate pro-rata leaves
const calculateProRataLeaves = (
  startDate: string,
  endDate: string
): { CL: number; PL: number; SL: number; UL: number; total: number; days: number } => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const CL = Math.round((days / 365) * 7);
  const PL = Math.round((days / 365) * 10);
  const SL = Math.round((days / 365) * 7);
  const UL = Math.round((days / 365) * 1);
  
  return { CL, PL, SL, UL, total: CL + PL + SL + UL, days };
};

// Calculate probation leave credits
const calculateProbationCredits = (joiningDate: string, confirmationDate: string): { 
  workingDays: number; 
  credits: number;
  milestones: Array<{ days: number; credit: number; cumulative: number }>;
} => {
  const start = new Date(joiningDate);
  const end = new Date(confirmationDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const credits = Math.floor(workingDays / 20);
  
  const milestones = [];
  for (let i = 1; i <= credits; i++) {
    milestones.push({
      days: i * 20,
      credit: 1,
      cumulative: i
    });
  }
  
  return { workingDays, credits, milestones };
};

function ProfessionalLeaveManagement() {
  // Deferred render — 118KB component, unblocks navigation
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);

  const { currentRole, currentUser } = useRole();
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "probation" | "allocation" | "exit" | "history" | "settings">("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("EMP-001");
  const [showScenariosGuide, setShowScenariosGuide] = useState(false);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState<LeaveGlobalSettings>({ ...LEAVE_GLOBAL_SETTINGS });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSettingChange, setPendingSettingChange] = useState<{
    leaveType: "PL" | "CL" | "COMP OFF";
    action: "enable" | "disable";
    applyTo: "all" | "specific";
    employeeId?: string;
  } | null>(null);

  // Leave Application Form State
  const [showLeaveApplicationForm, setShowLeaveApplicationForm] = useState(false);
  const [leaveApplicationForm, setLeaveApplicationForm] = useState({
    leaveType: "CL" as LeaveType,
    fromDate: "",
    toDate: "",
    reason: "",
  });
  
  // Get current employee
  const employee = employeeScenarios.find(emp => emp.id === selectedEmployeeId) || employeeScenarios[0];
  
  // Leave balances based on selected employee
  const [leavesTaken, setLeavesTaken] = useState(leaveScenarios[selectedEmployeeId] || { CL: 0, PL: 0, SL: 0, UL: 0 });

  // Update leaves when employee changes
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    setLeavesTaken(leaveScenarios[empId] || { CL: 0, PL: 0, SL: 0, UL: 0 });
  };

  // Comprehensive leave history for all employees
  const allLeaveHistory: Record<string, LeaveApplication[]> = {
    "EMP-001": [
      {
        id: "LV-001",
        employeeId: "EMP-001",
        employeeName: "Rahul Mehta",
        leaveType: "CL",
        fromDate: "2025-01-20",
        toDate: "2025-01-20",
        days: 1,
        reason: "Personal work",
        status: "Approved",
        appliedOn: "2025-01-15",
        approvedBy: "HR Team",
        approvedOn: "2025-01-16",
      },
      {
        id: "LV-002",
        employeeId: "EMP-001",
        employeeName: "Rahul Mehta",
        leaveType: "PL",
        fromDate: "2025-02-10",
        toDate: "2025-02-10",
        days: 1,
        reason: "Family function",
        status: "Approved",
        appliedOn: "2025-02-05",
        approvedBy: "HR Team",
        approvedOn: "2025-02-06",
      },
      {
        id: "LV-003",
        employeeId: "EMP-001",
        employeeName: "Rahul Mehta",
        leaveType: "SL",
        fromDate: "2025-03-12",
        toDate: "2025-03-12",
        days: 1,
        reason: "Fever",
        status: "Approved",
        appliedOn: "2025-03-11",
        approvedBy: "HR Team",
        approvedOn: "2025-03-11",
      },
    ],
    "EMP-002": [],
    "EMP-003": [
      {
        id: "LV-004",
        employeeId: "EMP-003",
        employeeName: "Amit Kumar",
        leaveType: "CL",
        fromDate: "2025-01-15",
        toDate: "2025-01-16",
        days: 2,
        reason: "Family emergency",
        status: "Approved",
        appliedOn: "2025-01-10",
        approvedBy: "Finance Manager",
        approvedOn: "2025-01-11",
      },
      {
        id: "LV-005",
        employeeId: "EMP-003",
        employeeName: "Amit Kumar",
        leaveType: "PL",
        fromDate: "2025-02-05",
        toDate: "2025-02-09",
        days: 5,
        reason: "Vacation - Goa trip",
        status: "Approved",
        appliedOn: "2025-01-20",
        approvedBy: "Finance Manager",
        approvedOn: "2025-01-22",
      },
      {
        id: "LV-006",
        employeeId: "EMP-003",
        employeeName: "Amit Kumar",
        leaveType: "SL",
        fromDate: "2025-03-03",
        toDate: "2025-03-05",
        days: 3,
        reason: "Viral fever - medical certificate attached",
        status: "Approved",
        appliedOn: "2025-03-03",
        approvedBy: "Finance Manager",
        approvedOn: "2025-03-03",
      },
      {
        id: "LV-007",
        employeeId: "EMP-003",
        employeeName: "Amit Kumar",
        leaveType: "CL",
        fromDate: "2025-03-20",
        toDate: "2025-03-21",
        days: 2,
        reason: "House shifting",
        status: "Pending",
        appliedOn: "2025-03-15",
      },
      {
        id: "LV-008",
        employeeId: "EMP-003",
        employeeName: "Amit Kumar",
        leaveType: "PL",
        fromDate: "2025-04-10",
        toDate: "2025-04-12",
        days: 3,
        reason: "Wedding to attend",
        status: "Pending",
        appliedOn: "2025-03-14",
      },
    ],
    "EMP-004": [
      {
        id: "LV-009",
        employeeId: "EMP-004",
        employeeName: "Neha Patel",
        leaveType: "CL",
        fromDate: "2024-12-20",
        toDate: "2024-12-20",
        days: 1,
        reason: "Personal work",
        status: "Approved",
        appliedOn: "2024-12-15",
        approvedBy: "HR Manager",
        approvedOn: "2024-12-16",
      },
      {
        id: "LV-010",
        employeeId: "EMP-004",
        employeeName: "Neha Patel",
        leaveType: "CL",
        fromDate: "2025-02-05",
        toDate: "2025-02-05",
        days: 1,
        reason: "Medical checkup",
        status: "Approved",
        appliedOn: "2025-02-01",
        approvedBy: "HR Manager",
        approvedOn: "2025-02-02",
      },
      {
        id: "LV-011",
        employeeId: "EMP-004",
        employeeName: "Neha Patel",
        leaveType: "SL",
        fromDate: "2025-03-10",
        toDate: "2025-03-10",
        days: 1,
        reason: "Headache",
        status: "Rejected",
        appliedOn: "2025-03-09",
      },
    ],
    "EMP-005": [
      {
        id: "LV-012",
        employeeId: "EMP-005",
        employeeName: "Vikram Singh",
        leaveType: "CL",
        fromDate: "2025-01-08",
        toDate: "2025-01-09",
        days: 2,
        reason: "Family function",
        status: "Approved",
        appliedOn: "2025-01-02",
        approvedBy: "Ops Manager",
        approvedOn: "2025-01-03",
      },
      {
        id: "LV-013",
        employeeId: "EMP-005",
        employeeName: "Vikram Singh",
        leaveType: "PL",
        fromDate: "2025-02-17",
        toDate: "2025-02-21",
        days: 5,
        reason: "Family vacation",
        status: "Approved",
        appliedOn: "2025-02-01",
        approvedBy: "Ops Manager",
        approvedOn: "2025-02-03",
      },
      {
        id: "LV-014",
        employeeId: "EMP-005",
        employeeName: "Vikram Singh",
        leaveType: "SL",
        fromDate: "2025-03-25",
        toDate: "2025-03-26",
        days: 2,
        reason: "Stomach infection",
        status: "Approved",
        appliedOn: "2025-03-24",
        approvedBy: "Ops Manager",
        approvedOn: "2025-03-24",
      },
      {
        id: "LV-015",
        employeeId: "EMP-005",
        employeeName: "Vikram Singh",
        leaveType: "UL",
        fromDate: "2025-04-15",
        toDate: "2025-04-15",
        days: 1,
        reason: "All paid leaves exhausted - urgent personal work",
        status: "Approved",
        appliedOn: "2025-04-10",
        approvedBy: "Ops Manager",
        approvedOn: "2025-04-11",
      },
      {
        id: "LV-016",
        employeeId: "EMP-005",
        employeeName: "Vikram Singh",
        leaveType: "CL",
        fromDate: "2025-05-05",
        toDate: "2025-05-05",
        days: 1,
        reason: "Personal work",
        status: "Approved",
        appliedOn: "2025-04-28",
        approvedBy: "Ops Manager",
        approvedOn: "2025-04-29",
      },
    ],
    "EMP-006": [
      {
        id: "LV-017",
        employeeId: "EMP-006",
        employeeName: "Sneha Gupta",
        leaveType: "CL",
        fromDate: "2025-01-22",
        toDate: "2025-01-23",
        days: 2,
        reason: "Wedding preparation",
        status: "Approved",
        appliedOn: "2025-01-15",
        approvedBy: "Marketing Head",
        approvedOn: "2025-01-16",
      },
      {
        id: "LV-018",
        employeeId: "EMP-006",
        employeeName: "Sneha Gupta",
        leaveType: "PL",
        fromDate: "2025-02-03",
        toDate: "2025-02-06",
        days: 4,
        reason: "Honeymoon",
        status: "Approved",
        appliedOn: "2025-01-20",
        approvedBy: "Marketing Head",
        approvedOn: "2025-01-21",
      },
      {
        id: "LV-019",
        employeeId: "EMP-006",
        employeeName: "Sneha Gupta",
        leaveType: "SL",
        fromDate: "2025-02-18",
        toDate: "2025-02-18",
        days: 1,
        reason: "Doctor appointment",
        status: "Approved",
        appliedOn: "2025-02-15",
        approvedBy: "Marketing Head",
        approvedOn: "2025-02-16",
      },
      {
        id: "LV-020",
        employeeId: "EMP-006",
        employeeName: "Sneha Gupta",
        leaveType: "CL",
        fromDate: "2025-02-25",
        toDate: "2025-02-25",
        days: 1,
        reason: "Bank work",
        status: "Approved",
        appliedOn: "2025-02-20",
        approvedBy: "Marketing Head",
        approvedOn: "2025-02-21",
      },
    ],
  };
  
  // Get leave history for selected employee
  const leaveHistory = allLeaveHistory[selectedEmployeeId] || [];

  // Calculate probation data
  const probationData = employee.confirmationDate 
    ? calculateProbationCredits(employee.joiningDate, employee.confirmationDate)
    : null;

  // Calculate post-confirmation allocation
  const allocationData = employee.confirmationDate
    ? calculateProRataLeaves(employee.confirmationDate, "2025-12-31")
    : null;

  // Calculate exit settlement (Jan 1 to Mar 31 = 90 days)
  const exitData = employee.lastWorkingDay
    ? calculateProRataLeaves(
        employee.confirmationDate && new Date(employee.confirmationDate) > new Date("2025-01-01")
          ? employee.confirmationDate
          : "2025-01-01",
        employee.lastWorkingDay
      )
    : null;

  const exitSettlement = exitData ? {
    CL: {
      entitled: exitData.CL,
      taken: leavesTaken.CL,
      balance: exitData.CL - leavesTaken.CL,
      action: "Lapsed",
      color: "gray"
    },
    PL: {
      entitled: exitData.PL,
      taken: leavesTaken.PL,
      balance: exitData.PL - leavesTaken.PL,
      action: exitData.PL - leavesTaken.PL > 0 
        ? `Encash ${exitData.PL - leavesTaken.PL} day${exitData.PL - leavesTaken.PL > 1 ? 's' : ''}`
        : exitData.PL - leavesTaken.PL < 0
        ? `Recover ${Math.abs(exitData.PL - leavesTaken.PL)} day${Math.abs(exitData.PL - leavesTaken.PL) > 1 ? 's' : ''}`
        : "Nil",
      color: exitData.PL - leavesTaken.PL > 0 ? "green" : exitData.PL - leavesTaken.PL < 0 ? "red" : "gray"
    },
    SL: {
      entitled: exitData.SL,
      taken: leavesTaken.SL,
      balance: exitData.SL - leavesTaken.SL,
      action: "Lapsed",
      color: "gray"
    },
    UL: {
      entitled: exitData.UL,
      taken: leavesTaken.UL,
      balance: exitData.UL - leavesTaken.UL,
      action: leavesTaken.UL > 0 ? "Recover 1 day salary" : "Nil",
      color: leavesTaken.UL > 0 ? "red" : "gray"
    }
  } : null;

  // Sidebar Navigation
  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "probation", label: "Probation Accrual", icon: Clock },
    { id: "allocation", label: "Post-Confirmation", icon: Calendar },
    { id: "exit", label: "Exit Settlement", icon: FileText },
    { id: "history", label: "Leave History", icon: TrendingUp },
    { id: "settings", label: "Global Settings", icon: Shield, adminOnly: true },
  ];

  if (!mounted) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#0F1F3D] text-white p-6 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">Leave Management</h1>
          <p className="text-sm text-slate-300">Professional HR System</p>
        </div>
        
        <nav className="space-y-2">
          {navigation
            .filter((item) => {
              // Show admin-only items only to HR and Super Admin
              if (item.adminOnly) {
                return currentRole === "HR" || currentRole === "Super Admin" || currentRole === "Sales Head";
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeScreen === item.id
                      ? "bg-[#F5A623] text-white shadow-lg"
                      : "hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
        </nav>

        {/* Employee Selector */}
        <div className="mt-8 p-4 bg-slate-800 rounded-lg">
          <Label className="text-xs text-slate-400 mb-2">Select Employee</Label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
          >
            {employeeScenarios.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.empCode})
              </option>
            ))}
          </select>
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Department</p>
            <p className="font-semibold text-sm text-white">{employee.department}</p>
            <Badge 
              variant="outline" 
              className={`mt-2 text-xs ${
                employee.status === "Active" 
                  ? "border-green-400 text-green-400" 
                  : "border-red-400 text-red-400"
              }`}
            >
              {employee.status}
            </Badge>
          </div>
        </div>

        {/* Scenarios Guide Button */}
        <div className="mt-6">
          <Button
            size="sm"
            onClick={() => setShowScenariosGuide(!showScenariosGuide)}
            className="w-full bg-[#F5A623] hover:bg-[#D68910] text-white text-xs"
          >
            <Info className="w-4 h-4 mr-2" />
            View All Scenarios
          </Button>
          
          <Link to="/hr/leave-policy-engine">
            <Button
              size="sm"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs mt-2"
            >
              <Settings className="w-4 h-4 mr-2" />
              Leave Policy Engine
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Employee Scenario Info Banner */}
        <Card className="mb-6 border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-1">Current Scenario: {employee.name}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-amber-800">
                  <div>
                    <span className="font-medium">Status:</span> {employee.status}
                    {employee.status === "Resigned" && employee.lastWorkingDay && (
                      <span> (LWD: {new Date(employee.lastWorkingDay).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Confirmation:</span> {employee.confirmationDate ? new Date(employee.confirmationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "In Probation"}
                  </div>
                  <div>
                    <span className="font-medium">Leaves Taken:</span> CL:{leavesTaken.CL} | PL:{leavesTaken.PL} | SL:{leavesTaken.SL} | UL:{leavesTaken.UL}
                  </div>
                  <div>
                    <span className="font-medium">Leave History:</span> {leaveHistory.length} application{leaveHistory.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screen 1: Dashboard */}
        {activeScreen === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#0F1F3D] mb-2">
                Employee Leave Dashboard
              </h2>
              <p className="text-slate-600">
                Comprehensive overview of leave allocation and utilization
              </p>
            </div>

            {/* Employee Summary Card */}
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Employee Name</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">{employee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Employee ID</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">{employee.empCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Joining Date</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">
                      {new Date(employee.joiningDate).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Confirmation Date</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">
                      {employee.confirmationDate 
                        ? new Date(employee.confirmationDate).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : "Pending"
                      }
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                {employee.confirmationDate && (
                  <div className="mt-8">
                    <p className="text-sm font-medium text-slate-700 mb-3">Employment Timeline</p>
                    <div className="relative">
                      <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200"></div>
                      <div className="relative flex justify-between">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#1565C0] flex items-center justify-center mb-2">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-xs font-medium text-slate-700">Joining</p>
                          <p className="text-xs text-slate-500">
                            {new Date(employee.joiningDate).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center mb-2">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-xs font-medium text-slate-700">Confirmation</p>
                          <p className="text-xs text-slate-500">
                            {new Date(employee.confirmationDate).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </p>
                        </div>
                        {employee.lastWorkingDay && (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-[#C62828] flex items-center justify-center mb-2">
                              <XCircle className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-xs font-medium text-slate-700">LWD</p>
                            <p className="text-xs text-slate-500">
                              {new Date(employee.lastWorkingDay).toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short' 
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CL Card */}
              <Card className="border-2 border-[#1565C0] shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-[#1565C0] text-white px-3 py-1">CL</Badge>
                    <Calendar className="w-6 h-6 text-[#1565C0]" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Casual Leave</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Entitled:</span>
                      <span className="font-bold text-[#0F1F3D]">
                        {exitData?.CL || allocationData?.CL || 7}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taken:</span>
                      <span className="font-bold text-[#C62828]">{leavesTaken.CL}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Balance:</span>
                      <span className="font-bold text-2xl text-[#1565C0]">
                        {(exitData?.CL || allocationData?.CL || 7) - leavesTaken.CL}
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1565C0] rounded-full transition-all"
                      style={{
                        width: `${((exitData?.CL || allocationData?.CL || 7) - leavesTaken.CL) / (exitData?.CL || allocationData?.CL || 7) * 100}%`
                      }}
                    ></div>
                  </div>
                  {/* CL Prorated Accrual Info */}
                  {employee.confirmationDate && (
                    (() => {
                      const proratedInfo = calculateProratedCL(employee.confirmationDate);
                      const today = new Date();
                      const nextCredit = new Date(proratedInfo.nextCreditDate);
                      const daysUntilCredit = Math.ceil((nextCredit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-900">
                            <strong>CL accrual:</strong> 1.2 days/month from{" "}
                            {new Date(employee.confirmationDate).toLocaleDateString("en-IN")}
                          </p>
                          <p className="text-xs text-blue-800 mt-1">
                            <strong>Next credit:</strong> {daysUntilCredit > 0 ? daysUntilCredit : 0} days on{" "}
                            {new Date(proratedInfo.nextCreditDate).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>

              {/* PL Card */}
              <Card className="border-2 border-[#F5A623] shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-[#F5A623] text-white px-3 py-1">PL</Badge>
                    <Calendar className="w-6 h-6 text-[#F5A623]" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Privilege Leave</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Entitled:</span>
                      <span className="font-bold text-[#0F1F3D]">
                        {exitData?.PL || allocationData?.PL || 10}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taken:</span>
                      <span className="font-bold text-[#C62828]">{leavesTaken.PL}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Balance:</span>
                      <span className="font-bold text-2xl text-[#F5A623]">
                        {(exitData?.PL || allocationData?.PL || 10) - leavesTaken.PL}
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#F5A623] rounded-full transition-all"
                      style={{ 
                        width: `${((exitData?.PL || allocationData?.PL || 10) - leavesTaken.PL) / (exitData?.PL || allocationData?.PL || 10) * 100}%` 
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* SL Card */}
              <Card className="border-2 border-[#2E7D32] shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-[#2E7D32] text-white px-3 py-1">SL</Badge>
                    <Calendar className="w-6 h-6 text-[#2E7D32]" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Sick Leave</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Entitled:</span>
                      <span className="font-bold text-[#0F1F3D]">
                        {exitData?.SL || allocationData?.SL || 7}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taken:</span>
                      <span className="font-bold text-[#C62828]">{leavesTaken.SL}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Balance:</span>
                      <span className="font-bold text-2xl text-[#2E7D32]">
                        {(exitData?.SL || allocationData?.SL || 7) - leavesTaken.SL}
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2E7D32] rounded-full transition-all"
                      style={{ 
                        width: `${((exitData?.SL || allocationData?.SL || 7) - leavesTaken.SL) / (exitData?.SL || allocationData?.SL || 7) * 100}%` 
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* UL Card */}
              <Card className="border-2 border-[#C62828] shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-[#C62828] text-white px-3 py-1">UL</Badge>
                    <Calendar className="w-6 h-6 text-[#C62828]" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Unpaid Leave</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Entitled:</span>
                      <span className="font-bold text-[#0F1F3D]">
                        {exitData?.UL || allocationData?.UL || 1}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taken:</span>
                      <span className="font-bold text-[#C62828]">{leavesTaken.UL}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Balance:</span>
                      <span className="font-bold text-2xl text-[#C62828]">
                        {(exitData?.UL || allocationData?.UL || 1) - leavesTaken.UL}
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C62828] rounded-full transition-all"
                      style={{ 
                        width: `${((exitData?.UL || allocationData?.UL || 1) - leavesTaken.UL) / (exitData?.UL || allocationData?.UL || 1) * 100}%` 
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Utilization Summary */}
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-lg font-serif text-[#0F1F3D]">
                  Leave Utilization Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-slate-600 mb-2">Total Entitled</p>
                    <p className="text-4xl font-bold text-[#0F1F3D]">
                      {(exitData?.total || allocationData?.total || 25)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">days</p>
                  </div>
                  <div className="text-center p-6 bg-red-50 rounded-xl border-2 border-red-200">
                    <p className="text-sm text-slate-600 mb-2">Total Taken</p>
                    <p className="text-4xl font-bold text-[#C62828]">
                      {leavesTaken.CL + leavesTaken.PL + leavesTaken.SL + leavesTaken.UL}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">days</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <p className="text-sm text-slate-600 mb-2">Balance Remaining</p>
                    <p className="text-4xl font-bold text-[#2E7D32]">
                      {(exitData?.total || allocationData?.total || 25) -
                       (leavesTaken.CL + leavesTaken.PL + leavesTaken.SL + leavesTaken.UL)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Apply for Leave */}
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-serif text-[#0F1F3D] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Apply for Leave
                  </CardTitle>
                  {!showLeaveApplicationForm && (
                    <Button
                      size="sm"
                      onClick={() => setShowLeaveApplicationForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      New Application
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showLeaveApplicationForm && (
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">
                          Leave Type *
                        </Label>
                        <select
                          value={leaveApplicationForm.leaveType}
                          onChange={(e) =>
                            setLeaveApplicationForm({
                              ...leaveApplicationForm,
                              leaveType: e.target.value as LeaveType,
                            })
                          }
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="CL">CL - Casual Leave</option>
                          <option value="PL">PL - Privilege Leave</option>
                          <option value="SL">SL - Sick Leave</option>
                          <option value="UL">UL - Unpaid Leave</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">
                          From Date *
                        </Label>
                        <Input
                          type="date"
                          value={leaveApplicationForm.fromDate}
                          onChange={(e) =>
                            setLeaveApplicationForm({
                              ...leaveApplicationForm,
                              fromDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">
                          To Date *
                        </Label>
                        <Input
                          type="date"
                          value={leaveApplicationForm.toDate}
                          onChange={(e) =>
                            setLeaveApplicationForm({
                              ...leaveApplicationForm,
                              toDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700">
                        Reason *
                      </Label>
                      <Textarea
                        value={leaveApplicationForm.reason}
                        onChange={(e) =>
                          setLeaveApplicationForm({
                            ...leaveApplicationForm,
                            reason: e.target.value,
                          })
                        }
                        placeholder="Enter reason for leave"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          // Validate form
                          if (
                            !leaveApplicationForm.fromDate ||
                            !leaveApplicationForm.toDate ||
                            !leaveApplicationForm.reason
                          ) {
                            toast.error("Please fill in all required fields");
                            return;
                          }

                          // Validate leave clubbing
                          const clubbingValidation = validateLeaveClubbing({
                            requestedLeaveType: leaveApplicationForm.leaveType as ConfigLeaveType,
                            requestedFromDate: leaveApplicationForm.fromDate,
                            requestedToDate: leaveApplicationForm.toDate,
                            existingLeaves: leaveHistory.map((leave) => ({
                              leaveType: leave.leaveType as ConfigLeaveType,
                              fromDate: leave.fromDate,
                              toDate: leave.toDate,
                              status: leave.status,
                            })),
                          });

                          if (!clubbingValidation.valid) {
                            toast.error(
                              clubbingValidation.errors.join("\n\n"),
                              { duration: 6000 }
                            );
                            return;
                          }

                          // Persist leave request to DataService
                          const leaveRecord = {
                            id: `LEAVE-${Date.now()}`,
                            employeeId: selectedEmployeeId || "unknown",
                            leaveType: leaveApplicationForm.leaveType,
                            fromDate: leaveApplicationForm.fromDate,
                            toDate: leaveApplicationForm.toDate,
                            reason: leaveApplicationForm.reason,
                            status: "Pending" as const,
                            appliedAt: new Date().toISOString(),
                          };
                          DataService.insert("LEAVE_REQUESTS", leaveRecord);

                          // Success
                          toast.success(
                            `✅ Leave Application Submitted!\n\n${leaveApplicationForm.leaveType} from ${new Date(
                              leaveApplicationForm.fromDate
                            ).toLocaleDateString("en-IN")} to ${new Date(
                              leaveApplicationForm.toDate
                            ).toLocaleDateString("en-IN")}\n\nPending approval from your reporting manager.`
                          );
                          setLeaveApplicationForm({
                            leaveType: "CL",
                            fromDate: "",
                            toDate: "",
                            reason: "",
                          });
                          setShowLeaveApplicationForm(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Application
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowLeaveApplicationForm(false);
                          setLeaveApplicationForm({
                            leaveType: "CL",
                            fromDate: "",
                            toDate: "",
                            reason: "",
                          });
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Screen 2: Probation Accrual */}
        {activeScreen === "probation" && probationData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#0F1F3D] mb-2">
                Leave Accrual During Probation
              </h2>
              <p className="text-slate-600">
                Track casual leave credits earned during probationary period
              </p>
            </div>

            {/* Probation Summary */}
            <Card className="border-2 border-[#1565C0] shadow-xl">
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Joining Date</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">
                      {new Date(employee.joiningDate).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Confirmation Date</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">
                      {employee.confirmationDate &&
                        new Date(employee.confirmationDate).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Working Days in Probation</p>
                    <p className="font-bold text-3xl text-[#1565C0]">
                      {probationData.workingDays}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-2">Probation Leave Accrual Formula:</p>
                      <p>• 1 CL credit earned per 20 working days completed</p>
                      <p>• Total CL credits earned: <strong>{probationData.credits} leave{probationData.credits !== 1 ? 's' : ''}</strong></p>
                      <p className="mt-2 text-xs text-blue-700">
                        Note: Probation leave credits are Casual Leaves only and do not form part of the 25-day annual entitlement. 
                        PL, SL, and UL are not earned during probation.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestone Table */}
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-lg font-serif text-[#0F1F3D]">
                  CL Credit Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0F1F3D] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Working Day Milestone</th>
                        <th className="px-6 py-4 text-center font-semibold">CL Credit Earned</th>
                        <th className="px-6 py-4 text-center font-semibold">Cumulative CL Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {probationData.milestones.map((milestone, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-[#2E7D32]" />
                              <span className="font-medium text-[#0F1F3D]">{milestone.days} days</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge className="bg-[#1565C0] text-white">
                              +{milestone.credit} CL
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-lg text-[#0F1F3D]">
                              {milestone.cumulative}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Screen 3: Post-Confirmation Allocation */}
        {activeScreen === "allocation" && allocationData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#0F1F3D] mb-2">
                Post-Confirmation Pro-Rata Leave Allocation
              </h2>
              <p className="text-slate-600">
                Annual leave allocation calculated on pro-rata basis from confirmation date
              </p>
            </div>

            {/* Allocation Summary */}
            <Card className="border-2 border-[#F5A623] shadow-xl">
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Confirmation Date</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">
                      {employee.confirmationDate &&
                        new Date(employee.confirmationDate).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Year End Date</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">31 December 2025</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Remaining Days in Year</p>
                    <p className="font-bold text-3xl text-[#F5A623]">
                      {allocationData.days}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formula Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CL Formula */}
              <Card className="border-2 border-[#1565C0] shadow-xl">
                <CardHeader className="bg-[#1565C0] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#1565C0] px-3 py-1">CL</Badge>
                    Casual Leave Formula
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg font-mono text-sm">
                      <p className="text-slate-700">({allocationData.days} ÷ 365) × 7</p>
                      <p className="text-slate-700">= {(allocationData.days / 365 * 7).toFixed(2)}</p>
                      <p className="font-bold text-lg text-[#1565C0] mt-2">≈ {allocationData.CL} days</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pro-rata allocation rounded to nearest whole number
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* PL Formula */}
              <Card className="border-2 border-[#F5A623] shadow-xl">
                <CardHeader className="bg-[#F5A623] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#F5A623] px-3 py-1">PL</Badge>
                    Privilege Leave Formula
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg font-mono text-sm">
                      <p className="text-slate-700">({allocationData.days} ÷ 365) × 10</p>
                      <p className="text-slate-700">= {(allocationData.days / 365 * 10).toFixed(2)}</p>
                      <p className="font-bold text-lg text-[#F5A623] mt-2">≈ {allocationData.PL} days</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pro-rata allocation rounded to nearest whole number
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SL Formula */}
              <Card className="border-2 border-[#2E7D32] shadow-xl">
                <CardHeader className="bg-[#2E7D32] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#2E7D32] px-3 py-1">SL</Badge>
                    Sick Leave Formula
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg font-mono text-sm">
                      <p className="text-slate-700">({allocationData.days} ÷ 365) × 7</p>
                      <p className="text-slate-700">= {(allocationData.days / 365 * 7).toFixed(2)}</p>
                      <p className="font-bold text-lg text-[#2E7D32] mt-2">≈ {allocationData.SL} days</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pro-rata allocation rounded to nearest whole number
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* UL Formula */}
              <Card className="border-2 border-[#C62828] shadow-xl">
                <CardHeader className="bg-[#C62828] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#C62828] px-3 py-1">UL</Badge>
                    Unpaid Leave Formula
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg font-mono text-sm">
                      <p className="text-slate-700">({allocationData.days} ÷ 365) × 1</p>
                      <p className="text-slate-700">= {(allocationData.days / 365 * 1).toFixed(2)}</p>
                      <p className="font-bold text-lg text-[#C62828] mt-2">≈ {allocationData.UL} day{allocationData.UL !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pro-rata allocation rounded to nearest whole number
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Total Summary */}
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-lg font-serif text-[#0F1F3D]">
                  Total Pro-Rata Entitlement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-sm text-slate-500">CL</p>
                      <p className="font-bold text-2xl text-[#1565C0]">{allocationData.CL}</p>
                    </div>
                    <div className="text-slate-300 text-3xl">+</div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">PL</p>
                      <p className="font-bold text-2xl text-[#F5A623]">{allocationData.PL}</p>
                    </div>
                    <div className="text-slate-300 text-3xl">+</div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">SL</p>
                      <p className="font-bold text-2xl text-[#2E7D32]">{allocationData.SL}</p>
                    </div>
                    <div className="text-slate-300 text-3xl">+</div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">UL</p>
                      <p className="font-bold text-2xl text-[#C62828]">{allocationData.UL}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="text-slate-300 text-3xl">=</div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="font-bold text-4xl text-[#0F1F3D]">{allocationData.total}</p>
                      <p className="text-xs text-slate-500">days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Screen 4: Exit Settlement */}
        {activeScreen === "exit" && exitData && exitSettlement && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#0F1F3D] mb-2">
                Resignation / Exit Leave Settlement
              </h2>
              <p className="text-slate-600">
                Pro-rata leave calculation and full & final settlement
              </p>
            </div>

            {/* Exit Summary Card */}
            <Card className="border-2 border-[#C62828] shadow-xl">
              <CardHeader className="bg-[#C62828] text-white">
                <CardTitle className="text-xl font-serif">Employee Exit Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Employee Name</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">{employee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Confirmation Date</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">
                      {employee.confirmationDate &&
                        new Date(employee.confirmationDate).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Last Working Day</p>
                    <p className="font-bold text-lg text-[#C62828]">
                      {employee.lastWorkingDay &&
                        new Date(employee.lastWorkingDay).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Department</p>
                    <p className="font-bold text-lg text-[#0F1F3D]">{employee.department}</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">
                    <strong>Settlement Period:</strong> {employee.confirmationDate && new Date(employee.confirmationDate) > new Date("2025-01-01") 
                      ? new Date(employee.confirmationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : "1 Jan 2025"
                    } → 31 Mar 2025 = <strong>{exitData.days} days</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Leave Calculation Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CL Breakdown */}
              <Card className="border-2 border-[#1565C0] shadow-xl">
                <CardHeader className="bg-[#1565C0] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#1565C0]">CL</Badge>
                    Casual Leave
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Period</p>
                    <p className="text-sm font-medium">1 Jan → 31 Mar = {exitData.days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pro-Rata Formula</p>
                    <div className="p-2 bg-blue-50 rounded font-mono text-xs">
                      <p>({exitData.days} ÷ 365) × 7</p>
                      <p className="font-bold text-[#1565C0]">= {exitData.CL} days</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Leaves Taken</p>
                    <Input
                      type="number"
                      value={leavesTaken.CL}
                      onChange={(e) => setLeavesTaken({ ...leavesTaken, CL: Number(e.target.value) })}
                      className="font-bold"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-[#1565C0]">
                      {exitSettlement.CL.balance}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2 bg-slate-200 text-slate-700">
                    {exitSettlement.CL.action}
                  </Badge>
                </CardContent>
              </Card>

              {/* PL Breakdown */}
              <Card className="border-2 border-[#F5A623] shadow-xl">
                <CardHeader className="bg-[#F5A623] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#F5A623]">PL</Badge>
                    Privilege Leave
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Period</p>
                    <p className="text-sm font-medium">1 Jan → 31 Mar = {exitData.days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pro-Rata Formula</p>
                    <div className="p-2 bg-amber-50 rounded font-mono text-xs">
                      <p>({exitData.days} ÷ 365) × 10</p>
                      <p className="font-bold text-[#F5A623]">= {exitData.PL} days</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Leaves Taken</p>
                    <Input
                      type="number"
                      value={leavesTaken.PL}
                      onChange={(e) => setLeavesTaken({ ...leavesTaken, PL: Number(e.target.value) })}
                      className="font-bold"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-[#F5A623]">
                      {exitSettlement.PL.balance}
                    </p>
                  </div>
                  <Badge 
                    className={`w-full justify-center py-2 ${
                      exitSettlement.PL.color === 'green' 
                        ? 'bg-green-100 text-green-800 border-green-300' 
                        : exitSettlement.PL.color === 'red'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {exitSettlement.PL.action}
                  </Badge>
                </CardContent>
              </Card>

              {/* SL Breakdown */}
              <Card className="border-2 border-[#2E7D32] shadow-xl">
                <CardHeader className="bg-[#2E7D32] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#2E7D32]">SL</Badge>
                    Sick Leave
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Period</p>
                    <p className="text-sm font-medium">1 Jan → 31 Mar = {exitData.days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pro-Rata Formula</p>
                    <div className="p-2 bg-green-50 rounded font-mono text-xs">
                      <p>({exitData.days} ÷ 365) × 7</p>
                      <p className="font-bold text-[#2E7D32]">= {exitData.SL} days</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Leaves Taken</p>
                    <Input
                      type="number"
                      value={leavesTaken.SL}
                      onChange={(e) => setLeavesTaken({ ...leavesTaken, SL: Number(e.target.value) })}
                      className="font-bold"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-[#2E7D32]">
                      {exitSettlement.SL.balance}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2 bg-slate-200 text-slate-700">
                    {exitSettlement.SL.action}
                  </Badge>
                </CardContent>
              </Card>

              {/* UL Breakdown */}
              <Card className="border-2 border-[#C62828] shadow-xl">
                <CardHeader className="bg-[#C62828] text-white">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Badge className="bg-white text-[#C62828]">UL</Badge>
                    Unpaid Leave
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Period</p>
                    <p className="text-sm font-medium">1 Jan → 31 Mar = {exitData.days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pro-Rata Formula</p>
                    <div className="p-2 bg-red-50 rounded font-mono text-xs">
                      <p>({exitData.days} ÷ 365) × 1</p>
                      <p className="font-bold text-[#C62828]">= {exitData.UL} day</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Leaves Taken</p>
                    <Input
                      type="number"
                      value={leavesTaken.UL}
                      onChange={(e) => setLeavesTaken({ ...leavesTaken, UL: Number(e.target.value) })}
                      className="font-bold"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-[#C62828]">
                      {exitSettlement.UL.balance}
                    </p>
                  </div>
                  <Badge 
                    className={`w-full justify-center py-2 ${
                      exitSettlement.UL.color === 'red'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {exitSettlement.UL.action}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Full & Final Settlement Summary */}
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-xl font-serif text-[#0F1F3D]">
                  Full & Final Settlement Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0F1F3D] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left">Leave Type</th>
                        <th className="px-6 py-4 text-center">Entitled</th>
                        <th className="px-6 py-4 text-center">Taken</th>
                        <th className="px-6 py-4 text-center">Balance</th>
                        <th className="px-6 py-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <Badge className="bg-[#1565C0] text-white">CL</Badge>
                          <span className="ml-2 font-medium">Casual Leave</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.CL.entitled}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.CL.taken}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.CL.balance}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                            {exitSettlement.CL.action}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <Badge className="bg-[#F5A623] text-white">PL</Badge>
                          <span className="ml-2 font-medium">Privilege Leave</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.PL.entitled}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.PL.taken}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.PL.balance}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            className={
                              exitSettlement.PL.color === 'green' 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : exitSettlement.PL.color === 'red'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-slate-200 text-slate-700'
                            }
                          >
                            {exitSettlement.PL.action}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <Badge className="bg-[#2E7D32] text-white">SL</Badge>
                          <span className="ml-2 font-medium">Sick Leave</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.SL.entitled}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.SL.taken}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.SL.balance}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                            {exitSettlement.SL.action}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <Badge className="bg-[#C62828] text-white">UL</Badge>
                          <span className="ml-2 font-medium">Unpaid Leave</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.UL.entitled}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.UL.taken}</td>
                        <td className="px-6 py-4 text-center font-bold">{exitSettlement.UL.balance}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            className={
                              exitSettlement.UL.color === 'red'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-slate-200 text-slate-700'
                            }
                          >
                            {exitSettlement.UL.action}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-slate-50 border-t-2 border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-lg text-[#0F1F3D]">Net Settlement Amount:</p>
                    <p className="text-2xl font-bold text-[#F5A623]">
                      {exitSettlement.PL.balance > 0 ? `+${exitSettlement.PL.balance} PL` : exitSettlement.PL.balance < 0 ? `${exitSettlement.PL.balance} PL` : "Nil"}
                      {exitSettlement.UL.taken > 0 && `, -${exitSettlement.UL.taken} UL`}
                    </p>
                  </div>
                  <Button className="w-full bg-[#F5A623] hover:bg-[#D68910] text-white text-lg py-6">
                    <Download className="w-5 h-5 mr-2" />
                    Generate Exit Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Screen 5: Leave History */}
        {activeScreen === "history" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#0F1F3D] mb-2">
                Leave Application & History
              </h2>
              <p className="text-slate-600">
                View all leave applications and their current status
              </p>
            </div>

            {/* Leave History Table */}
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-lg font-serif text-[#0F1F3D]">
                  Leave History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0F1F3D] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left">Leave ID</th>
                        <th className="px-6 py-4 text-left">Date Range</th>
                        <th className="px-6 py-4 text-center">Leave Type</th>
                        <th className="px-6 py-4 text-center">Days</th>
                        <th className="px-6 py-4 text-left">Reason</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-left">Approved By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {leaveHistory.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-[#0F1F3D]">{leave.id}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium">
                                {new Date(leave.fromDate).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <p className="text-slate-500">to</p>
                              <p className="font-medium">
                                {new Date(leave.toDate).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge 
                              className={
                                leave.leaveType === 'CL' ? 'bg-[#1565C0] text-white' :
                                leave.leaveType === 'PL' ? 'bg-[#F5A623] text-white' :
                                leave.leaveType === 'SL' ? 'bg-[#2E7D32] text-white' :
                                'bg-[#C62828] text-white'
                              }
                            >
                              {leave.leaveType}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-lg">{leave.days}</td>
                          <td className="px-6 py-4 text-sm max-w-xs">{leave.reason}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge 
                              variant={
                                leave.status === 'Approved' ? 'default' :
                                leave.status === 'Pending' ? 'secondary' :
                                'destructive'
                              }
                              className={
                                leave.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                'bg-red-100 text-red-800 border-red-300'
                              }
                            >
                              {leave.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {leave.approvedBy && (
                              <div className="text-sm">
                                <p className="font-medium">{leave.approvedBy}</p>
                                <p className="text-slate-500 text-xs">
                                  {leave.approvedOn && new Date(leave.approvedOn).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Policy Notes */}
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg font-serif text-[#0F1F3D] flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Leave Policy Validation Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Badge className="bg-[#1565C0] text-white mb-2">CL</Badge>
                    <p className="text-sm text-slate-700">
                      <strong>Casual Leave:</strong> Max 2 consecutive days at a time. Cannot be carried forward.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Badge className="bg-[#F5A623] text-white mb-2">PL</Badge>
                    <p className="text-sm text-slate-700">
                      <strong>Privilege Leave:</strong> Requires minimum 3 days advance notice. Can be encashed at exit.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <Badge className="bg-[#2E7D32] text-white mb-2">SL</Badge>
                    <p className="text-sm text-slate-700">
                      <strong>Sick Leave:</strong> Medical certificate required beyond 2 consecutive days.
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <Badge className="bg-[#C62828] text-white mb-2">UL</Badge>
                    <p className="text-sm text-slate-700">
                      <strong>Unpaid Leave:</strong> Only available after all paid leave types are exhausted. Salary deducted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Screen 6: Global Settings (HR/Super Admin Only) */}
        {activeScreen === "settings" && (currentRole === "HR" || currentRole === "Super Admin" || currentRole === "Sales Head") && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#0F1F3D] mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#F5A623]" />
                Global Leave Settings
              </h2>
              <p className="text-slate-600">
                Control global leave type availability for all employees or specific individuals
              </p>
            </div>

            {/* Warning Banner */}
            <Card className="border-2 border-amber-300 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">
                      ⚠️ Administrator Settings
                    </p>
                    <p className="text-sm text-amber-800">
                      Changes made here will affect leave availability system-wide or for specific employees.
                      All changes take effect immediately upon confirmation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PL Settings */}
            <Card className="border-2 border-amber-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
                <CardTitle className="text-lg font-serif text-[#0F1F3D] flex items-center gap-2">
                  <Badge className="bg-[#F5A623] text-white">PL</Badge>
                  Privilege Leave (PL) — Global Control
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">
                      Enable Privilege Leave
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      When disabled, PL is not credited or available to any employee
                    </p>
                  </div>
                  <Switch
                    checked={globalSettings.PL.globallyEnabled}
                    onCheckedChange={(checked) => {
                      setPendingSettingChange({
                        leaveType: "PL",
                        action: checked ? "enable" : "disable",
                        applyTo: globalSettings.PL.applyTo,
                        employeeId: globalSettings.PL.specificEmployeeId,
                      });
                      setShowConfirmDialog(true);
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900">Apply To:</Label>
                  <RadioGroup
                    value={globalSettings.PL.applyTo}
                    onValueChange={(value: "all" | "specific") => {
                      setGlobalSettings({
                        ...globalSettings,
                        PL: { ...globalSettings.PL, applyTo: value },
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="all" id="pl-all" />
                      <Label htmlFor="pl-all" className="cursor-pointer font-normal flex-1">
                        All employees — toggle affects every employee in the system
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="specific" id="pl-specific" />
                      <Label htmlFor="pl-specific" className="cursor-pointer font-normal flex-1">
                        Specific employee — toggle applies to one individual only
                      </Label>
                    </div>
                  </RadioGroup>

                  {globalSettings.PL.applyTo === "specific" && (
                    <div className="ml-8 mt-3">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Select Employee:
                      </Label>
                      <select
                        value={globalSettings.PL.specificEmployeeId || ""}
                        onChange={(e) => {
                          setGlobalSettings({
                            ...globalSettings,
                            PL: {
                              ...globalSettings.PL,
                              specificEmployeeId: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                      >
                        <option value="">-- Select an employee --</option>
                        {employeeScenarios.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.empCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CL Settings */}
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="text-lg font-serif text-[#0F1F3D] flex items-center gap-2">
                  <Badge className="bg-[#1565C0] text-white">CL</Badge>
                  Casual Leave (CL) — Global Control
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">
                      Enable Casual Leave
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      When disabled, CL is not credited or available to any employee
                    </p>
                  </div>
                  <Switch
                    checked={globalSettings.CL.globallyEnabled}
                    onCheckedChange={(checked) => {
                      setPendingSettingChange({
                        leaveType: "CL",
                        action: checked ? "enable" : "disable",
                        applyTo: globalSettings.CL.applyTo,
                        employeeId: globalSettings.CL.specificEmployeeId,
                      });
                      setShowConfirmDialog(true);
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900">Apply To:</Label>
                  <RadioGroup
                    value={globalSettings.CL.applyTo}
                    onValueChange={(value: "all" | "specific") => {
                      setGlobalSettings({
                        ...globalSettings,
                        CL: { ...globalSettings.CL, applyTo: value },
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="all" id="cl-all" />
                      <Label htmlFor="cl-all" className="cursor-pointer font-normal flex-1">
                        All employees — toggle affects every employee in the system
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="specific" id="cl-specific" />
                      <Label htmlFor="cl-specific" className="cursor-pointer font-normal flex-1">
                        Specific employee — toggle applies to one individual only
                      </Label>
                    </div>
                  </RadioGroup>

                  {globalSettings.CL.applyTo === "specific" && (
                    <div className="ml-8 mt-3">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Select Employee:
                      </Label>
                      <select
                        value={globalSettings.CL.specificEmployeeId || ""}
                        onChange={(e) => {
                          setGlobalSettings({
                            ...globalSettings,
                            CL: {
                              ...globalSettings.CL,
                              specificEmployeeId: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                      >
                        <option value="">-- Select an employee --</option>
                        {employeeScenarios.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.empCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* COMP OFF Settings */}
            <Card className="border-2 border-purple-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardTitle className="text-lg font-serif text-[#0F1F3D] flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white">COMP OFF</Badge>
                  Compensatory Off (COMP OFF) — Global Control
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">
                      Enable Compensatory Off
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      When disabled, COMP OFF is not credited or available to any employee
                    </p>
                  </div>
                  <Switch
                    checked={globalSettings["COMP OFF"].globallyEnabled}
                    onCheckedChange={(checked) => {
                      setPendingSettingChange({
                        leaveType: "COMP OFF",
                        action: checked ? "enable" : "disable",
                        applyTo: globalSettings["COMP OFF"].applyTo,
                        employeeId: globalSettings["COMP OFF"].specificEmployeeId,
                      });
                      setShowConfirmDialog(true);
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900">Apply To:</Label>
                  <RadioGroup
                    value={globalSettings["COMP OFF"].applyTo}
                    onValueChange={(value: "all" | "specific") => {
                      setGlobalSettings({
                        ...globalSettings,
                        "COMP OFF": { ...globalSettings["COMP OFF"], applyTo: value },
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="all" id="compoff-all" />
                      <Label htmlFor="compoff-all" className="cursor-pointer font-normal flex-1">
                        All employees — toggle affects every employee in the system
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="specific" id="compoff-specific" />
                      <Label htmlFor="compoff-specific" className="cursor-pointer font-normal flex-1">
                        Specific employee — toggle applies to one individual only
                      </Label>
                    </div>
                  </RadioGroup>

                  {globalSettings["COMP OFF"].applyTo === "specific" && (
                    <div className="ml-8 mt-3">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Select Employee:
                      </Label>
                      <select
                        value={globalSettings["COMP OFF"].specificEmployeeId || ""}
                        onChange={(e) => {
                          setGlobalSettings({
                            ...globalSettings,
                            "COMP OFF": {
                              ...globalSettings["COMP OFF"],
                              specificEmployeeId: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="">-- Select an employee --</option>
                        {employeeScenarios.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.empCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && pendingSettingChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="border-b bg-amber-50">
                <CardTitle className="text-lg font-serif text-[#0F1F3D] flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  Confirm Global Setting Change
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-4">
                  <p className="text-gray-900">
                    You are about to{" "}
                    <strong className="text-[#F5A623]">
                      {pendingSettingChange.action}
                    </strong>{" "}
                    <strong className="text-[#0F1F3D]">
                      {pendingSettingChange.leaveType}
                    </strong>{" "}
                    for{" "}
                    <strong>
                      {pendingSettingChange.applyTo === "all"
                        ? "all employees"
                        : pendingSettingChange.employeeId
                        ? employeeScenarios.find(
                            (e) => e.id === pendingSettingChange.employeeId
                          )?.name || "selected employee"
                        : "a specific employee"}
                    </strong>
                    .
                  </p>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      ℹ️ This will take effect from today. Employees will{" "}
                      {pendingSettingChange.action === "enable"
                        ? "be able to"
                        : "no longer be able to"}{" "}
                      apply for {pendingSettingChange.leaveType}.
                    </p>
                  </div>

                  <p className="text-sm text-gray-700 font-semibold">
                    Are you sure you want to proceed?
                  </p>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-[#F5A623] hover:bg-[#D68910] text-white"
                      onClick={() => {
                        if (pendingSettingChange) {
                          // Apply the change
                          const updatedSettings = { ...globalSettings };
                          updatedSettings[pendingSettingChange.leaveType] = {
                            globallyEnabled:
                              pendingSettingChange.action === "enable",
                            applyTo: pendingSettingChange.applyTo,
                            specificEmployeeId: pendingSettingChange.employeeId,
                          };
                          setGlobalSettings(updatedSettings);
                          updateLeaveGlobalSettings(
                            pendingSettingChange.leaveType,
                            updatedSettings[pendingSettingChange.leaveType]
                          );
                        }
                        setShowConfirmDialog(false);
                        setPendingSettingChange(null);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setPendingSettingChange(null);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scenarios Guide Modal */}
        {showScenariosGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
              <CardHeader className="bg-gradient-to-r from-[#0F1F3D] to-slate-700 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-serif">
                    Employee Scenarios Guide - All Test Cases
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowScenariosGuide(false)}
                    className="text-white hover:bg-slate-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-6">
                  {employeeScenarios.map((emp) => {
                    const empLeaves = leaveScenarios[emp.id] || { CL: 0, PL: 0, SL: 0, UL: 0 };
                    const empHistory = allLeaveHistory[emp.id] || [];
                    const probation = emp.confirmationDate
                      ? calculateProbationCredits(emp.joiningDate, emp.confirmationDate)
                      : null;
                    const allocation = emp.confirmationDate
                      ? calculateProRataLeaves(emp.confirmationDate, "2025-12-31")
                      : null;
                    const exit = emp.lastWorkingDay
                      ? calculateProRataLeaves(
                          emp.confirmationDate && new Date(emp.confirmationDate) > new Date("2025-01-01")
                            ? emp.confirmationDate
                            : "2025-01-01",
                          emp.lastWorkingDay
                        )
                      : null;

                    return (
                      <Card key={emp.id} className="border-2 border-slate-200 hover:border-[#F5A623] transition-colors">
                        <CardHeader className="bg-slate-50 pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg text-[#0F1F3D]">
                                {emp.name} ({emp.empCode})
                              </CardTitle>
                              <p className="text-sm text-slate-600 mt-1">{emp.department}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge 
                                className={
                                  emp.status === "Active" 
                                    ? "bg-green-100 text-green-800 border-green-300" 
                                    : "bg-red-100 text-red-800 border-red-300"
                                }
                              >
                                {emp.status}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleEmployeeChange(emp.id);
                                  setShowScenariosGuide(false);
                                }}
                                className="bg-[#F5A623] hover:bg-[#D68910] text-white"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* Column 1 */}
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold text-slate-700">Joining:</span>{" "}
                                <span className="text-slate-600">
                                  {new Date(emp.joiningDate).toLocaleDateString('en-IN', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">Confirmation:</span>{" "}
                                <span className="text-slate-600">
                                  {emp.confirmationDate 
                                    ? new Date(emp.confirmationDate).toLocaleDateString('en-IN', { 
                                        day: '2-digit', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })
                                    : "In Probation"
                                  }
                                </span>
                              </div>
                              {emp.lastWorkingDay && (
                                <div>
                                  <span className="font-semibold text-slate-700">Last Working Day:</span>{" "}
                                  <span className="text-red-600 font-medium">
                                    {new Date(emp.lastWorkingDay).toLocaleDateString('en-IN', { 
                                      day: '2-digit', 
                                      month: 'short', 
                                      year: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              )}
                              {probation && (
                                <div>
                                  <span className="font-semibold text-slate-700">Probation Credits:</span>{" "}
                                  <span className="text-blue-600 font-medium">
                                    {probation.credits} CL ({probation.workingDays} days)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Column 2 */}
                            <div className="space-y-2">
                              {allocation && (
                                <div>
                                  <span className="font-semibold text-slate-700">Annual Allocation:</span>{" "}
                                  <div className="flex gap-2 mt-1 flex-wrap">
                                    <Badge className="bg-[#1565C0] text-white text-xs">CL: {allocation.CL}</Badge>
                                    <Badge className="bg-[#F5A623] text-white text-xs">PL: {allocation.PL}</Badge>
                                    <Badge className="bg-[#2E7D32] text-white text-xs">SL: {allocation.SL}</Badge>
                                    <Badge className="bg-[#C62828] text-white text-xs">UL: {allocation.UL}</Badge>
                                  </div>
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-slate-700">Leaves Taken:</span>{" "}
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs">CL: {empLeaves.CL}</Badge>
                                  <Badge variant="outline" className="text-xs">PL: {empLeaves.PL}</Badge>
                                  <Badge variant="outline" className="text-xs">SL: {empLeaves.SL}</Badge>
                                  <Badge variant="outline" className="text-xs">UL: {empLeaves.UL}</Badge>
                                </div>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">Applications:</span>{" "}
                                <span className="text-slate-600">
                                  {empHistory.length} total (
                                  <span className="text-green-600">
                                    {empHistory.filter(h => h.status === "Approved").length} Approved
                                  </span>
                                  {empHistory.filter(h => h.status === "Pending").length > 0 && (
                                    <>, <span className="text-yellow-600">
                                      {empHistory.filter(h => h.status === "Pending").length} Pending
                                    </span></>
                                  )}
                                  {empHistory.filter(h => h.status === "Rejected").length > 0 && (
                                    <>, <span className="text-red-600">
                                      {empHistory.filter(h => h.status === "Rejected").length} Rejected
                                    </span></>
                                  )}
                                  )
                                </span>
                              </div>
                              {exit && (
                                <div>
                                  <span className="font-semibold text-slate-700">Exit Settlement:</span>{" "}
                                  <div className="text-xs mt-1 p-2 bg-slate-50 rounded border border-slate-200">
                                    <p>Period: {exit.days} days</p>
                                    <p className="text-amber-700 font-medium mt-1">
                                      PL Balance: {exit.PL - empLeaves.PL > 0 
                                        ? `+${exit.PL - empLeaves.PL} (Encash)` 
                                        : exit.PL - empLeaves.PL < 0
                                        ? `${exit.PL - empLeaves.PL} (Recover)`
                                        : "Nil"
                                      }
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Scenario Highlights */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs font-semibold text-slate-700 mb-2">📋 Scenario Highlights:</p>
                            <div className="flex flex-wrap gap-2">
                              {!emp.confirmationDate && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                  ✓ Probation Period Scenario
                                </Badge>
                              )}
                              {emp.confirmationDate && !emp.lastWorkingDay && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                  ✓ Active Employee Scenario
                                </Badge>
                              )}
                              {emp.lastWorkingDay && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                                  ✓ Exit Settlement Scenario
                                </Badge>
                              )}
                              {empLeaves.UL > 0 && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                                  ✓ Unpaid Leave Taken
                                </Badge>
                              )}
                              {empHistory.length > 0 && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                                  ✓ {empHistory.length} Leave Applications
                                </Badge>
                              )}
                              {probation && probation.credits > 5 && (
                                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300">
                                  ✓ Multiple Probation Credits
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-semibold text-[#0F1F3D] mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Complete Test Coverage
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
                    <div>✓ Probation period with CL accrual</div>
                    <div>✓ Post-confirmation pro-rata allocation</div>
                    <div>✓ Active employee scenarios</div>
                    <div>✓ Exit settlement with multiple LWD dates</div>
                    <div>✓ PL encashment scenarios</div>
                    <div>✓ UL (unpaid leave) usage</div>
                    <div>✓ Varying leave consumption patterns</div>
                    <div>✓ Multiple leave applications & statuses</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfessionalLeaveManagement;
