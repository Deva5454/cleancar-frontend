import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  type MonthlyPayrollResponse,
  getDeductionExplanation,
} from "../../services/payrollService";
import { DEDUCTION_RULES } from "../../constants/payrollConstants";

interface ExplainSalaryModalProps {
  open: boolean;
  onClose: () => void;
  payrollData: MonthlyPayrollResponse;
}

export function ExplainSalaryModal({ open, onClose, payrollData }: ExplainSalaryModalProps) {
  const { attendance, payroll } = payrollData;

  // Calculate per day salary for deduction explanations
  const basicSalaryFromEarnings = payroll.earnings.find(e => e.name === "Basic Salary")?.amount || 0;
  const perDaySalary = basicSalaryFromEarnings / attendance.summary.payDays;

  const deductionExplanations = getDeductionExplanation(attendance.summary, perDaySalary);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Salary Calculation Breakdown
          </DialogTitle>
          <DialogDescription>
            Complete formula and explanation of how your salary was calculated
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Attendance Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Attendance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Total Days</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {attendance.summary.totalDays}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Present Days</p>
                  <p className="text-2xl font-bold text-green-900">
                    {attendance.summary.presentDays}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-700">Deduction Days</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {(attendance?.summary?.deductionDays ?? 0).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-700">Pay Days</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {attendance.summary.payDays}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deduction Explanation */}
          {deductionExplanations.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Why Deduction Happened
                </h3>
                <div className="space-y-3">
                  {deductionExplanations.map((explanation, index) => (
                    <div
                      key={index}
                      className="bg-white border border-orange-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{explanation.reason}</p>
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          -{explanation.days} days
                        </Badge>
                      </div>
                      <div className="bg-gray-50 rounded px-3 py-2 font-mono text-sm text-gray-700 border border-gray-200">
                        {explanation.formula}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Deduction Amount:{" "}
                        <span className="font-semibold text-red-600">
                          ₹{(explanation?.amount ?? 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  ))}

                  {/* Deduction Rules Info */}
                  <div className="bg-white border border-orange-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Deduction Rules Applied:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>
                        • Late Coming: Every {DEDUCTION_RULES.LATE_COMING_THRESHOLD} late marks ={" "}
                        {DEDUCTION_RULES.LATE_COMING_DEDUCTION} day deduction
                      </li>
                      <li>
                        • Auto Logout: Every {DEDUCTION_RULES.AUTO_LOGOUT_THRESHOLD} auto logouts ={" "}
                        {DEDUCTION_RULES.AUTO_LOGOUT_DEDUCTION} day deduction
                      </li>
                      <li>
                        • Half Day: {DEDUCTION_RULES.HALF_DAY_DEDUCTION} day deduction per half day
                      </li>
                      <li>• Absent: {DEDUCTION_RULES.ABSENT_DEDUCTION} day deduction per absence</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Earnings Breakdown */}
          <Card className="border-green-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Earnings Calculation
              </h3>
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[600px] sm:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-green-50">
                        <TableHead>Component</TableHead>
                        <TableHead>Formula Used</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {payroll.earnings.map((earning, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{earning.name}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {earning.formula}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-700">
                        ₹{(earning?.amount ?? 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-100 border-t-2 border-green-300">
                    <TableCell className="font-bold">Gross Pay</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        Sum of all earnings
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-900">
                      ₹{(payroll?.grossPay ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deductions Breakdown */}
          <Card className="border-red-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Deductions Calculation
              </h3>
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[600px] sm:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50">
                        <TableHead>Component</TableHead>
                        <TableHead>Formula Used</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {payroll.deductions.map((deduction, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-semibold">{deduction.name}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {deduction.formula}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-700">
                        ₹{(deduction?.amount ?? 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-red-100 border-t-2 border-red-300">
                    <TableCell className="font-bold">Total Deductions</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        Sum of all deductions
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-900">
                      ₹{(payroll?.totalDeductions ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Calculation */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Final Net Salary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-700">Gross Pay</span>
                  <span className="font-bold text-green-700">
                    ₹{(payroll?.grossPay ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-700">Total Deductions</span>
                  <span className="font-bold text-red-700">
                    - ₹{(payroll?.totalDeductions ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="border-t-2 border-purple-300 pt-3">
                  <div className="flex items-center justify-between text-2xl">
                    <span className="font-bold text-purple-900">Net Salary</span>
                    <span className="font-bold text-purple-900">
                      ₹{(payroll?.netPay ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="bg-white border border-purple-200 rounded-lg p-3 mt-3">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Formula:</p>
                  <code className="text-sm text-gray-700">
                    Net Salary = Gross Pay - Total Deductions
                  </code>
                  <p className="text-sm text-gray-700 mt-2">
                    = ₹{(payroll?.grossPay ?? 0).toFixed(2)} - ₹{(payroll?.totalDeductions ?? 0).toFixed(2)} = ₹
                    {(payroll?.netPay ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employer Contribution */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Employer Contribution</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">EPF (Employer)</span>
                  <span className="font-semibold">
                    ₹{(payroll?.employerContribution?.epf ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">ESIC (Employer)</span>
                  <span className="font-semibold">
                    ₹{(payroll?.employerContribution?.esic ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="font-bold text-blue-900">Total Employer Cost</span>
                  <span className="font-bold text-blue-900">
                    ₹{(payroll?.employerContribution?.total ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                This is the additional cost borne by the employer on top of your net salary
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
