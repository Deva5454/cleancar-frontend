/**
 * Statutory Payables Screen - Compliance payments view
 *
 * Shows statutory liabilities (PF, ESIC, PT, TDS, LWF) awaiting payment to authorities
 * Combines employee deductions + employer contributions per statutory type.
 *
 * Real aggregation + payment recording + challan generation via
 * statutoryChallanService — this used to compute everything from fields
 * that don't exist on PayrollRun and always render zeros; see that
 * service's header comment for the specifics of what was broken.
 *
 * @component
 */

import { useState, useMemo } from "react";
import { formatCurrency } from "../../lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BackButton } from "../ui/back-button";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Calendar,
  Building,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { usePayroll } from "../../contexts/PayrollContext";
import { useCity, CITIES } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import {
  statutoryChallanService,
  type StatutoryPayable,
  type StatutoryType,
} from "../../services/statutoryChallanService";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { ChallanDocument } from "./ChallanDocument";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StatutoryPayablesScreen() {
  const { payrollRuns } = usePayroll();
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthKey().split("-")[1]);
  const [selectedYear, setSelectedYear] = useState(() => currentMonthKey().split("-")[0]);
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const [payingFor, setPayingFor] = useState<StatutoryPayable | null>(null);
  const [viewingChallanFor, setViewingChallanFor] = useState<StatutoryPayable | null>(null);
  const [showAddLWF, setShowAddLWF] = useState(false);
  const [lwfPeriod, setLwfPeriod] = useState(`${selectedYear}-H1`);
  const [lwfEmployee, setLwfEmployee] = useState<number | "">("");
  const [lwfEmployer, setLwfEmployer] = useState<number | "">("");

  const monthKey = `${selectedYear}-${selectedMonth}`;

  const payables: StatutoryPayable[] = useMemo(() => {
    const monthly = statutoryChallanService.getPayablesForMonth(payrollRuns, monthKey, selectedCity);
    const lwfCities = selectedCity === "ALL" ? Object.keys(CITIES) : [selectedCity];
    const lwfEntries = lwfCities
      .map((c) => statutoryChallanService.getLWFPayable(`${selectedYear}-H1`, c) || statutoryChallanService.getLWFPayable(`${selectedYear}-H2`, c))
      .filter((p): p is StatutoryPayable => !!p);
    return [...monthly, ...lwfEntries];
  }, [payrollRuns, monthKey, selectedCity, selectedYear, refresh]);

  const filteredPayables = payables.filter((p) => {
    const statusMatch = selectedStatus === "ALL" || p.status === selectedStatus;
    const typeMatch = selectedType === "ALL" || p.statutoryType === selectedType;
    return statusMatch && typeMatch;
  });

  const summary = useMemo(() => {
    const totalPending = payables.filter((p) => p.status === "pending").reduce((s, p) => s + p.totalAmount, 0);
    const totalOverdue = payables.filter((p) => p.status === "overdue").reduce((s, p) => s + p.totalAmount, 0);
    const totalPaid = payables.filter((p) => p.status === "paid").reduce((s, p) => s + p.totalAmount, 0);
    const outstanding = payables.filter((p) => p.status !== "paid").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const nearestDueDate = outstanding[0]?.dueDate || "";
    const daysUntilDue = nearestDueDate
      ? Math.ceil((new Date(nearestDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;
    return { totalPending, totalOverdue, totalPaid, nearestDueDate, daysUntilDue };
  }, [payables]);

  const getStatusBadge = (status: StatutoryPayable["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      paid: "bg-green-100 text-green-700 border-green-300",
      overdue: "bg-red-100 text-red-700 border-red-300",
    };
    const labels = { pending: "Pending", paid: "Paid", overdue: "Overdue" };
    return <Badge className={`${styles[status]} border`}>{labels[status]}</Badge>;
  };

  const getStatutoryTypeLabel = (type: StatutoryPayable["statutoryType"]) => {
    const labels: Record<StatutoryType, string> = {
      PF: "Provident Fund",
      ESIC: "Employee State Insurance",
      PT: "Professional Tax",
      TDS: "Tax Deducted at Source",
      LWF: "Labour Welfare Fund",
    };
    return labels[type];
  };

  const handleAddLWF = () => {
    if (lwfEmployee === "" && lwfEmployer === "") { toast.error("Enter at least one amount"); return; }
    statutoryChallanService.addLWFEntry({
      period: lwfPeriod,
      cityId: selectedCity === "ALL" ? "CITY-SURAT" : selectedCity,
      employeeContribution: Number(lwfEmployee) || 0,
      employerContribution: Number(lwfEmployer) || 0,
      addedBy: currentUser?.name || "HR",
    });
    toast.success("LWF liability recorded");
    setShowAddLWF(false);
    setLwfEmployee(""); setLwfEmployer("");
    setRefresh((r) => r + 1);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/payroll/processing" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Statutory Payables</h1>
          <p className="text-gray-600">
            Compliance payments to government authorities (PF, ESIC, PT, TDS, LWF)
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddLWF(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add LWF Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(summary.totalPending)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(summary.totalOverdue)}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid (This Period)</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Due Date</p>
                <p className="text-lg font-bold text-blue-700">
                  {summary.nearestDueDate ? formatDate(summary.nearestDueDate) : "—"}
                </p>
                {summary.nearestDueDate && <p className="text-xs text-blue-600">{summary.daysUntilDue} days</p>}
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {summary.totalOverdue > 0 && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Overdue Payments Detected</p>
                <p className="text-sm text-red-700">
                  {formatCurrency(summary.totalOverdue)} in statutory payments are overdue.
                  Please remit immediately to avoid penalties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add LWF Entry */}
      {showAddLWF && (
        <Card className="border-purple-300 bg-purple-50">
          <CardHeader><CardTitle className="text-base">Add LWF Liability</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">
              LWF isn't tracked per payroll run (it's a small half-yearly flat contribution), so it's recorded here manually per period.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Period</Label>
                <Select value={lwfPeriod} onValueChange={setLwfPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={`${selectedYear}-H1`}>{selectedYear} H1 (Jun 30)</SelectItem>
                    <SelectItem value={`${selectedYear}-H2`}>{selectedYear} H2 (Dec 31)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employee Contribution (₹)</Label>
                <Input type="number" value={lwfEmployee} onChange={(e) => setLwfEmployee(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div>
                <Label>Employer Contribution (₹)</Label>
                <Input type="number" value={lwfEmployer} onChange={(e) => setLwfEmployer(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddLWF}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddLWF(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, idx) => (
                    <SelectItem key={month} value={String(idx + 1).padStart(2, "0")}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Cities</SelectItem>
                  {Object.values(CITIES).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statutory Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PF">PF - Provident Fund</SelectItem>
                  <SelectItem value="ESIC">ESIC - Employee Insurance</SelectItem>
                  <SelectItem value="PT">PT - Professional Tax</SelectItem>
                  <SelectItem value="TDS">TDS - Tax Deducted at Source</SelectItem>
                  <SelectItem value="LWF">LWF - Labour Welfare Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statutory Payables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Statutory Compliance Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayables.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">
              No statutory liability for this period — either no approved/disbursed payroll runs exist for {monthKey}, or filters are excluding everything.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statutory Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Employee Contribution</TableHead>
                  <TableHead className="text-right">Employer Contribution</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Payment Details</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((payable, index) => (
                  <TableRow key={index} className={payable.status === "overdue" ? "bg-red-50" : ""}>
                    <TableCell>
                      <div className="font-medium">{payable.statutoryType}</div>
                      <div className="text-xs text-gray-500">{getStatutoryTypeLabel(payable.statutoryType)}</div>
                    </TableCell>
                    <TableCell className="text-sm">{payable.month}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatCurrency(payable.employeeContribution)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatCurrency(payable.employerContribution)}</TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">{formatCurrency(payable.totalAmount)}</TableCell>
                    <TableCell className="text-sm">{formatDate(payable.dueDate)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(payable.status)}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {payable.status === "paid" ? (
                        <div>
                          <div>Ref: {payable.paymentReference}</div>
                          <div>Paid: {payable.paidDate && formatDate(payable.paidDate)}</div>
                          <div>Challan: {payable.challanNumber}</div>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {payable.status !== "paid" ? (
                          <Button variant="ghost" size="sm" onClick={() => setPayingFor(payable)} title="Record Payment">
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => setViewingChallanFor(payable)} title="View / Print Challan">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Integration Notice */}
      <Card className="border border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Statutory Payment Information</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-blue-800">
                <li><strong>PF & ESIC:</strong> Due by 15th of following month</li>
                <li><strong>PT:</strong> Due by 7th of following month (varies by state)</li>
                <li><strong>TDS:</strong> Due by 7th of following month</li>
                <li><strong>LWF:</strong> Due half-yearly (Jun 30 & Dec 31)</li>
              </ul>
              <p className="mt-2">
                Amounts here are computed from Approved/Disbursed payroll runs for the selected period. Recording a payment generates an internal challan number for your records — you must still file directly with each authority's official portal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {payingFor && (
        <RecordPaymentModal
          payable={payingFor}
          onClose={() => setPayingFor(null)}
          onRecorded={() => setRefresh((r) => r + 1)}
        />
      )}
      {viewingChallanFor && (
        <ChallanDocument payable={viewingChallanFor} onClose={() => setViewingChallanFor(null)} />
      )}
    </div>
  );
}

export default StatutoryPayablesScreen;
