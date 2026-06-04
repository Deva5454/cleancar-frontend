Critical Data Gaps (cityId, Filing Persistence, GSTR-1 Persistence, Month Format)

This is Phase 1 of 3. Fix only the 4 critical and high-severity gaps that make data incorrect or lost. Do not touch GSTMonitoringModule, reconciliation auto-match, or audit log in this phase.

CHANGE 1 — src/app/services/gstComplianceService.ts
Four targeted changes to this file. Nothing else changes.
1A — Add cityId, city, supplyNature, and changeHistory to GSTTransaction interface.
Find:
ts  filedInReturn?: string;
  month: string;
  year: number;
}
Replace with:
ts  filedInReturn?: string;
  gstr1GeneratedAt?: string;
  month: number;          // Store as integer 1–12. Never locale string.
  year: number;
  cityId: string;
  city: string;
  supplyNature: "Taxable" | "ZeroRated" | "NilRated" | "Exempt" | "NonGST";
  changeHistory: GSTChangeLog[];
}

export interface GSTChangeLog {
  timestamp: string;
  changedBy: string;
  action: string;         // "Submitted" | "Approved" | "Rejected" | "Filed" | "AI Correction Applied" | "Override"
  previousStatus?: string;
  newStatus?: string;
  note?: string;
}
1B — Add cityId to GSTCustomer interface. Find:
ts  createdBy: string;
  createdAt: string;
  status: "Active" | "Inactive";
}
Replace with:
ts  createdBy: string;
  createdAt: string;
  status: "Active" | "Inactive";
  cityId: string;
  city: string;
}
1C — Add city filtering to all query methods. Find:
ts  getTransactions(): GSTTransaction[] { return this.getList<GSTTransaction>(this.TXN_KEY); }
Replace with:
ts  getTransactions(cityId?: string): GSTTransaction[] {
    const all = this.getList<GSTTransaction>(this.TXN_KEY);
    return cityId ? all.filter(t => t.cityId === cityId) : all;
  }
Find:
ts  getTransactionsByMonth(month: string, year: number): GSTTransaction[] {
    return this.getTransactions().filter(t => t.month === month && t.year === year);
  }
  getPendingApproval(): GSTTransaction[] {
    return this.getTransactions().filter(t => t.status === "Validated" || t.status === "Flagged");
  }
Replace with:
ts  getTransactionsByMonth(month: number, year: number, cityId?: string): GSTTransaction[] {
    return this.getTransactions(cityId).filter(t => t.month === month && t.year === year);
  }
  getPendingApproval(cityId?: string): GSTTransaction[] {
    return this.getTransactions(cityId).filter(t => t.status === "Validated" || t.status === "Flagged");
  }
  getCustomers(cityId?: string): GSTCustomer[] {
    const all = this.getList<GSTCustomer>(this.CUSTOMER_KEY);
    return cityId ? all.filter(c => c.cityId === cityId) : all;
  }
Note: getCustomers() already exists — replace the existing one-liner with this city-filtered version.
1D — Add appendChangeLog helper method inside the class:
ts  appendChangeLog(txnId: string, entry: GSTChangeLog): void {
    const all = this.getTransactions();
    const idx = all.findIndex(t => t.id === txnId);
    if (idx < 0) return;
    const updated = { ...all[idx], changeHistory: [...(all[idx].changeHistory || []), entry] };
    all.splice(idx, 1, updated);
    this.saveList(this.TXN_KEY, all);
  }

CHANGE 2 — src/app/components/gst/GSTTransactionEntry.tsx
Three targeted fixes.
2A — Fix month derivation from locale string to integer. Find:
ts      const month = date.toLocaleString('default', { month: 'long' });
Replace with:
ts      const month = date.getMonth() + 1; // integer 1–12, locale-independent
2B — Add cityId, city, supplyNature, and changeHistory to the saved transaction object. Find the handleSubmit transaction build:
ts    const transaction: GSTTransaction = {
      ...formData,
      status: asDraft ? "Draft" : scoringResult?.requiresManagerReview ? "Flagged" : "Validated",
      riskScore: scoringResult?.totalScore || 0,
      riskLevel: scoringResult?.riskLevel || "Clean"
    } as GSTTransaction;
Replace with:
ts    const transaction: GSTTransaction = {
      ...formData,
      status: asDraft ? "Draft" : scoringResult?.requiresManagerReview ? "Flagged" : "Validated",
      riskScore: scoringResult?.totalScore || 0,
      riskLevel: scoringResult?.riskLevel || "Clean",
      validationErrors: scoringResult?.corrections.map(c => c.issueType) || [],
      cityId: city,
      city: cityInfo.displayName,
      supplyNature: formData.gstRate === 0 ? "ZeroRated" : "Taxable",
      changeHistory: [{
        timestamp: new Date().toISOString(),
        changedBy: formData.createdBy || "Accountant",
        action: "Submitted",
        newStatus: asDraft ? "Draft" : "Validated",
      }],
    } as GSTTransaction;
