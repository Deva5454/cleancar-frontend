/**
 * Comprehensive HR Module - Fully Functional
 * Rebuild: Cache cleared
 */
import React, { useState, useEffect, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { 
  Users, UserPlus, Calendar, DollarSign, 
  FileText, CheckCircle, XCircle, Download,
  Upload, Clock, AlertCircle, Award, TrendingUp,
  Search, Filter, Eye, Edit, Briefcase, GraduationCap,
  UserCheck, UserMinus, Building, Phone, Mail, Home,
  CreditCard, ShieldCheck, BookOpen, Activity, Plus, Shield, Settings
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import { BackButton } from "../ui/back-button";
import { calculateProrateSalary, getLeaveBalance, ANNUAL_LEAVE_QUOTA } from "../../lib/leaveManagement";
import { MASTER_EMPLOYEES, requiredDocuments, type Employee } from "../../data/employeeData";
import { salaryStructureService } from "../../services/salaryStructureService";
// Static import — HRModule is already the lazy boundary (lazy in routes.tsx)
// Nested React.lazy inside a lazy chunk causes ES module circular init crash
import { EmployeeAttendanceDrillDown } from "../hr/EmployeeAttendanceDrillDown";
import { offerLetterService } from "../../services/offerLetterService";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";

// ✅ PERF FIX: Removed module-level getAll() call.
// getAll() was executing at JS parse time AND inside useState, causing two synchronous
// localStorage JSON.parse calls before the component even mounted.
// liveEmployeeList inside the component now handles the single initialisation.

// Payroll Interface
interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role?: string;
  month: string;
  baseSalary: number;
  daysWorked: number;
  totalDays: number;
  isProrateApplicable: boolean;
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    incentive: number;
    overtimePay: number;
    nationalHolidayPay: number;
    grossEarnings: number;
  };
  deductions: {
    pf: number;
    esi: number;
    professionalTax: number;
    tds: number;
    advance: number;
    totalDeductions: number;
  };
  leaveDeductions: number;
  leaveDays?: {
    CL: number;
    PL: number;
    SL: number;
    UL: number;
  };
  netSalary: number;
  status: "Draft" | "Draft" | "Approved" | "Paid";
  paidOn?: string;
}

// Mock Payroll Data - March 2026 with Leave Management Integration
// Salary Structure: Gross-based calculation matching Payroll Configuration
// ✅ H06 FIX: Removed hardcoded mockPayroll — payroll data comes from usePayroll() context

// Recruitment Pipeline
interface Recruitment {
  id: string;
  positionTitle: string;
  department: string;
  openings: number;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "On Hold" | "Closed";
  applicants: number;
  shortlisted: number;
  interviewed: number;
  offered: number;
  joined: number;
  postedDate: string;
  closingDate: string;
}

const mockRecruitment: Recruitment[] = [
  {
    id: "REC-001",
    positionTitle: "Car Washer",
    department: "Operations",
    openings: 5,
    priority: "High",
    status: "Open",
    applicants: 24,
    shortlisted: 12,
    interviewed: 8,
    offered: 3,
    joined: 0,
    postedDate: "2026-02-15",
    closingDate: "2026-03-15",
  },
  {
    id: "REC-002",
    positionTitle: "Tele Sales Executive",
    department: "Sales",
    openings: 3,
    priority: "Medium",
    status: "In Progress",
    applicants: 18,
    shortlisted: 8,
    interviewed: 5,
    offered: 2,
    joined: 1,
    postedDate: "2026-02-01",
    closingDate: "2026-03-01",
  },
];

// Training Programs
interface Training {
  id: string;
  programName: string;
  category: "Technical" | "Soft Skills" | "Safety" | "Product" | "Compliance";
  duration: string;
  trainer: string;
  scheduledDate: string;
  participants: number;
  status: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";
  completionRate?: number;
}

const mockTraining: Training[] = [
  {
    id: "TRN-001",
    programName: "Advanced Car Washing Techniques",
    category: "Technical",
    duration: "2 Days",
    trainer: "External Vendor",
    scheduledDate: "2026-03-10",
    participants: 15,
    status: "Scheduled",
  },
  {
    id: "TRN-002",
    programName: "Customer Service Excellence",
    category: "Soft Skills",
    duration: "1 Day",
    trainer: "Prakash Mehta",
    scheduledDate: "2026-02-28",
    participants: 12,
    status: "Completed",
    completionRate: 92,
  },
];

