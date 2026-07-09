import { useState, useRef, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import {
  expenseClaimService,
  type ExpenseCategory,
  type ExpenseClaim,
} from "../../services/expenseClaimService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Receipt, Camera, History, CheckCircle, Clock, XCircle, IndianRupee } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: ExpenseCategory[] = [
  "Food", "Internet", "Mobile Bill", "Medical", "Office Supplies", "Other",
];

const STATUS_COLOR: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  "Pending Manager": "bg-amber-100 text-amber-700",
  "Pending HR": "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  "Added to Payroll": "bg-purple-100 text-purple-700",
};

export function ClaimEmployeeView() {
  const { currentUser } = useRole();
  const { employees } = useEmployee();
  const { city, cityInfo } = useCity();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [refresh, setRefresh] = useState(0);

  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [amount, setAmount] = useState<number | "">("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [receiptData, setReceiptData] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const emp = employees.find((e: { id: string }) => e.id === currentUser?.employeeId);
  const reportingMgr = employees.find(
    (e: { id: string; fullName: string }) =>
      e.fullName === emp?.reportingManager || e.id === emp?.reportingManager
  );

  const myClaims = useMemo(
    () => expenseClaimService.getByEmployee(currentUser?.employeeId || ""),
    [refresh, currentUser?.employeeId]
  );

  const captureReceipt = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setReceiptData(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setCategory("Food");
    setAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setReceiptData("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = () => {
    if (amount === "" || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!description.trim()) { toast.error("Add a short description"); return; }
    if (!reportingMgr) { toast.error("No reporting manager found on your profile — contact HR"); return; }

    const claim = expenseClaimService.create({
      employeeId: currentUser?.employeeId || "",
      employeeName: currentUser?.name || emp?.fullName || "",
      designation: emp?.designation || "",
      cityId: cityInfo?.id || "",
      city: city || "",
      reportingManagerId: reportingMgr.id,
      reportingManagerName: reportingMgr.fullName,
      category,
      amount: Number(amount),
      expenseDate,
      description,
      receiptDataUrl: receiptData || undefined,
    });
    expenseClaimService.submit(claim.id);

    toast.success("Claim submitted for manager approval");
    resetForm();
    setRefresh((r) => r + 1);
    setTab("history");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === "new" ? "default" : "outline"} size="sm" onClick={() => setTab("new")}>
          <Receipt className="w-4 h-4 mr-1" /> New Claim
        </Button>
        <Button variant={tab === "history" ? "default" : "outline"} size="sm" onClick={() => setTab("history")}>
          <History className="w-4 h-4 mr-1" /> My Claims ({myClaims.length})
        </Button>
      </div>

      {tab === "new" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Submit an Expense Claim</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number" min={1} value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 450"
              />
            </div>
            <div>
              <Label>Expense Date</Label>
              <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Team lunch with client on-site visit"
              />
            </div>
            <div>
              <Label>Receipt (optional)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-1" /> {receiptData ? "Retake" : "Attach Receipt"}
                </Button>
                {receiptData && <Badge className="bg-green-100 text-green-700">Attached</Badge>}
              </div>
              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && captureReceipt(e.target.files[0])}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full">Submit for Approval</Button>
          </CardContent>
        </Card>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {myClaims.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No claims submitted yet.</p>
          )}
          {myClaims.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.category}</span>
                    <Badge className={STATUS_COLOR[c.status]}>{c.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{c.description}</p>
                  <p className="text-xs text-gray-400">{c.expenseDate}</p>
                </div>
                <div className="flex items-center gap-1 font-semibold text-gray-800">
                  <IndianRupee className="w-4 h-4" /> {c.amount.toLocaleString("en-IN")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClaimEmployeeView;
