// Router Configuration - FIXED: Removed bad imports (Updated: 2026-03-26)
import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { GlobalFiltersProvider } from "./components/navigation/GlobalFilterBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RootLayoutWrapper } from "./components/layouts/RootLayoutWrapper";

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

// Lazy-loaded heavy components for code splitting
const OnboardingPortal = lazy(() => import("./components/OnboardingPortal"));
const HRModule = lazy(() => import("./components/modules/HRModule"));
const ProfessionalLeaveManagement = lazy(() => import("./components/hr/ProfessionalLeaveManagement"));
const StatutoryFormsOnboarding = lazy(() => import("./components/hr/StatutoryFormsOnboarding"));
const TravelReimbursementModule = lazy(() => import("./components/travel/TravelReimbursementModule"));
const ChartOfAccounts = lazy(() => import("./components/finance/ChartOfAccounts"));
const AdminPlanManagement = lazy(() => import("./components/subscription/AdminPlanManagement"));
const IncentiveConfiguration = lazy(() => import("./components/incentives/IncentiveConfiguration"));

// Analytics module - all lazy loaded
const UnitEconomicsDashboard = lazy(() => import("./components/analytics/UnitEconomicsDashboard"));
const CustomerLTVAnalysis = lazy(() => import("./components/analytics/CustomerLTVAnalysis"));
const CACDashboard = lazy(() => import("./components/analytics/CACDashboard"));
const BreakEvenAnalysis = lazy(() => import("./components/analytics/BreakEvenAnalysis"));
const CostPerWashCalculatorEnhanced = lazy(() => import("./components/analytics/CostPerWashCalculatorEnhanced"));
const CostPerWashByPlan = lazy(() => import("./components/analytics/CostPerWashByPlan"));
const CostPerWashByConsumption = lazy(() => import("./components/analytics/CostPerWashByConsumption"));
const LabourCostPerWash = lazy(() => import("./components/analytics/LabourCostPerWash"));
const EmployeeEfficiency = lazy(() => import("./components/analytics/EmployeeEfficiency"));
const CityComparison = lazy(() => import("./components/analytics/CityComparison"));

// R3 FIX: Founder module properly lazy-loaded (was importing eagerly despite "NOW LAZY" comments)
const FounderControlTower  = lazy(() => import("./components/founder/FounderControlTower"));
const DetailedFinancialView = lazy(() => import("./components/founder/DetailedFinancialView"));
const CashFlowDashboard    = lazy(() => import("./components/founder/CashFlowDashboard"));
const MarketingROIDrilldown = lazy(() => import("./components/founder/MarketingROIDrilldown"));

