/**
 * ExitManagement — HR tab inside EmployeeLifecycleManagement
 * Shows all active exit workflows + lets HR initiate new exits.
 * Wired to exitWorkflowService (localStorage-backed).
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  LogOut, CheckCircle, Clock, AlertCircle, Plus, X, User,
  Calendar, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { exitWorkflowService, ExitWorkflow } from "../../services/exitWorkflowService";
import { DataService } from "../../services/DataService";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  "Initiated":      "bg-gray-100 text-gray-800",
  "Notice Period":  "bg-yellow-100 text-yellow-800",
  "Clearance":      "bg-orange-100 text-orange-800",
  "F&F Settlement": "bg-blue-100 text-blue-800",
  "Exited":         "bg-green-100 text-green-800",
};

export function ExitManagement() {
  const { currentRole, currentUser } = useRole();
  const isHR = ["HR", "Admin", "Super Admin"].includes(currentRole);
  const isSuperAdmin = currentRole === "Super Admin";

  const [workflows, setWorkflows] = useState<ExitWorkflow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    employeeId: "",
    exitReason: "",
    resignationType: "Voluntary" as ExitWorkflow["resignationType"],
    noticePeriodDays: 30,
    lastWorkingDate: "",
  });
  const [formError, setFormError] = useState("");

  // Load all employees for the dropdown
  const allEmployees = DataService.get<any>("EMPLOYEES");

  const reload = () => setWorkflows(exitWorkflowService.getAll());

  useEffect(() => { reload(); }, []);

  const handleInitiate = () => {
    setFormError("");
    if (!form.employeeId || !form.exitReason || !form.lastWorkingDate) {
      setFormError("Please fill all required fields.");
      return;
    }
    const result = exitWorkflowService.initiateExit({
      ...form,
      initiatedBy: currentUser.name,
    });
    if (!result.success) {
      setFormError(result.errors?.join(", ") ?? "Failed to initiate exit.");
      return;
    }
    toast.success(`✅ Exit initiated for employee ${form.employeeId}`);
    setShowForm(false);
    setForm({ employeeId: "", exitReason: "", resignationType: "Voluntary", noticePeriodDays: 30, lastWorkingDate: "" });
    reload();
  };

  const handleMoveStage = (wf: ExitWorkflow) => {
    const result = exitWorkflowService.moveToNextStage(wf.exitWorkflowId, currentUser.name);
    if (result.success) {
      toast.success(`✅ Moved to: ${result.exitWorkflow?.currentStage}`);
      reload();
    } else {
      toast.error(result.errors?.join(", ") ?? "Failed to advance stage.");
    }
  };

  const handleUpdateClearance = (wf: ExitWorkflow, item: string, status: "Returned" | "Not Applicable") => {
    const updated = wf.clearanceItems.map(c =>
      c.item === item ? { ...c, status, returnedDate: new Date().toISOString().split("T")[0] } : c
    );
    exitWorkflowService.updateClearance(wf.exitWorkflowId, updated);
    toast.success(`✅ ${item} marked as ${status}`);
    reload();
  };

  const canAdvance = (wf: ExitWorkflow) => {
    if (wf.currentStage === "Exited") return false;
    if (wf.currentStage === "Clearance") {
      return wf.clearanceItems.every(c => c.status !== "Pending");
    }
    return isHR || isSuperAdmin;
  };

  const stageLabel = (stage: string) => {
    const next: Record<string, string> = {
      "Initiated":      "Start Notice Period",
      "Notice Period":  "Start Clearance",
      "Clearance":      "Move to F&F",
      "F&F Settlement": "Mark as Exited",
    };
    return next[stage] ?? "Next Stage";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Employee Exit Workflows</h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage employee exits from initiation to final settlement</p>
        </div>
        {isHR && (
          <Button onClick={() => setShowForm(v => !v)} size="sm">
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancel" : "Initiate Exit"}
          </Button>
        )}
      </div>

      {/* Initiate Exit Form */}
      {showForm && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogOut className="w-4 h-4 text-orange-600" />
              Initiate New Exit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Employee ID *</Label>
                <Input
                  placeholder="e.g. EDB-W-SUR1"
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                />
                {allEmployees.length > 0 && (
                  <p className="text-xs text-gray-400">Active employees: {allEmployees.filter((e:any) => e.status === "Active").length}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Resignation Type *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  value={form.resignationType}
                  onChange={e => setForm(f => ({ ...f, resignationType: e.target.value as any }))}
                >
                  <option>Voluntary</option>
                  <option>Termination</option>
                  <option>Retirement</option>
                  <option>Abscond</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Last Working Date *</Label>
                <Input
                  type="date"
                  value={form.lastWorkingDate}
                  onChange={e => setForm(f => ({ ...f, lastWorkingDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Notice Period (days)</Label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={form.noticePeriodDays}
                  onChange={e => setForm(f => ({ ...f, noticePeriodDays: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Reason for Exit *</Label>
                <Input
                  placeholder="Resignation reason..."
                  value={form.exitReason}
                  onChange={e => setForm(f => ({ ...f, exitReason: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleInitiate} className="bg-orange-600 hover:bg-orange-700">
                <LogOut className="w-4 h-4 mr-2" /> Initiate Exit
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["Initiated","Notice Period","Clearance","F&F Settlement"].map(stage => (
          <Card key={stage}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{workflows.filter(w => w.currentStage === stage).length}</p>
              <p className="text-xs text-gray-500 mt-1">{stage}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow list */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <LogOut className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No exit workflows found</p>
            <p className="text-sm text-gray-400 mt-1">
              {isHR ? 'Click "Initiate Exit" to start one.' : "Contact HR to initiate an exit."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => (
            <Card key={wf.exitWorkflowId} className={wf.currentStage === "Exited" ? "opacity-70" : ""}>
              <CardContent className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{wf.employeeName}</p>
                      <p className="text-xs text-gray-500">{wf.employeeId} · {wf.resignationType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLOR[wf.currentStage] ?? "bg-gray-100 text-gray-700"}>
                      {wf.currentStage}
                    </Badge>
                    <button
                      onClick={() => setExpandedId(expandedId === wf.exitWorkflowId ? null : wf.exitWorkflowId)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedId === wf.exitWorkflowId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Key dates */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-400">Initiated</p>
                    <p className="text-sm font-medium">{wf.initiatedDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-400">Last Working Day</p>
                    <p className="text-sm font-medium">{wf.lastWorkingDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-400">Notice Period</p>
                    <p className="text-sm font-medium">{wf.noticePeriodDays} days</p>
                  </div>
                </div>

                {/* Expanded: clearance + history */}
                {expandedId === wf.exitWorkflowId && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {/* Clearance items */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Clearance Items
                      </p>
                      <div className="space-y-1">
                        {wf.clearanceItems.map(ci => (
                          <div key={ci.item} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                            <div className="flex items-center gap-2">
                              {ci.status === "Returned" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : ci.status === "Not Applicable" ? (
                                <X className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Clock className="w-4 h-4 text-orange-400" />
                              )}
                              <span className={ci.status === "Not Applicable" ? "text-gray-400" : ""}>{ci.item}</span>
                              {ci.returnedDate && <span className="text-xs text-gray-400">· {ci.returnedDate}</span>}
                            </div>
                            {ci.status === "Pending" && isHR && wf.currentStage === "Clearance" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleUpdateClearance(wf, ci.item, "Returned")}
                                  className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-100"
                                >Returned</button>
                                <button
                                  onClick={() => handleUpdateClearance(wf, ci.item, "Not Applicable")}
                                  className="text-xs bg-gray-50 text-gray-600 border rounded px-2 py-0.5 hover:bg-gray-100"
                                >N/A</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stage history */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Stage History
                      </p>
                      <div className="space-y-1">
                        {wf.stageHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span className="font-medium">{h.stage}</span>
                            <span className="text-gray-400">by {h.completedBy}</span>
                            <span className="text-gray-400 ml-auto">{h.completedAt.split("T")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exit reason */}
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-400 mb-1">Exit Reason</p>
                      <p className="text-sm text-gray-700">{wf.exitReason}</p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {wf.currentStage !== "Exited" && isHR && (
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      size="sm"
                      disabled={!canAdvance(wf)}
                      onClick={() => handleMoveStage(wf)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      {stageLabel(wf.currentStage)}
                    </Button>
                    {wf.currentStage === "Clearance" && !canAdvance(wf) && (
                      <p className="text-xs text-orange-600 self-center">
                        Clear all pending items first
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
