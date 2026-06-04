// Exit & Full & Final Settlement Module
import { DataService } from "../../services/DataService";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { BackButton } from "../ui/back-button";
import { useRole } from "../../contexts/RoleContext";
import {
  LogOut, CheckCircle, X, Clock, DollarSign, FileText,
  AlertCircle, User, Package, Shield, Calendar, Bell
} from "lucide-react";

type MaterialItem = {
  id: string;
  name: string;
  condition: "Good" | "Minor Damage" | "Major Damage" | "Missing" | "Pending";
  comments?: string;
  verifiedBy?: string;
  verifiedOn?: string;
};

type FFCalculation = {
  pendingSalary: number;
  leaveEncashment: number;
  bonus: number;
  reimbursements: number;
  totalEarnings: number;
  noticePeriodRecovery: number;
  equipmentDamage: number;
  advanceRecovery: number;
  totalDeductions: number;
  netAmount: number;
};

type ExitRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  designation: string;
  resignationDate: string;
  lastWorkingDate: string;
  noticePeriod: number; // days
  reasonForLeaving: string;
  status: "Exit Initiated" | "Supervisor Verification Pending" | "Supervisor Verified" | 
          "HR Verification Pending" | "HR Verified" | "F&F Calculated" | 
          "Awaiting Super Admin Approval" | "Super Admin Approved" | 
          "With Accounts" | "Disbursement Scheduled" | "Disbursed" | "Closed";
  materials: MaterialItem[];
  supervisorVerifiedBy?: string;
  supervisorVerifiedOn?: string;
  hrVerifiedBy?: string;
  hrVerifiedOn?: string;
  ffCalculation?: FFCalculation;
  superAdminApprovedBy?: string;
  superAdminApprovedOn?: string;
  disbursementDate?: string;
  disbursedOn?: string;
  paymentMode?: string;
  paymentReference?: string;
  accountsProcessedBy?: string;
};

const returnableMaterials: Omit<MaterialItem, "id" | "condition">[] = [
  { name: "Car Washing Equipment Set" },
  { name: "Vacuum Cleaner" },
  { name: "Pressure Washer" },
  { name: "Company Uniform (2 sets)" },
  { name: "ID Card" },
  { name: "Access Card/Keys" },
  { name: "Mobile Phone (if issued)" },
  { name: "Tablet (if issued)" },
  { name: "Tool Kit" },
  { name: "Safety Equipment" },
];

// ✅ FIXED: mockExitRecords — use live data from context
const mockExitRecords = [] as any[]; // TODO: wire to EmployeeLifecycleContext = [

