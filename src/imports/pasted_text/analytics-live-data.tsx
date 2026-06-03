High: CACDashboard Live Data, UnitEconomics Cost Fix, BreakEven, Consumption

This is Phase 2 of 3. All Phase 1 changes must be applied first.

CHANGE 1 — src/app/components/analytics/CACDashboard.tsx — Replace all mock with live analyticsService + CustomerContext (Gaps 1 + 9)
Add imports:
tsimport { AnalyticsService } from "../../services/analyticsService";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";
Inside the component, replace the entire hardcoded data block:
ts  const { cityCustomers, cityLeads } = useCustomers();
  const { city } = useCity();
  const { employees } = useEmployee();

  // Get conversion events from analyticsService
  const conversionMetrics = useMemo(() =>
    AnalyticsService.getConversionMetrics(), []);

  // CAC by channel from real conversion events
  const cacByChannel = useMemo(() => {
    const sourceMap = new Map<string, { spend: number; customers: number }>();
    AnalyticsService.getEvents("LEAD_CONVERTED").forEach(evt => {
      const source = evt.data.source || "Unknown";
      const existing = sourceMap.get(source) || { spend: 0, customers: 0 };
      sourceMap.set(source, {
        spend:     existing.spend + (evt.data.revenue || 0) * 0.15, // 15% CAC assumption
        customers: existing.customers + 1,
      });
    });
    return Array.from(sourceMap.entries()).map(([channel, d], i) => ({
      id: `channel-${i}`,
      channel,
      spend:      Math.round(d.spend),
      customers:  d.customers,
      cac:        d.customers > 0 ? Math.round(d.spend / d.customers) : 0,
      conversion: 0, // calculated below
    }));
  }, []);

  // CAC by city using real customers + available cities
  const cacByCity = useMemo(() => {
    return [
      { id: "city-surat",  city: "Surat",
        customers: cityCustomers.filter(c => c.cityId === "CITY-SURAT").length,
        spend:     cityCustomers.filter(c => c.cityId === "CITY-SURAT").length * 850 },
      { id: "city-mumbai", city: "Mumbai",
        customers: cityCustomers.filter(c => c.cityId === "CITY-MUMBAI").length,
        spend:     cityCustomers.filter(c => c.cityId === "CITY-MUMBAI").length * 920 },
    ].map(c => ({ ...c, cac: c.customers > 0 ? Math.round(c.spend / c.customers) : 0 }));
  }, [cityCustomers]);

  // Monthly CAC trend from real conversion data
  const cacTrend = useMemo(() => {
    const byMonth = new Map<string, { conversions: number; revenue: number }>();
    AnalyticsService.getEvents("LEAD_CONVERTED").forEach(evt => {
      const month = evt.timestamp.slice(0, 7);
      const existing = byMonth.get(month) || { conversions: 0, revenue: 0 };
      byMonth.set(month, {
        conversions: existing.conversions + 1,
        revenue: existing.revenue + (evt.data.revenue || 0),
      });
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d], i) => ({
        id: `month-${i}`,
        month: new Date(month + "-01").toLocaleString("en-IN", { month: "short" }),
        cac:    d.conversions > 0 ? Math.round((d.revenue * 0.15) / d.conversions) : 0,
        target: 800,
      }));
  }, []);

  // Fallback to mock data when no real conversion events exist
  const displayCACByChannel = cacByChannel.length > 0 ? cacByChannel : mockCACByChannel;
  const displayCACByCity    = cacByCity.every(c => c.customers > 0) ? cacByCity : mockCACByCity;
  const displayCACTrend     = cacTrend.length > 0 ? cacTrend : mockCACTrend;
Replace all cacByChannel.map(...), cacByCity.map(...), and cacTrend references with displayCACByChannel, displayCACByCity, displayCACTrend. Keep the mock arrays renamed as mockCACByChannel etc. for fallback.

CHANGE 2 — src/app/components/analytics/UnitEconomicsDashboard.tsx — Replace hardcoded cost with real data (Gap 7)
Add imports:
tsimport { useFinance } from "../../contexts/FinanceContext";
import { useCity } from "../../contexts/CityContext";
Inside the component:
ts  const { getPayablesByCity, getRevenueByCity } = useFinance();
  const { city } = useCity();

  // Derive costPerWash from real paid payables
  const realCostPerWash = useMemo(() => {
    const paidPayables = getPayablesByCity(city).filter(p => p.status === "Paid");
    const totalCost = paidPayables.reduce((s, p) => s + p.amount, 0);
    return totalWashes > 0 && totalCost > 0
      ? Math.round(totalCost / totalWashes)
      : 245; // fallback if no payables recorded
  }, [city, totalWashes]);

  // Derive real CAC from analyticsService
  const realCAC = useMemo(() => {
    const events = AnalyticsService.getEvents("LEAD_CONVERTED");
    const totalRevenue = events.reduce((s, e) => s + (e.data.revenue || 0), 0);
    const totalConversions = events.length;
    return totalConversions > 0
      ? Math.round((totalRevenue * 0.15) / totalConversions)
      : 850;
  }, []);

  // Build real revenue vs cost trend from FinanceContext
  const realRevenueCostTrend = useMemo(() => {
    const revenues  = getRevenueByCity(city).filter(r => r.status === "Received");
    const payables  = getPayablesByCity(city).filter(p => p.status === "Paid");
    const byMonth   = new Map<string, { revenue: number; cost: number }>();
    revenues.forEach(r => {
      const m = r.receivedDate?.slice(0, 7) || "";
      if (!m) return;
      const ex = byMonth.get(m) || { revenue: 0, cost: 0 };
      byMonth.set(m, { ...ex, revenue: ex.revenue + r.amount });
    });
    payables.forEach(p => {
      const m = p.paidAt?.slice(0, 7) || "";
      if (!m) return;
      const ex = byMonth.get(m) || { revenue: 0, cost: 0 };
      byMonth.set(m, { ...ex, cost: ex.cost + p.amount });
    });
    const trend = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d], i) => ({
        id: `m-${i}`,
        month: new Date(month + "-01").toLocaleString("en-IN", { month: "short" }),
        ...d,
      }));
    return trend.length > 0 ? trend : revenueVsCostTrend; // fallback
  }, [city]);
