/**
 * CustomerContext - SINGLE SOURCE OF TRUTH for all customer data
 * Used across: CRM, Subscription, Jobs, Finance
 *
 * CRITICAL: Uses services for business logic - NO direct mutations
 */

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef} from "react";
import { LeadConversionService, type Lead, type LeadActivity, type SubscriptionPlan, type ConversionResult } from "../services/leadConversionService";
import { useJobs } from "./JobContext";
// REMOVED: circular import useFinance from FinanceContext
import { useEvents } from "./EventSystem";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { useSync } from "../hooks/useSync";
import { useCity } from "./CityContext";
import { AnalyticsService } from "../services/analyticsService";

// Types
export interface Customer {
  customerId: string; // GLOBAL IDENTITY - used across all modules
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    area: string;
    city: string;
    pinCode: string;
  };
  vehicleDetails?: {
    category: string; // Sedan, SUV, Hatchback, 2W
    brand: string;
    color: string;
    registrationNumber: string;
  };
  leadSource?: string; // "Referral", "Google Ads", "Walk-in", etc.
  status: "Lead" | "Demo Scheduled" | "Active" | "Inactive" | "Churned";
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
}

interface CustomerContextType {
  customers: Customer[];
  cityCustomers: Customer[];  // Auto-filtered to current city
  addCustomer: (customer: Omit<Customer, "customerId" | "createdAt" | "updatedAt">) => Customer;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  getCustomerById: (customerId: string) => Customer | undefined;
  getCustomersByStatus: (status: Customer["status"]) => Customer[];
  deleteCustomer: (customerId: string) => void;
  leads: Lead[];
  cityLeads: Lead[];
  addLead: (lead: Omit<Lead, "leadId" | "createdAt">) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  appendLeadActivity: (leadId: string, activity: Omit<LeadActivity, "id">) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const stored = DataService.get<Customer>("CUSTOMERS");
    logger.debug("CustomerContext loaded", { count: stored.length });
    return stored;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const stored = DataService.get<Lead>("LEADS");
    logger.debug("Leads loaded", { count: stored.length });
    return stored;
  });

  const _dbCustTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const _dbLeadsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { city, cityInfo } = useCity();
  const cityCustomers = useMemo(() => {
    const cityName = cityInfo.displayName.toLowerCase();
    const cityId   = city;
    return customers.filter(c =>
      c.city?.toLowerCase() === cityName ||
      c.cityId === cityId ||
      c.city === cityId
    );
  }, [customers, city, cityInfo]);

  const cityLeads = useMemo(() => {
    const cityId   = city;
    const cityName = cityInfo.displayName.toLowerCase();
    return leads.filter(l =>
      l.cityId === cityId ||
      l.city?.toLowerCase() === cityName
    );
  }, [leads, city, cityInfo]);

  const { emit } = useEvents();

  // Persist to storage (local cache - instant)
    // Re-hydrate from localStorage after Supabase data loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored_customers = DataService.get<Customer>("CUSTOMERS");
      if (stored_customers.length > customers.length) { setCustomers(stored_customers); }
      const stored_leads = DataService.get<Lead>("LEADS");
      if (stored_leads.length > leads.length) { setLeads(stored_leads); }
    }, 1000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (_dbCustTimer.current) clearTimeout(_dbCustTimer.current);
    _dbCustTimer.current = setTimeout(() => {
      if (customers.length > 0 && customers.length <= 200) DataService.setAll("CUSTOMERS", customers);
    }, 500);
  }, [customers]);

  useEffect(() => {
    if (_dbLeadsTimer.current) clearTimeout(_dbLeadsTimer.current);
    _dbLeadsTimer.current = setTimeout(() => {
      if (leads.length > 0 && leads.length <= 300) DataService.setAll("LEADS", leads);
    }, 500);
  }, [leads]);

  // Backend sync (background, non-blocking)
  useSync("CUSTOMERS", customers);
  useSync("LEADS", leads);

  const addCustomer = (customerData: Omit<Customer, "customerId" | "createdAt" | "updatedAt">): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      customerId: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (customerId: string, updates: Partial<Customer>) => {
    const previousCustomer = customers.find(c => c.customerId === customerId);
    const wasLead = previousCustomer?.status === "Lead" || previousCustomer?.status === "Demo Scheduled";
    const nowActive = updates.status === "Active";

    setCustomers((prev) =>
      prev.map((customer) =>
        customer.customerId === customerId
          ? { ...customer, ...updates, updatedAt: new Date().toISOString() }
          : customer
      )
    );

    // Emit LEAD_CONVERTED event when lead becomes active customer
    if (wasLead && nowActive && previousCustomer) {
      emit("LEAD_CONVERTED", {
        customerId,
        customerName: `${previousCustomer.firstName} ${previousCustomer.lastName}`,
        email: previousCustomer.email,
        phone: previousCustomer.phone,
        leadSource: previousCustomer.leadSource,
        convertedAt: new Date().toISOString(),
      }, "CustomerContext");

      // Also track in AnalyticsService so CACDashboard, TSE leaderboard,
      // and conversion metrics receive real events.
      // Note: leadConversionService.convertLead() fires its own LEAD_CONVERTED
      // event with full revenue data when converting via the standard flow.
      // This fallback covers status changes made directly via updateCustomer().
      const matchingLead = leads.find(
        l => l.email === previousCustomer.email || l.phone === previousCustomer.phone
      );

      AnalyticsService.track("LEAD_CONVERTED", {
        customerId,
        customerName: `${previousCustomer.firstName} ${previousCustomer.lastName}`,
        source:  previousCustomer.leadSource || matchingLead?.leadSource || "Unknown",
        tseId:   matchingLead?.assignedTo  || "UNKNOWN",
        tseName: matchingLead?.assignedTSE || "Unknown TSE",
        revenue: 0, // Revenue tracked accurately by leadConversionService when available
        cityId:  city,
        convertedAt: new Date().toISOString(),
      });
    }
  };

  const getCustomerById = (customerId: string): Customer | undefined => {
    return customers.find((c) => c.customerId === customerId);
  };

  const getCustomersByStatus = (status: Customer["status"]): Customer[] => {
    return customers.filter((c) => c.status === status);
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.customerId !== customerId));
  };

  const addLead = (leadData: Omit<Lead, "leadId" | "createdAt">): Lead => {
    const newLead: Lead = {
      ...leadData,
      leadId: `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setLeads((prev) => [...prev, newLead]);

    // Track lead creation in analytics
    AnalyticsService.track("LEAD_CREATED", {
      leadId: newLead.leadId,
      source: newLead.leadSource || "Unknown",
      cityId: newLead.cityId || city,
    });

    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.leadId === id
          ? { ...lead, ...updates }
          : lead
      )
    );
  };

  const appendLeadActivity = (leadId: string, activity: Omit<LeadActivity, "id">) => {
    const newActivity: LeadActivity = {
      ...activity,
      id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };
    updateLead(leadId, {
      timeline: [...(leads.find(l => l.leadId === leadId)?.timeline || []), newActivity],
      lastContactedAt: new Date().toISOString(),
    });
  };

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.leadId !== id));
  };

  const customerContextValue = useMemo(() => ({

        customers,
        cityCustomers,
        addCustomer,
        updateCustomer,
        getCustomerById,
        getCustomersByStatus,
        deleteCustomer,
        leads,
        cityLeads,
        addLead,
        updateLead,
        deleteLead,
        appendLeadActivity,
      }),
  // eslint-disable-line react-hooks/exhaustive-deps
  [customers, cityCustomers, addCustomer, updateCustomer, getCustomerById, getCustomersByStatus, deleteCustomer, leads, cityLeads, addLead, updateLead, deleteLead]);

  return (
    <CustomerContext.Provider
      value={customerContextValue}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) {
    // PREVIEW FALLBACK: Safe no-op defaults for Figma Make iframe and dev HMR
    if (import.meta.hot || !import.meta.env?.PROD) {
      const noop = () => { throw new Error("CustomerContext not available in preview"); };
      return {
        customers: [], cityCustomers: [], addCustomer: noop, updateCustomer: () => {}, deleteCustomer: () => {},
        getCustomerById: () => undefined, getCustomersByStatus: () => [],
        leads: [], cityLeads: [], addLead: noop, updateLead: () => {}, deleteLead: () => {}, appendLeadActivity: () => {},
      } as CustomerContextType;
    }
    console.warn("[useCustomers] Called outside CustomerProvider — returning fallback"); return context as any;
  }
  return context;
}
