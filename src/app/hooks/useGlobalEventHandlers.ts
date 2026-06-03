/**
 * ============================================================================
 * GLOBAL EVENT HANDLERS - BUSINESS LOGIC INTEGRATION
 * ============================================================================
 *
 * ⚠️ CRITICAL: Event handlers trigger REAL DATA UPDATES, not just UI notifications
 *
 * ARCHITECTURE:
 * - Events are the backbone of business logic
 * - Each handler updates relevant contexts
 * - Toast notifications are SECONDARY to data updates
 * - Single source of truth maintained
 *
 * EVENT FLOW:
 * 1. Event emitted (e.g., LEAD_CONVERTED)
 * 2. Handler updates contexts (Customer, Subscription, Finance)
 * 3. UI updates automatically via context
 * 4. Toast shown as confirmation (optional)
 *
 * NOTE: Context hooks called inside event callbacks to avoid hook order issues
 *
 * LAST UPDATED: 2026-04-23
 * ============================================================================
 */

import { useEventListener } from "../contexts/EventSystem";
import { toast } from "sonner";
import { logger } from "../services/logger";

// Import context hooks for use in event handlers
import { useCustomers } from "../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../contexts/CustomerSubscriptionContext";
import { useFinance } from "../contexts/FinanceContext";
import { useJobs } from "../contexts/JobContext";
import { useEmployeeData } from "./useEmployeeData";
import { useIncentive } from "../contexts/IncentiveContext";
import { accountingEntryService } from "../services/accountingEntryService";

