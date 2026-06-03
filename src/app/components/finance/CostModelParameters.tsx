import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  WORKING_DAYS_PER_MONTH,
  BASE_UNITS_PER_WASHER_PER_DAY,
  WASHERS_PER_TEAM,
  NUMBER_OF_TEAMS,
  TOTAL_WASHERS,
  NUMBER_OF_SUPERVISORS,
  NUMBER_OF_OPS_MANAGERS,
  NUMBER_OF_CITY_MANAGERS,
  EBITDA_FLOOR,
  EBITDA_TARGET,
  EBITDA_ASPIRATIONAL,
  UNIT_WEIGHT,
  MONTHLY_SALARIES,
  INCENTIVE_RATES_PER_UNIT,
  AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY,
  CONSUMABLE_UNIT_COSTS,
  CLOTH_DATA,
  EQUIPMENT_DATA,
  MONTHLY_FIXED_OVERHEAD,
  LAUNDRY_COST_PER_WASH,
  getBaseUnitWashesPerWasher,
  getTotalBaseWashes,
  getLabourCostPerUnitWashBase,
  getLabourCostPerUnitWashWithIncentive,
  DURATION_DISCOUNTS,
} from "../../data/ebitdaCalculations";
import { Info, Users, DollarSign, Settings, TrendingUp } from "lucide-react";

