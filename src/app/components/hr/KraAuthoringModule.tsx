/**
 * KraAuthoringModule.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * HR authors a role's KRA structure (which KPIs, what weights) for a
 * financial quarter, then submits it for Super Admin approval — the real
 * gate that was missing before (kraEngineService.ts already had the right
 * Draft → PendingApproval → Active → Archived lifecycle, it just had no
 * real human-driven UI in front of it; every existing scorecard silently
 * auto-created and auto-approved its own hardcoded default).
 *
 * Also provides "continue for next quarter" (clone the previous quarter's
 * Active structure forward as an editable new Draft) and a version-history
 * list per role, so every quarter's KRA stays retrievable on its own.
 */

import { useEffect, useMemo, useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import {
  getKraTemplates, getActiveKraTemplate, createKraTemplateVersion, updateKraTemplateDraft,
  submitKraTemplateForApproval, cloneKraTemplateToNextQuarter, getKpiCatalog, upsertKpiCatalogEntry,
  type KraTemplate, type KraDefinition, type KraKpiLink, type KpiCatalogEntry,
} from "../../services/kraEngineService";
import { getSuggestedKrasForRole } from "../../services/kraDefaultKrasRegistry";
import { seedAllKraKpiCatalogs } from "../../services/kraCatalogSeeder";
import { getFinancialQuarter, listPastAndCurrentQuarters, type FinancialQuarter } from "../../services/financialQuarter";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Trash2, Send, Copy, History } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  PendingApproval: "bg-amber-100 text-amber-700",
  Active: "bg-green-100 text-green-700",
  Archived: "bg-slate-100 text-slate-500",
};

