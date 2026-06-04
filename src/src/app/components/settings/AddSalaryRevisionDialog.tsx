import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { format, differenceInMonths } from "date-fns";
import {
  DollarSign,
  Calendar as CalendarIcon,
  AlertCircle,
  Save,
  TrendingUp,
  User,
} from "lucide-react";
import { type SalaryChangeReason } from "../../data/costData";
import { getCurrentSalary } from "../../data/equipmentSalaryHistoryData";

interface AddSalaryRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Array<{ id: string; name: string; role: string; city: string }>;
  onSave: (revision: {
    employeeId: string;
    effectiveDate: Date;
    newMonthlySalary: number;
    reason: SalaryChangeReason;
    reference?: string;
    notes?: string;
  }) => void;
}

const SALARY_CHANGE_REASONS: SalaryChangeReason[] = [
  "Annual Increment",
  "Performance Revision",
  "Promotion",
  "Market Correction",
  "Special Recognition",
  "Other",
];

export function AddSalaryRevisionDialog({
  open,
  onOpenChange,
  employees,
  onSave,
}: AddSalaryRevisionDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date());
  const [newMonthlySalary, setNewMonthlySalary] = useState("");
  const [reason, setReason] = useState<SalaryChangeReason>("Annual Increment");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock user - in production from auth context
  const currentUser = "Rajesh Kumar (SA)";
  const isSA = true; // Check if user is SA

  const selectedEmp = employees.find((e) => e.id === selectedEmployee);
  const currentSalary = selectedEmployee ? getCurrentSalary(selectedEmployee) : 0;

  // Check if retroactive beyond 3 months
  const monthsDifference = differenceInMonths(new Date(), effectiveDate);
  const isRetroactiveBeyond3Months = monthsDifference > 3;
  const needsSAApproval = isRetroactiveBeyond3Months && !isSA;

  const handleSave = () => {
    // Validation
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    if (!newMonthlySalary || parseFloat(newMonthlySalary) <= 0) {
      toast.error("Please enter a valid salary amount");
      return;
    }

    if (parseFloat(newMonthlySalary) === currentSalary) {
      toast.error("New salary must be different from current salary");
      return;
    }

    if (needsSAApproval) {
      toast.error(
        "Retroactive salary changes beyond 3 months require SA approval",
        {
          description: "Please contact your Super Admin to process this revision",
        }
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onSave({
        employeeId: selectedEmployee,
        effectiveDate,
        newMonthlySalary: parseFloat(newMonthlySalary),
        reason,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success("Salary revision added successfully", {
        description: `${selectedEmp?.name} — ₹${parseFloat(
          newMonthlySalary
        ).toLocaleString()}/month`,
      });

      // Reset form
      setSelectedEmployee("");
      setEffectiveDate(new Date());
      setNewMonthlySalary("");
      setReason("Annual Increment");
      setReference("");
      setNotes("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 800);
  };

  const salaryChange = newMonthlySalary
    ? parseFloat(newMonthlySalary) - currentSalary
    : 0;
  const salaryChangePercent =
    currentSalary > 0 ? (salaryChange / currentSalary) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Add Salary Revision
          </DialogTitle>
          <DialogDescription>
            Record a salary change for an employee
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role} ({emp.city})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Salary Display */}
          {selectedEmployee && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Current Monthly Salary
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{currentSalary.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {selectedEmp?.name} — {selectedEmp?.role}
                  </div>
                </div>
                {newMonthlySalary && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Change</div>
                    <div
                      className={`text-xl font-bold flex items-center gap-1 justify-end ${
                        salaryChange > 0
                          ? "text-green-600"
                          : salaryChange < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {salaryChange > 0 && <TrendingUp className="w-4 h-4" />}
                      {salaryChange > 0 ? "+" : ""}
                      {salaryChangePercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {salaryChange > 0 ? "+" : ""}₹
                      {salaryChange.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Effective Date */}
          <div className="space-y-2">
            <Label htmlFor="effectiveDate" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              Effective From Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? (
                    format(effectiveDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={(date) => date && setEffectiveDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {isRetroactiveBeyond3Months && (
              <div
                className={`flex items-start gap-2 rounded p-2 ${
                  needsSAApproval
                    ? "bg-red-50 border border-red-200"
                    : "bg-orange-50 border border-orange-200"
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    needsSAApproval ? "text-red-600" : "text-orange-600"
                  }`}
                />
                <div
                  className={`text-xs ${
                    needsSAApproval ? "text-red-800" : "text-orange-800"
                  }`}
                >
                  {needsSAApproval ? (
                    <>
                      <strong>SA Approval Required:</strong> Retroactive salary changes
                      beyond 3 months require Super Admin approval. Please contact SA
                      to process this revision.
                    </>
                  ) : (
                    <>
                      <strong>Retroactive Change:</strong> This salary revision is
                      more than 3 months in the past ({monthsDifference} months). SA
                      approval granted.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Monthly Salary */}
          <div className="space-y-2">
            <Label htmlFor="newMonthlySalary" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              New Monthly Salary (₹) *
            </Label>
            <Input
              id="newMonthlySalary"
              type="number"
              step="100"
              min="0"
              placeholder="16500"
              value={newMonthlySalary}
              onChange={(e) => setNewMonthlySalary(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as SalaryChangeReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {SALARY_CHANGE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">
              Reference (Optional)
              <span className="text-xs text-gray-500 ml-2">
                HR letter number or appraisal reference
              </span>
            </Label>
            <Input
              id="reference"
              placeholder="e.g., Appraisal Letter APR-2026-001, Promotion Letter PR-2026-004"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (Optional)
              <span className="text-xs text-gray-500 ml-2">
                Additional context
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Approved By */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Approved By
            </Label>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <Badge className="bg-green-600 text-white">{currentUser}</Badge>
              <div className="text-xs text-gray-600 mt-2">
                Your name will be automatically recorded as the approver
              </div>
            </div>
          </div>

          {/* Mid-Month Calculation Info */}
          {effectiveDate.getDate() > 1 && effectiveDate.getDate() < 28 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <strong>Mid-Month Revision:</strong> Since this effective date is
                  on the {effectiveDate.getDate()}
                  {effectiveDate.getDate() === 1
                    ? "st"
                    : effectiveDate.getDate() === 2
                    ? "nd"
                    : effectiveDate.getDate() === 3
                    ? "rd"
                    : "th"}
                  , the cost per wash engine will automatically split the month into
                  two periods: days 1-{effectiveDate.getDate() - 1} using the old
                  salary, and days {effectiveDate.getDate()}-31 using the new salary.
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting || needsSAApproval}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Add Salary Revision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
