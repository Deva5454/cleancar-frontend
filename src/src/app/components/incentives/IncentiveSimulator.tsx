/**
 * Incentive Simulator
 *
 * What-if analysis tool for testing different scenarios
 * Left: Input controls and overrides
 * Right: Simulation results and breakdown
 *
 * @component
 */

import { useState, useEffect } from "react";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import { useIncentive } from "../../contexts/IncentiveContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
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
import { Alert, AlertDescription } from "../ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  RotateCcw,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Info,
  HelpCircle,
} from "lucide-react";
import { ComparisonMetricCard } from "./ComparisonMetricCard";

// Types
interface PerformanceInput {
  current: number;
  override: number;
  enabled: boolean;
}

interface ConfigOverride {
  current: number;
  override: number;
  enabled: boolean;
}

interface SimulationState {
  // Performance inputs
  unitsWashed: PerformanceInput;
  addOnsSold: PerformanceInput;
  customerRating: PerformanceInput;

  // Config overrides
  perUnitRate: ConfigOverride;
  addOnsRate: ConfigOverride;
  baseQuota: ConfigOverride;
  ratingThreshold: ConfigOverride;
  ratingBonus: ConfigOverride;

  // Scale assumptions
  numberOfEmployees: ConfigOverride;
  workingDays: ConfigOverride;
  performanceMultiplier: ConfigOverride;
}

interface IncentiveBreakdown {
  base: { label: string; units: number; rate: number; amount: number };
  additionalUnits: { label: string; units: number; rate: number; amount: number };
  addOns: { label: string; quantity: number; rate: number; amount: number };
  ratingBonus: { label: string; condition: string; amount: number };
  subtotal: { label: string; amount: number };
  penalties: { label: string; amount: number };
  net: { label: string; amount: number };
}

