// System Configuration Manager - View and edit all cost model parameters
import React, { useState } from "react";
import {
  getActiveConfiguration,
  getCalculatedMetrics,
  updateConfiguration,
  resetToDefaultConfiguration,
  getConfigurationSummary,
  type SystemConfiguration,
} from "../../data/systemConfiguration";
import { toast } from "sonner";
import { ConfirmDialog } from "../shared/ConfirmDialog";

export function SystemConfigurationManager() {
  const [config, setConfig] = useState<SystemConfiguration>(getActiveConfiguration());
  const [activeTab, setActiveTab] = useState<string>("organization");
  const [hasChanges, setHasChanges] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const metrics = getCalculatedMetrics();
  const summary = getConfigurationSummary();

  const handleReset = () => {
    setConfirmState({
      open: true,
      title: "Reset Configuration",
      description: "Are you sure you want to reset all configuration to default values?",
      onConfirm: () => {
        resetToDefaultConfiguration();
        setConfig(getActiveConfiguration());
        setHasChanges(false);
        setConfirmState(s => ({ ...s, open: false }));
      }
    });
  };

  const handleSave = () => {
    updateConfiguration(config);
    setHasChanges(false);
    toast.success("Configuration saved successfully!");
  };

  const updateField = (section: keyof SystemConfiguration, field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateNestedField = (
    section: keyof SystemConfiguration,
    subsection: string,
    field: string,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const tabs = [
    { id: "organization", label: "Organization" },
    { id: "throughput", label: "Throughput" },
    { id: "salaries", label: "Salaries" },
    { id: "incentives", label: "Incentives" },
    { id: "cloth", label: "Cloth System" },
    { id: "consumables", label: "Consumables" },
    { id: "equipment", label: "Equipment" },
    { id: "overhead", label: "Overhead" },
    { id: "laundry", label: "Laundry" },
    { id: "summary", label: "Summary" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage all cost model parameters and unit economics settings
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium">● Unsaved changes</span>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeTab === "organization" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Organization Structure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Number of Teams"
                value={config.organizationStructure.numberOfTeams}
                onChange={(v) => updateField("organizationStructure", "numberOfTeams", v)}
                type="number"
              />
              <InputField
                label="Washers per Team"
                value={config.organizationStructure.washersPerTeam}
                onChange={(v) => updateField("organizationStructure", "washersPerTeam", v)}
                type="number"
              />
              <InputField
                label="Supervisors per Team"
                value={config.organizationStructure.supervisorsPerTeam}
                onChange={(v) => updateField("organizationStructure", "supervisorsPerTeam", v)}
                type="number"
              />
              <InputField
                label="Ops Managers Threshold (supervisors)"
                value={config.organizationStructure.opsManagersThreshold}
                onChange={(v) => updateField("organizationStructure", "opsManagersThreshold", v)}
                type="number"
              />
              <InputField
                label="City Managers"
                value={config.organizationStructure.cityManagers}
                onChange={(v) => updateField("organizationStructure", "cityManagers", v)}
                type="number"
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Metrics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Total Washers: <span className="font-semibold">{metrics.totalWashers}</span></div>
                <div>Total Supervisors: <span className="font-semibold">{metrics.totalSupervisors}</span></div>
                <div>Total Ops Managers: <span className="font-semibold">{metrics.totalOpsManagers}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "throughput" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Throughput & Working Days</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Working Days per Month"
                value={config.throughputSettings.workingDaysPerMonth}
                onChange={(v) => updateField("throughputSettings", "workingDaysPerMonth", v)}
                type="number"
                helpText="Typically 26 days (6 days/week)"
              />
              <InputField
                label="Base Units per Washer per Day"
                value={config.throughputSettings.baseUnitsPerWasherPerDay}
                onChange={(v) => updateField("throughputSettings", "baseUnitsPerWasherPerDay", v)}
                type="number"
                helpText="Guaranteed throughput covered by salary"
              />
              <InputField
                label="Max Additional Units per Washer per Day"
                value={config.throughputSettings.maxAdditionalUnitsPerWasherPerDay}
                onChange={(v) => updateField("throughputSettings", "maxAdditionalUnitsPerWasherPerDay", v)}
                type="number"
                helpText="Maximum extra units before capacity limit"
              />
              <InputField
                label="Avg Extra Units per Washer per Day"
                value={config.throughputSettings.avgExtraUnitsPerWasherPerDay}
                onChange={(v) => updateField("throughputSettings", "avgExtraUnitsPerWasherPerDay", v)}
                type="number"
                helpText="Conservative average for incentive calculations"
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Metrics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Base Units/Month: <span className="font-semibold">{metrics.baseUnitsPerWasherPerMonth}</span></div>
                <div>Max Additional Units/Month: <span className="font-semibold">{metrics.maxAdditionalUnitsPerWasherPerMonth}</span></div>
                <div>Total Base Washes/Month: <span className="font-semibold">{(metrics?.totalBaseWashesPerMonth ?? 0).toLocaleString()}</span></div>
                <div>Max Total Washes/Month: <span className="font-semibold">{(metrics?.maxTotalWashesPerMonth ?? 0).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "salaries" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Salary Structure (CTC per Month)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Washer CTC (₹/month)"
                value={config.salaryStructure.washerCTC}
                onChange={(v) => updateField("salaryStructure", "washerCTC", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Supervisor CTC (₹/month)"
                value={config.salaryStructure.supervisorCTC}
                onChange={(v) => updateField("salaryStructure", "supervisorCTC", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Operations Manager CTC (₹/month)"
                value={config.salaryStructure.opsManagerCTC}
                onChange={(v) => updateField("salaryStructure", "opsManagerCTC", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="City Manager CTC (₹/month)"
                value={config.salaryStructure.cityManagerCTC}
                onChange={(v) => updateField("salaryStructure", "cityManagerCTC", v)}
                type="number"
                prefix="₹"
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Costs</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Washer Cost/Wash: <span className="font-semibold">₹{(metrics?.washerCostPerWashBase ?? 0).toFixed(2)}</span></div>
                <div>Supervisor Cost/Wash: <span className="font-semibold">₹{(metrics?.supervisorCostPerWash ?? 0).toFixed(2)}</span></div>
                <div>Ops Manager Cost/Wash: <span className="font-semibold">₹{(metrics?.opsManagerCostPerWash ?? 0).toFixed(2)}</span></div>
                <div>City Manager Cost/Wash: <span className="font-semibold">₹{(metrics?.cityManagerCostPerWash ?? 0).toFixed(2)}</span></div>
                <div className="col-span-2 font-semibold text-blue-900">
                  Total Labour/Wash (Base): <span className="font-bold">₹{(metrics?.totalLabourCostPerWashBase ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "incentives" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Incentive Structure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <InputField
                label="4-Wheeler Rate (₹/unit)"
                value={config.incentiveStructure.fourWheelerRatePerUnit}
                onChange={(v) => updateField("incentiveStructure", "fourWheelerRatePerUnit", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="2-Wheeler Rate (₹/unit)"
                value={config.incentiveStructure.twoWheelerRatePerUnit}
                onChange={(v) => updateField("incentiveStructure", "twoWheelerRatePerUnit", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Add-On Rate (₹/unit)"
                value={config.incentiveStructure.addOnRatePerUnit}
                onChange={(v) => updateField("incentiveStructure", "addOnRatePerUnit", v)}
                type="number"
                prefix="₹"
              />
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Incentive Unit Mix (must sum to 1.0)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <InputField
                  label="4W Mix %"
                  value={config.incentiveStructure.incentiveUnitMix.fourWheeler}
                  onChange={(v) => updateField("incentiveStructure", "incentiveUnitMix", {
                    ...config.incentiveStructure.incentiveUnitMix,
                    fourWheeler: v
                  })}
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                />
                <InputField
                  label="2W Mix %"
                  value={config.incentiveStructure.incentiveUnitMix.twoWheeler}
                  onChange={(v) => updateField("incentiveStructure", "incentiveUnitMix", {
                    ...config.incentiveStructure.incentiveUnitMix,
                    twoWheeler: v
                  })}
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                />
                <InputField
                  label="Add-On Mix %"
                  value={config.incentiveStructure.incentiveUnitMix.addOn}
                  onChange={(v) => updateField("incentiveStructure", "incentiveUnitMix", {
                    ...config.incentiveStructure.incentiveUnitMix,
                    addOn: v
                  })}
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                />
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Metrics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Blended Rate/Unit: <span className="font-semibold">₹{(metrics?.blendedIncentiveRatePerUnit ?? 0).toFixed(2)}</span></div>
                <div>Avg Incentive/Washer/Month: <span className="font-semibold">₹{(metrics?.avgIncentivePerWasherPerMonth ?? 0).toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cloth" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Cloth Rotation System</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Cloth Cost per Piece (₹)"
                value={config.clothRotationSystem.clothCostPerPiece}
                onChange={(v) => updateField("clothRotationSystem", "clothCostPerPiece", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Cloths per Car per Wash"
                value={config.clothRotationSystem.clothsPerCarPerWash}
                onChange={(v) => updateField("clothRotationSystem", "clothsPerCarPerWash", v)}
                type="number"
                helpText="Glass + Shampoo + Dry cloth"
              />
              <InputField
                label="Cloth Life (washes)"
                value={config.clothRotationSystem.clothLifeWashes}
                onChange={(v) => updateField("clothRotationSystem", "clothLifeWashes", v)}
                type="number"
              />
              <InputField
                label="Batches for Rotation"
                value={config.clothRotationSystem.batchesNeededForRotation}
                onChange={(v) => updateField("clothRotationSystem", "batchesNeededForRotation", v)}
                type="number"
                helpText="For 3-day rotation cycle"
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Costs</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Cloth Cost/Wash: <span className="font-semibold">₹{(metrics?.clothCostPerWash ?? 0).toFixed(4)}</span></div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-8">Sponge & Interior Cloth</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Wax Sponge Cost (₹)"
                value={config.spongeAndInteriorCloth.waxSpongeCost}
                onChange={(v) => updateField("spongeAndInteriorCloth", "waxSpongeCost", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Wax Sponge Life (months)"
                value={config.spongeAndInteriorCloth.waxSpongeLifeMonths}
                onChange={(v) => updateField("spongeAndInteriorCloth", "waxSpongeLifeMonths", v)}
                type="number"
              />
              <InputField
                label="Interior Cloth Cost (₹)"
                value={config.spongeAndInteriorCloth.interiorClothCost}
                onChange={(v) => updateField("spongeAndInteriorCloth", "interiorClothCost", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Interior Cloth Life (months)"
                value={config.spongeAndInteriorCloth.interiorClothLifeMonths}
                onChange={(v) => updateField("spongeAndInteriorCloth", "interiorClothLifeMonths", v)}
                type="number"
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Costs</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Sponge Cost/Wash: <span className="font-semibold">₹{(metrics?.spongeCostPerWash ?? 0).toFixed(4)}</span></div>
                <div>Interior Cloth Cost/Wash: <span className="font-semibold">₹{(metrics?.interiorClothCostPerWash ?? 0).toFixed(4)}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "consumables" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Liquid Consumables</h3>
            {["shampoo", "tyreWax", "interiorWax", "exteriorWax"].map((item) => (
              <div key={item} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 capitalize">{item.replace(/([A-Z])/g, ' $1')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <InputField
                    label="Quantity per Wash (ml)"
                    value={(config.liquidConsumables as any)[item].quantityPerWash}
                    onChange={(v) => updateNestedField("liquidConsumables", item, "quantityPerWash", v)}
                    type="number"
                  />
                  <InputField
                    label="Cost per ml (₹)"
                    value={(config.liquidConsumables as any)[item].costPerMl}
                    onChange={(v) => updateNestedField("liquidConsumables", item, "costPerMl", v)}
                    type="number"
                    step={0.01}
                    prefix="₹"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "equipment" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Equipment Settings</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Water Spray Gun</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InputField
                  label="Purchase Cost (₹)"
                  value={config.equipmentSettings.waterSprayGun.purchaseCost}
                  onChange={(v) => updateNestedField("equipmentSettings", "waterSprayGun", "purchaseCost", v)}
                  type="number"
                  prefix="₹"
                />
                <InputField
                  label="Useful Life (months)"
                  value={config.equipmentSettings.waterSprayGun.usefulLifeMonths}
                  onChange={(v) => updateNestedField("equipmentSettings", "waterSprayGun", "usefulLifeMonths", v)}
                  type="number"
                />
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Vacuum Cleaner</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InputField
                  label="Purchase Cost (₹)"
                  value={config.equipmentSettings.vacuumCleaner.purchaseCost}
                  onChange={(v) => updateNestedField("equipmentSettings", "vacuumCleaner", "purchaseCost", v)}
                  type="number"
                  prefix="₹"
                />
                <InputField
                  label="Useful Life (months)"
                  value={config.equipmentSettings.vacuumCleaner.usefulLifeMonths}
                  onChange={(v) => updateNestedField("equipmentSettings", "vacuumCleaner", "usefulLifeMonths", v)}
                  type="number"
                />
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Costs</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Spray Gun Cost/Wash: <span className="font-semibold">₹{(metrics?.sprayGunCostPerWash ?? 0).toFixed(4)}</span></div>
                <div>Vacuum Cost/Wash: <span className="font-semibold">₹{(metrics?.vacuumCostPerWash ?? 0).toFixed(4)}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "overhead" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Fixed Overheads (Monthly)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Office & Stationery (₹/month)"
                value={config.fixedOverheads.officeAndStationery}
                onChange={(v) => updateField("fixedOverheads", "officeAndStationery", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="ERP CAPEX (₹)"
                value={config.fixedOverheads.erpSystem.oneTimeCapex}
                onChange={(v) => updateField("fixedOverheads", "erpSystem", {
                  ...config.fixedOverheads.erpSystem,
                  oneTimeCapex: v
                })}
                type="number"
                prefix="₹"
              />
              <InputField
                label="ERP Amortization Period (months)"
                value={config.fixedOverheads.erpSystem.amortizationPeriodMonths}
                onChange={(v) => updateField("fixedOverheads", "erpSystem", {
                  ...config.fixedOverheads.erpSystem,
                  amortizationPeriodMonths: v
                })}
                type="number"
              />
              <InputField
                label="ERP Annual AMC (₹)"
                value={config.fixedOverheads.erpSystem.annualAMC}
                onChange={(v) => updateField("fixedOverheads", "erpSystem", {
                  ...config.fixedOverheads.erpSystem,
                  annualAMC: v
                })}
                type="number"
                prefix="₹"
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Costs</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>ERP Monthly Amortization: <span className="font-semibold">₹{(metrics?.erpMonthlyAmortization ?? 0).toLocaleString()}</span></div>
                <div>ERP Monthly AMC: <span className="font-semibold">₹{(metrics?.erpMonthlyAMC ?? 0).toLocaleString()}</span></div>
                <div className="col-span-2 font-semibold text-blue-900">
                  Total ERP Monthly: <span className="font-bold">₹{(metrics?.erpMonthlyTotal ?? 0).toLocaleString()}</span>
                </div>
                <div className="col-span-2 font-semibold text-blue-900">
                  Fixed Overhead/Wash (Base): <span className="font-bold">₹{(metrics?.fixedOverheadPerWashBase ?? 0).toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "laundry" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Laundry / Sanitisation Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField
                label="Washing Machine Monthly Depreciation (₹)"
                value={config.laundrySettings.bulkWashingMachineMonthlyDepreciation}
                onChange={(v) => updateField("laundrySettings", "bulkWashingMachineMonthlyDepreciation", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Disinfectant/Supplies (₹/month)"
                value={config.laundrySettings.disinfectantSuppliesPerMonth}
                onChange={(v) => updateField("laundrySettings", "disinfectantSuppliesPerMonth", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Transport/Logistics (₹/month)"
                value={config.laundrySettings.transportLogisticsPerMonth}
                onChange={(v) => updateField("laundrySettings", "transportLogisticsPerMonth", v)}
                type="number"
                prefix="₹"
              />
              <InputField
                label="Packaged Bags/Labelling (₹/month)"
                value={config.laundrySettings.packagedBagsLabellingPerMonth}
                onChange={(v) => updateField("laundrySettings", "packagedBagsLabellingPerMonth", v)}
                type="number"
                prefix="₹"
              />
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Calculated Costs</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>Total Laundry/Month: <span className="font-semibold">₹{(metrics?.totalLaundryCostPerMonth ?? 0).toLocaleString()}</span></div>
                <div>Laundry Cost/Wash (Base): <span className="font-semibold">₹{(metrics?.laundryCostPerWash ?? 0).toFixed(4)}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuration Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Organization</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Washers:</span>
                    <span className="font-semibold">{summary.organization.totalWashers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Supervisors:</span>
                    <span className="font-semibold">{summary.organization.totalSupervisors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Ops Managers:</span>
                    <span className="font-semibold">{summary.organization.totalOpsManagers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">City Managers:</span>
                    <span className="font-semibold">{summary.organization.cityManagers}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Throughput</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Working Days/Month:</span>
                    <span className="font-semibold">{summary.throughput.workingDaysPerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Units/Washer/Day:</span>
                    <span className="font-semibold">{summary.throughput.baseUnitsPerWasherPerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Base Washes/Month:</span>
                    <span className="font-semibold">{(summary?.throughput?.totalBaseWashesPerMonth ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Total Washes/Month:</span>
                    <span className="font-semibold">{(summary?.throughput?.maxTotalWashesPerMonth ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Labour Costs (Base)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Washer Cost/Wash:</span>
                    <span className="font-semibold">₹{(summary?.costs?.washerCostPerWashBase ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Management Overhead:</span>
                    <span className="font-semibold">₹{(summary?.costs?.managementOverheadPerWash ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Total Labour/Wash:</span>
                    <span>₹{(summary?.costs?.totalLabourCostPerWashBase ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Other Costs</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cloth Cost/Wash:</span>
                    <span className="font-semibold">₹{(summary?.costs?.clothCostPerWash ?? 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equipment Cost/Wash:</span>
                    <span className="font-semibold">₹{(summary.costs.sprayGunCostPerWash + summary.costs.vacuumCostPerWash).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Laundry Cost/Wash:</span>
                    <span className="font-semibold">₹{(summary?.costs?.laundryCostPerWash ?? 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fixed Overhead/Wash:</span>
                    <span className="font-semibold">₹{(summary?.costs?.fixedOverheadPerWashBase ?? 0).toFixed(4)}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Incentives</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">4W Rate/Unit:</span>
                    <span className="font-semibold">₹{summary.incentives.fourWheelerRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">2W Rate/Unit:</span>
                    <span className="font-semibold">₹{summary.incentives.twoWheelerRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Add-On Rate/Unit:</span>
                    <span className="font-semibold">₹{summary.incentives.addOnRate}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Blended Rate/Unit:</span>
                    <span>₹{(summary?.incentives?.blendedRate ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Fixed Overheads</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Office & Stationery:</span>
                    <span className="font-semibold">₹{(summary?.overhead?.officeAndStationery ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ERP Monthly Total:</span>
                    <span className="font-semibold">₹{(summary?.overhead?.erpMonthlyTotal ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Total Monthly Overhead:</span>
                    <span>₹{(summary?.overhead?.totalMonthlyOverhead ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
        variant="destructive"
      />
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  type?: "number" | "text";
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  helpText?: string;
}

function InputField({
  label,
  value,
  onChange,
  type = "number",
  step,
  min,
  max,
  prefix,
  helpText,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={min}
          max={max}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            prefix ? "pl-8" : ""
          }`}
        />
      </div>
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
}
