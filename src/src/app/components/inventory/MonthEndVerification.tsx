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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Textarea } from "../ui/textarea";
import { ArrowLeft, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { useCity } from "../../contexts/CityContext";
import { useInventory } from "../../contexts/InventoryContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useEffect } from "react";

// Mock verification data
const verificationWorksheet = [
  {
    itemId: "ITEM-SHAMPOO",
    itemName: "Car Shampoo",
    material: "Car Shampoo",
    unit: "ml",
    openingBalance: 50,
    totalIssued: 1000,
    estimatedConsumption: 800,
    systemEstimatedClosing: 250,
    physicalCount: 0,
    variance: 0,
    varianceReason: "",
    verifiedConsumption: 0
  },
  {
    itemId: "ITEM-WAX",
    itemName: "Wax Polish",
    material: "Wax Polish",
    unit: "ml",
    openingBalance: 100,
    totalIssued: 500,
    estimatedConsumption: 420,
    systemEstimatedClosing: 180,
    physicalCount: 0,
    variance: 0,
    varianceReason: "",
    verifiedConsumption: 0
  },
  {
    itemId: "ITEM-TYRE",
    itemName: "Tyre Dressing",
    material: "Tyre Dressing",
    unit: "ml",
    openingBalance: 75,
    totalIssued: 250,
    estimatedConsumption: 175,
    systemEstimatedClosing: 150,
    physicalCount: 0,
    variance: 0,
    varianceReason: "",
    verifiedConsumption: 0
  },
  {
    itemId: "ITEM-MICROFIBER",
    itemName: "Microfiber Cloth",
    material: "Microfiber Cloth",
    unit: "pieces",
    openingBalance: 2,
    totalIssued: 10,
    estimatedConsumption: 4,
    systemEstimatedClosing: 8,
    physicalCount: 0,
    variance: 0,
    varianceReason: "",
    verifiedConsumption: 0
  },
];

export function MonthEndVerification() {
  const { city } = useCity();
  const { adjustStock, getWasherStock, inventory } = useInventory();
  const { employees } = useEmployee();
  const [selectedWasherId, setSelectedWasherId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [worksheetData, setWorksheetData] = useState(verificationWorksheet);
  const [showWorksheet, setShowWorksheet] = useState(false);

  const washers = employees.filter(e =>
    e.designation === "Car Washer" && e.status === "Active" &&
    (e.workLocation === city || e.cityId === city)
  );

  // Load worksheet when washer + month selected
  useEffect(() => {
    if (!selectedWasherId) return;
    const washerItems = getWasherStock(selectedWasherId, city);
    if (washerItems.length > 0) {
      setWorksheetData(washerItems.map(item => ({
        itemId: item.itemId, itemName: item.itemName, unit: item.unit,
        openingBalance: 0,
        totalIssued: 0,
        estimatedConsumption: 0,
        systemEstimatedClosing: item.washerStock[selectedWasherId] || 0,
        physicalCount: item.washerStock[selectedWasherId] || 0, variance: 0,
        varianceReason: "",
        verifiedConsumption: 0,
      })));
      setShowWorksheet(true);
    }
  }, [selectedWasherId, city, getWasherStock]);

  const handlePhysicalCountChange = (index: number, value: string) => {
    const physicalCount = parseFloat(value) || 0;
    const updatedData = [...worksheetData];
    const row = updatedData[index];
    
    row.physicalCount = physicalCount;
    row.variance = row.systemEstimatedClosing - physicalCount;
    row.verifiedConsumption = row.openingBalance + row.totalIssued - physicalCount;
    
    setWorksheetData(updatedData);
  };

  const handleVarianceReasonChange = (index: number, value: string) => {
    const updatedData = [...worksheetData];
    updatedData[index].varianceReason = value;
    setWorksheetData(updatedData);
  };

  const handleLoadWorksheet = () => {
    if (!selectedWasherId || !selectedMonth) {
      toast.error("Please select washer and month");
      return;
    }
    toast.success("Verification worksheet loaded");
  };

  const handleSubmitVerification = () => {
    // Check if all physical counts are entered
    const missingCounts = worksheetData.filter(row => row.physicalCount === 0);
    if (missingCounts.length > 0) {
      toast.error("Please enter physical count for all materials");
      return;
    }

    // Check if variance reasons are provided for significant variances
    const needReason = worksheetData.filter(
      row => Math.abs(row.variance) > (row.totalIssued * 0.1) && !row.varianceReason
    );
    if (needReason.length > 0) {
      toast.error("Please provide variance reason for materials with >10% variance");
      return;
    }

    // Persist physical count as new stock level
    worksheetData.forEach(row => {
      if ((row as any).itemId) {
        adjustStock(
          (row as any).itemId, "Washer", selectedWasherId,
          row.physicalCount,
          `Month-end verification — ${selectedMonth}`,
          city
        );
      }
    });

    toast.success("Month-end verification completed successfully! Carry-forward posted for next month.");
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to="/inventory/washer-issuances">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Month-End Stock Verification</h1>
            <p className="text-sm text-gray-500 mt-1">
              Conduct physical stock count and verify actual consumption
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">Month-End Verification Process:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Select washer and month to load verification worksheet</li>
                <li>Enter the actual physical count for each material in the washer's possession</li>
                <li>System auto-calculates variance and verified consumption</li>
                <li>Provide variance reason if variance exceeds 10% of period issuance</li>
                <li>Submit to post verified consumption and create carry-forward for next month</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1 — Select Washer and Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Washer</label>
              <Select value={selectedWasherId} onValueChange={setSelectedWasherId}>
                <SelectTrigger><SelectValue placeholder="Choose washer to verify" /></SelectTrigger>
                <SelectContent>
                  {washers.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.fullName} — {w.pinCodes?.[0] || "No zone"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {["January","February","March","April","May","June",
                    "July","August","September","October","November","December"]
                    .map((m, i) => <SelectItem key={i} value={String(i+1)}>{m} 2026</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!selectedWasherId && (
            <div className="text-center py-12 text-gray-400">Select a washer and month to load the verification worksheet.</div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Verification Worksheet */}
      {showWorksheet && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Step 2 — Verification Worksheet</CardTitle>
                <Badge variant="secondary">March 2026 — Ramesh Kumar (395005)</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Issued (MTD)</TableHead>
                      <TableHead className="text-right">Est. Consumption</TableHead>
                      <TableHead className="text-right">System Est. Closing</TableHead>
                      <TableHead className="text-right">Physical Count *</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="min-w-[200px]">Variance Reason</TableHead>
                      <TableHead className="text-right">Verified Consumption</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {worksheetData.map((row, index) => {
                      const variancePct = row.totalIssued > 0 
                        ? (Math.abs(row.variance) / row.totalIssued) * 100 
                        : 0;
                      const needsReason = variancePct > 10;

                      return (
                        <TableRow key={(row as any).itemId || row.material}>
                          <TableCell className="font-medium">{(row as any).itemName || row.material}</TableCell>
                          <TableCell className="text-right">
                            {row.openingBalance} {row.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.totalIssued} {row.unit}
                          </TableCell>
                          <TableCell className="text-right text-amber-600">
                            {row.estimatedConsumption} {row.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {row.systemEstimatedClosing} {row.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              className="w-24 text-right"
                              value={row.physicalCount || ""}
                              onChange={(e) => handlePhysicalCountChange(index, e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {row.physicalCount > 0 ? (
                              <span className={row.variance > 0 ? "text-green-600" : row.variance < 0 ? "text-red-600 font-medium" : ""}>
                                {row.variance > 0 ? "+" : ""}{row.variance} {row.unit}
                                {needsReason && (
                                  <AlertTriangle className="w-4 h-4 text-amber-600 inline ml-1" />
                                )}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            {needsReason && row.physicalCount > 0 ? (
                              <Select 
                                value={row.varianceReason}
                                onValueChange={(value) => handleVarianceReasonChange(index, value)}
                              >
                                <SelectTrigger className="text-xs">
                                  <SelectValue placeholder="Required" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="estimation-error">Estimation Error</SelectItem>
                                  <SelectItem value="jobs-not-in-system">Jobs not in System</SelectItem>
                                  <SelectItem value="spillage">Material Spillage</SelectItem>
                                  <SelectItem value="wastage">Material Wastage</SelectItem>
                                  <SelectItem value="non-job-use">Non-Job Use</SelectItem>
                                  <SelectItem value="suspected-loss">Suspected Loss</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-gray-400">Not required</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            {row.physicalCount > 0 ? `${row.verifiedConsumption} ${row.unit}` : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Carry-Forward Preview */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Carry-Forward Preview — April 2026 Opening Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {worksheetData
                  .filter(row => row.physicalCount > 0)
                  .map(row => (
                    <div key={(row as any).itemId || row.material} className="bg-white p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600">{(row as any).itemName || row.material}</p>
                      <p className="text-lg font-bold text-green-700">
                        {row.physicalCount} {row.unit}
                      </p>
                    </div>
                  ))}
              </div>
              <p className="text-sm text-green-800 mt-3">
                These physical count values will become the opening balance for April 2026 after verification is submitted.
              </p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link to="/inventory/washer-issuances">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmitVerification} size="lg">
              <CheckCircle className="w-5 h-5 mr-2" />
              Submit Verification & Post Carry-Forward
            </Button>
          </div>
        </>
      )}

      {/* Carry-Forward Example */}
      {!showWorksheet && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Carry-Forward Example</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Scenario:</strong> Washer Ramesh is issued 1 bottle of shampoo (500ml) on 1st March and 1 bottle (500ml) on 20th March.
            </p>
            <p>
              <strong>Opening balance at 1st March:</strong> 50ml (leftover from February verified on 28th Feb)
            </p>
            <p>
              <strong>Total available in March:</strong> 50 + 500 + 500 = 1,050ml
            </p>
            <p>
              <strong>System estimates:</strong> 800ml consumed across March jobs
            </p>
            <p>
              <strong>System-estimated closing:</strong> 1,050 − 800 = 250ml
            </p>
            <p className="text-blue-700 font-medium">
              <strong>Supervisor physically counts on 31st March:</strong> Finds 220ml remaining
            </p>
            <p>
              <strong>Verified consumption:</strong> 1,050 − 220 = <span className="font-semibold">830ml</span> (not 1,000ml which would be wrong if we counted both bottles as fully consumed)
            </p>
            <p className="text-green-700 font-medium">
              <strong>April opening balance:</strong> 220ml (this 220ml is available for April jobs before any new issuance is needed)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
