/**
 * KraApprovalQueue.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Super Admin's real approval gate for KRA structures HR has authored and
 * submitted — the piece that was missing before (every existing scorecard
 * auto-approved its own hardcoded default the instant it first mounted).
 * Approving activates the structure for that role+quarter; rejecting
 * requires a real, mandatory comment and sends it back to HR as a Draft.
 */

import { useMemo, useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  getPendingApprovalKraTemplates, approveKraTemplate, rejectKraTemplate, getKpiCatalog,
} from "../../services/kraEngineService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function KraApprovalQueue() {
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showReject, setShowReject] = useState(false);

  const pending = useMemo(() => getPendingApprovalKraTemplates(), [refresh]);
  const catalog = useMemo(() => getKpiCatalog(), [refresh]);
  const selected = pending.find((t) => t.id === selectedId);

  const approve = (templateId: string) => {
    const result = approveKraTemplate(templateId, currentUser?.name || "Super Admin");
    if (!result.success) { toast.error(result.error || "Could not approve"); return; }
    toast.success("KRA structure approved and now Active for that quarter");
    setSelectedId(null); setRefresh((r) => r + 1);
  };

  const reject = (templateId: string) => {
    const result = rejectKraTemplate(templateId, currentUser?.name || "Super Admin", comment);
    if (!result.success) { toast.error(result.error || "A comment is required to reject"); return; }
    toast.success("Rejected — sent back to HR as a Draft");
    setSelectedId(null); setShowReject(false); setComment(""); setRefresh((r) => r + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KRA Approvals</h1>
        <p className="text-sm text-gray-500">Role-level KRA structures HR has submitted, awaiting your approval before they go live for that quarter.</p>
      </div>

      {pending.length === 0 && (
        <p className="text-center text-gray-400 py-12">Nothing pending your approval.</p>
      )}

      {!selected && pending.map((t) => (
        <Card key={t.id} className="cursor-pointer hover:shadow-md" onClick={() => { setSelectedId(t.id); setShowReject(false); setComment(""); }}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{t.role} — {t.financialQuarter} FY{t.financialYear} (v{t.version})</p>
              <p className="text-xs text-gray-500">{t.kras.length} KRA(s), {t.kras.reduce((s, k) => s + k.kpis.length, 0)} KPI(s) · Submitted by {t.submittedBy}</p>
            </div>
            <span className="text-xs text-gray-400">Review →</span>
          </CardContent>
        </Card>
      ))}

      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selected.role} — {selected.financialQuarter} FY{selected.financialYear} (v{selected.version})</CardTitle>
              <button onClick={() => { setSelectedId(null); setShowReject(false); }} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected.kras.map((kra) => (
              <div key={kra.kraCode} className="border rounded-lg p-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>{kra.name}</span>
                  <span>{kra.weight}%</span>
                </div>
                <div className="mt-1 space-y-1">
                  {kra.kpis.map((kpi) => {
                    const entry = catalog.find((c) => c.code === kpi.kpiCode);
                    return (
                      <div key={kpi.kpiCode} className="flex justify-between text-xs text-gray-500 pl-2">
                        <span>{entry?.name || kpi.kpiCode}{entry?.dataSource === "MANUAL_ENTRY" && " (manual entry)"}</span>
                        <span>Target: {kpi.defaultTarget ?? "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">Total weight: {selected.kras.reduce((s, k) => s + k.weight, 0)}% · Submitted by {selected.submittedBy}</p>

            {!showReject ? (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setShowReject(true)}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => approve(selected.id)}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reason for rejection *" />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowReject(false)}>Cancel</Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => reject(selected.id)}>Confirm Rejection</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default KraApprovalQueue;
