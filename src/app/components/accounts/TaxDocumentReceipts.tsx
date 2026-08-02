/**
 * Accounts-facing record-keeping screen for tax-declaration proof documents.
 * Previously no role other than HR ever saw these declarations at all — HR
 * verified them for TDS purposes, but Accounts (who need to file/retain the
 * actual proof documents) had no visibility and no way to log physical
 * receipt of anything. This screen closes that gap: once HR verifies a
 * declaration, it shows up here for Accounts to acknowledge receipt, with a
 * permanent, timestamped record of who received it and when.
 */
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CheckCircle, IndianRupee, Clock, FileImage, Archive } from "lucide-react";
import { toast } from "sonner";

export function TaxDocumentReceipts() {
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pending = useMemo(
    () => investmentDeclarationService.getPendingAccountsReceipt(),
    [refresh]
  );
  const received = useMemo(
    () => investmentDeclarationService.getReceivedByAccountsHistory()
      .sort((a, b) => (b.receivedByAccountsAt || "").localeCompare(a.receivedByAccountsAt || "")),
    [refresh]
  );

  const handleReceive = (record: InvestmentDeclaration) => {
    investmentDeclarationService.markReceivedByAccounts(record.id, currentUser?.name || "Accounts");
    toast.success(`Logged as received from ${record.employeeName} for record-keeping`);
    setRefresh((r) => r + 1);
  };

  const renderLineItems = (record: InvestmentDeclaration) => (
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
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tax Document Receipts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record-keeping for HR-verified tax declaration proofs handed over to Accounts for filing.
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-1" /> Awaiting Receipt ({pending.length})</TabsTrigger>
          <TabsTrigger value="received"><Archive className="w-4 h-4 mr-1" /> Received ({received.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No verified declarations awaiting document receipt.</p>
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
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">{record.regime} Regime</Badge>
                        <span className="text-xs text-gray-400">FY {record.financialYear}</span>
                        <span className="text-xs text-gray-400">Verified by {record.verifiedBy}</span>
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
                  {isExpanded && renderLineItems(record)}

                  <Button size="sm" onClick={() => handleReceive(record)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Mark Received
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="received" className="space-y-3">
          {received.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No documents logged as received yet.</p>
          )}
          {received.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{record.employeeName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline">FY {record.financialYear}</Badge>
                    <span className="text-xs text-gray-400">
                      Received by {record.receivedByAccountsBy} on{" "}
                      {record.receivedByAccountsAt ? new Date(record.receivedByAccountsAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <span className="font-semibold flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" /> {investmentDeclarationService.getCappedTotal(record).toLocaleString("en-IN")}
                </span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TaxDocumentReceipts;