export function IncentiveSimulator() {
  // PHASE 2: Migrated to useEmployeeData (dual-read from EmployeeContext + HRDataContext)
  const { roles, employees } = useEmployeeData();
  const { getConfigForRole } = useIncentive();

  // State
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("");
  const [scenarioName, setScenarioName] = useState<string>("Untitled Scenario");

  // Simulation inputs
  const [simulation, setSimulation] = useState<SimulationState>({
    unitsWashed: { current: 70, override: 85, enabled: false },
    addOnsSold: { current: 8, override: 10, enabled: false },
    customerRating: { current: 4.2, override: 4.6, enabled: false },
    perUnitRate: { current: 25, override: 30, enabled: false }, // Will be updated from config
    addOnsRate: { current: 50, override: 50, enabled: false }, // Will be updated from config
    baseQuota: { current: 50, override: 50, enabled: false }, // Will be updated from config
    ratingThreshold: { current: 4.5, override: 4.5, enabled: false },
    ratingBonus: { current: 500, override: 600, enabled: false },
    numberOfEmployees: { current: 45, override: 50, enabled: false },
    workingDays: { current: 22, override: 22, enabled: false },
    performanceMultiplier: { current: 100, override: 110, enabled: false },
  });

  const selectedRole = roles.find(r => r.code === selectedRoleCode);

  // Update config values when role changes
  useEffect(() => {
    if (selectedRole) {
      const config = getConfigForRole(selectedRole.name);

      // Use config values with safe fallbacks
      const baseQuota = config?.quota ?? 50;
      const perUnitRate = config?.perUnitRate ?? 25;
      const addOnsRate = config?.addOnsRate ?? 50;

      setSimulation(prev => ({
        ...prev,
        baseQuota: {
          current: baseQuota,
          override: prev.baseQuota.enabled ? prev.baseQuota.override : baseQuota,
          enabled: prev.baseQuota.enabled,
        },
        perUnitRate: {
          current: perUnitRate,
          override: prev.perUnitRate.enabled ? prev.perUnitRate.override : perUnitRate,
          enabled: prev.perUnitRate.enabled,
        },
        addOnsRate: {
          current: addOnsRate,
          override: prev.addOnsRate.enabled ? prev.addOnsRate.override : addOnsRate,
          enabled: prev.addOnsRate.enabled,
        },
      }));
    }
  }, [selectedRole, getConfigForRole]);

  // Calculate active employees (current value)
  useEffect(() => {
    if (selectedRole) {
      const activeCount = employees.filter(e =>
        e.employmentInfo.role === selectedRole.name &&
        e.status === "active"
      ).length;

      setSimulation(prev => ({
        ...prev,
        numberOfEmployees: {
          ...prev.numberOfEmployees,
          current: activeCount,
          override: activeCount,
        },
      }));
    }
  }, [selectedRole, employees]);

  // Calculate current incentive
  const calculateIncentive = (useOverride: boolean): IncentiveBreakdown => {
    const units = useOverride && simulation.unitsWashed.enabled
      ? simulation.unitsWashed.override
      : simulation.unitsWashed.current;

    const addOns = useOverride && simulation.addOnsSold.enabled
      ? simulation.addOnsSold.override
      : simulation.addOnsSold.current;

    const rating = useOverride && simulation.customerRating.enabled
      ? simulation.customerRating.override
      : simulation.customerRating.current;

    const quota = useOverride && simulation.baseQuota.enabled
      ? simulation.baseQuota.override
      : simulation.baseQuota.current;

    const unitRate = useOverride && simulation.perUnitRate.enabled
      ? simulation.perUnitRate.override
      : simulation.perUnitRate.current;

    const addOnRate = useOverride && simulation.addOnsRate.enabled
      ? simulation.addOnsRate.override
      : simulation.addOnsRate.current;

    const threshold = useOverride && simulation.ratingThreshold.enabled
      ? simulation.ratingThreshold.override
      : simulation.ratingThreshold.current;

    const bonus = useOverride && simulation.ratingBonus.enabled
      ? simulation.ratingBonus.override
      : simulation.ratingBonus.current;

    // Calculate breakdown
    const additionalUnits = Math.max(0, units - quota);
    const baseAmount = 0; // No incentive for base units
    const additionalAmount = additionalUnits * unitRate;
    const addOnsAmount = addOns * addOnRate;
    const ratingBonusAmount = rating > threshold ? bonus : 0;

    const grossIncentive = additionalAmount + addOnsAmount + ratingBonusAmount;
    const penalties = 0; // TODO: Add penalty calculations
    const netIncentive = grossIncentive - penalties;

    return {
      base: {
        label: "Base Units (No Incentive)",
        units: quota,
        rate: 0,
        amount: baseAmount,
      },
      additionalUnits: {
        label: "Additional Units",
        units: additionalUnits,
        rate: unitRate,
        amount: additionalAmount,
      },
      addOns: {
        label: "Add-ons Sold",
        quantity: addOns,
        rate: addOnRate,
        amount: addOnsAmount,
      },
      ratingBonus: {
        label: "Rating Bonus",
        condition: `${rating.toFixed(1)} ${rating > threshold ? ">" : "≤"} ${threshold}`,
        amount: ratingBonusAmount,
      },
      subtotal: {
        label: "Gross Incentive",
        amount: grossIncentive,
      },
      penalties: {
        label: "Penalties/Deductions",
        amount: penalties,
      },
      net: {
        label: "Net Incentive",
        amount: netIncentive,
      },
    };
  };

  const currentBreakdown = calculateIncentive(false);
  const simulatedBreakdown = calculateIncentive(true);

  const delta = simulatedBreakdown.net.amount - currentBreakdown.net.amount;
  const deltaPercentage = currentBreakdown.net.amount > 0
    ? (delta / currentBreakdown.net.amount) * 100
    : 0;

  // Calculate team/budget impact
  const employeeCount = simulation.numberOfEmployees.enabled
    ? simulation.numberOfEmployees.override
    : simulation.numberOfEmployees.current;

  const days = simulation.workingDays.enabled
    ? simulation.workingDays.override
    : simulation.workingDays.current;

  const totalCurrentCost = currentBreakdown.net.amount * employeeCount * days;
  const totalSimulatedCost = simulatedBreakdown.net.amount * employeeCount * days;
  const budgetAllocated = 500000; // TODO: Get from config

  const handleReset = () => {
    setSimulation(prev => ({
      ...prev,
      unitsWashed: { ...prev.unitsWashed, override: prev.unitsWashed.current, enabled: false },
      addOnsSold: { ...prev.addOnsSold, override: prev.addOnsSold.current, enabled: false },
      customerRating: { ...prev.customerRating, override: prev.customerRating.current, enabled: false },
      perUnitRate: { ...prev.perUnitRate, override: prev.perUnitRate.current, enabled: false },
      addOnsRate: { ...prev.addOnsRate, override: prev.addOnsRate.current, enabled: false },
      baseQuota: { ...prev.baseQuota, override: prev.baseQuota.current, enabled: false },
      ratingThreshold: { ...prev.ratingThreshold, override: prev.ratingThreshold.current, enabled: false },
      ratingBonus: { ...prev.ratingBonus, override: prev.ratingBonus.current, enabled: false },
      numberOfEmployees: { ...prev.numberOfEmployees, override: prev.numberOfEmployees.current, enabled: false },
      workingDays: { ...prev.workingDays, override: prev.workingDays.current, enabled: false },
      performanceMultiplier: { ...prev.performanceMultiplier, override: 100, enabled: false },
    }));
  };

  const handleToggle = (field: keyof SimulationState) => {
    setSimulation(prev => ({
      ...prev,
      [field]: { ...prev[field], enabled: !prev[field].enabled },
    }));
  };

  const handleOverrideChange = (field: keyof SimulationState, value: number) => {
    setSimulation(prev => ({
      ...prev,
      [field]: { ...prev[field], override: value },
    }));
  };

  const anyOverrideEnabled = Object.values(simulation).some(s => s.enabled);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Incentive Simulator</h1>
            <p className="text-sm text-gray-600 mt-1">
              Test what-if scenarios and analyze impact on incentive payouts
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md">
                <p className="text-sm font-semibold mb-2">How Simulation Works</p>
                <p className="text-xs text-gray-300 mb-2">
                  Toggle switches to override performance or config values. The simulator
                  calculates incentives in real-time showing current vs simulated payouts.
                </p>
                <p className="text-xs text-gray-300">
                  Use "Reset to Default" to restore all original values.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Restore all values to current baseline</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Scenario Name */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-gray-600">Scenario Name</Label>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 hover:border-gray-400"
                placeholder="Enter scenario name"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Label className="text-xs font-medium text-gray-600">Role</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Select the role to simulate incentives for</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={selectedRoleCode} onValueChange={setSelectedRoleCode}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 hover:border-gray-400">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter(r => r.isActive).map(role => (
                    <SelectItem
                      key={role.id}
                      value={role.code}
                      className="transition-colors hover:bg-blue-50 focus:bg-blue-100"
                    >
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <div className="grid grid-cols-5 gap-6">
          {/* LEFT PANEL - INPUTS (40% width = 2 cols) */}
          <div className="col-span-2 space-y-4">
            {/* Performance Inputs */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900">Performance Inputs</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Override actual performance values</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Modify performance metrics to test different scenarios</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Units Washed */}
                <div className="transition-all duration-200">
                  <div className="flex justify-between items-center mb-2.5">
                    <Label className="text-sm font-medium text-gray-700">Units Washed</Label>
                    <Switch
                      checked={simulation.unitsWashed.enabled}
                      onCheckedChange={() => handleToggle('unitsWashed')}
                      className="transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={simulation.unitsWashed.override}
                        onChange={(e) => handleOverrideChange('unitsWashed', Number(e.target.value))}
                        disabled={!simulation.unitsWashed.enabled}
                        min={0}
                        max={200}
                        className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                      <Badge variant="outline" className="whitespace-nowrap font-medium border-gray-300 text-gray-600">
                        Current: {simulation.unitsWashed.current}
                      </Badge>
                    </div>
                    <Slider
                      value={[simulation.unitsWashed.override]}
                      onValueChange={(value) => handleOverrideChange('unitsWashed', value[0])}
                      disabled={!simulation.unitsWashed.enabled}
                      min={0}
                      max={200}
                      step={5}
                      className="w-full transition-all duration-200"
                    />
                    <p className="text-xs font-medium text-gray-500">Range: 0 - 200 units</p>
                  </div>
                </div>

                <Separator />

                {/* Add-ons Sold */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Add-ons Sold</Label>
                    <Switch
                      checked={simulation.addOnsSold.enabled}
                      onCheckedChange={() => handleToggle('addOnsSold')}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={simulation.addOnsSold.override}
                        onChange={(e) => handleOverrideChange('addOnsSold', Number(e.target.value))}
                        disabled={!simulation.addOnsSold.enabled}
                        min={0}
                        max={50}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="whitespace-nowrap">
                        Current: {simulation.addOnsSold.current}
                      </Badge>
                    </div>
                    <Slider
                      value={[simulation.addOnsSold.override]}
                      onValueChange={(value) => handleOverrideChange('addOnsSold', value[0])}
                      disabled={!simulation.addOnsSold.enabled}
                      min={0}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Range: 0 - 50 add-ons</p>
                  </div>
                </div>

                <Separator />

                {/* Customer Rating */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Customer Rating</Label>
                    <Switch
                      checked={simulation.customerRating.enabled}
                      onCheckedChange={() => handleToggle('customerRating')}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={simulation.customerRating.override}
                        onChange={(e) => handleOverrideChange('customerRating', Number(e.target.value))}
                        disabled={!simulation.customerRating.enabled}
                        min={0}
                        max={5}
                        step={0.1}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="whitespace-nowrap">
                        Current: {(simulation?.customerRating?.current ?? 0).toFixed(1)}
                      </Badge>
                    </div>
                    <Slider
                      value={[simulation.customerRating.override * 10]}
                      onValueChange={(value) => handleOverrideChange('customerRating', value[0] / 10)}
                      disabled={!simulation.customerRating.enabled}
                      min={0}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Range: 0.0 - 5.0 stars</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Config Parameter Overrides */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Config Parameter Overrides</CardTitle>
                <CardDescription>Test different rule values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Per Unit Rate */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Per Unit Rate</Label>
                    <Switch
                      checked={simulation.perUnitRate.enabled}
                      onCheckedChange={() => handleToggle('perUnitRate')}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm">₹</span>
                    <Input
                      type="number"
                      value={simulation.perUnitRate.override}
                      onChange={(e) => handleOverrideChange('perUnitRate', Number(e.target.value))}
                      disabled={!simulation.perUnitRate.enabled}
                      min={10}
                      max={100}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="whitespace-nowrap">
                      Current: ₹{simulation.perUnitRate.current}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Range: ₹10 - ₹100</p>
                </div>

                <Separator />

                {/* Base Quota */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Base Quota</Label>
                    <Switch
                      checked={simulation.baseQuota.enabled}
                      onCheckedChange={() => handleToggle('baseQuota')}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={simulation.baseQuota.override}
                      onChange={(e) => handleOverrideChange('baseQuota', Number(e.target.value))}
                      disabled={!simulation.baseQuota.enabled}
                      min={10}
                      max={100}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="whitespace-nowrap">
                      Current: {simulation.baseQuota.current}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Range: 10 - 100 units</p>
                </div>

                <Separator />

                {/* Rating Bonus */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Rating Bonus Amount</Label>
                    <Switch
                      checked={simulation.ratingBonus.enabled}
                      onCheckedChange={() => handleToggle('ratingBonus')}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm">₹</span>
                    <Input
                      type="number"
                      value={simulation.ratingBonus.override}
                      onChange={(e) => handleOverrideChange('ratingBonus', Number(e.target.value))}
                      disabled={!simulation.ratingBonus.enabled}
                      min={0}
                      max={2000}
                      step={100}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="whitespace-nowrap">
                      Current: ₹{simulation.ratingBonus.current}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    If rating &gt; {simulation.ratingThreshold.current}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Scale Assumptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scale Assumptions</CardTitle>
                <CardDescription>Test team-wide impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Number of Employees */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Number of Employees</Label>
                    <Switch
                      checked={simulation.numberOfEmployees.enabled}
                      onCheckedChange={() => handleToggle('numberOfEmployees')}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={simulation.numberOfEmployees.override}
                      onChange={(e) => handleOverrideChange('numberOfEmployees', Number(e.target.value))}
                      disabled={!simulation.numberOfEmployees.enabled}
                      min={1}
                      max={1000}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="whitespace-nowrap">
                      Current: {simulation.numberOfEmployees.current}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Working Days */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Working Days in Month</Label>
                    <Switch
                      checked={simulation.workingDays.enabled}
                      onCheckedChange={() => handleToggle('workingDays')}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={simulation.workingDays.override}
                      onChange={(e) => handleOverrideChange('workingDays', Number(e.target.value))}
                      disabled={!simulation.workingDays.enabled}
                      min={1}
                      max={31}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="whitespace-nowrap">
                      Current: {simulation.workingDays.current}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Override Status */}
            {anyOverrideEnabled && (
              <Alert className="border-amber-200 bg-amber-50 transition-all duration-300 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong className="font-semibold">{Object.values(simulation).filter(s => s.enabled).length} override(s) active</strong>
                  <br />
                  <span className="text-sm">Results show simulated values. Click "Reset to Default" to restore current values.</span>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* RIGHT PANEL - OUTPUT (60% width = 3 cols) */}
          <div className="col-span-3 space-y-4">
            {/* Summary Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <ComparisonMetricCard
                label="Per Day Incentive"
                currentValue={`₹${currentBreakdown.net.amount.toLocaleString('en-IN')}`}
                simulatedValue={`₹${simulatedBreakdown.net.amount.toLocaleString('en-IN')}`}
                change={{
                  value: delta >= 0 ? `+₹${delta.toLocaleString('en-IN')}` : `-₹${Math.abs(delta).toLocaleString('en-IN')}`,
                  percentage: deltaPercentage,
                }}
              />

              <ComparisonMetricCard
                label="Monthly Cost (All Employees)"
                currentValue={`₹${Math.round(totalCurrentCost).toLocaleString('en-IN')}`}
                simulatedValue={`₹${Math.round(totalSimulatedCost).toLocaleString('en-IN')}`}
                change={{
                  value: (totalSimulatedCost - totalCurrentCost) >= 0
                    ? `+₹${Math.round(totalSimulatedCost - totalCurrentCost).toLocaleString('en-IN')}`
                    : `-₹${Math.round(Math.abs(totalSimulatedCost - totalCurrentCost)).toLocaleString('en-IN')}`,
                  percentage: totalCurrentCost > 0 ? ((totalSimulatedCost - totalCurrentCost) / totalCurrentCost) * 100 : 0,
                }}
              />
            </div>

            {/* Incentive Breakdown */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-bold text-gray-900">Incentive Breakdown</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Component-wise calculation</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <Info className="w-4 h-4 text-gray-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">
                          Shows detailed calculation: (units - quota) × rate + add-ons × rate + rating bonus - penalties = net incentive
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <Table className="transition-all duration-200">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">Rate</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Simulated</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Base Units */}
                    <TableRow>
                      <TableCell className="text-gray-600">{simulatedBreakdown.base.label}</TableCell>
                      <TableCell className="text-center text-gray-600">{simulatedBreakdown.base.units}</TableCell>
                      <TableCell className="text-center text-gray-600">₹0</TableCell>
                      <TableCell className="text-right text-gray-600">₹0</TableCell>
                      <TableCell className="text-right text-gray-600">₹0</TableCell>
                      <TableCell className="text-right text-gray-600">-</TableCell>
                    </TableRow>

                    {/* Additional Units */}
                    <TableRow>
                      <TableCell className="font-medium">{simulatedBreakdown.additionalUnits.label}</TableCell>
                      <TableCell className="text-center">
                        <span className={currentBreakdown.additionalUnits.units !== simulatedBreakdown.additionalUnits.units ? "text-blue-600 font-semibold" : ""}>
                          {simulatedBreakdown.additionalUnits.units}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={currentBreakdown.additionalUnits.rate !== simulatedBreakdown.additionalUnits.rate ? "text-blue-600 font-semibold" : ""}>
                          ₹{simulatedBreakdown.additionalUnits.rate}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₹{currentBreakdown.additionalUnits.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        ₹{simulatedBreakdown.additionalUnits.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={simulatedBreakdown.additionalUnits.amount - currentBreakdown.additionalUnits.amount > 0 ? "text-green-600" : simulatedBreakdown.additionalUnits.amount - currentBreakdown.additionalUnits.amount < 0 ? "text-red-600" : ""}>
                          {simulatedBreakdown.additionalUnits.amount - currentBreakdown.additionalUnits.amount > 0 ? "+" : ""}
                          ₹{(simulatedBreakdown.additionalUnits.amount - currentBreakdown.additionalUnits.amount).toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Add-ons */}
                    <TableRow>
                      <TableCell className="font-medium">{simulatedBreakdown.addOns.label}</TableCell>
                      <TableCell className="text-center">
                        <span className={currentBreakdown.addOns.quantity !== simulatedBreakdown.addOns.quantity ? "text-blue-600 font-semibold" : ""}>
                          {simulatedBreakdown.addOns.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">₹{simulatedBreakdown.addOns.rate}</TableCell>
                      <TableCell className="text-right">₹{currentBreakdown.addOns.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        ₹{simulatedBreakdown.addOns.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={simulatedBreakdown.addOns.amount - currentBreakdown.addOns.amount > 0 ? "text-green-600" : simulatedBreakdown.addOns.amount - currentBreakdown.addOns.amount < 0 ? "text-red-600" : ""}>
                          {simulatedBreakdown.addOns.amount - currentBreakdown.addOns.amount > 0 ? "+" : ""}
                          ₹{(simulatedBreakdown.addOns.amount - currentBreakdown.addOns.amount).toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Rating Bonus */}
                    <TableRow>
                      <TableCell className="font-medium">
                        {simulatedBreakdown.ratingBonus.label}
                        <br />
                        <span className="text-xs text-gray-500">{simulatedBreakdown.ratingBonus.condition}</span>
                      </TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-right">₹{currentBreakdown.ratingBonus.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        ₹{simulatedBreakdown.ratingBonus.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={simulatedBreakdown.ratingBonus.amount - currentBreakdown.ratingBonus.amount > 0 ? "text-green-600" : simulatedBreakdown.ratingBonus.amount - currentBreakdown.ratingBonus.amount < 0 ? "text-red-600" : ""}>
                          {simulatedBreakdown.ratingBonus.amount - currentBreakdown.ratingBonus.amount > 0 ? "+" : ""}
                          ₹{(simulatedBreakdown.ratingBonus.amount - currentBreakdown.ratingBonus.amount).toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Subtotal */}
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-semibold" colSpan={3}>{simulatedBreakdown.subtotal.label}</TableCell>
                      <TableCell className="text-right font-semibold">₹{currentBreakdown.subtotal.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        ₹{simulatedBreakdown.subtotal.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : ""}>
                          {delta > 0 ? "+" : ""}
                          ₹{delta.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Penalties */}
                    <TableRow>
                      <TableCell className="text-gray-600">{simulatedBreakdown.penalties.label}</TableCell>
                      <TableCell className="text-center text-gray-600">-</TableCell>
                      <TableCell className="text-center text-gray-600">-</TableCell>
                      <TableCell className="text-right text-gray-600">₹{currentBreakdown.penalties.amount}</TableCell>
                      <TableCell className="text-right text-gray-600">₹{simulatedBreakdown.penalties.amount}</TableCell>
                      <TableCell className="text-right text-gray-600">-</TableCell>
                    </TableRow>

                    {/* Net */}
                    <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                      <TableCell className="font-bold text-blue-900" colSpan={3}>{simulatedBreakdown.net.label}</TableCell>
                      <TableCell className="text-right font-bold text-blue-900">
                        ₹{currentBreakdown.net.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-900 text-lg">
                        ₹{simulatedBreakdown.net.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-600"}>
                          {delta > 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : delta < 0 ? <TrendingDown className="w-4 h-4 inline mr-1" /> : null}
                          {delta > 0 ? "+" : ""}
                          ₹{delta.toLocaleString('en-IN')}
                          <br />
                          <span className="text-xs">({deltaPercentage > 0 ? "+" : ""}{deltaPercentage.toFixed(1)}%)</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Budget Impact */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-bold text-gray-900">Budget Impact (Monthly)</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Based on {employeeCount} employees × {days} working days
                    </CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <Info className="w-4 h-4 text-gray-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">
                          Total monthly cost = per-day incentive × employees × working days.
                          Budget utilization shown with color-coded alerts.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Current Cost</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{Math.round(totalCurrentCost).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Simulated Cost</p>
                      <p className="text-xl font-bold text-blue-600">
                        ₹{Math.round(totalSimulatedCost).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget Allocated</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{budgetAllocated.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Utilization</span>
                      <span className="font-semibold">
                        {((totalSimulatedCost / budgetAllocated) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative">
                      <div
                        className={`h-3 rounded-full ${
                          (totalSimulatedCost / budgetAllocated) > 0.9
                            ? "bg-red-500"
                            : (totalSimulatedCost / budgetAllocated) > 0.75
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(100, (totalSimulatedCost / budgetAllocated) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {totalSimulatedCost > budgetAllocated && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Simulated cost exceeds budget by ₹{(totalSimulatedCost - budgetAllocated).toLocaleString('en-IN')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {totalSimulatedCost <= budgetAllocated && totalSimulatedCost / budgetAllocated > 0.9 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Budget utilization above 90%. Remaining: ₹{(budgetAllocated - totalSimulatedCost).toLocaleString('en-IN')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {totalSimulatedCost <= budgetAllocated && totalSimulatedCost / budgetAllocated <= 0.9 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Within budget. Remaining: ₹{(budgetAllocated - totalSimulatedCost).toLocaleString('en-IN')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!selectedRole && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Select a role to start simulation</p>
            <p className="text-sm mt-2">Choose a role from the dropdown above to see simulation inputs and results</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