// Keep these as regular imports (frequently accessed)
// import { OnboardingPortal } from "./components/OnboardingPortal"; // NOW LAZY
import { OnboardingRedirect } from "./components/onboarding/OnboardingRedirect";
import { DevOnlyRoute } from "./components/guards/DevOnlyRoute";
import { Dashboard } from "./components/Dashboard";
import { UserManagement } from "./components/modules/UserManagement";
import { CRMLeadManagementWithFilters } from "./components/modules/CRMLeadManagementWithFilters";
import { CRMConversionAnalyticsDashboard } from "./components/modules/CRMConversionAnalyticsDashboard";
import { CustomerSubscription } from "./components/modules/CustomerSubscription";
import { SupervisorModuleUpdated } from "./components/modules/SupervisorModuleUpdated";
import { OperationsManagerApp } from "./components/om/OperationsManagerApp";
import { ComplaintManagement } from "./components/modules/ComplaintManagement";
import { InventoryStore } from "./components/modules/InventoryStore";
import { MaterialRequisition } from "./components/inventory/MaterialRequisition";
import { WasherIssuances } from "./components/inventory/WasherIssuances";
import { WasherStockLedger } from "./components/inventory/WasherStockLedger";
import { MonthEndVerification } from "./components/inventory/MonthEndVerification";
import { MyStock } from "./components/washer/MyStock";
import { StoreModule } from "./components/modules/StoreModule";
import { ProcurementModule } from "./components/modules/ProcurementModule";
const FinanceModule = lazy(() => import("./components/modules/FinanceModule"));
import { RevenueCaptureSystem } from "./components/finance/RevenueCaptureSystem";
import { PackageCostMatrix } from "./components/finance/PackageCostMatrix";
import { CostPerWashModule } from "./components/finance/CostPerWashModule";
import { ActualCostInputs } from "./components/finance/ActualCostInputs";
import { FinanceTransactions } from "./components/finance/FinanceTransactions";
import { LedgerEntriesView } from "./components/finance/LedgerEntriesView";
import { FinanceAnalyticsDashboard } from "./components/finance/FinanceAnalyticsDashboard";
import { FinancialReportsModule } from "./components/finance/FinancialReportsModule";
import { LeavePolicyEngine } from "./components/hr/LeavePolicyEngine";
import { EmployeeOnboarding } from "./components/hr/EmployeeOnboarding";
import { ExitFFSettlement } from "./components/hr/ExitFFSettlement";
import { EmployeeLifecycleManagement } from "./components/hr/EmployeeLifecycleManagement";
import { LettersDocuments } from "./components/hr/LettersDocuments";
import { IDCardGenerator } from "./components/hr/IDCardGenerator";
import { HolidayManagement } from "./components/hr/HolidayManagement";
import { LifeCycleReports } from "./components/hr/LifeCycleReports";
import { EmployeeLedger } from "./components/hr/EmployeeLedger";
import { StatutoryFormsVerification } from "./components/hr/StatutoryFormsVerification";
import { OnboardingAutomation } from "./components/hr/OnboardingAutomation";
import { EmployeeSalaryAssignment } from "./components/payroll/EmployeeSalaryAssignment";
import { EmployeeSelfService } from "./components/hr/EmployeeSelfService";
import { AttendanceDataManager } from "./components/admin/AttendanceDataManager";
import { ApprovalCenter } from "./components/hr/ApprovalCenter";
const ApprovalCenterHR = ApprovalCenter;
import { TestStatutoryRoutes } from "./components/TestStatutoryRoutes";
import { DeveloperRouteDirectory } from "./components/developer/DeveloperRouteDirectory";
import { ApprovalCenter } from "./components/ApprovalCenter";
import { AuditTrail } from "./components/AuditTrail";
import { SystemAuditDashboard } from "./components/audit/SystemAuditDashboard";
import { PerformanceTracking } from "./components/performance/PerformanceTracking";
import { AccountsModule } from "./components/modules/AccountsModule";
import { ExpenseEntry } from "./components/accounts/ExpenseEntry";
import { ExpenseAnalytics } from "./components/accounts/ExpenseAnalytics";
import { VendorPayment } from "./components/accounts/VendorPayment";
import { GSTDashboard } from "./components/accounts/GSTDashboard";
import { AccountingEntry } from "./components/accounts/AccountingEntry";
import { JournalEntry } from "./components/accounts/JournalEntry";
import { AccountsDashboard } from "./components/accounts/AccountsDashboard";
import { AccountingTransactionList } from "./components/accounts/AccountingTransactionList";
import { AccountsLedger } from "./components/accounts/AccountsLedger";
import { PartyLedger } from "./components/accounts/PartyLedger";
import { TrialBalance } from "./components/accounts/TrialBalance";
import { BalanceSheet } from "./components/accounts/BalanceSheet";
import { LedgerMaster } from "./components/accounts/LedgerMaster";
import { RazorpayFlow } from "./components/accounts/RazorpayFlow";
import { ExpenseVoucher } from "./components/accounts/ExpenseVoucher";
import { ItemMaster } from "./components/accounts/ItemMaster";
import { GSTR2AReport } from "./components/accounts/GSTR2AReport";
import { PurchaseSummaryReport } from "./components/accounts/PurchaseSummaryReport";
import { SalesSummaryReport } from "./components/accounts/SalesSummaryReport";
import { RCMReport } from "./components/accounts/RCMReport";
import { StoreManagerModule } from "./components/modules/StoreManagerModule";
import { GRNEntry } from "./components/store-manager/GRNEntry";
import { PurchaseOrderCreation } from "./components/store-manager/PurchaseOrderCreation";
import { MOQManagement } from "./components/store-manager/MOQManagement";
import { InventoryMonitoring } from "./components/store-manager/InventoryMonitoring";
import { VendorRequest } from "./components/store-manager/VendorRequest";
import { AnalyticsDashboardWithDrillDown } from "./components/dashboards/AnalyticsDashboardWithDrillDown";
import { RoleBasedAnalyticsDashboard } from "./components/examples/RoleBasedAnalyticsDashboard";
import { CostPerWashReport } from "./components/reports/CostPerWashReport";
import { ActivityTimelineWrapper } from "./components/crm/ActivityTimelineWrapper";
import { NotificationCenter } from "./components/crm/NotificationCenter";
import { PayrollConfiguration } from "./components/payroll/PayrollConfiguration";
import { PayrollConfigTest } from "./components/payroll/PayrollConfigTest";
import { PayrollRun } from "./components/payroll/PayrollRun";
import { PayrollProcessing } from "./components/payroll/PayrollProcessing";
import { PayrollProcessingAdvanced } from "./components/payroll/PayrollProcessingAdvanced";
import { PayrollReviewApproval } from "./components/payroll/PayrollReviewApproval";
import { SalaryPayableView } from "./components/payroll/SalaryPayableView";
import { SalaryPaymentScreen } from "./components/payroll/SalaryPaymentScreen";
import { StatutoryPayablesScreen } from "./components/payroll/StatutoryPayablesScreen";
import { PlanEditor } from "./components/subscription/PlanEditor";
import { CommunicationTemplates } from "./components/settings/CommunicationTemplates";
import { CostConfiguration } from "./components/settings/CostConfiguration";
import { ServiceZonesManagement } from "./components/modules/ServiceZonesManagement";
import { WasherJobExecution } from "./components/modules/WasherJobExecution";
import { ExpansionOpportunities } from "./components/modules/ExpansionOpportunities";
import { SupplierDetail } from "./components/procurement/SupplierDetail";
import { CostTrackingIntegrationDemo } from "./components/demo/CostTrackingIntegrationDemo";
import { DesignSystemTest } from "./design-system/tests/DesignSystemTest";
import { ClothExchange } from "./components/cloth-tracking/ClothExchange";
import { ClothAdminDashboard } from "./components/cloth-tracking/ClothAdminDashboard";
import { AdvanceTypeSelection } from "./components/advance/AdvanceTypeSelection";
import { LongTermAdvanceForm } from "./components/advance/LongTermAdvanceForm";
import { ShortTermAdvanceForm } from "./components/advance/ShortTermAdvanceForm";
import { EmployeeAdvanceDashboard } from "./components/advance/EmployeeAdvanceDashboard";
import { AdvanceDetailView } from "./components/advance/AdvanceDetailView";
import { HRAdvanceManagement } from "./components/advance/HRAdvanceManagement";
import { OtherEarningsModule } from "./components/advance/OtherEarningsModule";
import { OtherDeductionsModule } from "./components/advance/OtherDeductionsModule";
import { AdjustmentsReport } from "./components/advance/AdjustmentsReport";
import { WorkflowControlDemo } from "./components/workflow/WorkflowControlDemo";
import { IncentiveEngineDemo } from "./components/workflow/IncentiveEngineDemo";
import { WeekOffCoverDemo } from "./components/washer/WeekOffCoverDemo";
import { SystemIntegrationDemo } from "./components/washer/SystemIntegrationDemo";
import { WasherCoreScreensDemo } from "./components/washer/WasherCoreScreensDemo";
import { WasherCoreScreensConnected } from "./components/washer/WasherCoreScreensConnected";
const SupervisorAppConnected = lazy(() => import("./components/supervisor/SupervisorAppConnected"));
import { SupervisorLayout } from "./components/supervisor/SupervisorLayout";
import { ClusterManagerApp } from "./components/cm/ClusterManagerApp";
import { CityManagerApp } from "./components/city/CityManagerApp";
import { TeleSalesManagerApp } from "./components/tsm/TeleSalesManagerApp";
import { SalesHeadApp } from "./components/sh/SalesHeadApp";
import { SalesManagerApp } from "./components/sm/SalesManagerApp";
import { TeleSalesExecutiveApp } from "./components/tse/TeleSalesExecutiveApp";
import { TSEDiagnostics } from "./components/tse/TSEDiagnostics";
import { CustomerCareExecutiveApp } from "./components/cce/CustomerCareExecutiveApp";
import { SubscriptionApp } from "./components/subscription/SubscriptionApp";
import { PlanSelectionScreen } from "./components/subscription/PlanSelectionScreen";
import { CustomerPlanPage } from "./components/subscription/CustomerPlanPage";
import { SuperAdminPlanEditor } from "./components/admin/SuperAdminPlanEditor";
import { SubscriptionDiagnostics } from "./components/subscription/SubscriptionDiagnostics";
import { HierarchyDashboard } from "./components/hierarchy/HierarchyDashboard";
import { WasherAttendanceHistory } from "./components/washer/WasherAttendanceHistory";
import { OperationsRouter } from "./components/operations/OperationsRouter";
import { OperationsDataCapture } from "./components/operations/OperationsDataCapture";
import { OperationsLayout } from "./components/operations/OperationsLayout";
import { ClientPortal } from "./components/client/ClientPortal";
import { WorkingHoursSetup } from "./components/workforce/WorkingHoursSetup";
import { WorkingHoursTest } from "./components/workforce/WorkingHoursTest";
import { WorkingHoursSimple } from "./components/workforce/WorkingHoursSimple";
import { WorkforceDiagnostic } from "./components/workforce/WorkforceDiagnostic";
import { IncentiveSimulator } from "./components/incentives/IncentiveSimulator";
import { IncentiveDashboard } from "./components/incentives/IncentiveDashboard";
import { HRPayrollApproval } from "./components/hr/HRPayrollApproval";
import { SuperAdminPayrollApproval } from "./components/admin/SuperAdminPayrollApproval";
import { CityManagement } from "./components/admin/CityManagement";
import { BusinessRulesPage } from "./components/admin/BusinessRulesPage";
import { ShiftManagementPage } from "./components/admin/ShiftManagementPage";
import { AttendanceFraudAlertsPage } from "./components/admin/AttendanceFraudAlertsPage";
import { PermissionManagementPage } from "./components/admin/PermissionManagementPage";
import { RolePermissionManager } from "./components/admin/RolePermissionManager";
import { IncentiveVisibilityAdmin } from "./components/admin/IncentiveVisibilityAdmin";
import { RoleSuggestionsPage } from "./components/hr/RoleSuggestionsPage";
import { HRIntelligenceDashboard } from "./components/hr/HRIntelligenceDashboard";
import { AccountsPayrollProcessing } from "./components/accounts/AccountsPayrollProcessing";
import { GSTOverview } from "./components/gst/GSTOverview";
import { GSTVendorMaster } from "./components/gst/GSTVendorMaster";
import { GSTCustomerMaster } from "./components/gst/GSTCustomerMaster";
import { GSTTransactionEntry } from "./components/gst/GSTTransactionEntry";
import { GSTValidationCentre } from "./components/gst/GSTValidationCentre";
import { GSTManagerReview } from "./components/gst/GSTManagerReview";
import { GSTReconciliation } from "./components/gst/GSTReconciliation";
import { GSTReports } from "./components/gst/GSTReports";
import { TransactionSubTypeManager } from "./components/gst/TransactionSubTypeManager";
import { GSTR1Module } from "./components/gst/GSTR1Module";
import { GSTR3BModule } from "./components/gst/GSTR3BModule";
import { GSTFilingModule } from "./components/gst/GSTFilingModule";
import { GSTMonitoringModule } from "./components/gst/GSTMonitoringModule";
import { BusinessFlowDemo } from "./components/BusinessFlowDemo";
import { UnauthorizedPage } from "./components/pages/UnauthorizedPage";
import { LoginPage } from "./pages/LoginPage";
import { MobileChangeRequest } from "./components/hr/MobileChangeRequest";
import { MyAccountPage } from "./components/hr/MyAccountPage";
// import { ChartOfAccounts } from "./components/finance/ChartOfAccounts"; // NOW LAZY
// import { HRModule } from "./components/modules/HRModule"; // NOW LAZY
// import { ProfessionalLeaveManagement } from "./components/hr/ProfessionalLeaveManagement"; // NOW LAZY
// import { StatutoryFormsOnboarding } from "./components/hr/StatutoryFormsOnboarding"; // NOW LAZY
// Phase 1 Accounting Entry System
const TDSPayableModule = lazy(() => import("./components/accounts/TDSPayableModule"));
const AdvanceTaxCalculator = lazy(() => import("./components/accounts/AdvanceTaxCalculator"));
const PayablesDashboard = lazy(() => import("./components/accounts/PayablesDashboard"));
// Phase 3 Accounting Reports
// Analytics imports - NOW LAZY
// import { UnitEconomicsDashboard } from "./components/analytics/UnitEconomicsDashboard"; // NOW LAZY
// import { CustomerLTVAnalysis } from "./components/analytics/CustomerLTVAnalysis"; // NOW LAZY
// import { CACDashboard } from "./components/analytics/CACDashboard"; // NOW LAZY
// import { BreakEvenAnalysis } from "./components/analytics/BreakEvenAnalysis"; // NOW LAZY
// import { CostPerWashCalculatorEnhanced } from "./components/analytics/CostPerWashCalculatorEnhanced"; // NOW LAZY
// import { CostPerWashByPlan } from "./components/analytics/CostPerWashByPlan"; // NOW LAZY
// import { CostPerWashByConsumption } from "./components/analytics/CostPerWashByConsumption"; // NOW LAZY
// import { LabourCostPerWash } from "./components/analytics/LabourCostPerWash"; // NOW LAZY
// import { EmployeeEfficiency } from "./components/analytics/EmployeeEfficiency"; // NOW LAZY
// import { CityComparison } from "./components/analytics/CityComparison"; // NOW LAZY
// Founder module imports - NOW LAZY
// import { FounderControlTower } from "./components/founder/FounderControlTower"; // NOW LAZY
// import { DetailedFinancialView } from "./components/founder/DetailedFinancialView"; // NOW LAZY
// import { CashFlowDashboard } from "./components/founder/CashFlowDashboard"; // NOW LAZY
// import { MarketingROIDrilldown } from "./components/founder/MarketingROIDrilldown"; // NOW LAZY
// import { CreateSalaryStructure } from "./components/payroll/CreateSalaryStructure"; // NOW LAZY
// R2 FIX: test-btl-service file may not exist — converted to lazy with error boundary
// import { AdminPlanManagement } from "./components/subscription/AdminPlanManagement"; // NOW LAZY
// import { IncentiveConfiguration } from "./components/incentives/IncentiveConfiguration"; // NOW LAZY

