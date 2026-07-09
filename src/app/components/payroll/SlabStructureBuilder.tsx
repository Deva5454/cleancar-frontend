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
      <div key={key} className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">{label}</Label>
          {isComputed && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">computed</Badge>
          )}
        </div>
        <Input
          type="number" value={value} disabled={!canEdit}
          onChange={(e) => updateField(key, Number(e.target.value) || 0)}
          onBlur={(e) => handleFieldCommit(key, Number(e.target.value) || 0)}
          className={!canEdit ? "bg-gray-50" : ""}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Only HR and Super Admin can create or edit statutory slab structures. You can view but not save.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">1. Setup</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Structure Name</Label>
            <Input value={structureName} onChange={(e) => setStructureName(e.target.value)} placeholder="e.g., Car Washer — Slab FY26-27" disabled={!canEdit} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={roleId} onValueChange={setRoleId} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Statutory Scheme</Label>
            <Select value={scheme} onValueChange={(v) => { setScheme(v as SlabScheme); setResult(null); setSavedRecord(null); }} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHEMES.map((s) => <SelectItem key={s} value={s}>{SLAB_SCHEME_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">Covers ₹{range.min.toLocaleString("en-IN")} – ₹{range.max.toLocaleString("en-IN")} Gross</p>
          </div>
          <div className="space-y-1.5">
            <Label>Gross Monthly Salary</Label>
            <div className="flex gap-2">
              <Input type="number" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} placeholder="e.g., 20000" disabled={!canEdit} />
              <Button onClick={handleLookup} disabled={!canEdit}><Sparkles className="w-4 h-4 mr-1" /> Auto-Fill</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && manualMode && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          No slab band covers this Gross for the selected scheme — every field below starts at 0 for fully manual entry.
        </div>
      )}

      {result && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">2. Earnings</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {EARNING_FIELDS.map((f) => renderField(f.key, f.label))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">3. Employee Deductions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DEDUCTION_FIELDS.map((f) => renderField(f.key, f.label))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">4. Employer Contributions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {EMPLOYER_FIELDS.map((f) => renderField(f.key, f.label))}
            </CardContent>
          </Card>

          <Card className="border-purple-300 bg-purple-50">
            <CardHeader><CardTitle className="text-base">Summary (always computed — not directly editable)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500">Gross</p><p className="font-semibold flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />{fmt(result.gross)}</p></div>
              <div><p className="text-gray-500">Total Deductions</p><p className="font-semibold">{fmt(result.deductionTotal)}</p></div>
              <div><p className="text-gray-500">Net Pay</p><p className="font-semibold text-green-700">{fmt(result.netPay)}</p></div>
              <div><p className="text-gray-500">Monthly CTC</p><p className="font-semibold text-purple-700">{fmt(result.ctcMonthly)}</p></div>
              <div className="col-span-2 sm:col-span-1"><p className="text-gray-500">Annual CTC</p><p className="font-semibold text-purple-700">{fmt(result.ctcYearly)}</p></div>
            </CardContent>
          </Card>

          {!savedRecord ? (
            <Button onClick={handleSave} disabled={!canEdit} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" /> Save Structure
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Save className="w-4 h-4" /> Saved. Further edits above are saved automatically as overrides.
            </div>
          )}

          {savedRecord && savedRecord.overrides.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Override History ({savedRecord.overrides.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
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
