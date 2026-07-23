import { BackButton } from "../ui/back-button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Package,
  Plus,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  Search,
  Filter,
  Calendar,
  TrendingDown,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { useInventory } from "../../contexts/InventoryContext";
import { isRawConcentrateItem } from "../../services/dilutionRecipeService";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useRole } from "../../contexts/RoleContext";

// Mock data for washers with stock in hand
const washersData = [
  { 
    id: 1, 
    name: "Ramesh Kumar", 
    pinCode: "395005", 
    zone: "Adajan",
    stockInHand: {
      shampoo: 220,
      wax: 180,
      tyreDressing: 150,
      microfiber: 8
    }
  },
  { 
    id: 2, 
    name: "Sunil Yadav", 
    pinCode: "395006", 
    zone: "Vesu",
    stockInHand: {
      shampoo: 450,
      wax: 200,
      tyreDressing: 180,
      microfiber: 12
    }
  },
  { 
    id: 3, 
    name: "Dinesh Patel", 
    pinCode: "395009", 
    zone: "Jahangirpura",
    stockInHand: {
      shampoo: 80,
      wax: 50,
      tyreDressing: 60,
      microfiber: 4
    }
  },
];

// Materials master data
const materialsData = [
  { id: 1, name: "Car Shampoo", unit: "ml", costPerUnit: 0.8, reorderLevel: 5000 },
  { id: 2, name: "Wax Polish", unit: "ml", costPerUnit: 1.2, reorderLevel: 3000 },
  { id: 3, name: "Tyre Dressing", unit: "ml", costPerUnit: 0.9, reorderLevel: 2000 },
  { id: 4, name: "Microfiber Cloth", unit: "pieces", costPerUnit: 45, reorderLevel: 50 },
  { id: 5, name: "Dashboard Polish", unit: "ml", costPerUnit: 1.0, reorderLevel: 1500 },
  { id: 6, name: "Glass Cleaner", unit: "ml", costPerUnit: 0.7, reorderLevel: 2000 },
];

// Issuance records
const issuanceRecords = [
  {
    id: 1,
    date: "2026-03-15",
    washer: "Ramesh Kumar",
    pinCode: "395005",
    zone: "Adajan",
    material: "Car Shampoo",
    quantity: 500,
    unit: "ml",
    issuedBy: "Rajesh Sharma (Supervisor)",
    reason: "Scheduled Monthly Issue",
    batch: "SHMP-2026-03-A"
  },
  {
    id: 2,
    date: "2026-03-15",
    washer: "Sunil Yadav",
    pinCode: "395006",
    zone: "Vesu",
    material: "Car Shampoo",
    quantity: 500,
    unit: "ml",
    issuedBy: "Rajesh Sharma (Supervisor)",
    reason: "Scheduled Monthly Issue",
    batch: "SHMP-2026-03-A"
  },
  {
    id: 3,
    date: "2026-03-10",
    washer: "Dinesh Patel",
    pinCode: "395009",
    zone: "Jahangirpura",
    material: "Wax Polish",
    quantity: 250,
    unit: "ml",
    issuedBy: "Vijay Singh (Supervisor)",
    reason: "Replacement for Consumed",
    batch: "WAX-2026-03-B"
  },
  {
    id: 4,
    date: "2026-03-01",
    washer: "Ramesh Kumar",
    pinCode: "395005",
    zone: "Adajan",
    material: "Microfiber Cloth",
    quantity: 10,
    unit: "pieces",
    issuedBy: "Store Manager",
    reason: "Scheduled Monthly Issue",
    batch: "MFC-2026-03"
  },
];

