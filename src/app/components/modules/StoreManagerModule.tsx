import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertCircle, AlertTriangle, BarChart3, Edit, FileText, Package, Settings, ShoppingCart, TrendingUp, Users } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { BackButton } from "../ui/back-button";

export function StoreManagerModule() {
  const consumptionTrendData = [
    { week: "Week 1", consumption: 450, id: "week-1" },
    { week: "Week 2", consumption: 520, id: "week-2" },
    { week: "Week 3", consumption: 480, id: "week-3" },
    { week: "Week 4", consumption: 648, id: "week-4" } // 35% increase
  ];

  const regionalConsumption = [
    { region: "Mumbai Central", consumption: 1200, id: "reg-central" },
    { region: "Mumbai Western", consumption: 1050, id: "reg-western" },
    { region: "Mumbai Eastern", consumption: 980, id: "reg-eastern" },
    { region: "Thane", consumption: 850, id: "reg-thane" },
    { region: "Navi Mumbai", consumption: 920, id: "reg-navi" }
  ];

  // REMOVED: Manpower ratio data - operational metric (belongs to Operations Manager)
  // Store Manager should track consumption vs stock/purchase, not vs manpower
  /* const manpowerRatioData = [
    { month: "Oct", manpower: 45, consumption: 420, id: "mp-oct" },
    { month: "Nov", manpower: 48, consumption: 480, id: "mp-nov" },
    { month: "Dec", manpower: 50, consumption: 510, id: "mp-dec" },
    { month: "Jan", manpower: 52, consumption: 550, id: "mp-jan" },
    { month: "Feb", manpower: 55, consumption: 580, id: "mp-feb" },
    { month: "Mar", manpower: 58, consumption: 648, id: "mp-mar" }
  ]; */

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Manager Module</h1>
          <p className="text-sm text-gray-500 mt-1">Inventory management and purchase operations</p>
        </div>
        <div className="flex gap-2">
          <Link to="/store-manager/purchase-order">
            <Button size="sm" variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create PO
            </Button>
          </Link>
          <Link to="/store-manager/grn-entry">
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" />
              GRN Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Unusual Consumption Alert */}
      <Card className="bg-yellow-50 border-yellow-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-bold text-yellow-900">⚠ Unusual Consumption Pattern Detected</p>
              <p className="text-sm text-yellow-700 mt-1">
                Product usage increased 35% compared to last week. Review inventory consumption immediately.
              </p>
              <Button size="sm" variant="outline" className="mt-3 border-yellow-600 text-yellow-800">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - REMOVED: Manpower card (operational metric, not inventory) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Inventory Status</p>
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">248</p>
              <p className="text-xs text-green-600">Items in stock</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Below Min Qty</p>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-orange-600">Reorder needed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Pending PO</p>
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-blue-600">Awaiting approval</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Consumption</p>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">648</p>
              <p className="text-xs text-purple-600">This week</p>
            </div>
          </CardContent>
        </Card>

        {/* REMOVED: Manpower card - operational metric (belongs to Operations Manager)
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Manpower</p>
                <Users className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">58</p>
              <p className="text-xs text-green-600">Active staff</p>
            </div>
          </CardContent>
        </Card>
        */}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Monitoring</TabsTrigger>
          <TabsTrigger value="moq">Min Order Quantity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Product Consumption Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Consumption Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300} key="consumption-trend-area">
                  <AreaChart data={consumptionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" key="grid-consumption-trend" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} key="xaxis-consumption-trend" />
                    <YAxis key="yaxis-consumption-trend" />
                    <Tooltip key="tooltip-consumption-trend" />
                    <Area type="monotone" dataKey="consumption" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} key="area-consumption-week" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Regional Consumption Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regional Consumption Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300} key="regional-consumption-bar">
                  <BarChart data={regionalConsumption}>
                    <CartesianGrid strokeDasharray="3 3" key="grid-regional-consumption" />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} key="xaxis-regional-consumption" />
                    <YAxis key="yaxis-regional-consumption" />
                    <Tooltip key="tooltip-regional-consumption" />
                    <Bar dataKey="consumption" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* REMOVED: Manpower to Consumption Ratio - operational metric
              Store Manager should focus on inventory analytics (stock vs consumption, purchase vs consumption)
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manpower to Consumption Ratio (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} key="manpower-ratio-area">
                <AreaChart data={manpowerRatioData}>
                  <CartesianGrid strokeDasharray="3 3" key="grid-manpower-ratio" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} key="xaxis-manpower-ratio" />
                  <YAxis key="yaxis-manpower-ratio" />
                  <Tooltip key="tooltip-manpower-ratio" />
                  <Legend key="legend-manpower-ratio" />
                  <Area type="monotone" dataKey="manpower" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Manpower Count" key="area-manpower" />
                  <Area type="monotone" dataKey="consumption" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Consumption" key="area-consumption-month" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          */}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to="/store-manager/inventory">
                  <Button variant="outline" className="w-full">
                    <Package className="w-4 h-4 mr-2" />
                    View Inventory
                  </Button>
                </Link>
                <Link to="/store-manager/moq">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Manage MOQ
                  </Button>
                </Link>
                <Link to="/store-manager/purchase-order">
                  <Button variant="outline" className="w-full">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Create PO
                  </Button>
                </Link>
                <Link to="/store-manager/vendor-request">
                  <Button variant="outline" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Request Vendor
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Inventory Monitoring</CardTitle>
                <Link to="/store-manager/inventory">
                  <Button size="sm" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    View Full Inventory
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Access complete inventory stock status, consumption patterns, and reorder alerts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moq" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Minimum Order Quantity Management</CardTitle>
                <Link to="/store-manager/moq">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Manage MOQ Settings
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Edit minimum order quantities for products. Initial MOQ is set by Admin, but Store Manager can modify as needed.
              </p>
              <Badge variant="outline">12 items below minimum quantity</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Detailed analytics with consumption patterns, manpower efficiency, and regional comparisons.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}