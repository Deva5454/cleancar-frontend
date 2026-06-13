/**
 * CustomerSubscriptionContext - CUSTOMER SUBSCRIPTION INSTANCES
 *
 * ⚠️ DO NOT CONFUSE WITH PlanDefinitionContext ⚠️
 *
 * THIS CONTEXT:
 * - Stores active customer subscriptions (who subscribed to what)
 * - Links customers to plans via customerId and planId
 * - Tracks billing status, start/end dates, payment status
 * - Historical pricing locked at subscription creation
 *
 * PlanDefinitionContext (DIFFERENT):
 * - Stores plan templates and pricing definitions
 * - Used for admin plan management and pricing updates
 * - NOT for customer subscription tracking
 *
 * NAMING CONVENTION:
 * - "Subscription" = Customer subscription instance
 * - "Plan" = Plan definition/template
 *
 * Used across: CRM, Jobs, Finance, Revenue
 */

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef} from "react";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { useSync } from "../hooks/useSync";
// REMOVED: circular import useFinance from FinanceContext
import { useCity } from "./CityContext";
import { periodicScheduleService } from "../services/periodicScheduleService";

// Types
export interface CustomerSubscription {
  subscriptionId: string;
  customerId: string; // GLOBAL IDENTITY - links to CustomerContext
  packageType: "Basic" | "Standard" | "Premium" | "Deluxe" | "EXPRESS_WASH" | "SMART_WASH" | "ELITE_WASH" | "ELITE_2W";
  packageName: string;
  frequency: "Daily" | "Alternate Days" | "Weekly" | "Bi-Weekly" | "Monthly";
  status: "Active" | "Paused" | "Cancelled" | "Expired" | "Exhausted";
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  pricing: {
    basePrice: number;
    discount: number;
    finalPrice: number;
    currency: string;
  };
  priceLocked: number; // CRITICAL: Price snapshot at creation - NEVER changes for historical accuracy
  serviceDetails: {
    vehicleType: string;
    addOns?: string[];
    preferredTimeSlot?: string;
  };
  billingCycle: "Monthly" | "Quarterly" | "Annual";
  paymentStatus: "Paid" | "Pending" | "Overdue";
  createdAt: string;
  updatedAt: string;
  pauseHistory?: Array<{
    pausedAt: string;
    resumedAt?: string;
    reason: string;
  }>;
}

interface CustomerSubscriptionContextType {
  subscriptions: CustomerSubscription[];
  createSubscription: (subscription: Omit<CustomerSubscription, "subscriptionId" | "createdAt" | "updatedAt">) => CustomerSubscription;
  updateSubscription: (subscriptionId: string, updates: Partial<CustomerSubscription>) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: CustomerSubscription["status"]) => void;
  deleteSubscription: (subscriptionId: string) => void;
  getSubscriptionById: (subscriptionId: string) => CustomerSubscription | undefined;
  getSubscriptionsByCustomerId: (customerId: string) => CustomerSubscription[];
  getActiveSubscriptions: () => CustomerSubscription[];
  pauseSubscription: (subscriptionId: string, reason: string) => void;
  resumeSubscription: (subscriptionId: string) => void;
  cancelSubscription: (subscriptionId: string) => void;
}

const CustomerSubscriptionContext = createContext<CustomerSubscriptionContextType | undefined>(undefined);

