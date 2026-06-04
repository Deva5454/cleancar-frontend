Fix every wrong city reference across the entire codebase. The only correct cities in this application are: Surat (CITY-SURAT), Mumbai (CITY-MUMBAI), and Ahmedabad (CITY-AHMEDABAD). No other city should appear anywhere in data, dropdowns, type definitions, mock arrays, or service configs. Make every change listed below. Do not change any other logic.

THE CANONICAL CITY LIST (apply everywhere)
ts// The only valid cities in this application
const VALID_CITIES = [
  { id: "CITY-SURAT",     name: "surat",     displayName: "Surat",     stateCode: "24", state: "Gujarat",     shortCode: "SUR" },
  { id: "CITY-MUMBAI",    name: "mumbai",    displayName: "Mumbai",    stateCode: "27", state: "Maharashtra", shortCode: "MUM" },
  { id: "CITY-AHMEDABAD", name: "ahmedabad", displayName: "Ahmedabad", stateCode: "24", state: "Gujarat",     shortCode: "AHD" },
];

CHANGE 1 — src/app/components/analytics/LabourCostPerWash.tsx
Find:
tstype City = "ALL" | "SURAT" | "AHMEDABAD" | "BARODA";
Replace with:
tstype City = "ALL" | "SURAT" | "MUMBAI" | "AHMEDABAD";
Find the CITY_LABOUR_DATA array. Remove the BARODA entry entirely. Add MUMBAI. The array must have exactly 3 entries:
tsconst CITY_LABOUR_DATA: LabourCostData[] = [
  { city: "SURAT",     totalLabourCost: 285000, unitsCompleted: 1850, labourCostPerWash: 154, washerCost: 180000, supervisorCost: 65000, managerCost: 25000, incentiveCost: 15000, avgWashesPerWasher: 185, labourEfficiencyScore: 92 },
  { city: "MUMBAI",    totalLabourCost: 365000, unitsCompleted: 2100, labourCostPerWash: 174, washerCost: 230000, supervisorCost: 82000, managerCost: 32000, incentiveCost: 21000, avgWashesPerWasher: 175, labourEfficiencyScore: 88 },
  { city: "AHMEDABAD", totalLabourCost: 248000, unitsCompleted: 1620, labourCostPerWash: 153, washerCost: 156000, supervisorCost: 58000, managerCost: 22000, incentiveCost: 12000, avgWashesPerWasher: 182, labourEfficiencyScore: 91 },
];
In the city filter Select, replace the options:
tsx<SelectItem value="ALL">All Cities</SelectItem>
<SelectItem value="SURAT">Surat</SelectItem>
<SelectItem value="MUMBAI">Mumbai</SelectItem>
<SelectItem value="AHMEDABAD">Ahmedabad</SelectItem>

CHANGE 2 — src/app/components/analytics/EmployeeEfficiency.tsx
Find:
tstype City = "ALL" | "SURAT" | "AHMEDABAD" | "BARODA";
Replace with:
tstype City = "ALL" | "SURAT" | "MUMBAI" | "AHMEDABAD";
In every city filter dropdown or select in this file, replace "BARODA" with "MUMBAI" and the label "Baroda" with "Mumbai".

CHANGE 3 — src/app/components/analytics/CityComparison.tsx
The hardcoded CITY_DATA array has "MUMBAI" and "AHMEDABAD" entries but the city type label uses wrong values in some places. Verify all 3 entries use exactly:
ts{ city: "SURAT", ... }
{ city: "MUMBAI", ... }
{ city: "AHMEDABAD", ... }
Remove any other city entries. Ensure the city filter options are only these three.

CHANGE 4 — src/app/components/analytics/CACDashboard.tsx
Find the cacByCity array:
tsconst cacByCity = [
  { id: "city-1", city: "Bangalore", ... },
  { id: "city-2", city: "Mumbai", ... },
  { id: "city-3", city: "Delhi", ... },
  { id: "city-4", city: "Pune", ... },
];
Replace with:
tsconst cacByCity = [
  { id: "city-1", city: "Surat",     spend: 185000, customers: 242, cac: 764 },
  { id: "city-2", city: "Mumbai",    spend: 220000, customers: 280, cac: 786 },
  { id: "city-3", city: "Ahmedabad", spend: 155000, customers: 198, cac: 783 },
];

