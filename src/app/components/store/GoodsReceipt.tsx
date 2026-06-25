import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plus, Truck, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { GRNCreationDialog } from "./GRNCreationDialog";
import { DataService } from "../../services/DataService";

// Load existing GRN records from localStorage
const loadGRNs = (): any[] => {
  try {
    const raw = localStorage.getItem("cleancar_grn_records");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export function GoodsReceipt() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [grns, setGrns] = useState<any[]>(loadGRNs);

  const handleClose = () => {
    setDialogOpen(false);
    // Reload GRNs in case the dialog saved one
    setGrns(loadGRNs());
  };

  const statusColor: Record<string, string> = {
    "Accepted":          "bg-green-100 text-green-800",
    "Partially Accepted":"bg-yellow-100 text-yellow-800",
    "Rejected":          "bg-red-100 text-red-800",
    "Pending":           "bg-gray-100 text-gray-700",
  };

  const statusIcon = (s: string) =>
    s === "Accepted" ? <CheckCircle className="w-3.5 h-3.5" /> :
    s === "Rejected"  ? <XCircle    className="w-3.5 h-3.5" /> :
                        <Clock      className="w-3.5 h-3.5" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Goods Receipt (GRN)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Receive materials and equipment — create GRN records
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create GRN
        </Button>
      </div>

      {/* Pending Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Pending Deliveries</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {grns.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No GRN records yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click <strong>Create GRN</strong> to receive your first delivery
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {grns.map((grn: any) => (
                <div key={grn.grnNumber} className="flex items-center justify-between border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{grn.grnNumber}</p>
                      <p className="text-xs text-gray-500">
                        {grn.supplierName ?? "—"} · {grn.challanNumber} · {grn.grnDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-gray-500">
                      <p>Accepted: <span className="font-medium text-green-700">{grn.totalAccepted ?? 0}</span></p>
                      <p>Rejected: <span className="font-medium text-red-600">{grn.totalRejected ?? 0}</span></p>
                    </div>
                    <Badge className={`flex items-center gap-1 ${statusColor[grn.status] ?? statusColor["Pending"]}`}>
                      {statusIcon(grn.status ?? "Pending")}
                      {grn.status ?? "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GRN Creation Dialog */}
      <GRNCreationDialog
        open={dialogOpen}
        onClose={handleClose}
      />
    </div>
  );
}
