// Data Diagnostics Component - Use this to debug dashboard data issues
// Add this to any dashboard to see what data is being loaded

import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";
import { kpiData, leads, complaints, washRecords, inventory } from "../../lib/mockData";

export function DataDiagnostics() {
  const { currentRole, currentUser, roleConfig } = useRole();

  const diagnostics = {
    roleContext: {
      status: currentRole ? "✅ OK" : "❌ FAIL",
      currentRole: currentRole || "undefined",
      userName: currentUser?.name || "undefined",
      userCity: currentUser?.city || "undefined",
    },
    roleConfig: {
      status: roleConfig ? "✅ OK" : "❌ FAIL",
      dashboardType: roleConfig?.dashboardType || "undefined",
      canSeeFinancials: roleConfig?.canSeeFinancials !== undefined ? roleConfig.canSeeFinancials : "undefined",
      canApprove: roleConfig?.canApprove !== undefined ? roleConfig.canApprove : "undefined",
      modules: roleConfig?.modules?.length || 0,
    },
    mockData: {
      kpiData: kpiData ? "✅ Loaded" : "❌ Not Loaded",
      totalLeads: kpiData?.totalLeads || "undefined",
      leadsArray: leads?.length || 0,
      complaintsArray: complaints?.length || 0,
      washRecordsArray: washRecords?.length || 0,
      inventoryArray: inventory?.length || 0,
    },
  };

  const allChecks = [
    currentRole !== undefined,
    currentUser !== undefined,
    roleConfig !== undefined,
    kpiData !== undefined,
    leads !== undefined,
  ];

  const passedChecks = allChecks.filter(Boolean).length;
  const totalChecks = allChecks.length;
  const healthStatus = passedChecks === totalChecks ? "HEALTHY" : "ISSUES DETECTED";

  return (
    <Card className="border-2 border-purple-200 bg-purple-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {healthStatus === "HEALTHY" ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-600" />
            )}
            <h3 className="font-bold text-lg">Data Diagnostics</h3>
          </div>
          <Badge variant={healthStatus === "HEALTHY" ? "secondary" : "destructive"}>
            {passedChecks}/{totalChecks} Checks Passed
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Role Context */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Role Context</h4>
              <Badge variant={diagnostics.roleContext.status === "✅ OK" ? "secondary" : "destructive"}>
                {diagnostics.roleContext.status}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Role:</span>
                <span className="font-medium">{diagnostics.roleContext.currentRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User Name:</span>
                <span className="font-medium">{diagnostics.roleContext.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User City:</span>
                <span className="font-medium">{diagnostics.roleContext.userCity}</span>
              </div>
            </div>
          </div>

          {/* Role Config */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Role Configuration</h4>
              <Badge variant={diagnostics.roleConfig.status === "✅ OK" ? "secondary" : "destructive"}>
                {diagnostics.roleConfig.status}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Dashboard Type:</span>
                <span className="font-medium">{diagnostics.roleConfig.dashboardType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Can See Financials:</span>
                <Badge variant={diagnostics.roleConfig.canSeeFinancials ? "secondary" : "outline"}>
                  {String(diagnostics.roleConfig.canSeeFinancials)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Can Approve:</span>
                <Badge variant={diagnostics.roleConfig.canApprove ? "secondary" : "outline"}>
                  {String(diagnostics.roleConfig.canApprove)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Module Access:</span>
                <span className="font-medium">{diagnostics.roleConfig.modules} modules</span>
              </div>
            </div>
          </div>

          {/* Mock Data */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Mock Data Status</h4>
              <Badge variant="secondary">Data Sources</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">KPI Data:</span>
                <span className="font-medium">{diagnostics.mockData.kpiData} (Leads: {diagnostics.mockData.totalLeads})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Leads Array:</span>
                <span className="font-medium">{diagnostics.mockData.leadsArray} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Complaints Array:</span>
                <span className="font-medium">{diagnostics.mockData.complaintsArray} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wash Records:</span>
                <span className="font-medium">{diagnostics.mockData.washRecordsArray} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inventory Items:</span>
                <span className="font-medium">{diagnostics.mockData.inventoryArray} items</span>
              </div>
            </div>
          </div>

          {/* Raw Data Dump */}
          <details className="bg-white p-4 rounded-lg border">
            <summary className="font-semibold cursor-pointer hover:text-blue-600">
              View Raw Data (Debug)
            </summary>
            <pre className="mt-3 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(
                {
                  currentRole,
                  currentUser,
                  roleConfig: {
                    ...roleConfig,
                    modules: roleConfig?.modules,
                  },
                  dataStatus: diagnostics.mockData,
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>

        {/* Warning Messages */}
        {healthStatus !== "HEALTHY" && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-orange-900 mb-1">Issues Detected:</p>
                <ul className="list-disc list-inside space-y-1 text-orange-800">
                  {!currentRole && <li>Role Context is undefined</li>}
                  {!currentUser && <li>Current User is undefined</li>}
                  {!roleConfig && <li>Role Config is undefined</li>}
                  {!kpiData && <li>Mock Data (kpiData) is not loading</li>}
                  {!leads && <li>Leads data is not loading</li>}
                </ul>
                <p className="mt-2 text-xs">
                  <strong>Fix:</strong> Check browser console for errors, verify RoleProvider is wrapping the app,
                  ensure mockData.ts is properly imported.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {healthStatus === "HEALTHY" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-900">
                <strong>All checks passed!</strong> Role context and data are loading correctly.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
