/**
 * Salary Payment Screen - Record salary disbursements
 *
 * Supports bulk and individual salary payments
 * Integrates with payment module and updates ledger
 *
 * @component
 */

import { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BackButton } from "../ui/back-button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
  DollarSign,
  Upload,
  FileText,
  RefreshCw,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "../ui/checkbox";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useFinance, type Payable } from "../../contexts/FinanceContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";

const PAYMENT_METHOD_MAP: Record<string, NonNullable<Payable["paymentMethod"]>> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CHEQUE: "Cheque",
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SalaryPayable {
  payableId: string;
  payrollId?: string;
  employeeId: string;
  employeeName: string;
  role: string;
  netSalary: number;
  expenseId: string;
  accountNumber?: string;
  ifscCode?: string;
  selected: boolean;
}

interface PaymentForm {
  paymentMode: string;
  paymentDate: string;
  paymentReference: string;
  notes: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SalaryPaymentScreen() {
  const { disbursePayroll } = usePayroll();
  const { employees } = useEmployee();
  const { getSalaryPayables, getTravelPayables, markAsPaid } = useFinance();
  const { city } = useCity();
  const { currentUser } = useRole();

  // Real Finance Payables of type "Salary" — created when a payroll run is
  // approved (fires cc360_payroll_approved). Previously this built its list
  // straight from ALL payrollRuns regardless of status, so drafts and
  // already-disbursed runs showed up as "payable" alongside genuinely
  // approved ones, with no link back to a real Payable record at all.
  const basePayables: SalaryPayable[] = getSalaryPayables(city)
    .filter(p => p.status === "Approved")
    .map(p => {
      const emp = employees.find(e => e.employeeId === p.employeeId);
      return {
        payableId: p.payableId,
        payrollId: p.payrollId,
        employeeId: p.employeeId || "",
        employeeName: p.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : p.employeeId) || "",
        role: emp?.role || "Employee",
        netSalary: p.netSalaryPayable ?? p.amount,
        expenseId: p.payableId,
        accountNumber: emp?.bankDetails?.accountNumber || "—",
        ifscCode: emp?.bankDetails?.ifscCode || "—",
        selected: false,
      };
  });
  const [payables, setPayables] = useState<SalaryPayable[]>(basePayables);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [travelUTR, setTravelUTR] = useState<Record<string, string>>({});

  const travelPayables = getTravelPayables(city)
    .filter(p => p.status === "Pending")
    .map(p => {
      const emp = employeeDatabaseService.getById(p.employeeId || "");
      return {
        ...p,
        bankAccountNumber: emp?.bankAccountNumber || "—",
        bankIFSC: emp?.bankIFSC || "—",
        bankName: emp?.bankName || "—",
      };
    });

