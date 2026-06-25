import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plus, Truck, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { GRNCreationDialog } from "./GRNCreationDialog";

// ── Historic seed data ────────────────────────────────────────────────────────
const HISTORIC_GRNS = [
  {
    grnNumber: "GRN-202605-001",
    grnDate: "2026-05-03",
    challanNumber: "DC-2026-0421",
    vehicleNumber: "GJ-05-AB-1234",
    deliveryPerson: "Ramesh Delivery",
    supplierName: "Hindustan Unilever Ltd",
    status: "Accepted",
    totalAccepted: 150,
    totalRejected: 0,
    createdAt: "2026-05-03T10:30:00.000Z",
    items: [
      { id: 1, itemName: "Car Wash Shampoo 5L",     receivedThisDelivery: 100, acceptedQuantity: 100, rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf A1" },
      { id: 2, itemName: "Microfiber Towel Premium", receivedThisDelivery: 50,  acceptedQuantity: 50,  rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf B2" },
    ],
  },
  {
    grnNumber: "GRN-202605-002",
    grnDate: "2026-05-11",
    challanNumber: "DC-2026-0498",
    vehicleNumber: "GJ-05-CD-5678",
    deliveryPerson: "Sunil Transport",
    supplierName: "3M India Ltd",
    status: "Partially Accepted",
    totalAccepted: 80,
    totalRejected: 20,
    createdAt: "2026-05-11T14:00:00.000Z",
    items: [
      { id: 1, itemName: "Polish Compound 1kg",   receivedThisDelivery: 60, acceptedQuantity: 60, rejectedQuantity: 0,  condition: "Good",    storageLocation: "Shelf C1" },
      { id: 2, itemName: "Wax Applicator Pads",   receivedThisDelivery: 40, acceptedQuantity: 20, rejectedQuantity: 20, condition: "Damaged", storageLocation: "Shelf C2", comments: "20 pads torn on edges" },
    ],
  },
  {
    grnNumber: "GRN-202605-003",
    grnDate: "2026-05-19",
    challanNumber: "DC-2026-0561",
    vehicleNumber: "GJ-06-EF-9012",
    deliveryPerson: "Krishna Logistics",
    supplierName: "Pidilite Industries",
    status: "Accepted",
    totalAccepted: 200,
    totalRejected: 0,
    createdAt: "2026-05-19T09:15:00.000Z",
    items: [
      { id: 1, itemName: "Tyre Dressing 500ml",   receivedThisDelivery: 120, acceptedQuantity: 120, rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf D1" },
      { id: 2, itemName: "Dashboard Polish 250ml", receivedThisDelivery: 80,  acceptedQuantity: 80,  rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf D2" },
    ],
  },
  {
    grnNumber: "GRN-202606-001",
    grnDate: "2026-06-02",
    challanNumber: "DC-2026-0612",
    vehicleNumber: "GJ-05-GH-3456",
    deliveryPerson: "Ramesh Delivery",
    supplierName: "Hindustan Unilever Ltd",
    status: "Accepted",
    totalAccepted: 300,
    totalRejected: 0,
    createdAt: "2026-06-02T11:00:00.000Z",
    items: [
      { id: 1, itemName: "Car Wash Shampoo 5L",     receivedThisDelivery: 150, acceptedQuantity: 150, rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf A1" },
      { id: 2, itemName: "Interior Cleaner Spray",  receivedThisDelivery: 100, acceptedQuantity: 100, rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf A3" },
      { id: 3, itemName: "Glass Cleaner 500ml",     receivedThisDelivery: 50,  acceptedQuantity: 50,  rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf A4" },
    ],
  },
  {
    grnNumber: "GRN-202606-002",
    grnDate: "2026-06-14",
    challanNumber: "DC-2026-0689",
    vehicleNumber: "GJ-06-IJ-7890",
    deliveryPerson: "Sunil Transport",
    supplierName: "Scotch-Brite (3M)",
    status: "Accepted",
    totalAccepted: 240,
    totalRejected: 0,
    createdAt: "2026-06-14T13:30:00.000Z",
    items: [
      { id: 1, itemName: "Scrub Pads (pack of 10)",  receivedThisDelivery: 120, acceptedQuantity: 120, rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf B1" },
      { id: 2, itemName: "Foam Applicator Sponge",   receivedThisDelivery: 120, acceptedQuantity: 120, rejectedQuantity: 0, condition: "Good", storageLocation: "Shelf B3" },
    ],
  },
  {
    grnNumber: "GRN-202606-003",
    grnDate: "2026-06-20",
    challanNumber: "DC-2026-0731",
    vehicleNumber: "GJ-05-KL-2345",
    deliveryPerson: "Krishna Logistics",
    supplierName: "Bosch India",
    status: "Partially Accepted",
    totalAccepted: 8,
    totalRejected: 2,
    createdAt: "2026-06-20T10:00:00.000Z",
    items: [
      { id: 1, itemName: "Pressure Washer Nozzle",  receivedThisDelivery: 6,  acceptedQuantity: 6,  rejectedQuantity: 0, condition: "Good",          storageLocation: "Equipment Rack 1" },
      { id: 2, itemName: "Foam Cannon Attachment",  receivedThisDelivery: 4,  acceptedQuantity: 2,  rejectedQuantity: 2, condition: "Short Expiry",   storageLocation: "Equipment Rack 2", comments: "2 units seal cracked" },
    ],
  },
];

// Seed historic data if not already seeded
const seedGRNs = () => {
  try {
    const existing = localStorage.getItem("cleancar_grn_records");
    if (!existing) {
      localStorage.setItem("cleancar_grn_records", JSON.stringify(HISTORIC_GRNS));
    }
  } catch { /* ignore */ }
};

const loadGRNs = (): any[] => {
  seedGRNs();
  try {
    const raw = localStorage.getItem("cleancar_grn_records");
    return raw ? JSON.parse(raw) : HISTORIC_GRNS;
  } catch { return HISTORIC_GRNS; }
};

// ── Component ─────────────────────────────────────────────────────────────────
export function GoodsReceipt() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [grns, setGrns] = useState<any[]>(loadGRNs);

  const handleClose = () => {
    setDialogOpen(false);
    setGrns(loadGRNs());
  };

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
                Click <strong>Create GRN</strong> to receive your first delivery
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
                        {grn.supplierName ?? "—"} · {grn.challanNumber} · {grn.grnDate}
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
