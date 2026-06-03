import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { CheckCircle, Circle, Calculator, ClipboardCheck, Award, Clock, AlertCircle, ChevronRight, AlertTriangle, Bell } from "lucide-react";

type ProcessingStep = 1 | 2 | 3;

export function PayrollProcessingTab() {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>(1);
  const [isPayrollBlocked, setIsPayrollBlocked] = useState(true); // Set to true to show blocking state

  const steps = [
    { id: 1, label: "Calculation", icon: Calculator },
    { id: 2, label: "Review", icon: ClipboardCheck },
    { id: 3, label: "Approval", icon: Award },
  ];

  const blockingWeeks = [
    { week: "Week 1", employee: "Amit Patel", incentive: 1450, escalationLevel: "Sr Manager" },
    { week: "Week 3", employee: "Sneha Reddy", incentive: 1880, escalationLevel: "Business Head" },
  ];

  // If payroll is blocked, show full-screen alert
  if (isPayrollBlocked) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payroll Processing</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete payroll workflow: Calculate → Review → Approve
          </p>
        </div>

        {/* Full Screen Blocking Alert */}
        <Card className="border-4 border-red-500 bg-red-50">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold text-red-900 mb-3">Payroll Blocked</h1>
                <p className="text-lg text-red-700">
                  Incentive approvals not completed within escalation timeline
                </p>
              </div>

              {/* Blocking Weeks */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-red-800 mb-4 uppercase tracking-wide">
                  Blocking Weeks
                </h3>
                <div className="space-y-3">
                  {blockingWeeks.map((item, index) => (
                    <Card key={index} className="border-2 border-red-300 bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <Badge className="bg-red-600 text-white">
                              {item.week}
                            </Badge>
                            <div className="text-left">
                              <div className="font-semibold text-gray-900">{item.employee}</div>
                              <div className="text-sm text-gray-600">Incentive: ₹{(item?.incentive ?? 0).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Stuck at</div>
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                              {item.escalationLevel}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Escalation Chain */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-red-800 mb-4 uppercase tracking-wide">
                  Escalation Chain
                </h3>
                <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-lg border-2 border-red-300">
                  <div className="px-4 py-2 rounded bg-green-100 text-green-700 font-medium text-sm border border-green-300">
                    Manager
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-600" />
                  <div className="px-4 py-2 rounded bg-orange-100 text-orange-700 font-medium text-sm border-2 border-orange-500">
                    Sr Manager
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-600" />
                  <div className="px-4 py-2 rounded bg-red-100 text-red-700 font-medium text-sm border-2 border-red-500">
                    Business Head
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                  <div className="px-4 py-2 rounded bg-gray-200 text-gray-500 font-medium text-sm">
                    Super Admin
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    setIsPayrollBlocked(false);
                    setCurrentStep(3);
                  }}
                >
                  <ClipboardCheck className="w-5 h-5 mr-2" />
                  View Pending Approvals
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <Bell className="w-5 h-5 mr-2" />
                  Notify All
                </Button>
              </div>

              {/* Additional Info */}
              <div className="pt-6 border-t border-red-200 max-w-2xl mx-auto">
                <p className="text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Payroll cannot be processed until all pending approvals are completed.
                  Please review and approve or notify escalation contacts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Payroll Processing</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete payroll workflow: Calculate → Review → Approve
        </p>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    onClick={() => setCurrentStep(step.id as ProcessingStep)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`font-semibold ${
                          isActive ? "text-blue-900" : isCompleted ? "text-green-900" : "text-gray-600"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-500">Step {index + 1} of {steps.length}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={`h-1 rounded transition-colors ${
                          step.id < currentStep ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && <CalculationStep />}
      {currentStep === 2 && <ReviewStep />}
      {currentStep === 3 && <ApprovalStep />}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as ProcessingStep)}
          disabled={currentStep === 1}
        >
          Previous Step
        </Button>
        <Button
          onClick={() => setCurrentStep(Math.min(3, currentStep + 1) as ProcessingStep)}
          disabled={currentStep === 3}
        >
          {currentStep === 3 ? "Complete" : "Next Step"}
        </Button>
      </div>
    </div>
  );
}

function CalculationStep() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calculation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">Total Employees Processed</div>
              <div className="text-2xl font-bold text-blue-900">247</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">Total Salary Computed</div>
              <div className="text-2xl font-bold text-green-900">₹34.5L</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-700 mb-1">Total Incentives</div>
              <div className="text-2xl font-bold text-purple-900">₹4.8L</div>
              <div className="text-xs text-purple-600 mt-1">From approved weeks</div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Status</span>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Auto-calculated using system rules
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewStep() {
  const [employees] = useState([
    { id: 1, name: "Ramesh Kumar", salary: 29650, incentive: 1750, adjustment: 0 },
    { id: 2, name: "Priya Sharma", salary: 31245, incentive: 2100, adjustment: 0 },
    { id: 3, name: "Amit Patel", salary: 28900, incentive: 1450, adjustment: 0 },
    { id: 4, name: "Sneha Reddy", salary: 30500, incentive: 1880, adjustment: 0 },
    { id: 5, name: "Vijay Singh", salary: 29300, incentive: 1620, adjustment: 0 },
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review & Adjust</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead className="text-right">Incentive</TableHead>
                  <TableHead className="text-right">Adjustments</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Final Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell className="text-right">₹{(emp?.salary ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{(emp?.incentive ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-24 text-right"
                        defaultValue={emp.adjustment}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Reason for adjustment"
                        className="w-48"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{(emp.salary + emp.incentive + emp.adjustment).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalStep() {
  const escalationLevels = ["Manager", "Sr Manager", "Business Head", "Super Admin"];

  const [approvals] = useState([
    {
      id: 1,
      employee: "Ramesh Kumar",
      week: "Week 1",
      incentive: 1750,
      status: "Pending",
      approver: "Manager",
      currentLevel: 0,
      slaMinutes: 45,
      deadline: "Feb 1, 4 PM",
      isBlocking: false,
      escalationCount: 0,
      history: [
        { level: "Manager", status: "Pending", timestamp: "Jan 30, 2:15 PM" },
      ],
    },
    {
      id: 2,
      employee: "Priya Sharma",
      week: "Week 2",
      incentive: 2100,
      status: "Approved",
      approver: "Manager",
      currentLevel: 0,
      slaMinutes: 0,
      deadline: "Feb 1, 4 PM",
      isBlocking: false,
      escalationCount: 0,
      history: [
        { level: "Manager", status: "Approved", timestamp: "Jan 29, 11:30 AM" },
      ],
    },
    {
      id: 3,
      employee: "Amit Patel",
      week: "Week 1",
      incentive: 1450,
      status: "Pending",
      approver: "Sr Manager",
      currentLevel: 1,
      slaMinutes: 25,
      deadline: "Feb 1, 4 PM",
      isBlocking: true,
      escalationCount: 1,
      history: [
        { level: "Manager", status: "Escalated", timestamp: "Jan 29, 3:00 PM" },
        { level: "Sr Manager", status: "Pending", timestamp: "Jan 30, 9:00 AM" },
      ],
    },
    {
      id: 4,
      employee: "Sneha Reddy",
      week: "Week 3",
      incentive: 1880,
      status: "Escalated",
      approver: "Business Head",
      currentLevel: 2,
      slaMinutes: 15,
      deadline: "Feb 1, 2 PM",
      isBlocking: true,
      escalationCount: 2,
      history: [
        { level: "Manager", status: "Escalated", timestamp: "Jan 28, 10:00 AM" },
        { level: "Sr Manager", status: "Escalated", timestamp: "Jan 29, 2:00 PM" },
        { level: "Business Head", status: "Pending", timestamp: "Jan 30, 10:30 AM" },
      ],
    },
    {
      id: 5,
      employee: "Vijay Singh",
      week: "Week 2",
      incentive: 1620,
      status: "Pending",
      approver: "Manager",
      currentLevel: 0,
      slaMinutes: 60,
      deadline: "Feb 1, 4 PM",
      isBlocking: false,
      escalationCount: 0,
      history: [
        { level: "Manager", status: "Pending", timestamp: "Jan 30, 1:00 PM" },
      ],
    },
  ]);

  const pendingCount = approvals.filter((a) => a.status === "Pending").length;
  const approvedCount = approvals.filter((a) => a.status === "Approved").length;
  const escalatedCount = approvals.filter((a) => a.status === "Escalated").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-700 mb-1">Pending Approvals</div>
              <div className="text-2xl font-bold text-orange-900">{pendingCount}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">Approved</div>
              <div className="text-2xl font-bold text-green-900">{approvedCount}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-700 mb-1">Escalated Cases</div>
              <div className="text-2xl font-bold text-red-900">{escalatedCount}</div>
            </div>
          </div>

          <div className="space-y-4">
            {approvals.map((approval) => (
              <Card key={approval.id} className={approval.isBlocking ? "border-2 border-red-300" : ""}>
                <CardContent className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">{approval.employee}</span>
                        <Badge variant="outline" className="text-xs">
                          {approval.week}
                        </Badge>
                        {approval.isBlocking && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Payroll Blocking
                          </Badge>
                        )}
                        {approval.escalationCount > 0 && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                            Escalated {approval.escalationCount} {approval.escalationCount === 1 ? "time" : "times"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Incentive: <span className="font-semibold text-gray-900">₹{(approval?.incentive ?? 0).toLocaleString()}</span></span>
                        <Badge
                          variant="outline"
                          className={
                            approval.status === "Approved"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : approval.status === "Escalated"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-orange-100 text-orange-700 border-orange-200"
                          }
                        >
                          {approval.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Deadline & SLA */}
                    <div className="text-right">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        Deadline: {approval.deadline}
                      </Badge>
                      {approval.status !== "Approved" && (
                        <div className="flex items-center gap-1 text-xs text-orange-700 mt-1">
                          <Clock className="w-3 h-3" />
                          Next escalation in: <span className="font-semibold">{approval.slaMinutes} mins</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Escalation Timeline */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Escalation Timeline</h4>
                    <div className="flex items-center gap-2">
                      {escalationLevels.map((level, index) => (
                        <div key={level} className="flex items-center">
                          <div
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              index === approval.currentLevel
                                ? "bg-blue-600 text-white"
                                : index < approval.currentLevel
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {level}
                          </div>
                          {index < escalationLevels.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Escalation History */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Escalation History</h4>
                    <div className="space-y-1">
                      {approval.history.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3 text-xs">
                          <Badge
                            variant="outline"
                            className={
                              entry.status === "Approved"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : entry.status === "Escalated"
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                            }
                          >
                            {entry.level}
                          </Badge>
                          <span className="text-gray-600">{entry.status}</span>
                          <span className="text-gray-400">{entry.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    {approval.status === "Pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                          Reject
                        </Button>
                      </>
                    )}
                    {approval.status === "Approved" && (
                      <span className="text-sm text-gray-500">Completed</span>
                    )}
                    {approval.status === "Escalated" && (
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
