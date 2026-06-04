/**
 * Developer Route Directory - Complete Navigation Reference
 * Lists all available routes in the application for easy discovery
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import {
  Search,
  ExternalLink,
  FileText,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Settings,
  Shield,
  Calendar,
  BarChart3,
  Copy,
  CheckCircle,
  Code,
  Folder,
} from "lucide-react";
import { toast } from "sonner";

interface RouteInfo {
  path: string;
  name: string;
  description: string;
  module: string;
  status: "Active" | "New" | "Beta" | "Deprecated";
  component: string;
}

const routes: RouteInfo[] = [
  // Dashboard
  { path: "/", name: "Dashboard", description: "Main application dashboard with KPIs", module: "Core", status: "Active", component: "Dashboard.tsx" },
  
  // User Management
  { path: "/users", name: "User Management", description: "User roles and access control", module: "Core", status: "Active", component: "UserManagement.tsx" },
  
  // CRM
  { path: "/leads", name: "CRM Lead Management", description: "Lead management with advanced filters", module: "CRM", status: "Active", component: "CRMLeadManagementWithFilters.tsx" },
  { path: "/leads-old", name: "CRM Lead Management (Old)", description: "Legacy lead management", module: "CRM", status: "Deprecated", component: "CRMLeadManagement.tsx" },
  { path: "/crm/activity-timeline", name: "Activity Timeline", description: "Lead activity tracking", module: "CRM", status: "Active", component: "ActivityTimelineWrapper.tsx" },
  { path: "/crm/notifications", name: "Notification Center", description: "CRM notifications", module: "CRM", status: "Active", component: "NotificationCenter.tsx" },
  
  // Customer Management
  { path: "/customers", name: "Customer Subscription", description: "Customer subscription management", module: "Customer", status: "Active", component: "CustomerSubscription.tsx" },
  
  // Field Execution
  { path: "/car-washer", name: "Car Washer Execution", description: "Field execution module", module: "Execution", status: "Active", component: "CarWasherExecution.tsx" },
  { path: "/supervisor", name: "Supervisor Module", description: "Supervisor oversight", module: "Execution", status: "Active", component: "SupervisorModule.tsx" },
  { path: "/operations", name: "Operations Manager", description: "Operations management", module: "Execution", status: "Active", component: "OperationsManager.tsx" },
  
  // Complaints
  { path: "/complaints", name: "Complaint Management", description: "Customer complaint handling", module: "Service", status: "Active", component: "ComplaintManagement.tsx" },
  
  // Inventory
  { path: "/inventory", name: "Inventory & Store", description: "Inventory management", module: "Inventory", status: "Active", component: "InventoryStore.tsx" },
  { path: "/inventory/requisition", name: "Material Requisition", description: "Material requisition requests", module: "Inventory", status: "Active", component: "MaterialRequisition.tsx" },
  
  // Store Manager
  { path: "/store-manager", name: "Store Manager Module", description: "Store manager dashboard", module: "Inventory", status: "Active", component: "StoreManagerModule.tsx" },
  { path: "/store-manager/grn-entry", name: "GRN Entry", description: "Goods Receipt Note entry", module: "Inventory", status: "Active", component: "GRNEntry.tsx" },
  { path: "/store-manager/purchase-order", name: "Purchase Order", description: "PO creation", module: "Inventory", status: "Active", component: "PurchaseOrderCreation.tsx" },
  { path: "/store-manager/moq", name: "MOQ Management", description: "Minimum order quantity", module: "Inventory", status: "Active", component: "MOQManagement.tsx" },
  { path: "/store-manager/inventory", name: "Inventory Monitoring", description: "Real-time inventory", module: "Inventory", status: "Active", component: "InventoryMonitoring.tsx" },
  { path: "/store-manager/vendor-request", name: "Vendor Request", description: "Vendor onboarding requests", module: "Inventory", status: "Active", component: "VendorRequest.tsx" },
  
  // Finance
  { path: "/finance", name: "Finance Module", description: "Finance dashboard with P&L", module: "Finance", status: "Active", component: "FinanceModule.tsx" },
  { path: "/finance/chart-of-accounts", name: "Chart of Accounts", description: "COA management", module: "Finance", status: "Active", component: "ChartOfAccounts.tsx" },
  { path: "/finance/revenue-capture", name: "Revenue Capture", description: "Revenue recording system", module: "Finance", status: "Active", component: "RevenueCaptureSystem.tsx" },
  
  // Accounts
  { path: "/accounts", name: "Accounts Module", description: "Accounts dashboard", module: "Finance", status: "Active", component: "AccountsModule.tsx" },
  { path: "/accounts/expense-entry", name: "Expense Entry", description: "Expense recording", module: "Finance", status: "Active", component: "ExpenseEntry.tsx" },
  { path: "/accounts/expense-analytics", name: "Expense Analytics", description: "Expense analysis", module: "Finance", status: "Active", component: "ExpenseAnalytics.tsx" },
  { path: "/accounts/vendor-payment", name: "Vendor Payment", description: "Vendor payment processing", module: "Finance", status: "Active", component: "VendorPayment.tsx" },
  { path: "/accounts/gst-dashboard", name: "GST Dashboard", description: "GST compliance tracking", module: "Finance", status: "Active", component: "GSTDashboard.tsx" },
  
  // HR
  { path: "/hr", name: "HR Module", description: "HR management dashboard", module: "HR", status: "Active", component: "HRModule.tsx" },
  { path: "/hr/professional-leave", name: "Leave Management", description: "Unified leave application and approval system (25 leaves/year)", module: "HR", status: "Active", component: "ProfessionalLeaveManagement.tsx" },
  { path: "/hr/onboarding", name: "Employee Onboarding", description: "Self-service onboarding", module: "HR", status: "Active", component: "EmployeeOnboarding.tsx" },
  { path: "/hr/exit-settlement", name: "Exit & F&F Settlement", description: "Exit and final settlement", module: "HR", status: "Active", component: "ExitFFSettlement.tsx" },
  { path: "/hr/lifecycle-management", name: "Lifecycle Management", description: "Employee lifecycle", module: "HR", status: "Active", component: "EmployeeLifecycleManagement.tsx" },
  { path: "/hr/letters-documents", name: "Letters & Documents", description: "HR letters generation", module: "HR", status: "Active", component: "LettersDocuments.tsx" },
  { path: "/hr/id-card-generator", name: "ID Card Generator", description: "Employee ID card", module: "HR", status: "Active", component: "IDCardGenerator.tsx" },
  { path: "/hr/holiday-management", name: "Holiday Management", description: "Public holiday calendar", module: "HR", status: "Active", component: "HolidayManagement.tsx" },
  { path: "/hr/lifecycle-reports", name: "Lifecycle Reports", description: "HR lifecycle analytics", module: "HR", status: "Active", component: "LifeCycleReports.tsx" },
  { path: "/hr/employee-ledger", name: "Employee Ledger", description: "Complete employment history", module: "HR", status: "Active", component: "EmployeeLedger.tsx" },
  
  // Statutory Forms (NEW)
  { path: "/hr/statutory-forms-onboarding", name: "Statutory Forms Portal", description: "Employee PF & ESIC form submission", module: "HR", status: "New", component: "StatutoryFormsOnboarding.tsx" },
  { path: "/hr/statutory-forms-verification", name: "Statutory Verification", description: "HR verification & filing workflow", module: "HR", status: "New", component: "StatutoryFormsVerification.tsx" },
  { path: "/hr/onboarding-automation", name: "Onboarding Automation", description: "Email/WhatsApp link automation", module: "HR", status: "New", component: "OnboardingAutomation.tsx" },
  
  // Payroll
  { path: "/payroll/configuration", name: "Payroll Configuration", description: "Salary structure setup", module: "Payroll", status: "Active", component: "PayrollConfiguration.tsx" },
  { path: "/payroll/create-salary-structure", name: "Create Salary Structure", description: "New salary structure", module: "Payroll", status: "Active", component: "CreateSalaryStructure.tsx" },

  // Analytics
  { path: "/analytics/dashboard", name: "Analytics Dashboard", description: "Main analytics dashboard with city/cluster drill-down", module: "Analytics", status: "Active", component: "AnalyticsDashboardWithDrillDown.tsx" },
  { path: "/analytics/unit-economics", name: "Unit Economics", description: "Unit economics dashboard", module: "Analytics", status: "Active", component: "UnitEconomicsDashboard.tsx" },
  { path: "/analytics/customer-ltv", name: "Customer LTV", description: "Customer lifetime value", module: "Analytics", status: "Active", component: "CustomerLTVAnalysis.tsx" },
  { path: "/analytics/cac", name: "CAC Dashboard", description: "Customer acquisition cost", module: "Analytics", status: "Active", component: "CACDashboard.tsx" },
  { path: "/analytics/break-even", name: "Break-Even Analysis", description: "Break-even calculations", module: "Analytics", status: "Active", component: "BreakEvenAnalysis.tsx" },
  { path: "/analytics/cost-per-wash", name: "Cost Per Wash Calculator", description: "Enhanced wash cost calculator with charts", module: "Analytics", status: "Active", component: "CostPerWashCalculatorEnhanced.tsx" },
  { path: "/analytics/cost-per-wash-by-plan", name: "Cost by Plan", description: "Cost per wash by subscription plan", module: "Analytics", status: "Active", component: "CostPerWashByPlan.tsx" },
  { path: "/analytics/cost-per-wash-by-consumption", name: "Cost by Consumption", description: "Cost per wash at Washer/Supervisor/City level", module: "Analytics", status: "Active", component: "CostPerWashByConsumption.tsx" },
  { path: "/analytics/cost-per-wash-report", name: "Cost Per Wash Report", description: "Detailed cost reports", module: "Analytics", status: "Active", component: "CostPerWashReport.tsx" },
  
  // Founder
  { path: "/founder/control-tower", name: "Founder Control Tower", description: "Executive dashboard", module: "Founder", status: "Active", component: "FounderControlTower.tsx" },
  { path: "/founder/financial-view", name: "Financial View", description: "Detailed financial view", module: "Founder", status: "Active", component: "DetailedFinancialView.tsx" },
  { path: "/founder/cash-flow", name: "Cash Flow Dashboard", description: "Cash flow analysis", module: "Founder", status: "Active", component: "CashFlowDashboard.tsx" },
  { path: "/founder/marketing-roi", name: "Marketing ROI", description: "Marketing ROI drilldown", module: "Founder", status: "Active", component: "MarketingROIDrilldown.tsx" },
  
  // System
  { path: "/approvals", name: "Approval Center", description: "Centralized approvals", module: "Core", status: "Active", component: "ApprovalCenter.tsx" },
  { path: "/audit-trail", name: "Audit Trail", description: "System audit logs", module: "Core", status: "Active", component: "AuditTrail.tsx" },
  { path: "/performance", name: "Performance Tracking", description: "KPI tracking", module: "Core", status: "Active", component: "PerformanceTracking.tsx" },
  
  // Developer Tools
  { path: "/hr/test-statutory-routes", name: "Test Statutory Routes", description: "Route testing page", module: "Developer", status: "Beta", component: "TestStatutoryRoutes.tsx" },
  { path: "/developer/routes", name: "Route Directory", description: "This page - complete route listing", module: "Developer", status: "New", component: "DeveloperRouteDirectory.tsx" },
];

export function DeveloperRouteDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("All");

  const modules = ["All", ...Array.from(new Set(routes.map((r) => r.module)))];

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === "All" || route.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast.success(`Copied: ${path}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-green-100 text-green-800 border-green-200";
      case "Beta":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Deprecated":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "HR":
        return <Users className="w-4 h-4" />;
      case "Finance":
      case "Payroll":
        return <DollarSign className="w-4 h-4" />;
      case "Inventory":
        return <Package className="w-4 h-4" />;
      case "Analytics":
        return <BarChart3 className="w-4 h-4" />;
      case "CRM":
        return <TrendingUp className="w-4 h-4" />;
      case "Core":
        return <Settings className="w-4 h-4" />;
      case "Developer":
        return <Code className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Back Button */}
      <BackButton to="/hr" label="Back to HR Dashboard" />

      {/* Header */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Developer Route Directory</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Complete navigation reference for CleanCar 360° application
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{routes.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Routes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {routes.filter((r) => r.status === "New").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">New Routes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{modules.length - 1}</div>
              <div className="text-sm text-gray-600 mt-1">Modules</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {routes.filter((r) => r.status === "Active").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Routes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search routes by path, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {modules.map((module) => (
                <Button
                  key={module}
                  variant={selectedModule === module ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedModule(module)}
                  className="flex items-center gap-2"
                >
                  {module !== "All" && getModuleIcon(module)}
                  {module}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filteredRoutes.length} Route{filteredRoutes.length !== 1 ? "s" : ""} Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRoutes.map((route, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(route.module)}
                        <h3 className="font-semibold text-gray-900">{route.name}</h3>
                      </div>
                      <Badge className={getStatusColor(route.status)} variant="outline">
                        {route.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {route.module}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{route.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1 font-mono bg-gray-100 px-2 py-1 rounded">
                        <FileText className="w-3 h-3" />
                        {route.component}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={route.path}>
                      <Button size="sm" className="w-full">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPath(route.path)}
                      className="w-full"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <code className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {route.path}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            New Statutory Forms Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <div className="font-semibold text-sm">Employee Statutory Forms Portal</div>
                <code className="text-xs text-gray-600">/hr/statutory-forms-onboarding</code>
              </div>
              <Link to="/hr/statutory-forms-onboarding">
                <Button size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <div className="font-semibold text-sm">HR Verification Portal</div>
                <code className="text-xs text-gray-600">/hr/statutory-forms-verification</code>
              </div>
              <Link to="/hr/statutory-forms-verification">
                <Button size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <div className="font-semibold text-sm">Onboarding Automation</div>
                <code className="text-xs text-gray-600">/hr/onboarding-automation</code>
              </div>
              <Link to="/hr/onboarding-automation">
                <Button size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}