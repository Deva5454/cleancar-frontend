import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { Lock, Sparkles, Save, IndianRupee, History } from "lucide-react";
import {
  computeStructureFromGross, getSchemeRange, SLAB_SCHEME_LABELS,
  type SlabScheme, type SlabStructureResult,
} from "../../services/salarySlabService";
import { slabSalaryStructureService, type SlabSalaryStructureRecord } from "../../services/slabSalaryStructureService";

const SCHEMES: SlabScheme[] = ["MH_8_33_BONUS", "GUJARAT_8_33_BONUS", "MH_20_BONUS"];

const EARNING_FIELDS: Array<{ key: keyof SlabStructureResult; label: string }> = [
  { key: "basicDA", label: "Basic + DA (50%)" },
  { key: "hra", label: "HRA" },
  { key: "interimBonus", label: "Interim Bonus" },
  { key: "convyAllowance", label: "Conveyance Allowance" },
  { key: "mobileAllowance", label: "Mobile Allowance" },
  { key: "supAllowance", label: "Supplementary Allowance" },
  { key: "eduAllowance", label: "Education Allowance" },
  { key: "washingAllowance", label: "Washing Allowance" },
  { key: "lta", label: "LTA" },
];

const DEDUCTION_FIELDS: Array<{ key: keyof SlabStructureResult; label: string }> = [
  { key: "pfEmployee", label: "PF (Employee)" },
  { key: "esicEmployee", label: "ESIC (Employee)" },
  { key: "pt", label: "Professional Tax" },
  { key: "lwfEmployee", label: "LWF (Employee)" },
];

