import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";
import { statutoryChallanService, type StatutoryPayable } from "../../services/statutoryChallanService";

export function RecordPaymentModal({
  payable, onClose, onRecorded,
}: {
  payable: StatutoryPayable;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const { currentUser } = useRole();
  const [paymentReference, setPaymentReference] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = () => {
    if (!paymentReference.trim()) { toast.error("Enter a payment/UTR reference"); return; }

    const record = statutoryChallanService.recordPayment({
      statutoryType: payable.statutoryType,
      month: payable.month,
      cityId: payable.cityId,
      amount: payable.totalAmount,
      paymentReference,
      paidDate,
      paidBy: currentUser?.name || "Payroll Admin",
    });

    toast.success(`Payment recorded — Challan No. ${record.challanNumber}`);
    onRecorded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Record {payable.statutoryType} Payment</CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-500">
            {payable.month} — Total due: <span className="font-semibold text-gray-800">₹{payable.totalAmount.toLocaleString("en-IN")}</span>
          </div>
          <div>
            <Label>Payment / UTR Reference</Label>
            <Input
              value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. UTR123456789 or Challan Receipt No."
            />
          </div>
          <div>
            <Label>Paid Date</Label>
            <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
          <p className="text-xs text-gray-400">
            A challan number will be generated automatically once you confirm. Record this only after you've actually remitted the amount with the authority.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>Confirm Payment</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RecordPaymentModal;