function HRModule() {
  const { payrollRuns = [] } = useEmployeeData(); // default [] prevents undefined crash
  const { currentRole, roleConfig } = useRole();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  // Reactive employee list — updates when employeeDatabaseService changes
  const [liveEmployeeList, setLiveEmployeeList] = useState(() => {
    const live = employeeDatabaseService.getAll();
    return live.length > 0
      ? live.map(e => ({
          ...e,
          name: e.fullName || (e.firstName + " " + e.lastName),
          empCode: e.empCode || e.employeeId || e.id || e.tempId,
          role: e.designation || (e as any).role || "Employee",
          status: e.status || "Active"
        }))
      : MASTER_EMPLOYEES;
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  
  // State for attendance drill-down
  const [showAttendanceDrillDown, setShowAttendanceDrillDown] = useState(false);
  const [selectedEmployeeForDrillDown, setSelectedEmployeeForDrillDown] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Badge counts for quick action cards
  const [badgeCounts, setBadgeCounts] = useState({
    lettersDocuments: 0,
    lifecycleManagement: 0,
    idCardGenerator: 0,
    leaveManagement: 0,
    payrollConfiguration: 0,
  });

  const canSeeFinancials = roleConfig.canSeeFinancials;
  const isHRorAdmin = ["HR", "Super Admin", "Admin"].includes(currentRole);

  // Calculate badge counts for quick action cards
  useEffect(() => {
    const calculateBadgeCounts = () => {
      const today = new Date();

      // 1. Letters & Documents: Offer letters (Pending Approval) + Appointment letters (Pending Approval) + Confirmation letters (due within 30 days)
      const offerLetters = offerLetterService.getAll();
      const pendingOfferApprovals = offerLetters.filter(offer => offer.status === "Draft").length;

      // Hardcoded appointment letters data - count Pending Approval
      const pendingAppointmentApprovals = 2; // Based on hardcoded initialAppointments in AppointmentLetterGenerator

      // Confirmation letters due within 30 days - employees whose probation ends within 30 days
      const employees = employeeDatabaseService.getAll();
      const confirmationsWithin30Days = employees.filter(emp => {
        if (emp.status !== "Active" || emp.employmentStage === "Not Converted") return false;

        const probationMonths = emp.probationPeriod.match(/(\d+)\s*month/i);
        const months = probationMonths ? parseInt(probationMonths[1], 10) : 3;

        const joiningDate = new Date(emp.dateOfJoining);
        const probationEndDate = new Date(joiningDate);
        probationEndDate.setMonth(probationEndDate.getMonth() + months);

        const daysUntilProbationEnd = Math.ceil((probationEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return daysUntilProbationEnd >= 0 && daysUntilProbationEnd <= 30 && !emp.confirmationDate;
      }).length;

      const lettersDocumentsCount = pendingOfferApprovals + pendingAppointmentApprovals + confirmationsWithin30Days;

      // 2. Lifecycle Management: Employees in TEMP status whose 7-day conversion deadline expires within 2 days
      const lifecycleCount = employees.filter(emp => {
        if (emp.employmentStage !== "Temporary") return false;

        const tempAssignedDate = new Date(emp.tempIdAssignedDate);
        const conversionDeadline = new Date(tempAssignedDate);
        conversionDeadline.setDate(conversionDeadline.getDate() + 7);

        const daysUntilDeadline = Math.ceil((conversionDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return daysUntilDeadline >= 0 && daysUntilDeadline <= 2;
      }).length;

      // 3. ID Card Generator: Confirmed employees without ID cards (assume all confirmed employees need ID cards)
      const idCardCount = employees.filter(emp => emp.confirmationDate).length;

      // 4. Leave Management: Pending leave approval requests (no service available, using placeholder)
      const leaveCount = 0; // TODO: Implement when leave approval service is available

      // 5. Payroll Configuration: Employees with no salary structure assigned
      const salaryStructures = salaryStructureService.getAll();
      const payrollCount = employees.filter(emp => {
        // Check if employee's designation matches any salary structure
        const hasMatchingStructure = salaryStructures.some(structure =>
          structure.roleName.toLowerCase() === emp.designation.toLowerCase() ||
          structure.roleName.toLowerCase().includes(emp.designation.toLowerCase()) ||
          emp.designation.toLowerCase().includes(structure.roleName.toLowerCase())
        );
        return !hasMatchingStructure;
      }).length;

      setBadgeCounts({
        lettersDocuments: lettersDocumentsCount,
        lifecycleManagement: lifecycleCount,
        idCardGenerator: idCardCount,
        leaveManagement: leaveCount,
        payrollConfiguration: payrollCount,
      });
    };

    // ✅ PERF FIX: Defer badge count — let the page paint first
    // Badge counts are non-critical UI enhancements; blocking the render for them
    // is what causes the spinner on every HR page visit.
    setTimeout(calculateBadgeCounts, 0);

    // Subscribe to employee database changes — update badge counts AND employee list
    const unsubscribe = employeeDatabaseService.subscribe((updatedEmployees) => {
      calculateBadgeCounts();
      const mapped = updatedEmployees.length > 0
        ? updatedEmployees.map(e => ({
            ...e,
            name: e.fullName || (e.firstName + " " + e.lastName),
            empCode: e.empCode || e.employeeId || e.id || e.tempId,
            role: e.designation || (e as any).role || "Employee",
            status: e.status || "Active"
          }))
        : MASTER_EMPLOYEES;
      setLiveEmployeeList(mapped);
    });

    return unsubscribe;
  }, []);

  // Filter employees based on search
  const filteredEmployees = liveEmployeeList.filter(emp =>
    (emp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.empCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((emp as any).role || (emp as any).designation || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmployees = liveEmployeeList.length;
  const activeEmployees = liveEmployeeList.filter(e => e.status === "Active").length;
  const onLeave = liveEmployeeList.filter(e => e.status === "On Leave").length;
  const inNoticePeriod = liveEmployeeList.filter(e => e.status === "Notice Period").length;

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Management System</h1>
          <p className="text-sm text-gray-500 mt-1">Complete HR lifecycle management - Surat Operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          {isHRorAdmin && (
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/hr/lifecycle-management")}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Employee
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold mt-1">{totalEmployees}</p>
                <p className="text-xs text-green-600 mt-1">+3 this month</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold mt-1">{activeEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">Working today</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-2xl font-bold mt-1">{onLeave}</p>
                <p className="text-xs text-orange-600 mt-1">Today</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Notice Period</p>
                <p className="text-2xl font-bold mt-1">{inNoticePeriod}</p>
                <p className="text-xs text-gray-500 mt-1">Processing exit</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <UserMinus className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {canSeeFinancials && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Monthly Payroll</p>
                  <p className="text-2xl font-bold mt-1">₹{((payrollRuns || []).reduce((s, p) => s + (p.netSalary||0), 0) / 100000).toFixed(2)}L</p>
                  <p className="text-xs text-gray-500 mt-1">March 2026</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Access - Enhanced HR Modules */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">🚀 Enhanced HR Features - Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Consolidated Core Modules - No Duplication */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Lifecycle Management */}
            <Link to="/hr/lifecycle-management" className="relative">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-24 flex flex-col items-center justify-center gap-2">
                <Users className="w-7 h-7" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Lifecycle Management</div>
                  <div className="text-xs opacity-90">Offer → Onboarding → Exit → F&F</div>
                </div>
              </Button>
              {badgeCounts.lifecycleManagement > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {badgeCounts.lifecycleManagement}
                </div>
              )}
            </Link>

            {/* 2. Letters & Documents */}
            <Link to="/hr/letters-documents" className="relative">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-24 flex flex-col items-center justify-center gap-2">
                <FileText className="w-7 h-7" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Letters & Documents</div>
                  <div className="text-xs opacity-90">Offer, Appointment, Confirmation</div>
                </div>
              </Button>
              {badgeCounts.lettersDocuments > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {badgeCounts.lettersDocuments}
                </div>
              )}
            </Link>

            {/* 3. Leave Management */}
            <Link to="/hr/professional-leave" className="relative">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 h-24 flex flex-col items-center justify-center gap-2">
                <Calendar className="w-7 h-7" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Leave Management</div>
                  <div className="text-xs opacity-90">CL/PL/SL/UL + Policy + Holidays</div>
                </div>
              </Button>
              {badgeCounts.leaveManagement > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {badgeCounts.leaveManagement}
                </div>
              )}
            </Link>

            {/* 4. Payroll Configuration */}
            <Link to="/payroll/configuration" className="relative">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-24 flex flex-col items-center justify-center gap-2">
                <Award className="w-7 h-7" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Payroll Configuration</div>
                  <div className="text-xs opacity-90">Salary + PF/ESIC + Statutory</div>
                </div>
              </Button>
              {badgeCounts.payrollConfiguration > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {badgeCounts.payrollConfiguration}
                </div>
              )}
            </Link>

            {/* 5. ID Card Generator */}
            <Link to="/hr/id-card-generator" className="relative">
              <Button className="w-full bg-green-600 hover:bg-green-700 h-24 flex flex-col items-center justify-center gap-2">
                <CreditCard className="w-7 h-7" />
                <div className="text-center">
                  <div className="font-semibold text-sm">ID Card Generator</div>
                  <div className="text-xs opacity-90">Design & Print Employee ID</div>
                </div>
              </Button>
              {badgeCounts.idCardGenerator > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {badgeCounts.idCardGenerator}
                </div>
              )}
            </Link>

            {/* 6. Holiday Management */}
            <Link to="/hr/holiday-management">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 h-24 flex flex-col items-center justify-center gap-2">
                <Calendar className="w-7 h-7" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Holiday Management</div>
                  <div className="text-xs opacity-90">Public Holidays & Calendar</div>
                </div>
              </Button>
            </Link>

            {/* 7. Lifecycle Reports */}
            <Link to="/hr/lifecycle-reports">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 h-24 flex flex-col items-center justify-center gap-2">
                <Activity className="w-7 h-7" />
                <div className="text-center">
                  <div className="font-semibold text-sm">Lifecycle Reports</div>
                  <div className="text-xs opacity-90">Employee Journey Analytics</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="exit">Exit Process</TabsTrigger>
        </TabsList>

        {/* Employee Master Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Employee Master Database</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.empCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{emp.role}</Badge>
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>
                        <p className="text-sm">{emp.phone}</p>
                        {emp.cluster && <p className="text-xs text-gray-500">{emp.cluster}</p>}
                      </TableCell>
                      <TableCell>{new Date(emp.joiningDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{emp.workingHours}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          emp.status === "Active" ? "secondary" :
                          emp.status === "On Leave" ? "default" :
                          emp.status === "Notice Period" ? "destructive" :
                          "outline"
                        }>
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Employee Detail View */}
          {selectedEmployee && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Employee Details - {selectedEmployee.name}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedEmployee(null)}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500">Employee Code</p>
                        <p className="font-medium">{selectedEmployee.empCode}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date of Birth</p>
                        <p className="font-medium">{new Date(selectedEmployee.dateOfBirth).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Blood Group</p>
                        <p className="font-medium">{selectedEmployee.bloodGroup}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Emergency Contact</p>
                        <p className="font-medium">{selectedEmployee.emergencyContact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-600" />
                      Employment Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500">Department</p>
                        <p className="font-medium">{selectedEmployee.department}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Reporting To</p>
                        <p className="font-medium">{selectedEmployee.reportingTo}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Working Hours</p>
                        <p className="font-medium">{selectedEmployee.workingHours}</p>
                      </div>
                      {canSeeFinancials && (
                        <div>
                          <p className="text-gray-500">Base Salary</p>
                          <p className="font-medium">₹{(selectedEmployee?.baseSalary ?? 0).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statutory Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      Statutory Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500">PAN</p>
                        <p className="font-medium">{selectedEmployee.pan}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Aadhaar</p>
                        <p className="font-medium">{selectedEmployee.aadhaar}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">PF Number</p>
                        <p className="font-medium">{selectedEmployee.pfNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ESI Number</p>
                        <p className="font-medium">{selectedEmployee.esiNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-orange-600" />
                    Address
                  </h4>
                  <p className="text-sm">{selectedEmployee.address}</p>
                </div>

                {/* Document Status */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">Document Verification Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(selectedEmployee.documents || []).map((doc, idx) => (
                      <div key={idx} className={`p-2 rounded border ${
                        doc.status === "Verified" ? "bg-green-50 border-green-200" :
                        doc.status === "Pending" ? "bg-orange-50 border-orange-200" :
                        "bg-red-50 border-red-200"
                      }`}>
                        <p className="text-xs font-medium">{doc.name}</p>
                        <Badge variant={
                          doc.status === "Verified" ? "secondary" :
                          doc.status === "Pending" ? "default" :
                          "destructive"
                        } className="text-xs mt-1">
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Management Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Management & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-gray-600">Fully Compliant</p>
                    <p className="text-2xl font-bold text-green-600">12</p>
                    <p className="text-xs text-gray-500 mt-1">All documents verified</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <p className="text-sm text-gray-600">Pending Verification</p>
                    <p className="text-2xl font-bold text-orange-600">5</p>
                    <p className="text-xs text-gray-500 mt-1">Documents under review</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <p className="text-sm text-gray-600">Missing Documents</p>
                    <p className="text-2xl font-bold text-red-600">3</p>
                    <p className="text-xs text-gray-500 mt-1">Action required</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Required Documents Checklist</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {requiredDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium">{doc}</span>
                        </div>
                        <Badge variant="outline">Mandatory</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Missing</TableHead>
                      <TableHead>Compliance %</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // mockEmployees was undefined — read from real employee service
                      const liveEmps: any[] = (() => {
                        try { return JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]"); }
                        catch { return []; }
                      })();
                      return liveEmps;
                    })().map((emp: any) => {
                      const docs = emp.documents || [];
                      const verified = docs.filter(d => d.status === "Verified").length;
                      const pending = docs.filter(d => d.status === "Pending").length;
                      const missing = requiredDocuments.length - docs.length;
                      const compliance = Math.round((verified / requiredDocuments.length) * 100);

                      return (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.fullName || emp.name || emp.id}</TableCell>
                          <TableCell><Badge variant="outline">{emp.designation || emp.role || "—"}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="secondary">{verified}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">{pending}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{missing}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    compliance >= 80 ? "bg-green-600" :
                                    compliance >= 50 ? "bg-orange-600" :
                                    "bg-red-600"
                                  }`}
                                  style={{ width: `${compliance}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{compliance}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Upload className="w-4 h-4 mr-1" />
                              Upload
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Management Tab */}
        <TabsContent value="payroll" className="space-y-4">
          {/* HR Access Banner */}
          {isHRorAdmin && (
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">HR Payroll Access Enabled</p>
                    <p className="text-sm text-blue-100">
                      You can view all employee payroll data including salaries, deductions, and leave impacts. Navigate to{" "}
                      <Link to="/payroll/configuration" className="underline font-semibold">
                        Payroll Configuration System
                      </Link>{" "}
                      for advanced salary management.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Payroll Management - March 2026</CardTitle>
                {canSeeFinancials && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Payslips
                    </Button>
                    <Button size="sm">Process Payroll</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {canSeeFinancials ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Gross Payroll</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{(payrollRuns || []).reduce((s, p) => s + (p.grossSalary||0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₹{(payrollRuns || []).reduce((s, p) => s + (p.totalDeductions||0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Net Payroll</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{(payrollRuns || []).reduce((s, p) => s + (p.netSalary||0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Pending Approval</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {(payrollRuns || []).filter(p => p.status === "Draft" || p.status === "HR Approved").length}
                      </p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Emp Code</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Name
                            <span className="text-xs text-blue-600 font-normal">(Click for attendance)</span>
                          </div>
                        </TableHead>
                        <TableHead>Days Worked</TableHead>
                        <TableHead>Leaves Taken</TableHead>
                        <TableHead>Gross Earnings</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payrollRuns || []).map((payroll) => (
                        <TableRow key={payroll.payrollId || payroll.employeeId}>
                          <TableCell className="font-medium">{payroll.employeeId}</TableCell>
                          <TableCell>
                            <div>
                              <p 
                                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                onClick={() => {
                                  setSelectedEmployeeForDrillDown({
                                    id: payroll.employeeId,
                                    name: payroll.employeeId,
                                  });
                                  setShowAttendanceDrillDown(true);
                                }}
                                title="Click to view detailed attendance report"
                              >
                                {payroll.employeeId}
                              </p>
                              
                            </div>
                          </TableCell>
                          <TableCell>
                            {(payroll as any).daysWorked ?? (payroll.status === "disbursed" || payroll.status === "Paid" ? 26 : "—")}/26
                            {false && (
                              <Badge variant="outline" className="ml-2 text-xs">Pro-rata</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {(payroll as any).leaveDays ? (
                              <div className="flex gap-1 flex-wrap">
                                {(payroll as any).leaveDays?.CL > 0 && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-1">
                                    CL:{(payroll as any).leaveDays?.CL}
                                  </Badge>
                                )}
                                {(payroll as any).leaveDays?.PL > 0 && (
                                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-1">
                                    PL:{(payroll as any).leaveDays?.PL}
                                  </Badge>
                                )}
                                {(payroll as any).leaveDays?.SL > 0 && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-1">
                                    SL:{(payroll as any).leaveDays?.SL}
                                  </Badge>
                                )}
                                {(payroll as any).leaveDays?.UL > 0 && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs px-1">
                                    UL:{(payroll as any).leaveDays?.UL}⚠️
                                  </Badge>
                                )}
                                {(payroll as any).leaveDays?.CL === 0 && (payroll as any).leaveDays?.PL === 0 && 
                                 (payroll as any).leaveDays?.SL === 0 && (payroll as any).leaveDays?.UL === 0 && (
                                  <span className="text-xs text-gray-400">None</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            ₹{(payroll?.grossSalary ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-red-600">
                                ₹{((payroll.totalDeductions || 0) + ((payroll as any).leaveDeductions || 0)).toLocaleString()}
                              </p>
                              {((payroll as any).leaveDeductions || 0) > 0 && (
                                <p className="text-xs text-red-500">
                                  (UL: -₹{(payroll as any).leaveDeductions || 0})
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">
                            ₹{(payroll?.netSalary ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              payroll.status === "Paid" ? "secondary" :
                              payroll.status === "Approved" ? "default" :
                              "outline"
                            }>
                              {payroll.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedPayslip(payroll as any);
                                setShowPayslipModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Slip
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Detailed Payslip View */}
                  <div className="mt-6 p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-bold mb-4">Sample Payslip Breakdown - {payrollRuns[0]?.employeeId || 'Employee'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg">
                        <h5 className="font-semibold text-green-600 mb-3">Earnings</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Basic Salary</span>
                            <span className="font-medium">₹{(payrollRuns[0]?.baseSalary || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HRA (40%)</span>
                            <span className="font-medium">₹{(0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Conveyance</span>
                            <span className="font-medium">₹{(0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Incentive</span>
                            <span className="font-medium">₹{(payrollRuns[0]?.incentiveAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overtime Pay</span>
                            <span className="font-medium">₹{(0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>National Holiday Pay (2x)</span>
                            <span className="font-medium">₹{(0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-bold text-green-600">
                            <span>Gross Earnings</span>
                            <span>₹{(payrollRuns[0]?.grossSalary || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg">
                        <h5 className="font-semibold text-red-600 mb-3">Deductions</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>PF (12%)</span>
                            <span className="font-medium">₹{(payrollRuns[0]?.pf || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ESI</span>
                            <span className="font-medium">₹{(payrollRuns[0]?.esic || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Professional Tax</span>
                            <span className="font-medium">₹{(0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>TDS</span>
                            <span className="font-medium">₹{(payrollRuns[0]?.tds || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Advance</span>
                            <span className="font-medium">₹{(payrollRuns[0]?.advances || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Leave Deduction</span>
                            <span className="font-medium">₹{(0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-bold text-red-600">
                            <span>Total Deductions</span>
                            <span>₹{(payrollRuns[0]?.totalDeductions || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded border-2 border-blue-300">
                          <div className="flex justify-between font-bold text-blue-600">
                            <span>Net Salary</span>
                            <span>₹{(payrollRuns[0]?.netSalary || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leave Balance on Payslip */}
                    <div className="mt-4 bg-white p-4 rounded-lg">
                      <h5 className="font-semibold mb-3">Leave Balance (As of Feb 2026)</h5>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-600">Casual Leave</p>
                          <p className="text-lg font-bold text-blue-600">4/6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Sick Leave</p>
                          <p className="text-lg font-bold text-green-600">5/6</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Paid Leave</p>
                          <p className="text-lg font-bold text-purple-600">8/12</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600">Total Used</p>
                          <p className="text-lg font-bold text-orange-600">4 days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view financial information</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance & Time Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Present Today</p>
                  <p className="text-2xl font-bold text-green-600">42</p>
                  <p className="text-xs text-gray-500">94% attendance</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">On Leave</p>
                  <p className="text-2xl font-bold text-orange-600">2</p>
                  <p className="text-xs text-gray-500">Approved leaves</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">1</p>
                  <p className="text-xs text-gray-500">Without notice</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Late Arrivals</p>
                  <p className="text-2xl font-bold text-blue-600">3</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Late Reporting Alerts (Today)</p>
                    <div className="mt-2 space-y-2">
                      <div className="text-sm">
                        <p className="font-medium">Ramesh Singh (Car Washer) - Absent without notice</p>
                        <p className="text-xs text-gray-600">Expected: 04:00 AM | No check-in recorded</p>
                        <Badge variant="destructive" className="mt-1">Escalated to entire chain</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Employee
                        <span className="text-xs text-blue-600 font-normal">(Click for drill-down)</span>
                      </div>
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Scheduled Time</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell 
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                      onClick={() => {
                        setSelectedEmployeeForDrillDown({
                          id: "CW-101",
                          name: "Rahul Verma",
                        });
                        setShowAttendanceDrillDown(true);
                      }}
                      title="Click to view detailed attendance report"
                    >
                      Rahul Verma
                    </TableCell>
                    <TableCell><Badge variant="outline">Car Washer</Badge></TableCell>
                    <TableCell>04:00-09:00</TableCell>
                    <TableCell className="text-green-600">04:02 AM</TableCell>
                    <TableCell className="text-green-600">09:05 AM</TableCell>
                    <TableCell>5h 3m</TableCell>
                    <TableCell><Badge variant="secondary">Present</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell 
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                      onClick={() => {
                        setSelectedEmployeeForDrillDown({
                          id: "SUP-201",
                          name: "Suresh Yadav",
                        });
                        setShowAttendanceDrillDown(true);
                      }}
                      title="Click to view detailed attendance report"
                    >
                      Suresh Yadav
                    </TableCell>
                    <TableCell><Badge variant="outline">Supervisor</Badge></TableCell>
                    <TableCell>04:00-09:00</TableCell>
                    <TableCell className="text-orange-600">04:12 AM</TableCell>
                    <TableCell className="text-green-600">09:00 AM</TableCell>
                    <TableCell>4h 48m</TableCell>
                    <TableCell><Badge variant="default">Late (12 min)</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell 
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                      onClick={() => {
                        setSelectedEmployeeForDrillDown({
                          id: "TSE-301",
                          name: "Neha Singh",
                        });
                        setShowAttendanceDrillDown(true);
                      }}
                      title="Click to view detailed attendance report"
                    >
                      Neha Singh
                    </TableCell>
                    <TableCell><Badge variant="outline">TSE</Badge></TableCell>
                    <TableCell>10:00-19:00</TableCell>
                    <TableCell className="text-green-600">09:58 AM</TableCell>
                    <TableCell className="text-gray-400">—</TableCell>
                    <TableCell className="text-blue-600">Working</TableCell>
                    <TableCell><Badge variant="secondary">Present</Badge></TableCell>
                  </TableRow>
                  <TableRow className="bg-red-50">
                    <TableCell 
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                      onClick={() => {
                        setSelectedEmployeeForDrillDown({
                          id: "CW-102",
                          name: "Ramesh Singh",
                        });
                        setShowAttendanceDrillDown(true);
                      }}
                      title="Click to view detailed attendance report"
                    >
                      Ramesh Singh
                    </TableCell>
                    <TableCell><Badge variant="outline">Car Washer</Badge></TableCell>
                    <TableCell>04:00-09:00</TableCell>
                    <TableCell className="text-red-600">—</TableCell>
                    <TableCell className="text-red-600">—</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell><Badge variant="destructive">Absent</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recruitment Tab */}
        <TabsContent value="recruitment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recruitment Pipeline</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Position
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Open Positions</p>
                  <p className="text-2xl font-bold text-blue-600">8</p>
                  <p className="text-xs text-gray-500">Across all departments</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Applicants</p>
                  <p className="text-2xl font-bold text-green-600">42</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">In Interview</p>
                  <p className="text-2xl font-bold text-purple-600">13</p>
                  <p className="text-xs text-gray-500">Various stages</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Offers Made</p>
                  <p className="text-2xl font-bold text-orange-600">5</p>
                  <p className="text-xs text-gray-500">Awaiting acceptance</p>
                </div>
              </div>

              <div className="space-y-4">
                {mockRecruitment.map((rec) => (
                  <div key={rec.id} className="p-4 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{rec.positionTitle}</h4>
                          <Badge variant={rec.priority === "High" ? "destructive" : "default"}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{rec.department} | {rec.openings} openings</p>
                        <p className="text-xs text-gray-500">Posted: {new Date(rec.postedDate).toLocaleDateString()} | Closes: {new Date(rec.closingDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{rec.applicants}</p>
                        <p className="text-xs text-gray-600">Applicants</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{rec.shortlisted}</p>
                        <p className="text-xs text-gray-600">Shortlisted</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{rec.interviewed}</p>
                        <p className="text-xs text-gray-600">Interviewed</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{rec.offered}</p>
                        <p className="text-xs text-gray-600">Offered</p>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <p className="text-2xl font-bold text-indigo-600">{rec.joined}</p>
                        <p className="text-xs text-gray-600">Joined</p>
                      </div>
                    </div>

                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(rec.joined / rec.openings) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-gray-600 mt-1">
                      {rec.joined} of {rec.openings} positions filled
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Training & Development</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Training
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Programs This Month</p>
                  <p className="text-2xl font-bold text-blue-600">5</p>
                  <p className="text-xs text-gray-500">March 2026</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="text-2xl font-bold text-green-600">38</p>
                  <p className="text-xs text-gray-500">Enrolled</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">89%</p>
                  <p className="text-xs text-gray-500">Last quarter</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Training Hours</p>
                  <p className="text-2xl font-bold text-orange-600">156</p>
                  <p className="text-xs text-gray-500">This year</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTraining.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">{training.programName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{training.category}</Badge>
                      </TableCell>
                      <TableCell>{training.duration}</TableCell>
                      <TableCell>{training.trainer}</TableCell>
                      <TableCell>{new Date(training.scheduledDate).toLocaleDateString()}</TableCell>
                      <TableCell>{training.participants}</TableCell>
                      <TableCell>
                        <Badge variant={
                          training.status === "Completed" ? "secondary" :
                          training.status === "Ongoing" ? "default" :
                          "outline"
                        }>
                          {training.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exit Process Tab */}
        <TabsContent value="exit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exit Clearance & F&F Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 border-2 border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg">Manoj Singh</h4>
                      <Badge variant="outline" className="mt-1">Car Washer</Badge>
                      <p className="text-sm text-gray-600 mt-2">Last Working Day: February 28, 2026</p>
                      <p className="text-xs text-gray-500">Reason: Better Opportunity</p>
                    </div>
                    <Badge variant="default">In Progress</Badge>
                  </div>

                  {/* Exit Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <h5 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Asset Return Checklist
                      </h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">Company ID Card</span>
                          <Badge variant="secondary">Returned</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">Uniform (2 sets)</span>
                          <Badge variant="secondary">Returned</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                          <span className="text-sm">Cleaning Equipment</span>
                          <Badge variant="default">Pending</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">Mobile Device</span>
                          <Badge variant="secondary">Returned</Badge>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-medium">Reporting Manager Confirmation</p>
                        <p className="text-xs text-gray-600 mt-1">Ramesh Vora (Supervisor)</p>
                        <Badge variant="default" className="mt-2">Awaiting Confirmation</Badge>
                      </div>
                    </div>

                    {canSeeFinancials && (
                      <div className="bg-white p-4 rounded-lg">
                        <h5 className="font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          F&F Settlement
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>February Salary (Pro-rata)</span>
                            <span className="font-medium">₹14,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Leave Encashment (3 days)</span>
                            <span className="font-medium">₹1,500</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending Incentives</span>
                            <span className="font-medium">₹800</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Notice Period Recovery</span>
                            <span className="font-medium">-₹3,000</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Advance Recovery</span>
                            <span className="font-medium">-₹500</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-bold text-green-600">
                            <span>Final Settlement</span>
                            <span>₹12,800</span>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium">Settlement Status</p>
                          <Badge variant="default" className="mt-2">Pending Accounts Approval</Badge>
                          <Button size="sm" className="w-full mt-3">
                            Approve Settlement
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <h5 className="font-semibold mb-3">Exit Interview Notes</h5>
                    <p className="text-sm text-gray-700">Employee cited better growth opportunities. Performance was satisfactory. Expressed positive experience with the team.</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Clearance Form
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Experience Letter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payslip Modal */}
      <Dialog open={showPayslipModal} onOpenChange={setShowPayslipModal}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Payslip - {selectedPayslip?.employeeName} ({selectedPayslip?.month})
            </DialogTitle>
            <DialogDescription>
              View detailed salary breakdown and leave balance for the selected month
            </DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-6">
              {/* Company Header */}
              <div className="text-center border-b-2 pb-4">
                <h2 className="text-xl font-bold">Surat Car Wash Services</h2>
                <p className="text-sm text-gray-600">Salary Slip for the month of {new Date(selectedPayslip.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
              </div>

              {/* Employee Details */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Employee Name</p>
                  <p className="font-semibold">{(selectedPayslip as any).employeeName || (selectedPayslip as any).employeeId || "Employee"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee ID</p>
                  <p className="font-semibold">{selectedPayslip.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Designation</p>
                  <p className="font-semibold">{(selectedPayslip as any).role || (selectedPayslip as any).employeeId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pay Period</p>
                  <p className="font-semibold">{new Date(selectedPayslip.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Days Worked</p>
                  <p className="font-semibold">{(selectedPayslip as any).daysWorked ?? (selectedPayslip?.status === "disbursed" ? 26 : "—")} / {(selectedPayslip as any).totalDays || 26}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <Badge variant={selectedPayslip.status === "Paid" ? "secondary" : "default"}>
                    {selectedPayslip.status}
                  </Badge>
                </div>
              </div>

              {/* CTC Information from Payroll Configuration */}
              {(() => {
                // Find saved salary structure for this role
                const allStructures = salaryStructureService.getAll();
                const matchingStructure = allStructures.find(s => 
                  s.roleName.toLowerCase().includes(((selectedPayslip as any).role?.toLowerCase() || "") || '') ||
                  ((selectedPayslip as any).role?.toLowerCase() || "").includes(s.roleName.toLowerCase())
                );

                if (matchingStructure) {
                  const { components } = matchingStructure;
                  return (
                    <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Cost to Company (CTC) - {matchingStructure.roleName}
                        </h4>
                        <Badge className="bg-purple-600">
                          From Payroll Configuration
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded">
                          <p className="text-gray-600">Monthly Gross</p>
                          <p className="text-xl font-bold text-purple-900">₹{(components?.monthlyGross ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-gray-600">Annual CTC</p>
                          <p className="text-xl font-bold text-purple-900">₹{(components?.annualCTC ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-gray-600">Employee PF</p>
                          <p className="font-semibold">₹{(components?.employeePF ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Employer PF</p>
                          <p className="font-semibold">₹{(components?.employerPF ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total CTC/Month</p>
                          <p className="font-semibold text-purple-700">₹{(components?.totalCTC ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                      {components.employeeESIC > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-600">Employee ESIC</p>
                            <p className="font-semibold">₹{(components?.employeeESIC ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Employer ESIC</p>
                            <p className="font-semibold">₹{(components?.employerESIC ?? 0).toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-700" />
                        <div>
                          <p className="font-semibold text-yellow-900">No Salary Structure Defined</p>
                          <p className="text-sm text-yellow-700">
                            No salary structure found for "{selectedPayslip.role}". Please create a salary structure in{" "}
                            <Link to="/payroll/create-salary-structure" className="underline font-semibold">
                              Payroll Configuration
                            </Link>
                            {" "}to view CTC breakdown.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Earnings and Deductions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Earnings
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-medium">₹{((selectedPayslip as any).earnings?.basic || (selectedPayslip as any).baseSalary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA</span>
                      <span className="font-medium">₹{((selectedPayslip as any).earnings?.hra || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conveyance</span>
                      <span className="font-medium">₹{((selectedPayslip as any).earnings?.conveyance || 0).toLocaleString()}</span>
                    </div>
                    {(() => {
                      // Show Medical and Special Allowance from salary structure
                      const allStructures = salaryStructureService.getAll();
                      const matchingStructure = allStructures.find(s => 
                        s.roleName.toLowerCase().includes(((selectedPayslip as any).role?.toLowerCase() || "") || '') ||
                        ((selectedPayslip as any).role?.toLowerCase() || "").includes(s.roleName.toLowerCase())
                      );
                      if (matchingStructure) {
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Medical Allowance</span>
                              <span className="font-medium">₹{(matchingStructure?.components?.medical ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Special Allowance</span>
                              <span className="font-medium">₹{(matchingStructure?.components?.specialAllowance ?? 0).toLocaleString()}</span>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                    {(((selectedPayslip as any).earnings?.incentive || (selectedPayslip as any).incentiveAmount || 0) > 0) && (
                      <div className="flex justify-between">
                        <span>Incentive</span>
                        <span className="font-medium text-green-600">₹{((selectedPayslip as any).earnings?.incentive || (selectedPayslip as any).incentiveAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(((selectedPayslip as any).earnings?.overtimePay || 0) > 0) && (
                      <div className="flex justify-between">
                        <span>Overtime Pay</span>
                        <span className="font-medium text-green-600">₹{((selectedPayslip as any).earnings?.overtimePay || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(((selectedPayslip as any).earnings?.nationalHolidayPay || 0) > 0) && (
                      <div className="flex justify-between">
                        <span>National Holiday Pay</span>
                        <span className="font-medium text-green-600">₹{((selectedPayslip as any).earnings?.nationalHolidayPay || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t-2 border-green-300 flex justify-between font-bold text-green-700">
                      <span>Gross Earnings</span>
                      <span>₹{((selectedPayslip as any).earnings?.grossEarnings || (selectedPayslip as any).grossSalary || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Deductions
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>PF Contribution</span>
                      <span className="font-medium">₹{((selectedPayslip as any).deductions?.pf || (selectedPayslip as any).pf || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ESI</span>
                      <span className="font-medium">₹{((selectedPayslip as any).deductions?.esi || (selectedPayslip as any).esic || 0).toLocaleString()}</span>
                    </div>
                    {(((selectedPayslip as any).deductions?.professionalTax || (selectedPayslip as any).pt || 0) > 0) && (
                      <div className="flex justify-between">
                        <span>Professional Tax</span>
                        <span className="font-medium">₹{((selectedPayslip as any).deductions?.professionalTax || (selectedPayslip as any).pt || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(((selectedPayslip as any).deductions?.tds || (selectedPayslip as any).tds || 0) > 0) && (
                      <div className="flex justify-between">
                        <span>TDS</span>
                        <span className="font-medium">₹{((selectedPayslip as any).deductions?.tds || (selectedPayslip as any).tds || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(((selectedPayslip as any).deductions?.advance || (selectedPayslip as any).advances || 0) > 0) && (
                      <div className="flex justify-between">
                        <span>Advance Recovery</span>
                        <span className="font-medium text-red-600">₹{((selectedPayslip as any).deductions?.advance || (selectedPayslip as any).advances || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(((selectedPayslip as any).leaveDeductions || 0) > 0) && (
                      <div className="flex justify-between">
                        <span>Leave Deductions (UL)</span>
                        <span className="font-medium text-red-600">₹{((selectedPayslip as any).leaveDeductions || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t-2 border-red-300 flex justify-between font-bold text-red-700">
                      <span>Total Deductions</span>
                      <span>₹{(((selectedPayslip as any).deductions?.totalDeductions || (selectedPayslip as any).totalDeductions || 0) + ((selectedPayslip as any).leaveDeductions || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-100 p-6 rounded-lg border-2 border-blue-400">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700">Net Salary (Take Home)</p>
                    <p className="text-3xl font-bold text-blue-900">₹{((selectedPayslip as any).netSalary || 0).toLocaleString()}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-blue-600" />
                </div>
                {selectedPayslip.paidOn && (
                  <p className="text-xs text-blue-700 mt-2">
                    Paid on: {new Date(selectedPayslip.paidOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Leave Balance */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h5 className="font-semibold mb-3 text-amber-900">Leave Balance (As of {new Date(selectedPayslip.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})</h5>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Casual Leave</p>
                    <p className="text-lg font-bold text-blue-600">{(selectedPayslip as any).leaveDays?.CL || 0}/7</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Privilege Leave</p>
                    <p className="text-lg font-bold text-green-600">{(selectedPayslip as any).leaveDays?.PL || 0}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Sick Leave</p>
                    <p className="text-lg font-bold text-orange-600">{(selectedPayslip as any).leaveDays?.SL || 0}/7</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Unpaid Leave</p>
                    <p className="text-lg font-bold text-red-600">{(selectedPayslip as any).leaveDays?.UL || 0}/1</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1" onClick={() => window.print()}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowPayslipModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendance Drill-Down Modal */}
      {showAttendanceDrillDown && selectedEmployeeForDrillDown && (
        <Suspense fallback={null}>
        <EmployeeAttendanceDrillDown
          isOpen={showAttendanceDrillDown}
          onClose={() => setShowAttendanceDrillDown(false)}
          employeeId={selectedEmployeeForDrillDown.id}
          employeeName={selectedEmployeeForDrillDown.name}
          month={4}
          year={2026}
        />
        </Suspense>
      )}
    </div>
  );
}

export default HRModule;
