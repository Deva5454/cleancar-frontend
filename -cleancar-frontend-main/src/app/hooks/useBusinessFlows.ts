/**
 * useBusinessFlows Hook - CENTRAL ORCHESTRATION LAYER
 * Provides easy access to all business flows with proper context wiring
 *
 * CRITICAL ARCHITECTURE PRINCIPLE:
 * All multi-step business operations MUST flow through this hook.
 * This ensures:
 * - Consistent behavior across modules
 * - Proper event emission
 * - Transaction safety with rollback
 * - Single orchestration point
 *
 * ========== WHEN TO USE THIS HOOK ==========
 *
 * ✅ USE for multi-step workflows:
 *   - Lead conversion (Customer → Subscription → Jobs → MRR)
 *   - Demo completion (Outcome → Customer → Subscription)
 *   - Washer check-in/out (Attendance → Events)
 *   - Inventory issuance (Check stock → Transfer → Issue → Events)
 *   - Payroll processing (Create payroll → Create payable → Events)
 *   - Subscription creation (Subscription → Jobs → MRR)
 *
 * ❌ DO NOT USE for simple reads:
 *   - Getting customer list → use useCustomers()
 *   - Getting jobs → use useJobs()
 *   - Reading attendance → use useEmployeeData()
 *   - Viewing inventory → use useInventory()
 *
 * ========== EXAMPLES ==========
 *
 * // ✅ CORRECT: Use for lead conversion
 * const { convertLeadWithPayment } = useBusinessFlows();
 * const result = convertLeadWithPayment(lead, { paymentDetails, subscriptionPlan });
 *
 * // ❌ WRONG: Direct service call (bypasses orchestration)
 * const result = LeadConversionService.convertLead(...);
 *
 * // ✅ CORRECT: Use for washer check-in
 * const { washerCheckIn } = useBusinessFlows();
 * washerCheckIn({ employeeId, date, checkInTime, location });
 *
 * // ❌ WRONG: Direct context mutation
 * addAttendanceRecord({ ... });
 *
 * PHASE 3: Uses useEmployeeData (single source of truth) for employee/attendance/payroll data
 */

import { useCustomers } from "../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../contexts/CustomerSubscriptionContext";
import { useJobs } from "../contexts/JobContext";
import { useFinance } from "../contexts/FinanceContext";
import { useEmployeeData } from "./useEmployeeData";
import { useInventory } from "../contexts/InventoryContext";
import { useEvents } from "../contexts/EventSystem";
import { LeadConversionService, type Lead, type SubscriptionPlan, type ConversionResult } from "../services/leadConversionService";
import { DemoCompletionService, type DemoCompletionData, type DemoCompletionResult } from "../services/demoCompletionService";
import { WasherAttendanceService, type WasherCheckInData, type WasherCheckOutData, type AttendanceResult } from "../services/washerAttendanceService";
import { InventoryFlowService, type InventoryIssueRequest, type InventoryIssueResult } from "../services/inventoryFlowService";
import { PayrollFinanceService, type PayrollProcessingResult } from "../services/payrollFinanceService";
import type { PayrollRun } from "../contexts/HRDataContext";

/**
 * Business Flows Hook
 * Exposes all major business operations with proper context wiring
 */
