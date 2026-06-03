import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Eye, EyeOff } from "lucide-react";

export function CostTrendsDashboard() {
  const [period, setPeriod] = useState("Last 6 Months");
  const [selectedVehicle, setSelectedVehicle] = useState("All");
  const [showDataTables, setShowDataTables] = useState<{ [key: string]: boolean }>({});

  // Mock data for charts - Updated to new plan structure
  const costTrendData = [
    { id: "oct", month: "Oct", "Water Wash": 72, "Shampoo Wash": 105, "Shampoo+Wax": 162, "Shampoo+Polish": 95 },
    { id: "nov", month: "Nov", "Water Wash": 73, "Shampoo Wash": 107, "Shampoo+Wax": 164, "Shampoo+Polish": 96 },
    { id: "dec", month: "Dec", "Water Wash": 74, "Shampoo Wash": 106, "Shampoo+Wax": 166, "Shampoo+Polish": 97 },
    { id: "jan", month: "Jan", "Water Wash": 73, "Shampoo Wash": 108, "Shampoo+Wax": 167, "Shampoo+Polish": 98 },
    { id: "feb", month: "Feb", "Water Wash": 74, "Shampoo Wash": 109, "Shampoo+Wax": 168, "Shampoo+Polish": 97 },
    { id: "mar", month: "Mar", "Water Wash": 75, "Shampoo Wash": 109, "Shampoo+Wax": 167, "Shampoo+Polish": 98 },
  ];

  const ebitdaData = [
    { id: "oct", month: "Oct", "Water Wash": 48, "Shampoo Wash": 45, "Shampoo+Wax": 58, "Shampoo+Polish": 52 },
    { id: "nov", month: "Nov", "Water Wash": 47, "Shampoo Wash": 46, "Shampoo+Wax": 57, "Shampoo+Polish": 51 },
    { id: "dec", month: "Dec", "Water Wash": 48, "Shampoo Wash": 47, "Shampoo+Wax": 58, "Shampoo+Polish": 52 },
    { id: "jan", month: "Jan", "Water Wash": 49, "Shampoo Wash": 47, "Shampoo+Wax": 57, "Shampoo+Polish": 51 },
    { id: "feb", month: "Feb", "Water Wash": 50, "Shampoo Wash": 48, "Shampoo+Wax": 58, "Shampoo+Polish": 52 },
    { id: "mar", month: "Mar", "Water Wash": 49, "Shampoo Wash": 47, "Shampoo+Wax": 57, "Shampoo+Polish": 52 },
  ];

  const zoneData = [
    { id: "395001", zone: "395001", cost: 115, standard: 108 },
    { id: "395002", zone: "395002", cost: 108, standard: 108 },
    { id: "395003", zone: "395003", cost: 102, standard: 108 },
    { id: "395004", zone: "395004", cost: 110, standard: 108 },
    { id: "395005", zone: "395005", cost: 106, standard: 108 },
  ].sort((a, b) => b.cost - a.cost);

  const costComponentsData = [
    { id: "oct", month: "Oct", Material: 42, Consumable: 12, Manpower: 38, Overhead: 8 },
    { id: "nov", month: "Nov", Material: 43, Consumable: 12, Manpower: 39, Overhead: 8 },
    { id: "dec", month: "Dec", Material: 44, Consumable: 12.5, Manpower: 39, Overhead: 7.5 },
    { id: "jan", month: "Jan", Material: 45, Consumable: 12.5, Manpower: 40, Overhead: 8 },
    { id: "feb", month: "Feb", Material: 46, Consumable: 12.5, Manpower: 40, Overhead: 7.5 },
    { id: "mar", month: "Mar", Material: 45, Consumable: 12.5, Manpower: 43.5, Overhead: 7.7 },
  ];

  const washerEfficiencyData = [
    { id: "ramesh", washer: "Ramesh K.", cost: 112.5, standard: 108.76, variance: 3.74 },
    { id: "mahesh", washer: "Mahesh S.", cost: 110.1, standard: 108.76, variance: 1.34 },
    { id: "dinesh", washer: "Dinesh M.", cost: 109.8, standard: 108.76, variance: 1.04 },
    { id: "suresh", washer: "Suresh P.", cost: 106.2, standard: 108.76, variance: -2.56 },
    { id: "rajesh", washer: "Rajesh T.", cost: 105.5, standard: 108.76, variance: -3.26 },
  ].sort((a, b) => b.variance - a.variance);

  const revenueVsCostData = [
    { id: "water-wash", package: "Water Wash", revenue: 26.88, cost: 75, ebitda: 35.8 },
    { id: "shampoo-wash", package: "Shampoo Wash", revenue: 49.96, cost: 109, ebitda: 45.8 },
    { id: "shampoo-wax", package: "Shampoo+Wax", revenue: 76.88, cost: 167, ebitda: 54.0 },
    { id: "shampoo-polish", package: "Shampoo+Polish", revenue: 26.88, cost: 98, ebitda: 36.5 },
  ];

  const toggleDataTable = (chartId: string) => {
    setShowDataTables((prev) => ({ ...prev, [chartId]: !prev[chartId] }));
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Last 6 Months">Last 6 Months</SelectItem>
            <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
            <SelectItem value="This Year">This Year</SelectItem>
            <SelectItem value="Last Year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts Grid - 2x3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Company Cost per Wash Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Company Cost per Wash Trend</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDataTable("chart1")}
              >
                {showDataTables["chart1"] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showDataTables["chart1"] ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={costTrendData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" />
                  <XAxis
                    key="xaxis"
                    dataKey="id"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const item = costTrendData.find((d) => d.id === value);
                      return item ? item.month : value;
                    }}
                  />
                  <YAxis key="yaxis" tick={{ fontSize: 11 }} />
                  <Tooltip
                    key="tooltip"
                    labelFormatter={(value) => {
                      const item = costTrendData.find((d) => d.id === value);
                      return item ? item.month : value;
                    }}
                  />
                  <Legend key="legend" wrapperStyle={{ fontSize: "11px" }} />
                  <Line key="water-wash-line" type="monotone" dataKey="Water Wash" stroke="#3B82F6" strokeWidth={2} />
                  <Line key="shampoo-wash-line" type="monotone" dataKey="Shampoo Wash" stroke="#10B981" strokeWidth={2} />
                  <Line key="shampoo-wax-line" type="monotone" dataKey="Shampoo+Wax" stroke="#8B5CF6" strokeWidth={2} />
                  <Line key="shampoo-polish-line" type="monotone" dataKey="Shampoo+Polish" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Month</th>
                      <th className="border p-2">Water Wash</th>
                      <th className="border p-2">Shampoo Wash</th>
                      <th className="border p-2">Shampoo+Wax</th>
                      <th className="border p-2">Shampoo+Polish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costTrendData.map((row) => (
                      <tr key={row.month}>
                        <td className="border p-2">{row.month}</td>
                        <td className="border p-2 text-right">₹{row["Water Wash"]}</td>
                        <td className="border p-2 text-right">₹{row["Shampoo Wash"]}</td>
                        <td className="border p-2 text-right">₹{row["Shampoo+Wax"]}</td>
                        <td className="border p-2 text-right">₹{row["Shampoo+Polish"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: EBITDA Margin % by Package */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">EBITDA Margin % by Package</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDataTable("chart2")}
              >
                {showDataTables["chart2"] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showDataTables["chart2"] ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ebitdaData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" />
                  <XAxis
                    key="xaxis"
                    dataKey="id"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const item = ebitdaData.find((d) => d.id === value);
                      return item ? item.month : value;
                    }}
                  />
                  <YAxis key="yaxis" tick={{ fontSize: 11 }} />
                  <Tooltip
                    key="tooltip"
                    labelFormatter={(value) => {
                      const item = ebitdaData.find((d) => d.id === value);
                      return item ? item.month : value;
                    }}
                  />
                  <Legend key="legend" wrapperStyle={{ fontSize: "11px" }} />
                  <ReferenceLine key="refline" y={60} stroke="red" strokeDasharray="3 3" label={{ value: "Target 60%", fontSize: 10 }} />
                  <Bar key="water-wash-bar" dataKey="Water Wash" fill="#3B82F6" />
                  <Bar key="shampoo-wash-bar" dataKey="Shampoo Wash" fill="#10B981" />
                  <Bar key="shampoo-wax-bar" dataKey="Shampoo+Wax" fill="#8B5CF6" />
                  <Bar key="shampoo-polish-bar" dataKey="Shampoo+Polish" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Month</th>
                      <th className="border p-2">Water Wash</th>
                      <th className="border p-2">Shampoo Wash</th>
                      <th className="border p-2">Shampoo+Wax</th>
                      <th className="border p-2">Shampoo+Polish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ebitdaData.map((row) => (
                      <tr key={row.month}>
                        <td className="border p-2">{row.month}</td>
                        <td className="border p-2 text-right">{row["Water Wash"]}%</td>
                        <td className="border p-2 text-right">{row["Shampoo Wash"]}%</td>
                        <td className="border p-2 text-right">{row["Shampoo+Wax"]}%</td>
                        <td className="border p-2 text-right">{row["Shampoo+Polish"]}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Cost per Wash by PIN Code Zone */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Cost per Wash by PIN Code Zone</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDataTable("chart3")}
              >
                {showDataTables["chart3"] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showDataTables["chart3"] ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={zoneData} layout="vertical">
                  <CartesianGrid key="grid" strokeDasharray="3 3" />
                  <XAxis key="xaxis" type="number" tick={{ fontSize: 11 }} />
                  <YAxis key="yaxis" dataKey="zone" type="category" tick={{ fontSize: 11 }} />
                  <Tooltip key="tooltip" />
                  <Bar key="cost-bar" dataKey="cost" fill="#0891B2" name="Actual Cost" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">PIN Code</th>
                      <th className="border p-2">Actual Cost</th>
                      <th className="border p-2">Standard</th>
                      <th className="border p-2">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneData.map((row) => (
                      <tr key={row.zone}>
                        <td className="border p-2">{row.zone}</td>
                        <td className="border p-2 text-right">₹{row.cost}</td>
                        <td className="border p-2 text-right">₹{row.standard}</td>
                        <td className="border p-2 text-right">
                          <span className={row.cost > row.standard ? "text-red-600" : "text-green-600"}>
                            {row.cost > row.standard ? "+" : ""}₹{(row.cost - row.standard).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Cost Components Split Over Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Cost Components Split Over Time</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDataTable("chart4")}
              >
                {showDataTables["chart4"] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showDataTables["chart4"] ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={costComponentsData}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" />
                  <XAxis
                    key="xaxis"
                    dataKey="id"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const item = costComponentsData.find((d) => d.id === value);
                      return item ? item.month : value;
                    }}
                  />
                  <YAxis key="yaxis" tick={{ fontSize: 11 }} />
                  <Tooltip
                    key="tooltip"
                    labelFormatter={(value) => {
                      const item = costComponentsData.find((d) => d.id === value);
                      return item ? item.month : value;
                    }}
                  />
                  <Legend key="legend" wrapperStyle={{ fontSize: "11px" }} />
                  <Area key="material-area" type="monotone" dataKey="Material" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area key="consumable-area" type="monotone" dataKey="Consumable" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area key="manpower-area" type="monotone" dataKey="Manpower" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
                  <Area key="overhead-area" type="monotone" dataKey="Overhead" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Month</th>
                      <th className="border p-2">Material</th>
                      <th className="border p-2">Consumable</th>
                      <th className="border p-2">Manpower</th>
                      <th className="border p-2">Overhead</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costComponentsData.map((row) => (
                      <tr key={row.month}>
                        <td className="border p-2">{row.month}</td>
                        <td className="border p-2 text-right">₹{row.Material}</td>
                        <td className="border p-2 text-right">₹{row.Consumable}</td>
                        <td className="border p-2 text-right">₹{row.Manpower}</td>
                        <td className="border p-2 text-right">₹{row.Overhead}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 5: Washer Cost Efficiency Ranking */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Washer Cost Efficiency Ranking</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDataTable("chart5")}
              >
                {showDataTables["chart5"] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!showDataTables["chart5"] ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={washerEfficiencyData} layout="vertical">
                  <CartesianGrid key="grid" strokeDasharray="3 3" />
                  <XAxis key="xaxis" type="number" tick={{ fontSize: 11 }} />
                  <YAxis key="yaxis" dataKey="washer" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip key="tooltip" />
                  <Bar key="variance-bar" dataKey="variance" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Washer</th>
                      <th className="border p-2">Actual Cost</th>
                      <th className="border p-2">Standard</th>
                      <th className="border p-2">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {washerEfficiencyData.map((row) => (
                      <tr key={row.washer}>
                        <td className="border p-2">{row.washer}</td>
                        <td className="border p-2 text-right">₹{row.cost}</td>
                        <td className="border p-2 text-right">₹{row.standard}</td>
                        <td className="border p-2 text-right">
                          <span className={row.variance > 0 ? "text-red-600" : "text-green-600"}>
                            {row.variance > 0 ? "+" : ""}₹{(row?.variance ?? 0).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 6: Revenue vs Cost vs EBITDA */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Revenue vs Cost vs EBITDA</CardTitle>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Vehicles</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueVsCostData}>
                <CartesianGrid key="grid" strokeDasharray="3 3" />
                <XAxis
                  key="xaxis"
                  dataKey="id"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    const item = revenueVsCostData.find((d) => d.id === value);
                    return item ? item.package : value;
                  }}
                />
                <YAxis key="yaxis" tick={{ fontSize: 11 }} />
                <Tooltip
                  key="tooltip"
                  labelFormatter={(value) => {
                    const item = revenueVsCostData.find((d) => d.id === value);
                    return item ? item.package : value;
                  }}
                />
                <Legend key="legend" wrapperStyle={{ fontSize: "11px" }} />
                <Bar key="revenue-bar" dataKey="revenue" fill="#10B981" name="Revenue/Wash (₹)" />
                <Bar key="cost-bar" dataKey="cost" fill="#EF4444" name="Cost/Wash (₹)" />
                <Bar key="ebitda-bar" dataKey="ebitda" fill="#8B5CF6" name="EBITDA %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}