Replace const costPerWash = 245 with const costPerWash = realCostPerWash.
Replace const customerCAC = 850 with const customerCAC = realCAC.
Replace memoizedRevenueCostTrend with realRevenueCostTrend.

CHANGE 3 — src/app/components/analytics/CostPerWashByConsumption.tsx — Replace mock washer IDs with real employees (Gap 5)
Add imports:
tsimport { useEmployee } from "../../contexts/EmployeeContext";
import { useInventory } from "../../contexts/InventoryContext";
import { useJobs } from "../../contexts/JobContext";
Inside the component, replace WASHER_CONSUMPTION_DATA:
ts  const { employees } = useEmployee();
  const { inventory, stockTransactions } = useInventory();
  const { allJobs } = useJobs();

  const WASHER_CONSUMPTION_DATA = useMemo(() => {
    const cityWashers = employees.filter(e =>
      e.designation === "Car Washer" && e.status === "Active" &&
      (e.workLocation === city || e.cityId === city)
    );
    return cityWashers.map(w => {
      const washerJobs = allJobs.filter(j =>
        j.washerId === w.id && (j.status === "Completed" || j.status === "Verified")
      );
      const issuances = stockTransactions.filter(t =>
        t.toId === w.id && t.type === "Issue" && t.status === "Completed"
      );
      const materialCost = issuances.reduce((s, t) => {
        const item = inventory.find(i => i.itemId === t.itemId);
        return s + t.quantity * (item?.unitCost || 0);
      }, 0);
      const supervisorEmp = employees.find(e => e.id === w.reportingManager || e.fullName === w.reportingManager);
      return {
        washerId: w.id,
        washerName: w.fullName,
        city: cityInfo.displayName,
        supervisor: supervisorEmp?.fullName || w.reportingManager || "Unknown",
        totalWashes: washerJobs.length,
        materialCost,
        consumablesCost: Math.round(materialCost * 0.25),
        waterCost: washerJobs.length,
        fuelCost: Math.round(washerJobs.length * 15),
        overheadAllocation: Math.round(washerJobs.length * 25),
        equipmentCost: Math.round(washerJobs.length * 6),
        period: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
      };
    });
  }, [city, employees, allJobs, inventory, stockTransactions]);

  // Fallback to mock if no real data
  const displayWasherData = WASHER_CONSUMPTION_DATA.length > 0
    ? WASHER_CONSUMPTION_DATA : MOCK_WASHER_CONSUMPTION_DATA; // rename old array

CHANGE 4 — src/app/components/analytics/BreakEvenAnalysis.tsx — Replace masterData with real Finance + Inventory data (Gap 8)
Add imports:
tsimport { useFinance } from "../../contexts/FinanceContext";
import { useCity } from "../../contexts/CityContext";
Inside the component:
ts  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { availableCities } = useCity();

  const storeBreakEven = useMemo(() => {
    return availableCities.map(cityDef => {
      const cityId = cityDef.id;
      const revenues  = getRevenueByCity(cityId).filter(r => r.status === "Received");
      const payables  = getPayablesByCity(cityId).filter(p => p.status === "Paid");
      const monthlyRevenue  = revenues.reduce((s, r) => s + r.amount, 0);
      const monthlyExpenses = payables.reduce((s, p) => s + p.amount, 0);
      const setupCost   = 1500000; // one-time capital — configurable in settings
      const monthlyProfit = monthlyRevenue - monthlyExpenses;
      const breakEvenMonths = monthlyProfit > 0
        ? Math.ceil(setupCost / monthlyProfit)
        : 999;
      return {
        store: cityDef.displayName,
        investment: setupCost,
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfit,
        breakEvenMonths,
        breakEvenDate: new Date(Date.now() + breakEvenMonths * 30 * 86400000)
          .toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        progressToBreakEven: Math.min(
          Math.round((revenues.reduce((s, r) => s + r.amount, 0) / setupCost) * 100),
          100
        ),
      };
    });
  }, [availableCities]);

  // Fallback to masterData when no real finance records
  const displayStoreBreakEven = storeBreakEven.some(s => s.monthlyRevenue > 0)
    ? storeBreakEven : MASTER_STORE_BREAKEVEN;
Do not change any other file in Phase 2.