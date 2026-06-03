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

// Mock ledger data for a washer
const ledgerTransactions = [
  {
    id: 1,
    date: "2026-03-01",
    type: "Opening Balance",
    quantityIn: 50,
    quantityOut: 0,
    runningBalance: 50,
    reference: "Feb 2026 Carry-Forward"
  },
  {
    id: 2,
    date: "2026-03-01",
    type: "Issued",
    quantityIn: 500,
    quantityOut: 0,
    runningBalance: 550,
    reference: "ISS-2026-03-001"
  },
  {
    id: 3,
    date: "2026-03-01",
    type: "Consumed — Estimated",
    quantityIn: 0,
    quantityOut: 120,
    runningBalance: 430,
    reference: "8 jobs completed"
  },
  {
    id: 4,
    date: "2026-03-02",
    type: "Consumed — Estimated",
    quantityIn: 0,
    quantityOut: 135,
    runningBalance: 295,
    reference: "9 jobs completed"
  },
  {
    id: 5,
    date: "2026-03-03",
    type: "Consumed — Estimated",
    quantityIn: 0,
    quantityOut: 105,
    runningBalance: 190,
    reference: "7 jobs completed"
  },
  {
    id: 6,
    date: "2026-03-15",
    type: "Issued",
    quantityIn: 500,
    quantityOut: 0,
    runningBalance: 690,
    reference: "ISS-2026-03-015"
  },
  {
    id: 7,
    date: "2026-03-15",
    type: "Consumed — Estimated",
    quantityIn: 0,
    quantityOut: 150,
    runningBalance: 540,
    reference: "10 jobs completed"
  },
  {
    id: 8,
    date: "2026-03-16",
    type: "Consumed — Estimated",
    quantityIn: 0,
    quantityOut: 120,
    runningBalance: 420,
    reference: "8 jobs completed"
  },
  {
    id: 9,
    date: "2026-03-17",
    type: "Consumed — Estimated",
    quantityIn: 0,
    quantityOut: 135,
    runningBalance: 285,
    reference: "9 jobs completed (today)"
  },
];

const washerInfo = {
  name: "Ramesh Kumar",
  pinCode: "395005",
  zone: "Adajan",
  employeeId: "EMP-1024"
};

export function WasherStockLedger() {
  const { stockTransactions, getWasherStock, inventory } = useInventory();
  const { city } = useCity();
  const [searchParams] = useSearchParams();
  const selectedWasherId = searchParams.get("washerId") || "";
  const [selectedMaterial, setSelectedMaterial] = useState("shampoo");

  // Build ledger from real stock transactions
  const washerTxns = stockTransactions
    .filter(t => (t.toId === selectedWasherId || t.fromId === selectedWasherId) && t.status === "Completed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let runningBalance = 0;
  const liveLedger = washerTxns.map((t, i) => {
    const item = inventory.find(x => x.itemId === t.itemId && x.cityId === city);
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
    };
  });

  const displayLedger = liveLedger.length > 0 ? liveLedger : ledgerTransactions;

  // Calculate summary
  const totalIssued = displayLedger
    .filter(t => t.type === "Issue" || t.type === "Issued")
    .reduce((sum, t) => sum + t.quantityIn, 0);

  const totalConsumed = displayLedger
    .filter(t => t.type.includes("Consumed"))
    .reduce((sum, t) => sum + t.quantityOut, 0);

  const currentBalance = displayLedger[displayLedger.length - 1]?.runningBalance || 0;
  const openingBalance = displayLedger[0]?.quantityIn || 0;

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
                <SelectItem value="shampoo">Car Shampoo (ml)</SelectItem>
                <SelectItem value="wax">Wax Polish (ml)</SelectItem>
                <SelectItem value="tyre">Tyre Dressing (ml)</SelectItem>
                <SelectItem value="microfiber">Microfiber Cloth (pieces)</SelectItem>
                <SelectItem value="all">All Materials — Grouped View</SelectItem>
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
                <p className="text-xs text-gray-500 mt-1">ml</p>
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
                <p className="text-xs text-gray-500 mt-1">ml</p>
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
                <p className="text-sm text-gray-500">Consumed (Estimated)</p>
                <p className="text-2xl font-bold text-red-600">{totalConsumed}</p>
                <p className="text-xs text-gray-500 mt-1">ml</p>
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
                <p className="text-xs text-gray-500 mt-1">ml (Estimated)</p>
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
                  Running balance is below 100ml. Estimated 2 days remaining at current usage rate.
                  Supervisor has been notified for replenishment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Ledger — Car Shampoo</CardTitle>
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
              {displayLedger.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm">{txn.date}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        txn.type === "Issued" ? "default" :
                        txn.type === "Opening Balance" ? "secondary" :
                        txn.type.includes("Consumed") ? "outline" : "default"
                      }
                      className={
                        txn.type.includes("Estimated") ? "border-amber-300 text-amber-700" : ""
                      }
                    >
                      {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {txn.quantityIn > 0 ? `+${txn.quantityIn} ml` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">
                    {txn.quantityOut > 0 ? `−${txn.quantityOut} ml` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {txn.runningBalance} ml
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
            <li><strong>Opening Balance:</strong> Starting stock at period beginning (carry-forward from previous month)</li>
            <li><strong>Issued:</strong> Material issued from inventory to washer</li>
            <li><strong>Consumed — Estimated:</strong> Auto-calculated daily consumption based on jobs completed (standard usage rates)</li>
            <li><strong>Consumed — Verified:</strong> Actual consumption verified during month-end physical count</li>
            <li><strong>Closing Balance:</strong> End-of-period stock (becomes next period's opening balance)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
