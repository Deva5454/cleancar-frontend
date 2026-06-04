// Router Configuration - FIXED: Removed bad imports (Updated: 2026-03-26)
import React, { lazy, Suspense } from "react";
import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { GlobalFiltersProvider } from "./components/navigation/GlobalFilterBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RootLayoutWrapper } from "./components/layouts/RootLayoutWrapper";

// Retry wrapper — if chunk 404s (stale cache after deploy), reload once
function retryLazy<T>(fn: () => Promise<T>): () => Promise<T> {
  return () => fn().catch(() => { window.location.reload(); return fn(); });
}

// Skeleton loader — looks like real content, not a broken spinner
const PageLoader = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-7 bg-gray-200 rounded-md w-2/5" />
    <div className="h-4 bg-gray-100 rounded w-3/5" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {[1,2,3].map(i => (
        <div key={i} className="h-32 bg-gray-100 rounded-xl border border-gray-200" />
      ))}
    </div>
    <div className="h-56 bg-gray-100 rounded-xl border border-gray-200 mt-2" />
    <div className="h-40 bg-gray-100 rounded-xl border border-gray-200" />
  </div>
);

// Lazy-loaded heavy components for code splitting
const OnboardingPortal = lazy(retryLazy(() => import("./components/OnboardingPortal")));
const HRModule = lazy(retryLazy(() => import("./components/modules/HRModule")));
const ProfessionalLeaveManagement = lazy(retryLazy(() => import("./components/hr/ProfessionalLeaveManagement")));
const StatutoryFormsOnboarding = lazy(retryLazy(() => import("./components/hr/StatutoryFormsOnboarding")));
const TravelReimbursementModule = lazy(retryLazy(() => import("./components/travel/TravelReimbursementModule")));
const ChartOfAccounts = lazy(retryLazy(() => import("./components/finance/ChartOfAccounts")));
const AdminPlanManagement = lazy(retryLazy(() => import("./components/subscription/AdminPlanManagement")));
const IncentiveConfiguration = lazy(retryLazy(() => import("./components/incentives/IncentiveConfiguration")));

// Analytics module - all lazy loaded
const UnitEconomicsDashboard = lazy(retryLazy(() => import("./components/analytics/UnitEconomicsDashboard")));
const CustomerLTVAnalysis = lazy(retryLazy(() => import("./components/analytics/CustomerLTVAnalysis")));
const CACDashboard = lazy(retryLazy(() => import("./components/analytics/CACDashboard")));
const BreakEvenAnalysis = lazy(retryLazy(() => import("./components/analytics/BreakEvenAnalysis")));
const CostPerWashCalculatorEnhanced = lazy(retryLazy(() => import("./components/analytics/CostPerWashCalculatorEnhanced")));
const CostPerWashByPlan = lazy(retryLazy(() => import("./components/analytics/CostPerWashByPlan")));
const CostPerWashByConsumption = lazy(retryLazy(() => import("./components/analytics/CostPerWashByConsumption")));
const LabourCostPerWash = lazy(retryLazy(() => import("./components/analytics/LabourCostPerWash")));
const EmployeeEfficiency = lazy(retryLazy(() => import("./components/analytics/EmployeeEfficiency")));
const CityComparison = lazy(retryLazy(() => import("./components/analytics/CityComparison")));

// R3 FIX: Founder module properly lazy-loaded (was importing eagerly despite "NOW LAZY" comments)
const FounderControlTower  = lazy(retryLazy(() => import("./components/founder/FounderControlTower")));
const DetailedFinancialView = lazy(retryLazy(() => import("./components/founder/DetailedFinancialView")));
const CashFlowDashboard    = lazy(retryLazy(() => import("./components/founder/CashFlowDashboard")));
const MarketingROIDrilldown = lazy(retryLazy(() => import("./components/founder/MarketingROIDrilldown")));

