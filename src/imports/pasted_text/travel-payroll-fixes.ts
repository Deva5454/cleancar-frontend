Critical + High: Travel stale state, city isolation, payroll bridge, voucher fixes

This is Phase 1 of 3. Fix Gaps 1–8.

CHANGE 1 — src/app/components/travel/TravelEmployeeView.tsx — Fix stale existingDraft (Gap 1)
Find:
tsconst existingDraft = travelReimbursementService
  .getTripsByEmployee(currentUser?.employeeId || "")
  .find(t => t.status === "Draft");
const [stage, setStage] = useState<Stage>(existingDraft ? "end" : "start");
const [activeTrip, setActiveTrip] = useState<TravelTrip | undefined>(existingDraft);
const [refresh, setRefresh] = useState(0);
Replace with:
tsconst [refresh, setRefresh] = useState(0);

// Re-read draft on every refresh tick — never stale
const existingDraft = useMemo(() =>
  travelReimbursementService
    .getTripsByEmployee(currentUser?.employeeId || "")
    .find(t => t.status === "Draft"),
  [refresh, currentUser?.employeeId]
);

const [stage, setStage]       = useState<Stage>(() => existingDraft ? "end" : "start");
const [activeTrip, setActiveTrip] = useState<TravelTrip | undefined>(() => existingDraft);

// Sync stage and activeTrip whenever existingDraft changes
useEffect(() => {
  if (existingDraft && !activeTrip) {
    setActiveTrip(existingDraft);
    setStage("end");
  }
}, [existingDraft]);
Add useMemo and useEffect to imports if not already present.
Also fix myTrips to re-read on refresh:
tsconst myTrips = useMemo(() =>
  travelReimbursementService.getTripsByEmployee(currentUser?.employeeId || ""),
  [refresh, currentUser?.employeeId]
);

CHANGE 2 — src/app/components/travel/TravelManagerView.tsx — Fix stale pending list (Gap 2)
Find:
tsconst pending = travelReimbursementService.getPendingManagerApproval(
  currentUser?.employeeId || ""
);
Replace with:
tsconst pending = useMemo(() =>
  travelReimbursementService.getPendingManagerApproval(currentUser?.employeeId || ""),
  [refresh, currentUser?.employeeId]
);
Add useMemo to imports.

CHANGE 3 — src/app/services/travelReimbursementService.ts — Add cityId filter to getPendingHRApproval (Gap 3)
Find:
tsgetPendingHRApproval(): TravelTrip[] {
  return this.getTrips().filter(t => t.status === "Pending HR");
}
Replace with:
tsgetPendingHRApproval(cityId?: string): TravelTrip[] {
  return this.getTrips().filter(t =>
    t.status === "Pending HR" && (!cityId || t.cityId === cityId)
  );
}

CHANGE 4 — src/app/components/travel/TravelHRView.tsx — Pass city to getPendingHRApproval + bridge to payroll (Gaps 3 & 4)
4A — Fix city filter. Find:
tsconst pending = travelReimbursementService.getPendingHRApproval();
Replace with:
tsconst pending = useMemo(() =>
  travelReimbursementService.getPendingHRApproval(city),
  [refresh, city]
);
4B — Bridge HR approval to Finance payable. Add imports:
tsimport { useFinance } from "../../contexts/FinanceContext";
Inside the component:
tsconst { createPayable } = useFinance();
Find handleApprove:
tsconst handleApprove = () => {
  if (!selected) return;
  travelReimbursementService.hrApprove(selected.id, currentUser?.name || "HR", comments);
  toast.success(...);
  ...
};
Replace with:
tsconst handleApprove = () => {
  if (!selected) return;
  travelReimbursementService.hrApprove(selected.id, currentUser?.name || "HR", comments);

  // Bridge: create Finance payable so salary processing picks it up
  createPayable({
    type: "Salary",
    employeeId:  selected.employeeId,
    description: `Travel Reimbursement — ${selected.tripDate} — ${selected.purposeOfVisit}`,
    amount:      selected.netPayableAmount || 0,
    dueDate:     new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                   .toISOString().split("T")[0], // 1st of next month
    status:      "Pending",
    cityId:      selected.cityId,
    travelTripId: selected.id,
    taxAmount:   0,
    tdsAmount:   0,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  });

  // Mark trip as Added to Payroll
  travelReimbursementService.markAddedToPayroll(
    selected.id,
    new Date().toISOString().slice(0, 7),
    `PAYROLL-TRAVEL-${selected.id}`
  );

  toast.success(`Approved and added to payroll. ₹${selected.netPayableAmount?.toLocaleString()} will appear in ${selected.employeeName}'s next salary. No TDS/Tax deducted.`);
  setSelected(null); setComments(""); setRefresh(r => r + 1);
};

