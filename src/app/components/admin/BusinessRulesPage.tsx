/**
 * BUSINESS RULES CONFIGURATION PAGE
 * Super Admin only - Configure city-wise revenue targets
 *
 * Features:
 * - City-wise revenue target management
 * - Real-time updates
 * - Fallback to default target
 * - Visual indication of configured vs default
 */

import { useState } from "react";
import { useBusinessRules } from "../../contexts/BusinessRulesContext";
import { useRole } from "../../contexts/RoleContext";
import { useCity, CITIES } from "../../contexts/CityContext";
import type { CityId } from "../../contexts/CityContext";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import { DollarSign, Save, RotateCcw, TrendingUp, AlertCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export function BusinessRulesPage() {
  const { currentUser } = useRole();
  const {
    rules,
    getRevenueTarget,
    setRevenueTargetByCity,
    getCostPerJob,
    setCostPerJob,
    getTargetMargin,
    setTargetMargin,
    getIncentiveMultiplier,
    setIncentiveMultiplier,
  } = useBusinessRules();

  // Local state for inputs (before save) - MUST be called before any conditional returns
  const [editingTargets, setEditingTargets] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(CITIES).forEach(city => {
      initial[city.cityId] = getRevenueTarget(city.cityId);
    });
    return initial;
  });

  const [editingCosts, setEditingCosts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(CITIES).forEach(city => {
      initial[city.cityId] = getCostPerJob(city.cityId);
    });
    return initial;
  });

  const [editingMargins, setEditingMargins] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(CITIES).forEach(city => {
      initial[city.cityId] = getTargetMargin(city.cityId);
    });
    return initial;
  });

  const [editingMultipliers, setEditingMultipliers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(CITIES).forEach(city => {
      initial[city.cityId] = getIncentiveMultiplier(city.cityId);
    });
    return initial;
  });

  // Role-based access control - Super Admin only
  const isSuperAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

  // Access denied screen
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only Super Admins can access Business Rules Configuration.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Current Role: <span className="font-medium">{currentUser.role}</span>
          </p>
        </Card>
      </div>
    );
  }

  const handleTargetChange = (cityId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingTargets(prev => ({
      ...prev,
      [cityId]: numValue
    }));
  };

  const handleCostChange = (cityId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingCosts(prev => ({
      ...prev,
      [cityId]: numValue
    }));
  };

  const handleMarginChange = (cityId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingMargins(prev => ({
      ...prev,
      [cityId]: numValue
    }));
  };

  const handleMultiplierChange = (cityId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingMultipliers(prev => ({
      ...prev,
      [cityId]: numValue
    }));
  };

  const handleSave = (cityId: string) => {
    const target = editingTargets[cityId];
    const cost = editingCosts[cityId];
    const margin = editingMargins[cityId];
    const multiplier = editingMultipliers[cityId];

    if (target <= 0) {
      toast.error("Revenue target must be greater than 0");
      return;
    }

    if (cost <= 0) {
      toast.error("Cost per job must be greater than 0");
      return;
    }

    if (margin < 0 || margin > 100) {
      toast.error("Target margin must be between 0% and 100%");
      return;
    }

    if (multiplier <= 0) {
      toast.error("Incentive multiplier must be greater than 0");
      return;
    }

    setRevenueTargetByCity(cityId, target);
    setCostPerJob(cityId, cost);
    setTargetMargin(cityId, margin);
    setIncentiveMultiplier(cityId, multiplier);

    toast.success(`Business rules updated for ${CITIES[cityId]?.displayName}`);
  };

  const handleReset = (cityId: string) => {
    setEditingTargets(prev => ({
      ...prev,
      [cityId]: rules.defaultRevenueTarget
    }));
    setEditingCosts(prev => ({
      ...prev,
      [cityId]: 120
    }));
    setEditingMargins(prev => ({
      ...prev,
      [cityId]: 30
    }));
    setEditingMultipliers(prev => ({
      ...prev,
      [cityId]: 1
    }));
  };

  const isCustomTarget = (cityId: string): boolean => {
    const hasCustomRevenue = rules.revenueTargetByCity?.[cityId] !== undefined &&
           rules.revenueTargetByCity[cityId] !== rules.defaultRevenueTarget;
    const hasCustomCost = rules.costPerJobByCity?.[cityId] !== undefined &&
           rules.costPerJobByCity[cityId] !== 120;
    const hasCustomMargin = rules.targetMarginPercentByCity?.[cityId] !== undefined &&
           rules.targetMarginPercentByCity[cityId] !== 30;
    const hasCustomMultiplier = rules.incentiveMultiplierByCity?.[cityId] !== undefined &&
           rules.incentiveMultiplierByCity[cityId] !== 1;

    return hasCustomRevenue || hasCustomCost || hasCustomMargin || hasCustomMultiplier;
  };

  const hasUnsavedChanges = (cityId: string): boolean => {
    const revenueChanged = getRevenueTarget(cityId) !== editingTargets[cityId];
    const costChanged = getCostPerJob(cityId) !== editingCosts[cityId];
    const marginChanged = getTargetMargin(cityId) !== editingMargins[cityId];
    const multiplierChanged = getIncentiveMultiplier(cityId) !== editingMultipliers[cityId];

    return revenueChanged || costChanged || marginChanged || multiplierChanged;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <BackButton />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Business Rules Configuration</h1>
          </div>
          <p className="text-gray-600">
            Configure city-wise revenue targets, costs, margins, and incentive multipliers
          </p>
        </div>

        {/* Default Target Card */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Default Revenue Target</h3>
              </div>
              <p className="text-sm text-gray-600">
                Applied to all cities without custom configuration
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                ₹{(rules.defaultRevenueTarget / 100000).toFixed(1)}L
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ({rules.defaultRevenueTarget.toLocaleString("en-IN")})
              </div>
            </div>
          </div>
        </Card>

        {/* City-wise Business Rules */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            City-wise Business Rules
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {Object.keys(CITIES).length} Cities
            </Badge>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(CITIES).map((city) => (
              <Card key={city.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* City Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {city.displayName}
                        {isCustomTarget(city.cityId) && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            Custom
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{city.state} • {city.cityId}</p>
                    </div>
                    {hasUnsavedChanges(city.cityId) && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 animate-pulse">
                        Unsaved
                      </Badge>
                    )}
                  </div>

                  {/* Revenue Target Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Revenue Target (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={editingTargets[city.cityId]}
                        onChange={(e) => handleTargetChange(city.cityId, e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter revenue target"
                        step="100000"
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      ₹{(editingTargets[city.cityId] / 100000).toFixed(2)} Lakhs
                    </div>
                  </div>

                  {/* Cost Per Job Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost per Job (₹)
                    </label>
                    <input
                      type="number"
                      value={editingCosts[city.cityId]}
                      onChange={(e) => handleCostChange(city.cityId, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter cost per job"
                      step="10"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Average operational cost per wash
                    </div>
                  </div>

                  {/* Target Margin Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Margin (%)
                    </label>
                    <input
                      type="number"
                      value={editingMargins[city.cityId]}
                      onChange={(e) => handleMarginChange(city.cityId, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter target margin %"
                      step="1"
                      min="0"
                      max="100"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Expected profit margin percentage
                    </div>
                  </div>

                  {/* Incentive Multiplier Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Incentive Multiplier
                    </label>
                    <input
                      type="number"
                      value={editingMultipliers[city.cityId]}
                      onChange={(e) => handleMultiplierChange(city.cityId, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter multiplier"
                      step="0.1"
                      min="0"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      1.0 = standard, 1.5 = 50% bonus, 0.8 = 20% reduction
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(city.cityId)}
                      disabled={!hasUnsavedChanges(city.cityId)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button
                      onClick={() => handleReset(city.cityId)}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>

                  {/* Current vs Default Indicator */}
                  {!isCustomTarget(city.cityId) && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      <AlertCircle className="w-4 h-4" />
                      <div>
                        Using defaults: Revenue ₹{(rules.defaultRevenueTarget / 100000).toFixed(1)}L, Cost ₹120, Margin 30%, Multiplier 1.0x
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="p-6 mt-6 bg-gray-50">
          <h3 className="font-bold text-gray-900 mb-3">Configuration Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Cities</div>
              <div className="text-2xl font-bold text-gray-900">{Object.keys(CITIES).length}</div>
            </div>
            <div>
              <div className="text-gray-600">Custom Targets</div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(CITIES).filter(c => isCustomTarget(c.id)).length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Using Default</div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(CITIES).filter(c => !isCustomTarget(c.id)).length}
              </div>
            </div>
          </div>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How City-wise Business Rules Work:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li><strong>Revenue Target:</strong> Each city can have its own monthly revenue goal (default: ₹{(rules.defaultRevenueTarget / 100000).toFixed(1)}L)</li>
                <li><strong>Cost per Job:</strong> Define operational cost per wash for accurate profit calculations (default: ₹120)</li>
                <li><strong>Target Margin:</strong> Set expected profit margin percentage for performance tracking (default: 30%)</li>
                <li><strong>Incentive Multiplier:</strong> Adjust incentive payouts based on city economics (default: 1.0x)</li>
                <li>Changes are applied immediately to all dashboards and reports</li>
                <li>If no custom value is set, defaults are used automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