export function useGlobalEventHandlers() {
  // Get context APIs (hooks must be at top level)
  const customerContext = useCustomers();
  const subscriptionContext = useCustomerSubscriptions();
  const financeContext = useFinance();
  const jobContext = useJobs();
  const employeeContext = useEmployeeData();
  const incentiveContext = useIncentive();

  // ==================== LEAD_CONVERTED ====================
  // Updates: CustomerContext, SubscriptionContext, FinanceContext
  useEventListener("LEAD_CONVERTED", (event) => {
    try {
      const { customerId, subscriptionId, customerName } = event.data;

      // ✅ 1. Update customer status to Active
      if (customerId) {
        customerContext.updateCustomer(customerId, { status: "Active" });
        logger.debug("Customer status updated to Active", { customerId });
      }

      // ✅ 2. Activate subscription if provided
      if (subscriptionId) {
        subscriptionContext.updateSubscription(subscriptionId, { status: "Active" });
        logger.debug("Subscription activated", { subscriptionId });
      }

      // ✅ 3. Add MRR entry if subscription has revenue
      if (subscriptionId && event.data.mrr) {
        // Get cityId from customer
        const customer = customerContext.customers.find(c => c.customerId === customerId);
        const cityId = customer?.cityId || event.data.cityId || "CITY-SURAT";

        const currentMonth = new Date().toISOString().substring(0, 7);
        financeContext.addMRREntry({
          month: currentMonth,
          subscriptionId,
          customerId,
          revenue: event.data.mrr,
          status: "Active",
          cityId, // ✅ Multi-city isolation
        });
        logger.debug("MRR entry added", { amount: event.data.mrr, cityId });
      }

      // Toast notification (secondary)
      toast.success("Lead Converted to Customer!", {
        description: `${customerName || "Customer"} is now active`,
        duration: 5000,
      });
    } catch (error) {
      logger.error("LEAD_CONVERTED: Error updating data", error as Error);
      toast.error("Error converting lead", {
        description: "Data update failed. Please check logs."
      });
    }
  });

  // ==================== JOB_COMPLETED ====================
  // Updates: JobContext, FinanceContext (revenue)
  useEventListener("JOB_COMPLETED", (event) => {
    try {
      const { jobId, customerId, amount, washerName } = event.data;

      // ✅ 1. Update job status (if not already done)
      if (jobId) {
        jobContext.updateJob(jobId, {
          status: "Completed",
          completedAt: new Date().toISOString()
        });
        logger.debug("Job marked as completed", { jobId });
      }

      // ✅ 2. Record revenue if payment received
      if (amount && customerId) {
        // Get cityId from customer
        const customer = customerContext.customers.find(c => c.customerId === customerId);
        const cityId = customer?.cityId || event.data.cityId || "CITY-SURAT";

        financeContext.recordRevenue({
          customerId,
          jobId,
          type: "Subscription",
          amount,
          receivedDate: new Date().toISOString(),
          paymentMethod: event.data.paymentMethod || "UPI",
          status: "Received",
          cityId, // ✅ Multi-city isolation
        });
        logger.debug("Revenue recorded", { amount, cityId });
      }

      // ✅ 3. Update washer's incentive achievement
      const washerId = event.data.washerId;
      if (washerId) {
        const currentIncentive = incentiveContext.getEmployeeIncentive(washerId);
        if (currentIncentive) {
          // G5 FIX: use incrementAchievement (race-safe) instead of absolute updateAchievement
          if (incentiveContext.incrementAchievement) {
            incentiveContext.incrementAchievement(washerId, 1);
          } else {
            incentiveContext.updateAchievement(washerId, currentIncentive.achieved + 1);
          }
          logger.debug("Incentive achievement incremented", { washerId });
        }
      }

      // Toast notification (secondary)
      toast.success("Job Completed", {
        description: `Job #${jobId} completed by ${washerName || "Washer"}`,
      });
    } catch (error) {
      logger.error("JOB_COMPLETED: Error updating data", error as Error);
      toast.error("Error completing job", {
        description: "Data update failed. Please check logs."
      });
    }
  });

  // ==================== PAYMENT_RECEIVED ====================
  // Updates: FinanceContext, SubscriptionContext
  useEventListener("PAYMENT_RECEIVED", (event) => {
    try {
      const { customerId, subscriptionId, amount, customerName, paymentMethod } = event.data;

      // ✅ 1. Record revenue
      // Get cityId from customer
      const customer = customerContext.customers.find(c => c.customerId === customerId);
      const cityId = customer?.cityId || event.data.cityId || "CITY-SURAT";

      financeContext.recordRevenue({
        customerId,
        subscriptionId,
        type: subscriptionId ? "Subscription" : "One-Time",
        amount,
        receivedDate: new Date().toISOString(),
        paymentMethod: paymentMethod || "UPI",
        status: "Received",
        cityId, // ✅ Multi-city isolation
      });
      logger.debug("Payment recorded", { amount, cityId });

      // ✅ 2. Activate subscription if it was pending payment
      if (subscriptionId) {
        subscriptionContext.updateSubscription(subscriptionId, { status: "Active" });
        logger.debug("Subscription activated after payment", { subscriptionId });
      }

      // Toast notification (secondary)
      toast.success("Payment Received", {
        description: `₹${amount} from ${customerName || "Customer"}`,
        duration: 4000,
      });
    } catch (error) {
      logger.error("PAYMENT_RECEIVED: Error updating data", error as Error);
      toast.error("Error recording payment", {
        description: "Data update failed. Please check logs."
      });
    }
  });

  // ==================== INVENTORY_LOW_STOCK ====================
  // Updates: InventoryContext (alert state)
  useEventListener("INVENTORY_LOW_STOCK", (event) => {
    try {
      const { itemName, quantity, reorderLevel } = event.data;

      // ✅ Inventory context would be updated here
      // For now, just log and alert
      logger.warn("Low stock alert", { itemName, quantity, reorderLevel });

      // Toast notification (primary for alerts)
      toast.warning("Low Stock Alert", {
        description: `${itemName}: Only ${quantity} units left`,
        duration: 6000,
      });
    } catch (error) {
      logger.error("INVENTORY_LOW_STOCK: Error handling alert", error as Error);
    }
  });

  // ==================== DEMO_COMPLETED ====================
  // Updates: CustomerContext (pipeline stage), JobContext
  useEventListener("DEMO_COMPLETED", (event) => {
    try {
      const { customerId, jobId, customerName, outcome } = event.data;

      // ✅ 1. Update job to completed
      if (jobId) {
        jobContext.updateJob(jobId, {
          status: "Completed",
          completedAt: new Date().toISOString()
        });
        logger.debug("Demo job completed", { jobId });
      }

      // ✅ 2. Update customer pipeline stage based on outcome
      if (customerId && outcome === "Interested") {
        customerContext.updateCustomer(customerId, { status: "Demo Scheduled" });
        logger.debug("Customer moved to interested stage", { customerId });
      }

      // Toast notification (secondary)
      toast.info("Demo Service Completed", {
        description: `Customer: ${customerName || "Unknown"}`,
      });
    } catch (error) {
      logger.error("DEMO_COMPLETED: Error updating data", error as Error);
      toast.error("Error completing demo", {
        description: "Data update failed. Please check logs."
      });
    }
  });

  // ==================== WASHER_CHECKIN ====================
  // Updates: AttendanceContext
  useEventListener("WASHER_CHECKIN", (event) => {
    try {
      const { employeeId, checkInTime, lateMinutes, location } = event.data;

      // ✅ Add attendance record
      const today = new Date().toISOString().split('T')[0];
      employeeContext.addAttendanceRecord({
        employeeId,
        date: today,
        checkInTime: checkInTime,
        status: "Present",
        lateMinutes: lateMinutes || 0,
        cityId: event.data.cityId || "", // G6 FIX: cityId required for multi-city queries
        location: location && typeof location === "object"
          ? { latitude: location.lat ?? location.latitude, longitude: location.lng ?? location.longitude }
          : undefined, // G6 FIX: was string 'Unknown' — must be {latitude,longitude} or undefined
        selfieVerified: event.data.selfieVerified || false,
        jobsCompleted: 0
      });
      logger.debug("Attendance recorded", { employeeId, checkInTime, lateMinutes });

      // No toast for check-ins (too frequent)
    } catch (error) {
      logger.error("WASHER_CHECKIN: Error recording attendance", error as Error);
    }
  });

  // ==================== WASHER_CHECKOUT ====================
  // Updates: AttendanceContext
  useEventListener("WASHER_CHECKOUT", (event) => {
    try {
      const { employeeId, checkOutTime, hoursWorked } = event.data;

      // ✅ Update attendance record with checkout time
      // Note: This would need to find and update the existing record
      // For now, just log
      logger.debug("Checkout recorded", { employeeId, checkOutTime, hoursWorked });

      // No toast for checkouts (too frequent)
    } catch (error) {
      logger.error("WASHER_CHECKOUT: Error recording checkout", error as Error);
    }
  });

  // ==================== PAYROLL_APPROVED ====================
  // Updates: FinanceContext (payables)
  useEventListener("PAYROLL_APPROVED", (event) => {
    try {
      const { payrollId, employeeCount, totalAmount } = event.data;

      // ✅ Finance context would update payables here
      logger.debug("Payroll approved", { payrollId, employeeCount, totalAmount });

      // Toast notification (secondary)
      toast.success("Payroll Approved", {
        description: `${employeeCount} employees - ₹${totalAmount}`,
        duration: 5000,
      });
    } catch (error) {
      logger.error("PAYROLL_APPROVED: Error updating payroll", error as Error);
      toast.error("Error approving payroll", {
        description: "Data update failed. Please check logs."
      });
    }
  });

  // ==================== INVENTORY_PROCURED ====================
  // Updates: FinanceContext (create vendor payable)
  useEventListener("INVENTORY_PROCURED", (event) => {
    try {
      const { itemId, itemName, quantity, supplierId, amount, cityId } = event.data;
      financeContext.createPayable({
        type: "Vendor",
        description: `Procurement — ${itemName} × ${quantity}`,
        vendorId: supplierId,
        amount,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        status: "Pending",
        cityId,
      });
    } catch (e) {
      logger.error("INVENTORY_PROCURED: Failed to create payable", e as Error);
    }
  });

  // ==================== INCENTIVE_PAID ====================
  // Updates: FinanceContext (create journal entry)
  useEventListener("INCENTIVE_PAID", (event) => {
    try {
      const { employeeId, amount, cityId } = event.data;
      // DR Incentive Payable, CR Bank
      accountingEntryService.createJournal({
        date: new Date().toISOString().split("T")[0],
        narration: `Incentive payment — ${employeeId}`,
        lines: [
          { accountHead: "incentive_payable", accountLabel: "Incentive Payable", debit: amount, credit: 0 },
          { accountHead: "bank",              accountLabel: "Axis Bank",           debit: 0, credit: amount },
        ],
        city: cityId === "CITY-MUMBAI" ? "Mumbai" : "Surat",
        cityId, createdBy: "System",
      }, cityId === "CITY-MUMBAI" ? "Mumbai" : "Surat");
    } catch (e) {
      logger.error("INCENTIVE_PAID: Journal entry failed", e as Error);
    }
  });
}
