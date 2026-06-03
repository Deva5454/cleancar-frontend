/**
 * IncentiveVisibilityAdmin.tsx
 * Route: /admin/incentive-visibility  (Super Admin only)
 *
 * Three capabilities:
 *  1. Add / Remove roles from the incentive-eligible list
 *  2. Toggle visibility (show/hide) per role
 *  3. Per-employee overrides — shows ALL seeded employees, all roles
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Eye, EyeOff, Users, User, RefreshCw, AlertCircle,
  CheckCircle2, Shield, Clock, Info, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  incentiveVisibilityService,
  ALL_SYSTEM_ROLES,
} from "../../services/incentiveVisibilityService";
import type { IncentiveVisibilityConfig } from "../../services/incentiveVisibilityService";
import { useRole } from "../../contexts/RoleContext";

// ── Colour chips per role ────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  "Sales Manager":        "bg-purple-100 text-purple-700 border-purple-200",
  "Sales Head":           "bg-indigo-100 text-indigo-700 border-indigo-200",
  "TSM":                  "bg-blue-100 text-blue-700 border-blue-200",
  "TSE":                  "bg-sky-100 text-sky-700 border-sky-200",
  "Supervisor":           "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Car Washer":           "bg-teal-100 text-teal-700 border-teal-200",
  "CCE":                  "bg-orange-100 text-orange-700 border-orange-200",
  "Operations Manager":   "bg-amber-100 text-amber-700 border-amber-200",
  "Sr Operations Manager":"bg-yellow-100 text-yellow-700 border-yellow-200",
  "City Manager":         "bg-lime-100 text-lime-700 border-lime-200",
  "Cluster Manager":      "bg-green-100 text-green-700 border-green-200",
  "HR":                   "bg-pink-100 text-pink-700 border-pink-200",
  "Accounts":             "bg-rose-100 text-rose-700 border-rose-200",
  "Store Manager":        "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Procurement Manager":  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

function RoleChip({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {role}
    </span>
  );
}

function StatusBadge({ visible, override = false }: { visible: boolean; override?: boolean }) {
  return visible ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1 text-xs">
      <CheckCircle2 className="w-3 h-3" /> Visible{override ? " (override)" : ""}
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1 text-xs">
      <EyeOff className="w-3 h-3" /> Hidden{override ? " (override)" : ""}
    </Badge>
  );
}

// ── Read ALL employees from localStorage seed ────────────────────────────────
function getAllEmployees(): any[] {
  try {
    const raw = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
export function IncentiveVisibilityAdmin() {
  const { currentUser } = useRole();
  const updatedBy = currentUser?.name ?? "Super Admin";

  const [config, setConfig]       = useState<IncentiveVisibilityConfig>(incentiveVisibilityService.getConfig());
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [tab, setTab]             = useState<"roles" | "employees">("roles");
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [resetDialog, setResetDialog] = useState(false);
  const [addRoleValue, setAddRoleValue] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [empOverrideDialog, setEmpOverrideDialog] = useState<{
    empId: string; empName: string; empRole: string; currentVisible: boolean;
  } | null>(null);

  const reload = () => {
    setConfig(incentiveVisibilityService.getConfig());
    setAllEmployees(getAllEmployees());
  };

  useEffect(() => { reload(); }, []);

  const incentiveRoles = config.incentiveRoles ?? [];
  const rolesNotYetAdded = ALL_SYSTEM_ROLES.filter(r => !incentiveRoles.includes(r));

  // Employees whose role is in the incentive list
  const relevantEmployees = allEmployees.filter((e: any) => {
    const role = e.designation || e.role || "";
    return incentiveRoles.includes(role);
  });

  const filteredEmployees = relevantEmployees.filter((e: any) => {
    const role = e.designation || e.role || "";
    const name = (e.fullName || e.name || "").toLowerCase();
    const id   = (e.id || e.employeeId || "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
    const matchRole   = filterRole === "all" || role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleRoleToggle(role: string, visible: boolean) {
    incentiveVisibilityService.setRoleVisibility(role, visible, updatedBy);
    reload();
    toast.success(`Incentive screen ${visible ? "enabled" : "disabled"} for all ${role} employees.`);
  }

  function handleAddRole() {
    if (!addRoleValue) return;
    incentiveVisibilityService.addRole(addRoleValue, updatedBy);
    setAddRoleValue("");
    reload();
    toast.success(`${addRoleValue} added to incentive-eligible roles.`);
  }

  function handleRemoveRole(role: string) {
    incentiveVisibilityService.removeRole(role, updatedBy);
    setRemoveConfirm(null);
    reload();
    toast.success(`${role} removed from incentive-eligible roles.`);
  }

  function handleEmployeeOverride(action: "hide" | "show" | "clear") {
    if (!empOverrideDialog) return;
    const { empId, empName, empRole } = empOverrideDialog;
    if (action === "clear") {
      incentiveVisibilityService.clearEmployeeOverride(empId, updatedBy);
      toast.success(`Override removed for ${empName} — follows ${empRole} default.`);
    } else {
      incentiveVisibilityService.setEmployeeVisibility(empId, action === "show", updatedBy);
      toast.success(`Incentive screen ${action === "show" ? "shown" : "hidden"} for ${empName}.`);
    }
    reload();
    setEmpOverrideDialog(null);
  }

  function handleReset() {
    incentiveVisibilityService.reset(updatedBy);
    reload();
    setResetDialog(false);
    toast.success("All settings reset to defaults.");
  }

  const lastUpdated = config.updatedAt
    ? new Date(config.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const hiddenRoles    = incentiveRoles.filter(r => !config.roles[r]);
  const overrideCount  = Object.keys(config.employees).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Incentive Screen Visibility</h1>
          </div>
          <p className="text-sm text-gray-500">
            Control which roles see the Incentive tab. Add or remove roles from the list.
            Employee overrides beat role defaults.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setResetDialog(true)}>
          <RefreshCw className="w-3.5 h-3.5" /> Reset to defaults
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Incentive-Eligible Roles</p>
          <p className="text-2xl font-bold text-indigo-700">
            {incentiveRoles.length}
            <span className="text-sm font-normal text-gray-400"> / {ALL_SYSTEM_ROLES.length} total</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Visible / Hidden</p>
          <p className="text-2xl font-bold">
            <span className="text-green-700">{incentiveRoles.filter(r => config.roles[r]).length}</span>
            <span className="text-sm font-normal text-gray-400"> visible · </span>
            <span className="text-red-600">{hiddenRoles.length}</span>
            <span className="text-sm font-normal text-gray-400"> hidden</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Last Updated
          </p>
          <p className="text-sm font-medium text-gray-700 mt-1">{lastUpdated}</p>
          <p className="text-xs text-gray-400">by {config.updatedBy}</p>
        </Card>
      </div>

      {hiddenRoles.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            Incentive screen currently <strong>hidden</strong> for: {hiddenRoles.join(", ")}.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["roles", "employees"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "roles"
              ? <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> By Role ({incentiveRoles.length})</span>
              : <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> By Employee ({relevantEmployees.length}){overrideCount > 0 ? ` · ${overrideCount} overrides` : ""}</span>}
          </button>
        ))}
      </div>

      {/* ── BY ROLE ───────────────────────────────────────────────────────── */}
      {tab === "roles" && (
        <div className="space-y-4">

          {/* Add role row */}
          <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Plus className="w-4 h-4 text-indigo-500 shrink-0" />
                <p className="text-sm font-medium text-indigo-800 mr-2">Add a role to the incentive list:</p>
                <Select value={addRoleValue} onValueChange={setAddRoleValue}>
                  <SelectTrigger className="w-56 h-8 text-sm bg-white">
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesNotYetAdded.length === 0
                      ? <SelectItem value="_none" disabled>All roles already added</SelectItem>
                      : rolesNotYetAdded.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700"
                  disabled={!addRoleValue || addRoleValue === "_none"} onClick={handleAddRole}>
                  Add Role
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Roles table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Incentive-Eligible Roles</CardTitle>
              <CardDescription>
                Toggle to show/hide the Incentive tab for all employees in a role.
                Remove a role to hide incentives for it entirely.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {incentiveRoles.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">
                  No roles in the incentive list yet. Add a role above.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Employee Overrides</TableHead>
                      <TableHead className="text-center">Visible</TableHead>
                      <TableHead className="text-right">Remove from List</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incentiveRoles.map(role => {
                      const visible     = config.roles[role] ?? true;
                      const empCount    = allEmployees.filter((e: any) =>
                        (e.designation || e.role) === role).length;
                      const overrides   = Object.entries(config.employees).filter(([empId]) =>
                        allEmployees.find((e: any) => (e.id || e.employeeId) === empId && (e.designation || e.role) === role)
                      ).length;
                      return (
                        <TableRow key={role}>
                          <TableCell><RoleChip role={role} /></TableCell>
                          <TableCell><StatusBadge visible={visible} /></TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {empCount} {empCount !== 1 ? "employees" : "employee"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {overrides > 0
                              ? <span className="text-xs font-medium text-indigo-600">{overrides} active</span>
                              : <span className="text-xs text-gray-400">None</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={visible}
                              onCheckedChange={v => handleRoleToggle(role, v)}
                              className="data-[state=checked]:bg-indigo-600"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                              onClick={() => setRemoveConfirm(role)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* All other roles (not in incentive list) */}
          {rolesNotYetAdded.length > 0 && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-medium">
                  Roles NOT in incentive list ({rolesNotYetAdded.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {rolesNotYetAdded.map(r => (
                    <div key={r} className="flex items-center gap-1">
                      <RoleChip role={r} />
                      <button
                        onClick={() => { incentiveVisibilityService.addRole(r, updatedBy); reload(); toast.success(`${r} added.`); }}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                        + add
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── BY EMPLOYEE ───────────────────────────────────────────────────── */}
      {tab === "employees" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Employee-Level Overrides</CardTitle>
            <CardDescription>
              Individual settings override the role default. Shows all employees in incentive-eligible roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Input placeholder="Search name or ID…" value={search}
                onChange={e => setSearch(e.target.value)} className="max-w-xs text-sm" />
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-52 text-sm">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {incentiveRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="self-center text-xs text-gray-400">
                {filteredEmployees.length} of {relevantEmployees.length} employees
              </span>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">
                <p>No employees found.</p>
                {relevantEmployees.length === 0 && (
                  <p className="mt-1">No seeded employees in incentive-eligible roles. Check that seed data has loaded (clear localStorage and reload).</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Role Default</TableHead>
                    <TableHead>Override</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp: any) => {
                    const empId      = emp.id || emp.employeeId;
                    const empRole    = emp.designation || emp.role || "";
                    const empName    = emp.fullName || emp.name || empId;
                    const empCity    = emp.city || emp.workLocation?.replace("CITY-", "") || "—";
                    const roleDef    = config.roles[empRole] ?? true;
                    const hasOverride = empId in config.employees;
                    const overrideVal = config.employees[empId];
                    const effective  = incentiveVisibilityService.isVisible(empRole, empId);
                    return (
                      <TableRow key={empId}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{empName}</p>
                            <p className="text-xs text-gray-400 font-mono">{empId}</p>
                          </div>
                        </TableCell>
                        <TableCell><RoleChip role={empRole} /></TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">{empCity}</span>
                        </TableCell>
                        <TableCell><StatusBadge visible={roleDef} /></TableCell>
                        <TableCell>
                          {hasOverride
                            ? <StatusBadge visible={overrideVal} override />
                            : <span className="text-xs text-gray-400 italic">None</span>}
                        </TableCell>
                        <TableCell><StatusBadge visible={effective} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2.5"
                            onClick={() => setEmpOverrideDialog({ empId, empName, empRole, currentVisible: effective })}>
                            {hasOverride ? "Change" : "Override"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info footer */}
      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
        Changes take effect immediately — employees see the change on next page load or tab switch.
        Employee overrides always beat role defaults. Removing a role from the list hides incentives
        for all its employees regardless of overrides.
      </div>

      {/* Employee override dialog */}
      <Dialog open={!!empOverrideDialog} onOpenChange={() => setEmpOverrideDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Incentive Visibility</DialogTitle>
            <DialogDescription>
              Set a personal override for <strong>{empOverrideDialog?.empName}</strong> ({empOverrideDialog?.empRole}).
              <br />Role default: {config.roles[empOverrideDialog?.empRole ?? ""] ? "Visible" : "Hidden"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { action: "show" as const, icon: Eye, bg: "bg-green-50 border-green-200 hover:bg-green-100", text: "text-green-800", sub: "text-green-600", label: "Force Show", desc: "Always visible for this employee, regardless of role setting." },
              { action: "hide" as const, icon: EyeOff, bg: "bg-red-50 border-red-200 hover:bg-red-100", text: "text-red-800", sub: "text-red-600", label: "Force Hide", desc: "Always hidden for this employee, regardless of role setting." },
            ].map(opt => (
              <div key={opt.action}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${opt.bg}`}
                onClick={() => handleEmployeeOverride(opt.action)}>
                <opt.icon className={`w-4 h-4 ${opt.sub}`} />
                <div>
                  <p className={`text-sm font-medium ${opt.text}`}>{opt.label}</p>
                  <p className={`text-xs ${opt.sub}`}>{opt.desc}</p>
                </div>
              </div>
            ))}
            {empOverrideDialog?.empId && empOverrideDialog.empId in config.employees && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleEmployeeOverride("clear")}>
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Remove Override</p>
                  <p className="text-xs text-gray-500">Revert to {empOverrideDialog?.empRole} role default.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpOverrideDialog(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove role confirm */}
      <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeConfirm} from incentive list?</DialogTitle>
            <DialogDescription>
              This will hide the Incentive tab for all <strong>{removeConfirm}</strong> employees.
              Any individual overrides for this role's employees will also be cleared.
              This can be undone by adding the role back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => removeConfirm && handleRemoveRole(removeConfirm)}>
              Remove Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset confirm */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all visibility settings?</DialogTitle>
            <DialogDescription>
              Resets the incentive-eligible role list, all role toggles, and all employee overrides
              to factory defaults. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset}>Yes, reset all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
