import { BackButton } from "../ui/back-button";
/**
 * Operations Data Capture - Focus on unit entry, shift timing, and validation
 *
 * NO PAYROLL LOGIC - Pure data capture for operationsEngine
 *
 * @component
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sun,
  Moon,
  Sunset,
  Car,
  Database,
  Calendar,
  MapPin,
  Eye,
} from "lucide-react";
import { useJobs } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";

// Shift Band Configuration
type ShiftBand = "MORNING_WASH" | "DAY_SHIFT_1" | "DAY_SHIFT_2";
type EmployeeShiftEligibility = "PART_TIME_WASHER" | "ALL_STAFF" | "FULL_TIME_WASHER";

interface ShiftBandConfig {
  name: ShiftBand;
  label: string;
  startTime: string;
  endTime: string;
  icon: string;
  color: string;
  eligibleFor: EmployeeShiftEligibility;
  eligibilityLabel: string;
}

const SHIFT_BANDS: ShiftBandConfig[] = [
  {
    name: "MORNING_WASH",
    label: "Morning Wash",
    startTime: "05:00",
    endTime: "09:00",
    icon: "🌅",
    color: "amber",
    eligibleFor: "PART_TIME_WASHER",
    eligibilityLabel: "Part-time washers only"
  },
  {
    name: "DAY_SHIFT_1",
    label: "Day Shift 1",
    startTime: "10:00",
    endTime: "19:00",
    icon: "☀️",
    color: "blue",
    eligibleFor: "ALL_STAFF",
    eligibilityLabel: "All staff"
  },
  {
    name: "DAY_SHIFT_2",
    label: "Day Shift 2",
    startTime: "14:00",
    endTime: "22:00",
    icon: "🌆",
    color: "purple",
    eligibleFor: "FULL_TIME_WASHER",
    eligibilityLabel: "Full-time washers only"
  },
];

// Unit Entry Record
interface UnitEntry {
  id: string;
  washerId: string;
  washerName: string;
  vehicleType: "4W" | "2W" | "ADD-ON";
  customerId: string;
  customerName: string;
  timeIn: string;
  timeOut: string | null;
  shiftBand: ShiftBand;
  location: string;
  validationStatus: "VALID" | "INVALID" | "PENDING";
  validationIssues: string[];
  unitCount: number;
}

// Helper to determine shift band from time
function getShiftBand(time: string): ShiftBand {
  const h = parseInt(time.split(":")[0], 10);
  if (h >= 5 && h < 10) return "MORNING_WASH";
  if (h >= 10 && h < 14) return "DAY_SHIFT_1";
  return "DAY_SHIFT_2";
}

// Helper to validate unit entry
function validateUnitEntry(entry: UnitEntry): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Validation 1: Time In must be present
  if (!entry.timeIn) {
    issues.push("Time In missing");
  }

  // Validation 2: Time Out must be present for completed jobs
  if (entry.timeOut === null) {
    issues.push("Time Out pending");
  }

  // Validation 3: Time Out must be after Time In
  if (entry.timeIn && entry.timeOut) {
    const timeIn = new Date(`2000-01-01T${entry.timeIn}`);
    const timeOut = new Date(`2000-01-01T${entry.timeOut}`);

    if (timeOut <= timeIn) {
      issues.push("Time Out before Time In");
    }
  }

  // Validation 4: Location must be valid
  if (!entry.location || entry.location === "") {
    issues.push("Location missing");
  }

  // Validation 5: Customer ID must be valid
  if (!entry.customerId) {
    issues.push("Customer ID missing");
  }

  // Validation 6: Unit count must be positive
  if (entry.unitCount <= 0) {
    issues.push("Invalid unit count");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function OperationsDataCapture() {
  const { allJobs } = useJobs();
  const { cityId } = useCity();
  const todayStr = new Date().toISOString().split("T")[0];
  const todayJobs = allJobs.filter(j => j.scheduledDate === todayStr && j.cityId === cityId);

  const [units, setUnits] = useState<UnitEntry[]>(todayJobs.map(j => ({
    id: j.jobId, washerId: j.washerId||"", washerName: j.washerName||j.washerId||"",
    vehicleType: j.vehicleType||"4W", customerId: j.customerId, customerName: j.customerName||j.customerId,
    timeIn: j.timeSlot?.split("-")[0]||"08:00", timeOut: null,
    shiftBand: "MORNING_WASH", location: j.area||"", validationStatus: j.status==="Completed"?"VALID":"PENDING",
    validationIssues: j.status!=="Completed"?["Job in progress"]:[], unitCount: j.units||1,
  })));
  const [selectedShiftBand, setSelectedShiftBand] = useState<ShiftBand | "ALL">("ALL");
  const [validationFilter, setValidationFilter] = useState<"ALL" | "VALID" | "INVALID" | "PENDING">("ALL");

  // Calculate stats
  const totalUnits = units.length;
  const validUnits = units.filter(u => u.validationStatus === "VALID").length;
  const invalidUnits = units.filter(u => u.validationStatus === "INVALID").length;
  const pendingUnits = units.filter(u => u.validationStatus === "PENDING").length;

  // Filter units
  const filteredUnits = units.filter(unit => {
    const shiftMatch = selectedShiftBand === "ALL" || unit.shiftBand === selectedShiftBand;
    const validationMatch = validationFilter === "ALL" || unit.validationStatus === validationFilter;
    return shiftMatch && validationMatch;
  });

  // Group by shift band
  const unitsByShift = SHIFT_BANDS.map(shift => ({
    ...shift,
    count: units.filter(u => u.shiftBand === shift.name).length,
  }));

  if (todayJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg font-medium">No jobs scheduled for today</p>
        <p className="text-sm mt-1">Jobs will appear here when assigned for {todayStr}</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton />
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Data Capture</h1>
            <p className="text-gray-600 mt-2">
              Unit entry, shift timing validation (no payroll calculations)
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Data Capture Only</span>
          </Badge>
        </div>

        {/* Engine Label */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Database className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Source of Truth: Operations</p>
            <p className="text-xs text-blue-700">
              Data captured here feeds into <span className="font-semibold">operationsEngine</span> →
              used by <span className="font-semibold">payrollEngine</span> and <span className="font-semibold">incentiveEngine</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Units</p>
                <p className="text-3xl font-bold text-blue-900">{totalUnits}</p>
              </div>
              <Car className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Valid Units</p>
                <p className="text-3xl font-bold text-green-900">{validUnits}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Invalid Units</p>
                <p className="text-3xl font-bold text-red-900">{invalidUnits}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-900">{pendingUnits}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Band Indicators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Shift Band Distribution</CardTitle>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Real-time
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {unitsByShift.map((shift) => {
              const isSelected = selectedShiftBand === shift.name;

              return (
                <div
                  key={shift.name}
                  onClick={() => setSelectedShiftBand(isSelected ? "ALL" : shift.name)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? `bg-${shift.color}-50 border-${shift.color}-300 shadow-md`
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{shift.icon}</span>
                    <Badge className="text-xs" variant={isSelected ? "default" : "outline"}>
                      {shift.count} units
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{shift.label}</h3>
                  <p className="text-xs text-gray-600">
                    {shift.startTime} - {shift.endTime}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${shift.eligibleFor === "PART_TIME_WASHER" ? "bg-amber-100 text-amber-800" : shift.eligibleFor === "FULL_TIME_WASHER" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                    {shift.eligibilityLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Validation Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Status Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant={validationFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setValidationFilter("ALL")}
            >
              <Eye className="w-4 h-4 mr-2" />
              All ({totalUnits})
            </Button>
            <Button
              variant={validationFilter === "VALID" ? "default" : "outline"}
              size="sm"
              onClick={() => setValidationFilter("VALID")}
              className={validationFilter === "VALID" ? "bg-green-600" : ""}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valid ({validUnits})
            </Button>
            <Button
              variant={validationFilter === "INVALID" ? "default" : "outline"}
              size="sm"
              onClick={() => setValidationFilter("INVALID")}
              className={validationFilter === "INVALID" ? "bg-red-600" : ""}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Invalid ({invalidUnits})
            </Button>
            <Button
              variant={validationFilter === "PENDING" ? "default" : "outline"}
              size="sm"
              onClick={() => setValidationFilter("PENDING")}
              className={validationFilter === "PENDING" ? "bg-orange-600" : ""}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Pending ({pendingUnits})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unit Entry Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Unit Entries ({filteredUnits.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {selectedShiftBand !== "ALL" && (
                <Badge variant="outline">
                  Filtered: {SHIFT_BANDS.find(s => s.name === selectedShiftBand)?.label || selectedShiftBand}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                Source: operationsEngine
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit ID</TableHead>
                  <TableHead>Washer</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Shift Band</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Validation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => {
                  const shiftConfig = SHIFT_BANDS.find(s => s.name === unit.shiftBand);

                  return (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono text-sm">{unit.id}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{unit.washerName}</p>
                          <p className="text-xs text-gray-500">{unit.washerId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {unit.vehicleType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{unit.customerName || "-"}</p>
                          <p className="text-xs text-gray-500">{unit.customerId || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">{unit.timeIn}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {unit.timeOut ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm">{unit.timeOut}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-md bg-${shiftConfig?.color}-50 border border-${shiftConfig?.color}-200`}>
                          <span>{shiftConfig?.icon}</span>
                          <span className="text-xs font-medium">{shiftConfig?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{unit.location || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {unit.validationStatus === "VALID" && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        )}
                        {unit.validationStatus === "INVALID" && (
                          <div className="space-y-1">
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Invalid
                            </Badge>
                            {unit.validationIssues.map((issue, idx) => (
                              <p key={idx} className="text-xs text-red-600">• {issue}</p>
                            ))}
                          </div>
                        )}
                        {unit.validationStatus === "PENDING" && (
                          <div className="space-y-1">
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                            {unit.validationIssues.map((issue, idx) => (
                              <p key={idx} className="text-xs text-orange-600">• {issue}</p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="w-4 h-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Data Capture Only - No Payroll Calculations</AlertTitle>
        <AlertDescription className="text-blue-700 text-sm">
          This screen captures unit entries, shift timings, and validation status. All data is stored by <strong>operationsEngine</strong> and used as input by:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>payrollEngine</strong> - for wage calculation</li>
            <li><strong>incentiveEngine</strong> - for performance-based incentives</li>
            <li><strong>dashboardEngine</strong> - for KPI metrics</li>
            <li><strong>analyticsEngine</strong> - for trend analysis</li>
          </ul>
          <p className="mt-2 font-medium">No incentive or wage amounts are calculated on this screen.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
