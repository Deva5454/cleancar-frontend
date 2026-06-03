import { useState } from "react";
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
import { Download, Send, Eye, FileText, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";

interface SalarySlip {
  id: string;
  empId: string;
  name: string;
  role: string;
  month: string;
  paymentDate: string;
  earnings: {
    basicSalary: number;
    hra: number;
    allowances: number;
    incentives: number;
    bonuses: number;
  };
  deductions: {
    pf: number;
    esi: number;
    professionalTax: number;
    tds: number;
    others: number;
  };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: "generated" | "sent" | "downloaded";
}

export function SalarySlipGenerator() {
  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();

  const slips: SalarySlip[] = payrollRuns.slice(0,20).map(run => {
    const emp = employees.find(e => e.employeeId === run.employeeId);
    return {
      id: run.payrollId, empId: run.employeeId,
      name: emp ? emp.firstName + " " + emp.lastName : run.employeeId,
      role: emp?.role || "Employee", month: run.month,
      paymentDate: run.disbursedAt || run.period?.endDate || "",
      earnings: { basicSalary: Math.round((run.grossSalary||0)*0.5), hra: Math.round((run.grossSalary||0)*0.2), allowances: 1600, incentives: run.incentiveAmount||0, bonuses: 0 },
      deductions: { pf: run.deductions?.pf_employee||0, esi: run.deductions?.esic||0, professionalTax: run.deductions?.pt||200, tds: 0, others: 0 },
      grossSalary: run.grossSalary, totalDeductions: run.deductions?.total||0,
      netSalary: run.netSalary, status: run.status==="Disbursed"?"generated":"pending",
    };
  });
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filterMonth, setFilterMonth] = useState("March 2026");
  const [searchTerm, setSearchTerm] = useState("");

  const viewSlip = (slip: SalarySlip) => {
    setSelectedSlip(slip);
    setShowPreview(true);
  };

  const downloadSlip = (slip: SalarySlip) => {
    toast.success(`Salary slip downloaded for ${slip.name}`);
  };

  const sendSlip = (slip: SalarySlip, method: "email" | "whatsapp") => {
    toast.success(
      `Salary slip sent to ${slip.name} via ${method === "email" ? "Email" : "WhatsApp"}`
    );
  };

  const generateAllSlips = () => {
    toast.success(`${slips.length} salary slips generated successfully`);
  };

  const filteredSlips = slips.filter(
    (slip) =>
      slip.month === filterMonth &&
      (slip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.empId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salary Slip Generator</h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate and distribute salary slips to employees
          </p>
        </div>
        <Button onClick={generateAllSlips} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Generate All Slips
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="March 2026">March 2026</SelectItem>
                  <SelectItem value="February 2026">February 2026</SelectItem>
                  <SelectItem value="January 2026">January 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Slips ({filteredSlips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold">Employee</th>
                  <th className="text-left p-3 text-sm font-semibold">Month</th>
                  <th className="text-right p-3 text-sm font-semibold">Gross</th>
                  <th className="text-right p-3 text-sm font-semibold">Deductions</th>
                  <th className="text-right p-3 text-sm font-semibold">Net Salary</th>
                  <th className="text-center p-3 text-sm font-semibold">Status</th>
                  <th className="text-center p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlips.map((slip) => (
                  <tr key={slip.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-sm">{slip.name}</p>
                        <p className="text-xs text-gray-500">{slip.empId} • {slip.role}</p>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{slip.month}</td>
                    <td className="p-3 text-right text-sm">₹{(slip?.grossSalary ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-right text-sm text-red-600">
                      -₹{(slip?.totalDeductions ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-blue-600">₹{(slip?.netSalary ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        className={
                          slip.status === "sent"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : slip.status === "downloaded"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }
                      >
                        {slip.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewSlip(slip)}
                          className="h-8 px-2"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadSlip(slip)}
                          className="h-8 px-2"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendSlip(slip, "email")}
                          className="h-8 px-2"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendSlip(slip, "whatsapp")}
                          className="h-8 px-2"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && selectedSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Salary Slip */}
            <div className="p-8">
              {/* Header */}
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Company Name</h2>
                <p className="text-sm text-gray-600">Salary Slip for {selectedSlip.month}</p>
              </div>

              {/* Employee Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Employee Name</p>
                  <p className="font-medium">{selectedSlip.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee ID</p>
                  <p className="font-medium">{selectedSlip.empId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Designation</p>
                  <p className="font-medium">{selectedSlip.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Date</p>
                  <p className="font-medium">{selectedSlip.paymentDate}</p>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Earnings */}
                <div>
                  <h3 className="font-semibold mb-3 text-green-700">Earnings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Basic Salary</span>
                      <span>₹{(selectedSlip?.earnings?.basicSalary ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>HRA</span>
                      <span>₹{(selectedSlip?.earnings?.hra ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Allowances</span>
                      <span>₹{(selectedSlip?.earnings?.allowances ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Incentives</span>
                      <span>₹{(selectedSlip?.earnings?.incentives ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Bonuses</span>
                      <span>₹{(selectedSlip?.earnings?.bonuses ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Gross Salary</span>
                      <span className="text-green-600">₹{(selectedSlip?.grossSalary ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="font-semibold mb-3 text-red-700">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Provident Fund</span>
                      <span>₹{(selectedSlip?.deductions?.pf ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ESI</span>
                      <span>₹{(selectedSlip?.deductions?.esi ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Professional Tax</span>
                      <span>₹{(selectedSlip?.deductions?.professionalTax ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>TDS</span>
                      <span>₹{(selectedSlip?.deductions?.tds ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Others</span>
                      <span>₹{(selectedSlip?.deductions?.others ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total Deductions</span>
                      <span className="text-red-600">₹{(selectedSlip?.totalDeductions ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-600 text-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Salary</span>
                  <span className="text-2xl font-bold">₹{(selectedSlip?.netSalary ?? 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
                <p>This is a computer-generated salary slip and does not require a signature.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t px-8 py-4 flex justify-end gap-3 bg-gray-50">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadSlip(selectedSlip)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => {
                  sendSlip(selectedSlip, "email");
                  setShowPreview(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Employee
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