export function ExitFFSettlement() {
  const { currentRole, currentUser } = useRole();
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>((() => {
    const stored = DataService.get<any>("EXIT_SETTLEMENTS");
    return stored.length > 0 ? stored : mockExitRecords;
  })());
  const [selectedExit, setSelectedExit] = useState<ExitRecord | null>(null);
  const [ffForm, setFFForm] = useState<Partial<FFCalculation>>({
    pendingSalary: 0,
    leaveEncashment: 0,
    bonus: 0,
    reimbursements: 0,
    noticePeriodRecovery: 0,
    equipmentDamage: 0,
    advanceRecovery: 0
  });

  const isSupervisor = currentRole === "Supervisor";
  const isHR = ["HR", "Admin", "Super Admin"].includes(currentRole);
  const isSuperAdmin = currentRole === "Super Admin";
  const isAccounts = currentRole === "Accounts";

  // Supervisor material verification
  const handleMaterialVerification = (exitId: string, materialId: string, condition: MaterialItem['condition']) => {
    const comments = condition !== "Good" ? prompt(`Enter comments for ${condition}:`) || "" : "";
    
    setExitRecords(exitRecords.map(exit => 
      exit.id === exitId 
        ? {
            ...exit,
            materials: exit.materials.map(mat =>
              mat.id === materialId
                ? { 
                    ...mat, 
                    condition, 
                    comments,
                    verifiedBy: currentUser,
                    verifiedOn: new Date().toISOString().split('T')[0]
                  }
                : mat
            )
          }
        : exit
    ));

    toast.success(`✅ Material "${exitRecords.find(e => e.id === exitId)?.materials.find(m => m.id === materialId)?.name}" marked as: ${condition}`);
  };

  // Supervisor completes verification
  const handleSupervisorComplete = (exitId: string) => {
    const exit = exitRecords.find(e => e.id === exitId);
    if (!exit) return;

    const pendingItems = exit.materials.filter(m => m.condition === "Pending");
    if (pendingItems.length > 0) {
      toast.info(`❌ Please verify all ${pendingItems.length} pending items before completing!`);
      return;
    }

    setExitRecords(exitRecords.map(exit => 
      exit.id === exitId 
        ? {
            ...exit,
            status: "Supervisor Verified",
            supervisorVerifiedBy: currentUser,
            supervisorVerifiedOn: new Date().toISOString().split('T')[0]
          }
        : exit
    ));

    toast.success(`✅ Material return verification completed!\n\nAll items verified successfully.\nStatus updated to: Supervisor Verified\n\nNext: Awaiting HR verification`);
  };

  // HR verification
  const handleHRVerification = (exitId: string) => {
    setExitRecords(exitRecords.map(exit => 
      exit.id === exitId 
        ? {
            ...exit,
            status: "HR Verified",
            hrVerifiedBy: currentUser,
            hrVerifiedOn: new Date().toISOString().split('T')[0]
          }
        : exit
    ));

    toast.success(`✅ HR verification completed!\n\nStatus: HR Verified\n\nNext: Calculate F&F settlement`);
  };

  // Calculate F&F
  const calculateFF = () => {
    const totalEarnings = (ffForm.pendingSalary || 0) + (ffForm.leaveEncashment || 0) + 
                          (ffForm.bonus || 0) + (ffForm.reimbursements || 0);
    const totalDeductions = (ffForm.noticePeriodRecovery || 0) + (ffForm.equipmentDamage || 0) + 
                            (ffForm.advanceRecovery || 0);
    const netAmount = totalEarnings - totalDeductions;

    return {
      ...ffForm,
      totalEarnings,
      totalDeductions,
      netAmount
    } as FFCalculation;
  };

  const handleFFSubmit = (exitId: string) => {
    const calculation = calculateFF();
    
    if (calculation.netAmount < 0) {
      const confirm = window.confirm(`Net amount is negative (₹${calculation.netAmount}). Employee owes company money. Continue?`);
      if (!confirm) return;
    }

    const updatedRecords = exitRecords.map(exit => 
      exit.id === exitId 
        ? {
            ...exit,
            status: "Awaiting Super Admin Approval",
            ffCalculation: calculation
          }
        : exit
    );
    setExitRecords(updatedRecords);
    DataService.setAll("EXIT_SETTLEMENTS", updatedRecords);
    setSelectedExit(null);
    toast.success(`✅ F&F Settlement calculated!\n\nNet Amount: ₹${(calculation?.netAmount ?? 0).toLocaleString()}\n\nStatus: Awaiting Super Admin Approval`);
  };

  // Super Admin Approval
  const handleSuperAdminApproval = (exitId: string) => {
    setExitRecords(exitRecords.map(exit => 
      exit.id === exitId 
        ? {
            ...exit,
            status: "Super Admin Approved",
            superAdminApprovedBy: currentUser,
            superAdminApprovedOn: new Date().toISOString().split('T')[0]
          }
        : exit
    ));

    toast.success(`✅ F&F Settlement approved by Super Admin!\n\nStatus: Super Admin Approved\n\nNext: Sent to Accounts for disbursement`);
  };

  // Accounts Processing
  const handleAccountsSchedule = (exitId: string) => {
    const days = prompt("Enter days to schedule disbursement (max 15):", "15");
    if (!days) return;

    const disbursementDate = new Date();
    disbursementDate.setDate(disbursementDate.getDate() + parseInt(days));

    setExitRecords(exitRecords.map(exit => 
      exit.id === exitId 
        ? {
            ...exit,
            status: "Disbursement Scheduled",
            disbursementDate: disbursementDate.toISOString().split('T')[0],
            accountsProcessedBy: currentUser
          }
        : exit
    ));

    toast.success(`✅ Disbursement scheduled!\n\nDate: ${disbursementDate.toISOString().split('T')[0]}\n\n📧 Employee will receive notification 1 day before disbursement.`);
  };

  const handleDisburse = (exitId: string) => {
    const paymentMode = prompt("Enter payment mode (Bank Transfer/Cheque/Cash):");
    const paymentRef = prompt("Enter payment reference number:");
    
    if (!paymentMode || !paymentRef) return;

    setExitRecords(exitRecords.map(exit => 
      exit.id === exitId 
        ? {
            ...exit,
            status: "Disbursed",
            disbursedOn: new Date().toISOString().split('T')[0],
            paymentMode,
            paymentReference: paymentRef
          }
        : exit
    ));

    toast.success(`✅ F&F Settlement disbursed!\n\nMode: ${paymentMode}\nReference: ${paymentRef}\n\nStatus: Disbursed`);
  };

  const getStatusColor = (status: ExitRecord['status']) => {
    switch (status) {
      case "Exit Initiated": return "bg-gray-500";
      case "Supervisor Verification Pending": return "bg-orange-500";
      case "Supervisor Verified": return "bg-blue-500";
      case "HR Verification Pending": return "bg-yellow-500";
      case "HR Verified": return "bg-green-500";
      case "F&F Calculated": return "bg-purple-500";
      case "Awaiting Super Admin Approval": return "bg-red-500";
      case "Super Admin Approved": return "bg-green-600";
      case "With Accounts": return "bg-blue-600";
      case "Disbursement Scheduled": return "bg-yellow-600";
      case "Disbursed": return "bg-green-700";
      case "Closed": return "bg-gray-700";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exit & F&F Settlement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee exits with material verification and full & final settlement
          </p>
        </div>
        <BackButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Exits</p>
                <p className="text-2xl font-bold mt-1">{exitRecords.filter(e => e.status !== "Closed").length}</p>
              </div>
              <LogOut className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Verification</p>
                <p className="text-2xl font-bold mt-1">
                  {exitRecords.filter(e => e.status.includes("Pending")).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Awaiting Disbursement</p>
                <p className="text-2xl font-bold mt-1">
                  {exitRecords.filter(e => e.status === "Disbursement Scheduled").length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold mt-1">
                  {exitRecords.filter(e => e.status === "Disbursed" || e.status === "Closed").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* F&F Calculation Modal */}
      {selectedExit && selectedExit.status === "HR Verified" && isHR && (
        <Card className="border-2 border-purple-300 shadow-lg">
          <CardHeader className="bg-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Calculate F&F Settlement - {selectedExit.id}</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setSelectedExit(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm font-medium">{selectedExit.employeeName} ({selectedExit.empCode})</p>
              <p className="text-xs text-gray-600">Last Working Date: {selectedExit.lastWorkingDate}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-green-600 mb-3">💰 Earnings</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pending Salary</Label>
                  <Input
                    type="number"
                    value={ffForm.pendingSalary || 0}
                    onChange={(e) => setFFForm({ ...ffForm, pendingSalary: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Leave Encashment</Label>
                  <Input
                    type="number"
                    value={ffForm.leaveEncashment || 0}
                    onChange={(e) => setFFForm({ ...ffForm, leaveEncashment: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Bonus/Incentives</Label>
                  <Input
                    type="number"
                    value={ffForm.bonus || 0}
                    onChange={(e) => setFFForm({ ...ffForm, bonus: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Reimbursements</Label>
                  <Input
                    type="number"
                    value={ffForm.reimbursements || 0}
                    onChange={(e) => setFFForm({ ...ffForm, reimbursements: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-red-600 mb-3">➖ Deductions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Notice Period Recovery</Label>
                  <Input
                    type="number"
                    value={ffForm.noticePeriodRecovery || 0}
                    onChange={(e) => setFFForm({ ...ffForm, noticePeriodRecovery: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Equipment Damage</Label>
                  <Input
                    type="number"
                    value={ffForm.equipmentDamage || 0}
                    onChange={(e) => setFFForm({ ...ffForm, equipmentDamage: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Advance Recovery</Label>
                  <Input
                    type="number"
                    value={ffForm.advanceRecovery || 0}
                    onChange={(e) => setFFForm({ ...ffForm, advanceRecovery: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Earnings:</span>
                  <span className="font-medium text-green-600">
                    ₹{calculateFF().totalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Deductions:</span>
                  <span className="font-medium text-red-600">
                    ₹{calculateFF().totalDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Net F&F Amount:</span>
                  <span className="text-purple-600">
                    ₹{calculateFF().netAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedExit(null)}>
                Cancel
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => handleFFSubmit(selectedExit.id)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Submit to Super Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit Records */}
      <div className="space-y-4">
        {exitRecords.map(exit => (
          <Card key={exit.id} className="border-2">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{exit.id}</Badge>
                    <Badge className={`${getStatusColor(exit.status)} text-white`}>
                      {exit.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{exit.employeeName}</p>
                  <p className="text-xs text-gray-500">{exit.empCode} | {exit.designation}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Resignation Date</p>
                  <p className="font-medium">{exit.resignationDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Working Day</p>
                  <p className="font-medium">{exit.lastWorkingDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Notice Period</p>
                  <p className="font-medium">{exit.noticePeriod} days</p>
                </div>
                <div>
                  <p className="text-gray-500">Reason</p>
                  <p className="font-medium text-xs">{exit.reasonForLeaving}</p>
                </div>
              </div>

              {/* Supervisor Material Verification */}
              {(exit.status === "Supervisor Verification Pending" || exit.status === "Supervisor Verified") && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Material Return Verification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {exit.materials.map(material => (
                      <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{material.name}</span>
                        {isSupervisor && exit.status === "Supervisor Verification Pending" ? (
                          <select
                            value={material.condition}
                            onChange={(e) => handleMaterialVerification(exit.id, material.id, e.target.value as any)}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Good">Good</option>
                            <option value="Minor Damage">Minor Damage</option>
                            <option value="Major Damage">Major Damage</option>
                            <option value="Missing">Missing</option>
                          </select>
                        ) : (
                          <Badge variant={
                            material.condition === "Good" ? "secondary" :
                            material.condition === "Pending" ? "outline" :
                            "destructive"
                          } className="text-xs">
                            {material.condition}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  {isSupervisor && exit.status === "Supervisor Verification Pending" && (
                    <div className="mt-3 flex justify-end">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleSupervisorComplete(exit.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Verification
                      </Button>
                    </div>
                  )}
                  {exit.supervisorVerifiedBy && (
                    <p className="text-xs text-green-600 mt-2">
                      ✅ Verified by {exit.supervisorVerifiedBy} on {exit.supervisorVerifiedOn}
                    </p>
                  )}
                </div>
              )}

              {/* HR Verification */}
              {exit.status === "Supervisor Verified" && isHR && (
                <div className="border-t pt-4">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleHRVerification(exit.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete HR Verification
                  </Button>
                </div>
              )}

              {/* Calculate F&F */}
              {exit.status === "HR Verified" && isHR && (
                <div className="border-t pt-4">
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setSelectedExit(exit)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Calculate F&F Settlement
                  </Button>
                </div>
              )}

              {/* F&F Display */}
              {exit.ffCalculation && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">F&F Settlement Calculation</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pending Salary:</span>
                      <span>₹{(exit?.ffCalculation?.pendingSalary ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leave Encashment:</span>
                      <span>₹{(exit?.ffCalculation?.leaveEncashment ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonus/Incentives:</span>
                      <span>₹{(exit?.ffCalculation?.bonus ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reimbursements:</span>
                      <span>₹{(exit?.ffCalculation?.reimbursements ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-600 border-t pt-2">
                      <span>Total Earnings:</span>
                      <span>₹{(exit?.ffCalculation?.totalEarnings ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600 mt-2">
                      <span>Deductions:</span>
                      <span>₹{(exit?.ffCalculation?.totalDeductions ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-purple-600 border-t pt-2">
                      <span>Net F&F Amount:</span>
                      <span>₹{(exit?.ffCalculation?.netAmount ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Super Admin Approval */}
              {exit.status === "Awaiting Super Admin Approval" && isSuperAdmin && (
                <div className="border-t pt-4">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleSuperAdminApproval(exit.id)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Approve F&F Settlement
                  </Button>
                </div>
              )}

              {/* Accounts Actions */}
              {exit.status === "Super Admin Approved" && isAccounts && (
                <div className="border-t pt-4">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleAccountsSchedule(exit.id)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Disbursement
                  </Button>
                </div>
              )}

              {exit.status === "Disbursement Scheduled" && (
                <div className="border-t pt-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                    <p className="text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-yellow-600" />
                      <span>Disbursement scheduled for: <strong>{exit.disbursementDate}</strong></span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Employee will be notified 1 day before disbursement
                    </p>
                  </div>
                  {isAccounts && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleDisburse(exit.id)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Mark as Disbursed
                    </Button>
                  )}
                </div>
              )}

              {/* Disbursed Info */}
              {exit.status === "Disbursed" && (
                <div className="border-t pt-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm font-medium text-green-700">✅ F&F Settlement Disbursed</p>
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <p>Disbursed on: {exit.disbursedOn}</p>
                      <p>Payment Mode: {exit.paymentMode}</p>
                      <p>Reference: {exit.paymentReference}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {(exit.supervisorVerifiedOn || exit.hrVerifiedOn || exit.superAdminApprovedOn) && (
                <div className="border-t pt-4">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Audit Trail</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    {exit.supervisorVerifiedOn && (
                      <p>✓ Supervisor verified by {exit.supervisorVerifiedBy} on {exit.supervisorVerifiedOn}</p>
                    )}
                    {exit.hrVerifiedOn && (
                      <p>✓ HR verified by {exit.hrVerifiedBy} on {exit.hrVerifiedOn}</p>
                    )}
                    {exit.superAdminApprovedOn && (
                      <p>✓ Super Admin approved by {exit.superAdminApprovedBy} on {exit.superAdminApprovedOn}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}