const EMPLOYER_FIELDS: Array<{ key: keyof SlabStructureResult; label: string }> = [
  { key: "pfEmployer", label: "PF (Employer)" },
  { key: "esicEmployer", label: "ESIC (Employer)" },
  { key: "gratuity", label: "Gratuity" },
  { key: "lwfEmployer", label: "LWF (Employer)" },
  { key: "leave", label: "Leave Provision" },
];

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function SlabStructureBuilder({
  roles, onSaved,
}: {
  roles: { id: string; label: string }[];
  onSaved?: () => void;
}) {
  const { currentUser, currentRole } = useRole();
  const canEdit = currentRole === "HR" || currentRole === "Super Admin";

  const [roleId, setRoleId] = useState(roles[0]?.id || "");
  const [structureName, setStructureName] = useState("");
  const [scheme, setScheme] = useState<SlabScheme>("MH_8_33_BONUS");
  const [grossInput, setGrossInput] = useState<string>("");
  const [result, setResult] = useState<SlabStructureResult | null>(null);
  const [savedRecord, setSavedRecord] = useState<SlabSalaryStructureRecord | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const roleName = roles.find((r) => r.id === roleId)?.label || roleId;
  const range = useMemo(() => getSchemeRange(scheme), [scheme]);

  const handleLookup = () => {
    const gross = Number(grossInput);
    if (!gross || gross <= 0) { toast.error("Enter a valid Gross amount"); return; }

    const computed = computeStructureFromGross(scheme, gross);
    if (!computed) {
      setManualMode(true);
      setResult({
        scheme, band: { fromGross: 0, toGross: 0 }, gross,
        basicDA: 0, hra: 0, interimBonus: 0, convyAllowance: 0, mobileAllowance: 0,
        supAllowance: 0, eduAllowance: 0, washingAllowance: 0, lta: 0,
        pfEmployee: 0, esicEmployee: 0, pt: 0, lwfEmployee: 0, deductionTotal: 0, netPay: gross,
        pfEmployer: 0, esicEmployer: 0, gratuity: 0, lwfEmployer: 0, leave: 0, totalEmployerCost: 0,
        ctcMonthly: gross, ctcYearly: gross * 12,
        computedFields: [],
      });
      toast.warning(`No slab data covers ₹${gross.toLocaleString("en-IN")} for ${SLAB_SCHEME_LABELS[scheme]} (table covers ₹${range.min.toLocaleString("en-IN")}–₹${range.max.toLocaleString("en-IN")}). All fields are open for manual entry.`);
      return;
    }
    setManualMode(false);
    setResult(computed);
    toast.success(`Auto-filled from ${SLAB_SCHEME_LABELS[scheme]} band ₹${computed.band.fromGross.toLocaleString("en-IN")}–₹${computed.band.toGross.toLocaleString("en-IN")}`);
  };

  const updateField = (key: keyof SlabStructureResult, value: number) => {
    if (!result) return;
    setResult({ ...result, [key]: value });
  };

  const handleSave = () => {
    if (!canEdit) { toast.error("Only HR or Super Admin can save salary structures"); return; }
    if (!result) { toast.error("Look up a Gross amount first"); return; }
    if (!structureName.trim()) { toast.error("Enter a structure name"); return; }

    const record = slabSalaryStructureService.create({
      roleId, roleName, structureName, scheme,
      enteredGross: Number(grossInput), result,
      createdBy: currentUser?.name || currentRole,
    });
    setSavedRecord(record);
    toast.success("Salary structure saved");
    onSaved?.();
  };

  const handleFieldCommit = (key: keyof SlabStructureResult, value: number) => {
    updateField(key, value);
    if (savedRecord) {
      const updated = slabSalaryStructureService.override(savedRecord.id, key, value, currentUser?.name || currentRole, currentRole);
      if (updated) {
        setSavedRecord(updated);
        setResult(updated.result);
        toast.success("Override saved");
      }
    }
  };

  const renderField = (key: keyof SlabStructureResult, label: string) => {
    if (!result) return null;
    const isComputed = result.computedFields.includes(key as string);
    const value = result[key] as unknown as number;
    return (
      <div key={key} className="space-y-0.5">
        <div className="flex items-center gap-1">
          <Label className="text-[11px] text-gray-600">{label}</Label>
          {isComputed && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-blue-50 text-blue-600 border-blue-200">computed</Badge>
          )}
        </div>
        <Input
          type="number" value={value} disabled={!canEdit}
          onChange={(e) => updateField(key, Number(e.target.value) || 0)}
          onBlur={(e) => handleFieldCommit(key, Number(e.target.value) || 0)}
          className={`h-7 text-sm ${!canEdit ? "bg-gray-50" : ""}`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 text-sm text-amber-800">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Only HR and Super Admin can create or edit statutory slab structures. You can view but not save.
        </div>
      )}

      {/* Setup — single compact row */}
      <Card>
        <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Structure Name</Label>
            <Input value={structureName} onChange={(e) => setStructureName(e.target.value)} placeholder="e.g., Car Washer — Slab FY26-27" disabled={!canEdit} className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Role</Label>
            <Select value={roleId} onValueChange={setRoleId} disabled={!canEdit}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Statutory Scheme</Label>
            <Select value={scheme} onValueChange={(v) => { setScheme(v as SlabScheme); setResult(null); setSavedRecord(null); }} disabled={!canEdit}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHEMES.map((s) => <SelectItem key={s} value={s}>{SLAB_SCHEME_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-gray-400">₹{range.min.toLocaleString("en-IN")}–₹{range.max.toLocaleString("en-IN")}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gross Monthly Salary</Label>
            <div className="flex gap-2">
              <Input type="number" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} placeholder="e.g., 20000" disabled={!canEdit} className="h-8" />
              <Button size="sm" onClick={handleLookup} disabled={!canEdit} className="h-8 flex-shrink-0"><Sparkles className="w-3.5 h-3.5 mr-1" /> Fill</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && manualMode && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
          No slab band covers this Gross for the selected scheme — every field below starts at 0 for fully manual entry.
        </div>
      )}

      {result && (
        <>
          {/* Earnings | Deductions | Employer — three columns, one card */}
          <Card>
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              <div className="lg:col-span-6 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">EARNINGS</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {EARNING_FIELDS.map((f) => renderField(f.key, f.label))}
                </div>
              </div>
              <div className="lg:col-span-3 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">DEDUCTIONS</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {DEDUCTION_FIELDS.map((f) => renderField(f.key, f.label))}
                </div>
              </div>
              <div className="lg:col-span-3 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">EMPLOYER</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {EMPLOYER_FIELDS.map((f) => renderField(f.key, f.label))}
                </div>
              </div>
            </div>
          </Card>

          {/* Summary — compact strip */}
          <div className="bg-purple-700 text-white rounded-lg px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /><span className="text-purple-200 text-xs">Gross</span> {fmt(result.gross)}</div>
            <div><span className="text-purple-200 text-xs">Deductions</span> {fmt(result.deductionTotal)}</div>
            <div><span className="text-purple-200 text-xs">Net Pay</span> {fmt(result.netPay)}</div>
            <div><span className="text-purple-200 text-xs">Monthly CTC</span> {fmt(result.ctcMonthly)}</div>
            <div className="font-bold"><span className="text-purple-200 text-xs font-normal">Annual CTC</span> {fmt(result.ctcYearly)}</div>
          </div>

          <div className="flex items-center justify-between">
            {!savedRecord ? (
              <Button onClick={handleSave} disabled={!canEdit} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" /> Save Structure
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-green-700">
                <Save className="w-3.5 h-3.5" /> Saved. Further edits above save automatically as overrides.
              </div>
            )}
            {savedRecord && savedRecord.overrides.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:underline"
              >
                <History className="w-3.5 h-3.5" /> {showHistory ? "Hide" : "Show"} Override History ({savedRecord.overrides.length})
              </button>
            )}
          </div>

          {savedRecord && showHistory && savedRecord.overrides.length > 0 && (
            <Card>
              <CardContent className="p-3 space-y-1.5 max-h-32 overflow-y-auto">
                {savedRecord.overrides.slice().reverse().map((o, idx) => (
                  <div key={idx} className="text-xs text-gray-600 border-b pb-1.5 last:border-0">
                    <span className="font-medium">{o.field}</span>: {o.fromValue} → {o.toValue}
                    <span className="text-gray-400"> — {o.changedBy} ({o.changedByRole}), {new Date(o.changedAt).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default SlabStructureBuilder;