export function WasherIssuances() {
  const { getCentralStock, getSupervisorStock, getWasherStock,
          issueInventory, stockTransactions, inventory } = useInventory();
  const { city } = useCity();
  const { employees } = useEmployee();
  const { currentUser } = useRole();

  // Get washers from EmployeeContext for this city
  const washers = employees.filter((e: any) =>
    e.designation === "Car Washer" && e.status === "Active" &&
    (e.workLocation === city || e.cityId === city)
  ).map((e: any) => ({
    id: e.id,
    name: e.fullName,
    pinCode: e.pinCodes?.[0] || "",
    zone: e.pinCodes?.[0] || "Unknown",
    stockInHand: getWasherStock(e.id, city)
      .reduce((s: number, i: any) => s + (i.washerStock[e.id] || 0), 0),
    lastIssuance: stockTransactions
      .filter((t: any) => t.toId === e.id && t.type === "Issue")
      .sort((a: any,b: any) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt || "Never",
  }));

  // Previously fell back to fake washer data when the real employee list
  // was empty, which would show fabricated stock-in-hand figures for
  // people who don't exist. An empty list is the honest state.
  const displayWashers = washers;

  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showBulkIssueDialog, setShowBulkIssueDialog] = useState(false);
  const [selectedWasher, setSelectedWasher] = useState<typeof washersData[0] | null>(null);
  const [issueWasherId, setIssueWasherId] = useState("");
  const [issueItemId, setIssueItemId] = useState("");
  const [issueQuantity, setIssueQuantity] = useState("");
  const [issueReason, setIssueReason] = useState("");

  const handleSingleIssue = () => {
    if (!issueWasherId || !issueItemId || !issueQuantity) {
      toast.error("Select a washer, material, and quantity");
      return;
    }
    const qty = parseFloat(issueQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    // Real issue - previously this button never actually called
    // issueInventory() at all, only showed a success message. Now it
    // genuinely moves real stock from Central to this washer.
    issueInventory(issueItemId, qty, "Washer", issueWasherId, currentUser?.name || "Supervisor", city);
    toast.success("Material issued successfully to washer");
    setShowIssueDialog(false);
    setIssueWasherId(""); setIssueItemId(""); setIssueQuantity(""); setIssueReason("");
  };

  const [bulkQuantities, setBulkQuantities] = useState<Record<string, string>>({});
  const bulkKey = (itemId: string, washerId: string) => `${itemId}::${washerId}`;

  const handleBulkIssue = () => {
    const entries = Object.entries(bulkQuantities).filter(([, qty]) => qty && parseFloat(qty) > 0);
    if (entries.length === 0) {
      toast.error("Enter at least one quantity to issue");
      return;
    }
    let issuedCount = 0;
    entries.forEach(([key, qty]) => {
      const [itemId, washerId] = key.split("::");
      issueInventory(itemId, parseFloat(qty), "Washer", washerId, currentUser?.name || "Supervisor", city);
      issuedCount++;
    });
    toast.success(`${issuedCount} material${issuedCount !== 1 ? "s" : ""} issued to washers`);
    setShowBulkIssueDialog(false);
    setBulkQuantities({});
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Washer Material Issuances</h1>
          <p className="text-sm text-gray-500 mt-1">
            Issue materials to washers, track consumption, and manage stock
          </p>
        </div>
        <Link to="/inventory">
          <Button variant="outline" size="sm">
            <Package className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="issuances" className="space-y-6">
        <TabsList>
          <TabsTrigger value="issuances">Issuance Records</TabsTrigger>
          <TabsTrigger value="verification">Month-End Verification</TabsTrigger>
          <TabsTrigger value="loss-wastage">Loss & Wastage</TabsTrigger>
        </TabsList>

        {/* Issuance Records Tab */}
        <TabsContent value="issuances" className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => setShowIssueDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Issue Materials
            </Button>
            <Button variant="outline" onClick={() => setShowBulkIssueDialog(true)}>
              <Users className="w-4 h-4 mr-2" />
              Bulk Issue
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Washer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Washers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Washers</SelectItem>
                      {displayWashers.map((w: any) => (
                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Materials" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Materials</SelectItem>
                      {materialsData.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>PIN Code Zone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      <SelectItem value="395005">395005 — Adajan</SelectItem>
                      <SelectItem value="395006">395006 — Vesu</SelectItem>
                      <SelectItem value="395009">395009 — Jahangirpura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input type="date" defaultValue="2026-03-17" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issuance Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Issuance Records</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[900px] sm:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Washer</TableHead>
                        <TableHead>PIN Code Zone</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Issued By</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Batch Ref</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {issuanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="font-medium">{record.washer}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {record.pinCode}
                        </code>
                        <span className="text-xs text-gray-500 ml-2">{record.zone}</span>
                      </TableCell>
                      <TableCell>{record.material}</TableCell>
                      <TableCell className="text-right">
                        {record.quantity} {record.unit}
                      </TableCell>
                      <TableCell className="text-sm">{record.issuedBy}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {record.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{record.batch}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const washer = displayWashers.find((w: any) => w.name === record.washer);
                            if (washer) setSelectedWasher(washer);
                          }}
                        >
                          View Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Month-End Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Link to="/inventory/month-end-verification">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Month-End Stock Verification</h3>
                      <p className="text-sm text-gray-500">
                        Conduct physical stock count and verify consumption
                      </p>
                    </div>
                  </div>
                  <Button>
                    Start Verification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Verification Status - {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
                  const realVerifications: any[] = JSON.parse(localStorage.getItem("cleancar_month_end_verifications") || "[]");
                  return displayWashers.map((washer: any) => {
                    const isVerified = realVerifications.some((v: any) => v.washerId === washer.id.toString() && v.month === currentMonth);
                    return (
                      <div key={washer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {isVerified ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                          )}
                          <div>
                            <p className="font-medium">{washer.name}</p>
                            <p className="text-sm text-gray-500">
                              {washer.pinCode} — {washer.zone}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge variant={isVerified ? "secondary" : "default"}>
                            {isVerified ? "Verified" : "Pending"}
                          </Badge>
                          {!isVerified && (
                            <Link to="/inventory/month-end-verification">
                              <Button size="sm">Verify</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loss & Wastage Tab */}
        <TabsContent value="loss-wastage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Material Loss & Wastage Register
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[900px] sm:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Washer</TableHead>
                        <TableHead>PIN Zone</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Expected</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Value (₹)</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const realVerifications: any[] = JSON.parse(localStorage.getItem("cleancar_month_end_verifications") || "[]");
                    const rows: any[] = [];
                    realVerifications.forEach((v: any) => {
                      const washer = displayWashers.find((w: any) => w.id.toString() === v.washerId);
                      (v.items || []).forEach((item: any) => {
                        if (!item.variance || item.variance === 0) return;
                        const expected = (item.physicalCount || 0) + item.variance;
                        const invItem = inventory.find((i: any) => i.itemName === item.itemName && i.cityId === city);
                        const value = invItem ? Math.abs(item.variance) * invItem.unitCost : undefined;
                        rows.push({
                          key: `${v.id}-${item.itemName}`,
                          month: v.month,
                          washerName: washer?.name || v.washerId,
                          pinZone: washer?.pinCode || "—",
                          material: item.itemName,
                          expected,
                          actual: item.physicalCount,
                          variance: item.variance,
                          value,
                          reason: item.varianceReason,
                          hasEvidence: !!item.varianceEvidenceBase64,
                        });
                      });
                    });
                    if (rows.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-sm text-gray-400 py-8">
                            No material loss or wastage recorded yet.
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return rows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell>{row.washerName}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{row.pinZone}</code>
                        </TableCell>
                        <TableCell>{row.material}</TableCell>
                        <TableCell className="text-right">{row.expected}</TableCell>
                        <TableCell className="text-right">{row.actual}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{row.variance > 0 ? "+" : ""}{row.variance}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">{row.value !== undefined ? `₹${row.value.toLocaleString()}` : "—"}</TableCell>
                        <TableCell>
                          {row.reason ? <Badge variant="outline" className="text-xs">{row.reason}</Badge> : <span className="text-xs text-gray-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.hasEvidence ? "secondary" : "default"}>{row.hasEvidence ? "Documented" : "No Evidence"}</Badge>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Single Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Materials to Washer</DialogTitle>
            <DialogDescription>
              Issue materials from inventory to a field washer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Washer *</Label>
                <Select value={issueWasherId} onValueChange={setIssueWasherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select washer" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayWashers.map((w: any) => (
                      <SelectItem key={w.id} value={w.id.toString()}>
                        <div className="flex flex-col">
                          <span>{w.name}</span>
                          <span className="text-xs text-gray-500">
                            {w.pinCode} — {w.zone}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input type="date" defaultValue="2026-03-17" />
              </div>

              <div className="space-y-2">
                <Label>PIN Code Zone *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-filled from washer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="395005">395005 — Adajan</SelectItem>
                    <SelectItem value="395006">395006 — Vesu</SelectItem>
                    <SelectItem value="395009">395009 — Jahangirpura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Material / Item *</Label>
                <Select value={issueItemId} onValueChange={setIssueItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.filter((i: any) => i.cityId === city && !isRawConcentrateItem(i)).map((i: any) => (
                      <SelectItem key={i.itemId} value={i.itemId}>
                        {i.itemName} ({i.unit}) — {i.centralStock} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity Issued *</Label>
                <Input type="number" placeholder="0" value={issueQuantity} onChange={(e) => setIssueQuantity(e.target.value)} />
                <p className="text-xs text-gray-500">Unit matches the selected material</p>
              </div>

              <div className="space-y-2">
                <Label>Batch / Lot Reference</Label>
                <Input placeholder="e.g., SHMP-2026-03-A" />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Reason *</Label>
                <Select value={issueReason} onValueChange={setIssueReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled Monthly Issue</SelectItem>
                    <SelectItem value="replacement">Replacement for Consumed</SelectItem>
                    <SelectItem value="damaged">Replacement for Damaged or Lost</SelectItem>
                    <SelectItem value="starter">New Washer Starter Kit</SelectItem>
                    <SelectItem value="emergency">Emergency Replenishment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Remarks</Label>
                <Textarea placeholder="Optional notes..." rows={2} />
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <p className="text-sm text-blue-900">
                  <strong>Issued By:</strong> {currentUser?.name || "Supervisor"} — Auto-filled
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSingleIssue}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Issue Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Issue Dialog */}
      <Dialog open={showBulkIssueDialog} onOpenChange={setShowBulkIssueDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Material Issue</DialogTitle>
            <DialogDescription>
              Issue multiple materials to multiple washers in one transaction
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Enter quantities in the grid below. Leave blank if not issuing to that washer.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 border text-left text-sm font-semibold">Material</th>
                    {displayWashers.map((w: any) => (
                      <th key={w.id} className="p-2 border text-center text-sm font-semibold">
                        {w.name}
                        <br />
                        <span className="text-xs font-normal text-gray-500">{w.pinCode}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.filter((i: any) => i.cityId === city && !isRawConcentrateItem(i)).slice(0, 4).map((material: any) => (
                    <tr key={material.itemId}>
                      <td className="p-2 border text-sm font-medium">
                        {material.itemName}
                        <br />
                        <span className="text-xs text-gray-500">({material.unit})</span>
                      </td>
                      {displayWashers.map((w: any) => (
                        <td key={w.id} className="p-2 border">
                          <Input
                            type="number"
                            placeholder="—"
                            className="w-24 text-center"
                            value={bulkQuantities[bulkKey(material.itemId, w.id.toString())] || ""}
                            onChange={(e) => setBulkQuantities(prev => ({ ...prev, [bulkKey(material.itemId, w.id.toString())]: e.target.value }))}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkIssueDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkIssue}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Issue All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WasherIssuances;
