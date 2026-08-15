import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Truck, FileText, CheckCircle, XCircle, Clock, PackagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { seedMaterialReceiveImport } from "../../services/materialReceiveImportSeed";

// ✅ FIX: this screen used to seed 6 fabricated demo GRN records
// (fictional suppliers, invented shelf locations) into the same
// "cleancar_grn_records" key that GRN Entry writes real receipts to,
// and its own "Create GRN" dialog updated centralStock by matching
// item names case-insensitively instead of by real item/PO linkage —
// a second, divergent way to credit stock alongside GRN Entry's real
// PO-linked path and General Procurement's real walk-in path. This is
// now a real read view of actual GRN records, with both "Create GRN"
// actions pointing at the one real screen for each case.
const loadGRNs = (): any[] => {
  seedMaterialReceiveImport();
  try {
    const raw = localStorage.getItem("cleancar_grn_records");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export function GoodsReceipt() {
  const [grns] = useState<any[]>(loadGRNs);

  const statusColor: Record<string, string> = {
    "Accepted":           "bg-green-100 text-green-800",
    "Partially Accepted": "bg-yellow-100 text-yellow-800",
    "Rejected":           "bg-red-100 text-red-800",
    "Pending":            "bg-gray-100 text-gray-700",
  };

  const statusIcon = (s: string) =>
    s === "Accepted" ? <CheckCircle className="w-3.5 h-3.5" /> :
    s === "Rejected"  ? <XCircle     className="w-3.5 h-3.5" /> :
                        <Clock       className="w-3.5 h-3.5" />;

  const totalAccepted = grns.reduce((s, g) => s + (g.totalAccepted ?? 0), 0);
  const totalRejected = grns.reduce((s, g) => s + (g.totalRejected ?? 0), 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Goods Receipt (GRN)</h2>
          <p className="text-sm text-gray-500 mt-1">
            History of received deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/store-manager/grn-entry">
            <Button size="sm">
              <Truck className="w-4 h-4 mr-2" />
              Record GRN against a PO
            </Button>
          </Link>
          <Link to="/store-manager/procurement">
            <Button size="sm" variant="outline">
              <PackagePlus className="w-4 h-4 mr-2" />
              Receive without a PO
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{grns.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total GRNs</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{totalAccepted}</p>
          <p className="text-xs text-gray-500 mt-1">Units Accepted</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{totalRejected}</p>
          <p className="text-xs text-gray-500 mt-1">Units Rejected</p>
        </div>
      </div>

      {/* GRN List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">GRN Records</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {grns.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No GRN records yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Use <strong>Record GRN against a PO</strong> or <strong>Receive without a PO</strong> above to record your first delivery
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {grns.map((grn: any) => (
                <div
                  key={grn.grnNumber}
                  className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{grn.grnNumber}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {grn.supplierName ?? "—"} · {grn.challanNumber ?? "—"} · {grn.grnDate ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {grn.items?.length ?? 0} item{(grn.items?.length ?? 0) !== 1 ? "s" : ""}
                        {grn.deliveryPerson ? ` · ${grn.deliveryPerson}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right text-xs text-gray-500 hidden sm:block">
                      <p>Accepted: <span className="font-medium text-green-700">{grn.totalAccepted ?? 0}</span></p>
                      <p>Rejected: <span className="font-medium text-red-600">{grn.totalRejected ?? 0}</span></p>
                    </div>
                    <Badge className={`flex items-center gap-1 text-xs ${statusColor[grn.status] ?? statusColor["Pending"]}`}>
                      {statusIcon(grn.status ?? "Pending")}
                      <span className="hidden sm:inline">{grn.status ?? "Pending"}</span>
                    </Badge>
                    {grn.deliveryNoteFileBase64 && (
                      <a
                        href={grn.deliveryNoteFileBase64}
                        download={grn.deliveryNoteFileName || `${grn.grnNumber}-delivery-note`}
                        className="text-xs text-blue-600 underline shrink-0"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Note
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
