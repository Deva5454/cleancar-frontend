/**
 * Cost Configuration Settings
 * Master configuration for all cost calculations
 * Includes Standard Duration for manpower cost calculation
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Settings, Package, Users, DollarSign, Clock, Save } from "lucide-react";
import { toast } from "sonner";

export function CostConfigurationSettings() {
  // Material Costs
  const [materialCosts, setMaterialCosts] = useState([
    { product: "Car Shampoo", cost: 8.5 },
    { product: "Wheel Cleaner", cost: 5.2 },
    { product: "Tire Shine", cost: 3.8 },
    { product: "Dashboard Polish", cost: 4.5 },
    { product: "Glass Cleaner", cost: 3.2 },
  ]);

  // Consumable Costs by Package
  const [consumableCosts, setConsumableCosts] = useState([
    { package: "Basic", cost: 10.5 },
    { package: "Premium", cost: 12.5 },
    { package: "Elite", cost: 15.2 },
    { package: "Interior", cost: 18.5 },
    { package: "Elite Plus", cost: 22.8 },
  ]);

  // Manpower Costs with Standard Duration
  const [manpowerCosts, setManpowerCosts] = useState([
    { package: "Basic", standardDuration: 25, costPerMinute: 1.17 },
    { package: "Premium", standardDuration: 30, costPerMinute: 1.17 },
    { package: "Elite", standardDuration: 35, costPerMinute: 1.17 },
    { package: "Interior", standardDuration: 45, costPerMinute: 1.17 },
    { package: "Elite Plus", standardDuration: 50, costPerMinute: 1.17 },
  ]);

  // Overhead Costs
  const [overheadCosts, setOverheadCosts] = useState([
    { component: "Transportation/Fuel", costPerWash: 4.2 },
    { component: "Equipment Depreciation", costPerWash: 2.5 },
    { component: "Admin Overhead", costPerWash: 1.8 },
  ]);

  // Global EBITDA Target
  const [ebitdaTarget, setEBITDATarget] = useState(60);

  const handleSave = () => {
    toast.success("Cost configuration saved successfully!");
    toast.info(
      "All calculators and reports will automatically update with the new values"
    );
  };

  const updateMaterialCost = (index: number, cost: number) => {
    const updated = [...materialCosts];
    updated[index].cost = cost;
    setMaterialCosts(updated);
  };

  const updateConsumableCost = (index: number, cost: number) => {
    const updated = [...consumableCosts];
    updated[index].cost = cost;
    setConsumableCosts(updated);
  };

  const updateManpowerCost = (
    index: number,
    field: "standardDuration" | "costPerMinute",
    value: number
  ) => {
    const updated = [...manpowerCosts];
    updated[index][field] = value;
    setManpowerCosts(updated);
  };

  const updateOverheadCost = (index: number, cost: number) => {
    const updated = [...overheadCosts];
    updated[index].costPerWash = cost;
    setOverheadCosts(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-blue-600" />
          Cost Configuration
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Master cost settings - Changes here cascade through all calculators and
          reports in real-time
        </p>
      </div>

      <Tabs defaultValue="material" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="material">Material</TabsTrigger>
          <TabsTrigger value="consumable">Consumable</TabsTrigger>
          <TabsTrigger value="manpower">Manpower</TabsTrigger>
          <TabsTrigger value="overhead">Overhead</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
        </TabsList>

        {/* Material Costs */}
        <TabsContent value="material">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Material Costs (Per Wash)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Cost per Wash (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialCosts.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.product}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.1"
                          value={item.cost}
                          onChange={(e) =>
                            updateMaterialCost(idx, parseFloat(e.target.value))
                          }
                          className="w-32 ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell>Total Material Cost (if all used)</TableCell>
                    <TableCell className="text-right text-blue-600">
                      ₹
                      {materialCosts
                        .reduce((sum, item) => sum + item.cost, 0)
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumable Costs */}
        <TabsContent value="consumable">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Consumable Costs by Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-right">
                      Consumable Cost per Wash (₹)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumableCosts.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.package}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.1"
                          value={item.cost}
                          onChange={(e) =>
                            updateConsumableCost(idx, parseFloat(e.target.value))
                          }
                          className="w-32 ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manpower Costs with Standard Duration */}
        <TabsContent value="manpower">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Manpower Costs & Standard Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Standard Duration is used to calculate expected manpower cost. If
                actual job duration exceeds standard by more than 10 minutes, a
                duration variance flag is raised.
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        Standard Duration (min)
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      Cost per Minute (₹)
                    </TableHead>
                    <TableHead className="text-right">
                      Standard Manpower Cost (₹)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manpowerCosts.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.package}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="1"
                          value={item.standardDuration}
                          onChange={(e) =>
                            updateManpowerCost(
                              idx,
                              "standardDuration",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-24 ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.costPerMinute}
                          onChange={(e) =>
                            updateManpowerCost(
                              idx,
                              "costPerMinute",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24 ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ₹
                        {(item.standardDuration * item.costPerMinute).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overhead Costs */}
        <TabsContent value="overhead">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                Overhead Costs (Per Wash)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Cost per Wash (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overheadCosts.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.component}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.1"
                          value={item.costPerWash}
                          onChange={(e) =>
                            updateOverheadCost(idx, parseFloat(e.target.value))
                          }
                          className="w-32 ml-auto"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-amber-50 font-bold">
                    <TableCell>Total Overhead Cost</TableCell>
                    <TableCell className="text-right text-amber-600">
                      ₹
                      {overheadCosts
                        .reduce((sum, item) => sum + item.costPerWash, 0)
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Targets */}
        <TabsContent value="targets">
          <Card>
            <CardHeader>
              <CardTitle>Global Cost Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Target EBITDA Margin (%)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="number"
                    step="1"
                    value={ebitdaTarget}
                    onChange={(e) => setEBITDATarget(parseInt(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600">
                    This target is applied globally across all calculators, reports,
                    and charts
                  </span>
                </div>
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Impact of Changes
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Changing EBITDA target updates all charts, badges, and
                      recommendations instantly
                    </li>
                    <li>
                      • Cost configuration changes cascade through all calculators
                      automatically
                    </li>
                    <li>
                      • Standard Duration affects manpower cost calculation for every
                      job
                    </li>
                    <li>
                      • Material cost changes affect actual cost tracking when washers
                      submit job reports
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="bg-green-600 hover:bg-green-700">
          <Save className="w-5 h-5 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
