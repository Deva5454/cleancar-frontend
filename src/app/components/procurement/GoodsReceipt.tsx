import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Truck, FileText, CheckCircle, XCircle, Clock, PackagePlus } from "lucide-react";
import { Link } from "react-router-dom";

// ✅ FIX: this screen used to fake the entire GRN-creation flow — a
// hardcoded fallback PO list when none existed, and a "Create GRN"
// action that always recorded totalAccepted: 50 regardless of what
// was actually on the PO, then flipped the PO straight to "Delivered"
// with no partial-receipt handling — never calling procureInventory,
// so no real stock was ever credited. This is now a real read view of
// actual GRN records (the same "cleancar_grn_records" GRN Entry
// writes to), with "Create GRN" pointing at the one screen that
// genuinely receives against a PO and updates real central stock.
const loadGRNs = (): any[] => {
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Goods Receipt Notes (GRN)</h2>
          <p className="text-sm text-gray-500 mt-1">History of received deliveries against Purchase Orders</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{grns.length}</p>
            <p className="text-xs text-gray-500">Total GRNs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{totalAccepted}</p>
            <p className="text-xs text-gray-500">Units Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{totalRejected}</p>
            <p className="text-xs text-gray-500">Units Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GRN Records</CardTitle>
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
            <div className="space-y-3">
              {grns.map((grn: any) => (
                <div key={grn.grnNumber} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{grn.grnNumber}</p>
                        <Badge className={`flex items-center gap-1 ${statusColor[grn.status] ?? statusColor["Pending"]}`}>
                          {statusIcon(grn.status ?? "Pending")}
                          {grn.status ?? "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{grn.supplierName ?? "Unknown supplier"}</span>
                        <span>•</span>
                        <span>Challan: {grn.challanNumber ?? "—"}</span>
                        <span>•</span>
                        <span>{grn.items?.length ?? 0} items</span>
                        <span>•</span>
                        <span>{grn.grnDate ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Accepted: <span className="font-medium text-green-700">{grn.totalAccepted ?? 0}</span></p>
                    <p>Rejected: <span className="font-medium text-red-600">{grn.totalRejected ?? 0}</span></p>
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