CHANGE 5 — src/app/components/analytics/BreakEvenAnalysis.tsx
Find the STORE_CITY_MAP:
tsconst STORE_CITY_MAP: Record<string, string> = {
  "Koramangala": "bangalore",
  "Indiranagar": "bangalore",
  "Jahangirpura": "ahmedabad",
  "Althan": "surat",
  "Piplod": "surat",
};
Replace with:
tsconst STORE_CITY_MAP: Record<string, string> = {
  "Adajan":      "surat",
  "Vesu":        "surat",
  "Althan":      "surat",
  "Piplod":      "surat",
  "Bandra":      "mumbai",
  "Andheri":     "mumbai",
  "Thane":       "mumbai",
  "Dadar":       "mumbai",
  "Navrangpura": "ahmedabad",
  "Satellite":   "ahmedabad",
  "Vastrapur":   "ahmedabad",
  "Jahangirpura":"ahmedabad",
};
In the MASTER_STORE_BREAKEVEN import usage — also update masterData.ts. Find the stores with "Koramangala" and "Indiranagar" entries:
ts{ store: "Koramangala", ... }
{ store: "Indiranagar", ... }
Replace them with:
ts{ store: "Adajan",   investment: 1200000, monthlyRevenue: 285000, monthlyExpenses: 185000, monthlyProfit: 100000, breakEvenMonths: 12, breakEvenDate: "May 2027",   progressToBreakEven: 45 },
{ store: "Bandra",   investment: 1800000, monthlyRevenue: 320000, monthlyExpenses: 210000, monthlyProfit: 110000, breakEvenMonths: 17, breakEvenDate: "Oct 2027",   progressToBreakEven: 32 },
{ store: "Navrangpura", investment: 1100000, monthlyRevenue: 265000, monthlyExpenses: 175000, monthlyProfit: 90000, breakEvenMonths: 13, breakEvenDate: "Jun 2027",  progressToBreakEven: 40 },

CHANGE 6 — src/app/components/finance/reports/MultiCityComparisonReport.tsx
Find:
tsconst cities = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD", "CITY-DELHI", "CITY-BANGALORE"];
Replace with:
tsconst cities = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"];
Find the display name map and short code map. Remove Delhi and Bangalore entries, add Ahmedabad:
tsconst CITY_DISPLAY: Record<string, string> = {
  "CITY-SURAT":     "Surat",
  "CITY-MUMBAI":    "Mumbai",
  "CITY-AHMEDABAD": "Ahmedabad",
};
const CITY_SHORT: Record<string, string> = {
  "CITY-SURAT":     "SUR",
  "CITY-MUMBAI":    "MUM",
  "CITY-AHMEDABAD": "AHD",
};
Find all Radar chart components referencing BLR and DEL:
tsx<Radar name="Bangalore" dataKey="BLR" ... />
<Radar name="Delhi" dataKey="DEL" ... />
Replace with:
tsx<Radar name="Ahmedabad" dataKey="AHD" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
Find any hardcoded city metric objects { cityName: "Bangalore", ... } and { cityName: "Delhi", ... }. Replace them with Ahmedabad data:
ts{ cityName: "Ahmedabad", shortCode: "AHD", cityId: "CITY-AHMEDABAD", ... }
Find the insight text referencing Bangalore:
Bangalore achieves 17.4% margin...
Replace with:
Surat achieves the highest margin, significantly above company average.

CHANGE 7 — src/app/components/finance/reports/ReportByCity.tsx
Find the mock city data array. Replace all entries with only Surat, Mumbai, and Ahmedabad. Replace Bangalore pincodes (560xxx) with:

Surat pincodes: 395001–395010
Mumbai pincodes: 400001–400010
Ahmedabad pincodes: 380001–380010

Remove Delhi, Pune, Hyderabad entries entirely. The city filter dropdown:
tsx<SelectItem value="Surat">Surat</SelectItem>
<SelectItem value="Mumbai">Mumbai</SelectItem>
<SelectItem value="Ahmedabad">Ahmedabad</SelectItem>

CHANGE 8 — src/app/components/finance/reports/ReportByPINCode.tsx
Find the mock pincode data with Bangalore 560xxx pincodes. Replace all with real pincodes:
ts// Surat zones
{ pinCode: "395001", areaName: "Adajan",    city: "Surat",     washes: 892,  avgCost: 91.2, revenue: 485600 },
{ pinCode: "395005", areaName: "Althan",    city: "Surat",     washes: 756,  avgCost: 89.5, revenue: 412800 },
{ pinCode: "395007", areaName: "Vesu",      city: "Surat",     washes: 1024, avgCost: 92.1, revenue: 558200 },
// Mumbai zones
{ pinCode: "400001", areaName: "Bandra",    city: "Mumbai",    washes: 1156, avgCost: 98.4, revenue: 695400 },
{ pinCode: "400002", areaName: "Andheri",   city: "Mumbai",    washes: 988,  avgCost: 96.2, revenue: 568800 },
// Ahmedabad zones
{ pinCode: "380001", areaName: "Navrangpura",city: "Ahmedabad",washes: 820,  avgCost: 88.6, revenue: 445200 },
{ pinCode: "380015", areaName: "Satellite", city: "Ahmedabad", washes: 745,  avgCost: 87.9, revenue: 402600 },
Find const cities = ["All", "Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad"]. Replace with:
tsconst cities = ["All", "Surat", "Mumbai", "Ahmedabad"];

