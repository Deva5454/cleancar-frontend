import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  investmentDeclarationService,
  SECTION_LABELS,
  type InvestmentDeclaration,
} from "../../services/investmentDeclarationService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { CheckCircle, XCircle, IndianRupee, Clock, FileImage } from "lucide-react";
import { toast } from "sonner";

export function InvestmentDeclarationVerification() {
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pending = useMemo(
    () => investmentDeclarationService.getPendingVerification(),
    [refresh]
  );

  const handleVerify = (record: InvestmentDeclaration) => {
    investmentDeclarationService.verify(record.id, currentUser?.name || "HR");
    toast.success(`Verified — ₹${investmentDeclarationService.getCappedTotal(record).toLocaleString("en-IN")} will now be applied to this employee's TDS calculation`);
    setRefresh((r) => r + 1);
  };

  const confirmReject = (record: InvestmentDeclaration) => {
    if (!rejectReason.trim()) { toast.error("Add a reason for rejection"); return; }
    investmentDeclarationService.reject(record.id, currentUser?.name || "HR", rejectReason);
    toast.success("Declaration rejected — employee has been notified");
    setRejectingId(null);
    setRejectReason("");
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold">Declarations Pending Verification ({pending.length})</h3>
      </div>

      {pending.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">No declarations pending verification.</p>
      )}

      {pending.map((record) => {
        const cappedTotal = investmentDeclarationService.getCappedTotal(record);
        const isExpanded = expandedId === record.id;
        return (
          <Card key={record.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{record.employeeName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{record.regime} Regime</Badge>
                    <span className="text-xs text-gray-400">FY {record.financialYear}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 font-semibold text-lg">
                    <IndianRupee className="w-4 h-4" /> {cappedTotal.toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs text-gray-400">capped total</span>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : record.id)}>
                {isExpanded ? "Hide" : "View"} line items & proofs
              </Button>

              {isExpanded && (
                <div className="space-y-2 border-t pt-2">
                  {record.lineItems.filter((it) => it.declaredAmount > 0).map((it) => (
                    <div key={it.section} className="flex items-center justify-between text-sm">
                      <span>{SECTION_LABELS[it.section]}</span>
                      <div className="flex items-center gap-2">
                        <span>₹{it.declaredAmount.toLocaleString("en-IN")}</span>
                        {it.proofDataUrl ? (
                          <a href={it.proofDataUrl} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1">
                            <FileImage className="w-3 h-3" /> Proof
                          </a>
                        ) : (
                          <span className="text-amber-600 text-xs">No proof attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rejectingId === record.id ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => confirmReject(record)}>Confirm Reject</Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleVerify(record)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Verify
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectingId(record.id)}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default InvestmentDeclarationVerification;