function slugify(name: string): string {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function KraAuthoringModule() {
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);
  const current = getFinancialQuarter();

  useEffect(() => {
    // Same real fix as KraScorecardHub.tsx — HR may open this Authoring
    // screen before ever visiting the Scorecard, so the KPI catalog must
    // be seeded here too, not only there.
    seedAllKraKpiCatalogs();
    setRefresh((r) => r + 1);
  }, []);

  const roles = useMemo(() => {
    const set = new Set(
      employeeDatabaseService.getAll()
        .filter((e) => e.status !== "Inactive" && e.designation)
        .map((e) => e.designation)
    );
    return Array.from(set).sort();
  }, [refresh]);

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState(current.financialYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter>(current.quarter);
  const quarterOptions = useMemo(() => listPastAndCurrentQuarters(8), []);

  const templatesForRole = useMemo(
    () => (selectedRole ? getKraTemplates(selectedRole).sort((a, b) => b.version - a.version) : []),
    [selectedRole, refresh]
  );
  const draftForQuarter = useMemo(
    () => templatesForRole.find((t) => t.financialYear === selectedYear && t.financialQuarter === selectedQuarter && t.status !== "Archived"),
    [templatesForRole, selectedYear, selectedQuarter]
  );
  const previousActive = useMemo(() => {
    if (!selectedRole) return undefined;
    return templatesForRole.find((t) => t.status === "Active");
  }, [templatesForRole, selectedRole]);

  const [editingKras, setEditingKras] = useState<KraDefinition[] | null>(null);
  const activeTemplate = draftForQuarter;
  const kras = editingKras ?? activeTemplate?.kras ?? [];
  const totalWeight = kras.reduce((s, k) => s + k.weight, 0);

  const catalog = useMemo(() => getKpiCatalog(), [refresh]);

  const suggestedKras = useMemo(() => {
    if (!selectedRole) return [];
    const addedCodes = new Set(kras.map((k) => k.kraCode));
    return getSuggestedKrasForRole(selectedRole).filter((k) => !addedCodes.has(k.kraCode));
  }, [selectedRole, kras]);

  const loadForEditing = (template?: KraTemplate) => {
    setEditingKras(template ? template.kras.map((k) => ({ ...k, kpis: k.kpis.map((kpi) => ({ ...kpi })) })) : []);
  };

  const startBlankDraft = () => {
    if (!selectedRole) { toast.error("Select a role first"); return; }
    if (draftForQuarter) { toast.error("A KRA structure already exists for this role and quarter"); return; }
    const template = createKraTemplateVersion(selectedRole, [], currentUser?.name || "HR", selectedYear, selectedQuarter);
    toast.success("Draft created — add KRAs and KPIs below");
    loadForEditing(template);
    setRefresh((r) => r + 1);
  };

  const cloneForward = () => {
    if (!previousActive) { toast.error("No previously-active KRA structure to clone from"); return; }
    const result = cloneKraTemplateToNextQuarter(previousActive.id, currentUser?.name || "HR");
    if (!result.success || !result.template) { toast.error(result.error || "Could not clone"); return; }
    toast.success(`Cloned forward to ${result.template.financialQuarter} FY${result.template.financialYear} — edit as needed`);
    setSelectedYear(result.template.financialYear);
    setSelectedQuarter(result.template.financialQuarter);
    setRefresh((r) => r + 1);
  };

  const saveDraft = (updated: KraDefinition[]) => {
    setEditingKras(updated);
    if (activeTemplate) updateKraTemplateDraft(activeTemplate.id, updated);
  };

  const addCustomKra = () => {
    const name = prompt("KRA name (e.g. \"Customer Retention\")");
    if (!name?.trim()) return;
    const weight = Number(prompt("Weight (% of total, e.g. 30)") || 0);
    saveDraft([...kras, { kraCode: slugify(name), name: name.trim(), weight, kpis: [] }]);
  };
  const addSuggestedKra = (kraCode: string) => {
    if (kraCode === "__custom__") { addCustomKra(); return; }
    const suggestion = suggestedKras.find((k) => k.kraCode === kraCode);
    if (!suggestion) return;
    saveDraft([...kras, { ...suggestion, kpis: suggestion.kpis.map((kpi) => ({ ...kpi })) }]);
  };
  const removeKra = (kraCode: string) => saveDraft(kras.filter((k) => k.kraCode !== kraCode));
  const updateKraWeight = (kraCode: string, weight: number) => saveDraft(kras.map((k) => k.kraCode === kraCode ? { ...k, weight } : k));

  const addKpiLink = (kraCode: string, entry: KpiCatalogEntry, suggestedTarget?: number) => {
    const target = Number(prompt(`Target value for ${entry.name} this quarter (e.g. ${suggestedTarget ?? 80})`, String(suggestedTarget ?? "")) || 0);
    const newLink: KraKpiLink = { kpiCode: entry.code, weight: 100, defaultTarget: target };
    saveDraft(kras.map((k) => k.kraCode === kraCode ? { ...k, kpis: [...k.kpis, newLink] } : k));
  };
  const addCustomKpi = (kraCode: string) => {
    const name = prompt("New KPI name (not in the existing catalog)");
    if (!name?.trim()) return;
    const code = slugify(name);
    const entry: KpiCatalogEntry = { code, name: name.trim(), unit: "%", direction: "higher-is-better", dataSource: "MANUAL_ENTRY", description: "Manually entered each quarter — no automatic real-data formula exists for this KPI yet." };
    upsertKpiCatalogEntry(entry);
    setRefresh((r) => r + 1);
    addKpiLink(kraCode, entry);
  };
  const addKpiFromDropdown = (kraCode: string, kpiCode: string) => {
    if (kpiCode === "__custom__") { addCustomKpi(kraCode); return; }
    const entry = catalog.find((c) => c.code === kpiCode);
    if (!entry) return;
    const suggestion = getSuggestedKrasForRole(selectedRole).find((k) => k.kraCode === kraCode)?.kpis.find((kpi) => kpi.kpiCode === kpiCode);
    addKpiLink(kraCode, entry, suggestion?.defaultTarget);
  };
  const kpisInKra = (kraCode: string): Set<string> => new Set(kras.find((k) => k.kraCode === kraCode)?.kpis.map((kpi) => kpi.kpiCode) || []);
  const removeKpi = (kraCode: string, kpiCode: string) => saveDraft(kras.map((k) => k.kraCode === kraCode ? { ...k, kpis: k.kpis.filter((kpi) => kpi.kpiCode !== kpiCode) } : k));
  const updateKpiTarget = (kraCode: string, kpiCode: string, target: number) => saveDraft(kras.map((k) => k.kraCode === kraCode ? { ...k, kpis: k.kpis.map((kpi) => kpi.kpiCode === kpiCode ? { ...kpi, defaultTarget: target } : kpi) } : k));
  const updateKpiWeight = (kraCode: string, kpiCode: string, weight: number) => saveDraft(kras.map((k) => k.kraCode === kraCode ? { ...k, kpis: k.kpis.map((kpi) => kpi.kpiCode === kpiCode ? { ...kpi, weight } : kpi) } : k));

  const submit = () => {
    if (!activeTemplate) return;
    const result = submitKraTemplateForApproval(activeTemplate.id, currentUser?.name || "HR");
    if (!result.success) { toast.error(result.error || "Could not submit"); return; }
    toast.success("Submitted for Super Admin approval");
    setEditingKras(null);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KRA Authoring</h1>
        <p className="text-sm text-gray-500">Define each role's KRA structure for a financial quarter, then submit for Super Admin approval.</p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setEditingKras(null); }}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Financial Quarter</Label>
            <Select
              value={`${selectedYear}|${selectedQuarter}`}
              onValueChange={(v) => { const [y, q] = v.split("|"); setSelectedYear(y); setSelectedQuarter(q as FinancialQuarter); setEditingKras(null); }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {quarterOptions.map((q) => (
                  <SelectItem key={`${q.financialYear}|${q.quarter}`} value={`${q.financialYear}|${q.quarter}`}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedRole && !draftForQuarter && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-gray-500">No KRA structure exists yet for {selectedRole} in {selectedQuarter} FY{selectedYear}.</p>
            <div className="flex gap-3">
              <Button onClick={startBlankDraft}><Plus className="w-4 h-4 mr-1" /> Start Blank Draft</Button>
              {previousActive && (
                <Button variant="outline" onClick={cloneForward}>
                  <Copy className="w-4 h-4 mr-1" /> Continue from {previousActive.financialQuarter} FY{previousActive.financialYear}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {draftForQuarter && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedRole} — {selectedQuarter} FY{selectedYear} (v{draftForQuarter.version})
              </CardTitle>
              <Badge className={STATUS_COLORS[draftForQuarter.status]}>{draftForQuarter.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {draftForQuarter.rejectedReason && draftForQuarter.status === "Draft" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Rejected by {draftForQuarter.rejectedBy}: {draftForQuarter.rejectedReason}
              </div>
            )}

            {draftForQuarter.status !== "Draft" && (
              <p className="text-xs text-gray-400">This version is {draftForQuarter.status.toLowerCase()} and read-only. {draftForQuarter.status === "Active" ? "Use \"Continue\" from a future quarter to build on it." : ""}</p>
            )}

            {kras.map((kra) => (
              <div key={kra.kraCode} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{kra.name}</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" className="w-20 h-8" value={kra.weight}
                      disabled={draftForQuarter.status !== "Draft"}
                      onChange={(e) => updateKraWeight(kra.kraCode, Number(e.target.value))} />
                    <span className="text-xs text-gray-400">%</span>
                    {draftForQuarter.status === "Draft" && (
                      <button onClick={() => removeKra(kra.kraCode)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="pl-3 space-y-1.5">
                  {kra.kpis.map((kpi) => {
                    const entry = catalog.find((c) => c.code === kpi.kpiCode);
                    return (
                      <div key={kpi.kpiCode} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded p-2">
                        <span className="flex-1">
                          {entry?.name || kpi.kpiCode}
                          {entry?.dataSource === "MANUAL_ENTRY" && <span className="ml-1 text-amber-600">(manual entry)</span>}
                        </span>
                        <span className="text-gray-400">Target:</span>
                        <Input type="number" className="w-20 h-7" value={kpi.defaultTarget ?? 0}
                          disabled={draftForQuarter.status !== "Draft"}
                          onChange={(e) => updateKpiTarget(kra.kraCode, kpi.kpiCode, Number(e.target.value))} />
                        {kra.kpis.length > 1 && (
                          <>
                            <span className="text-gray-400">Weight:</span>
                            <Input type="number" className="w-16 h-7" value={kpi.weight}
                              disabled={draftForQuarter.status !== "Draft"}
                              onChange={(e) => updateKpiWeight(kra.kraCode, kpi.kpiCode, Number(e.target.value))} />
                          </>
                        )}
                        {draftForQuarter.status === "Draft" && (
                          <button onClick={() => removeKpi(kra.kraCode, kpi.kpiCode)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {draftForQuarter.status === "Draft" && (
                    <Select key={`add-kpi-${kra.kraCode}-${kra.kpis.length}`} onValueChange={(v) => addKpiFromDropdown(kra.kraCode, v)}>
                      <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="+ Add KPI" /></SelectTrigger>
                      <SelectContent>
                        {catalog.filter((c) => !kpisInKra(kra.kraCode).has(c.code)).map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name} ({c.unit}){c.dataSource === "MANUAL_ENTRY" ? " — manual" : ""}</SelectItem>
                        ))}
                        <SelectItem value="__custom__">+ Custom KPI…</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}

            {draftForQuarter.status === "Draft" && (
              <Select key={`add-kra-${kras.length}`} onValueChange={addSuggestedKra}>
                <SelectTrigger className="w-full"><SelectValue placeholder="+ Add KRA Group" /></SelectTrigger>
                <SelectContent>
                  {suggestedKras.map((k) => (
                    <SelectItem key={k.kraCode} value={k.kraCode}>{k.name} ({k.weight}% suggested)</SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ Custom KRA…</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className={`text-sm font-medium ${Math.round(totalWeight) === 100 ? "text-green-700" : "text-amber-600"}`}>
              Total weight: {totalWeight}% {Math.round(totalWeight) !== 100 && "(must sum to 100% to submit)"}
            </div>

            {draftForQuarter.status === "Draft" && (
              <Button className="w-full" disabled={Math.round(totalWeight) !== 100 || kras.length === 0} onClick={submit}>
                <Send className="w-4 h-4 mr-1" /> Submit for Super Admin Approval
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {selectedRole && templatesForRole.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><History className="w-4 h-4" /> Version History — {selectedRole}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {templatesForRole.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span>v{t.version} — {t.financialQuarter} FY{t.financialYear}</span>
                <Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default KraAuthoringModule;
