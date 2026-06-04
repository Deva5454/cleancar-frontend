Critical: EmployeeEfficiency, CityComparison, LabourCostPerWash fixes

This is Phase 1 of 3. Fix the 4 critical gaps.

CHANGE 1 — src/app/components/analytics/EmployeeEfficiency.tsx — Fix field name mismatches (Gap 4)
1A — Fix emp.role → emp.designation. Find all occurrences:
tsemp.role === "Washer"
emp.role === "Supervisor"
Replace each with:
tsemp.designation === "Car Washer"
emp.designation === "Supervisor"
1B — Fix job.location.city → job.city. Find:
tsconst cityJobs = completedJobs.filter(job => job.location.city.toUpperCase() === cityName);
Replace with:
tsconst cityJobs = completedJobs.filter(job =>
  (job.city?.toUpperCase() === cityName || job.cityId?.includes(cityName.toLowerCase()))
);
1C — Fix job.washerId → job.washerId already correct but washer.employeeId should be washer.id. Find:
tsreturn cityJobs.filter(job => job.washerId === washer.employeeId).length;
Replace with:
tsreturn cityJobs.filter(job => job.washerId === washer.id).length;
Also in the secondary washer loop (line ~259):
tsconst activeWashers = (employees || []).filter(emp => emp.status === "Active" && emp.role === "Washer");
Replace with:
tsconst activeWashers = (employees || []).filter(emp =>
  emp.status === "Active" && emp.designation === "Car Washer"
);
1D — Fix emp.city → emp.workLocation for city matching. Find:
tsconst cities = Array.from(new Set(activeEmployees.map(emp => emp.city.toUpperCase())));
const cityEmployees = activeEmployees.filter(emp => emp.city.toUpperCase() === cityName);
Replace with:
tsconst cities = Array.from(new Set(activeEmployees.map(emp =>
  (emp.city || emp.workLocation || "").toUpperCase()
).filter(Boolean)));
const cityEmployees = activeEmployees.filter(emp =>
  (emp.city || emp.workLocation || "").toUpperCase() === cityName
);

CHANGE 2 — src/app/components/analytics/CityComparison.tsx — Replace mock with live context data (Gap 2)
Add imports at the top:
tsimport { useFinance } from "../../contexts/FinanceContext";
import { usePayroll } from "../../contexts/PayrollContext";
import { useJobs } from "../../contexts/JobContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
Inside the component, replace CITY_DATA with a live useMemo:
ts  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { payrollRuns } = usePayroll();
  const { allJobs } = useJobs();
  const { customers } = useCustomers();
  const { employees } = useEmployee();
  const { availableCities } = useCity();

  const CITY_DATA: CityComparisonData[] = useMemo(() => {
    return availableCities.map(cityDef => {
      const cityId = cityDef.id;
      const cityName = cityDef.displayName.toUpperCase();

      const revenues     = getRevenueByCity(cityId).filter(r => r.status === "Received");
      const payables     = getPayablesByCity(cityId).filter(p => p.status === "Paid");
      const cityJobs     = allJobs.filter(j => j.cityId === cityId && (j.status === "Completed" || j.status === "Verified"));
      const cityCustomers= customers.filter(c => c.cityId === cityId && c.status === "Active");
      const cityEmployees= employees.filter(e => (e.workLocation === cityId || e.cityId === cityId) && e.status === "Active");
      const cityPayroll  = payrollRuns.filter(r => r.cityId === cityId);

      const totalRevenue  = revenues.reduce((s, r) => s + r.amount, 0);
      const totalExpenses = payables.reduce((s, p) => s + p.amount, 0);
      const labourCost    = payables.filter(p => p.type === "Salary").reduce((s, p) => s + p.amount, 0);
      const materialCost  = payables.filter(p => p.type === "Vendor").reduce((s, p) => s + p.amount, 0);
      const netRevenue    = totalRevenue;
      const netIncome     = netRevenue - totalExpenses;

      return {
        city: cityName,
        totalRevenue, totalRefunds: 0, netRevenue,
        totalExpenses, labourCost, materialCost,
        overheadCost: totalExpenses - labourCost - materialCost,
        netIncome,
        profitMargin: netRevenue > 0 ? Math.round((netIncome / netRevenue) * 1000) / 10 : 0,
        unitsCompleted:      cityJobs.length,
        activeCustomers:     cityCustomers.length,
        employeeCount:       cityEmployees.length,
        refundRate:          0,
        revenuePerUnit:      cityJobs.length > 0 ? Math.round(totalRevenue / cityJobs.length) : 0,
        revenuePerCustomer:  cityCustomers.length > 0 ? Math.round(totalRevenue / cityCustomers.length) : 0,
        revenuePerEmployee:  cityEmployees.length > 0 ? Math.round(totalRevenue / cityEmployees.length) : 0,
        costPerUnit:         cityJobs.length > 0 ? Math.round(totalExpenses / cityJobs.length) : 0,
        labourCostPerUnit:   cityJobs.length > 0 ? Math.round(labourCost / cityJobs.length) : 0,
      };
    });
  }, [availableCities, revenues, payables, allJobs, customers, employees]);