// Keep these as regular imports (frequently accessed)
// import { OnboardingPortal } from "./components/OnboardingPortal"; // NOW LAZY
import { OnboardingRedirect } from "./components/onboarding/OnboardingRedirect";
import { DevOnlyRoute } from "./components/guards/DevOnlyRoute";
// import { ChartOfAccounts } from "./components/finance/ChartOfAccounts"; // NOW LAZY
// import { HRModule } from "./components/modules/HRModule"; // NOW LAZY
// import { ProfessionalLeaveManagement } from "./components/hr/ProfessionalLeaveManagement"; // NOW LAZY
// import { StatutoryFormsOnboarding } from "./components/hr/StatutoryFormsOnboarding"; // NOW LAZY
// Phase 1 Accounting Entry System
const TDSPayableModule = lazy(retryLazy(() => import("./components/accounts/TDSPayableModule")));
const AdvanceTaxCalculator = lazy(retryLazy(() => import("./components/accounts/AdvanceTaxCalculator")));
const PayablesDashboard = lazy(retryLazy(() => import("./components/accounts/PayablesDashboard")));
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
const CreateSalaryStructure = lazy(retryLazy(() => import("./components/payroll/CreateSalaryStructure")));
const Dashboard = lazy(retryLazy(() => import("./components/Dashboard").then(m => ({default: m.Dashboard || m.default}))));
const UserManagement = lazy(retryLazy(() => import("./components/modules/UserManagement").then(m => ({default: m.UserManagement || m.default}))));
const CRMLeadManagementWithFilters = lazy(retryLazy(() => import("./components/modules/CRMLeadManagementWithFilters").then(m => ({default: m.CRMLeadManagementWithFilters || m.default}))));
const CRMConversionAnalyticsDashboard = lazy(retryLazy(() => import("./components/modules/CRMConversionAnalyticsDashboard").then(m => ({default: m.CRMConversionAnalyticsDashboard || m.default}))));
const CustomerSubscription = lazy(retryLazy(() => import("./components/modules/CustomerSubscription").then(m => ({default: m.CustomerSubscription || m.default}))));
const SupervisorModuleUpdated = lazy(retryLazy(() => import("./components/modules/SupervisorModuleUpdated").then(m => ({default: m.SupervisorModuleUpdated || m.default}))));
const OperationsManagerApp = lazy(retryLazy(() => import("./components/om/OperationsManagerApp").then(m => ({default: m.OperationsManagerApp || m.default}))));
const ComplaintManagement = lazy(retryLazy(() => import("./components/modules/ComplaintManagement").then(m => ({default: m.ComplaintManagement || m.default}))));
const InventoryStore = lazy(retryLazy(() => import("./components/modules/InventoryStore").then(m => ({default: m.InventoryStore || m.default}))));
const MaterialRequisition = lazy(retryLazy(() => import("./components/inventory/MaterialRequisition").then(m => ({default: m.MaterialRequisition || m.default}))));
const WasherIssuances = lazy(retryLazy(() => import("./components/inventory/WasherIssuances").then(m => ({default: m.WasherIssuances || m.default}))));
const WasherStockLedger = lazy(retryLazy(() => import("./components/inventory/WasherStockLedger").then(m => ({default: m.WasherStockLedger || m.default}))));
const MonthEndVerification = lazy(retryLazy(() => import("./components/inventory/MonthEndVerification").then(m => ({default: m.MonthEndVerification || m.default}))));
const MyStock = lazy(retryLazy(() => import("./components/washer/MyStock").then(m => ({default: m.MyStock || m.default}))));
const StoreModule = lazy(retryLazy(() => import("./components/modules/StoreModule").then(m => ({default: m.StoreModule || m.default}))));
const ProcurementModule = lazy(retryLazy(() => import("./components/modules/ProcurementModule").then(m => ({default: m.ProcurementModule || m.default}))));
const FinanceModule = lazy(retryLazy(() => import("./components/modules/FinanceModule").then(m => ({default: m.FinanceModule || m.default}))));
const RevenueCaptureSystem = lazy(retryLazy(() => import("./components/finance/RevenueCaptureSystem").then(m => ({default: m.RevenueCaptureSystem || m.default}))));
const PackageCostMatrix = lazy(retryLazy(() => import("./components/finance/PackageCostMatrix").then(m => ({default: m.PackageCostMatrix || m.default}))));
const CostPerWashModule = lazy(retryLazy(() => import("./components/finance/CostPerWashModule").then(m => ({default: m.CostPerWashModule || m.default}))));
const ActualCostInputs = lazy(retryLazy(() => import("./components/finance/ActualCostInputs").then(m => ({default: m.ActualCostInputs || m.default}))));
const FinanceTransactions = lazy(retryLazy(() => import("./components/finance/FinanceTransactions").then(m => ({default: m.FinanceTransactions || m.default}))));
const LedgerEntriesView = lazy(retryLazy(() => import("./components/finance/LedgerEntriesView").then(m => ({default: m.LedgerEntriesView || m.default}))));
const FinanceAnalyticsDashboard = lazy(retryLazy(() => import("./components/finance/FinanceAnalyticsDashboard").then(m => ({default: m.FinanceAnalyticsDashboard || m.default}))));
const FinancialReportsModule = lazy(retryLazy(() => import("./components/finance/FinancialReportsModule").then(m => ({default: m.FinancialReportsModule || m.default}))));
const InvoiceManagement = lazy(retryLazy(() => import("./components/finance/InvoiceManagement")));
const InvoiceDetail = lazy(retryLazy(() => import("./components/finance/InvoiceDetail")));
const PaymentManagement = lazy(retryLazy(() => import("./components/finance/PaymentManagement")));
const LeavePolicyEngine = lazy(retryLazy(() => import("./components/hr/LeavePolicyEngine").then(m => ({default: m.LeavePolicyEngine || m.default}))));
const EmployeeOnboarding = lazy(retryLazy(() => import("./components/hr/EmployeeOnboarding").then(m => ({default: m.EmployeeOnboarding || m.default}))));
const ExitFFSettlement = lazy(retryLazy(() => import("./components/hr/ExitFFSettlement").then(m => ({default: m.ExitFFSettlement || m.default}))));
const EmployeeLifecycleManagement = lazy(retryLazy(() => import("./components/hr/EmployeeLifecycleManagement").then(m => ({default: m.EmployeeLifecycleManagement || m.default}))));
const LettersDocuments = lazy(retryLazy(() => import("./components/hr/LettersDocuments").then(m => ({default: m.LettersDocuments || m.default}))));
const IDCardGenerator = lazy(retryLazy(() => import("./components/hr/IDCardGenerator").then(m => ({default: m.IDCardGenerator || m.default}))));
const HolidayManagement = lazy(retryLazy(() => import("./components/hr/HolidayManagement").then(m => ({default: m.HolidayManagement || m.default}))));
const LifeCycleReports = lazy(retryLazy(() => import("./components/hr/LifeCycleReports").then(m => ({default: m.LifeCycleReports || m.default}))));
const EmployeeLedger = lazy(retryLazy(() => import("./components/hr/EmployeeLedger").then(m => ({default: m.EmployeeLedger || m.default}))));
const StatutoryFormsVerification = lazy(retryLazy(() => import("./components/hr/StatutoryFormsVerification").then(m => ({default: m.StatutoryFormsVerification || m.default}))));
const OnboardingAutomation = lazy(retryLazy(() => import("./components/hr/OnboardingAutomation").then(m => ({default: m.OnboardingAutomation || m.default}))));
const EmployeeSalaryAssignment = lazy(retryLazy(() => import("./components/payroll/EmployeeSalaryAssignment").then(m => ({default: m.EmployeeSalaryAssignment || m.default}))));
const EmployeeSelfService = lazy(retryLazy(() => import("./components/hr/EmployeeSelfService").then(m => ({default: m.EmployeeSelfService || m.default}))));
const AttendanceDataManager = lazy(retryLazy(() => import("./components/admin/AttendanceDataManager").then(m => ({default: m.AttendanceDataManager || m.default}))));
const ApprovalCenterHR = lazy(retryLazy(() => import("./components/hr/ApprovalCenter").then(m => ({default: m.ApprovalCenter || m.default}))));
const TestStatutoryRoutes = lazy(retryLazy(() => import("./components/TestStatutoryRoutes").then(m => ({default: m.TestStatutoryRoutes || m.default}))));
const DeveloperRouteDirectory = lazy(retryLazy(() => import("./components/developer/DeveloperRouteDirectory").then(m => ({default: m.DeveloperRouteDirectory || m.default}))));
const ApprovalCenter = lazy(retryLazy(() => import("./components/ApprovalCenter").then(m => ({default: m.ApprovalCenter || m.default}))));
const AuditTrail = lazy(retryLazy(() => import("./components/AuditTrail").then(m => ({default: m.AuditTrail || m.default}))));
const SystemAuditDashboard = lazy(retryLazy(() => import("./components/audit/SystemAuditDashboard").then(m => ({default: m.SystemAuditDashboard || m.default}))));
const PerformanceTracking = lazy(retryLazy(() => import("./components/performance/PerformanceTracking").then(m => ({default: m.PerformanceTracking || m.default}))));
const AccountsModule = lazy(retryLazy(() => import("./components/modules/AccountsModule").then(m => ({default: m.AccountsModule || m.default}))));
const ExpenseEntry = lazy(retryLazy(() => import("./components/accounts/ExpenseEntry").then(m => ({default: m.ExpenseEntry || m.default}))));
const ExpenseAnalytics = lazy(retryLazy(() => import("./components/accounts/ExpenseAnalytics").then(m => ({default: m.ExpenseAnalytics || m.default}))));
const VendorPayment = lazy(retryLazy(() => import("./components/accounts/VendorPayment").then(m => ({default: m.VendorPayment || m.default}))));
const GSTDashboard = lazy(retryLazy(() => import("./components/accounts/GSTDashboard").then(m => ({default: m.GSTDashboard || m.default}))));
const AccountingEntry = lazy(retryLazy(() => import("./components/accounts/AccountingEntry").then(m => ({default: m.AccountingEntry || m.default}))));
const JournalEntry = lazy(retryLazy(() => import("./components/accounts/JournalEntry").then(m => ({default: m.JournalEntry || m.default}))));
const AccountsDashboard = lazy(retryLazy(() => import("./components/accounts/AccountsDashboard").then(m => ({default: m.AccountsDashboard || m.default}))));
const AccountingTransactionList = lazy(retryLazy(() => import("./components/accounts/AccountingTransactionList").then(m => ({default: m.AccountingTransactionList || m.default}))));
const AccountsLedger = lazy(retryLazy(() => import("./components/accounts/AccountsLedger").then(m => ({default: m.AccountsLedger || m.default}))));
const PartyLedger = lazy(retryLazy(() => import("./components/accounts/PartyLedger").then(m => ({default: m.PartyLedger || m.default}))));
const TrialBalance = lazy(retryLazy(() => import("./components/accounts/TrialBalance").then(m => ({default: m.TrialBalance || m.default}))));
const BalanceSheet = lazy(retryLazy(() => import("./components/accounts/BalanceSheet").then(m => ({default: m.BalanceSheet || m.default}))));
const LedgerMaster = lazy(retryLazy(() => import("./components/accounts/LedgerMaster").then(m => ({default: m.LedgerMaster || m.default}))));
const RazorpayFlow = lazy(retryLazy(() => import("./components/accounts/RazorpayFlow").then(m => ({default: m.RazorpayFlow || m.default}))));
const ExpenseVoucher = lazy(retryLazy(() => import("./components/accounts/ExpenseVoucher").then(m => ({default: m.ExpenseVoucher || m.default}))));
const ItemMaster = lazy(retryLazy(() => import("./components/accounts/ItemMaster").then(m => ({default: m.ItemMaster || m.default}))));
const GSTR2AReport = lazy(retryLazy(() => import("./components/accounts/GSTR2AReport").then(m => ({default: m.GSTR2AReport || m.default}))));
const PurchaseSummaryReport = lazy(retryLazy(() => import("./components/accounts/PurchaseSummaryReport").then(m => ({default: m.PurchaseSummaryReport || m.default}))));
const SalesSummaryReport = lazy(retryLazy(() => import("./components/accounts/SalesSummaryReport").then(m => ({default: m.SalesSummaryReport || m.default}))));
const RCMReport = lazy(retryLazy(() => import("./components/accounts/RCMReport").then(m => ({default: m.RCMReport || m.default}))));
const StoreManagerModule = lazy(retryLazy(() => import("./components/modules/StoreManagerModule").then(m => ({default: m.StoreManagerModule || m.default}))));
const GRNEntry = lazy(retryLazy(() => import("./components/store-manager/GRNEntry").then(m => ({default: m.GRNEntry || m.default}))));
const PurchaseOrderCreation = lazy(retryLazy(() => import("./components/store-manager/PurchaseOrderCreation").then(m => ({default: m.PurchaseOrderCreation || m.default}))));
const MOQManagement = lazy(retryLazy(() => import("./components/store-manager/MOQManagement").then(m => ({default: m.MOQManagement || m.default}))));
const InventoryMonitoring = lazy(retryLazy(() => import("./components/store-manager/InventoryMonitoring").then(m => ({default: m.InventoryMonitoring || m.default}))));
const VendorRequest = lazy(retryLazy(() => import("./components/store-manager/VendorRequest").then(m => ({default: m.VendorRequest || m.default}))));
const AnalyticsDashboardWithDrillDown = lazy(retryLazy(() => import("./components/dashboards/AnalyticsDashboardWithDrillDown").then(m => ({default: m.AnalyticsDashboardWithDrillDown || m.default}))));
const RoleBasedAnalyticsDashboard = lazy(retryLazy(() => import("./components/examples/RoleBasedAnalyticsDashboard").then(m => ({default: m.RoleBasedAnalyticsDashboard || m.default}))));
const CostPerWashReport = lazy(retryLazy(() => import("./components/reports/CostPerWashReport").then(m => ({default: m.CostPerWashReport || m.default}))));
const ActivityTimelineWrapper = lazy(retryLazy(() => import("./components/crm/ActivityTimelineWrapper").then(m => ({default: m.ActivityTimelineWrapper || m.default}))));
const NotificationCenter = lazy(retryLazy(() => import("./components/crm/NotificationCenter").then(m => ({default: m.NotificationCenter || m.default}))));
const PayrollConfiguration = lazy(retryLazy(() => import("./components/payroll/PayrollConfiguration").then(m => ({default: m.PayrollConfiguration || m.default}))));
const PayrollConfigTest = lazy(retryLazy(() => import("./components/payroll/PayrollConfigTest").then(m => ({default: m.PayrollConfigTest || m.default}))));
const PayrollRun = lazy(retryLazy(() => import("./components/payroll/PayrollRun").then(m => ({default: m.PayrollRun || m.default}))));
const PayrollProcessing = lazy(retryLazy(() => import("./components/payroll/PayrollProcessing").then(m => ({default: m.PayrollProcessing || m.default}))));
const PayrollProcessingAdvanced = lazy(retryLazy(() => import("./components/payroll/PayrollProcessingAdvanced").then(m => ({default: m.PayrollProcessingAdvanced || m.default}))));
const PayrollReviewApproval = lazy(retryLazy(() => import("./components/payroll/PayrollReviewApproval").then(m => ({default: m.PayrollReviewApproval || m.default}))));
const SalaryPayableView = lazy(retryLazy(() => import("./components/payroll/SalaryPayableView").then(m => ({default: m.SalaryPayableView || m.default}))));
const SalaryPaymentScreen = lazy(retryLazy(() => import("./components/payroll/SalaryPaymentScreen").then(m => ({default: m.SalaryPaymentScreen || m.default}))));
const StatutoryPayablesScreen = lazy(retryLazy(() => import("./components/payroll/StatutoryPayablesScreen").then(m => ({default: m.StatutoryPayablesScreen || m.default}))));
const PlanEditor = lazy(retryLazy(() => import("./components/subscription/PlanEditor").then(m => ({default: m.PlanEditor || m.default}))));
const CommunicationTemplates = lazy(retryLazy(() => import("./components/settings/CommunicationTemplates").then(m => ({default: m.CommunicationTemplates || m.default}))));
const CostConfiguration = lazy(retryLazy(() => import("./components/settings/CostConfiguration").then(m => ({default: m.CostConfiguration || m.default}))));
const ServiceZonesManagement = lazy(retryLazy(() => import("./components/modules/ServiceZonesManagement").then(m => ({default: m.ServiceZonesManagement || m.default}))));
const WasherJobExecution = lazy(retryLazy(() => import("./components/modules/WasherJobExecution").then(m => ({default: m.WasherJobExecution || m.default}))));
const ExpansionOpportunities = lazy(retryLazy(() => import("./components/modules/ExpansionOpportunities").then(m => ({default: m.ExpansionOpportunities || m.default}))));
const SupplierDetail = lazy(retryLazy(() => import("./components/procurement/SupplierDetail").then(m => ({default: m.SupplierDetail || m.default}))));
const CostTrackingIntegrationDemo = lazy(retryLazy(() => import("./components/demo/CostTrackingIntegrationDemo").then(m => ({default: m.CostTrackingIntegrationDemo || m.default}))));
const DesignSystemTest = lazy(retryLazy(() => import("./design-system/tests/DesignSystemTest").then(m => ({default: m.DesignSystemTest || m.default}))));
const ClothExchange = lazy(retryLazy(() => import("./components/cloth-tracking/ClothExchange").then(m => ({default: m.ClothExchange || m.default}))));
const ClothAdminDashboard = lazy(retryLazy(() => import("./components/cloth-tracking/ClothAdminDashboard").then(m => ({default: m.ClothAdminDashboard || m.default}))));
const AdvanceTypeSelection = lazy(retryLazy(() => import("./components/advance/AdvanceTypeSelection").then(m => ({default: m.AdvanceTypeSelection || m.default}))));
const LongTermAdvanceForm = lazy(retryLazy(() => import("./components/advance/LongTermAdvanceForm").then(m => ({default: m.LongTermAdvanceForm || m.default}))));
const ShortTermAdvanceForm = lazy(retryLazy(() => import("./components/advance/ShortTermAdvanceForm").then(m => ({default: m.ShortTermAdvanceForm || m.default}))));
const EmployeeAdvanceDashboard = lazy(retryLazy(() => import("./components/advance/EmployeeAdvanceDashboard").then(m => ({default: m.EmployeeAdvanceDashboard || m.default}))));
const AdvanceDetailView = lazy(retryLazy(() => import("./components/advance/AdvanceDetailView").then(m => ({default: m.AdvanceDetailView || m.default}))));
const HRAdvanceManagement = lazy(retryLazy(() => import("./components/advance/HRAdvanceManagement").then(m => ({default: m.HRAdvanceManagement || m.default}))));
const OtherEarningsModule = lazy(retryLazy(() => import("./components/advance/OtherEarningsModule").then(m => ({default: m.OtherEarningsModule || m.default}))));
const OtherDeductionsModule = lazy(retryLazy(() => import("./components/advance/OtherDeductionsModule").then(m => ({default: m.OtherDeductionsModule || m.default}))));
const AdjustmentsReport = lazy(retryLazy(() => import("./components/advance/AdjustmentsReport").then(m => ({default: m.AdjustmentsReport || m.default}))));
const WorkflowControlDemo = lazy(retryLazy(() => import("./components/workflow/WorkflowControlDemo").then(m => ({default: m.WorkflowControlDemo || m.default}))));
const IncentiveEngineDemo = lazy(retryLazy(() => import("./components/workflow/IncentiveEngineDemo").then(m => ({default: m.IncentiveEngineDemo || m.default}))));
const WeekOffCoverDemo = lazy(retryLazy(() => import("./components/washer/WeekOffCoverDemo").then(m => ({default: m.WeekOffCoverDemo || m.default}))));
const SystemIntegrationDemo = lazy(retryLazy(() => import("./components/washer/SystemIntegrationDemo").then(m => ({default: m.SystemIntegrationDemo || m.default}))));
const WasherCoreScreensDemo = lazy(retryLazy(() => import("./components/washer/WasherCoreScreensDemo").then(m => ({default: m.WasherCoreScreensDemo || m.default}))));
const WasherCoreScreensConnected = lazy(retryLazy(() => import("./components/washer/WasherCoreScreensConnected").then(m => ({default: m.WasherCoreScreensConnected || m.default}))));
const SupervisorAppConnected = lazy(retryLazy(() => import("./components/supervisor/SupervisorAppConnected").then(m => ({default: m.SupervisorAppConnected || m.default}))));
const SupervisorLayout = lazy(retryLazy(() => import("./components/supervisor/SupervisorLayout").then(m => ({default: m.SupervisorLayout || m.default}))));
const ClusterManagerApp = lazy(retryLazy(() => import("./components/cm/ClusterManagerApp").then(m => ({default: m.ClusterManagerApp || m.default}))));
const CityManagerApp = lazy(retryLazy(() => import("./components/city/CityManagerApp").then(m => ({default: m.CityManagerApp || m.default}))));
const TeleSalesManagerApp = lazy(retryLazy(() => import("./components/tsm/TeleSalesManagerApp").then(m => ({default: m.TeleSalesManagerApp || m.default}))));
const SalesHeadApp = lazy(retryLazy(() => import("./components/sh/SalesHeadApp").then(m => ({default: m.SalesHeadApp || m.default}))));
const SalesManagerApp = lazy(retryLazy(() => import("./components/sm/SalesManagerApp").then(m => ({default: m.SalesManagerApp || m.default}))));
const TeleSalesExecutiveApp = lazy(retryLazy(() => import("./components/tse/TeleSalesExecutiveApp").then(m => ({default: m.TeleSalesExecutiveApp || m.default}))));
const TSEDiagnostics = lazy(retryLazy(() => import("./components/tse/TSEDiagnostics").then(m => ({default: m.TSEDiagnostics || m.default}))));
const CustomerCareExecutiveApp = lazy(retryLazy(() => import("./components/cce/CustomerCareExecutiveApp").then(m => ({default: m.CustomerCareExecutiveApp || m.default}))));
const TestBTLService = lazy(retryLazy(() => import("./test-btl-service")));
const SubscriptionApp = lazy(retryLazy(() => import("./components/subscription/SubscriptionApp").then(m => ({default: m.SubscriptionApp || m.default}))));
const PlanSelectionScreen = lazy(retryLazy(() => import("./components/subscription/PlanSelectionScreen").then(m => ({default: m.PlanSelectionScreen || m.default}))));
const CustomerPlanPage = lazy(retryLazy(() => import("./components/subscription/CustomerPlanPage").then(m => ({default: m.CustomerPlanPage || m.default}))));
const SuperAdminPlanEditor = lazy(retryLazy(() => import("./components/admin/SuperAdminPlanEditor").then(m => ({default: m.SuperAdminPlanEditor || m.default}))));
const SubscriptionDiagnostics = lazy(retryLazy(() => import("./components/subscription/SubscriptionDiagnostics").then(m => ({default: m.SubscriptionDiagnostics || m.default}))));
const HierarchyDashboard = lazy(retryLazy(() => import("./components/hierarchy/HierarchyDashboard").then(m => ({default: m.HierarchyDashboard || m.default}))));
const WasherAttendanceHistory = lazy(retryLazy(() => import("./components/washer/WasherAttendanceHistory").then(m => ({default: m.WasherAttendanceHistory || m.default}))));
const OperationsRouter = lazy(retryLazy(() => import("./components/operations/OperationsRouter").then(m => ({default: m.OperationsRouter || m.default}))));
const OperationsDataCapture = lazy(retryLazy(() => import("./components/operations/OperationsDataCapture").then(m => ({default: m.OperationsDataCapture || m.default}))));
const OperationsLayout = lazy(retryLazy(() => import("./components/operations/OperationsLayout").then(m => ({default: m.OperationsLayout || m.default}))));
const ClientPortal = lazy(retryLazy(() => import("./components/client/ClientPortal").then(m => ({default: m.ClientPortal || m.default}))));
const WorkingHoursSetup = lazy(retryLazy(() => import("./components/workforce/WorkingHoursSetup").then(m => ({default: m.WorkingHoursSetup || m.default}))));
const WorkingHoursTest = lazy(retryLazy(() => import("./components/workforce/WorkingHoursTest").then(m => ({default: m.WorkingHoursTest || m.default}))));
const WorkingHoursSimple = lazy(retryLazy(() => import("./components/workforce/WorkingHoursSimple").then(m => ({default: m.WorkingHoursSimple || m.default}))));
const WorkforceDiagnostic = lazy(retryLazy(() => import("./components/workforce/WorkforceDiagnostic").then(m => ({default: m.WorkforceDiagnostic || m.default}))));
const IncentiveSimulator = lazy(retryLazy(() => import("./components/incentives/IncentiveSimulator").then(m => ({default: m.IncentiveSimulator || m.default}))));
const IncentiveDashboard = lazy(retryLazy(() => import("./components/incentives/IncentiveDashboard").then(m => ({default: m.IncentiveDashboard || m.default}))));
const HRPayrollApproval = lazy(retryLazy(() => import("./components/hr/HRPayrollApproval").then(m => ({default: m.HRPayrollApproval || m.default}))));
const SuperAdminPayrollApproval = lazy(retryLazy(() => import("./components/admin/SuperAdminPayrollApproval").then(m => ({default: m.SuperAdminPayrollApproval || m.default}))));
const CityManagement = lazy(retryLazy(() => import("./components/admin/CityManagement").then(m => ({default: m.CityManagement || m.default}))));
const BusinessRulesPage = lazy(retryLazy(() => import("./components/admin/BusinessRulesPage").then(m => ({default: m.BusinessRulesPage || m.default}))));
const ShiftManagementPage = lazy(retryLazy(() => import("./components/admin/ShiftManagementPage").then(m => ({default: m.ShiftManagementPage || m.default}))));
const AttendanceFraudAlertsPage = lazy(retryLazy(() => import("./components/admin/AttendanceFraudAlertsPage").then(m => ({default: m.AttendanceFraudAlertsPage || m.default}))));
const PermissionManagementPage = lazy(retryLazy(() => import("./components/admin/PermissionManagementPage").then(m => ({default: m.PermissionManagementPage || m.default}))));
const RolePermissionManager = lazy(retryLazy(() => import("./components/admin/RolePermissionManager").then(m => ({default: m.RolePermissionManager || m.default}))));
const IncentiveVisibilityAdmin = lazy(retryLazy(() => import("./components/admin/IncentiveVisibilityAdmin").then(m => ({default: m.IncentiveVisibilityAdmin || m.default}))));
const RoleSuggestionsPage = lazy(retryLazy(() => import("./components/hr/RoleSuggestionsPage").then(m => ({default: m.RoleSuggestionsPage || m.default}))));
const HRIntelligenceDashboard = lazy(retryLazy(() => import("./components/hr/HRIntelligenceDashboard").then(m => ({default: m.HRIntelligenceDashboard || m.default}))));
const AccountsPayrollProcessing = lazy(retryLazy(() => import("./components/accounts/AccountsPayrollProcessing").then(m => ({default: m.AccountsPayrollProcessing || m.default}))));
const GSTOverview = lazy(retryLazy(() => import("./components/gst/GSTOverview").then(m => ({default: m.GSTOverview || m.default}))));
const GSTVendorMaster = lazy(retryLazy(() => import("./components/gst/GSTVendorMaster").then(m => ({default: m.GSTVendorMaster || m.default}))));
const GSTCustomerMaster = lazy(retryLazy(() => import("./components/gst/GSTCustomerMaster").then(m => ({default: m.GSTCustomerMaster || m.default}))));
const GSTTransactionEntry = lazy(retryLazy(() => import("./components/gst/GSTTransactionEntry").then(m => ({default: m.GSTTransactionEntry || m.default}))));
const GSTValidationCentre = lazy(retryLazy(() => import("./components/gst/GSTValidationCentre").then(m => ({default: m.GSTValidationCentre || m.default}))));
const GSTManagerReview = lazy(retryLazy(() => import("./components/gst/GSTManagerReview").then(m => ({default: m.GSTManagerReview || m.default}))));
const GSTReconciliation = lazy(retryLazy(() => import("./components/gst/GSTReconciliation").then(m => ({default: m.GSTReconciliation || m.default}))));
const GSTReports = lazy(retryLazy(() => import("./components/gst/GSTReports").then(m => ({default: m.GSTReports || m.default}))));
const TransactionSubTypeManager = lazy(retryLazy(() => import("./components/gst/TransactionSubTypeManager").then(m => ({default: m.TransactionSubTypeManager || m.default}))));
const GSTR1Module = lazy(retryLazy(() => import("./components/gst/GSTR1Module").then(m => ({default: m.GSTR1Module || m.default}))));
const GSTR3BModule = lazy(retryLazy(() => import("./components/gst/GSTR3BModule").then(m => ({default: m.GSTR3BModule || m.default}))));
const GSTFilingModule = lazy(retryLazy(() => import("./components/gst/GSTFilingModule").then(m => ({default: m.GSTFilingModule || m.default}))));
const GSTMonitoringModule = lazy(retryLazy(() => import("./components/gst/GSTMonitoringModule").then(m => ({default: m.GSTMonitoringModule || m.default}))));
const BusinessFlowDemo = lazy(retryLazy(() => import("./components/BusinessFlowDemo").then(m => ({default: m.BusinessFlowDemo || m.default}))));
const UnauthorizedPage = lazy(retryLazy(() => import("./components/pages/UnauthorizedPage").then(m => ({default: m.UnauthorizedPage || m.default}))));
const LoginPage = lazy(retryLazy(() => import("./pages/LoginPage").then(m => ({default: m.LoginPage || m.default}))));
const MobileChangeRequest = lazy(retryLazy(() => import("./components/hr/MobileChangeRequest").then(m => ({default: m.MobileChangeRequest || m.default}))));
const MyAccountPage = lazy(retryLazy(() => import("./components/hr/MyAccountPage").then(m => ({default: m.MyAccountPage || m.default}))));