export function CustomerSubscriptionProvider({ children }: { children: ReactNode }) {
  // Defensive: FinanceProvider must be above CustomerSubscriptionProvider in AppProvider (now fixed).
  // useFinance removed — MRR fires via cc360_mrr_add event
  const { city } = useCity();

  const _dbSubscrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>(() => {
    const stored = DataService.get<CustomerSubscription>("SUBSCRIPTIONS");
    logger.debug("CustomerSubscriptionContext loaded", { count: stored.length });
    return stored;
  });

  // Persist to storage (local cache - instant)
  useEffect(() => {
    if (_dbSubscrTimer.current) clearTimeout(_dbSubscrTimer.current);
    _dbSubscrTimer.current = setTimeout(() => DataService.setAll("SUBSCRIPTIONS", subscriptions), 500);
  }, [subscriptions]);

  // Backend sync (background, non-blocking)
  useSync("SUBSCRIPTIONS", subscriptions);

  const createSubscription = (
    subscriptionData: Omit<CustomerSubscription, "subscriptionId" | "createdAt" | "updatedAt">
  ): CustomerSubscription => {
    const newSubscription: CustomerSubscription = {
      ...subscriptionData,
      subscriptionId: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // CRITICAL: Lock price at creation time - this NEVER changes
      priceLocked: subscriptionData.pricing.finalPrice,
      paymentMethod: (subscriptionData as any).paymentMethod || "UPI",
      paymentInstrumentHint: (subscriptionData as any).paymentInstrumentHint || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSubscriptions((prev) => [...prev, newSubscription]);

    // Fire cc360_mrr_add — FinanceContext listener handles MRR creation
    if (newSubscription.status === "Active") {
      try {
        const _mrrEvt = {
          month: new Date().toISOString().slice(0, 7),
          subscriptionId: newSubscription.subscriptionId,
          customerId: newSubscription.customerId,
          revenue: newSubscription.priceLocked,
          status: "Active",
          cityId: city,
        };
        window.dispatchEvent(new CustomEvent("cc360_mrr_add", { detail: _mrrEvt }));
      } catch (_e) { /* non-critical */ }
    }

    // Stage 1 WA to customer + Team Alert on new subscription
    try {
      const customers: any[] = DataService.get<any>("CUSTOMERS") || [];
      const cust = customers.find((c: any) => c.customerId === newSubscription.customerId);
      if (cust?.phone) {
        sendBookingPending({
          customerPhone: cust.phone,
          customerName: cust.firstName || "Customer",
          planLabel: newSubscription.packageName || "Subscription",
        });
      }
      // Team alert
      const bookingInfo = determineBookingWindow(new Date());
      sendTeamAlert({
        bookingType: "SUBSCRIPTION",
        customerName: cust?.firstName || "Customer",
        packageName: newSubscription.packageName || "",
        area: newSubscription.serviceDetails?.area || "",
        amount: newSubscription.pricing?.finalPrice || 0,
        recipients: bookingInfo.alertRecipients,
      });
    } catch (_e) { /* non-critical */ }

    // Auto-generate first job and periodic schedule
    try {
      // Initialize periodic schedule anchored to start date
      periodicScheduleService.getCustomerOccurrences(newSubscription.customerId); // init if needed
      
      // Fire event so JobContext can pick up and create the first job
      window.dispatchEvent(new CustomEvent("cc360:subscription_created", {
        detail: {
          subscriptionId: newSubscription.subscriptionId,
          customerId: newSubscription.customerId,
          packageType: newSubscription.packageType,
          packageName: newSubscription.packageName,
          startDate: newSubscription.startDate,
          preferredTimeSlot: newSubscription.serviceDetails?.preferredTimeSlot || "06:00",
          vehicleType: newSubscription.serviceDetails?.vehicleType || "hatchback",
          addOns: newSubscription.serviceDetails?.addOns || [],
          frequency: newSubscription.frequency,
          cityId: city,
        }
      }));
    } catch (_e) { /* non-critical */ }

    return newSubscription;
  };

  const updateSubscription = (subscriptionId: string, updates: Partial<CustomerSubscription>) => {
    // G7: Non-transferability — block customerId change
    if ((updates as any).customerId) {
      const existing = subscriptions.find(s => s.subscriptionId === subscriptionId);
      if (existing && (updates as any).customerId !== existing.customerId) {
        throw new Error("Subscriptions cannot be transferred between customers. Policy: Cancellation Policy §7.");
      }
    }

    // C5: Vehicle change fee 20% — log for TSM waiver workflow
    const existingSub = subscriptions.find(s => s.subscriptionId === subscriptionId);
    if (existingSub && (updates as any).vehicleReg && (updates as any).vehicleReg !== existingSub.serviceDetails?.vehicleReg) {
      const changeFee = Math.round(existingSub.priceLocked * 0.20);
      const vehicleChangeLogs = JSON.parse(localStorage.getItem("cleancar_vehicle_change_requests") || "[]");
      vehicleChangeLogs.unshift({
        id: `VCR-${Date.now()}`,
        subscriptionId,
        customerId: existingSub.customerId,
        oldVehicleReg: existingSub.serviceDetails?.vehicleReg || "—",
        newVehicleReg: (updates as any).vehicleReg,
        changeFee,
        originalValue: existingSub.priceLocked,
        status: "PENDING_PAYMENT",
        tsmWaived: false,
        tsmWaiverReason: null,
        requestedAt: new Date().toISOString(),
        notes: "Vehicle change fee of 20% applies. TSM can waive with explanation.",
      });
      localStorage.setItem("cleancar_vehicle_change_requests", JSON.stringify(vehicleChangeLogs));
      // In production: block update until payment confirmed OR TSM waiver approved
    }
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.subscriptionId === subscriptionId) {
          // CRITICAL: Prevent priceLocked from being modified after creation
          const { priceLocked, ...safeUpdates } = updates;
          return {
            ...sub,
            ...safeUpdates,
            updatedAt: new Date().toISOString(),
          };
        }
        return sub;
      })
    );
  };

  const updateSubscriptionStatus = (subscriptionId: string, status: CustomerSubscription["status"]) => {
    updateSubscription(subscriptionId, { status });
  };

  const getSubscriptionById = (subscriptionId: string): CustomerSubscription | undefined => {
    return subscriptions.find((s) => s.subscriptionId === subscriptionId);
  };

  const getSubscriptionsByCustomerId = (customerId: string): CustomerSubscription[] => {
    return subscriptions.filter((s) => s.customerId === customerId);
  };

  const getActiveSubscriptions = (): CustomerSubscription[] => {
    return subscriptions.filter((s) => s.status === "Active");
  };

  const pauseSubscription = (subscriptionId: string, reason: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.subscriptionId === subscriptionId) {
          const pauseEntry = {
            pausedAt: new Date().toISOString(),
            reason,
          };
          return {
            ...sub,
            status: "Paused" as const,
            pauseHistory: [...(sub.pauseHistory || []), pauseEntry],
            updatedAt: new Date().toISOString(),
          };
        }
        return sub;
      })
    );
  };

  const resumeSubscription = (subscriptionId: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.subscriptionId === subscriptionId && sub.pauseHistory) {
          const updatedHistory = [...sub.pauseHistory];
          const lastPause = updatedHistory[updatedHistory.length - 1];
          if (lastPause && !lastPause.resumedAt) {
            lastPause.resumedAt = new Date().toISOString();
          }
          return {
            ...sub,
            status: "Active" as const,
            pauseHistory: updatedHistory,
            updatedAt: new Date().toISOString(),
          };
        }
        return sub;
      })
    );
  };

  const cancelSubscription = (subscriptionId: string) => {
    updateSubscriptionStatus(subscriptionId, "Cancelled");

    // Fire cc360_mrr_remove — FinanceContext listener handles MRR removal
    try {
      window.dispatchEvent(new CustomEvent("cc360_mrr_remove", { detail: { subscriptionId } }));
    } catch (_e) { /* non-critical */ }
  };

  const deleteSubscription = (subscriptionId: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.subscriptionId !== subscriptionId));
  };

  const contextValue = useMemo(() => ({
        subscriptions,
        createSubscription,
        updateSubscription,
        updateSubscriptionStatus,
        deleteSubscription,
        getSubscriptionById,
        getSubscriptionsByCustomerId,
        getActiveSubscriptions,
        pauseSubscription,
        resumeSubscription,
        cancelSubscription,
      }),
  [subscriptions, createSubscription, updateSubscription, updateSubscriptionStatus, deleteSubscription, getSubscriptionById, getSubscriptionsByCustomerId, getActiveSubscriptions, pauseSubscription, resumeSubscription]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CustomerSubscriptionContext.Provider
      value={contextValue}
    >
      {children}
    </CustomerSubscriptionContext.Provider>
  );
}

export function useCustomerSubscriptions() {
  const context = useContext(CustomerSubscriptionContext);
  if (!context) {
    console.warn("[useCustomerSubscriptions] Called outside CustomerSubscriptionProvider — returning fallback"); return context as any;
  }
  return context;
}
