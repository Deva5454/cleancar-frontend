/**
 * Employee Portal - Self-Service Dashboard
 * Where employees (car washers, etc.) access their payslip and request adjustments
 */

import React, { useState } from "react";
import { EmployeeSelfServicePayslip } from "./components/employee/EmployeeSelfServicePayslip";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import {
  User,
  FileText,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Home,
  ChevronRight,
} from "lucide-react";

function EmployeePortal() {
  const [currentView, setCurrentView] = useState<"dashboard" | "payslip">("dashboard");
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  // Mock logged-in employee data
  const loggedInEmployee = {
    name: "Rajesh Kumar",
    code: "EMP12345",
    designation: "Senior Car Washer",
    department: "Car Washing Operations",
    profileImage: null,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white text-blue-600 p-2 rounded-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Employee Self-Service Portal</h1>
                <p className="text-sm text-blue-100">Welcome, {loggedInEmployee.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => setCurrentView("dashboard")}
              className={currentView === "dashboard" ? "font-semibold text-blue-600" : "hover:text-blue-600"}
            >
              Dashboard
            </button>
            {currentView === "payslip" && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-blue-600">My Payslip</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === "dashboard" ? (
          <>
            {/* Employee Info Card */}
            <Card className="mb-6 border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white p-4 rounded-full">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{loggedInEmployee.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {loggedInEmployee.code} | {loggedInEmployee.designation}
                    </p>
                    <p className="text-xs text-gray-500">{loggedInEmployee.department}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* My Payslip */}
              <Card
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
                onClick={() => setCurrentView("payslip")}
              >
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        My Payslip
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        View current month salary
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="bg-green-100 p-3 rounded">
                    <p className="text-xs text-green-900">Current Month</p>
                    <p className="text-lg font-bold text-green-700">
                      {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance */}
              <Card className="hover:shadow-lg transition-shadow border-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    My Attendance
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    View attendance records
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-xs text-blue-900">This Month</p>
                    <p className="text-lg font-bold text-blue-700">25/31 days present</p>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Balance */}
              <Card className="hover:shadow-lg transition-shadow border-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    My Leave Balance
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Check available leaves
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="bg-purple-100 p-3 rounded">
                    <p className="text-xs text-purple-900">Available PL</p>
                    <p className="text-lg font-bold text-purple-700">12 days</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Banner */}
            <Card className="mt-6 border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-cyan-600 text-white p-2 rounded-full">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-cyan-900 mb-2">
                      💡 New Feature: Leave Adjustment Against Salary Deduction
                    </h3>
                    <p className="text-sm text-cyan-800 mb-3">
                      If you have attendance deductions in your salary, you can now use your Paid Leave (PL) 
                      to offset those deductions and save your salary!
                    </p>
                    <Button
                      onClick={() => setCurrentView("payslip")}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      View My Payslip & Request Adjustment →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Back Button */}
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => setCurrentView("dashboard")}
            >
              ← Back to Dashboard
            </Button>

            {/* Payslip Component */}
            <EmployeeSelfServicePayslip month={selectedMonth} year={selectedYear} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2026 Car Washing Service Business. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            For support, contact: hr@carwashbusiness.com | +91-1234567890
          </p>
        </div>
      </footer>
    </div>
  );
}

export default EmployeePortal;