export const router = createHashRouter([
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
  // Main application routes with layout
  {
    path: "/",
    element: <RootLayoutWrapper />,
    errorElement: (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 p-8"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><span className="text-red-600 text-xl font-bold">!</span></div><h2 className="text-lg font-semibold text-gray-900">Page Error</h2><p className="text-sm text-gray-500">This page has an error. Other pages still work.</p><a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm">Go to Dashboard</a></div>),
    children: [
      { index: true, element: <ErrorBoundary><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ErrorBoundary> },

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
      { path: "users", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><UserManagement /></Suspense></ErrorBoundary> },
      { path: "leads", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CRMLeadManagementWithFilters /></Suspense></ErrorBoundary> },
      { path: "customers", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CustomerSubscription /></Suspense></ErrorBoundary> },
      { path: "car-washer", element: <Navigate to="/washer-core-screens" replace /> },
      { path: "supervisor", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SupervisorModuleUpdated /></Suspense></ErrorBoundary> },
      // Operations layout route with children
      {
        path: "operations",
        element: <OperationsLayout />,
        children: [
          { index: true, element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OperationsRouter /></Suspense></ErrorBoundary> },
          { path: "data-capture", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OperationsDataCapture /></Suspense></ErrorBoundary> },
        ]
      },
      { path: "complaints", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ComplaintManagement /></Suspense></ErrorBoundary> },
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
      { path: "hr", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><HRModule /></Suspense></ErrorBoundary> },
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
      { path: "approvals", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ApprovalCenter /></Suspense></ErrorBoundary> },
      { path: "audit-trail", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AuditTrail /></Suspense></ErrorBoundary> },
      { path: "system-audit", element: <DevOnlyRoute element={<SystemAuditDashboard />} /> },
      { path: "performance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PerformanceTracking /></Suspense></ErrorBoundary> },
      { path: "accounts", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AccountsModule /></Suspense></ErrorBoundary> },
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
      { path: "washer-core-screens", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><WasherCoreScreensConnected /></Suspense></ErrorBoundary> },

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
      { path: "om-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><OperationsManagerApp /></Suspense></ErrorBoundary> },

      // Cluster Manager App (Production) - Control tower interface
      { path: "cm-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><ClusterManagerApp /></Suspense></ErrorBoundary> },

      // City Manager App (Production) - Control tower interface
      { path: "city-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CityManagerApp /></Suspense></ErrorBoundary> },

      // Organization Hierarchy Dashboard - City → Cluster → Pincode
      { path: "hierarchy-dashboard", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><HierarchyDashboard /></Suspense></ErrorBoundary> },

      // Tele Sales Manager App (Production) - Pipeline control tower
      { path: "tsm-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><TeleSalesManagerApp /></Suspense></ErrorBoundary> },
      { path: "sh-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SalesHeadApp /></Suspense></ErrorBoundary> },
      { path: "sm-app-alliance", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SalesManagerApp /></Suspense></ErrorBoundary> },

      // Tele Sales Executive App (Production) - Sales execution interface
      { path: "tse-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><TeleSalesExecutiveApp /></Suspense></ErrorBoundary> },
      { path: "tse-diagnostics", element: <DevOnlyRoute element={<TSEDiagnostics />} /> },

      // Customer Care Executive App (Production) - Complaint management interface
      { path: "cce-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CustomerCareExecutiveApp /></Suspense></ErrorBoundary> },

      // BTL Service Test Page
      { path: "test-btl", element: <DevOnlyRoute element={<TestBTLService />} /> },

      // Subscription Management System (Production) - Dynamic plan system
      { path: "subscription-app", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><SubscriptionApp /></Suspense></ErrorBoundary> },
      { path: "plans", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><PlanSelectionScreen /></Suspense></ErrorBoundary> },
      { path: "buy",   element: <ErrorBoundary><Suspense fallback={<PageLoader />}><CustomerPlanPage /></Suspense></ErrorBoundary> },
      { path: "admin/plans", element: <ErrorBoundary><Suspense fallback={<PageLoader />}><AdminPlanManagement userRole="ADMIN" /></Suspense></ErrorBoundary> },
      { path: "admin/plan-page-editor", element: <ErrorBoundary><SuperAdminPlanEditor /></ErrorBoundary> },
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
