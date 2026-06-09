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

import HRModule from "./components/modules/HRModule";







// Analytics module - all lazy loaded











// R3 FIX: Founder module properly lazy-loaded (was importing eagerly despite "NOW LAZY" comments)
const FounderControlTower  = lazy(() => import("./components/founder/FounderControlTower"));

const CashFlowDashboard    = lazy(() => import("./components/founder/CashFlowDashboard"));


// Keep these as regular imports (frequently accessed)
// import { OnboardingPortal } from "./components/OnboardingPortal"; // NOW LAZY
import { OnboardingRedirect } from "./components/onboarding/OnboardingRedirect";
import { DevOnlyRoute } from "./components/guards/DevOnlyRoute";
import Dashboard from "./components/Dashboard";
import UserManagement from "./components/modules/UserManagement";
import CRMLeadManagementWithFilters from "./components/modules/CRMLeadManagementWithFilters";

import CustomerSubscription from "./components/modules/CustomerSubscription";

import OperationsManagerApp from "./components/om/OperationsManagerApp";
import ComplaintManagement from "./components/modules/ComplaintManagement";








import FinanceModuleDirect from "./components/modules/FinanceModule";
const FinanceModule = FinanceModuleDirect;
const RevenueCaptureSystem = lazy(() => import("./components/finance/RevenueCaptureSystem").then(m=>({default:m.RevenueCaptureSystem||m.default})));



const FinanceTransactions = lazy(() => import("./components/finance/FinanceTransactions").then(m=>({default:m.FinanceTransactions||m.default})));

import { FinanceAnalyticsDashboard as _FinanceAnalyticsDashboard } from "./components/finance/FinanceAnalyticsDashboard";
const FinanceAnalyticsDashboard = _FinanceAnalyticsDashboard;
















const ApprovalCenterHR = ApprovalCenter;






import AccountsModule from "./components/modules/AccountsModule";


























import { AnalyticsDashboardWithDrillDown as _AnalyticsDashboardWithDrillDown } from "./components/dashboards/AnalyticsDashboardWithDrillDown";
const AnalyticsDashboardWithDrillDown = _AnalyticsDashboardWithDrillDown;








const PayrollProcessingAdvanced = lazy(() => import("./components/payroll/PayrollProcessingAdvanced").then(m=>({default:m.PayrollProcessingAdvanced||m.default})));












import { DesignSystemTest } from "./design-system/tests/DesignSystemTest";
















import WasherCoreScreensConnected from "./components/washer/WasherCoreScreensConnected";
import { SupervisorAppLazy as SupervisorAppConnected } from "./components/supervisor/SupervisorAppLazy";

import ClusterManagerApp from "./components/cm/ClusterManagerApp";
import CityManagerApp from "./components/city/CityManagerApp";
import TeleSalesManagerApp from "./components/tsm/TeleSalesManagerApp";
import SalesHeadApp from "./components/sh/SalesHeadApp";
import SalesManagerApp from "./components/sm/SalesManagerApp";
import TeleSalesExecutiveApp from "./components/tse/TeleSalesExecutiveApp";




import CustomerPlanPageDirect from "./components/subscription/CustomerPlanPage";
import WasherTrackingPageDirect from "./components/washer/WasherTrackingPage";
const CustomerPlanPage = CustomerPlanPageDirect;




import OperationsRouter from "./components/operations/OperationsRouter";




















const AccountsPayrollProcessing = lazy(() => import("./components/accounts/AccountsPayrollProcessing").then(m=>({default:m.AccountsPayrollProcessing||m.default})));















