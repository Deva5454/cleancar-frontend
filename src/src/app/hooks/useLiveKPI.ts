/**
 * useLiveKPI — Live KPI data from contexts.
 * Replaces MASTER_KPI_DATA (frozen March 2026 hardcoded values).
 * All 7 dashboards that imported MASTER_KPI_DATA should import this instead.
 */
import { useMemo } from "react";
import { useCustomers } from "../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../contexts/CustomerSubscriptionContext";
import { useEmployee } from "../contexts/EmployeeContext";
import { useRevenueMetrics } from "./useRevenueMetrics";

export function useLiveKPI(month?: string, cityId?: string) {
  const { customers } = useCustomers();
  const { subscriptions } = useCustomerSubscriptions();
  const { employees } = useEmployee();
  const revenueMetrics = useRevenueMetrics(month, cityId);

  return useMemo(() => ({
    // Customer KPIs
    totalCustomers:          customers.length,
    activeSubscriptions:     subscriptions.filter(s => s.status === "Active").length,
    pausedSubscriptions:     subscriptions.filter(s => s.status === "Paused").length,
    cancelledSubscriptions:  subscriptions.filter(s => s.status === "Cancelled").length,
    // Revenue KPIs
    monthlyRevenue:          revenueMetrics.totalRevenue,
    monthlyTarget:           950000, // business constant
    ebitdaMargin:            revenueMetrics.ebitdaMargin,
    mrrRevenue:              revenueMetrics.mrrRevenue,
    // HR KPIs
    totalEmployees:          employees.filter(e => (e as any).status === "Active").length,
    activeWashers:           employees.filter(e => (e as any).designation === "Car Washer" && (e as any).status === "Active").length,
    activeSupervisors:       employees.filter(e => (e as any).designation === "Supervisor" && (e as any).status === "Active").length,
    // Calculated
    conversionRate:          customers.length > 0
      ? Math.round((subscriptions.filter(s => s.status === "Active").length / customers.length) * 1000) / 10
      : 0,
  }), [customers, subscriptions, employees, revenueMetrics]);
}
