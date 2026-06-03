/**
 * Role-Based Analytics Dashboard Example
 *
 * Demonstrates conditional visibility based on role permissions
 * - Admin: Full access (view, edit, export, all cities)
 * - Manager: View + export (city-scoped data)
 * - Washer: View only (own performance data)
 *
 * @component
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Database,
  Eye,
  Filter,
  Download,
  Edit,
  Settings,
  Users,
  Lock,
} from "lucide-react";
import {
  ViewOnly,
  EditOnly,
  ScopeProtected,
  PermissionBadge,
  ConditionalButton,
  AdminOnly,
  ManagerOnly,
  FieldWorkerOnly,
} from "../auth/ProtectedContent";
import { usePermissions } from "../../hooks/usePermissions";
import { formatCurrency } from "../../lib/formatters";

type City = "ALL" | "SURAT" | "MUMBAI" | "AHMEDABAD";

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  unitsCompleted: number;
}

const MOCK_DATA: DashboardData = {
  totalRevenue: 2720000,
  totalExpenses: 1315000,
  netIncome: 1405000,
  unitsCompleted: 4880,
};

export function RoleBasedAnalyticsDashboard() {
  const [selectedCity, setSelectedCity] = useState<City>("ALL");
  const permissions = usePermissions();

  // Filter cities based on user scope
  const availableCities: City[] = (() => {
    const scope = permissions.getScope("analyticsEngine");
    if (scope === "ALL") {
      return ["ALL", "SURAT", "MUMBAI", "AHMEDABAD"];
    } else if (scope === "CITY") {
      // Only show user's city
      return [permissions.currentCity.toUpperCase() as City];
    } else {
      // OWN or TEAM - no city filter
      return ["ALL"];
    }
  })();


  return (
    <div className="space-y-6 p-6">
      {/* Header with Role Badge */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          </div>
          <PermissionBadge engine="analyticsEngine" showScope={true} />
        </div>
        <p className="text-sm text-muted-foreground">
          Role-based analytics with conditional visibility
        </p>
      </div>

      {/* Engine Label */}
      <ViewOnly engine="analyticsEngine">
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Database className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Data Source: analyticsEngine</p>
            <p className="text-xs text-blue-700">
              Your view is scoped to: <strong>{permissions.getScope("analyticsEngine")}</strong> data
            </p>
          </div>
        </div>
      </ViewOnly>

      {/* City Filter - Only for users with CITY or ALL scope */}
      <ScopeProtected engine="analyticsEngine" requiredScope="CITY" mode="minimum">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">City Filter</CardTitle>
              </div>
              <Badge variant="outline">
                {availableCities.length} {availableCities.length === 1 ? "city" : "cities"} available
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Select
                value={selectedCity}
                onValueChange={(value) => setSelectedCity(value as City)}
                disabled={availableCities.length === 1}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city === "ALL" ? "All Cities" : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCity !== "ALL" && availableCities.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCity("ALL")}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </ScopeProtected>

      {/* Key Metrics - Conditional based on financial access */}
      <ViewOnly engine="analyticsEngine">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Revenue - All roles with analytics view */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  analyticsEngine
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(MOCK_DATA.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
              <p className="text-xs text-blue-600 mt-1">Derived metric</p>
            </CardContent>
          </Card>

          {/* Total Expenses - Admin and Finance roles only */}
          <ViewOnly engine="financeEngine">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <DollarSign className="w-8 h-8 text-red-600" />
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    financeEngine
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">
                  {formatCurrency(MOCK_DATA.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total Expenses</p>
                <p className="text-xs text-red-600 mt-1">Restricted access</p>
              </CardContent>
            </Card>
          </ViewOnly>

          {/* Net Income - Admin only */}
          <AdminOnly>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Admin Only
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(MOCK_DATA.netIncome)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Net Income</p>
                <p className="text-xs text-green-600 mt-1">Admin access only</p>
              </CardContent>
            </Card>
          </AdminOnly>

          {/* Units Completed - All roles */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  operationsEngine
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {MOCK_DATA.unitsCompleted.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Units Completed</p>
              <p className="text-xs text-purple-600 mt-1">Public metric</p>
            </CardContent>
          </Card>
        </div>
      </ViewOnly>

      {/* Action Buttons - Conditional based on permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* View Reports - All roles with analytics view */}
            <ViewOnly engine="analyticsEngine">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </ViewOnly>

            {/* Export Data - Requires export permission */}
            <ConditionalButton
              engine="analyticsEngine"
              permission="export"
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </ConditionalButton>

            {/* Edit Settings - Admin only */}
            <AdminOnly>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Edit Settings
              </Button>
            </AdminOnly>

            {/* Configure Filters - Manager and above */}
            <ManagerOnly>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Configure Filters
              </Button>
            </ManagerOnly>
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Views */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Admin View */}
        <AdminOnly>
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin Control Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit All Data
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Configure Engines
              </Button>
            </CardContent>
          </Card>
        </AdminOnly>

        {/* Manager View */}
        <ManagerOnly>
          <Card className="border-2 border-blue-300">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Manager Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">Your City: {permissions.currentCity}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  View and export city-scoped data
                </p>
              </div>
              <Separator />
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View Team Performance
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export Reports
              </Button>
            </CardContent>
          </Card>
        </ManagerOnly>

        {/* Washer View */}
        <FieldWorkerOnly>
          <Card className="border-2 border-green-300">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                My Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">Scope: Personal Data</p>
                <p className="text-muted-foreground text-xs mt-1">
                  View your own performance metrics
                </p>
              </div>
              <Separator />
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View My Stats
              </Button>
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                <Lock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Export not available</span>
              </div>
            </CardContent>
          </Card>
        </FieldWorkerOnly>
      </div>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Permissions Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Analytics Engine */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <p className="text-sm font-medium">Analytics Engine</p>
                <p className="text-xs text-muted-foreground">Dashboard and reports</p>
              </div>
              <PermissionBadge engine="analyticsEngine" />
            </div>

            {/* Operations Engine */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <p className="text-sm font-medium">Operations Engine</p>
                <p className="text-xs text-muted-foreground">Unit entry and execution</p>
              </div>
              <PermissionBadge engine="operationsEngine" />
            </div>

            {/* Finance Engine */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <p className="text-sm font-medium">Finance Engine</p>
                <p className="text-xs text-muted-foreground">Revenue and expenses</p>
              </div>
              <PermissionBadge engine="financeEngine" />
            </div>

            {/* Payroll Engine */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
              <div>
                <p className="text-sm font-medium">Payroll Engine</p>
                <p className="text-xs text-muted-foreground">Salary and compensation</p>
              </div>
              <PermissionBadge engine="payrollEngine" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