CHANGE 9 — src/app/components/finance/FinanceAnalyticsDashboard.tsx
Find:
tsconst availableCities = [cityInfo?.displayName || "Surat", "Bangalore", "Mumbai", "Delhi", "Pune"];
Replace with:
tsconst availableCities = ["Surat", "Mumbai", "Ahmedabad"];
Find the hardcoded city comparison data:
ts{ city: "Bangalore", revenue: 125000, expenses: 85000, profit: 40000 },
Replace with:
ts{ city: "Surat",     revenue: 285000, expenses: 185000, profit: 100000 },
{ city: "Mumbai",    revenue: 320000, expenses: 210000, profit: 110000 },
{ city: "Ahmedabad", revenue: 255000, expenses: 168000, profit: 87000  },

CHANGE 10 — src/app/components/finance/FinancialReportsModule.tsx
Find the city SelectItems:
tsx<SelectItem value="BLR">Bangalore</SelectItem>
<SelectItem value="DEL">Delhi</SelectItem>
Replace with:
tsx<SelectItem value="AHD">Ahmedabad</SelectItem>
Ensure the full list is:
tsx<SelectItem value="SUR">Surat</SelectItem>
<SelectItem value="MUM">Mumbai</SelectItem>
<SelectItem value="AHD">Ahmedabad</SelectItem>

CHANGE 11 — src/app/components/finance/InvoiceManagement.tsx
Find mock invoice data with city: "Bangalore". Replace all with city: "Surat" or city: "Mumbai" alternating.
Find the city filter SelectItem value="Bangalore". Replace with:
tsx<SelectItem value="Surat">Surat</SelectItem>
<SelectItem value="Mumbai">Mumbai</SelectItem>
<SelectItem value="Ahmedabad">Ahmedabad</SelectItem>

CHANGE 12 — src/app/components/finance/PaymentManagement.tsx
Same as Change 11. Find city: "Bangalore" in mock data → replace with city: "Surat". Find <SelectItem value="Bangalore"> → replace with Surat/Mumbai/Ahmedabad.

CHANGE 13 — src/app/components/finance/AddConsumableInputDialog.tsx
Find:
ts{ id: "washer-003", name: "Dinesh Sharma", city: "Pune" },
{ id: "washer-004", name: "Vijay Singh",   city: "Pune" },
Replace with:
ts{ id: "washer-003", name: "Dinesh Sharma", city: "Mumbai" },
{ id: "washer-004", name: "Vijay Singh",   city: "Ahmedabad" },

CHANGE 14 — src/app/components/finance/CostPerWashCompany.tsx and CostPerWashCustomer.tsx
In both files, find:
tsconst cities = ["All Cities", "Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad"];
Replace with:
tsconst cities = ["All Cities", "Surat", "Mumbai", "Ahmedabad"];
Find zone lists referencing Koramangala/Indiranagar (560xxx pincodes). Replace with Surat zones:
tsconst zones = ["All Zones", "Adajan (395001)", "Althan (395005)", "Vesu (395007)", "Bandra (400001)", "Navrangpura (380001)"];

CHANGE 15 — src/app/components/finance/charts/ZoneCostChart.tsx
Find:
ts{ zone: "560038 (Indiranagar)", cost: 92.8, standard: 89.5 },
{ zone: "560034 (Koramangala)", cost: 91.2, standard: 89.5 },
Replace with:
ts{ zone: "395001 (Adajan)",    cost: 91.2, standard: 89.5 },
{ zone: "395005 (Althan)",    cost: 88.4, standard: 89.5 },
{ zone: "395007 (Vesu)",      cost: 92.8, standard: 89.5 },
{ zone: "400001 (Bandra)",    cost: 97.6, standard: 89.5 },
{ zone: "380001 (Navrangpura)",cost: 87.9, standard: 89.5 },

CHANGE 16 — src/app/components/modules/FinanceModule.tsx
Find:
ts? getMultiCityDashboard(["CITY-SURAT", "CITY-MUMBAI", "CITY-BANGALORE"])
Replace with:
ts? getMultiCityDashboard(["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"])

CHANGE 17 — src/app/components/modules/CRMLeadManagementWithFilters.tsx
Find the cityIdMap:
tsconst cityIdMap: Record<string, string> = {
  "surat":     "CITY-SURAT",
  "bangalore": "CITY-BANGALORE",
  "mumbai":    "CITY-MUMBAI",
  "delhi":     "CITY-DELHI"
};
Replace with:
tsconst cityIdMap: Record<string, string> = {
  "surat":     "CITY-SURAT",
  "mumbai":    "CITY-MUMBAI",
  "ahmedabad": "CITY-AHMEDABAD",
};

