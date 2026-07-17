/**
 * DebtorsReport — /accounts/debtors
 *
 * Real aged-receivables report. Traced the real data first, rather than
 * assuming a mirror of Creditors would work: regular customer sales and
 * web subscriptions in this business are paid at the time of service —
 * every real revenue record creates a matching payment line immediately,
 * so there's no outstanding balance to report there.
 *
 * The real "pay later" arrangement in this business is the Block Deal —
 * a corporate/bulk booking with a two-phase payment: Phase 1 upfront,
 * Phase 2 due later (salesManagerService.ts, SMBlockDeal). This report
 * is built on that real data, not invented placeholder receivables.
 */

import { useMemo } from "react";
import { salesManagerService, type SMBlockDeal } from "../../services/salesManagerService";
import { Badge } from "../ui/badge";
import { Users, Download } from "lucide-react";
import { showExportMenu } from "../../utils/gstExportUtils";

type AgingBucket = "current" | "0-30" | "31-60" | "61-90" | "90+";

function agingBucket(dueDate: string): AgingBucket {
  const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  if (days <= 0) return "current";
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

const BUCKET_LABELS: Record<AgingBucket, string> = {
  current: "Not Yet Due",
  "0-30": "0-30 Days Overdue",
  "31-60": "31-60 Days Overdue",
  "61-90": "61-90 Days Overdue",
  "90+": "90+ Days Overdue",
};

const BUCKET_COLORS: Record<AgingBucket, string> = {
  current: "bg-gray-50 text-gray-700 border-gray-200",
  "0-30": "bg-amber-50 text-amber-700 border-amber-200",
  "31-60": "bg-orange-50 text-orange-700 border-orange-200",
  "61-90": "bg-red-50 text-red-700 border-red-200",
  "90+": "bg-red-100 text-red-800 border-red-300",
};

export function DebtorsReport() {
  const outstanding = useMemo(() => {
    const deals = salesManagerService.getBlockDeals();
    return deals.filter(
      (d: SMBlockDeal) => d.phase2Status !== "paid" && d.phase2Amount > 0
    );
  }, []);

  const rows = useMemo(() => {
    return outstanding.map((d: SMBlockDeal) => ({
      id: d.id,
      name: d.locationName,
      amount: d.phase2Amount,
      bucket: agingBucket(d.phase2CheckDate),
      dueDate: d.phase2CheckDate,
      packageType: d.packageType,
      vehicleCount: d.vehicleCount,
    }));
  }, [outstanding]);

  const grandTotal = rows.reduce((s, r) => s + r.amount, 0);
  const bucketTotals = (["current", "0-30", "31-60", "61-90", "90+"] as AgingBucket[]).reduce(
    (acc, b) => {
      acc[b] = rows.filter((r) => r.bucket === b).reduce((s, r) => s + r.amount, 0);
      return acc;
    },
    {} as Record<AgingBucket, number>
  );

  const handleExport = (e: React.MouseEvent) => {
    const data = rows.map((r) => ({
      Customer: r.name,
      Package: r.packageType,
      Vehicles: r.vehicleCount,
      "Due Date": r.dueDate,
      Status: BUCKET_LABELS[r.bucket],
      Amount: r.amount,
    }));
    showExportMenu(data, "debtors-report", e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Debtors Report
          </h1>
          <p className="text-sm text-gray-500">
            Corporate/block-deal customers with a Phase 2 payment still outstanding, aged by due date
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 rounded-lg border bg-gray-900 text-white">
          <p className="text-xs opacity-80">Total Owed to Us</p>
          <p className="text-xl font-bold">₹{grandTotal.toLocaleString("en-IN")}</p>
        </div>
        {(["current", "0-30", "31-60", "61-90", "90+"] as AgingBucket[]).map((b) => (
          <div key={b} className={`p-4 rounded-lg border ${BUCKET_COLORS[b]}`}>
            <p className="text-xs">{BUCKET_LABELS[b]}</p>
            <p className="text-lg font-bold">₹{bucketTotals[b].toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 border rounded-lg">
          Nothing outstanding right now — every Phase 2 block-deal payment is settled.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Customer / Location</th>
                <th className="text-left p-3 font-medium text-gray-600">Package</th>
                <th className="text-left p-3 font-medium text-gray-600">Due Date</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-right p-3 font-medium text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{r.name}</td>
                  <td className="p-3 text-gray-600">{r.packageType} ({r.vehicleCount} vehicles)</td>
                  <td className="p-3 text-gray-600">{r.dueDate}</td>
                  <td className="p-3">
                    <Badge className={BUCKET_COLORS[r.bucket]}>{BUCKET_LABELS[r.bucket]}</Badge>
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    ₹{r.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        This reflects Phase 2 payments on real block deals — the only confirmed "pay later" arrangement
        in this business today. Regular customer sales and web subscriptions are paid at the time of
        service and don't carry an outstanding balance, so they don't appear here.
      </p>
    </div>
  );
}

export default DebtorsReport;
