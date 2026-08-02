import { BackButton } from "../ui/back-button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, FileText } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";

export function WasherStockLedger() {
  const { stockTransactions, getWasherStock, inventory } = useInventory();
  const { getEmployeeById } = useEmployee();
  const { city } = useCity();
  const [searchParams] = useSearchParams();
  const selectedWasherId = searchParams.get("washerId") || "";

  // Real fix: previously a fake hardcoded list ("shampoo"/"wax"/"tyre"/
  // "microfiber") that was never actually used to filter anything below —
  // selecting a material here changed nothing. Now built from real
  // inventory items and genuinely filters the ledger.
  const cityItems = inventory.filter((i: any) => i.cityId === city);
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const selectedItem = selectedMaterial !== "all" ? cityItems.find((i: any) => i.itemId === selectedMaterial) : undefined;

  // Previously this header always showed a hardcoded "Ramesh Kumar" no
  // matter which washer was actually selected — the ledger transactions
  // below it were correctly filtered by the real selected washer, but the
  // name/ID at the top never matched. Now derived from the real employee
  // record for whichever washer is actually selected.
  const selectedEmployee = selectedWasherId ? getEmployeeById(selectedWasherId) : undefined;
  const washerInfo = {
    name: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "Select a washer",
    pinCode: selectedEmployee?.assignedPincodes?.[0] || "—",
    zone: selectedEmployee?.clusterId || "—",
    employeeId: selectedWasherId || "—",
  };

  // Build ledger from real stock transactions
  const washerTxns = stockTransactions
    .filter((t: any) => (t.toId === selectedWasherId || t.fromId === selectedWasherId) && t.status === "Completed")
    .filter((t: any) => selectedMaterial === "all" || t.itemId === selectedMaterial)
    .sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt));

  let runningBalance = 0;
  const liveLedger = washerTxns.map((t: any, i: number) => {
    const item = inventory.find((x: any) => x.itemId === t.itemId && x.cityId === city);
    const isIn = t.toId === selectedWasherId;
    runningBalance += isIn ? t.quantity : -t.quantity;
    return {
      id: i + 1,
      date: t.createdAt.split("T")[0],
      type: t.type,
      quantityIn:  isIn ? t.quantity : 0,
      quantityOut: isIn ? 0 : t.quantity,
      runningBalance,
      reference: t.transactionId,
      itemName: item?.itemName || t.itemId,
      unit: item?.unit || "",
    };
  });

  // Previously fell back to fake ledger entries when the real store was
  // empty for this washer, which would show fabricated stock movements.
  const displayLedger = liveLedger;

  // Calculate summary
  const totalIssued = displayLedger
    .filter((t: any) => t.type === "Issue")
    .reduce((sum: number, t: any) => sum + t.quantityIn, 0);

  // Real transaction types are Procurement/Issue/Transfer/Adjustment/Return/Loss —
  // there is no "Consumed" transaction type in this system, so this now tracks
  // real Loss/Adjustment outflows instead of a type that could never match.
  const totalConsumed = displayLedger
    .filter((t: any) => t.type === "Loss" || t.type === "Adjustment")
    .reduce((sum: number, t: any) => sum + t.quantityOut, 0);

  const currentBalance = displayLedger[displayLedger.length - 1]?.runningBalance || 0;
  const openingBalance = displayLedger[0]?.quantityIn || 0;
  const unitLabel = selectedItem ? selectedItem.unit : "mixed units";

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link to="/inventory/washer-issuances">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Washer Stock Ledger</h1>
              <p className="text-sm text-gray-500 mt-1">
                {washerInfo.name} — {washerInfo.pinCode} ({washerInfo.zone}) — {washerInfo.employeeId}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Download Ledger
        </Button>
      </div>

      {/* Material Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium">Material:</label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials — Grouped View</SelectItem>
                {cityItems.map((i: any) => (
                  <SelectItem key={i.itemId} value={i.itemId}>{i.itemName} ({i.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Opening Balance</p>
                <p className="text-2xl font-bold text-gray-900">{openingBalance}</p>
                <p className="text-xs text-gray-500 mt-1">{unitLabel}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Issued (MTD)</p>
                <p className="text-2xl font-bold text-green-600">{totalIssued}</p>
                <p className="text-xs text-gray-500 mt-1">{unitLabel}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Adjustments / Loss</p>
                <p className="text-2xl font-bold text-red-600">{totalConsumed}</p>
                <p className="text-xs text-gray-500 mt-1">{unitLabel}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{currentBalance}</p>
                <p className="text-xs text-gray-500 mt-1">{unitLabel} (Estimated)</p>
              </div>
              <div className={`w-10 h-10 ${currentBalance < 100 ? 'bg-amber-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                {currentBalance < 100 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {currentBalance < 100 && (
        <Card className="bg-amber-50 border-amber-300">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Low Stock Alert</p>
                <p className="text-sm text-amber-700">
                  Running balance is below 100 {unitLabel}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Ledger — {selectedItem ? selectedItem.itemName : "All Materials"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[700px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead className="text-right">Quantity In (+)</TableHead>
                    <TableHead className="text-right">Quantity Out (−)</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {displayLedger.map((txn: any) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm">{txn.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        txn.type === "Issue" ? "default" :
                        txn.type === "Loss" || txn.type === "Adjustment" ? "outline" : "secondary"
                      }
                      className={
                        txn.type === "Loss" ? "border-amber-300 text-amber-700" : ""
                      }
                    >
                      {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {txn.quantityIn > 0 ? `+${txn.quantityIn} ${txn.unit}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">
                    {txn.quantityOut > 0 ? `−${txn.quantityOut} ${txn.unit}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {txn.runningBalance} {selectedItem ? selectedItem.unit : txn.unit}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{txn.reference}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Type Legend */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Transaction Types Explained:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Issue:</strong> Material issued from central inventory to this washer</li>
            <li><strong>Transfer:</strong> Stock moved between locations (e.g. washer to washer)</li>
            <li><strong>Return:</strong> Material returned by the washer to inventory</li>
            <li><strong>Adjustment:</strong> Manual stock correction</li>
            <li><strong>Loss:</strong> Stock written off as lost or damaged</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default WasherStockLedger;
