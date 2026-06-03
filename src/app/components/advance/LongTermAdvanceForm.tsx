/**
 * Long-Term Advance Application Form
 * HARD VALIDATIONS - No bypass allowed
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
  Lock,
  CheckCircle,
  XCircle,
  Upload,
  Calculator,
  Shield,
} from "lucide-react";
import type { SecurityCheque, ApprovalAuthority } from "../../types/advanceManagement";

export function LongTermAdvanceForm() {
  const navigate = useNavigate();
  const { currentUser } = useRole();
  const { employees } = useEmployee();
  const { currentRole } = useRole();
  const { city } = useCity();
  const [targetEmployeeId, setTargetEmployeeId] = useState(currentUser?.employeeId || "");
  const isHRView = currentRole === "HR" || currentRole === "Admin" || currentRole === "Super Admin";

  const targetEmployee = employees.find(e => e.id === targetEmployeeId);

  // Form state
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [tenureMonths, setTenureMonths] = useState<number>(0);
  const [emiAmount, setEmiAmount] = useState<number>(0);
  const [isEmiEditable, setIsEmiEditable] = useState(false);
  const [approvalAuthority, setApprovalAuthority] = useState<ApprovalAuthority | "">("");

  // Security cheque
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeAmount, setChequeAmount] = useState<number>(0);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeImage, setChequeImage] = useState<string>("");

  // Validation errors (displayed inline)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  // Auto-calculate EMI
  useEffect(() => {
    if (advanceAmount > 0 && tenureMonths > 0) {
      const calculated = advanceAmount / tenureMonths;
      if (!isEmiEditable) {
        setEmiAmount(Math.round(calculated));
      }
    }
  }, [advanceAmount, tenureMonths, isEmiEditable]);

  // Real-time validation
  useEffect(() => {
    validateForm();
  }, [
    advanceAmount,
    tenureMonths,
    emiAmount,
    chequeNumber,
    chequeAmount,
    bankName,
    accountNumber,
    chequeDate,
    approvalAuthority,
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newWarnings: string[] = [];

    // Amount validation
    if (advanceAmount <= 0) {
      newErrors.advanceAmount = "Amount must be greater than 0";
    }

    // Tenure validation
    if (tenureMonths <= 0) {
      newErrors.tenureMonths = "Tenure must be greater than 0";
    } else if (tenureMonths < 3) {
      newWarnings.push("⚠️ Minimum recommended tenure is 3 months");
    } else if (tenureMonths > 12) {
      newWarnings.push("⚠️ Maximum tenure is 12 months");
    }

    // EMI validation
    if (emiAmount <= 0) {
      newErrors.emiAmount = "EMI amount required";
    } else if (advanceAmount > 0 && tenureMonths > 0) {
      const expectedEmi = advanceAmount / tenureMonths;
      if (Math.abs(emiAmount - expectedEmi) > 100) {
        newWarnings.push(
          `⚠️ EMI mismatch. Expected: ₹${Math.round(expectedEmi)} (Total: ₹${advanceAmount} / ${tenureMonths} months)`
        );
      }
    }

    // Cheque validations (HARD BLOCK)
    if (!chequeNumber) {
      newErrors.chequeNumber = "❌ Cheque number is mandatory";
    }

    if (chequeAmount <= 0) {
      newErrors.chequeAmount = "❌ Cheque amount required";
    } else if (chequeAmount < advanceAmount) {
      newErrors.chequeAmount = "❌ BLOCKED: Cheque amount must be ≥ Advance amount";
    }

    if (!bankName) {
      newErrors.bankName = "❌ Bank name required";
    }

    if (!accountNumber) {
      newErrors.accountNumber = "❌ Account number required";
    }

    if (!chequeDate) {
      newErrors.chequeDate = "❌ Cheque date required";
    }

    if (!approvalAuthority) {
      newErrors.approvalAuthority = "Approval authority required";
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In production: upload to server
      setChequeImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const canSubmit = () => {
    return (
      Object.keys(errors).length === 0 &&
      advanceAmount > 0 &&
      tenureMonths > 0 &&
      emiAmount > 0 &&
      chequeNumber &&
      chequeAmount >= advanceAmount &&
      bankName &&
      accountNumber &&
      chequeDate &&
      approvalAuthority
    );
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast.error("❌ Please fix all errors before submitting");
      return;
    }

    try {
      const securityCheque: SecurityCheque = {
        chequeNumber,
        chequeAmount,
        bankName,
        accountNumber,
        chequeDate,
        imageUrl: chequeImage,
        isDeposited: false,
      };

      const advance = advanceManagementService.createLongTermAdvance(
        currentUser.name,
        currentUser.name,
        currentUser.role,
        {
          advanceAmount,
          tenureMonths,
          emiAmount,
          isEmiEditable,
          approvalAuthority: approvalAuthority as ApprovalAuthority,
          securityCheque,
        }
      );

      toast.success("✅ Advance application submitted successfully!");
      navigate(`/advance/status/${advance.id}`);
    } catch (error: any) {
      toast.error(`❌ Submission failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/advance")}
            className="mb-4"
          >
            ← Back to Selection
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Long-Term Advance Application</h1>
          <p className="text-gray-600 mt-2">
            Complete all fields. System will enforce validations before submission.
          </p>
        </div>

        {/* Warnings Banner */}
        {warnings.length > 0 && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {warnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-amber-800">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Application Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Advance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Info (Read-only) */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">Employee ID</label>
                <p className="text-sm text-gray-900 font-mono mt-1">{currentUser.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <p className="text-sm text-gray-900 mt-1">{currentUser.role}</p>
              </div>
            </div>

            {/* Advance Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                value={advanceAmount || ""}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className={errors.advanceAmount ? "border-red-500" : ""}
              />
              {errors.advanceAmount && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {errors.advanceAmount}
                </p>
              )}
            </div>

            {/* Tenure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenure (Months) <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                value={tenureMonths || ""}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                placeholder="Enter tenure in months"
                className={errors.tenureMonths ? "border-red-500" : ""}
              />
              {errors.tenureMonths && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {errors.tenureMonths}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 3-12 months
              </p>
            </div>

            {/* EMI Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EMI Amount <span className="text-red-600">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Input
                  type="number"
                  value={emiAmount || ""}
                  onChange={(e) => setEmiAmount(Number(e.target.value))}
                  placeholder="Auto-calculated"
                  disabled={!isEmiEditable}
                  className={`flex-1 ${errors.emiAmount ? "border-red-500" : ""} ${
                    !isEmiEditable ? "bg-gray-100" : ""
                  }`}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isEmiEditable}
                    onChange={(e) => setIsEmiEditable(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-700">Edit EMI</span>
                </label>
              </div>
              {errors.emiAmount && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {errors.emiAmount}
                </p>
              )}
              {!isEmiEditable && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Auto-calculated • Enable "Edit EMI" to modify
                </p>
              )}
            </div>

            {/* Approval Authority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Authority <span className="text-red-600">*</span>
              </label>
              <Select
                value={approvalAuthority}
                onValueChange={(value) => setApprovalAuthority(value as ApprovalAuthority)}
              >
                <SelectTrigger
                  className={errors.approvalAuthority ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                  <SelectItem value="Sr Operations Manager">Sr Operations Manager</SelectItem>
                  <SelectItem value="City Manager">City Manager</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.approvalAuthority && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {errors.approvalAuthority}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Cheque Section */}
        <Card className="mb-6 border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="w-5 h-5" />
              Security Cheque (Mandatory)
            </CardTitle>
            <p className="text-sm text-red-700 mt-2">
              ⚠️ HARD REQUIREMENT: Disbursement will be LOCKED until cheque is deposited
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cheque Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Number <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
                placeholder="6-digit cheque number"
                className={errors.chequeNumber ? "border-red-500" : ""}
              />
              {errors.chequeNumber && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-semibold">
                  <XCircle className="w-3 h-3" />
                  {errors.chequeNumber}
                </p>
              )}
            </div>

            {/* Cheque Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Amount <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                value={chequeAmount || ""}
                onChange={(e) => setChequeAmount(Number(e.target.value))}
                placeholder="Must be ≥ advance amount"
                className={errors.chequeAmount ? "border-red-500" : ""}
              />
              {errors.chequeAmount && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-semibold">
                  <XCircle className="w-3 h-3" />
                  {errors.chequeAmount}
                </p>
              )}
              {!errors.chequeAmount && chequeAmount >= advanceAmount && advanceAmount > 0 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Cheque amount valid
                </p>
              )}
            </div>

            {/* Bank Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-600">*</span>
                </label>
                <Input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., HDFC Bank"
                  className={errors.bankName ? "border-red-500" : ""}
                />
                {errors.bankName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-semibold">
                    <XCircle className="w-3 h-3" />
                    {errors.bankName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number <span className="text-red-600">*</span>
                </label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                  className={errors.accountNumber ? "border-red-500" : ""}
                />
                {errors.accountNumber && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-semibold">
                    <XCircle className="w-3 h-3" />
                    {errors.accountNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Cheque Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Date <span className="text-red-600">*</span>
              </label>
              <Input
                type="date"
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
                className={errors.chequeDate ? "border-red-500" : ""}
              />
              {errors.chequeDate && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-semibold">
                  <XCircle className="w-3 h-3" />
                  {errors.chequeDate}
                </p>
              )}
            </div>

            {/* Cheque Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Image (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="cheque-upload"
                />
                <label
                  htmlFor="cheque-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click to upload cheque image
                  </span>
                </label>
                {chequeImage && (
                  <div className="mt-3">
                    <img
                      src={chequeImage}
                      alt="Cheque"
                      className="max-h-40 mx-auto rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card className={canSubmit() ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                {canSubmit() ? (
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">All validations passed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">
                      {Object.keys(errors).length} error(s) must be fixed
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {canSubmit()
                    ? "Ready to submit application"
                    : "Complete all required fields and fix errors"}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                size="lg"
                className="min-w-[200px]"
              >
                {canSubmit() ? "Submit Application" : "Fix Errors to Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
