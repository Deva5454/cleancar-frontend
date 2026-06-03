/**
 * System Audit Dashboard - PHASE 2 Safety Check
 *
 * Comprehensive migration verification dashboard
 * Shows component status, data consistency, dependencies, and safety level
 *
 * ⚠️ READ-ONLY: This component does not modify any data
 */

import { useState } from "react";
import {
  useSystemAudit,
  exportAuditReport,
  getSafetyStatusMessage,
  type MigrationStatus,
  type ConsistencyLevel,
  type EdgeCaseIssue,
} from "../../hooks/useSystemAudit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Progress } from "../ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Database,
  FileCode,
  Activity,
  Shield,
  TrendingUp,
  AlertCircle,
  RefreshCcw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// ==================== HELPER COMPONENTS ====================

function StatusBadge({ status }: { status: MigrationStatus }) {
  const variants = {
    complete: { icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-300", label: "Complete" },
    adapter: { icon: AlertCircle, color: "bg-blue-100 text-blue-800 border-blue-300", label: "Using Adapter" },
    legacy: { icon: XCircle, color: "bg-red-100 text-red-800 border-red-300", label: "Legacy" },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={variant.color}>
      <Icon className="w-3 h-3 mr-1" />
      {variant.label}
    </Badge>
  );
}

function ConsistencyBadge({ level }: { level: ConsistencyLevel }) {
  const variants = {
    match: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "✓ Match" },
    partial: { icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800", label: "⚠ Partial" },
    critical: { icon: XCircle, color: "bg-red-100 text-red-800", label: "✗ Critical" },
  };

  const variant = variants[level];
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={variant.color}>
      <Icon className="w-3 h-3 mr-1" />
      {variant.label}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const variants = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <Badge variant="outline" className={variants[severity]}>
      {severity.toUpperCase()}
    </Badge>
  );
}

// ==================== MAIN COMPONENT ====================

