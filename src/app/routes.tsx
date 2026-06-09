// Router Configuration - FIXED: Removed bad imports (Updated: 2026-03-26)
import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { GlobalFiltersProvider } from "./components/navigation/GlobalFilterBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RootLayoutWrapper } from "./components/layouts/RootLayoutWrapper";
import { AppProvider } from "./contexts/AppProvider";

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

// Lazy-loaded heavy components for code splitting
const OnboardingPortal = lazy(() => import("./components/OnboardingPortal"));
import HRModule from "./components/modules/HRModule";
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
import Dashboard from "./components/Dashboard";
import UserManagement from "./components/modules/UserManagement";
import CRMLeadManagementWithFilters from "./components/modules/CRMLeadManagementWithFilters";
const CRMConversionAnalyticsDashboard = lazy(() => import("./components/modules/CRMConversionAnalyticsDashboard"));
import CustomerSubscription from "./components/modules/CustomerSubscription";
const SupervisorModuleUpdated = lazy(() => import("./components/modules/SupervisorModuleUpdated"));
import OperationsManagerApp from "./components/om/OperationsManagerApp";
import ComplaintManagement from "./components/modules/ComplaintManagement";
const InventoryStore = lazy(() => import("./components/modules/InventoryStore"));
const MaterialRequisition = lazy(() => import("./components/inventory/MaterialRequisition"));
const WasherIssuances = lazy(() => import("./components/inventory/WasherIssuances"));
const WasherStockLedger = lazy(() => import("./components/inventory/WasherStockLedger"));
const MonthEndVerification = lazy(() => import("./components/inventory/MonthEndVerification"));
const MyStock = lazy(() => import("./components/washer/MyStock"));
const StoreModule = lazy(() => import("./components/modules/StoreModule"));
const ProcurementModule = lazy(() => import("./components/modules/ProcurementModule"));
import FinanceModuleDirect from "./components/modules/FinanceModule";
const FinanceModule = FinanceModuleDirect;
const RevenueCaptureSystem = lazy(() => import("./components/finance/RevenueCaptureSystem").then(m=>({default:m.RevenueCaptureSystem||m.default})));
const PackageCostMatrix = lazy(() => import("./components/finance/PackageCostMatrix"));
const CostPerWashModule = lazy(() => import("./components/finance/CostPerWashModule"));
const ActualCostInputs = lazy(() => import("./components/finance/ActualCostInputs"));
const FinanceTransactions = lazy(() => import("./components/finance/FinanceTransactions").then(m=>({default:m.FinanceTransactions||m.default})));
const LedgerEntriesView = lazy(() => import("./components/finance/LedgerEntriesView"));
const FinanceAnalyticsDashboard = lazy(() => import("./components/finance/FinanceAnalyticsDashboard").then(m=>({default:m.FinanceAnalyticsDashboard||m.default})));
const FinancialReportsModule = lazy(() => import("./components/finance/FinancialReportsModule"));
const LeavePolicyEngine = lazy(() => import("./components/hr/LeavePolicyEngine"));
const EmployeeOnboarding = lazy(() => import("./components/hr/EmployeeOnboarding"));
const ExitFFSettlement = lazy(() => import("./components/hr/ExitFFSettlement"));
const EmployeeLifecycleManagement = lazy(() => import("./components/hr/EmployeeLifecycleManagement"));
const LettersDocuments = lazy(() => import("./components/hr/LettersDocuments"));
const IDCardGenerator = lazy(() => import("./components/hr/IDCardGenerator"));
const HolidayManagement = lazy(() => import("./components/hr/HolidayManagement"));
const LifeCycleReports = lazy(() => import("./components/hr/LifeCycleReports"));
const EmployeeLedger = lazy(() => import("./components/hr/EmployeeLedger"));
const StatutoryFormsVerification = lazy(() => import("./components/hr/StatutoryFormsVerification"));
const OnboardingAutomation = lazy(() => import("./components/hr/OnboardingAutomation"));
const EmployeeSalaryAssignment = lazy(() => import("./components/payroll/EmployeeSalaryAssignment"));
const EmployeeSelfService = lazy(() => import("./components/hr/EmployeeSelfService"));
const AttendanceDataManager = lazy(() => import("./components/admin/AttendanceDataManager"));
const ApprovalCenter = lazy(() => import("./components/hr/ApprovalCenter"));
const ApprovalCenterHR = ApprovalCenter;
const TestStatutoryRoutes = lazy(() => import("./components/TestStatutoryRoutes"));
const DeveloperRouteDirectory = lazy(() => import("./components/developer/DeveloperRouteDirectory"));
const ApprovalCenterMain = lazy(() => import("./components/ApprovalCenter"));
const AuditTrail = lazy(() => import("./components/AuditTrail"));
const SystemAuditDashboard = lazy(() => import("./components/audit/SystemAuditDashboard"));
const PerformanceTracking = lazy(() => import("./components/performance/PerformanceTracking"));
import AccountsModule from "./components/modules/AccountsModule";
const ExpenseEntry = lazy(() => import("./components/accounts/ExpenseEntry"));
const ExpenseAnalytics = lazy(() => import("./components/accounts/ExpenseAnalytics"));
const VendorPayment = lazy(() => import("./components/accounts/VendorPayment"));
const GSTDashboard = lazy(() => import("./components/accounts/GSTDashboard"));
const AccountingEntry = lazy(() => import("./components/accounts/AccountingEntry"));
const JournalEntry = lazy(() => import("./components/accounts/JournalEntry"));
const AccountsDashboard = lazy(() => import("./components/accounts/AccountsDashboard"));
const AccountingTransactionList = lazy(() => import("./components/accounts/AccountingTransactionList"));
const AccountsLedger = lazy(() => import("./components/accounts/AccountsLedger"));
const PartyLedger = lazy(() => import("./components/accounts/PartyLedger"));
const TrialBalance = lazy(() => import("./components/accounts/TrialBalance"));
const BalanceSheet = lazy(() => import("./components/accounts/BalanceSheet"));
const LedgerMaster = lazy(() => import("./components/accounts/LedgerMaster"));
const RazorpayFlow = lazy(() => import("./components/accounts/RazorpayFlow"));
const ExpenseVoucher = lazy(() => import("./components/accounts/ExpenseVoucher"));
const ItemMaster = lazy(() => import("./components/accounts/ItemMaster"));
const GSTR2AReport = lazy(() => import("./components/accounts/GSTR2AReport"));
const PurchaseSummaryReport = lazy(() => import("./components/accounts/PurchaseSummaryReport"));
const SalesSummaryReport = lazy(() => import("./components/accounts/SalesSummaryReport"));
const RCMReport = lazy(() => import("./components/accounts/RCMReport"));
const StoreManagerModule = lazy(() => import("./components/modules/StoreManagerModule"));
const GRNEntry = lazy(() => import("./components/store-manager/GRNEntry"));
const PurchaseOrderCreation = lazy(() => import("./components/store-manager/PurchaseOrderCreation"));
const MOQManagement = lazy(() => import("./components/store-manager/MOQManagement"));
const InventoryMonitoring = lazy(() => import("./components/store-manager/InventoryMonitoring"));
const VendorRequest = lazy(() => import("./components/store-manager/VendorRequest"));
const AnalyticsDashboardWithDrillDown = lazy(() => import("./components/dashboards/AnalyticsDashboardWithDrillDown").then(m=>({default:m.AnalyticsDashboardWithDrillDown||m.default})));
const RoleBasedAnalyticsDashboard = lazy(() => import("./components/examples/RoleBasedAnalyticsDashboard"));
const CostPerWashReport = lazy(() => import("./components/reports/CostPerWashReport"));
const ActivityTimelineWrapper = lazy(() => import("./components/crm/ActivityTimelineWrapper"));
const NotificationCenter = lazy(() => import("./components/crm/NotificationCenter"));
const PayrollConfiguration = lazy(() => import("./components/payroll/PayrollConfiguration"));
const PayrollConfigTest = lazy(() => import("./components/payroll/PayrollConfigTest"));
const PayrollRun = lazy(() => import("./components/payroll/PayrollRun"));
const PayrollProcessing = lazy(() => import("./components/payroll/PayrollProcessing"));
const PayrollProcessingAdvanced = lazy(() => import("./components/payroll/PayrollProcessingAdvanced").then(m=>({default:m.PayrollProcessingAdvanced||m.default})));
const PayrollReviewApproval = lazy(() => import("./components/payroll/PayrollReviewApproval"));
const SalaryPayableView = lazy(() => import("./components/payroll/SalaryPayableView"));
const SalaryPaymentScreen = lazy(() => import("./components/payroll/SalaryPaymentScreen"));
const StatutoryPayablesScreen = lazy(() => import("./components/payroll/StatutoryPayablesScreen"));
const PlanEditor = lazy(() => import("./components/subscription/PlanEditor"));
const CommunicationTemplates = lazy(() => import("./components/settings/CommunicationTemplates"));
const CostConfiguration = lazy(() => import("./components/settings/CostConfiguration"));
const ServiceZonesManagement = lazy(() => import("./components/modules/ServiceZonesManagement"));
const WasherJobExecution = lazy(() => import("./components/modules/WasherJobExecution"));
const ExpansionOpportunities = lazy(() => import("./components/modules/ExpansionOpportunities"));
const SupplierDetail = lazy(() => import("./components/procurement/SupplierDetail"));
const CostTrackingIntegrationDemo = lazy(() => import("./components/demo/CostTrackingIntegrationDemo"));
import { DesignSystemTest } from "./design-system/tests/DesignSystemTest";
const ClothExchange = lazy(() => import("./components/cloth-tracking/ClothExchange"));
const ClothAdminDashboard = lazy(() => import("./components/cloth-tracking/ClothAdminDashboard"));
const AdvanceTypeSelection = lazy(() => import("./components/advance/AdvanceTypeSelection"));
const LongTermAdvanceForm = lazy(() => import("./components/advance/LongTermAdvanceForm"));
const ShortTermAdvanceForm = lazy(() => import("./components/advance/ShortTermAdvanceForm"));
const EmployeeAdvanceDashboard = lazy(() => import("./components/advance/EmployeeAdvanceDashboard"));
const AdvanceDetailView = lazy(() => import("./components/advance/AdvanceDetailView"));
const HRAdvanceManagement = lazy(() => import("./components/advance/HRAdvanceManagement"));
const OtherEarningsModule = lazy(() => import("./components/advance/OtherEarningsModule"));
const OtherDeductionsModule = lazy(() => import("./components/advance/OtherDeductionsModule"));
const AdjustmentsReport = lazy(() => import("./components/advance/AdjustmentsReport"));
const WorkflowControlDemo = lazy(() => import("./components/workflow/WorkflowControlDemo"));
const IncentiveEngineDemo = lazy(() => import("./components/workflow/IncentiveEngineDemo"));
const WeekOffCoverDemo = lazy(() => import("./components/washer/WeekOffCoverDemo"));
const SystemIntegrationDemo = lazy(() => import("./components/washer/SystemIntegrationDemo"));
const WasherCoreScreensDemo = lazy(() => import("./components/washer/WasherCoreScreensDemo"));
import WasherCoreScreensConnected from "./components/washer/WasherCoreScreensConnected";
import { SupervisorAppLazy as SupervisorAppConnected } from "./components/supervisor/SupervisorAppLazy";
const SupervisorLayout = lazy(() => import("./components/supervisor/SupervisorLayout"));
import ClusterManagerApp from "./components/cm/ClusterManagerApp";
import CityManagerApp from "./components/city/CityManagerApp";
import TeleSalesManagerApp from "./components/tsm/TeleSalesManagerApp";
import SalesHeadApp from "./components/sh/SalesHeadApp";
import SalesManagerApp from "./components/sm/SalesManagerApp";
import TeleSalesExecutiveApp from "./components/tse/TeleSalesExecutiveApp";
const TSEDiagnostics = lazy(() => import("./components/tse/TSEDiagnostics"));
const CustomerCareExecutiveApp = lazy(() => import("./components/cce/CustomerCareExecutiveApp"));
const SubscriptionApp = lazy(() => import("./components/subscription/SubscriptionApp"));
const PlanSelectionScreen = lazy(() => import("./components/subscription/PlanSelectionScreen"));
import CustomerPlanPageDirect from "./components/subscription/CustomerPlanPage";
import WasherTrackingPageDirect from "./components/washer/WasherTrackingPage";
const CustomerPlanPage = CustomerPlanPageDirect;
const SuperAdminPlanEditor = lazy(() => import("./components/admin/SuperAdminPlanEditor"));
const SubscriptionDiagnostics = lazy(() => import("./components/subscription/SubscriptionDiagnostics"));
const HierarchyDashboard = lazy(() => import("./components/hierarchy/HierarchyDashboard"));
const WasherAttendanceHistory = lazy(() => import("./components/washer/WasherAttendanceHistory"));
import OperationsRouter from "./components/operations/OperationsRouter";
const OperationsDataCapture = lazy(() => import("./components/operations/OperationsDataCapture"));
const OperationsLayout = lazy(() => import("./components/operations/OperationsLayout"));
const ClientPortal = lazy(() => import("./components/client/ClientPortal"));
const WorkingHoursSetup = lazy(() => import("./components/workforce/WorkingHoursSetup"));
const WorkingHoursTest = lazy(() => import("./components/workforce/WorkingHoursTest"));
const WorkingHoursSimple = lazy(() => import("./components/workforce/WorkingHoursSimple"));
const WorkforceDiagnostic = lazy(() => import("./components/workforce/WorkforceDiagnostic"));
const IncentiveSimulator = lazy(() => import("./components/incentives/IncentiveSimulator"));
const IncentiveDashboard = lazy(() => import("./components/incentives/IncentiveDashboard"));
const HRPayrollApproval = lazy(() => import("./components/hr/HRPayrollApproval"));
const SuperAdminPayrollApproval = lazy(() => import("./components/admin/SuperAdminPayrollApproval"));
const CityManagement = lazy(() => import("./components/admin/CityManagement"));
const BusinessRulesPage = lazy(() => import("./components/admin/BusinessRulesPage"));
const ShiftManagementPage = lazy(() => import("./components/admin/ShiftManagementPage"));
const AttendanceFraudAlertsPage = lazy(() => import("./components/admin/AttendanceFraudAlertsPage"));
const PermissionManagementPage = lazy(() => import("./components/admin/PermissionManagementPage"));
const RolePermissionManager = lazy(() => import("./components/admin/RolePermissionManager"));
const IncentiveVisibilityAdmin = lazy(() => import("./components/admin/IncentiveVisibilityAdmin"));
const RoleSuggestionsPage = lazy(() => import("./components/hr/RoleSuggestionsPage"));
const HRIntelligenceDashboard = lazy(() => import("./components/hr/HRIntelligenceDashboard"));
const AccountsPayrollProcessing = lazy(() => import("./components/accounts/AccountsPayrollProcessing").then(m=>({default:m.AccountsPayrollProcessing||m.default})));
const GSTOverview = lazy(() => import("./components/gst/GSTOverview"));
const GSTVendorMaster = lazy(() => import("./components/gst/GSTVendorMaster"));
const GSTCustomerMaster = lazy(() => import("./components/gst/GSTCustomerMaster"));
const GSTTransactionEntry = lazy(() => import("./components/gst/GSTTransactionEntry"));
const GSTValidationCentre = lazy(() => import("./components/gst/GSTValidationCentre"));
const GSTManagerReview = lazy(() => import("./components/gst/GSTManagerReview"));
const GSTReconciliation = lazy(() => import("./components/gst/GSTReconciliation"));
const GSTReports = lazy(() => import("./components/gst/GSTReports"));
const TransactionSubTypeManager = lazy(() => import("./components/gst/TransactionSubTypeManager"));
const GSTR1Module = lazy(() => import("./components/gst/GSTR1Module"));
const GSTR3BModule = lazy(() => import("./components/gst/GSTR3BModule"));
const GSTFilingModule = lazy(() => import("./components/gst/GSTFilingModule"));
const GSTMonitoringModule = lazy(() => import("./components/gst/GSTMonitoringModule"));
const BusinessFlowDemo = lazy(() => import("./components/BusinessFlowDemo"));
const UnauthorizedPage = lazy(() => import("./components/pages/UnauthorizedPage"));
import { LoginPage } from "./pages/LoginPage";
const MobileChangeRequest = lazy(() => import("./components/hr/MobileChangeRequest"));
const MyAccountPage = lazy(() => import("./components/hr/MyAccountPage"));
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
    element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OnboardingPortal /></Suspense></ErrorBoundary>,
  },
  {
    path: "/onboard/:empId",
    element: <OnboardingRedirect />,
  },
  // Public routes — no auth, no sidebar
  {
    path: "/buy",
    element: <ErrorBoundary><AppProvider><CustomerPlanPage /></AppProvider></ErrorBoundary>,
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
      { path: "supervisor", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorModuleUpdated /></Suspense></ErrorBoundary> },
      // Operations layout route with children
      {
        path: "operations",
        element: <OperationsLayout />,
        children: [
          { index: true, element: <ErrorBoundary><OperationsRouter /></ErrorBoundary> },
          { path: "data-capture", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OperationsDataCapture /></Suspense></ErrorBoundary> },
        ]
      },
      { path: "complaints", element: <ErrorBoundary><ComplaintManagement /></ErrorBoundary> },
      { path: "inventory", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><InventoryStore /></Suspense></ErrorBoundary> },
      { path: "inventory/requisition", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><MaterialRequisition /></Suspense></ErrorBoundary> },
      { path: "inventory/washer-issuances", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><WasherIssuances /></Suspense></ErrorBoundary> },
      { path: "inventory/washer-stock-ledger", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><WasherStockLedger /></Suspense></ErrorBoundary> },
      { path: "inventory/month-end-verification", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><MonthEndVerification /></Suspense></ErrorBoundary> },
      { path: "inventory/my-stock", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><MyStock /></Suspense></ErrorBoundary> },
      { path: "store", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><StoreModule /></Suspense></ErrorBoundary> },
      { path: "procurement", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ProcurementModule /></Suspense></ErrorBoundary> },
      { path: "finance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><FinanceModule /></Suspense></ErrorBoundary> },
      { path: "finance/analytics", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><FinanceAnalyticsDashboard /></Suspense></ErrorBoundary> },
      { path: "finance/reports", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><FinancialReportsModule /></Suspense></ErrorBoundary> },
      { path: "finance/transactions", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><FinanceTransactions /></Suspense></ErrorBoundary> },
      { path: "finance/ledger-entries", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><LedgerEntriesView /></Suspense></ErrorBoundary> },
      { path: "finance/chart-of-accounts", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ChartOfAccounts /></Suspense></ErrorBoundary> },
      { path: "finance/invoices", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><InvoiceManagement /></Suspense></ErrorBoundary> },
      { path: "finance/invoices/:id", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><InvoiceDetail /></Suspense></ErrorBoundary> },
      { path: "finance/payments", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PaymentManagement /></Suspense></ErrorBoundary> },
      { path: "finance/revenue-capture", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><RevenueCaptureSystem /></Suspense></ErrorBoundary> },
      { path: "finance/package-cost-matrix", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PackageCostMatrix /></Suspense></ErrorBoundary> },
      { path: "finance/cost-per-wash", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CostPerWashModule /></Suspense></ErrorBoundary> },
      { path: "finance/cost-per-wash/actual-inputs", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ActualCostInputs /></Suspense></ErrorBoundary> },
      { path: "hr", element: <ErrorBoundary><HRModule /></ErrorBoundary> },
      { path: "hr/leave", element: <Navigate to="/hr/professional-leave" replace /> },
      { path: "hr/enhanced-leave", element: <Navigate to="/hr/professional-leave" replace /> },
      { path: "hr/professional-leave", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ProfessionalLeaveManagement /></Suspense></ErrorBoundary> },
      { path: "hr/leave-policy-engine", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><LeavePolicyEngine /></Suspense></ErrorBoundary> },
      { path: "hr/onboarding", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeOnboarding /></Suspense></ErrorBoundary> },
      { path: "hr/exit-settlement", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ExitFFSettlement /></Suspense></ErrorBoundary> },
      { path: "hr/lifecycle-management", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeLifecycleManagement /></Suspense></ErrorBoundary> },
      { path: "hr/letters-documents", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><LettersDocuments /></Suspense></ErrorBoundary> },
      { path: "hr/id-card-generator", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><IDCardGenerator /></Suspense></ErrorBoundary> },
      { path: "hr/holiday-management", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><HolidayManagement /></Suspense></ErrorBoundary> },
      { path: "hr/lifecycle-reports", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><LifeCycleReports /></Suspense></ErrorBoundary> },
      { path: "hr/employee-ledger", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeLedger /></Suspense></ErrorBoundary> },
      { path: "hr/statutory-forms-onboarding", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><StatutoryFormsOnboarding /></Suspense></ErrorBoundary> },
      { path: "hr/statutory-forms-verification", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><StatutoryFormsVerification /></Suspense></ErrorBoundary> },
      { path: "hr/onboarding-automation", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OnboardingAutomation /></Suspense></ErrorBoundary> },
      { path: "hr/self-service", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeSelfService /></Suspense></ErrorBoundary> },
      { path: "hr/approval-center", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ApprovalCenterHR /></Suspense></ErrorBoundary> },
      { path: "hr/payroll-approval", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><HRPayrollApproval /></Suspense></ErrorBoundary> },
      { path: "hr/attendance-data-manager", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AttendanceDataManager /></Suspense></ErrorBoundary> },
      { path: "hr/test-statutory-routes", element: <DevOnlyRoute element={<TestStatutoryRoutes />} /> },
      { path: "hr/developer-routes", element: <DevOnlyRoute element={<DeveloperRouteDirectory />} /> },
      { path: "approvals", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ApprovalCenterMain /></Suspense></ErrorBoundary> },
      { path: "audit-trail", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AuditTrail /></Suspense></ErrorBoundary> },
      { path: "system-audit", element: <DevOnlyRoute element={<SystemAuditDashboard />} /> },
      { path: "performance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PerformanceTracking /></Suspense></ErrorBoundary> },
      { path: "accounts", element: <ErrorBoundary><AccountsModule /></ErrorBoundary> },
      { path: "accounts/expense-entry", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ExpenseEntry /></Suspense></ErrorBoundary> },
      { path: "accounts/expense-analytics", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ExpenseAnalytics /></Suspense></ErrorBoundary> },
      { path: "accounts/vendor-payment", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><VendorPayment /></Suspense></ErrorBoundary> },
      { path: "accounts/gst-dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTDashboard /></Suspense></ErrorBoundary> },
      { path: "accounts/gst-sub-types", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><TransactionSubTypeManager /></Suspense></ErrorBoundary> },
      { path: "accounts/payroll-processing", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AccountsPayrollProcessing /></Suspense></ErrorBoundary> },
      { path: "accounts/accounting-entry", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AccountingEntry /></Suspense></ErrorBoundary> },
      { path: "accounts/expense-voucher", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ExpenseVoucher /></Suspense></ErrorBoundary> },
      { path: "accounts/item-master", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ItemMaster /></Suspense></ErrorBoundary> },
      { path: "accounts/payables", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PayablesDashboard /></Suspense></ErrorBoundary> },
      { path: "accounts/tds-payable", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><TDSPayableModule /></Suspense></ErrorBoundary> },
      { path: "accounts/advance-tax", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdvanceTaxCalculator /></Suspense></ErrorBoundary> },
      { path: "accounts/journal-entry", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><JournalEntry /></Suspense></ErrorBoundary> },
      { path: "accounts/dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AccountsDashboard /></Suspense></ErrorBoundary> },
      { path: "accounts/transactions", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AccountingTransactionList /></Suspense></ErrorBoundary> },
      { path: "accounts/ledger", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AccountsLedger /></Suspense></ErrorBoundary> },
      { path: "accounts/party-ledger", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PartyLedger /></Suspense></ErrorBoundary> },
      { path: "accounts/ledger-master", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><LedgerMaster /></Suspense></ErrorBoundary> },
      { path: "accounts/razorpay-flow", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><RazorpayFlow /></Suspense></ErrorBoundary> },
      { path: "accounts/trial-balance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><TrialBalance /></Suspense></ErrorBoundary> },
      { path: "accounts/balance-sheet", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><BalanceSheet /></Suspense></ErrorBoundary> },
      { path: "accounts/gstr2a", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTR2AReport /></Suspense></ErrorBoundary> },
      { path: "accounts/reports/purchase", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PurchaseSummaryReport /></Suspense></ErrorBoundary> },
      { path: "accounts/reports/sales", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SalesSummaryReport /></Suspense></ErrorBoundary> },
      { path: "accounts/reports/rcm", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><RCMReport /></Suspense></ErrorBoundary> },
      { path: "gst", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTOverview /></Suspense></ErrorBoundary> },
      { path: "gst/vendors", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTVendorMaster /></Suspense></ErrorBoundary> },
      { path: "gst/customers", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTCustomerMaster /></Suspense></ErrorBoundary> },
      { path: "gst/transactions", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTTransactionEntry /></Suspense></ErrorBoundary> },
      { path: "gst/validation", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTValidationCentre /></Suspense></ErrorBoundary> },
      { path: "gst/review", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTManagerReview /></Suspense></ErrorBoundary> },
      { path: "gst/reconciliation", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTReconciliation /></Suspense></ErrorBoundary> },
      { path: "gst/reports", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTReports /></Suspense></ErrorBoundary> },
      { path: "gst/gstr1", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTR1Module /></Suspense></ErrorBoundary> },
      { path: "gst/gstr3b", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTR3BModule /></Suspense></ErrorBoundary> },
      { path: "gst/filing", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTFilingModule /></Suspense></ErrorBoundary> },
      { path: "gst/monitoring", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GSTMonitoringModule /></Suspense></ErrorBoundary> },
      { path: "admin/payroll-approval", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SuperAdminPayrollApproval /></Suspense></ErrorBoundary> },
      { path: "admin/city-management", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CityManagement /></Suspense></ErrorBoundary> },
      { path: "admin/business-rules", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><BusinessRulesPage /></Suspense></ErrorBoundary> },
      { path: "admin/shift-management", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ShiftManagementPage /></Suspense></ErrorBoundary> }, // MC-10
      { path: "admin/fraud-alerts", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AttendanceFraudAlertsPage /></Suspense></ErrorBoundary> }, // MC-09
      { path: "admin/permissions", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PermissionManagementPage /></Suspense></ErrorBoundary> }, // MC-11
      { path: "admin/role-permissions", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><RolePermissionManager /></Suspense></ErrorBoundary> }, // MC-11 Enhanced: Base role overrides + custom sub-roles
      { path: "admin/incentive-visibility", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><IncentiveVisibilityAdmin /></Suspense></ErrorBoundary> }, // Super Admin: show/hide incentive tab per role/employee
      { path: "hr/role-suggestions", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><RoleSuggestionsPage /></Suspense></ErrorBoundary> }, // MC-12
      { path: "hr/intelligence-dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><HRIntelligenceDashboard /></Suspense></ErrorBoundary> },
      { path: "store-manager", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><StoreManagerModule /></Suspense></ErrorBoundary> },
      { path: "store-manager/grn-entry", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><GRNEntry /></Suspense></ErrorBoundary> },
      { path: "store-manager/purchase-order", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PurchaseOrderCreation /></Suspense></ErrorBoundary> },
      { path: "store-manager/moq", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><MOQManagement /></Suspense></ErrorBoundary> },
      { path: "store-manager/inventory", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><InventoryMonitoring /></Suspense></ErrorBoundary> },
      { path: "store-manager/vendor-request", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><VendorRequest /></Suspense></ErrorBoundary> },
      {
        path: "analytics",
        element: <GlobalFiltersProvider><Outlet /></GlobalFiltersProvider>,
        children: [
          { index: true, element: <Navigate to="/analytics/dashboard" replace /> },
          { path: "dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AnalyticsDashboardWithDrillDown /></Suspense></ErrorBoundary> },
          { path: "unit-economics", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><UnitEconomicsDashboard /></Suspense></ErrorBoundary> },
          { path: "customer-ltv", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CustomerLTVAnalysis /></Suspense></ErrorBoundary> },
          { path: "cac", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CACDashboard /></Suspense></ErrorBoundary> },
          { path: "break-even", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><BreakEvenAnalysis /></Suspense></ErrorBoundary> },
          { path: "package-cost-matrix", element: <Navigate to="/finance/package-cost-matrix" replace /> },

          // PHASE 3: Consolidated Cost Module Routes
          // Main dashboard: /finance/cost-per-wash (CostPerWashModule)
          // Specialized views:
          { path: "cost-by-plan", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CostPerWashByPlan /></Suspense></ErrorBoundary> },
          { path: "cost-by-consumption", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CostPerWashByConsumption /></Suspense></ErrorBoundary> },
          { path: "labour-cost", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><LabourCostPerWash /></Suspense></ErrorBoundary> },
          { path: "cost-report", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CostPerWashReport /></Suspense></ErrorBoundary> },

          // Legacy redirects for backward compatibility
          { path: "cost-per-wash", element: <Navigate to="/finance/cost-per-wash" replace /> },
          // R4 FIX: /unit-economics/ doesn't exist in route tree — removed
          { path: "cost-per-wash-by-plan", element: <Navigate to="/analytics/cost-by-plan" replace /> },
          { path: "cost-per-wash-by-consumption", element: <Navigate to="/analytics/cost-by-consumption" replace /> },
          { path: "labour-cost-per-wash", element: <Navigate to="/analytics/labour-cost" replace /> },
          { path: "cost-per-wash-report", element: <Navigate to="/analytics/cost-report" replace /> },

          { path: "employee-efficiency", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeEfficiency /></Suspense></ErrorBoundary> },
          { path: "city-comparison", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CityComparison /></Suspense></ErrorBoundary> },
          { path: "role-based-demo", element: <DevOnlyRoute element={<RoleBasedAnalyticsDashboard />} /> },
        ]
      },
      { path: "founder/control-tower", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><FounderControlTower /></Suspense></ErrorBoundary> },
      { path: "founder/financial-view", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><DetailedFinancialView /></Suspense></ErrorBoundary> },
      { path: "founder/cash-flow", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CashFlowDashboard /></Suspense></ErrorBoundary> },
      { path: "founder/marketing-roi", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><MarketingROIDrilldown /></Suspense></ErrorBoundary> },
      { path: "crm/activity-timeline", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ActivityTimelineWrapper /></Suspense></ErrorBoundary> },
      { path: "crm/notifications", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><NotificationCenter /></Suspense></ErrorBoundary> },
      { path: "crm/conversion-analytics", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CRMConversionAnalyticsDashboard /></Suspense></ErrorBoundary> },
      { path: "payroll/test", element: <DevOnlyRoute element={<PayrollConfigTest />} /> },
      { path: "payroll/configuration", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PayrollConfiguration /></Suspense></ErrorBoundary> },
      { path: "payroll/create-salary-structure", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CreateSalaryStructure /></Suspense></ErrorBoundary> },
      { path: "payroll/salary-assignment", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeSalaryAssignment /></Suspense></ErrorBoundary> },
      { path: "payroll/run", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PayrollRun /></Suspense></ErrorBoundary> },
      { path: "payroll/processing", element: <Navigate to="/payroll/run" replace /> },
      { path: "payroll/processing-basic", element: <Navigate to="/payroll/run" replace /> },
      { path: "payroll/review-approval", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PayrollReviewApproval /></Suspense></ErrorBoundary> },
      { path: "payroll/salary-payables", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SalaryPayableView /></Suspense></ErrorBoundary> },
      { path: "payroll/salary-payment", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SalaryPaymentScreen /></Suspense></ErrorBoundary> },
      { path: "payroll/statutory-payables", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><StatutoryPayablesScreen /></Suspense></ErrorBoundary> },
      {
        path: "subscription",
        element: <Outlet />,
        children: [
          { index: true, element: <Navigate to="/subscription/plan-management" replace /> },
          { path: "plan-management", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdminPlanManagement userRole="ADMIN" /></Suspense></ErrorBoundary> },
          { path: "plan-editor", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PlanEditor /></Suspense></ErrorBoundary> },
        ]
      },
      { path: "settings/communication-templates", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CommunicationTemplates /></Suspense></ErrorBoundary> },
      { path: "settings/cost-configuration", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CostConfiguration /></Suspense></ErrorBoundary> },
      { path: "service-zones", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ServiceZonesManagement /></Suspense></ErrorBoundary> },
      { path: "washer-jobs", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><WasherJobExecution /></Suspense></ErrorBoundary> },
      { path: "expansion-opportunities", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ExpansionOpportunities /></Suspense></ErrorBoundary> },
      { path: "procurement/supplier/:supplierId", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupplierDetail /></Suspense></ErrorBoundary> },
      { path: "demo/cost-tracking-integration", element: <DevOnlyRoute element={<CostTrackingIntegrationDemo />} /> },
      { path: "design-system-test", element: <DevOnlyRoute element={<DesignSystemTest />} /> },
      // Cloth Tracking System
      { path: "cloth-tracking/exchange", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ClothExchange /></Suspense></ErrorBoundary> },
      { path: "cloth-tracking/admin", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ClothAdminDashboard /></Suspense></ErrorBoundary> },
      // Advance Management System
      { path: "advance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdvanceTypeSelection /></Suspense></ErrorBoundary> },
      { path: "advance/long-term/apply", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><LongTermAdvanceForm /></Suspense></ErrorBoundary> },
      { path: "advance/short-term/apply", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ShortTermAdvanceForm /></Suspense></ErrorBoundary> },
      { path: "advance/my-advances", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><EmployeeAdvanceDashboard /></Suspense></ErrorBoundary> },
      { path: "advance/status/:advanceId", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdvanceDetailView /></Suspense></ErrorBoundary> },
      { path: "advance/hr-management", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><HRAdvanceManagement /></Suspense></ErrorBoundary> },
      { path: "advance/other-earnings", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OtherEarningsModule /></Suspense></ErrorBoundary> },
      { path: "advance/other-deductions", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OtherDeductionsModule /></Suspense></ErrorBoundary> },
      { path: "advance/adjustments-report", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdjustmentsReport /></Suspense></ErrorBoundary> },
      // Travel Reimbursement
      { path: "travel", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><TravelReimbursementModule /></Suspense></ErrorBoundary> },

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
      { path: "washer/attendance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><WasherAttendanceHistory /></Suspense></ErrorBoundary> },
      { path: "washer/check-in", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/schedule", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/earnings", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "washer/raise-issue", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "finance/collections", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><FinanceTransactions /></Suspense></ErrorBoundary> },

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
      { path: "hierarchy-dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><HierarchyDashboard /></Suspense></ErrorBoundary> },

      // Tele Sales Manager App (Production) - Pipeline control tower
      { path: "tsm-app", element: <ErrorBoundary><TeleSalesManagerApp /></ErrorBoundary> },
      { path: "sh-app", element: <ErrorBoundary><SalesHeadApp /></ErrorBoundary> },
      { path: "sm-app-alliance", element: <ErrorBoundary><SalesManagerApp /></ErrorBoundary> },

      // Tele Sales Executive App (Production) - Sales execution interface
      { path: "tse-app", element: <ErrorBoundary><TeleSalesExecutiveApp /></ErrorBoundary> },
      { path: "tse-diagnostics", element: <DevOnlyRoute element={<TSEDiagnostics />} /> },

      // Customer Care Executive App (Production) - Complaint management interface
      { path: "cce-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CustomerCareExecutiveApp /></Suspense></ErrorBoundary> },

      // BTL Service Test Page
      { path: "test-btl", element: <DevOnlyRoute element={<TestBTLService />} /> },

      // Subscription Management System (Production) - Dynamic plan system
      { path: "subscription-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SubscriptionApp /></Suspense></ErrorBoundary> },
      { path: "plans", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PlanSelectionScreen /></Suspense></ErrorBoundary> },
      // /buy moved to public route below
      { path: "admin/plans", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdminPlanManagement userRole="ADMIN" /></Suspense></ErrorBoundary> },
      { path: "admin/plan-page-editor", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SuperAdminPlanEditor /></Suspense></ErrorBoundary> },
      { path: "subscription-diagnostics", element: <DevOnlyRoute element={<SubscriptionDiagnostics />} /> },

      // Client Portal - Read-only client interface
      { path: "client-portal", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ClientPortal /></Suspense></ErrorBoundary> },

      // Workforce Management - Working Hours & Shift Configuration
      { path: "workforce/diagnostic", element: <DevOnlyRoute element={<WorkforceDiagnostic />} /> },
      { path: "workforce/test", element: <DevOnlyRoute element={<WorkingHoursTest />} /> },
      { path: "workforce/simple", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><WorkingHoursSimple /></Suspense></ErrorBoundary> },
      { path: "workforce/working-hours", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><WorkingHoursSetup /></Suspense></ErrorBoundary> },

      // Incentive Management System - Configuration, Simulation & Forecasting
      { path: "incentives/configuration", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><IncentiveConfiguration /></Suspense></ErrorBoundary> },
      { path: "incentives/simulator", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><IncentiveSimulator /></Suspense></ErrorBoundary> },
      { path: "incentives/forecast", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><IncentiveDashboard /></Suspense></ErrorBoundary> },
      { path: "incentives", element: <Navigate to="/incentives/configuration" replace /> },

      // My Account - Employee self-service
      { path: "my-account", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><MyAccountPage /></Suspense></ErrorBoundary> },
      { path: "my-account/mobile-change", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><MobileChangeRequest /></Suspense></ErrorBoundary> },

      // Unauthorized page - shown when access denied
      { path: "unauthorized", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><UnauthorizedPage /></Suspense></ErrorBoundary> },

      // Catch-all 404 for authenticated routes - must be last in children array
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