CHANGE 5 — src/app/components/accounts/ExpenseVoucher.tsx — Fix all 4 voucher gaps (Gaps 5, 6, 7, 8)
5A — Fix voucher number to use sequential generator (Gap 5). Find:
tsconst voucherNumber = `EXP/${city.toUpperCase()}/25-26/${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
Replace with:
tsconst existingEntries = accountingEntryService.getAllEntries(cityId);
const fy = new Date().getMonth() >= 3
  ? `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`
  : `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`;
const prefix = `EXP/${city.toUpperCase()}/${fy}`;
const maxSeq = existingEntries
  .filter(e => e.voucherNumber?.startsWith(prefix))
  .map(e => parseInt(e.voucherNumber.split("/").pop() || "0", 10))
  .reduce((max, n) => Math.max(max, n), 0);
const voucherNumber = `${prefix}/${String(maxSeq + 1).padStart(4, "0")}`;
5B — Replace alert() with toast.error() (Gap 6). Find:
tsalert("Please fill all required fields");
Replace with:
tstoast.error("Please fill all required fields"); return;
Find:
tsalert("Invalid vendor or expense ledger");
Replace with:
tstoast.error("Invalid vendor or expense ledger"); return;
5C — Add partial payment validation (Gap 7). After the null check for vendor/expenseLedger, add:
tsif (formData.paymentMode === "Credit (Partial)") {
  if (formData.amountPaidNow <= 0) {
    toast.error("Amount paid now must be greater than 0 for partial payment"); return;
  }
  if (formData.amountPaidNow >= formData.grandTotal) {
    toast.error("Amount paid now must be less than grand total for partial payment. Use 'Bank' mode for full payment."); return;
  }
  if (!formData.creditorLedgerId) {
    toast.error("Creditor ledger is required for partial payment"); return;
  }
  if (!formData.dueDate) {
    toast.error("Due date is required for partial payment"); return;
  }
}
if (formData.paymentMode === "Credit (Full)") {
  if (!formData.creditorLedgerId) {
    toast.error("Creditor ledger is required for credit purchase"); return;
  }
  if (!formData.dueDate) {
    toast.error("Due date is required for credit purchase"); return;
  }
}
5D — Replace non-null assertions with null guards (Gap 8). Find the four ! assertions:
ts{ accountHead: inputCGSTLedger!.id, ...
{ accountHead: inputSGSTLedger!.id, ...
{ accountHead: inputIGSTLedger!.id, ...
{ accountHead: axisBankLedger!.id, ...
Before the journal entry block, add:
tsif ((formData.paymentMode === "Cash" || formData.paymentMode === "Bank" || formData.paymentMode === "Credit (Partial)") && !axisBankLedger) {
  toast.error("Axis Bank ledger not found. Please ensure system ledgers are initialized in Ledger Master.");
  return;
}
if (formData.cgst > 0 && !inputCGSTLedger) {
  toast.error("Input CGST ledger not found. Please initialize system ledgers.");
  return;
}
if (formData.sgst > 0 && !inputSGSTLedger) {
  toast.error("Input SGST ledger not found. Please initialize system ledgers.");
  return;
}
if (formData.igst > 0 && !inputIGSTLedger) {
  toast.error("Input IGST ledger not found. Please initialize system ledgers.");
  return;
}
Then change all ! assertions to regular access (they are now guaranteed non-null after the guards).
Do not change any other file in Phase 1.