import { LoginPage } from "./pages/LoginPage";
import OnboardingPortalDirect from "./components/OnboardingPortal";
const OnboardingPortal = OnboardingPortalDirect;
import ProfessionalLeaveManagementDirect from "./components/hr/ProfessionalLeaveManagement";
const ProfessionalLeaveManagement = ProfessionalLeaveManagementDirect;
import StatutoryFormsOnboardingDirect from "./components/hr/StatutoryFormsOnboarding";
const StatutoryFormsOnboarding = StatutoryFormsOnboardingDirect;
import TravelReimbursementModuleDirect from "./components/travel/TravelReimbursementModule";
const TravelReimbursementModule = TravelReimbursementModuleDirect;
import ChartOfAccountsDirect from "./components/finance/ChartOfAccounts";
const ChartOfAccounts = ChartOfAccountsDirect;
import AdminPlanManagementDirect from "./components/subscription/AdminPlanManagement";
const AdminPlanManagement = AdminPlanManagementDirect;
import IncentiveConfigurationDirect from "./components/incentives/IncentiveConfiguration";
const IncentiveConfiguration = IncentiveConfigurationDirect;
import UnitEconomicsDashboardDirect from "./components/analytics/UnitEconomicsDashboard";
const UnitEconomicsDashboard = UnitEconomicsDashboardDirect;
import CustomerLTVAnalysisDirect from "./components/analytics/CustomerLTVAnalysis";
const CustomerLTVAnalysis = CustomerLTVAnalysisDirect;
import CACDashboardDirect from "./components/analytics/CACDashboard";
const CACDashboard = CACDashboardDirect;
import BreakEvenAnalysisDirect from "./components/analytics/BreakEvenAnalysis";
const BreakEvenAnalysis = BreakEvenAnalysisDirect;
import CostPerWashCalculatorEnhancedDirect from "./components/analytics/CostPerWashCalculatorEnhanced";
const CostPerWashCalculatorEnhanced = CostPerWashCalculatorEnhancedDirect;
import CostPerWashByPlanDirect from "./components/analytics/CostPerWashByPlan";
const CostPerWashByPlan = CostPerWashByPlanDirect;
import CostPerWashByConsumptionDirect from "./components/analytics/CostPerWashByConsumption";
const CostPerWashByConsumption = CostPerWashByConsumptionDirect;
import LabourCostPerWashDirect from "./components/analytics/LabourCostPerWash";
const LabourCostPerWash = LabourCostPerWashDirect;
import EmployeeEfficiencyDirect from "./components/analytics/EmployeeEfficiency";
const EmployeeEfficiency = EmployeeEfficiencyDirect;
import CityComparisonDirect from "./components/analytics/CityComparison";
const CityComparison = CityComparisonDirect;
import DetailedFinancialViewDirect from "./components/founder/DetailedFinancialView";
const DetailedFinancialView = DetailedFinancialViewDirect;
import MarketingROIDrilldownDirect from "./components/founder/MarketingROIDrilldown";
const MarketingROIDrilldown = MarketingROIDrilldownDirect;
import CRMConversionAnalyticsDashboardDirect from "./components/modules/CRMConversionAnalyticsDashboard";
const CRMConversionAnalyticsDashboard = CRMConversionAnalyticsDashboardDirect;
import SupervisorModuleUpdatedDirect from "./components/modules/SupervisorModuleUpdated";
const SupervisorModuleUpdated = SupervisorModuleUpdatedDirect;
import InventoryStoreDirect from "./components/modules/InventoryStore";
const InventoryStore = InventoryStoreDirect;
import MaterialRequisitionDirect from "./components/inventory/MaterialRequisition";
const MaterialRequisition = MaterialRequisitionDirect;
import WasherIssuancesDirect from "./components/inventory/WasherIssuances";
const WasherIssuances = WasherIssuancesDirect;
import WasherStockLedgerDirect from "./components/inventory/WasherStockLedger";
const WasherStockLedger = WasherStockLedgerDirect;
import MonthEndVerificationDirect from "./components/inventory/MonthEndVerification";
const MonthEndVerification = MonthEndVerificationDirect;
import MyStockDirect from "./components/washer/MyStock";
const MyStock = MyStockDirect;
import StoreModuleDirect from "./components/modules/StoreModule";
const StoreModule = StoreModuleDirect;
import ProcurementModuleDirect from "./components/modules/ProcurementModule";
const ProcurementModule = ProcurementModuleDirect;
import PackageCostMatrixDirect from "./components/finance/PackageCostMatrix";
const PackageCostMatrix = PackageCostMatrixDirect;
import CostPerWashModuleDirect from "./components/finance/CostPerWashModule";
const CostPerWashModule = CostPerWashModuleDirect;
import ActualCostInputsDirect from "./components/finance/ActualCostInputs";
const ActualCostInputs = ActualCostInputsDirect;
import LedgerEntriesViewDirect from "./components/finance/LedgerEntriesView";
const LedgerEntriesView = LedgerEntriesViewDirect;
import FinancialReportsModuleDirect from "./components/finance/FinancialReportsModule";
const FinancialReportsModule = FinancialReportsModuleDirect;
import LeavePolicyEngineDirect from "./components/hr/LeavePolicyEngine";
const LeavePolicyEngine = LeavePolicyEngineDirect;
import EmployeeOnboardingDirect from "./components/hr/EmployeeOnboarding";
const EmployeeOnboarding = EmployeeOnboardingDirect;
import ExitFFSettlementDirect from "./components/hr/ExitFFSettlement";
const ExitFFSettlement = ExitFFSettlementDirect;
import EmployeeLifecycleManagementDirect from "./components/hr/EmployeeLifecycleManagement";
const EmployeeLifecycleManagement = EmployeeLifecycleManagementDirect;
import LettersDocumentsDirect from "./components/hr/LettersDocuments";
const LettersDocuments = LettersDocumentsDirect;
import IDCardGeneratorDirect from "./components/hr/IDCardGenerator";
const IDCardGenerator = IDCardGeneratorDirect;
import HolidayManagementDirect from "./components/hr/HolidayManagement";
const HolidayManagement = HolidayManagementDirect;
import LifeCycleReportsDirect from "./components/hr/LifeCycleReports";
const LifeCycleReports = LifeCycleReportsDirect;
import EmployeeLedgerDirect from "./components/hr/EmployeeLedger";
const EmployeeLedger = EmployeeLedgerDirect;
import StatutoryFormsVerificationDirect from "./components/hr/StatutoryFormsVerification";
const StatutoryFormsVerification = StatutoryFormsVerificationDirect;
import OnboardingAutomationDirect from "./components/hr/OnboardingAutomation";
const OnboardingAutomation = OnboardingAutomationDirect;
import EmployeeSalaryAssignmentDirect from "./components/payroll/EmployeeSalaryAssignment";
const EmployeeSalaryAssignment = EmployeeSalaryAssignmentDirect;
import EmployeeSelfServiceDirect from "./components/hr/EmployeeSelfService";
const EmployeeSelfService = EmployeeSelfServiceDirect;
import AttendanceDataManagerDirect from "./components/admin/AttendanceDataManager";
const AttendanceDataManager = AttendanceDataManagerDirect;
import ApprovalCenterDirect from "./components/hr/ApprovalCenter";
const ApprovalCenter = ApprovalCenterDirect;
import TestStatutoryRoutesDirect from "./components/TestStatutoryRoutes";
const TestStatutoryRoutes = TestStatutoryRoutesDirect;
import DeveloperRouteDirectoryDirect from "./components/developer/DeveloperRouteDirectory";
const DeveloperRouteDirectory = DeveloperRouteDirectoryDirect;
import ApprovalCenterMainDirect from "./components/ApprovalCenter";
const ApprovalCenterMain = ApprovalCenterMainDirect;
import AuditTrailDirect from "./components/AuditTrail";
const AuditTrail = AuditTrailDirect;
import SystemAuditDashboardDirect from "./components/audit/SystemAuditDashboard";
const SystemAuditDashboard = SystemAuditDashboardDirect;
import PerformanceTrackingDirect from "./components/performance/PerformanceTracking";
const PerformanceTracking = PerformanceTrackingDirect;
import ExpenseEntryDirect from "./components/accounts/ExpenseEntry";
const ExpenseEntry = ExpenseEntryDirect;
import ExpenseAnalyticsDirect from "./components/accounts/ExpenseAnalytics";
const ExpenseAnalytics = ExpenseAnalyticsDirect;
import VendorPaymentDirect from "./components/accounts/VendorPayment";
const VendorPayment = VendorPaymentDirect;
import GSTDashboardDirect from "./components/accounts/GSTDashboard";
const GSTDashboard = GSTDashboardDirect;
import AccountingEntryDirect from "./components/accounts/AccountingEntry";
const AccountingEntry = AccountingEntryDirect;
import JournalEntryDirect from "./components/accounts/JournalEntry";
const JournalEntry = JournalEntryDirect;
import AccountsDashboardDirect from "./components/accounts/AccountsDashboard";
const AccountsDashboard = AccountsDashboardDirect;
import AccountingTransactionListDirect from "./components/accounts/AccountingTransactionList";
const AccountingTransactionList = AccountingTransactionListDirect;
import AccountsLedgerDirect from "./components/accounts/AccountsLedger";
const AccountsLedger = AccountsLedgerDirect;
import PartyLedgerDirect from "./components/accounts/PartyLedger";
const PartyLedger = PartyLedgerDirect;
import TrialBalanceDirect from "./components/accounts/TrialBalance";
const TrialBalance = TrialBalanceDirect;
import BalanceSheetDirect from "./components/accounts/BalanceSheet";
const BalanceSheet = BalanceSheetDirect;
import LedgerMasterDirect from "./components/accounts/LedgerMaster";
const LedgerMaster = LedgerMasterDirect;
import RazorpayFlowDirect from "./components/accounts/RazorpayFlow";
const RazorpayFlow = RazorpayFlowDirect;
import ExpenseVoucherDirect from "./components/accounts/ExpenseVoucher";
const ExpenseVoucher = ExpenseVoucherDirect;
import ItemMasterDirect from "./components/accounts/ItemMaster";
const ItemMaster = ItemMasterDirect;
import GSTR2AReportDirect from "./components/accounts/GSTR2AReport";
const GSTR2AReport = GSTR2AReportDirect;
import PurchaseSummaryReportDirect from "./components/accounts/PurchaseSummaryReport";
const PurchaseSummaryReport = PurchaseSummaryReportDirect;
import SalesSummaryReportDirect from "./components/accounts/SalesSummaryReport";
const SalesSummaryReport = SalesSummaryReportDirect;
import RCMReportDirect from "./components/accounts/RCMReport";
const RCMReport = RCMReportDirect;
import StoreManagerModuleDirect from "./components/modules/StoreManagerModule";
const StoreManagerModule = StoreManagerModuleDirect;
import GRNEntryDirect from "./components/store-manager/GRNEntry";
const GRNEntry = GRNEntryDirect;
import PurchaseOrderCreationDirect from "./components/store-manager/PurchaseOrderCreation";
const PurchaseOrderCreation = PurchaseOrderCreationDirect;
import MOQManagementDirect from "./components/store-manager/MOQManagement";
const MOQManagement = MOQManagementDirect;
import InventoryMonitoringDirect from "./components/store-manager/InventoryMonitoring";
const InventoryMonitoring = InventoryMonitoringDirect;
import VendorRequestDirect from "./components/store-manager/VendorRequest";
const VendorRequest = VendorRequestDirect;
import RoleBasedAnalyticsDashboardDirect from "./components/examples/RoleBasedAnalyticsDashboard";
const RoleBasedAnalyticsDashboard = RoleBasedAnalyticsDashboardDirect;
import CostPerWashReportDirect from "./components/reports/CostPerWashReport";
const CostPerWashReport = CostPerWashReportDirect;
import ActivityTimelineWrapperDirect from "./components/crm/ActivityTimelineWrapper";
const ActivityTimelineWrapper = ActivityTimelineWrapperDirect;
import NotificationCenterDirect from "./components/crm/NotificationCenter";
const NotificationCenter = NotificationCenterDirect;
import PayrollConfigurationDirect from "./components/payroll/PayrollConfiguration";
const PayrollConfiguration = PayrollConfigurationDirect;
import PayrollConfigTestDirect from "./components/payroll/PayrollConfigTest";
const PayrollConfigTest = PayrollConfigTestDirect;
import PayrollRunDirect from "./components/payroll/PayrollRun";
const PayrollRun = PayrollRunDirect;
import PayrollProcessingDirect from "./components/payroll/PayrollProcessing";
const PayrollProcessing = PayrollProcessingDirect;
import PayrollReviewApprovalDirect from "./components/payroll/PayrollReviewApproval";
const PayrollReviewApproval = PayrollReviewApprovalDirect;
import SalaryPayableViewDirect from "./components/payroll/SalaryPayableView";
const SalaryPayableView = SalaryPayableViewDirect;
import SalaryPaymentScreenDirect from "./components/payroll/SalaryPaymentScreen";
const SalaryPaymentScreen = SalaryPaymentScreenDirect;
import StatutoryPayablesScreenDirect from "./components/payroll/StatutoryPayablesScreen";
const StatutoryPayablesScreen = StatutoryPayablesScreenDirect;
import PlanEditorDirect from "./components/subscription/PlanEditor";
const PlanEditor = PlanEditorDirect;
import CommunicationTemplatesDirect from "./components/settings/CommunicationTemplates";
const CommunicationTemplates = CommunicationTemplatesDirect;
import CostConfigurationDirect from "./components/settings/CostConfiguration";
const CostConfiguration = CostConfigurationDirect;
import ServiceZonesManagementDirect from "./components/modules/ServiceZonesManagement";
const ServiceZonesManagement = ServiceZonesManagementDirect;
import WasherJobExecutionDirect from "./components/modules/WasherJobExecution";
const WasherJobExecution = WasherJobExecutionDirect;
import ExpansionOpportunitiesDirect from "./components/modules/ExpansionOpportunities";
const ExpansionOpportunities = ExpansionOpportunitiesDirect;
import SupplierDetailDirect from "./components/procurement/SupplierDetail";
const SupplierDetail = SupplierDetailDirect;
import CostTrackingIntegrationDemoDirect from "./components/demo/CostTrackingIntegrationDemo";
const CostTrackingIntegrationDemo = CostTrackingIntegrationDemoDirect;
import ClothExchangeDirect from "./components/cloth-tracking/ClothExchange";
const ClothExchange = ClothExchangeDirect;
import ClothAdminDashboardDirect from "./components/cloth-tracking/ClothAdminDashboard";
const ClothAdminDashboard = ClothAdminDashboardDirect;
import AdvanceTypeSelectionDirect from "./components/advance/AdvanceTypeSelection";
const AdvanceTypeSelection = AdvanceTypeSelectionDirect;
import LongTermAdvanceFormDirect from "./components/advance/LongTermAdvanceForm";
const LongTermAdvanceForm = LongTermAdvanceFormDirect;
import ShortTermAdvanceFormDirect from "./components/advance/ShortTermAdvanceForm";
const ShortTermAdvanceForm = ShortTermAdvanceFormDirect;
import EmployeeAdvanceDashboardDirect from "./components/advance/EmployeeAdvanceDashboard";
const EmployeeAdvanceDashboard = EmployeeAdvanceDashboardDirect;
import AdvanceDetailViewDirect from "./components/advance/AdvanceDetailView";
const AdvanceDetailView = AdvanceDetailViewDirect;
import HRAdvanceManagementDirect from "./components/advance/HRAdvanceManagement";
const HRAdvanceManagement = HRAdvanceManagementDirect;
import OtherEarningsModuleDirect from "./components/advance/OtherEarningsModule";
const OtherEarningsModule = OtherEarningsModuleDirect;
import OtherDeductionsModuleDirect from "./components/advance/OtherDeductionsModule";
const OtherDeductionsModule = OtherDeductionsModuleDirect;
import AdjustmentsReportDirect from "./components/advance/AdjustmentsReport";
const AdjustmentsReport = AdjustmentsReportDirect;
import WorkflowControlDemoDirect from "./components/workflow/WorkflowControlDemo";
const WorkflowControlDemo = WorkflowControlDemoDirect;
import IncentiveEngineDemoDirect from "./components/workflow/IncentiveEngineDemo";
const IncentiveEngineDemo = IncentiveEngineDemoDirect;
import WeekOffCoverDemoDirect from "./components/washer/WeekOffCoverDemo";
const WeekOffCoverDemo = WeekOffCoverDemoDirect;
import SystemIntegrationDemoDirect from "./components/washer/SystemIntegrationDemo";
const SystemIntegrationDemo = SystemIntegrationDemoDirect;
import WasherCoreScreensDemoDirect from "./components/washer/WasherCoreScreensDemo";
const WasherCoreScreensDemo = WasherCoreScreensDemoDirect;
import SupervisorLayoutDirect from "./components/supervisor/SupervisorLayout";
const SupervisorLayout = SupervisorLayoutDirect;
import TSEDiagnosticsDirect from "./components/tse/TSEDiagnostics";
const TSEDiagnostics = TSEDiagnosticsDirect;
import CustomerCareExecutiveAppDirect from "./components/cce/CustomerCareExecutiveApp";
const CustomerCareExecutiveApp = CustomerCareExecutiveAppDirect;
import SubscriptionAppDirect from "./components/subscription/SubscriptionApp";
const SubscriptionApp = SubscriptionAppDirect;
import PlanSelectionScreenDirect from "./components/subscription/PlanSelectionScreen";
const PlanSelectionScreen = PlanSelectionScreenDirect;
import SuperAdminPlanEditorDirect from "./components/admin/SuperAdminPlanEditor";
const SuperAdminPlanEditor = SuperAdminPlanEditorDirect;
import SubscriptionDiagnosticsDirect from "./components/subscription/SubscriptionDiagnostics";
const SubscriptionDiagnostics = SubscriptionDiagnosticsDirect;
import HierarchyDashboardDirect from "./components/hierarchy/HierarchyDashboard";
const HierarchyDashboard = HierarchyDashboardDirect;
import WasherAttendanceHistoryDirect from "./components/washer/WasherAttendanceHistory";
const WasherAttendanceHistory = WasherAttendanceHistoryDirect;
import OperationsDataCaptureDirect from "./components/operations/OperationsDataCapture";
const OperationsDataCapture = OperationsDataCaptureDirect;
import OperationsLayoutDirect from "./components/operations/OperationsLayout";
const OperationsLayout = OperationsLayoutDirect;
import ClientPortalDirect from "./components/client/ClientPortal";
const ClientPortal = ClientPortalDirect;
import WorkingHoursSetupDirect from "./components/workforce/WorkingHoursSetup";
const WorkingHoursSetup = WorkingHoursSetupDirect;
import WorkingHoursTestDirect from "./components/workforce/WorkingHoursTest";
const WorkingHoursTest = WorkingHoursTestDirect;
import WorkingHoursSimpleDirect from "./components/workforce/WorkingHoursSimple";
const WorkingHoursSimple = WorkingHoursSimpleDirect;
import WorkforceDiagnosticDirect from "./components/workforce/WorkforceDiagnostic";
const WorkforceDiagnostic = WorkforceDiagnosticDirect;
import IncentiveSimulatorDirect from "./components/incentives/IncentiveSimulator";
const IncentiveSimulator = IncentiveSimulatorDirect;
import IncentiveDashboardDirect from "./components/incentives/IncentiveDashboard";
const IncentiveDashboard = IncentiveDashboardDirect;
import HRPayrollApprovalDirect from "./components/hr/HRPayrollApproval";
const HRPayrollApproval = HRPayrollApprovalDirect;
import SuperAdminPayrollApprovalDirect from "./components/admin/SuperAdminPayrollApproval";
const SuperAdminPayrollApproval = SuperAdminPayrollApprovalDirect;
import CityManagementDirect from "./components/admin/CityManagement";
const CityManagement = CityManagementDirect;
import BusinessRulesPageDirect from "./components/admin/BusinessRulesPage";
const BusinessRulesPage = BusinessRulesPageDirect;
import ShiftManagementPageDirect from "./components/admin/ShiftManagementPage";
const ShiftManagementPage = ShiftManagementPageDirect;
import AttendanceFraudAlertsPageDirect from "./components/admin/AttendanceFraudAlertsPage";
const AttendanceFraudAlertsPage = AttendanceFraudAlertsPageDirect;
import PermissionManagementPageDirect from "./components/admin/PermissionManagementPage";
const PermissionManagementPage = PermissionManagementPageDirect;
import RolePermissionManagerDirect from "./components/admin/RolePermissionManager";
const RolePermissionManager = RolePermissionManagerDirect;
import IncentiveVisibilityAdminDirect from "./components/admin/IncentiveVisibilityAdmin";
const IncentiveVisibilityAdmin = IncentiveVisibilityAdminDirect;
import RoleSuggestionsPageDirect from "./components/hr/RoleSuggestionsPage";
const RoleSuggestionsPage = RoleSuggestionsPageDirect;
import HRIntelligenceDashboardDirect from "./components/hr/HRIntelligenceDashboard";
const HRIntelligenceDashboard = HRIntelligenceDashboardDirect;
import GSTOverviewDirect from "./components/gst/GSTOverview";
const GSTOverview = GSTOverviewDirect;
import GSTVendorMasterDirect from "./components/gst/GSTVendorMaster";
const GSTVendorMaster = GSTVendorMasterDirect;
import GSTCustomerMasterDirect from "./components/gst/GSTCustomerMaster";
const GSTCustomerMaster = GSTCustomerMasterDirect;
import GSTTransactionEntryDirect from "./components/gst/GSTTransactionEntry";
const GSTTransactionEntry = GSTTransactionEntryDirect;
import GSTValidationCentreDirect from "./components/gst/GSTValidationCentre";
const GSTValidationCentre = GSTValidationCentreDirect;
import GSTManagerReviewDirect from "./components/gst/GSTManagerReview";
const GSTManagerReview = GSTManagerReviewDirect;
import GSTReconciliationDirect from "./components/gst/GSTReconciliation";
const GSTReconciliation = GSTReconciliationDirect;
import GSTReportsDirect from "./components/gst/GSTReports";
const GSTReports = GSTReportsDirect;
import TransactionSubTypeManagerDirect from "./components/gst/TransactionSubTypeManager";
const TransactionSubTypeManager = TransactionSubTypeManagerDirect;
import GSTR1ModuleDirect from "./components/gst/GSTR1Module";
const GSTR1Module = GSTR1ModuleDirect;
import GSTR3BModuleDirect from "./components/gst/GSTR3BModule";
const GSTR3BModule = GSTR3BModuleDirect;
import GSTFilingModuleDirect from "./components/gst/GSTFilingModule";
const GSTFilingModule = GSTFilingModuleDirect;
import GSTMonitoringModuleDirect from "./components/gst/GSTMonitoringModule";
const GSTMonitoringModule = GSTMonitoringModuleDirect;
import BusinessFlowDemoDirect from "./components/BusinessFlowDemo";
const BusinessFlowDemo = BusinessFlowDemoDirect;
import UnauthorizedPageDirect from "./components/pages/UnauthorizedPage";
const UnauthorizedPage = UnauthorizedPageDirect;
import MobileChangeRequestDirect from "./components/hr/MobileChangeRequest";
const MobileChangeRequest = MobileChangeRequestDirect;
import MyAccountPageDirect from "./components/hr/MyAccountPage";
const MyAccountPage = MyAccountPageDirect;
import TDSPayableModuleDirect from "./components/accounts/TDSPayableModule";
const TDSPayableModule = TDSPayableModuleDirect;
import AdvanceTaxCalculatorDirect from "./components/accounts/AdvanceTaxCalculator";
const AdvanceTaxCalculator = AdvanceTaxCalculatorDirect;
import PayablesDashboardDirect from "./components/accounts/PayablesDashboard";
const PayablesDashboard = PayablesDashboardDirect;
import CreateSalaryStructureDirect from "./components/payroll/CreateSalaryStructure";
const CreateSalaryStructure = CreateSalaryStructureDirect;
import InvoiceManagementDirect from "./components/finance/InvoiceManagement";
const InvoiceManagement = InvoiceManagementDirect;
import InvoiceDetailDirect from "./components/finance/InvoiceDetail";
const InvoiceDetail = InvoiceDetailDirect;
import PaymentManagementDirect from "./components/finance/PaymentManagement";
const PaymentManagement = PaymentManagementDirect;


// import { ChartOfAccounts } from "./components/finance/ChartOfAccounts"; // NOW LAZY
// import { HRModule } from "./components/modules/HRModule"; // NOW LAZY
// import { ProfessionalLeaveManagement } from "./components/hr/ProfessionalLeaveManagement"; // NOW LAZY
// import { StatutoryFormsOnboarding } from "./components/hr/StatutoryFormsOnboarding"; // NOW LAZY
// Phase 1 Accounting Entry System



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
      { path: "finance", element: <ErrorBoundary><FinanceModule /></ErrorBoundary> },
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
      { path: "approvals", element: <ErrorBoundary><ApprovalCenterMain /></ErrorBoundary> },
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
          { index: true, element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "dashboard", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          // R5 FIX NOTE: deep-linking to specific tabs requires SupervisorAppConnected
          // to read useLocation().pathname and set its initial active tab.
          // See SupervisorAppConnected fix in supervisor-fixes.
          { path: "team", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "audit", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "cloth", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "leads", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "incentive", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "issues", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "alerts", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "cover", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "visibility", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "audit-trail", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
          { path: "kpi-dashboard", element: <ErrorBoundary><SupervisorAppConnected /></ErrorBoundary> },
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
      // /buy moved to public route below
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
