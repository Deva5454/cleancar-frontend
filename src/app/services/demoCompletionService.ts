/**
 * Demo Completion Service
 * Handles demo job outcomes and triggers appropriate flows
 *
 * FLOW 2: DEMO COMPLETION
 * - Converted → Trigger LEAD_CONVERTED flow
 * - Trial → Create customer + trial subscription (NO jobs yet)
 * - Pending → Mark for follow-up
 * - Rejected → Close demo
 */

import { LeadConversionService, type Lead, type SubscriptionPlan, type ConversionResult } from "./leadConversionService";
import type { Customer } from "../contexts/CustomerContext";
import type { CustomerSubscription } from "../contexts/CustomerSubscriptionContext";

export type DemoOutcome = "Converted" | "Trial" | "Pending" | "Rejected";

export interface DemoCompletionData {
  demoId: string;
  leadId: string;
  lead: Lead;
  outcome: DemoOutcome;
  plan?: SubscriptionPlan; // Required for Converted/Trial
  notes?: string;
  followUpDate?: string; // For Pending outcome
  rejectionReason?: string; // For Rejected outcome
}

export interface DemoCompletionResult {
  success: boolean;
  outcome: DemoOutcome;
  customer?: Customer;
  subscription?: Subscription;
  conversionResult?: ConversionResult;
  message: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

/**
 * DEMO COMPLETION SERVICE
 */
export class DemoCompletionService {
  /**
   * Complete a demo and handle outcome
   */
  static completeDemo(
    demoData: DemoCompletionData,
    contexts: {
      addCustomer: any;
      createSubscription: any;
      generateJobsFromSubscription: any;
      addMRREntry: any;
      emit: any;
      updateCustomer?: any;
    }
  ): DemoCompletionResult {
    console.log(`[DEMO_COMPLETION] Processing demo ${demoData.demoId} - Outcome: ${demoData.outcome}`);

    // Emit DEMO_COMPLETED event
    contexts.emit("DEMO_COMPLETED", {
      demoId: demoData.demoId,
      leadId: demoData.leadId,
      outcome: demoData.outcome,
    }, "DemoCompletionService");

    switch (demoData.outcome) {
      case "Converted":
        return this.handleConvertedDemo(demoData, contexts);

      case "Trial":
        return this.handleTrialDemo(demoData, contexts);

      case "Pending":
        return this.handlePendingDemo(demoData, contexts);

      case "Rejected":
        return this.handleRejectedDemo(demoData, contexts);

      default:
        return {
          success: false,
          outcome: demoData.outcome,
          message: "Invalid demo outcome",
        };
    }
  }

  /**
   * CONVERTED: Trigger full LEAD_CONVERTED flow
   */
  private static handleConvertedDemo(
    demoData: DemoCompletionData,
    contexts: any
  ): DemoCompletionResult {
    if (!demoData.plan) {
      return {
        success: false,
        outcome: "Converted",
        message: "Plan details required for converted demo",
      };
    }

    // Trigger LEAD_CONVERTED flow
    const conversionResult = LeadConversionService.convertLead(
      demoData.lead,
      demoData.plan,
      contexts
    );

    if (conversionResult.success) {
      return {
        success: true,
        outcome: "Converted",
        customer: conversionResult.customer,
        subscription: conversionResult.subscription,
        conversionResult,
        message: `Demo converted successfully! ${conversionResult.jobsGenerated?.length} jobs generated.`,
      };
    } else {
      return {
        success: false,
        outcome: "Converted",
        message: `Conversion failed: ${conversionResult.error}`,
      };
    }
  }

  /**
   * TRIAL: Create customer + trial subscription, NO jobs yet
   */
  private static handleTrialDemo(
    demoData: DemoCompletionData,
    contexts: any
  ): DemoCompletionResult {
    if (!demoData.plan) {
      return {
        success: false,
        outcome: "Trial",
        message: "Plan details required for trial",
      };
    }

    try {
      // Create customer
      const customer = contexts.addCustomer({
        firstName: demoData.lead.firstName,
        lastName: demoData.lead.lastName,
        email: demoData.lead.email,
        phone: demoData.lead.phone,
        address: demoData.lead.address,
        vehicleDetails: demoData.lead.vehicleDetails,
        leadSource: demoData.lead.leadSource,
        status: "Active",
      });

      // Create trial subscription (NO jobs generated)
      const subscription = contexts.createSubscription({
        customerId: customer.customerId,
        packageType: demoData.plan.packageType,
        packageName: `${demoData.plan.packageName} (Trial)`,
        frequency: demoData.plan.frequency,
        status: "Active", // Trial is active but marked as trial in name
        startDate: demoData.plan.startDate,
        renewalDate: this.calculateTrialEndDate(demoData.plan.startDate),
        pricing: {
          ...demoData.plan.pricing,
          finalPrice: 0, // Trial is free
          discount: demoData.plan.pricing.basePrice,
        },
        serviceDetails: {
          vehicleType: demoData.lead.vehicleDetails?.category || "Unknown",
          addOns: demoData.plan.addOns,
        },
        billingCycle: "Monthly",
        paymentStatus: "Paid", // Trial doesn't require payment
      });

      console.log(`[DEMO_COMPLETION] Trial subscription created: ${subscription.subscriptionId} (NO JOBS)`);

      contexts.emit("TRIAL_STARTED", {
        customerId: customer.customerId,
        subscriptionId: subscription.subscriptionId,
        trialEndDate: subscription.renewalDate,
      }, "DemoCompletionService");

      return {
        success: true,
        outcome: "Trial",
        customer,
        subscription,
        message: "Trial subscription created. Jobs will be generated upon trial confirmation.",
      };
    } catch (error) {
      return {
        success: false,
        outcome: "Trial",
        message: `Trial creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * PENDING: Mark for follow-up
   */
  private static handlePendingDemo(
    demoData: DemoCompletionData,
    contexts: any
  ): DemoCompletionResult {
    const followUpDate = demoData.followUpDate || this.getDefaultFollowUpDate();

    contexts.emit("DEMO_FOLLOW_UP_REQUIRED", {
      demoId: demoData.demoId,
      leadId: demoData.leadId,
      followUpDate,
      notes: demoData.notes,
    }, "DemoCompletionService");

    console.log(`[DEMO_COMPLETION] Demo marked pending - Follow-up: ${followUpDate}`);

    return {
      success: true,
      outcome: "Pending",
      message: `Demo marked for follow-up on ${followUpDate}`,
      followUpRequired: true,
      followUpDate,
    };
  }

  /**
   * REJECTED: Close demo, no further action
   */
  private static handleRejectedDemo(
    demoData: DemoCompletionData,
    contexts: any
  ): DemoCompletionResult {
    contexts.emit("DEMO_REJECTED", {
      demoId: demoData.demoId,
      leadId: demoData.leadId,
      reason: demoData.rejectionReason,
    }, "DemoCompletionService");

    console.log(`[DEMO_COMPLETION] Demo rejected - Reason: ${demoData.rejectionReason || "Not specified"}`);

    return {
      success: true,
      outcome: "Rejected",
      message: `Demo closed as rejected. Reason: ${demoData.rejectionReason || "Not specified"}`,
    };
  }

  /**
   * Calculate trial end date (7 days from start)
   */
  private static calculateTrialEndDate(startDate: string): string {
    const start = new Date(startDate);
    const trialEnd = new Date(start);
    trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial
    return trialEnd.toISOString().split("T")[0];
  }

  /**
   * Get default follow-up date (3 days from now)
   */
  private static getDefaultFollowUpDate(): string {
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 3);
    return followUp.toISOString().split("T")[0];
  }
}
