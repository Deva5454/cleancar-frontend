Critical/High: MaterialRequisition, WasherIssuances, WasherStockLedger Real Data

This is Phase 2 of 3. All Phase 1 changes must be applied first.

CHANGE 1 — src/app/components/inventory/MaterialRequisition.tsx — Connect to InventoryContext
Add imports:
tsimport { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";
Inside the component:
ts  const { stockTransactions, getPendingTransactions, procureInventory,
          getCentralStock, inventory } = useInventory();
  const { city, cityInfo } = useCity();
  const { employees } = useEmployee();

  // Derive MRFs from pending stock transactions
  const liveMRFs = getPendingTransactions(city).map(t => {
    const item = inventory.find(i => i.itemId === t.itemId && i.cityId === city);
    return {
      id: t.transactionId,
      itemName: item?.itemName || t.itemId,
      quantity: t.quantity,
      requestedBy: t.requestedBy || "Unknown",
      status: t.status,
      createdAt: t.createdAt,
      type: t.type,
    };
  });

  // Use live MRFs — fall back to mock only if empty (for demo)
  const displayMRFs = liveMRFs.length > 0 ? liveMRFs : mockMRFs;
Replace {mockMRFs.map(...)} with {displayMRFs.map(...)}.
For the "Create Purchase Request" / "Add Stock" form submission — replace toast.success("MRF Created") with:
ts    procureInventory(selectedItemId, quantity, supplierId, city);
    toast.success(`Procurement created. Stock will be added to ${cityInfo.displayName} central warehouse.`);

CHANGE 2 — src/app/components/inventory/WasherIssuances.tsx — Connect to InventoryContext
Add imports:
tsimport { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";
Replace the hardcoded washersData with real data:
ts  const { getCentralStock, getSupervisorStock, getWasherStock,
          issueInventory, stockTransactions, inventory } = useInventory();
  const { city } = useCity();
  const { employees } = useEmployee();

  // Get washers from EmployeeContext for this city
  const washers = employees.filter(e =>
    e.designation === "Car Washer" && e.status === "Active" &&
    (e.workLocation === city || e.cityId === city)
  ).map(e => ({
    id: e.id,
    name: e.fullName,
    pinCode: e.pinCodes?.[0] || "",
    zone: e.pinCodes?.[0] || "Unknown",
    stockInHand: getWasherStock(e.id, city)
      .reduce((s, i) => s + (i.washerStock[e.id] || 0), 0),
    lastIssuance: stockTransactions
      .filter(t => t.toId === e.id && t.type === "Issue")
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt || "Never",
  }));

  // Use live data — fallback to mock if no employees loaded yet
  const displayWashers = washers.length > 0 ? washers : washersData;
For the "Issue Stock" action — replace toast.success("Issued successfully") with:
ts    issueInventory(selectedItemId, quantity, "Washer", selectedWasherId, currentUser?.name || "Store Manager", city);
    toast.success(`Issued ${quantity} ${unit} of ${itemName} to ${washerName}`);

CHANGE 3 — src/app/components/inventory/WasherStockLedger.tsx — Connect to InventoryContext
Add imports:
tsimport { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
Replace the hardcoded ledgerTransactions with real stock transactions for the selected washer:
ts  const { stockTransactions, getWasherStock, inventory } = useInventory();
  const { city } = useCity();
  const [washerId] = useSearchParams();
  const selectedWasherId = washerId.get("washerId") || "";

  // Build ledger from real stock transactions
  const washerTxns = stockTransactions
    .filter(t => (t.toId === selectedWasherId || t.fromId === selectedWasherId) && t.status === "Completed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let runningBalance = 0;
  const liveLedger = washerTxns.map((t, i) => {
    const item = inventory.find(x => x.itemId === t.itemId && x.cityId === city);
    const isIn = t.toId === selectedWasherId;
    runningBalance += isIn ? t.quantity : -t.quantity;
    return {
      id: i + 1,
      date: t.createdAt.split("T")[0],
      type: t.type,
      quantityIn:  isIn ? t.quantity : 0,
      quantityOut: isIn ? 0 : t.quantity,
      runningBalance,
      reference: t.transactionId,
      itemName: item?.itemName || t.itemId,
    };
  });

  const displayLedger = liveLedger.length > 0 ? liveLedger : ledgerTransactions;
Replace {ledgerTransactions.map(...)} with {displayLedger.map(...)}.

CHANGE 4 — src/app/components/inventory/MonthEndVerification.tsx — Call adjustStock on submit
Add imports:
tsimport { useInventory } from "../../contexts/InventoryContext";
Inside the component:
ts  const { adjustStock, getWasherStock, inventory } = useInventory();
Load real worksheet data from InventoryContext when a washer is selected:
ts  // Derive worksheet from real washer stock
  const loadWorksheet = (washerId: string) => {
    const washerItems = getWasherStock(washerId, city);
    if (washerItems.length > 0) {
      setWorksheetData(washerItems.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        unit: item.unit,
        systemBalance: item.washerStock[washerId] || 0,
        physicalCount: item.washerStock[washerId] || 0, // editable
        variance: 0,
      })));
    }
    // else keep mock worksheet for demo
  };
In handleSubmitVerification, after toast.success(...), add:
ts    // Persist physical count as new stock level
    worksheetData.forEach(row => {
      if (row.itemId) {
        adjustStock(
          row.itemId, "Washer", selectedWasherId,
          row.physicalCount,
          `Month-end verification — ${selectedMonth}`,
          city
        );
      }
    });
Do not change any other file in Phase 2.