import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar, Check, ChevronDown, ChevronUp, Lock, User, Database } from "lucide-react";
import { toast } from "sonner";

const SALARY_LOG_KEY = "cleancar_salary_change_log";

interface SalaryChange {
  id: string;
  date: string;
  structure: string;
  basicSalary: number;
  netSalary: number;
  changedBy: string;
  reason: string;
}

const SALARY_STRUCTURES = [
  { id: "struct-1", name: "Car Washer - Entry Level", basic: 15000 },
  { id: "struct-2", name: "Car Washer - Experienced", basic: 18000 },
  { id: "struct-3", name: "Supervisor - Standard", basic: 25000 },
  { id: "struct-4", name: "Operations Manager", basic: 45000 },
];

export function EmployeeSalaryAssignment() {
  const [selectedStructure, setSelectedStructure] = useState("struct-2");
  const [effectiveDate, setEffectiveDate] = useState("2026-05-01");
  const [showIncentiveBreakdown, setShowIncentiveBreakdown] = useState(false);

  // Editable salary components
  const [basicSalary, setBasicSalary] = useState(18000);
  const [hra, setHra] = useState(9000);
  const [conveyance, setConveyance] = useState(1600);
  const [medical, setMedical] = useState(1250);
  const [special, setSpecial] = useState(3600);

  // System-driven (non-editable)
  const incentive = 1200; // System-driven from washer performance

  // Calculations
  const grossEarnings = basicSalary + hra + conveyance + medical + special + incentive;
  const pfDeduction = Math.round(basicSalary * 0.12);
  const esicDeduction = Math.round(grossEarnings * 0.0075);
  const ptDeduction = 200;
  const totalDeductions = pfDeduction + esicDeduction + ptDeduction;
  const netSalary = grossEarnings - totalDeductions;

  // Employer contributions (compliance - read-only)
  const employerPf = Math.round(basicSalary * 0.12);
  const employerEsic = Math.round(grossEarnings * 0.0325);

  // Incentive breakdown
  const incentiveBreakdown = {
    cars: 22,
    twoWheelers: 14,
    totalUnits: 36,
    threshold: 30,
    eligibleUnits: 6,
    ratePerUnit: 25,
    baseIncentive: 150,
    addons: 21,
    addonRate: 50,
    addonIncentive: 1050,
    totalIncentive: 1200,
  };

  const handleSave = () => {
    const log = JSON.parse(localStorage.getItem(SALARY_LOG_KEY) || "[]");
    log.unshift({ date: new Date().toISOString(), previousStructure: selectedStructure, newStructure: selectedStructure, changedBy: "HR" });
    localStorage.setItem(SALARY_LOG_KEY, JSON.stringify(log));
    toast.success("Salary assignment updated successfully");
  };

  const handleStructureChange = (structureId: string) => {
    setSelectedStructure(structureId);
    const structure = SALARY_STRUCTURES.find((s) => s.id === structureId);
    if (structure) {
      setBasicSalary(structure.basic);
      setHra(Math.round(structure.basic * 0.5));
      setSpecial(Math.round(structure.basic * 0.2));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Assignment & Overrides */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Employee Salary Assignment</h2>
          <p className="text-sm text-gray-500 mt-1">
            Assign salary structure and configure individual overrides
          </p>
        </div>

        {/* Engine Label */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Database className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Data Source: payrollEngine</p>
            <p className="text-xs text-blue-700">
              Employee salary assignment • Calculations performed by payrollEngine
            </p>
          </div>
        </div>

        {/* Employee Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Ramesh Kumar</div>
                <div className="text-sm text-gray-500">EMP-2024-0042 • Car Washer</div>
              </div>
              <div className="ml-auto">
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Structure Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Structure Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="structure">Salary Structure</Label>
                <Select value={selectedStructure} onValueChange={handleStructureChange}>
                  <SelectTrigger id="structure">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALARY_STRUCTURES.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective-date">Effective Date</Label>
                <div className="relative">
                  <Input
                    id="effective-date"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable Components */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salary Components (Editable)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="basic">Basic Salary</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="basic"
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hra">HRA</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="hra"
                    type="number"
                    value={hra}
                    onChange={(e) => setHra(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conveyance">Conveyance Allowance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="conveyance"
                    type="number"
                    value={conveyance}
                    onChange={(e) => setConveyance(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical">Medical Allowance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="medical"
                    type="number"
                    value={medical}
                    onChange={(e) => setMedical(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special">Special Allowance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="special"
                    type="number"
                    value={special}
                    onChange={(e) => setSpecial(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="incentive">Incentive (System Driven)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="incentive"
                    type="number"
                    value={incentive}
                    disabled
                    className="pl-8 bg-gray-100 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  Auto-calculated from performance
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Section (Read-Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Compliance Deductions (Read-Only)
              <Lock className="w-4 h-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Employee PF (12%)</div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{pfDeduction.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Employee ESIC (0.75%)</div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{esicDeduction.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Professional Tax</div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{ptDeduction.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Total Deductions</div>
                <div className="text-lg font-semibold text-red-600">
                  ₹{totalDeductions.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="font-medium text-purple-900 mb-2 text-sm">
                Employer Contributions
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Employer PF (12%)</span>
                  <span className="font-medium">₹{employerPf.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Employer ESIC (3.25%)</span>
                  <span className="font-medium">₹{employerEsic.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change History Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {JSON.parse(localStorage.getItem(SALARY_LOG_KEY) || "[]").map((change: any, index: number) => (
                <div key={change.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                    {index < JSON.parse(localStorage.getItem(SALARY_LOG_KEY) || "[]").length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-gray-900">{change.structure}</div>
                      <div className="text-sm text-gray-500">{change.date}</div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{change.reason}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Basic: </span>
                        <span className="font-medium">₹{(change?.basicSalary ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Net: </span>
                        <span className="font-medium">₹{(change?.netSalary ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">By: </span>
                        <span className="font-medium">{change.changedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Save Assignment
          </Button>
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>

      {/* Right Panel - Live Preview (Sticky) */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          <Card className="border-2 border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-base text-green-900">Salary Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">₹{basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">HRA</span>
                    <span className="font-medium">₹{hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conveyance</span>
                    <span className="font-medium">₹{conveyance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Medical</span>
                    <span className="font-medium">₹{medical.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Special Allowance</span>
                    <span className="font-medium">₹{special.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Incentive</span>
                    <span className="font-medium text-blue-600">
                      ₹{incentive.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>Gross Earnings</span>
                    <span className="text-green-600">₹{grossEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expandable Incentive Breakdown */}
              <div>
                <button
                  onClick={() => setShowIncentiveBreakdown(!showIncentiveBreakdown)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <span className="font-medium text-blue-900 text-sm">
                    Incentive Breakdown
                  </span>
                  {showIncentiveBreakdown ? (
                    <ChevronUp className="w-4 h-4 text-blue-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-700" />
                  )}
                </button>
                {showIncentiveBreakdown && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-700">
                        <span>Cars Washed</span>
                        <span className="font-medium">{incentiveBreakdown.cars} units</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>2W Washed</span>
                        <span className="font-medium">{incentiveBreakdown.twoWheelers} units</span>
                      </div>
                      <div className="flex justify-between text-blue-700">
                        <span className="font-semibold">Total Units</span>
                        <span className="font-semibold">
                          {incentiveBreakdown.totalUnits} units
                        </span>
                      </div>
                      <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between text-gray-700">
                        <span>Threshold</span>
                        <span className="font-medium">{incentiveBreakdown.threshold} units</span>
                      </div>
                      <div className="flex justify-between text-blue-700">
                        <span className="font-semibold">Eligible Units</span>
                        <span className="font-semibold">
                          {incentiveBreakdown.eligibleUnits} units
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Rate per Unit</span>
                        <span className="font-medium">₹{incentiveBreakdown.ratePerUnit}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between font-semibold text-blue-900">
                        <span>Base Incentive</span>
                        <span>₹{(incentiveBreakdown?.baseIncentive ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Add-ons ({incentiveBreakdown.addons})</span>
                        <span className="font-medium">
                          ₹{(incentiveBreakdown?.addonIncentive ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between font-bold text-blue-900">
                        <span>Total Incentive</span>
                        <span>₹{(incentiveBreakdown?.totalIncentive ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Deductions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Employee PF</span>
                    <span className="font-medium text-red-600">
                      ₹{pfDeduction.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Employee ESIC</span>
                    <span className="font-medium text-red-600">
                      ₹{esicDeduction.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Professional Tax</span>
                    <span className="font-medium text-red-600">
                      ₹{ptDeduction.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-red-600">₹{totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-900">Net Salary</span>
                  <span className="text-2xl font-bold text-green-700">
                    ₹{netSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cost to Company */}
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-900">Total CTC</span>
                  <span className="text-lg font-bold text-purple-700">
                    ₹{(netSalary + employerPf + employerEsic).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
