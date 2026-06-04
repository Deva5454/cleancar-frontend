/**
 * Business Actions Hook
 * Wires services to contexts - UI calls this instead of mutating contexts directly
 *
 * CRITICAL: All business logic flows through services
 * PHASE 3: Uses useEmployeeData (single source of truth) for employee/attendance data
 */

import { useCustomers } from "../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../contexts/CustomerSubscriptionContext";
import { useJobs } from "../contexts/JobContext";
import { useFinance } from "../contexts/FinanceContext";
import { useEvents } from "../contexts/EventSystem";
import { useEmployeeData } from "./useEmployeeData";
import { useDemos } from "../contexts/DemoContext";
import { usePlanDefinitions } from "../contexts/PlanDefinitionContext";

import { LeadConversionService, type Lead, type SubscriptionPlan } from "../services/leadConversionService";
import { DemoCompletionService, type DemoCompletionData } from "../services/demoCompletionService";
import { WasherAttendanceService, type WasherCheckInData, type WasherCheckOutData } from "../services/washerAttendanceService";
import { PayrollFinanceService } from "../services/payrollFinanceService";
import type { PayrollRun } from "../contexts/HRDataContext";
import type { VehicleCategory, PlanType } from "../data/subscriptionPlans";

/**
 * Hook for lead conversion - delegates to LeadConversionService
 * CRITICAL: Fetches plan pricing from PlanDefinitionContext for price locking
 */
export function useLeadConversion() {
  const { addCustomer } = useCustomers();
  const { createSubscription } = useCustomerSubscriptions();
  const { createJob } = useJobs();
  const { addMRREntry } = useFinance();
  const { emit } = useEvents();
  const { getPlanPrice, getPlanDeliverables } = usePlanDefinitions();

  /**
   * Build subscription plan with pricing from PlanDefinitionContext
   */
  const buildPlan = (
    vehicleCategory: VehicleCategory,
    planType: PlanType,
    frequency: SubscriptionPlan["frequency"],
    billingCycle: SubscriptionPlan["billingCycle"],
    startDate: string
  ): SubscriptionPlan => {
    const price = getPlanPrice(vehicleCategory, planType);
    const finalPrice = price === "NA" ? 0 : price;

    return {
      packageType: "Premium", // Can be derived from planType
      packageName: planType,
      frequency,
      pricing: {
        basePrice: finalPrice,
        discount: 0,
        finalPrice,
        currency: "INR",
      },
      billingCycle,
      startDate,
      addOns: [],
    };
  };

  const convertLead = (lead: Lead, plan: SubscriptionPlan) => {
    return LeadConversionService.convertLead(lead, plan, {
      addCustomer,
      createSubscription,
      generateJobsFromSubscription: () => [], // Not used by service directly
      createJob,
      addMRREntry,
      emit,
    });
  };

  return { convertLead, buildPlan };
}

/**
 * Hook for demo completion - delegates to DemoCompletionService
 */
export function useDemoCompletion() {
  const { addCustomer } = useCustomers();
  const { createSubscription } = useCustomerSubscriptions();
  const { createJob } = useJobs();
  const { addMRREntry } = useFinance();
  const { emit } = useEvents();

  const completeDemo = (demoData: DemoCompletionData) => {
    return DemoCompletionService.completeDemo(demoData, {
      addCustomer,
      createSubscription,
      generateJobsFromSubscription: () => [], // Not used
      createJob,
      addMRREntry,
      emit,
    });
  };

  return { completeDemo };
}

/**
 * Hook for washer attendance - delegates to WasherAttendanceService
 * PHASE 3: Using useEmployeeData for attendance data
 */
export function useWasherAttendance() {
  const { addAttendanceRecord, attendanceRecords } = useEmployeeData();
  const { emit } = useEvents();

  const checkIn = (checkInData: WasherCheckInData) => {
    return WasherAttendanceService.checkIn(checkInData, {
      addAttendanceRecord,
      getAttendanceForDate: (date: string) => {
        return attendanceRecords.filter(a => a.date === date);
      },
      emit,
    });
  };

  const checkOut = (checkOutData: WasherCheckOutData) => {
    return WasherAttendanceService.checkOut(checkOutData, {
      attendanceRecords,
      getAttendanceForDate: (date: string) => {
        return attendanceRecords.filter(a => a.date === date);
      },
      emit,
    } as any);
  };

  return { checkIn, checkOut };
}

/**
 * Hook for payroll processing - delegates to PayrollFinanceService
 * PHASE 3: Using useEmployeeData for payroll and employee data
 */
export function usePayrollProcessing() {
  const { processPayroll: addPayrollRun, employees } = useEmployeeData();
  const { createPayable } = useFinance();
  const { emit } = useEvents();

  const processPayroll = (payrollData: Omit<PayrollRun, "payrollId" | "createdAt" | "updatedAt">) => {
    return PayrollFinanceService.processPayroll(payrollData, {
      processPayroll: addPayrollRun,
      createPayable,
      getEmployeeById: (employeeId: string) => {
        return employees.find(e => e.employeeId === employeeId);
      },
      emit,
    });
  };

  const syncPaymentToHR = (payableId: string, paymentReference: string, paymentMethod: string) => {
    const { payables, markAsPaid } = useFinance();
    const { markPayrollAsPaid } = useEmployeeData();

    return PayrollFinanceService.syncPaymentToHR(payableId, paymentReference, paymentMethod, {
      payables,
      markAsPaid,
      markPayrollAsPaid: markPayrollAsPaid as any,
      emit,
    });
  };

  return { processPayroll, syncPaymentToHR };
}
