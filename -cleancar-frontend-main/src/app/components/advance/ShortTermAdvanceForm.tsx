/**
 * Short-Term Advance Application
 * Auto-calculated eligibility • System-driven validations
 * Financial Control > Ease of Use
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { advanceManagementService } from "../../services/advanceManagementService";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Calculator,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";

export function ShortTermAdvanceForm() {
  const navigate = useNavigate();
  const { currentUser } = useRole();
  const { employees } = useEmployee();
  const { currentRole } = useRole();
  const { city } = useCity();
  const [targetEmployeeId, setTargetEmployeeId] = useState(currentUser?.employeeId || "");
  const isHRView = currentRole === "HR" || currentRole === "Admin" || currentRole === "Super Admin";

  const targetEmployee = employees.find(e => e.id === targetEmployeeId);

  // Mock employee data (in production, fetch from attendance system)
  const [daysWorked, setDaysWorked] = useState(20);
  const [totalDaysInMonth] = useState(30);
  const [monthlySalary] = useState(30000);

  // Auto-calculated (read-only)
  const [salaryTillDate, setSalaryTillDate] = useState(0);
  const [maxEligible, setMaxEligible] = useState(0);
  const [limitPercentage, setLimitPercentage] = useState(0);

  // User input
  const [requestedAmount, setRequestedAmount] = useState<number>(0);

  // Validation
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [requiresOverride, setRequiresOverride] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-calculate eligibility
  useEffect(() => {
    const eligibility = advanceManagementService.calculateShortTermEligibility(
      currentUser.name,
      monthlySalary,
      daysWorked,
      totalDaysInMonth,
      currentUser.role
    );

    setSalaryTillDate(eligibility.salaryTillDate);
    setMaxEligible(eligibility.maxEligible);
    setLimitPercentage(eligibility.limitPercentage);
  }, [daysWorked, totalDaysInMonth, monthlySalary, currentUser.name, currentUser.role]);

  // Validate requested amount
  useEffect(() => {
    const validation = advanceManagementService.validateShortTermRequest(
      requestedAmount,
      maxEligible
    );

    setErrors(validation.errors);

    if (requestedAmount > maxEligible) {
      setIsOverLimit(true);
      setRequiresOverride(true);
    } else {
      setIsOverLimit(false);
      setRequiresOverride(false);
    }
  }, [requestedAmount, maxEligible]);

  const canSubmit = () => {
    // Block submission if over limit or no amount entered
    return requestedAmount > 0 && errors.length === 0 && !isOverLimit;
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      if (isOverLimit) {
        toast.info("❌ Cannot submit: Amount exceeds your role-based limit.\n\nPlease enter an amount within your limit or contact Super Admin.");
      } else {
        toast.info("❌ Please enter a valid amount");
      }
      return;
    }

    try {
      const advance = advanceManagementService.createShortTermAdvance(
        currentUser.name,
        currentUser.name,
        currentUser.role,
        requestedAmount,
        {
          daysWorked,
          salaryTillDate,
          maxEligible,
        }
      );

      toast.success(
        "✅ Advance Auto-Approved!\n\n" +
        `Amount: ₹${requestedAmount.toLocaleString()}\n` +
        "Recovery: Automatically deducted from next month's payroll\n\n" +
        "No further action required."
      );

      navigate(`/advance/status/${advance.id}`);
    } catch (error: any) {
      toast.error(`❌ Submission failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/advance")}
            className="mb-4"
          >
            ← Back to Selection
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Short-Term Advance</h1>
          <p className="text-gray-600 mt-2">
            Quick advance based on earned salary • Single-cycle recovery
          </p>
        </div>

        {/* HR Employee Picker */}
        {isHRView && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Processing advance for:
                </label>
                <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(e => e.status === "Active" && (e.workLocation === city || e.cityId === city))
                      .map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.fullName} — {e.designation} ({e.mobile})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {targetEmployee && (
                  <p className="text-xs text-blue-600 mt-1">
                    Role: {targetEmployee.designation} | Gross: ₹{targetEmployee.gross?.toLocaleString() || "—"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-Calculation Panel (Read-Only) */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calculator className="w-5 h-5" />
              Eligibility Calculation (System-Driven)
            </CardTitle>
            <p className="text-sm text-blue-700 mt-2">
              📊 Auto-calculated based on attendance • Read-only
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Days Worked */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Days Worked</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {daysWorked}/{totalDaysInMonth}
                </p>
              </div>

              {/* Salary Till Date */}
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Salary Till Date</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">₹{salaryTillDate.toLocaleString()}</p>
              </div>

              {/* Max Eligible (Role-based %) */}
              <div className="p-4 bg-green-100 rounded-lg border-2 border-green-400">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-700" />
                  <span className="text-xs font-medium text-green-700">
                    Your Advance Limit ({limitPercentage}%)
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900">₹{maxEligible.toLocaleString()}</p>
                <p className="text-xs text-green-700 mt-1">
                  {limitPercentage}% of gross salary
                </p>
              </div>
            </div>

            {/* Calculation Formula */}
            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="text-xs text-gray-600 font-mono">
                Formula: Monthly Gross Salary × {limitPercentage}%
              </p>
              <p className="text-xs text-blue-700 font-mono mt-1">
                = ₹{monthlySalary.toLocaleString()} × {limitPercentage / 100} = ₹
                {maxEligible.toLocaleString()}
              </p>
            </div>

            {/* Role-Based Limit Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Your Role:</strong> {currentUser.role}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {currentUser.role === "Car Washer" || currentUser.role === "Supervisor"
                  ? "As a Car Washer or Supervisor, you can request up to 50% of your monthly gross salary."
                  : "Your role allows you to request up to 20% of your monthly gross salary."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Request Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Request Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested Amount <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                value={requestedAmount || ""}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                placeholder={`Max: ₹${maxEligible.toLocaleString()}`}
                className={isOverLimit ? "border-amber-500" : ""}
              />

              {/* Real-time validation feedback */}
              {requestedAmount > 0 && (
                <div className="mt-2">
                  {isOverLimit ? (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-900">
                            ❌ Exceeds Your Limit — Cannot Submit
                          </p>
                          <p className="text-xs text-red-800 mt-1">
                            Requested ₹{requestedAmount.toLocaleString()} exceeds your maximum limit of ₹
                            {maxEligible.toLocaleString()} ({limitPercentage}% of gross salary).
                            Please enter an amount within your limit or contact Super Admin for approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-semibold text-green-900">
                          ✓ Within Limit - Auto-Approved
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recovery Information */}
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Calendar className="w-5 h-5" />
              Auto-Deduction Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
              <span className="text-sm font-medium text-gray-700">Recovery Method</span>
              <Badge className="bg-purple-600">Auto-Deduction</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
              <span className="text-sm font-medium text-gray-700">Deduction Month</span>
              <span className="text-sm font-semibold text-purple-900">
                {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="p-3 bg-white rounded border border-purple-200">
              <p className="text-xs text-gray-700">
                <strong>Note:</strong> The approved advance amount will be automatically deducted from
                your next month's salary. No manual payment required.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm mb-1">Important</p>
                <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                  <li>Auto-deduction is mandatory and system-enforced</li>
                  <li>Full amount will be deducted from next month's salary</li>
                  <li>Cannot apply for another short-term advance until recovered</li>
                  <li>Requests exceeding your role-based limit cannot be submitted</li>
                  <li>Contact Super Admin if you need to request a higher limit</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card
          className={
            canSubmit()
              ? "border-green-300 bg-green-50"
              : isOverLimit
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-gray-50"
          }
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                {requestedAmount > 0 && !isOverLimit ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Ready to submit</span>
                  </div>
                ) : isOverLimit ? (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">Exceeds your limit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Enter amount to proceed</span>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {isOverLimit
                    ? "Amount exceeds role-based limit — cannot submit"
                    : canSubmit()
                    ? "Auto-approved • Deducted next month"
                    : "Enter a valid amount within your limit"}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                size="lg"
                className="min-w-[200px]"
              >
                Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
