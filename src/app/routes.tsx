﻿﻿﻿// Router Configuration - FIXED: Removed bad imports (Updated: 2026-03-26)
import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { GlobalFiltersProvider } from "./components/navigation/GlobalFilterBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CorporateB2BPortal } from "./components/crm/CorporateB2BPortal";
import { MultiVehicleManager } from "./components/customer/MultiVehicleManager";
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
const CreateSalaryStructure = lazy(() => import("./components/payroll/CreateSalaryStructure"));
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

// Founder module - converted to regular imports due to fetch errors
const FounderControlTower = lazy(() => import("./components/founder/FounderControlTower"));
const DetailedFinancialView = lazy(() => import("./components/founder/DetailedFinancialView"));
const CashFlowDashboard = lazy(() => import("./components/founder/CashFlowDashboard"));
const MarketingROIDrilldown = lazy(() => import("./components/founder/MarketingROIDrilldown"));

// Keep these as regular imports (frequently accessed)
// import { OnboardingPortal } from "./components/OnboardingPortal"; // NOW LAZY
import { OnboardingRedirect } from "./components/onboarding/OnboardingRedirect";
import { DevOnlyRoute } from "./components/guards/DevOnlyRoute";
import { Dashboard } from "./components/Dashboard";
const UserManagement = lazy(() => import("./components/modules/UserManagement"));
const CRMLeadManagementWithFilters = lazy(() => import("./components/modules/CRMLeadManagementWithFilters"));
const CRMConversionAnalyticsDashboard = lazy(() => import("./components/modules/CRMConversionAnalyticsDashboard"));
import { CustomerSubscription } from "./components/modules/CustomerSubscription";
const SupervisorModuleUpdated = lazy(() => import("./components/modules/SupervisorModuleUpdated"));
const OperationsManagerApp = lazy(() => import("./components/om/OperationsManagerApp"));
const ComplaintManagement = lazy(() => import("./components/modules/ComplaintManagement"));
const InventoryStore = lazy(() => import("./components/modules/InventoryStore"));
import { MaterialRequisition } from "./components/inventory/MaterialRequisition";
const WasherIssuances = lazy(() => import("./components/inventory/WasherIssuances"));
import { WasherStockLedger } from "./components/inventory/WasherStockLedger";
const MonthEndVerification = lazy(() => import("./components/inventory/MonthEndVerification"));
import { MyStock } from "./components/washer/MyStock";
import { StoreModule } from "./components/modules/StoreModule";
import { ProcurementModule } from "./components/modules/ProcurementModule";
const FinanceModule = lazy(() => import("./components/modules/FinanceModule"));
// import { ChartOfAccounts } from "./components/finance/ChartOfAccounts"; // NOW LAZY
const RevenueCaptureSystem = lazy(() => import("./components/finance/RevenueCaptureSystem"));
const PackageCostMatrix = lazy(() => import("./components/finance/PackageCostMatrix"));
const CostPerWashModule = lazy(() => import("./components/finance/CostPerWashModule"));
const ActualCostInputs = lazy(() => import("./components/finance/ActualCostInputs"));
const FinanceTransactions = lazy(() => import("./components/finance/FinanceTransactions"));
const LedgerEntriesView = lazy(() => import("./components/finance/LedgerEntriesView"));
const FinanceAnalyticsDashboard = lazy(() => import("./components/finance/FinanceAnalyticsDashboard"));
import { FinancialReportsModule } from "./components/finance/FinancialReportsModule";
const InvoiceManagement = lazy(() => import("./components/finance/InvoiceManagement"));
const InvoiceDetail = lazy(() => import("./components/finance/InvoiceDetail"));
const PaymentManagement = lazy(() => import("./components/finance/PaymentManagement"));
// import { HRModule } from "./components/modules/HRModule"; // NOW LAZY
// import { ProfessionalLeaveManagement } from "./components/hr/ProfessionalLeaveManagement"; // NOW LAZY
const LeavePolicyEngine = lazy(() => import("./components/hr/LeavePolicyEngine"));
const EmployeeOnboarding = lazy(() => import("./components/hr/EmployeeOnboarding"));
const ExitFFSettlement = lazy(() => import("./components/hr/ExitFFSettlement"));
const EmployeeLifecycleManagement = lazy(() => import("./components/hr/EmployeeLifecycleManagement"));
import { LettersDocuments } from "./components/hr/LettersDocuments";
const IDCardGenerator = lazy(() => import("./components/hr/IDCardGenerator"));
import { HolidayManagement } from "./components/hr/HolidayManagement";
const LifeCycleReports = lazy(() => import("./components/hr/LifeCycleReports"));
const EmployeeLedger = lazy(() => import("./components/hr/EmployeeLedger"));
// import { StatutoryFormsOnboarding } from "./components/hr/StatutoryFormsOnboarding"; // NOW LAZY
const StatutoryFormsVerification = lazy(() => import("./components/hr/StatutoryFormsVerification"));
const OnboardingAutomation = lazy(() => import("./components/hr/OnboardingAutomation"));
const EmployeeSalaryAssignment = lazy(() => import("./components/payroll/EmployeeSalaryAssignment"));
const EmployeeSelfService = lazy(() => import("./components/hr/EmployeeSelfService"));
const AttendanceDataManager = lazy(() => import("./components/admin/AttendanceDataManager"));
import { ApprovalCenter as ApprovalCenterHR } from "./components/hr/ApprovalCenter";
import { TestStatutoryRoutes } from "./components/TestStatutoryRoutes";
const DeveloperRouteDirectory = lazy(() => import("./components/developer/DeveloperRouteDirectory"));
const ApprovalCenter = lazy(() => import("./components/ApprovalCenter"));
import { AuditTrail } from "./components/AuditTrail";
const SystemAuditDashboard = lazy(() => import("./components/audit/SystemAuditDashboard"));
import { PerformanceTracking } from "./components/performance/PerformanceTracking";
const AccountsModule = lazy(() => import("./components/modules/AccountsModule"));
import { ExpenseEntry } from "./components/accounts/ExpenseEntry";
const ExpenseAnalytics = lazy(() => import("./components/accounts/ExpenseAnalytics"));
const VendorPayment = lazy(() => import("./components/accounts/VendorPayment"));
const GSTDashboard = lazy(() => import("./components/accounts/GSTDashboard"));
// Phase 1 Accounting Entry System
const AccountingEntry = lazy(() => import("./components/accounts/AccountingEntry"));
import { JournalEntry } from "./components/accounts/JournalEntry";
const AccountsDashboard = lazy(() => import("./components/accounts/AccountsDashboard"));
const AccountingTransactionList = lazy(() => import("./components/accounts/AccountingTransactionList"));
import { AccountsLedger } from "./components/accounts/AccountsLedger";
const PartyLedger = lazy(() => import("./components/accounts/PartyLedger"));
import { TrialBalance } from "./components/accounts/TrialBalance";
const BalanceSheet = lazy(() => import("./components/accounts/BalanceSheet"));
const LedgerMaster = lazy(() => import("./components/accounts/LedgerMaster"));
const RazorpayFlow = lazy(() => import("./components/accounts/RazorpayFlow"));
const ExpenseVoucher = lazy(() => import("./components/accounts/ExpenseVoucher"));
const ItemMaster = lazy(() => import("./components/accounts/ItemMaster"));
const TDSPayableModule = lazy(() => import("./components/accounts/TDSPayableModule"));
const AdvanceTaxCalculator = lazy(() => import("./components/accounts/AdvanceTaxCalculator"));
const PayablesDashboard = lazy(() => import("./components/accounts/PayablesDashboard"));
// Phase 3 Accounting Reports
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
// Analytics imports - NOW LAZY
// import { UnitEconomicsDashboard } from "./components/analytics/UnitEconomicsDashboard"; // NOW LAZY
// import { CustomerLTVAnalysis } from "./components/analytics/CustomerLTVAnalysis"; // NOW LAZY
// import { CACDashboard } from "./components/analytics/CACDashboard"; // NOW LAZY
// import { BreakEvenAnalysis } from "./components/analytics/BreakEvenAnalysis"; // NOW LAZY
const AnalyticsDashboardWithDrillDown = lazy(() => import("./components/dashboards/AnalyticsDashboardWithDrillDown"));
// import { CostPerWashCalculatorEnhanced } from "./components/analytics/CostPerWashCalculatorEnhanced"; // NOW LAZY
// import { CostPerWashByPlan } from "./components/analytics/CostPerWashByPlan"; // NOW LAZY
// import { CostPerWashByConsumption } from "./components/analytics/CostPerWashByConsumption"; // NOW LAZY
// import { LabourCostPerWash } from "./components/analytics/LabourCostPerWash"; // NOW LAZY
// import { EmployeeEfficiency } from "./components/analytics/EmployeeEfficiency"; // NOW LAZY
// import { CityComparison } from "./components/analytics/CityComparison"; // NOW LAZY
const RoleBasedAnalyticsDashboard = lazy(() => import("./components/examples/RoleBasedAnalyticsDashboard"));
const CostPerWashReport = lazy(() => import("./components/reports/CostPerWashReport"));
// Founder module imports - NOW LAZY
// import { FounderControlTower } from "./components/founder/FounderControlTower"; // NOW LAZY
// import { DetailedFinancialView } from "./components/founder/DetailedFinancialView"; // NOW LAZY
// import { CashFlowDashboard } from "./components/founder/CashFlowDashboard"; // NOW LAZY
// import { MarketingROIDrilldown } from "./components/founder/MarketingROIDrilldown"; // NOW LAZY
import { ActivityTimelineWrapper } from "./components/crm/ActivityTimelineWrapper";
const NotificationCenter = lazy(() => import("./components/crm/NotificationCenter"));
const PayrollConfiguration = lazy(() => import("./components/payroll/PayrollConfiguration"));
import { PayrollConfigTest } from "./components/payroll/PayrollConfigTest";
// import { CreateSalaryStructure } from "./components/payroll/CreateSalaryStructure"; // NOW LAZY
const PayrollRun = lazy(() => import("./components/payroll/PayrollRun"));
const PayrollProcessing = lazy(() => import("./components/payroll/PayrollProcessing"));
const PayrollProcessingAdvanced = lazy(() => import("./components/payroll/PayrollProcessingAdvanced"));
const PayrollReviewApproval = lazy(() => import("./components/payroll/PayrollReviewApproval"));
import { SalaryPayableView } from "./components/payroll/SalaryPayableView";
const SalaryPaymentScreen = lazy(() => import("./components/payroll/SalaryPaymentScreen"));
const StatutoryPayablesScreen = lazy(() => import("./components/payroll/StatutoryPayablesScreen"));
const PlanEditor = lazy(() => import("./components/subscription/PlanEditor"));
const CommunicationTemplates = lazy(() => import("./components/settings/CommunicationTemplates"));
const CostConfiguration = lazy(() => import("./components/settings/CostConfiguration"));
const ServiceZonesManagement = lazy(() => import("./components/modules/ServiceZonesManagement"));
const WasherJobExecution = lazy(() => import("./components/modules/WasherJobExecution"));
import { DataCapture } from "./components/operations/DataCapture";
import { ExpansionOpportunities } from "./components/modules/ExpansionOpportunities";
const SupplierDetail = lazy(() => import("./components/procurement/SupplierDetail"));
import { CostTrackingIntegrationDemo } from "./components/demo/CostTrackingIntegrationDemo";
const DesignSystemTest = lazy(() => import("./design-system/tests/DesignSystemTest"));
const ClothExchange = lazy(() => import("./components/cloth-tracking/ClothExchange"));
import { ClothAdminDashboard } from "./components/cloth-tracking/ClothAdminDashboard";
import { AdvanceTypeSelection } from "./components/advance/AdvanceTypeSelection";
const LongTermAdvanceForm = lazy(() => import("./components/advance/LongTermAdvanceForm"));
const ShortTermAdvanceForm = lazy(() => import("./components/advance/ShortTermAdvanceForm"));
const EmployeeAdvanceDashboard = lazy(() => import("./components/advance/EmployeeAdvanceDashboard"));
import { AdvanceDetailView } from "./components/advance/AdvanceDetailView";
const HRAdvanceManagement = lazy(() => import("./components/advance/HRAdvanceManagement"));
const OtherEarningsModule = lazy(() => import("./components/advance/OtherEarningsModule"));
const OtherDeductionsModule = lazy(() => import("./components/advance/OtherDeductionsModule"));
const AdjustmentsReport = lazy(() => import("./components/advance/AdjustmentsReport"));
const WorkflowControlDemo = lazy(() => import("./components/workflow/WorkflowControlDemo"));
import { IncentiveEngineDemo } from "./components/workflow/IncentiveEngineDemo";
const WeekOffCoverDemo = lazy(() => import("./components/washer/WeekOffCoverDemo"));
import { SystemIntegrationDemo } from "./components/washer/SystemIntegrationDemo";
const WasherCoreScreensDemo = lazy(() => import("./components/washer/WasherCoreScreensDemo"));
const WasherCoreScreensConnected = lazy(() => import("./components/washer/WasherCoreScreensConnected"));
import { SupervisorAppConnected } from "./components/supervisor/SupervisorAppConnected";
import { SupervisorLayout } from "./components/supervisor/SupervisorLayout";
const ClusterManagerApp = lazy(() => import("./components/cm/ClusterManagerApp"));
const CityManagerApp = lazy(() => import("./components/city/CityManagerApp"));
const TeleSalesManagerApp = lazy(() => import("./components/tsm/TeleSalesManagerApp"));
const TSMCancellationQueue = lazy(() => import("./components/tsm/TSMCancellationQueue"));
const SalesHeadApp = lazy(() => import("./components/sh/SalesHeadApp"));
const SalesManagerApp = lazy(() => import("./components/sm/SalesManagerApp"));
const TeleSalesExecutiveApp = lazy(() => import("./components/tse/TeleSalesExecutiveApp"));
import { TSEDiagnostics } from "./components/tse/TSEDiagnostics";
const CustomerCareExecutiveApp = lazy(() => import("./components/cce/CustomerCareExecutiveApp"));
import TestBTLService from "./test-btl-service";
import { SubscriptionApp } from "./components/subscription/SubscriptionApp";
const PlanSelectionScreen = lazy(() => import("./components/subscription/PlanSelectionScreen"));
const CustomerPlanPage = lazy(() => import("./components/subscription/CustomerPlanPage"));
import { CustomerPlanPage as CustomerPlanPageDirect } from "./components/subscription/CustomerPlanPage";
import { CancellationRequestPage } from "./components/subscription/CancellationRequestPage";
import { AppProviderSimple } from "./contexts/AppProviderSimple";
const SuperAdminPlanEditor = lazy(() => import("./components/admin/SuperAdminPlanEditor"));
// import { AdminPlanManagement } from "./components/subscription/AdminPlanManagement"; // NOW LAZY
import { SubscriptionDiagnostics } from "./components/subscription/SubscriptionDiagnostics";
const HierarchyDashboard = lazy(() => import("./components/hierarchy/HierarchyDashboard"));
import { WasherAttendanceHistory } from "./components/washer/WasherAttendanceHistory";
import { OperationsRouter } from "./components/operations/OperationsRouter";
import { OperationsLayout } from "./components/operations/OperationsLayout";
const ClientPortal = lazy(() => import("./components/client/ClientPortal"));
const WorkingHoursSetup = lazy(() => import("./components/workforce/WorkingHoursSetup"));
import { WorkingHoursTest } from "./components/workforce/WorkingHoursTest";
import { WorkingHoursSimple } from "./components/workforce/WorkingHoursSimple";
import { WorkforceDiagnostic } from "./components/workforce/WorkforceDiagnostic";
// import { IncentiveConfiguration } from "./components/incentives/IncentiveConfiguration"; // NOW LAZY
const IncentiveSimulator = lazy(() => import("./components/incentives/IncentiveSimulator"));
const IncentiveDashboard = lazy(() => import("./components/incentives/IncentiveDashboard"));
import { HRPayrollApproval } from "./components/hr/HRPayrollApproval";
import { SuperAdminPayrollApproval } from "./components/admin/SuperAdminPayrollApproval";
const CityManagement = lazy(() => import("./components/admin/CityManagement"));
const BusinessRulesPage = lazy(() => import("./components/admin/BusinessRulesPage"));
import { ShiftManagementPage } from "./components/admin/ShiftManagementPage"; // MC-10
import { AttendanceFraudAlertsPage } from "./components/admin/AttendanceFraudAlertsPage"; // MC-09
import { PermissionManagementPage } from "./components/admin/PermissionManagementPage"; // MC-11
const RolePermissionManager = lazy(() => import("./components/admin/RolePermissionManager")); // MC-11 Enhanced
const IncentiveVisibilityAdmin = lazy(() => import("./components/admin/IncentiveVisibilityAdmin")); // Super Admin incentive screen control
import { RoleSuggestionsPage } from "./components/hr/RoleSuggestionsPage"; // MC-12
const HRIntelligenceDashboard = lazy(() => import("./components/hr/HRIntelligenceDashboard"));
const AccountsPayrollProcessing = lazy(() => import("./components/accounts/AccountsPayrollProcessing"));
import { GSTOverview } from "./components/gst/GSTOverview";
const GSTVendorMaster = lazy(() => import("./components/gst/GSTVendorMaster"));
const GSTCustomerMaster = lazy(() => import("./components/gst/GSTCustomerMaster"));
const GSTTransactionEntry = lazy(() => import("./components/gst/GSTTransactionEntry"));
import { GSTValidationCentre } from "./components/gst/GSTValidationCentre";
const GSTManagerReview = lazy(() => import("./components/gst/GSTManagerReview"));
const GSTReconciliation = lazy(() => import("./components/gst/GSTReconciliation"));
const GSTReports = lazy(() => import("./components/gst/GSTReports"));
const TransactionSubTypeManager = lazy(() => import("./components/gst/TransactionSubTypeManager"));
const GSTR1Module = lazy(() => import("./components/gst/GSTR1Module"));
const GSTR3BModule = lazy(() => import("./components/gst/GSTR3BModule"));
const GSTFilingModule = lazy(() => import("./components/gst/GSTFilingModule"));
const GSTMonitoringModule = lazy(() => import("./components/gst/GSTMonitoringModule"));
const BusinessFlowDemo = lazy(() => import("./components/BusinessFlowDemo"));
import { UnauthorizedPage } from "./components/pages/UnauthorizedPage";
const LoginPage = lazy(() => import("./pages/LoginPage"));
import { MobileChangeRequest } from "./components/hr/MobileChangeRequest";
const MyAccountPage = lazy(() => import("./components/hr/MyAccountPage"));
import { AppProvider } from "./contexts/AppProvider";
import WasherTrackingPageDirect from "./components/washer/WasherTrackingPage";

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
  // Public routes
  {
    path: "/buy",
    element: <ErrorBoundary><AppProviderSimple><CustomerPlanPageDirect /></AppProviderSimple></ErrorBoundary>,
  },
  {
    path: "/cancel-service",
    element: <ErrorBoundary><AppProviderSimple><CancellationRequestPage /></AppProviderSimple></ErrorBoundary>,
  },
  {
    path: "/book",
    element: <Navigate to="/buy" replace />,
  },
  {
    path: "/track/:jobId",
    element: <ErrorBoundary><AppProvider><WasherTrackingPageDirect /></AppProvider></ErrorBoundary>,
  },

  // Main application routes with layout
  {
    path: "/",
    element: <RootLayoutWrapper />,
    errorElement: (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 p-8"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><span className="text-red-600 text-xl font-bold">!</span></div><h2 className="text-lg font-semibold text-gray-900">Page Error</h2><p className="text-sm text-gray-500">This page has an error. Other pages still work.</p><a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm">Go to Dashboard</a></div>),
    children: [
      { index: true, element: <Dashboard /> },

      // CRM index â€” nav parent /crm has no route
      {
        path: "crm",
        element: <Navigate to="/leads" replace />
      },

      // Payroll index â€” nav parent /payroll has no route
      {
        path: "payroll",
        element: <Navigate to="/payroll/run" replace />
      },

      // Admin index â€” nav parent /admin has no route
      {
        path: "admin",
        element: <Navigate to="/admin/city-management" replace />
      },

      // Reports index â€” nav parent /reports has no route
      {
        path: "reports",
        element: <Navigate to="/finance/reports" replace />
      },

      // Operations-management â€” the Operations nav section points here but route doesn't exist
      {
        path: "operations-management",
        element: <Navigate to="/operations" replace />
      },

      { path: "business-flow-demo", element: <DevOnlyRoute element={<BusinessFlowDemo />} /> },
      { path: "users", element: <UserManagement /> },
      { path: "leads", element: <CRMLeadManagementWithFilters /> },
      { path: "corporate", element: <ErrorBoundary><CorporateB2BPortal /></ErrorBoundary> },
  { path: "customers", element: <CustomerSubscription /> },
      { path: "car-washer", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "supervisor", element: <SupervisorModuleUpdated /> },
      // Operations layout route with children
      {
        path: "operations",
        element: <OperationsLayout />,
        children: [
          { index: true, element: <OperationsRouter /> },
          { path: "data-capture", element: <DataCapture /> },
        ]
      },
      { path: "complaints", element: <ComplaintManagement /> },
      { path: "inventory", element: <InventoryStore /> },
      { path: "inventory/requisition", element: <MaterialRequisition /> },
      { path: "inventory/washer-issuances", element: <WasherIssuances /> },
      { path: "inventory/washer-stock-ledger", element: <WasherStockLedger /> },
      { path: "inventory/month-end-verification", element: <MonthEndVerification /> },
      { path: "inventory/my-stock", element: <MyStock /> },
      { path: "store", element: <StoreModule /> },
      { path: "procurement", element: <ProcurementModule /> },
      { path: "finance", element: <FinanceModule /> },
      { path: "finance/analytics", element: <FinanceAnalyticsDashboard /> },
      { path: "finance/reports", element: <FinancialReportsModule /> },
      { path: "finance/transactions", element: <FinanceTransactions /> },
      { path: "finance/ledger-entries", element: <LedgerEntriesView /> },
      { path: "finance/chart-of-accounts", element: <ErrorBoundary><ChartOfAccounts /></ErrorBoundary> },
      { path: "finance/invoices", element: <InvoiceManagement /> },
      { path: "finance/invoices/:id", element: <InvoiceDetail /> },
      { path: "finance/payments", element: <PaymentManagement /> },
      { path: "finance/revenue-capture", element: <RevenueCaptureSystem /> },
      { path: "finance/package-cost-matrix", element: <PackageCostMatrix /> },
      { path: "finance/cost-per-wash", element: <CostPerWashModule /> },
      { path: "finance/cost-per-wash/actual-inputs", element: <ActualCostInputs /> },
      { path: "hr", element: <ErrorBoundary><HRModule /></ErrorBoundary> },
      { path: "hr/leave", element: <Navigate to="/hr/professional-leave" replace /> },
      { path: "hr/enhanced-leave", element: <Navigate to="/hr/professional-leave" replace /> },
      { path: "hr/professional-leave", element: <ErrorBoundary><ProfessionalLeaveManagement /></ErrorBoundary> },
      { path: "hr/leave-policy-engine", element: <ErrorBoundary><LeavePolicyEngine /></ErrorBoundary> },
      { path: "hr/onboarding", element: <EmployeeOnboarding /> },
      { path: "hr/exit-settlement", element: <ExitFFSettlement /> },
      { path: "hr/lifecycle-management", element: <EmployeeLifecycleManagement /> },
      { path: "hr/letters-documents", element: <LettersDocuments /> },
      { path: "hr/id-card-generator", element: <IDCardGenerator /> },
      { path: "hr/holiday-management", element: <HolidayManagement /> },
      { path: "hr/lifecycle-reports", element: <LifeCycleReports /> },
      { path: "hr/employee-ledger", element: <EmployeeLedger /> },
      { path: "hr/statutory-forms-onboarding", element: <ErrorBoundary><StatutoryFormsOnboarding /></ErrorBoundary> },
      { path: "hr/statutory-forms-verification", element: <StatutoryFormsVerification /> },
      { path: "hr/onboarding-automation", element: <OnboardingAutomation /> },
      { path: "hr/self-service", element: <EmployeeSelfService /> },
      { path: "hr/approval-center", element: <ApprovalCenterHR /> },
      { path: "hr/payroll-approval", element: <HRPayrollApproval /> },
      { path: "hr/attendance-data-manager", element: <AttendanceDataManager /> },
      { path: "hr/test-statutory-routes", element: <DevOnlyRoute element={<TestStatutoryRoutes />} /> },
      { path: "hr/developer-routes", element: <DevOnlyRoute element={<DeveloperRouteDirectory />} /> },
      { path: "approvals", element: <ApprovalCenter /> },
      { path: "audit-trail", element: <AuditTrail /> },
      { path: "system-audit", element: <DevOnlyRoute element={<SystemAuditDashboard />} /> },
      { path: "performance", element: <PerformanceTracking /> },
      { path: "accounts", element: <AccountsModule /> },
      { path: "accounts/expense-entry", element: <ExpenseEntry /> },
      { path: "accounts/expense-analytics", element: <ExpenseAnalytics /> },
      { path: "accounts/vendor-payment", element: <VendorPayment /> },
      { path: "accounts/gst-dashboard", element: <GSTDashboard /> },
      { path: "accounts/gst-sub-types", element: <TransactionSubTypeManager /> },
      { path: "accounts/payroll-processing", element: <AccountsPayrollProcessing /> },
      { path: "accounts/accounting-entry", element: <AccountingEntry /> },
      { path: "accounts/expense-voucher", element: <ExpenseVoucher /> },
      { path: "accounts/item-master", element: <ItemMaster /> },
      { path: "accounts/payables", element: <ErrorBoundary><PayablesDashboard /></ErrorBoundary> },
      { path: "accounts/tds-payable", element: <ErrorBoundary><TDSPayableModule /></ErrorBoundary> },
      { path: "accounts/advance-tax", element: <ErrorBoundary><AdvanceTaxCalculator /></ErrorBoundary> },
      { path: "accounts/journal-entry", element: <JournalEntry /> },
      { path: "accounts/dashboard", element: <AccountsDashboard /> },
      { path: "accounts/transactions", element: <AccountingTransactionList /> },
      { path: "accounts/ledger", element: <AccountsLedger /> },
      { path: "accounts/party-ledger", element: <PartyLedger /> },
      { path: "accounts/ledger-master", element: <LedgerMaster /> },
      { path: "accounts/razorpay-flow", element: <RazorpayFlow /> },
      { path: "accounts/trial-balance", element: <TrialBalance /> },
      { path: "accounts/balance-sheet", element: <BalanceSheet /> },
      { path: "accounts/gstr2a", element: <GSTR2AReport /> },
      { path: "accounts/reports/purchase", element: <PurchaseSummaryReport /> },
      { path: "accounts/reports/sales", element: <SalesSummaryReport /> },
      { path: "accounts/reports/rcm", element: <RCMReport /> },
      { path: "gst", element: <GSTOverview /> },
      { path: "gst/vendors", element: <GSTVendorMaster /> },
      { path: "gst/customers", element: <GSTCustomerMaster /> },
      { path: "gst/transactions", element: <GSTTransactionEntry /> },
      { path: "gst/validation", element: <GSTValidationCentre /> },
      { path: "gst/review", element: <GSTManagerReview /> },
      { path: "gst/reconciliation", element: <GSTReconciliation /> },
      { path: "gst/reports", element: <GSTReports /> },
      { path: "gst/gstr1", element: <GSTR1Module /> },
      { path: "gst/gstr3b", element: <GSTR3BModule /> },
      { path: "gst/filing", element: <GSTFilingModule /> },
      { path: "gst/monitoring", element: <GSTMonitoringModule /> },
            { path: "admin/payroll-approval", element: <SuperAdminPayrollApproval /> },
      { path: "admin/city-management", element: <CityManagement /> },
      { path: "admin/business-rules", element: <BusinessRulesPage /> },
      { path: "admin/shift-management", element: <ShiftManagementPage /> }, // MC-10
      { path: "admin/fraud-alerts", element: <AttendanceFraudAlertsPage /> }, // MC-09
      { path: "admin/permissions", element: <PermissionManagementPage /> }, // MC-11
      { path: "admin/role-permissions", element: <RolePermissionManager /> }, // MC-11 Enhanced: Base role overrides + custom sub-roles
      { path: "admin/incentive-visibility", element: <IncentiveVisibilityAdmin /> }, // Super Admin: show/hide incentive tab per role/employee
      { path: "hr/role-suggestions", element: <RoleSuggestionsPage /> }, // MC-12
      { path: "hr/intelligence-dashboard", element: <HRIntelligenceDashboard /> },
      { path: "store-manager", element: <StoreManagerModule /> },
      { path: "store-manager/grn-entry", element: <GRNEntry /> },
      { path: "store-manager/purchase-order", element: <PurchaseOrderCreation /> },
      { path: "store-manager/moq", element: <MOQManagement /> },
      { path: "store-manager/inventory", element: <InventoryMonitoring /> },
      { path: "store-manager/vendor-request", element: <VendorRequest /> },
      {
        path: "analytics",
        element: <GlobalFiltersProvider><Outlet /></GlobalFiltersProvider>,
        children: [
          { index: true, element: <Navigate to="/analytics/dashboard" replace /> },
          { path: "dashboard", element: <AnalyticsDashboardWithDrillDown /> },
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
          { path: "cost-report", element: <CostPerWashReport /> },

          // Legacy redirects for backward compatibility
          { path: "cost-per-wash", element: <Navigate to="/finance/cost-per-wash" replace /> },
          { path: "cost-per-wash-by-plan", element: <Navigate to="/analytics/unit-economics/cost-by-plan" replace /> },
          { path: "cost-per-wash-by-consumption", element: <Navigate to="/analytics/unit-economics/cost-by-consumption" replace /> },
          { path: "labour-cost-per-wash", element: <Navigate to="/analytics/unit-economics/labour-cost" replace /> },
          { path: "cost-per-wash-report", element: <Navigate to="/analytics/unit-economics/cost-report" replace /> },

          { path: "employee-efficiency", element: <ErrorBoundary><EmployeeEfficiency /></ErrorBoundary> },
          { path: "city-comparison", element: <ErrorBoundary><CityComparison /></ErrorBoundary> },
          { path: "role-based-demo", element: <DevOnlyRoute element={<RoleBasedAnalyticsDashboard />} /> },
        ]
      },
      { path: "founder/control-tower", element: <FounderControlTower /> },
      { path: "founder/financial-view", element: <DetailedFinancialView /> },
      { path: "founder/cash-flow", element: <CashFlowDashboard /> },
      { path: "founder/marketing-roi", element: <MarketingROIDrilldown /> },
      { path: "crm/activity-timeline", element: <ActivityTimelineWrapper /> },
      { path: "crm/notifications", element: <NotificationCenter /> },
      { path: "crm/conversion-analytics", element: <CRMConversionAnalyticsDashboard /> },
      { path: "payroll/test", element: <DevOnlyRoute element={<PayrollConfigTest />} /> },
      { path: "payroll/configuration", element: <PayrollConfiguration /> },
      { path: "payroll/create-salary-structure", element: <CreateSalaryStructure /> },
      { path: "payroll/salary-assignment", element: <EmployeeSalaryAssignment /> },
      { path: "payroll/run", element: <PayrollRun /> },
      { path: "payroll/processing", element: <Navigate to="/payroll/run" replace /> },
      { path: "payroll/processing-basic", element: <Navigate to="/payroll/run" replace /> },
      { path: "payroll/review-approval", element: <PayrollReviewApproval /> },
      { path: "payroll/salary-payables", element: <SalaryPayableView /> },
      { path: "payroll/salary-payment", element: <SalaryPaymentScreen /> },
      { path: "payroll/statutory-payables", element: <StatutoryPayablesScreen /> },
      {
        path: "subscription",
        element: <Outlet />,
        children: [
          { index: true, element: <Navigate to="/subscription/plan-management" replace /> },
          { path: "plan-management", element: <ErrorBoundary><AdminPlanManagement userRole="ADMIN" /></ErrorBoundary> },
          { path: "plan-editor", element: <PlanEditor /> },
        ]
      },
      { path: "settings/communication-templates", element: <CommunicationTemplates /> },
      { path: "settings/cost-configuration", element: <CostConfiguration /> },
      { path: "service-zones", element: <ServiceZonesManagement /> },
      { path: "washer-jobs", element: <WasherJobExecution /> },
      { path: "expansion-opportunities", element: <ExpansionOpportunities /> },
      { path: "procurement/supplier/:supplierId", element: <SupplierDetail /> },
      { path: "demo/cost-tracking-integration", element: <DevOnlyRoute element={<CostTrackingIntegrationDemo />} /> },
      { path: "design-system-test", element: <DevOnlyRoute element={<DesignSystemTest />} /> },
      // Cloth Tracking System
      { path: "cloth-tracking/exchange", element: <ClothExchange /> },
      { path: "cloth-tracking/admin", element: <ClothAdminDashboard /> },
      // Advance Management System
      { path: "advance", element: <AdvanceTypeSelection /> },
      { path: "advance/long-term/apply", element: <LongTermAdvanceForm /> },
      { path: "advance/short-term/apply", element: <ShortTermAdvanceForm /> },
      { path: "advance/my-advances", element: <EmployeeAdvanceDashboard /> },
      { path: "advance/status/:advanceId", element: <AdvanceDetailView /> },
      { path: "advance/hr-management", element: <HRAdvanceManagement /> },
      { path: "advance/other-earnings", element: <OtherEarningsModule /> },
      { path: "advance/other-deductions", element: <OtherDeductionsModule /> },
      { path: "advance/adjustments-report", element: <AdjustmentsReport /> },
      // Travel Reimbursement
      { path: "travel", element: <TravelReimbursementModule /> },

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
      { path: "washer-core-screens", element: <WasherCoreScreensConnected /> },

      // Washer Attendance History
      { path: "washer/attendance", element: <WasherAttendanceHistory /> },
      { path: "washer/check-in", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/schedule", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/earnings", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/raise-issue", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "finance/collections", element: <FinanceTransactions /> },

      // Supervisor App - Nested routes with layout
      {
        path: "supervisor-app",
        element: <SupervisorLayout />,
        children: [
          { index: true, element: <SupervisorAppConnected /> },
          { path: "dashboard", element: <SupervisorAppConnected /> },
          { path: "team", element: <SupervisorAppConnected /> },
          { path: "audit", element: <SupervisorAppConnected /> },
          { path: "cloth", element: <SupervisorAppConnected /> },
          { path: "leads", element: <SupervisorAppConnected /> },
          { path: "incentive", element: <SupervisorAppConnected /> },
          { path: "issues", element: <SupervisorAppConnected /> },
          { path: "alerts", element: <SupervisorAppConnected /> },
          { path: "cover", element: <SupervisorAppConnected /> },
          { path: "visibility", element: <SupervisorAppConnected /> },
          { path: "audit-trail", element: <SupervisorAppConnected /> },
          { path: "kpi-dashboard", element: <SupervisorAppConnected /> },
          { path: "btl-assignments", element: <SupervisorAppConnected /> },
          { path: "schedule", element: <SupervisorAppConnected /> },
          { path: "audit-flow", element: <SupervisorAppConnected /> },
          { path: "audit-result", element: <SupervisorAppConnected /> },
          { path: "btl-leads", element: <SupervisorAppConnected /> },
          { path: "*", element: <SupervisorAppConnected /> },
        ]
      },

      // Operations Manager App (Production) - High-control command interface
      { path: "om-app", element: <OperationsManagerApp /> },

      // Cluster Manager App (Production) - Control tower interface
      { path: "cm-app", element: <ClusterManagerApp /> },

      // City Manager App (Production) - Control tower interface
      { path: "city-app", element: <CityManagerApp /> },

      // Organization Hierarchy Dashboard - City â†’ Cluster â†’ Pincode
      { path: "hierarchy-dashboard", element: <HierarchyDashboard /> },

      // Tele Sales Manager App (Production) - Pipeline control tower
      { path: "tsm-app", element: <TeleSalesManagerApp /> },
      { path: "tsm-cancellations", element: <TSMCancellationQueue /> },
      { path: "sh-app", element: <SalesHeadApp /> },
      { path: "sm-app-alliance", element: <SalesManagerApp /> },

      // Tele Sales Executive App (Production) - Sales execution interface
      { path: "tse-app", element: <TeleSalesExecutiveApp /> },
      { path: "tse-diagnostics", element: <DevOnlyRoute element={<TSEDiagnostics />} /> },

      // Customer Care Executive App (Production) - Complaint management interface
      { path: "cce-app", element: <CustomerCareExecutiveApp /> },

      // BTL Service Test Page
      { path: "test-btl", element: <DevOnlyRoute element={<TestBTLService />} /> },

      // Subscription Management System (Production) - Dynamic plan system
      { path: "subscription-app", element: <SubscriptionApp /> },
      { path: "plans", element: <PlanSelectionScreen /> },
      { path: "buy",   element: <CustomerPlanPage /> },
      { path: "admin/plans", element: <ErrorBoundary><AdminPlanManagement userRole="ADMIN" /></ErrorBoundary> },
      { path: "admin/plan-page-editor", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SuperAdminPlanEditor /></Suspense></ErrorBoundary> },
      { path: "subscription-diagnostics", element: <DevOnlyRoute element={<SubscriptionDiagnostics />} /> },

      // Client Portal - Read-only client interface
      { path: "client-portal", element: <ClientPortal /> },

      // Workforce Management - Working Hours & Shift Configuration
      { path: "workforce/diagnostic", element: <DevOnlyRoute element={<WorkforceDiagnostic />} /> },
      { path: "workforce/test", element: <DevOnlyRoute element={<WorkingHoursTest />} /> },
      { path: "workforce/simple", element: <WorkingHoursSimple /> },
      { path: "workforce/working-hours", element: <WorkingHoursSetup /> },

      // Incentive Management System - Configuration, Simulation & Forecasting
      { path: "incentives/configuration", element: <ErrorBoundary><IncentiveConfiguration /></ErrorBoundary> },
      { path: "incentives/simulator", element: <IncentiveSimulator /> },
      { path: "incentives/forecast", element: <IncentiveDashboard /> },
      { path: "incentives", element: <Navigate to="/incentives/configuration" replace /> },

      // My Account - Employee self-service
      { path: "my-account", element: <MyAccountPage /> },
      { path: "my-account/mobile-change", element: <MobileChangeRequest /> },

      // Unauthorized page - shown when access denied
      { path: "unauthorized", element: <UnauthorizedPage /> },

      // Catch-all 404 for authenticated routes - must be last in children array
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);