CHANGE 18 — src/app/components/gst/GSTMonitoringModule.tsx
Find any hardcoded GSTIN data entries for Bangalore, Delhi, or Pune. Replace all city references to only include Surat (24GAOPS5676E1Z3) and Mumbai (27GAOPS5676E1Z5) and Ahmedabad (24GAOPS5676E2Z1). Remove non-existent city entries.

CHANGE 19 — src/app/lib/mockData.ts
Find all occurrences of city: "BARODA". Replace each with city: "AHMEDABAD". There are 5 occurrences — replace all. Also update any cityId: "CITY-BARODA" to cityId: "CITY-AHMEDABAD".

CHANGE 20 — src/app/data/masterData.ts
Find the Koramangala and Indiranagar store entries in MASTER_STORE_BREAKEVEN. Replace entirely with Surat/Mumbai/Ahmedabad stores as specified in Change 5 above.

CHANGE 21 — src/app/data/overheadDynamicData.ts
Find:
tsitemName: "Zone Marketing — Pune",
description: "Zone-specific marketing and promotion costs for Pune",
specificZone: "Pune",
Replace with:
tsitemName: "Zone Marketing — Ahmedabad",
description: "Zone-specific marketing and promotion costs for Ahmedabad",
specificZone: "Ahmedabad",

CHANGE 22 — src/app/services/migration/payrollMigrationService.ts
Find:
ts"CITY-BANGALORE": "KA",
"CITY-DELHI":     "DL",
"CITY-PUNE":      "MH",
Replace with:
ts"CITY-AHMEDABAD": "GJ",
The only valid city-to-state mappings are: CITY-SURAT → "GJ", CITY-MUMBAI → "MH", CITY-AHMEDABAD → "GJ".

CHANGE 23 — src/app/services/payroll/complianceRules.ts
Find the city-to-state map containing pune, bangalore, delhi, hyderabad. Remove those entries. Ensure only these are present:
tssurat:     "GJ",
mumbai:    "MH",
ahmedabad: "GJ",

CHANGE 24 — src/app/components/BusinessFlowDemo.tsx
Find:
tsarea: "Koramangala",
city: "Bangalore",
Replace with:
tsarea: "Adajan",
city: "Surat",

CHANGE 25 — src/app/components/hr/StatutoryFormsOnboarding.tsx and StatutoryFormsVerification.tsx
Find all occurrences of "Bangalore" and "ESIC Hospital Indiranagar" in these two files. Replace with "Surat" and "ESIC Hospital Adajan" respectively. Replace "Karnataka - 560001" type addresses with Gujarat addresses like "Surat, Gujarat - 395001".

CHANGE 26 — src/app/components/crm/LeadHistory.tsx and LeadPipelineKanbanWithFilters.tsx
Find any hardcoded city values ("Bangalore", "Delhi", "Pune") in mock lead/history data. Replace with "Surat", "Mumbai", or "Ahmedabad".

CHANGE 27 — src/app/components/settings/AddOverheadItemDialog.tsx and SalaryHistoryManagement.tsx
Find any city dropdown or reference with non-canonical cities. Replace with only Surat/Mumbai/Ahmedabad options.

CHANGE 28 — src/app/components/washer/WasherCoreScreensDemo.tsx
Find any city: "Bangalore" references. Replace with city: "Surat".

VERIFICATION CHECK
After all changes, the following must be true throughout the entire codebase:
Allowed city values:

Display names: "Surat", "Mumbai", "Ahmedabad" only
City IDs: "CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD" only
Short codes: "SUR", "MUM", "AHD" only
State codes: "24" (Surat/Ahmedabad → Gujarat), "27" (Mumbai → Maharashtra)
Pincodes: 395xxx (Surat), 400xxx (Mumbai), 380xxx (Ahmedabad)

Must never appear anywhere:

Bangalore, bangalore, BANGALORE, BLR, CITY-BANGALORE, 560xxx pincodes, KA state (Karnataka)
Delhi, delhi, DELHI, DEL, CITY-DELHI, DL state
Pune, pune, PUNE, CITY-PUNE
Baroda, baroda, BARODA, CITY-BARODA
Hyderabad, hyderabad, CITY-HYDERABAD, TG state
Koramangala, Indiranagar (Bangalore locality names)

Do not change:

GST_STATES in accountingEntryService.ts — this is the complete India state list and must remain intact
statutoryRules.ts Delhi/DL entries — these are statutory compliance rules for all Indian states and must remain complete
Any state-code lookup tables that cover all Indian states for GST purposes