export function useBusinessFlows() {
  // Wire up all contexts
  const { addCustomer, updateCustomer, deleteCustomer, customers, getCustomerById } = useCustomers();
  const { createSubscription, deleteSubscription, subscriptions, getActiveSubscriptions } = useCustomerSubscriptions();
  const {
    allJobs,
    unassignedJobs,
    assignedJobs,
    completedJobs,
    generateJobsFromSubscription,
    createJob,
    deleteJob,
    assignJobToWasher,
  } = useJobs();
  const {
    addMRREntry,
    removeMRREntry,
    mrrData,
    createPayable,
    payables,
    markAsPaid,
    approvePayable,
    getSalaryPayables,
  } = useFinance();
  const {
    employees,
    addAttendanceRecord,
    getEmployeeAttendance: getAttendanceForDate,
    getAttendanceByEmployee: getAttendanceByEmployeeId,
    processPayroll,
    payrollRuns,
    markPayrollAsPaid,
    approvePayrollByHR,
    approvePayrollByFinance,
    getEmployeeById,
    getPayrollForMonth,
  } = useEmployeeData();
  const {
    inventory,
    getItemById,
    issueInventory,
    transferInventory,
    getLowStockItems,
    stockTransactions,
  } = useInventory();
  const { emit } = useEvents();

  /**
   * FLOW 1A: Convert Lead to Customer with Subscription and Jobs (Simple)
   */
  const convertLead = (lead: Lead, plan: SubscriptionPlan): ConversionResult => {
    return LeadConversionService.convertLead(lead, plan, {
      addCustomer,
      createSubscription,
      generateJobsFromSubscription,
      createJob,
      addMRREntry,
      emit,
    });
  };

  /**
   * FLOW 1B: Convert Lead with Payment Details (Full Transaction-Safe Flow)
   * CRITICAL: Payment-first validation with automatic rollback on failure
   * Use this for CRM lead conversion with payment tracking
   */
  const convertLeadWithPayment = (
    lead: Lead,
    input: { leadId: string; paymentDetails: any; subscriptionPlan: SubscriptionPlan }
  ): ConversionResult => {
    return LeadConversionService.convertLead(lead, input as any, {
      addCustomer,
      updateCustomer,
      deleteCustomer,
      createSubscription,
      deleteSubscription,
      createJob,
      deleteJob,
      addMRREntry,
      removeMRREntry,
      emit,
    });
  };

  /**
   * FLOW 2: Complete Demo with Outcome
   */
  const completeDemo = (demoData: DemoCompletionData): DemoCompletionResult => {
    return DemoCompletionService.completeDemo(demoData, {
      addCustomer,
      createSubscription,
      generateJobsFromSubscription,
      createJob,
      addMRREntry,
      emit,
    });
  };

  /**
   * FLOW 3A: Supervisor Assigns Job to Washer
   * CRITICAL: This is the ONLY way jobs move from unassigned to assigned
   */
  const supervisorAssignJob = (jobId: string, washerId: string, supervisorId: string) => {
    assignJobToWasher(jobId, washerId);
    emit("JOB_ASSIGNED", {
      jobId,
      washerId,
      supervisorId,
      timestamp: new Date().toISOString(),
    }, "SupervisorDashboard");
  };

  /**
   * FLOW 3B: Washer Check-In
   * CRITICAL: Writes to HRDataContext attendance records
   */
  const washerCheckIn = (checkInData: WasherCheckInData): AttendanceResult => {
    return WasherAttendanceService.checkIn(checkInData, {
      addAttendanceRecord,
      getAttendanceForDate,
      emit,
    });
  };

  /**
   * FLOW 3C: Washer Check-Out
   * Updates attendance record with check-out time and hours worked
   */
  const washerCheckOut = (checkOutData: WasherCheckOutData): AttendanceResult => {
    return WasherAttendanceService.checkOut(checkOutData, {
      attendanceRecords: [], // Will be fetched via getAttendanceForDate
      getAttendanceForDate,
      emit,
    });
  };

  /**
   * FLOW 4: Issue Inventory (with auto-transfer from Central)
   * CRITICAL: Auto-transfers from Central to Supervisor if insufficient stock
   */
  const issueInventoryWithAutoTransfer = (request: InventoryIssueRequest): InventoryIssueResult => {
    return InventoryFlowService.issueInventory(request, {
      inventory,
      getItemById,
      issueInventory,
      transferInventory,
      stockTransactions,
      emit,
    });
  };

  /**
   * FLOW 5A: Process Payroll
   * Creates payroll run in HR and salary payable in Finance
   */
  const processPayrollWithPayable = (
    payrollData: Omit<PayrollRun, "payrollId" | "createdAt" | "updatedAt">
  ): PayrollProcessingResult => {
    return PayrollFinanceService.processPayroll(payrollData, {
      processPayroll,
      createPayable,
      getEmployeeById,
      emit,
    });
  };

  /**
   * FLOW 5B: Mark Payroll as Paid
   * Syncs payment status between Finance and HR
   */
  const markPayrollPaid = (
    payableId: string,
    paymentReference: string,
    paymentMethod: string
  ) => {
    return PayrollFinanceService.syncPaymentToHR(payableId, paymentReference, paymentMethod, {
      payables,
      markAsPaid,
      markPayrollAsPaid,
      emit,
    });
  };

  /**
   * Get salary payables with full details (for Finance module)
   */
  const getSalaryPayablesWithDetails = () => {
    return PayrollFinanceService.getSalaryPayablesWithDetails({
      getSalaryPayables,
      payrollRuns,
      employees,
    });
  };

  /**
   * Get attendance summary for employee
   */
  const getAttendanceSummary = (employeeId: string, startDate: string, endDate: string) => {
    return WasherAttendanceService.getAttendanceSummary(employeeId, startDate, endDate, {
      getAttendanceByEmployeeId,
    });
  };

  /**
   * Get low stock alerts
   */
  const getLowStockAlerts = () => {
    return InventoryFlowService.getLowStockAlerts({
      getLowStockItems,
    });
  };

  /**
   * Get payroll summary for month
   */
  const getPayrollSummary = (month: string) => {
    return PayrollFinanceService.getPayrollSummary(month, {
      getPayrollForMonth,
    });
  };

  /**
   * Get dashboard statistics
   */
  const getDashboardStats = () => {
    return {
      totalCustomers: customers.length,
      activeSubscriptions: getActiveSubscriptions().length,
      totalJobs: allJobs.length,
      unassignedJobs: unassignedJobs.length,
      assignedJobs: assignedJobs.length,
      completedJobs: completedJobs.length,
      monthlyMRR: mrrData
        .filter(m => m.status === "Active")
        .reduce((sum, m) => sum + m.revenue, 0),
    };
  };

  /**
   * Get job pipeline overview
   */
  const getJobPipeline = () => {
    return {
      unassigned: unassignedJobs,
      assigned: assignedJobs,
      completed: completedJobs,
    };
  };

  return {
    // FLOW 1: Lead Conversion
    convertLead,
    convertLeadWithPayment,

    // FLOW 2: Demo Completion
    completeDemo,

    // FLOW 3: Job Assignment & Attendance
    supervisorAssignJob,
    washerCheckIn,
    washerCheckOut,
    getAttendanceSummary,

    // FLOW 4: Inventory Management
    issueInventoryWithAutoTransfer,
    getLowStockAlerts,

    // FLOW 5: Payroll & Finance
    processPayrollWithPayable,
    markPayrollPaid,
    getSalaryPayablesWithDetails,
    getPayrollSummary,

    // Dashboard stats
    getDashboardStats,
    getJobPipeline,

    // Direct context access (for advanced use)
    contexts: {
      customers: { customers, addCustomer, getCustomerById },
      subscriptions: { subscriptions, createSubscription, getActiveSubscriptions },
      jobs: { allJobs, unassignedJobs, assignedJobs, completedJobs, assignJobToWasher },
      finance: { mrrData, addMRREntry, payables, createPayable },
      hr: { employees, attendanceRecords: [], payrollRuns, getEmployeeById },
      inventory: { inventory, getItemById },
      events: { emit },
    },
  };
}
