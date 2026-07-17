/**
 * CreditorsReport — /accounts/creditors
 *
 * Real aged-payables report, grouped by vendor. Built on the same
 * authoritative data source PayablesDashboard.tsx already uses
 * (FinanceContext.payables[]) rather than reconstructing balances from
 * raw ledger entries, so this screen can never show a different number
 * than Payables Dashboard for the same underlying data.
 *
 * Aging is computed from the real dueDate on each payable, not an
 * approximation — 0-30 / 31-60 / 61-90 / 90+ days overdue, based on how
 * many days have passed since the due date.
 */

import { useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { useFinance } from "../../contexts/FinanceContext";
import { Badge } from "../ui/badge";
import { Building2, Download } from "lucide-react";
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

export function CreditorsReport() {
  const { city, cityInfo } = useCity();
  const { payables } = useFinance();

  const vendorGroups = useMemo(() => {
    const outstanding = payables.filter(
      (p: any) => p.type === "Vendor" && p.status !== "Paid" && p.cityId === city
    );

    const byVendor = new Map<string, {
      vendorId: string; vendorName: string;
      total: number;
      buckets: Record<AgingBucket, number>;
      bills: typeof outstanding;
    }>();

    outstanding.forEach((p: any) => {
      const key = p.vendorId || p.vendorName || "Unknown Vendor";
      if (!byVendor.has(key)) {
        byVendor.set(key, {
          vendorId: p.vendorId || key,
          vendorName: p.vendorName || "Unknown Vendor",
          total: 0,
          buckets: { current: 0, "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 },
          bills: [],
        });
      }
      const group = byVendor.get(key)!;
      const bucket = agingBucket(p.dueDate);
      group.total += p.amount;
      group.buckets[bucket] += p.amount;
      group.bills.push(p);
    });

    return Array.from(byVendor.values()).sort((a, b) => b.total - a.total);
  }, [payables, city]);

  const grandTotal = vendorGroups.reduce((s, g) => s + g.total, 0);
  const bucketTotals = (["current", "0-30", "31-60", "61-90", "90+"] as AgingBucket[]).reduce(
    (acc, b) => {
      acc[b] = vendorGroups.reduce((s, g) => s + g.buckets[b], 0);
      return acc;
    },
    {} as Record<AgingBucket, number>
  );

  const handleExport = (e: React.MouseEvent) => {
    const data = vendorGroups.map((g) => ({
      Vendor: g.vendorName,
      "Total Owed": g.total,
      "Not Yet Due": g.buckets.current,
      "0-30 Days": g.buckets["0-30"],
      "31-60 Days": g.buckets["31-60"],
      "61-90 Days": g.buckets["61-90"],
      "90+ Days": g.buckets["90+"],
    }));
    showExportMenu(data, "creditors-report", e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            Creditors Report
          </h1>
          <p className="text-sm text-gray-500">
            Every vendor {cityInfo.displayName} currently owes money to, aged by how overdue each bill is
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
          <p className="text-xs opacity-80">Total Owed</p>
          <p className="text-xl font-bold">₹{grandTotal.toLocaleString("en-IN")}</p>
        </div>
        {(["current", "0-30", "31-60", "61-90", "90+"] as AgingBucket[]).map((b) => (
          <div key={b} className={`p-4 rounded-lg border ${BUCKET_COLORS[b]}`}>
            <p className="text-xs">{BUCKET_LABELS[b]}</p>
            <p className="text-lg font-bold">₹{bucketTotals[b].toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {/* Per-vendor breakdown */}
      {vendorGroups.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 border rounded-lg">
          Nothing owed to any vendor right now — every payable is settled.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Vendor</th>
                <th className="text-right p-3 font-medium text-gray-600">Not Yet Due</th>
                <th className="text-right p-3 font-medium text-gray-600">0-30</th>
                <th className="text-right p-3 font-medium text-gray-600">31-60</th>
                <th className="text-right p-3 font-medium text-gray-600">61-90</th>
                <th className="text-right p-3 font-medium text-gray-600">90+</th>
                <th className="text-right p-3 font-medium text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {vendorGroups.map((g) => (
                <tr key={g.vendorId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{g.vendorName}</td>
                  <td className="p-3 text-right text-gray-600">
                    {g.buckets.current > 0 ? `₹${g.buckets.current.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="p-3 text-right text-amber-700">
                    {g.buckets["0-30"] > 0 ? `₹${g.buckets["0-30"].toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="p-3 text-right text-orange-700">
                    {g.buckets["31-60"] > 0 ? `₹${g.buckets["31-60"].toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="p-3 text-right text-red-700">
                    {g.buckets["61-90"] > 0 ? `₹${g.buckets["61-90"].toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="p-3 text-right">
                    {g.buckets["90+"] > 0 ? (
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        ₹{g.buckets["90+"].toLocaleString("en-IN")}
                      </Badge>
                    ) : "—"}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    ₹{g.total.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Aging is calculated per payable record, based on its real due date. Bill-wise tracking within
        a single vendor (matching a specific payment to a specific invoice) isn't built yet — each row
        here reflects the payables currently on record for that vendor, not a bill-by-bill ledger.
      </p>
    </div>
  );
}

export default CreditorsReport;