// Lazy-loaded components
const CreateSalaryStructure = lazy(() => import("./components/payroll/CreateSalaryStructure"));

























const InvoiceManagement = lazy(() => import("./components/finance/InvoiceManagement"));
const InvoiceDetail = lazy(() => import("./components/finance/InvoiceDetail"));
const PaymentManagement = lazy(() => import("./components/finance/PaymentManagement"));


































































































const TestBTLService = lazy(() => import("./test-btl-service").catch(() => ({ default: () => null })));

















































export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  // Standalone Onboarding Portal routes (no header/sidebar) - MUST come FIRST
  {
    path: "/onboarding/:empId",
    element: <ErrorBoundary><OnboardingPortal /></ErrorBoundary>,
  },
  {
    path: "/onboard/:empId",
    element: <OnboardingRedirect />,
  },
  // Main application routes with layout
  {
    path: "/",
    element: <RootLayoutWrapper />,
    errorElement: (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 p-8"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><span className="text-red-600 text-xl font-bold">!</span></div><h2 className="text-lg font-semibold text-gray-900">Page Error</h2><p className="text-sm text-gray-500">This page has an error. Other pages still work.</p><a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm">Go to Dashboard</a></div>),
    children: [
      { index: true, element: <ErrorBoundary><Dashboard /></ErrorBoundary> },

      // CRM index — nav parent /crm has no route
      {
        path: "crm",
        element: <Navigate to="/leads" replace />
      },

      // Payroll index — nav parent /payroll has no route
      {
        path: "payroll",
        element: <Navigate to="/payroll/run" replace />
      },

      // Admin index — nav parent /admin has no route
      {
        path: "admin",
        element: <Navigate to="/admin/city-management" replace />
      },

      // Reports index — nav parent /reports has no route
      {
        path: "reports",
        element: <Navigate to="/finance/reports" replace />
      },

      // Operations-management — the Operations nav section points here but route doesn't exist
      {
        path: "operations-management",
        element: <Navigate to="/operations" replace />
      },

      { path: "business-flow-demo", element: <DevOnlyRoute element={<BusinessFlowDemo />} /> },
      { path: "users", element: <ErrorBoundary><UserManagement /></ErrorBoundary> },
      { path: "leads", element: <ErrorBoundary><CRMLeadManagementWithFilters /></ErrorBoundary> },
      { path: "customers", element: <ErrorBoundary><CustomerSubscription /></ErrorBoundary> },
      { path: "car-washer", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "supervisor", element: <ErrorBoundary><SupervisorModuleUpdated /></ErrorBoundary> },
      // Operations layout route with children
      {
        path: "operations",
        element: <OperationsLayout />,
        children: [
          { index: true, element: <ErrorBoundary><OperationsRouter /></ErrorBoundary> },
          { path: "data-capture", element: <ErrorBoundary><OperationsDataCapture /></ErrorBoundary> },
        ]
      },
      { path: "complaints", element: <ErrorBoundary><ComplaintManagement /></ErrorBoundary> },
      { path: "inventory", element: <ErrorBoundary><InventoryStore /></ErrorBoundary> },
      { path: "inventory/requisition", element: <ErrorBoundary><MaterialRequisition /></ErrorBoundary> },
      { path: "inventory/washer-issuances", element: <ErrorBoundary><WasherIssuances /></ErrorBoundary> },
      { path: "inventory/washer-stock-ledger", element: <ErrorBoundary><WasherStockLedger /></ErrorBoundary> },
      { path: "inventory/month-end-verification", element: <ErrorBoundary><MonthEndVerification /></ErrorBoundary> },
      { path: "inventory/my-stock", element: <ErrorBoundary><MyStock /></ErrorBoundary> },
      { path: "store", element: <ErrorBoundary><StoreModule /></ErrorBoundary> },
      { path: "procurement", element: <ErrorBoundary><ProcurementModule /></ErrorBoundary> },
      { path: "finance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><FinanceModule /></Suspense></ErrorBoundary> },
      { path: "finance/analytics", element: <ErrorBoundary><FinanceAnalyticsDashboard /></ErrorBoundary> },
      { path: "finance/reports", element: <ErrorBoundary><FinancialReportsModule /></ErrorBoundary> },
      { path: "finance/transactions", element: <ErrorBoundary><FinanceTransactions /></ErrorBoundary> },
      { path: "finance/ledger-entries", element: <ErrorBoundary><LedgerEntriesView /></ErrorBoundary> },
      { path: "finance/chart-of-accounts", element: <ErrorBoundary><ChartOfAccounts /></ErrorBoundary> },
      { path: "finance/invoices", element: <ErrorBoundary><InvoiceManagement /></ErrorBoundary> },
      { path: "finance/invoices/:id", element: <ErrorBoundary><InvoiceDetail /></ErrorBoundary> },
      { path: "finance/payments", element: <ErrorBoundary><PaymentManagement /></ErrorBoundary> },
      { path: "finance/revenue-capture", element: <ErrorBoundary><RevenueCaptureSystem /></ErrorBoundary> },
      { path: "finance/package-cost-matrix", element: <ErrorBoundary><PackageCostMatrix /></ErrorBoundary> },
      { path: "finance/cost-per-wash", element: <ErrorBoundary><CostPerWashModule /></ErrorBoundary> },
      { path: "finance/cost-per-wash/actual-inputs", element: <ErrorBoundary><ActualCostInputs /></ErrorBoundary> },
      { path: "hr", element: <ErrorBoundary><HRModule /></ErrorBoundary> },
      { path: "hr/leave", element: <Navigate to="/hr/professional-leave" replace /> },
      { path: "hr/enhanced-leave", element: <Navigate to="/hr/professional-leave" replace /> },
      { path: "hr/professional-leave", element: <ErrorBoundary><ProfessionalLeaveManagement /></ErrorBoundary> },
      { path: "hr/leave-policy-engine", element: <ErrorBoundary><LeavePolicyEngine /></ErrorBoundary> },
      { path: "hr/onboarding", element: <ErrorBoundary><EmployeeOnboarding /></ErrorBoundary> },
      { path: "hr/exit-settlement", element: <ErrorBoundary><ExitFFSettlement /></ErrorBoundary> },
      { path: "hr/lifecycle-management", element: <ErrorBoundary><EmployeeLifecycleManagement /></ErrorBoundary> },
      { path: "hr/letters-documents", element: <ErrorBoundary><LettersDocuments /></ErrorBoundary> },
      { path: "hr/id-card-generator", element: <ErrorBoundary><IDCardGenerator /></ErrorBoundary> },
      { path: "hr/holiday-management", element: <ErrorBoundary><HolidayManagement /></ErrorBoundary> },
      { path: "hr/lifecycle-reports", element: <ErrorBoundary><LifeCycleReports /></ErrorBoundary> },
      { path: "hr/employee-ledger", element: <ErrorBoundary><EmployeeLedger /></ErrorBoundary> },
      { path: "hr/statutory-forms-onboarding", element: <ErrorBoundary><StatutoryFormsOnboarding /></ErrorBoundary> },
      { path: "hr/statutory-forms-verification", element: <ErrorBoundary><StatutoryFormsVerification /></ErrorBoundary> },
      { path: "hr/onboarding-automation", element: <ErrorBoundary><OnboardingAutomation /></ErrorBoundary> },
      { path: "hr/self-service", element: <ErrorBoundary><EmployeeSelfService /></ErrorBoundary> },
      { path: "hr/approval-center", element: <ErrorBoundary><ApprovalCenterHR /></ErrorBoundary> },
      { path: "hr/payroll-approval", element: <ErrorBoundary><HRPayrollApproval /></ErrorBoundary> },
      { path: "hr/attendance-data-manager", element: <ErrorBoundary><AttendanceDataManager /></ErrorBoundary> },
      { path: "hr/test-statutory-routes", element: <DevOnlyRoute element={<TestStatutoryRoutes />} /> },
      { path: "hr/developer-routes", element: <DevOnlyRoute element={<DeveloperRouteDirectory />} /> },
      { path: "approvals", element: <ErrorBoundary><ApprovalCenter /></ErrorBoundary> },
      { path: "audit-trail", element: <ErrorBoundary><AuditTrail /></ErrorBoundary> },
      { path: "system-audit", element: <DevOnlyRoute element={<SystemAuditDashboard />} /> },
      { path: "performance", element: <ErrorBoundary><PerformanceTracking /></ErrorBoundary> },
      { path: "accounts", element: <ErrorBoundary><AccountsModule /></ErrorBoundary> },
      { path: "accounts/expense-entry", element: <ErrorBoundary><ExpenseEntry /></ErrorBoundary> },
      { path: "accounts/expense-analytics", element: <ErrorBoundary><ExpenseAnalytics /></ErrorBoundary> },
      { path: "accounts/vendor-payment", element: <ErrorBoundary><VendorPayment /></ErrorBoundary> },
      { path: "accounts/gst-dashboard", element: <ErrorBoundary><GSTDashboard /></ErrorBoundary> },
      { path: "accounts/gst-sub-types", element: <ErrorBoundary><TransactionSubTypeManager /></ErrorBoundary> },
      { path: "accounts/payroll-processing", element: <ErrorBoundary><AccountsPayrollProcessing /></ErrorBoundary> },
      { path: "accounts/accounting-entry", element: <ErrorBoundary><AccountingEntry /></ErrorBoundary> },
      { path: "accounts/expense-voucher", element: <ErrorBoundary><ExpenseVoucher /></ErrorBoundary> },
      { path: "accounts/item-master", element: <ErrorBoundary><ItemMaster /></ErrorBoundary> },
      { path: "accounts/payables", element: <ErrorBoundary><PayablesDashboard /></ErrorBoundary> },
      { path: "accounts/tds-payable", element: <ErrorBoundary><TDSPayableModule /></ErrorBoundary> },
      { path: "accounts/advance-tax", element: <ErrorBoundary><AdvanceTaxCalculator /></ErrorBoundary> },
      { path: "accounts/journal-entry", element: <ErrorBoundary><JournalEntry /></ErrorBoundary> },
      { path: "accounts/dashboard", element: <ErrorBoundary><AccountsDashboard /></ErrorBoundary> },
      { path: "accounts/transactions", element: <ErrorBoundary><AccountingTransactionList /></ErrorBoundary> },
      { path: "accounts/ledger", element: <ErrorBoundary><AccountsLedger /></ErrorBoundary> },
      { path: "accounts/party-ledger", element: <ErrorBoundary><PartyLedger /></ErrorBoundary> },
      { path: "accounts/ledger-master", element: <ErrorBoundary><LedgerMaster /></ErrorBoundary> },
      { path: "accounts/razorpay-flow", element: <ErrorBoundary><RazorpayFlow /></ErrorBoundary> },
      { path: "accounts/trial-balance", element: <ErrorBoundary><TrialBalance /></ErrorBoundary> },
      { path: "accounts/balance-sheet", element: <ErrorBoundary><BalanceSheet /></ErrorBoundary> },
      { path: "accounts/gstr2a", element: <ErrorBoundary><GSTR2AReport /></ErrorBoundary> },
      { path: "accounts/reports/purchase", element: <ErrorBoundary><PurchaseSummaryReport /></ErrorBoundary> },
      { path: "accounts/reports/sales", element: <ErrorBoundary><SalesSummaryReport /></ErrorBoundary> },
      { path: "accounts/reports/rcm", element: <ErrorBoundary><RCMReport /></ErrorBoundary> },
      { path: "gst", element: <ErrorBoundary><GSTOverview /></ErrorBoundary> },
      { path: "gst/vendors", element: <ErrorBoundary><GSTVendorMaster /></ErrorBoundary> },
      { path: "gst/customers", element: <ErrorBoundary><GSTCustomerMaster /></ErrorBoundary> },
      { path: "gst/transactions", element: <ErrorBoundary><GSTTransactionEntry /></ErrorBoundary> },
      { path: "gst/validation", element: <ErrorBoundary><GSTValidationCentre /></ErrorBoundary> },
      { path: "gst/review", element: <ErrorBoundary><GSTManagerReview /></ErrorBoundary> },
      { path: "gst/reconciliation", element: <ErrorBoundary><GSTReconciliation /></ErrorBoundary> },
      { path: "gst/reports", element: <ErrorBoundary><GSTReports /></ErrorBoundary> },
      { path: "gst/gstr1", element: <ErrorBoundary><GSTR1Module /></ErrorBoundary> },
      { path: "gst/gstr3b", element: <ErrorBoundary><GSTR3BModule /></ErrorBoundary> },
      { path: "gst/filing", element: <ErrorBoundary><GSTFilingModule /></ErrorBoundary> },
      { path: "gst/monitoring", element: <ErrorBoundary><GSTMonitoringModule /></ErrorBoundary> },
      { path: "admin/payroll-approval", element: <ErrorBoundary><SuperAdminPayrollApproval /></ErrorBoundary> },
      { path: "admin/city-management", element: <ErrorBoundary><CityManagement /></ErrorBoundary> },
      { path: "admin/business-rules", element: <ErrorBoundary><BusinessRulesPage /></ErrorBoundary> },
      { path: "admin/shift-management", element: <ErrorBoundary><ShiftManagementPage /></ErrorBoundary> }, // MC-10
      { path: "admin/fraud-alerts", element: <ErrorBoundary><AttendanceFraudAlertsPage /></ErrorBoundary> }, // MC-09
      { path: "admin/permissions", element: <ErrorBoundary><PermissionManagementPage /></ErrorBoundary> }, // MC-11
      { path: "admin/role-permissions", element: <ErrorBoundary><RolePermissionManager /></ErrorBoundary> }, // MC-11 Enhanced: Base role overrides + custom sub-roles
      { path: "admin/incentive-visibility", element: <ErrorBoundary><IncentiveVisibilityAdmin /></ErrorBoundary> }, // Super Admin: show/hide incentive tab per role/employee
      { path: "hr/role-suggestions", element: <ErrorBoundary><RoleSuggestionsPage /></ErrorBoundary> }, // MC-12
      { path: "hr/intelligence-dashboard", element: <ErrorBoundary><HRIntelligenceDashboard /></ErrorBoundary> },
      { path: "store-manager", element: <ErrorBoundary><StoreManagerModule /></ErrorBoundary> },
      { path: "store-manager/grn-entry", element: <ErrorBoundary><GRNEntry /></ErrorBoundary> },
      { path: "store-manager/purchase-order", element: <ErrorBoundary><PurchaseOrderCreation /></ErrorBoundary> },
      { path: "store-manager/moq", element: <ErrorBoundary><MOQManagement /></ErrorBoundary> },
      { path: "store-manager/inventory", element: <ErrorBoundary><InventoryMonitoring /></ErrorBoundary> },
      { path: "store-manager/vendor-request", element: <ErrorBoundary><VendorRequest /></ErrorBoundary> },
      {
        path: "analytics",
        element: <GlobalFiltersProvider><Outlet /></GlobalFiltersProvider>,
        children: [
          { index: true, element: <Navigate to="/analytics/dashboard" replace /> },
          { path: "dashboard", element: <ErrorBoundary><AnalyticsDashboardWithDrillDown /></ErrorBoundary> },
          { path: "unit-economics", element: <ErrorBoundary><UnitEconomicsDashboard /></ErrorBoundary> },
          { path: "customer-ltv", element: <ErrorBoundary><CustomerLTVAnalysis /></ErrorBoundary> },
          { path: "cac", element: <ErrorBoundary><CACDashboard /></ErrorBoundary> },
          { path: "break-even", element: <ErrorBoundary><BreakEvenAnalysis /></ErrorBoundary> },
          { path: "package-cost-matrix", element: <Navigate to="/finance/package-cost-matrix" replace /> },

          // PHASE 3: Consolidated Cost Module Routes
          // Main dashboard: /finance/cost-per-wash (CostPerWashModule)
          // Specialized views:
          { path: "cost-by-plan", element: <ErrorBoundary><CostPerWashByPlan /></ErrorBoundary> },
          { path: "cost-by-consumption", element: <ErrorBoundary><CostPerWashByConsumption /></ErrorBoundary> },
          { path: "labour-cost", element: <ErrorBoundary><LabourCostPerWash /></ErrorBoundary> },
          { path: "cost-report", element: <ErrorBoundary><CostPerWashReport /></ErrorBoundary> },

          // Legacy redirects for backward compatibility
          { path: "cost-per-wash", element: <Navigate to="/finance/cost-per-wash" replace /> },
          // R4 FIX: /unit-economics/ doesn't exist in route tree — removed
          { path: "cost-per-wash-by-plan", element: <Navigate to="/analytics/cost-by-plan" replace /> },
          { path: "cost-per-wash-by-consumption", element: <Navigate to="/analytics/cost-by-consumption" replace /> },
          { path: "labour-cost-per-wash", element: <Navigate to="/analytics/labour-cost" replace /> },
          { path: "cost-per-wash-report", element: <Navigate to="/analytics/cost-report" replace /> },

          { path: "employee-efficiency", element: <ErrorBoundary><EmployeeEfficiency /></ErrorBoundary> },
          { path: "city-comparison", element: <ErrorBoundary><CityComparison /></ErrorBoundary> },
          { path: "role-based-demo", element: <DevOnlyRoute element={<RoleBasedAnalyticsDashboard />} /> },
        ]
      },
      { path: "founder/control-tower", element: <ErrorBoundary><FounderControlTower /></ErrorBoundary> },
      { path: "founder/financial-view", element: <ErrorBoundary><DetailedFinancialView /></ErrorBoundary> },
      { path: "founder/cash-flow", element: <ErrorBoundary><CashFlowDashboard /></ErrorBoundary> },
      { path: "founder/marketing-roi", element: <ErrorBoundary><MarketingROIDrilldown /></ErrorBoundary> },
      { path: "crm/activity-timeline", element: <ErrorBoundary><ActivityTimelineWrapper /></ErrorBoundary> },
      { path: "crm/notifications", element: <ErrorBoundary><NotificationCenter /></ErrorBoundary> },
      { path: "crm/conversion-analytics", element: <ErrorBoundary><CRMConversionAnalyticsDashboard /></ErrorBoundary> },
      { path: "payroll/test", element: <DevOnlyRoute element={<PayrollConfigTest />} /> },
      { path: "payroll/configuration", element: <ErrorBoundary><PayrollConfiguration /></ErrorBoundary> },
      { path: "payroll/create-salary-structure", element: <ErrorBoundary><CreateSalaryStructure /></ErrorBoundary> },
      { path: "payroll/salary-assignment", element: <ErrorBoundary><EmployeeSalaryAssignment /></ErrorBoundary> },
      { path: "payroll/run", element: <ErrorBoundary><PayrollRun /></ErrorBoundary> },
      { path: "payroll/processing", element: <Navigate to="/payroll/run" replace /> },
      { path: "payroll/processing-basic", element: <Navigate to="/payroll/run" replace /> },
      { path: "payroll/review-approval", element: <ErrorBoundary><PayrollReviewApproval /></ErrorBoundary> },
      { path: "payroll/salary-payables", element: <ErrorBoundary><SalaryPayableView /></ErrorBoundary> },
      { path: "payroll/salary-payment", element: <ErrorBoundary><SalaryPaymentScreen /></ErrorBoundary> },
      { path: "payroll/statutory-payables", element: <ErrorBoundary><StatutoryPayablesScreen /></ErrorBoundary> },
      {
        path: "subscription",
        element: <Outlet />,
        children: [
          { index: true, element: <Navigate to="/subscription/plan-management" replace /> },
          { path: "plan-management", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdminPlanManagement userRole="ADMIN" /></Suspense></ErrorBoundary> },
          { path: "plan-editor", element: <ErrorBoundary><PlanEditor /></ErrorBoundary> },
        ]
      },
      { path: "settings/communication-templates", element: <ErrorBoundary><CommunicationTemplates /></ErrorBoundary> },
      { path: "settings/cost-configuration", element: <ErrorBoundary><CostConfiguration /></ErrorBoundary> },
      { path: "service-zones", element: <ErrorBoundary><ServiceZonesManagement /></ErrorBoundary> },
      { path: "washer-jobs", element: <ErrorBoundary><WasherJobExecution /></ErrorBoundary> },
      { path: "expansion-opportunities", element: <ErrorBoundary><ExpansionOpportunities /></ErrorBoundary> },
      { path: "procurement/supplier/:supplierId", element: <ErrorBoundary><SupplierDetail /></ErrorBoundary> },
      { path: "demo/cost-tracking-integration", element: <DevOnlyRoute element={<CostTrackingIntegrationDemo />} /> },
      { path: "design-system-test", element: <DevOnlyRoute element={<DesignSystemTest />} /> },
      // Cloth Tracking System
      { path: "cloth-tracking/exchange", element: <ErrorBoundary><ClothExchange /></ErrorBoundary> },
      { path: "cloth-tracking/admin", element: <ErrorBoundary><ClothAdminDashboard /></ErrorBoundary> },
      // Advance Management System
      { path: "advance", element: <ErrorBoundary><AdvanceTypeSelection /></ErrorBoundary> },
      { path: "advance/long-term/apply", element: <ErrorBoundary><LongTermAdvanceForm /></ErrorBoundary> },
      { path: "advance/short-term/apply", element: <ErrorBoundary><ShortTermAdvanceForm /></ErrorBoundary> },
      { path: "advance/my-advances", element: <ErrorBoundary><EmployeeAdvanceDashboard /></ErrorBoundary> },
      { path: "advance/status/:advanceId", element: <ErrorBoundary><AdvanceDetailView /></ErrorBoundary> },
      { path: "advance/hr-management", element: <ErrorBoundary><HRAdvanceManagement /></ErrorBoundary> },
      { path: "advance/other-earnings", element: <ErrorBoundary><OtherEarningsModule /></ErrorBoundary> },
      { path: "advance/other-deductions", element: <ErrorBoundary><OtherDeductionsModule /></ErrorBoundary> },
      { path: "advance/adjustments-report", element: <ErrorBoundary><AdjustmentsReport /></ErrorBoundary> },
      // Travel Reimbursement
      { path: "travel", element: <ErrorBoundary><TravelReimbursementModule /></ErrorBoundary> },

      // Workflow Control & Incentive Engine
      { path: "workflow-demo", element: <DevOnlyRoute element={<WorkflowControlDemo />} /> },
      { path: "incentive-demo", element: <DevOnlyRoute element={<IncentiveEngineDemo />} /> },

      // Week-Off & Cover Job System
      { path: "weekoff-cover-demo", element: <DevOnlyRoute element={<WeekOffCoverDemo />} /> },

      // System Integration Demo
      { path: "system-integration-demo", element: <DevOnlyRoute element={<SystemIntegrationDemo />} /> },

      // Washer Core Screens Demo
      { path: "washer-core-screens-demo", element: <DevOnlyRoute element={<WasherCoreScreensDemo />} /> },
      
      // Washer Core Screens Connected (Production)
      { path: "washer-core-screens", element: <ErrorBoundary><WasherCoreScreensConnected /></ErrorBoundary> },

      // Washer Attendance History
      { path: "washer/attendance", element: <ErrorBoundary><WasherAttendanceHistory /></ErrorBoundary> },
      { path: "washer/check-in", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/schedule", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/earnings", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/raise-issue", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "finance/collections", element: <ErrorBoundary><FinanceTransactions /></ErrorBoundary> },

      // Supervisor App - Nested routes with layout
      {
        path: "supervisor-app",
        element: <SupervisorLayout />,
        children: [
          { index: true, element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          // R5 FIX NOTE: deep-linking to specific tabs requires SupervisorAppConnected
          // to read useLocation().pathname and set its initial active tab.
          // See SupervisorAppConnected fix in supervisor-fixes.
          { path: "team", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "audit", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "cloth", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "leads", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "incentive", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "issues", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "alerts", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "cover", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "visibility", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "audit-trail", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
          { path: "kpi-dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorAppConnected /></Suspense></ErrorBoundary> },
        ]
      },

      // Operations Manager App (Production) - High-control command interface
      { path: "om-app", element: <ErrorBoundary><OperationsManagerApp /></ErrorBoundary> },

      // Cluster Manager App (Production) - Control tower interface
      { path: "cm-app", element: <ErrorBoundary><ClusterManagerApp /></ErrorBoundary> },

      // City Manager App (Production) - Control tower interface
      { path: "city-app", element: <ErrorBoundary><CityManagerApp /></ErrorBoundary> },

      // Organization Hierarchy Dashboard - City → Cluster → Pincode
      { path: "hierarchy-dashboard", element: <ErrorBoundary><HierarchyDashboard /></ErrorBoundary> },

      // Tele Sales Manager App (Production) - Pipeline control tower
      { path: "tsm-app", element: <ErrorBoundary><TeleSalesManagerApp /></ErrorBoundary> },
      { path: "sh-app", element: <ErrorBoundary><SalesHeadApp /></ErrorBoundary> },
      { path: "sm-app-alliance", element: <ErrorBoundary><SalesManagerApp /></ErrorBoundary> },

      // Tele Sales Executive App (Production) - Sales execution interface
      { path: "tse-app", element: <ErrorBoundary><TeleSalesExecutiveApp /></ErrorBoundary> },
      { path: "tse-diagnostics", element: <DevOnlyRoute element={<TSEDiagnostics />} /> },

      // Customer Care Executive App (Production) - Complaint management interface
      { path: "cce-app", element: <ErrorBoundary><CustomerCareExecutiveApp /></ErrorBoundary> },

      // BTL Service Test Page
      { path: "test-btl", element: <DevOnlyRoute element={<TestBTLService />} /> },

      // Subscription Management System (Production) - Dynamic plan system
      { path: "subscription-app", element: <ErrorBoundary><SubscriptionApp /></ErrorBoundary> },
      { path: "plans", element: <ErrorBoundary><PlanSelectionScreen /></ErrorBoundary> },
      { path: "buy",   element: <ErrorBoundary><CustomerPlanPage /></ErrorBoundary> },
      { path: "admin/plans", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdminPlanManagement userRole="ADMIN" /></Suspense></ErrorBoundary> },
      { path: "admin/plan-page-editor", element: <ErrorBoundary><SuperAdminPlanEditor /></ErrorBoundary> },
      { path: "subscription-diagnostics", element: <DevOnlyRoute element={<SubscriptionDiagnostics />} /> },

      // Client Portal - Read-only client interface
      { path: "client-portal", element: <ErrorBoundary><ClientPortal /></ErrorBoundary> },

      // Workforce Management - Working Hours & Shift Configuration
      { path: "workforce/diagnostic", element: <DevOnlyRoute element={<WorkforceDiagnostic />} /> },
      { path: "workforce/test", element: <DevOnlyRoute element={<WorkingHoursTest />} /> },
      { path: "workforce/simple", element: <ErrorBoundary><WorkingHoursSimple /></ErrorBoundary> },
      { path: "workforce/working-hours", element: <ErrorBoundary><WorkingHoursSetup /></ErrorBoundary> },

      // Incentive Management System - Configuration, Simulation & Forecasting
      { path: "incentives/configuration", element: <ErrorBoundary><IncentiveConfiguration /></ErrorBoundary> },
      { path: "incentives/simulator", element: <ErrorBoundary><IncentiveSimulator /></ErrorBoundary> },
      { path: "incentives/forecast", element: <ErrorBoundary><IncentiveDashboard /></ErrorBoundary> },
      { path: "incentives", element: <Navigate to="/incentives/configuration" replace /> },

      // My Account - Employee self-service
      { path: "my-account", element: <ErrorBoundary><MyAccountPage /></ErrorBoundary> },
      { path: "my-account/mobile-change", element: <ErrorBoundary><MobileChangeRequest /></ErrorBoundary> },

      // Unauthorized page - shown when access denied
      { path: "unauthorized", element: <ErrorBoundary><UnauthorizedPage /></ErrorBoundary> },

      // Catch-all 404 for authenticated routes - must be last in children array
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
