import { useCity } from "../../contexts/CityContext";
import { Button } from "../ui/button";
import { Printer, X } from "lucide-react";
import type { StatutoryPayable } from "../../services/statutoryChallanService";

const AUTHORITY_NAME: Record<string, string> = {
  PF: "Employees' Provident Fund Organisation (EPFO)",
  ESIC: "Employees' State Insurance Corporation (ESIC)",
  PT: "State Professional Tax Department",
  TDS: "Income Tax Department (TRACES)",
  LWF: "Labour Welfare Fund Board",
};

const CHALLAN_TITLE: Record<string, string> = {
  PF: "Electronic Challan cum Return (ECR) — PF Remittance",
  ESIC: "ESI Contribution Challan",
  PT: "Professional Tax Remittance Challan",
  TDS: "TDS Remittance Challan (Form 281)",
  LWF: "Labour Welfare Fund Remittance Challan",
};

export function ChallanDocument({ payable, onClose }: { payable: StatutoryPayable; onClose: () => void }) {
  const { cityInfo } = useCity();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-white print:p-0 print:static">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between p-3 border-b print:hidden">
          <h3 className="font-semibold">Challan Preview</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Print / Save as PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="p-8 space-y-6" id="challan-print-area">
          <div className="text-center border-b pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{AUTHORITY_NAME[payable.statutoryType]}</p>
            <h2 className="text-xl font-bold mt-1">{CHALLAN_TITLE[payable.statutoryType]}</h2>
            {payable.challanNumber && (
              <p className="text-sm text-gray-600 mt-2">Challan No: <span className="font-mono">{payable.challanNumber}</span></p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Employer</p>
              <p className="font-medium">CleanCar Services — {cityInfo.displayName}</p>
            </div>
            <div>
              <p className="text-gray-500">Period</p>
              <p className="font-medium">{payable.month}</p>
            </div>
            <div>
              <p className="text-gray-500">Employees Covered</p>
              <p className="font-medium">{payable.employeeCount || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">{payable.dueDate}</p>
            </div>
          </div>

          <table className="w-full text-sm border-t border-b">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Employee Contribution</td>
                <td className="py-2 text-right font-medium">₹{payable.employeeContribution.toLocaleString("en-IN")}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Employer Contribution</td>
                <td className="py-2 text-right font-medium">₹{payable.employerContribution.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Total Remittance</td>
                <td className="py-2 text-right font-bold text-lg">₹{payable.totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          {payable.status === "paid" ? (
            <div className="grid grid-cols-2 gap-4 text-sm bg-green-50 border border-green-200 rounded-md p-3">
              <div>
                <p className="text-gray-500">Payment Reference</p>
                <p className="font-medium">{payable.paymentReference}</p>
              </div>
              <div>
                <p className="text-gray-500">Paid On</p>
                <p className="font-medium">{payable.paidDate}</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              Not yet remitted. Record the payment after filing with {AUTHORITY_NAME[payable.statutoryType]} to lock in the challan number and payment reference on this document.
            </div>
          )}

          <p className="text-xs text-gray-400 text-center pt-4 border-t">
            System-generated on {new Date().toLocaleDateString("en-IN")} for internal record-keeping. File the actual remittance directly with {AUTHORITY_NAME[payable.statutoryType]}'s official portal — this document is not a substitute for the authority-issued acknowledgement.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChallanDocument;
