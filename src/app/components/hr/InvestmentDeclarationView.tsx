import { useState, useMemo, useRef } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  investmentDeclarationService,
  SECTION_CAPS,
  SECTION_LABELS,
  type DeclarationSection,
  type TaxRegime,
  type DeclarationLineItem,
} from "../../services/investmentDeclarationService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Camera, Clock, AlertTriangle, CheckCircle2, IndianRupee } from "lucide-react";
import { toast } from "sonner";

const SECTIONS: DeclarationSection[] = [
  "section80C", "section80D", "homeLoanInterest", "nps80CCD1B", "hraExemption", "other",
];

function currentFinancialYear(): string {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // FY starts April
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

const STATUS_COLOR: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  Verified: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export function InvestmentDeclarationView() {
  const { currentUser } = useRole();
  const financialYear = currentFinancialYear();
  const [refresh, setRefresh] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const existing = useMemo(
    () => investmentDeclarationService.getByEmployee(currentUser?.employeeId || "", financialYear),
    [refresh, currentUser?.employeeId, financialYear]
  );

  const [regime, setRegime] = useState<TaxRegime>(existing?.regime || "Old");
  const [lineItems, setLineItems] = useState<DeclarationLineItem[]>(
    existing?.lineItems || SECTIONS.map((s) => ({ section: s, declaredAmount: 0 }))
  );

  const window_ = investmentDeclarationService.getWindow(financialYear);
  const pastCutoff = investmentDeclarationService.isPastCutoff(financialYear);
  const daysLeft = investmentDeclarationService.daysUntilCutoff(financialYear);

  const isLocked = existing?.status === "Submitted" || existing?.status === "Verified";

  const updateAmount = (section: DeclarationSection, amount: number) => {
    setLineItems((items) =>
      items.map((it) => (it.section === section ? { ...it, declaredAmount: amount } : it))
    );
  };

  const captureProof = (section: DeclarationSection, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLineItems((items) =>
        items.map((it) =>
          it.section === section ? { ...it, proofDataUrl: dataUrl, proofFileName: file.name } : it
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const totalDeclared = lineItems.reduce((sum, it) => sum + (it.declaredAmount || 0), 0);

  const handleSaveDraft = () => {
    investmentDeclarationService.saveDraft({
      employeeId: currentUser?.employeeId || "",
      employeeName: currentUser?.name || "",
      financialYear,
      regime,
      lineItems,
    });
    toast.success("Draft saved");
    setRefresh((r) => r + 1);
  };

  const handleSubmit = () => {
    const record = investmentDeclarationService.saveDraft({
      employeeId: currentUser?.employeeId || "",
      employeeName: currentUser?.name || "",
      financialYear,
      regime,
      lineItems,
    });
    const result = investmentDeclarationService.submit(record.id);
    if (!result.ok) {
      toast.error(result.error || "Could not submit");
      return;
    }
    toast.success("Declaration submitted for HR verification");
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-4">
      <Card className={pastCutoff ? "border-red-300 bg-red-50" : "border-blue-200 bg-blue-50"}>
        <CardContent className="p-3 flex items-center gap-2 text-sm">
          {pastCutoff ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Clock className="w-4 h-4 text-blue-600" />}
          <span className={pastCutoff ? "text-red-800" : "text-blue-800"}>
            {pastCutoff
              ? `Submission window for FY ${financialYear} closed on ${window_.cutoffDate}.`
              : `FY ${financialYear} declarations close on ${window_.cutoffDate} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left).`}
          </span>
        </CardContent>
      </Card>

      {existing && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          <Badge className={STATUS_COLOR[existing.status]}>{existing.status}</Badge>
          {existing.status === "Rejected" && existing.rejectionReason && (
            <span className="text-sm text-red-600">— {existing.rejectionReason}</span>
          )}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Tax Regime</CardTitle></CardHeader>
        <CardContent>
          <Select value={regime} onValueChange={(v) => setRegime(v as TaxRegime)} disabled={isLocked}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Old">Old Regime (deductions apply)</SelectItem>
              <SelectItem value="New">New Regime (no deductions)</SelectItem>
            </SelectContent>
          </Select>
          {regime === "New" && (
            <p className="text-xs text-gray-500 mt-2">
              Under the New Regime, declared investments below won't reduce your TDS. Switch to Old Regime if you want them counted.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Declared Investments &amp; Proofs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item) => {
            const cap = SECTION_CAPS[item.section];
            return (
              <div key={item.section} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{SECTION_LABELS[item.section]}</Label>
                  {Number.isFinite(cap) && cap > 0 && (
                    <span className="text-xs text-gray-400">Cap: ₹{cap.toLocaleString("en-IN")}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gray-400" />
                  <Input
                    type="number" min={0} disabled={isLocked}
                    value={item.declaredAmount || ""}
                    onChange={(e) => updateAmount(item.section, Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button" variant="outline" size="sm" disabled={isLocked}
                    onClick={() => fileRefs.current[item.section]?.click()}
                  >
                    <Camera className="w-4 h-4 mr-1" /> {item.proofDataUrl ? "Replace Proof" : "Attach Proof"}
                  </Button>
                  {item.proofDataUrl && <Badge className="bg-green-100 text-green-700">Proof attached</Badge>}
                  <input
                    ref={(el) => (fileRefs.current[item.section] = el)}
                    type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={(e) => e.target.files?.[0] && captureProof(item.section, e.target.files[0])}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Total Declared</span>
            <span className="font-semibold flex items-center gap-1">
              <IndianRupee className="w-4 h-4" /> {totalDeclared.toLocaleString("en-IN")}
            </span>
          </div>

          {!isLocked && !pastCutoff && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
              <Button onClick={handleSubmit}>Submit for Verification</Button>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" /> Submitted — awaiting HR verification. Contact HR to reopen if you need to make changes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InvestmentDeclarationView;