export function CostModelParameters() {
  const baseUnitWashes = getBaseUnitWashesPerWasher();
  const totalBaseWashes = getTotalBaseWashes();
  const labourBase = getLabourCostPerUnitWashBase();
  const labourIncentive = getLabourCostPerUnitWashWithIncentive();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Model Parameters</CardTitle>
          <CardDescription>
            Complete unit economics model - all parameters that drive EBITDA
            calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team Structure</TabsTrigger>
              <TabsTrigger value="labour">Labour Costs</TabsTrigger>
              <TabsTrigger value="consumables">Consumables</TabsTrigger>
              <TabsTrigger value="fixed">Fixed Costs</TabsTrigger>
              <TabsTrigger value="discounts">Duration Discounts</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>EBITDA Floor</CardDescription>
                      <CardTitle className="text-3xl text-red-600">
                        {(EBITDA_FLOOR * 100).toFixed(0)}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">System hard limit</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>EBITDA Target</CardDescription>
                      <CardTitle className="text-3xl text-blue-600">
                        {(EBITDA_TARGET * 100).toFixed(0)}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">
                        Comfortable margin
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>EBITDA Aspirational</CardDescription>
                      <CardTitle className="text-3xl text-green-600">
                        {(EBITDA_ASPIRATIONAL * 100).toFixed(0)}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">
                        High-value bundle goal
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Working Days/Month</CardDescription>
                      <CardTitle className="text-3xl">
                        {WORKING_DAYS_PER_MONTH}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">Mon-Sat schedule</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Unit Model */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Unit Model (Washer-Time Allocation)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="border rounded p-4">
                        <div className="text-sm text-gray-600 mb-1">
                          4-Wheeler
                        </div>
                        <div className="text-2xl font-bold">
                          {UNIT_WEIGHT["4W"]} unit
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Full washer time
                        </p>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-gray-600 mb-1">
                          2-Wheeler
                        </div>
                        <div className="text-2xl font-bold">
                          {UNIT_WEIGHT["2W"]} unit
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          40% of 4W time
                        </p>
                      </div>
                      <div className="border rounded p-4">
                        <div className="text-sm text-gray-600 mb-1">
                          Add-On Service
                        </div>
                        <div className="text-2xl font-bold">
                          {UNIT_WEIGHT["Add-on"]} unit
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Half washer time
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Throughput */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Base Throughput</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Units/Washer/Day</div>
                        <div className="text-xl font-bold">
                          {BASE_UNITS_PER_WASHER_PER_DAY}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Units/Washer/Month</div>
                        <div className="text-xl font-bold">
                          {baseUnitWashes}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Base Washes</div>
                        <div className="text-xl font-bold">
                          {totalBaseWashes.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* EBITDA Formula */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base text-blue-900">
                        EBITDA Formula
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-blue-800 space-y-3">
                    <div>
                      <code className="bg-blue-100 px-2 py-1 rounded">
                        EBITDA % = (Monthly Revenue − Monthly Cost to Company) ÷
                        Monthly Revenue
                      </code>
                    </div>
                    <div className="space-y-1">
                      <p>
                        <strong>Revenue per Wash:</strong> Monthly Price ÷ 26
                        days
                      </p>
                      <p>
                        <strong>Monthly Cost:</strong> Cost per Wash × 26 days
                      </p>
                      <p>
                        <strong>Total Cost per Wash:</strong> Labour +
                        Consumables + Cloth + Equipment + Laundry + Fixed
                        Overhead
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Team Structure */}
            <TabsContent value="team">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Washers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Teams:</span>
                          <span className="font-semibold">
                            {NUMBER_OF_TEAMS}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Washers per Team:</span>
                          <span className="font-semibold">
                            {WASHERS_PER_TEAM}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-semibold">
                            Total Washers:
                          </span>
                          <span className="font-bold text-lg">
                            {TOTAL_WASHERS}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Supervisors:</span>
                          <span className="font-semibold">
                            {NUMBER_OF_SUPERVISORS}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Operations Managers:</span>
                          <span className="font-semibold">
                            {NUMBER_OF_OPS_MANAGERS}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">City Managers:</span>
                          <span className="font-semibold">
                            {NUMBER_OF_CITY_MANAGERS}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base text-blue-900">
                        Team Structure Notes
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-blue-800">
                    <p>
                      Each supervisor manages 17 washers (1 team). Operations
                      Manager oversees all 4 teams ({TOTAL_WASHERS} washers). City
                      Manager oversees entire city operations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Labour Costs */}
            <TabsContent value="labour">
              <div className="space-y-6">
                {/* Monthly Salaries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Monthly CTC (Salary Structure)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Monthly CTC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Washer</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(MONTHLY_SALARIES?.washerCTC ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Supervisor</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(MONTHLY_SALARIES?.supervisorCTC ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Operations Manager</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(MONTHLY_SALARIES?.opsManagerCTC ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>City Manager</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(MONTHLY_SALARIES?.cityManagerCTC ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Labour Cost per Unit-Wash */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Labour Cost per Unit-Wash
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <h4 className="font-semibold mb-3">
                          BASE (No Incentive)
                        </h4>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-sm">Washer</TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourBase?.washer ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">
                                Supervisor
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourBase?.supervisor ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">
                                Ops Manager
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourBase?.opsManager ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">
                                City Manager
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourBase?.cityManager ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-t-2">
                              <TableCell className="font-semibold">
                                Total (4W)
                              </TableCell>
                              <TableCell className="font-bold text-lg">
                                ₹{(labourBase?.total ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-semibold">
                                Total (2W)
                              </TableCell>
                              <TableCell className="font-bold">
                                ₹{(labourBase.total * 0.4).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">WITH INCENTIVE</h4>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-sm">Washer</TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourIncentive?.washer ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">
                                Supervisor
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourIncentive?.supervisor ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">
                                Ops Manager
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourIncentive?.opsManager ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="text-sm">
                                City Manager
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                ₹{(labourIncentive?.cityManager ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-t-2">
                              <TableCell className="font-semibold">
                                Total (4W)
                              </TableCell>
                              <TableCell className="font-bold text-lg">
                                ₹{(labourIncentive?.total ?? 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-semibold">
                                Total (2W)
                              </TableCell>
                              <TableCell className="font-bold">
                                ₹{(labourIncentive.total * 0.4).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Incentive Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Incentive Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Rates per Unit (above {BASE_UNITS_PER_WASHER_PER_DAY}{" "}
                          base units/day)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <div className="border rounded p-3">
                            <div className="text-sm text-gray-600">
                              4-Wheeler
                            </div>
                            <div className="text-xl font-bold">
                              ₹{INCENTIVE_RATES_PER_UNIT["4W"]}
                            </div>
                            <div className="text-xs text-gray-500">per unit</div>
                          </div>
                          <div className="border rounded p-3">
                            <div className="text-sm text-gray-600">
                              2-Wheeler
                            </div>
                            <div className="text-xl font-bold">
                              ₹{INCENTIVE_RATES_PER_UNIT["2W"]}
                            </div>
                            <div className="text-xs text-gray-500">per unit</div>
                          </div>
                          <div className="border rounded p-3">
                            <div className="text-sm text-gray-600">Add-On</div>
                            <div className="text-xl font-bold">
                              ₹{INCENTIVE_RATES_PER_UNIT["Add-on"]}
                            </div>
                            <div className="text-xs text-gray-500">per unit</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Average Scenario:</strong>{" "}
                          {AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY} extra
                          units/washer/day → ₹
                          {(
                            AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY *
                            WORKING_DAYS_PER_MONTH *
                            INCENTIVE_RATES_PER_UNIT["4W"]
                          ).toLocaleString()}
                          /month avg incentive (4W benchmark)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Consumables */}
            <TabsContent value="consumables">
              <div className="space-y-6">
                {/* Unit Costs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Consumable Unit Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Cost per ml</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Tyre Wax</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(CONSUMABLE_UNIT_COSTS?.tyreWaxPerMl ?? 0).toFixed(2)}/ml
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Shampoo</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(CONSUMABLE_UNIT_COSTS?.shampooPerMl ?? 0).toFixed(2)}/ml
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Exterior Wax</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(CONSUMABLE_UNIT_COSTS?.exteriorWaxPerMl ?? 0).toFixed(2)}
                            /ml
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Interior Wax</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(CONSUMABLE_UNIT_COSTS?.interiorWaxPerMl ?? 0).toFixed(2)}
                            /ml
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Cloth Costs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cloth Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Microfibre Cloth Cost</TableCell>
                          <TableCell className="font-semibold">
                            ₹{CLOTH_DATA.microfibreClothCost}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Cloth Life (washes)</TableCell>
                          <TableCell className="font-semibold">
                            {CLOTH_DATA.microfibreClothLifeWashes} washes
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Cloths per Car per Wash</TableCell>
                          <TableCell className="font-semibold">
                            {CLOTH_DATA.clothsPerCarPerWash} (glass + shampoo +
                            dry)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Wax Sponge Cost</TableCell>
                          <TableCell className="font-semibold">
                            ₹{CLOTH_DATA.waxSpongeCost}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Interior Cloth Cost</TableCell>
                          <TableCell className="font-semibold">
                            ₹{CLOTH_DATA.interiorClothCost}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-t-2">
                          <TableCell className="font-semibold">
                            Cost per Wash (calculated)
                          </TableCell>
                          <TableCell className="font-bold">
                            ₹
                            {(
                              (CLOTH_DATA.microfibreClothCost /
                                CLOTH_DATA.microfibreClothLifeWashes) *
                                CLOTH_DATA.clothsPerCarPerWash +
                              CLOTH_DATA.waxSpongeCost / baseUnitWashes
                            ).toFixed(3)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Equipment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Equipment Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Pressure Spray Gun</TableCell>
                          <TableCell>
                            ₹{(EQUIPMENT_DATA?.pressureSprayGun?.cost ?? 0).toLocaleString()}{" "}
                            (life: {EQUIPMENT_DATA.pressureSprayGun.lifeMonths}{" "}
                            months)
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹
                            {(
                              EQUIPMENT_DATA.pressureSprayGun.cost /
                              EQUIPMENT_DATA.pressureSprayGun.lifeMonths /
                              baseUnitWashes
                            ).toFixed(3)}
                            /wash
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Vacuum Cleaner</TableCell>
                          <TableCell>
                            ₹{(EQUIPMENT_DATA?.vacuumCleaner?.cost ?? 0).toLocaleString()}{" "}
                            (life: {EQUIPMENT_DATA.vacuumCleaner.lifeMonths}{" "}
                            months)
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹
                            {(
                              EQUIPMENT_DATA.vacuumCleaner.cost /
                              EQUIPMENT_DATA.vacuumCleaner.lifeMonths /
                              baseUnitWashes
                            ).toFixed(3)}
                            /wash
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Laundry */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Other Variable Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <div className="flex justify-between py-2">
                        <span>Laundry Cost per Wash:</span>
                        <span className="font-semibold">
                          ₹{LAUNDRY_COST_PER_WASH.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Fixed Costs */}
            <TabsContent value="fixed">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Monthly Fixed Overhead
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Office Rent</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(MONTHLY_FIXED_OVERHEAD?.officeRent ?? 0).toLocaleString()}
                            /month
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>ERP Licence</TableCell>
                          <TableCell className="font-semibold">
                            ₹{(MONTHLY_FIXED_OVERHEAD?.erpLicence ?? 0).toLocaleString()}
                            /month
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-t-2">
                          <TableCell className="font-semibold">
                            Total Fixed Overhead
                          </TableCell>
                          <TableCell className="font-bold text-lg">
                            ₹
                            {(
                              MONTHLY_FIXED_OVERHEAD.officeRent +
                              MONTHLY_FIXED_OVERHEAD.erpLicence
                            ).toLocaleString()}
                            /month
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div>
                      <h4 className="font-semibold mb-3">
                        Fixed Overhead per Wash
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="border rounded p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            BASE Scenario
                          </div>
                          <div className="text-xl font-bold">
                            ₹
                            {(
                              MONTHLY_FIXED_OVERHEAD.officeRent / totalBaseWashes
                            ).toFixed(3)}
                            /wash
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {totalBaseWashes.toLocaleString()} total washes
                          </p>
                        </div>
                        <div className="border rounded p-4">
                          <div className="text-sm text-gray-600 mb-1">
                            WITH INCENTIVE Scenario
                          </div>
                          <div className="text-xl font-bold">
                            ₹
                            {(
                              (MONTHLY_FIXED_OVERHEAD.officeRent +
                                MONTHLY_FIXED_OVERHEAD.erpLicence) /
                              (totalBaseWashes *
                                (1 +
                                  AVERAGE_EXTRA_UNITS_PER_WASHER_PER_DAY /
                                    BASE_UNITS_PER_WASHER_PER_DAY))
                            ).toFixed(3)}
                            /wash
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Higher throughput dilutes fixed costs
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Duration Discounts */}
            <TabsContent value="discounts">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Multi-Duration Billing Discounts
                  </CardTitle>
                  <CardDescription>
                    Default discount structure for different billing durations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Duration</TableHead>
                        <TableHead>Months</TableHead>
                        <TableHead>Discount %</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead>EBITDA Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DURATION_DISCOUNTS.map((duration) => (
                        <TableRow key={duration.duration}>
                          <TableCell className="font-medium">
                            {duration.duration}
                          </TableCell>
                          <TableCell>{duration.months}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                duration.discountPercentage === 0
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {duration.discountPercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            base × {duration.months} ×{" "}
                            {(1 - duration.discountPercentage / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {duration.discountPercentage === 0
                              ? "No change"
                              : `~${duration.discountPercentage}% margin compression`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 bg-orange-50 border border-orange-200 rounded p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      System Requirement
                    </h4>
                    <p className="text-sm text-orange-800">
                      The pricing engine must recalculate EBITDA for every
                      duration option. If applying a discount takes any plan
                      below the 30% EBITDA floor, that duration option must be
                      greyed out for the TSE.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