  const handleMarkTravelPaid = (payableId: string) => {
    const utr = travelUTR[payableId]?.trim();
    if (!utr) {
      toast.error("Enter a UTR / payment reference before marking as paid");
      return;
    }
    markAsPaid(payableId, utr, "Bank Transfer");
    toast.success("Travel reimbursement marked as paid");
    setTravelUTR(prev => { const next = { ...prev }; delete next[payableId]; return next; });
  };

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    paymentMode: "BANK_TRANSFER",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentReference: "",
    notes: "",
  });

  const [bankFileUploaded, setBankFileUploaded] = useState(false);
  const [bankFileName, setBankFileName] = useState("");

  useEffect(() => {
    loadPayables();
  }, []);

  async function loadPayables() {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      // In production:
      // const data = await payrollEngine.getUnpaidSalaries({
      //   month, year, status: 'approved'
      // });

      setPayables(basePayables);
    } catch (error) {
      toast.error("Failed to load payables");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setPayables(payables.map(p => ({ ...p, selected: checked })));
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    setPayables(
      payables.map(p =>
        p.employeeId === employeeId ? { ...p, selected: checked } : p
      )
    );
  };

  const selectedPayables = payables.filter(p => p.selected);
  const totalPaymentAmount = selectedPayables.reduce((sum, p) => sum + p.netSalary, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBankFileName(file.name);
      setBankFileUploaded(true);
      toast.success("Bank file uploaded successfully");
    }
  };

  const handleBulkPayment = async () => {
    if (selectedPayables.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    if (!paymentForm.paymentReference.trim()) {
      toast.error("Please enter payment reference");
      return;
    }

    // Bank details are required for actual disbursement — this used to
    // let any selection through with a "—" placeholder shown, no blocking
    // whatsoever, meaning payment could be "recorded" for an employee with
    // nowhere for the money to actually go.
    const missingBank = selectedPayables.filter(
      (p) => !p.accountNumber || p.accountNumber === "—" || !p.ifscCode || p.ifscCode === "—"
    );
    if (missingBank.length > 0) {
      toast.error(
        `${missingBank.length} selected employee(s) are missing bank details — cannot disburse: ` +
        missingBank.map((p) => p.employeeName).join(", ")
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Settle each selected Payable through FinanceContext (creates the
      // ledger settlement entry — same real mechanism already used for
      // Travel payables above) and disburse the linked PayrollRun through
      // the typed workflow engine so payslips/other screens reflect it.
      // Previously this whole handler was a setTimeout mock that never
      // called either of these — it always reported success without
      // persisting anything.
      const paymentMethod = PAYMENT_METHOD_MAP[paymentForm.paymentMode] || "Bank Transfer";
      let disburseFailed = 0;
      for (const p of selectedPayables) {
        markAsPaid(p.payableId, paymentForm.paymentReference, paymentMethod);
        if (p.payrollId && !disbursePayroll(p.payrollId, currentUser?.name || "Accounts", paymentForm.paymentReference)) {
          disburseFailed++;
        }
      }

      if (disburseFailed > 0) {
        toast.error(`${disburseFailed} of ${selectedPayables.length} payroll run(s) could not be marked disbursed — check role permissions`);
      } else {
        toast.success(`Payment recorded for ${selectedPayables.length} employees`);
      }

      // Clear selections
      setPayables(payables.map(p => ({ ...p, selected: false })));
      setPaymentForm({
        ...paymentForm,
        paymentReference: "",
        notes: "",
      });
      setBankFileUploaded(false);
      setBankFileName("");
    } catch (error) {
      toast.error("Payment recording failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    toast.success("Bank transfer template downloaded");
    // In production: Download CSV template for bank upload
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/payroll/salary-payables" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Salary Payment</h1>
          <p className="text-gray-600">
            Record salary disbursements and update ledger
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Bank Template
        </Button>
      </div>

      {/* Payment Summary */}
      {selectedPayables.length > 0 && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected for Payment</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(totalPaymentAmount)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPayables.length} employee{selectedPayables.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-12 h-12 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Mode *</Label>
              <Select
                value={paymentForm.paymentMode}
                onValueChange={(value) =>
                  setPaymentForm({ ...paymentForm, paymentMode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Reference / Transaction ID *</Label>
              <Input
                placeholder="e.g., NEFT123456789"
                value={paymentForm.paymentReference}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentReference: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Bank File Upload (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bank-file-upload"
                />
                <label htmlFor="bank-file-upload" className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Upload className="w-4 h-4" />
                      {bankFileUploaded ? bankFileName : "Upload bank transfer file"}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any notes or comments..."
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Select Employees for Payment</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={payables.every(p => p.selected)}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                Select All
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading employees...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>IFSC Code</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Payable ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map((payable) => (
                  <TableRow key={payable.employeeId}>
                    <TableCell>
                      <Checkbox
                        checked={payable.selected}
                        onCheckedChange={(checked) =>
                          handleSelectEmployee(payable.employeeId, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{payable.employeeName}</div>
                      <div className="text-xs text-gray-500">{payable.employeeId}</div>
                    </TableCell>
                    <TableCell className="text-sm">{payable.role}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {payable.accountNumber || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {payable.ifscCode || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payable.netSalary)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {payable.expenseId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Travel Reimbursement Payables */}
      {travelPayables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Travel Reimbursement Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>UTR / Payment Ref</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {travelPayables.map((payable) => (
                  <TableRow key={payable.payableId}>
                    <TableCell>
                      <div className="font-medium">{payable.employeeName}</div>
                      <div className="text-xs text-gray-500">{payable.description}</div>
                      {payable.isAdhoc && (
                        <Badge className="mt-1 bg-amber-100 text-amber-800">Ad-hoc</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      <div>{payable.bankAccountNumber}</div>
                      <div className="text-xs text-gray-500">{payable.bankIFSC} · {payable.bankName}</div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payable.amount)}
                    </TableCell>
                    <TableCell className="text-sm">{payable.dueDate}</TableCell>
                    <TableCell>
                      <Input
                        placeholder="e.g., NEFT123456789"
                        value={travelUTR[payable.payableId] || ""}
                        onChange={(e) =>
                          setTravelUTR(prev => ({ ...prev, [payable.payableId]: e.target.value }))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleMarkTravelPaid(payable.payableId)}>
                        Mark as Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-900">Ready to Process Payment</p>
              <p className="text-sm text-green-700">
                Payment will update salary payables and reduce bank balance in ledger
              </p>
            </div>
            <Button
              onClick={handleBulkPayment}
              disabled={isProcessing || selectedPayables.length === 0}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment ({selectedPayables.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Notice */}
      <Card className="border border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Finance Integration</p>
              <p className="mt-1">
                Recording payment will create ledger entries:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-blue-800">
                <li>Dr: Salary Payable (₹{formatCurrency(totalPaymentAmount)})</li>
                <li>Cr: Bank Account (₹{formatCurrency(totalPaymentAmount)})</li>
              </ul>
              <p className="mt-2">
                This reduces Accounts Payable and updates Cash/Bank balance in the finance ledger.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SalaryPaymentScreen;