Delete the old hardcoded CITY_DATA array entirely.

CHANGE 3 — src/app/components/analytics/LabourCostPerWash.tsx — Replace mock cities with live payroll data (Gap 3 + Gap 6)
Add imports:
tsimport { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";
Inside the component, replace CITY_LABOUR_DATA with a live useMemo:
ts  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();
  const { allJobs } = useJobs();
  const { availableCities } = useCity();

  const CITY_LABOUR_DATA: LabourCostData[] = useMemo(() => {
    return availableCities.map(cityDef => {
      const cityId = cityDef.id;
      const cityName = cityDef.displayName.toUpperCase();

      const cityPayroll = payrollRuns.filter(r => r.cityId === cityId && r.status === "Paid");
      const cityEmps    = employees.filter(e => (e.workLocation === cityId || e.cityId === cityId) && e.status === "Active");
      const cityJobs    = allJobs.filter(j => j.cityId === cityId && (j.status === "Completed" || j.status === "Verified"));

      const washerPay     = cityPayroll.filter(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return emp?.designation === "Car Washer";
      }).reduce((s, r) => s + (r.grossSalary || 0), 0);

      const supervisorPay = cityPayroll.filter(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return emp?.designation === "Supervisor";
      }).reduce((s, r) => s + (r.grossSalary || 0), 0);

      const managerPay    = cityPayroll.filter(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        return emp?.designation?.includes("Manager") || emp?.designation?.includes("Admin");
      }).reduce((s, r) => s + (r.grossSalary || 0), 0);

      const incentivePay  = cityPayroll.reduce((s, r) => s + (r.incentiveAmount || 0), 0);
      const totalLabour   = washerPay + supervisorPay + managerPay + incentivePay;
      const units         = cityJobs.length;

      const cityWashers = cityEmps.filter(e => e.designation === "Car Washer");
      const washerJobCounts = cityWashers.map(w =>
        cityJobs.filter(j => j.washerId === w.id).length
      );
      const avgWashesPerWasher = cityWashers.length > 0
        ? Math.round(washerJobCounts.reduce((s, n) => s + n, 0) / cityWashers.length)
        : 0;

      return {
        city: cityName,
        totalLabourCost:   totalLabour,
        unitsCompleted:    units,
        labourCostPerWash: units > 0 ? Math.round(totalLabour / units) : 0,
        washerCost:        washerPay,
        supervisorCost:    supervisorPay,
        managerCost:       managerPay,
        incentiveCost:     incentivePay,
        avgWashesPerWasher,
        labourEfficiencyScore: avgWashesPerWasher > 0
          ? Math.min(Math.round((avgWashesPerWasher / 180) * 100), 100)
          : 0,
      };
    });
  }, [availableCities, payrollRuns, employees, allJobs]);
Delete the hardcoded CITY_LABOUR_DATA array entirely.
Do not change any other file in Phase 1.