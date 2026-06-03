// Welcome screen showing system capabilities
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Shield, Users, BarChart3, CheckCircle,
  Zap, Lock, TrendingUp, Award
} from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import { Link } from "react-router-dom";
import { useCustomers } from "../contexts/CustomerContext";
import { useFinance } from "../contexts/FinanceContext";
import { useJobs } from "../contexts/JobContext";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { formatCurrency, formatPercentage, formatNumber } from "../lib/formatters";
import { useMemo } from "react";

export function WelcomeScreen() {
  const { currentRole, roleConfig, currentUser } = useRole();

  // ✅ REAL-TIME DATA HOOKS
  const { customers } = useCustomers();
  const { revenues, getTotalMRR } = useFinance();
  const { allJobs } = useJobs();
  const { employees, attendanceRecords } = useEmployeeData();

  // ✅ CALCULATE LIVE METRICS
  const stats = useMemo(() => {
    // Active Customers (status = "Active")
    const activeCustomers = customers.filter(c => c.status === "Active").length;

    // Monthly Revenue (current month MRR)
    const currentMonth = new Date().toISOString().substring(0, 7); // "2026-04"
    const monthlyRevenue = getTotalMRR(currentMonth);

    // Washes Today (completed jobs today)
    const today = new Date().toISOString().split('T')[0]; // "2026-04-23"
    const washesToday = allJobs.filter(job =>
      job.status === "Completed" &&
      job.completedAt?.startsWith(today)
    ).length;

    // Attendance Rate (present employees / total employees)
    const totalEmployees = employees.length;
    const todayAttendance = attendanceRecords.filter(record =>
      record.date === today && record.status === "Present"
    );
    const attendanceRate = totalEmployees > 0
      ? (todayAttendance.length / totalEmployees) * 100
      : 0;

    return {
      activeCustomers,
      monthlyRevenue,
      washesToday,
      attendanceRate,
      hasData: customers.length > 0 || revenues.length > 0 || allJobs.length > 0
    };
  }, [customers, getTotalMRR, allJobs, employees, attendanceRecords]);

  const systemFeatures = [
    { icon: Users, title: "11 User Roles", description: "Fully customized access for each role", color: "bg-blue-50 text-blue-600" },
    { icon: BarChart3, title: "10 Modules", description: "Complete business coverage", color: "bg-green-50 text-green-600" },
    { icon: CheckCircle, title: "8 Approval Workflows", description: "Multi-level validation", color: "bg-purple-50 text-purple-600" },
    { icon: Zap, title: "Real-time KPIs", description: "Live business intelligence", color: "bg-orange-50 text-orange-600" },
    { icon: Lock, title: "Complete Audit Trail", description: "Every action logged", color: "bg-red-50 text-red-600" },
    { icon: TrendingUp, title: "Performance Tracking", description: "Individual & team metrics", color: "bg-teal-50 text-teal-600" },
  ];

  const yourAccess = roleConfig.modules.map(module => {
    const moduleNames: Record<string, string> = {
      "dashboard": "Dashboard",
      "users": "User Management",
      "leads": "Lead Management",
      "customers": "Customer & Subscription",
      "car-washer": "Car Washer Execution",
      "supervisor": "Supervisor Module",
      "operations": "Operations Manager",
      "complaints": "Complaint Management",
      "inventory": "Inventory & Store",
      "finance": "Finance Module",
      "hr": "HR Module",
      "approvals": "Approval Center",
      "audit-trail": "Audit Trail",
    };
    return moduleNames[module] || module;
  });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Welcome to CleanCar 360°</h1>
                  <p className="text-blue-100 mt-1">Complete Car Washing Service Management System</p>
                </div>
              </div>
            </div>
            <Badge className="bg-white text-blue-600 hover:bg-white text-lg px-4 py-2">
              {currentRole}
            </Badge>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm text-blue-100">Logged in as</p>
              <p className="text-xl font-bold mt-1">{currentUser.name}</p>
              <p className="text-sm text-blue-100">{currentUser.email}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm text-blue-100">Your Location</p>
              <p className="text-xl font-bold mt-1">{currentUser.city}</p>
              <p className="text-sm text-blue-100">Operating Region</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm text-blue-100">Module Access</p>
              <p className="text-xl font-bold mt-1">{roleConfig.modules.length} Modules</p>
              <p className="text-sm text-blue-100">Full access granted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Features */}
      <div>
        <h2 className="text-xl font-bold mb-4">System Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className={`${feature.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Your Access */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Your Module Access as {currentRole}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {yourAccess.map((module) => (
              <div key={module} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{module}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleConfig.modules.slice(1, 4).map((module) => {
              const paths: Record<string, string> = {
                "users": "/users",
                "leads": "/leads",
                "customers": "/customers",
                "car-washer": "/car-washer",
                "supervisor": "/supervisor",
                "operations": "/operations",
                "complaints": "/complaints",
                "inventory": "/inventory",
                "finance": "/finance",
                "hr": "/hr",
                "approvals": "/approvals",
              };
              const names: Record<string, string> = {
                "users": "Manage Users",
                "leads": "View Leads",
                "customers": "View Customers",
                "car-washer": "Start Work",
                "supervisor": "Team Management",
                "operations": "Operations",
                "complaints": "Handle Complaints",
                "inventory": "Check Stock",
                "finance": "Finance",
                "hr": "HR Tasks",
                "approvals": "Pending Approvals",
              };
              return (
                <Link key={module} to={paths[module] || "/"}>
                  <Button className="w-full h-16 text-lg" variant="outline">
                    {names[module] || module}
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Stats - REAL-TIME DATA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            {stats.hasData ? (
              <>
                <p className="text-3xl font-bold text-blue-600">
                  {formatNumber(stats.activeCustomers)}
                </p>
                <p className="text-sm text-gray-600">Active Customers</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-400">—</p>
                <p className="text-sm text-gray-500">No customer data</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {stats.hasData ? (
              <>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-400">—</p>
                <p className="text-sm text-gray-500">No revenue data</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {stats.hasData ? (
              <>
                <p className="text-3xl font-bold text-purple-600">
                  {formatNumber(stats.washesToday)}
                </p>
                <p className="text-sm text-gray-600">Washes Today</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-400">—</p>
                <p className="text-sm text-gray-500">No job data</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {stats.hasData ? (
              <>
                <p className="text-3xl font-bold text-orange-600">
                  {formatPercentage(stats.attendanceRate, 0)}
                </p>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-400">—</p>
                <p className="text-sm text-gray-500">No attendance data</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