2C — Add useCity import at the top of the file if not already present:
tsimport { useCity } from "../../contexts/CityContext";
Inside the component function, add:
ts  const { city, cityInfo } = useCity();

CHANGE 3 — src/app/components/gst/GSTFilingModule.tsx
Fix the critical gap: filing confirmation must persist status to every transaction.
3A — Add imports at the top of the file:
tsimport { gstComplianceService } from "../../services/gstComplianceService";
import { useCity } from "../../contexts/CityContext";
3B — Add useCity inside the component:
ts  const { city } = useCity();
3C — Replace handleConfirmFiling. Find:
ts  const handleConfirmFiling = () => {
    if (!filingReference || !filingDate) {
      alert("Please enter filing reference and date");
      return;
    }
    setFiled(true);
  };
Replace with:
ts  const handleConfirmFiling = () => {
    if (!filingReference || !filingDate) {
      alert("Please enter filing reference and date");
      return;
    }
    // Persist Filed status + reference to every approved transaction for this period
    const toFile = gstComplianceService
      .getTransactionsByMonth(selectedMonth, selectedYear, city)
      .filter(t => t.status === "Approved");

    toFile.forEach(t => {
      const updated = {
        ...t,
        status: "Filed" as const,
        filedInReturn: filingReference,
        changeHistory: [...(t.changeHistory || []), {
          timestamp: new Date().toISOString(),
          changedBy: "Accounts",
          action: "Filed",
          previousStatus: "Approved",
          newStatus: "Filed",
          note: `Filed on ${filingDate}. Reference: ${filingReference}`,
        }],
      };
      gstComplianceService.saveTransaction(updated);
    });

    setFiled(true);
    alert(`Filing confirmed. ${toFile.length} transactions marked as Filed. Reference: ${filingReference}`);
  };
3D — Add selectedMonth and selectedYear state if not already present in this component (they may need to be added alongside existing state):
ts  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());

CHANGE 4 — src/app/components/gst/GSTR1Module.tsx
Fix GSTR-1 generation: must write gstr1GeneratedAt to transactions and prevent double-generation.
Find:
ts  const handleGenerate = () => {
    if (!validationChecks.allPassed) return;
    setShowGenerated(true);
    setStatus("Generated");
  };
Replace with:
ts  const { city } = useCity();

  const handleGenerate = () => {
    if (!validationChecks.allPassed) return;

    // Mark all approved transactions as included in this GSTR-1 generation
    const generatedAt = new Date().toISOString();
    monthTransactions
      .filter(t => t.status === "Approved")
      .forEach(t => {
        gstComplianceService.saveTransaction({
          ...t,
          gstr1GeneratedAt: generatedAt,
          changeHistory: [...(t.changeHistory || []), {
            timestamp: generatedAt,
            changedBy: "Accounts",
            action: "GSTR-1 Generated",
            note: `GSTR-1 generated for ${selectedMonth} ${selectedYear}`,
          }],
        });
      });

    setShowGenerated(true);
    setStatus("Generated");
  };
Add useCity import and gstComplianceService import at the top if not already present.
Also update monthTransactions filter to use integer month:
ts  const monthTransactions = useMemo(() =>
    transactions.filter(t =>
      t.month === selectedMonth &&   // selectedMonth must now be integer
      t.year === selectedYear &&
      ...

CHANGE 5 — All components that call getTransactions(), getTransactionsByMonth(), getPendingApproval(), getCustomers()
In each of the following files, add useCity import and pass city from useCity() to every service call:
GSTOverview.tsx: Change gstComplianceService.getTransactions() → gstComplianceService.getTransactions(city)
GSTValidationCentre.tsx: Change gstComplianceService.getTransactions() → gstComplianceService.getTransactions(city)
GSTManagerReview.tsx: Change gstComplianceService.getTransactions() → gstComplianceService.getTransactions(city). Also add changeHistory append when approving — after gstComplianceService.saveTransaction(updated) calls, add:
tsgstComplianceService.appendChangeLog(txn.id, {
  timestamp: new Date().toISOString(),
  changedBy: "Manager",
  action: txn.status === "Approved" ? "Approved" : "Override",
  previousStatus: txn.status,
  newStatus: "Approved",
});
GSTReports.tsx: Change gstComplianceService.getTransactions() → gstComplianceService.getTransactions(city)
GSTR3BModule.tsx: Change getTransactions() → getTransactions(city), getReconciliation() already has no filter — add month+city filter to reconciliation reads.
GSTCustomerMaster.tsx: Change gstComplianceService.getCustomers() → gstComplianceService.getCustomers(city). Add cityId: city, city: cityInfo.displayName to new customer save.
Do not change any other file in Phase 1.