export function SystemAuditDashboard() {
  const audit = useSystemAudit();
  const [activeTab, setActiveTab] = useState("overview");
  const safetyStatus = getSafetyStatusMessage(audit.safetyLevel);

  const handleExportReport = () => {
    const reportJson = exportAuditReport(audit);
    const blob = new Blob([reportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-audit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit report exported successfully");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Audit Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Phase 2 Migration Safety Check - Employee Data Integrity
          </p>
        </div>
        <Button onClick={handleExportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Safety Status Banner */}
      <Alert
        className={
          audit.safetyLevel === "safe"
            ? "bg-green-50 border-green-300"
            : audit.safetyLevel === "review"
            ? "bg-yellow-50 border-yellow-300"
            : "bg-red-50 border-red-300"
        }
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">{safetyStatus.emoji}</div>
          <div className="flex-1">
            <AlertTitle className="text-xl font-bold mb-1">
              {safetyStatus.title}
            </AlertTitle>
            <AlertDescription className="text-base">
              {safetyStatus.description}
            </AlertDescription>
            {!audit.canProceedToPhase3 && (
              <div className="mt-3 p-3 bg-white rounded border border-red-200">
                <p className="font-semibold text-red-800">
                  ⚠️ DO NOT PROCEED TO PHASE 3
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Critical issues must be resolved before removing HRDataContext
                </p>
              </div>
            )}
          </div>
        </div>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checks Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {audit.summary.passed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {audit.summary.warnings}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {audit.summary.criticalIssues}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Issues</p>
                <p className="text-2xl font-bold">{audit.summary.totalIssues}</p>
              </div>
              <Activity className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="data">Data Consistency</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="writes">Write Flows</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration Progress</CardTitle>
              <CardDescription>Overall system migration status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Component Migration */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Component Migration</span>
                  <span className="text-sm text-gray-600">
                    {audit.components.filter((c) => c.status !== "legacy").length} / {audit.components.length}
                  </span>
                </div>
                <Progress
                  value={
                    (audit.components.filter((c) => c.status !== "legacy").length /
                      audit.components.length) *
                    100
                  }
                />
              </div>

              {/* Data Consistency */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Data Consistency</span>
                  <span className="text-sm text-gray-600">
                    {audit.dataConsistency.salaryMapping.percentage}% salary mapped
                  </span>
                </div>
                <Progress value={audit.dataConsistency.salaryMapping.percentage} />
              </div>

              {/* Timestamp */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Last Updated: {new Date(audit.timestamp).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPONENTS TAB */}
        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Component Migration Status</CardTitle>
              <CardDescription>
                Status of all critical components migrated in Phase 2
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component Name</TableHead>
                    <TableHead>Migration Status</TableHead>
                    <TableHead>Data Source</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.components.map((component) => (
                    <TableRow key={component.name}>
                      <TableCell className="font-medium">{component.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={component.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{component.dataSource}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            component.risk === "low"
                              ? "bg-green-100 text-green-800"
                              : component.risk === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {component.risk.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Migration Strategy</AlertTitle>
                <AlertDescription>
                  All components are using the Adapter pattern, which provides dual-read
                  capability from both EmployeeContext and HRDataContext. This ensures
                  backward compatibility during the migration period.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATA CONSISTENCY TAB */}
        <TabsContent value="data" className="space-y-4">
          {/* Employee Count */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Count Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">EmployeeContext</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {audit.dataConsistency.employeeCount.employeeContext}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">HRDataContext</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {audit.dataConsistency.employeeCount.hrDataContext}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-2">
                    <ConsistencyBadge level={audit.dataConsistency.employeeCount.level} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Data Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold">
                    {audit.dataConsistency.salaryMapping.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">With New Salary Structure</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {audit.dataConsistency.salaryMapping.withSalaryNew}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">With Legacy Salary</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {audit.dataConsistency.salaryMapping.withSalaryLegacy}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Mapping Coverage</span>
                  <span>{audit.dataConsistency.salaryMapping.percentage}%</span>
                </div>
                <Progress value={audit.dataConsistency.salaryMapping.percentage} />
              </div>
              <ConsistencyBadge level={audit.dataConsistency.salaryMapping.level} />
            </CardContent>
          </Card>

          {/* Incentive Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Incentive Data Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold">
                    {audit.dataConsistency.incentiveMapping.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">With New Incentive Plan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {audit.dataConsistency.incentiveMapping.withIncentivesNew}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Legacy Incentive Eligible</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {audit.dataConsistency.incentiveMapping.withIncentivesLegacy}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Mapping Coverage</span>
                  <span>{audit.dataConsistency.incentiveMapping.percentage}%</span>
                </div>
                <Progress value={audit.dataConsistency.incentiveMapping.percentage} />
              </div>
              <ConsistencyBadge level={audit.dataConsistency.incentiveMapping.level} />
            </CardContent>
          </Card>

          {/* Missing Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Missing Data Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Without Salary</p>
                  <p className="text-2xl font-bold">
                    {audit.dataConsistency.missingFields.employeesWithoutSalary}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Without Incentives</p>
                  <p className="text-2xl font-bold">
                    {audit.dataConsistency.missingFields.employeesWithoutIncentives}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Without Performance</p>
                  <p className="text-2xl font-bold">
                    {audit.dataConsistency.missingFields.employeesWithoutPerformance}
                  </p>
                </div>
              </div>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Missing fields are optional and may be filled in over time through the
                  employee forms.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEPENDENCIES TAB */}
        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle>Context Dependency Scan</CardTitle>
              <CardDescription>
                Scanning codebase for remaining HRDataContext dependencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">HR System Imports</span>
                    {audit.dependencies.hasHRDataImports ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {audit.dependencies.hasHRDataImports
                      ? "Found imports from hr-system/index.ts"
                      : "No direct HR system imports found"}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">HRData References</span>
                    {audit.dependencies.hasHRDataReferences ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {audit.dependencies.hasHRDataReferences
                      ? "Found HRDataContext references"
                      : "No HRDataContext references found"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold mb-2">Clean Status</p>
                <Badge
                  variant="outline"
                  className={
                    audit.dependencies.cleanStatus === "clean"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {audit.dependencies.cleanStatus === "clean"
                    ? "✓ CLEAN - No dependencies"
                    : "✗ DEPENDENCIES FOUND"}
                </Badge>
              </div>

              {audit.dependencies.affectedFiles.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Affected Files:</p>
                  <div className="space-y-1">
                    {audit.dependencies.affectedFiles.map((file) => (
                      <div key={file} className="p-2 bg-red-50 rounded text-sm font-mono">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WRITE FLOWS TAB */}
        <TabsContent value="writes">
          <Card>
            <CardHeader>
              <CardTitle>Write Flow Validation</CardTitle>
              <CardDescription>
                Verifying where data updates are written
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Write Strategy</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Add Employee</TableCell>
                    <TableCell>
                      <Badge variant="outline">{audit.writeFlow.addEmployee}</Badge>
                    </TableCell>
                    <TableCell>
                      {audit.writeFlow.addEmployee === "dual" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Update Salary</TableCell>
                    <TableCell>
                      <Badge variant="outline">{audit.writeFlow.updateSalary}</Badge>
                    </TableCell>
                    <TableCell>
                      {audit.writeFlow.updateSalary === "dual" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Configure Incentives</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {audit.writeFlow.configureIncentives}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {audit.writeFlow.configureIncentives === "dual" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Dual-Write Strategy</AlertTitle>
                <AlertDescription>
                  All write operations use a dual-write strategy during the migration
                  period. Updates are written to both EmployeeContext (new system) and
                  HRDataContext (legacy system) to ensure backward compatibility.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ISSUES TAB */}
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Edge Cases & Issues</CardTitle>
              <CardDescription>
                Detected issues and suggested fixes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {audit.edgeCases.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-semibold">No Issues Detected</p>
                  <p className="text-gray-600">All data consistency checks passed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {audit.edgeCases.map((issue, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={issue.severity} />
                          <Badge variant="outline">{issue.type.replace("_", " ")}</Badge>
                        </div>
                        {issue.affectedId && (
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {issue.affectedId}
                          </code>
                        )}
                      </div>
                      <p className="text-sm mb-2">{issue.description}</p>
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-800 mb-1">
                          Suggested Fix:
                        </p>
                        <p className="text-xs text-blue-700">{issue.suggestedFix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
