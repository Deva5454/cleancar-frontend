Store, GST, Procurement, Inventory (Findings 5, 6, 9, 10, 12, 13)

This is Phase 2 of 3. All Phase 1 changes must be applied first.

CHANGE 1 — src/app/components/store-manager/GRNEntry.tsx — Vendor + PO selects (Finding 5)
Add imports and state:
tsimport { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";

const { city } = useCity();
const [selectedVendor, setSelectedVendor] = useState("");
const [selectedPO, setSelectedPO] = useState("");

// Derive vendors from SupplierMaster (or stockTransactions for now)
const vendors = [
  { id: "V001", name: "Shreeji Chemicals" },
  { id: "V002", name: "Rajkot Equipment Traders" },
  { id: "V003", name: "Mumbai Wash Supplies" },
]; // → Replace with supplierMasterService.getSuppliers(city) when available

const openPOs = [
  { id: "PO-2026-001", vendor: "V001", description: "Chemicals supply — March" },
  { id: "PO-2026-002", vendor: "V001", description: "Equipment parts" },
].filter(po => !selectedVendor || po.vendor === selectedVendor);
Replace:
tsx  <Input id="vendor" name="vendor" placeholder="Vendor name" required />
With:
tsx  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
    <SelectContent>
      {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
    </SelectContent>
  </Select>
Replace:
tsx  <Input id="po-number" name="po-number" placeholder="PO-2026-XXX" required />
With:
tsx  <Select value={selectedPO} onValueChange={setSelectedPO} disabled={!selectedVendor}>
    <SelectTrigger>
      <SelectValue placeholder={selectedVendor ? "Select PO" : "Select vendor first"} />
    </SelectTrigger>
    <SelectContent>
      {openPOs.map(po => <SelectItem key={po.id} value={po.id}>{po.id} — {po.description}</SelectItem>)}
      <SelectItem value="manual">Enter manually (no PO)</SelectItem>
    </SelectContent>
  </Select>

CHANGE 2 — src/app/components/inventory/WasherIssuances.tsx — Real washer select (Finding 6)
Replace the washersData mock array. Add imports:
tsimport { useEmployee } from "../../contexts/EmployeeContext";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";

const { employees } = useEmployee();
const { getWasherStock, inventory, stockTransactions } = useInventory();
const { city } = useCity();

const washers = employees.filter(e =>
  e.designation === "Car Washer" && e.status === "Active" &&
  (e.workLocation === city || e.cityId === city)
).map(e => ({
  id: e.id, name: e.fullName,
  pinCode: e.pinCodes?.[0] || "",
  zone: e.pinCodes?.[0] || "Unknown",
  stockInHand: getWasherStock(e.id, city).reduce((s, i) => s + (i.washerStock[e.id] || 0), 0),
}));

const displayWashers = washers.length > 0 ? washers : washersData; // fallback
Replace {washersData.map(...)} with {displayWashers.map(...)} throughout the component.

CHANGE 3 — src/app/components/gst/GSTTransactionEntry.tsx — City-filter party dropdown (Finding 9)
Find where parties is built. Add useCity and filter:
tsimport { useCity } from "../../contexts/CityContext";
const { city } = useCity();

const parties = useMemo(() => {
  const vendors   = gstComplianceService.getVendors(city);    // pass city filter
  const customers = gstComplianceService.getCustomers(city);  // pass city filter
  return [
    ...vendors.map(v => ({ id: v.id, name: v.name, type: "vendor" as const, gstin: v.gstin, state: v.state, stateCode: v.stateCode })),
    ...customers.map(c => ({ id: c.id, name: c.name, type: "customer" as const, gstin: c.gstin || "", state: c.state || "", stateCode: c.stateCode || "" })),
  ];
}, [city]);
This requires gstComplianceService.getVendors() and getCustomers() to accept cityId — which was added in the GST module audit Phase 1 Change 1C.

CHANGE 4 — src/app/components/procurement/SupplierMaster.tsx — City + State selects (Finding 10)
Add imports:
tsimport { useCity } from "../../contexts/CityContext";
import { GST_STATE_OPTIONS } from "../../services/accountingEntryService";

const { availableCities } = useCity();
Find city and state input fields in the add/edit supplier form. Replace:
tsx  <Input placeholder="City" />
With:
tsx  <Select value={formData.city} onValueChange={val => setFormData(prev => ({ ...prev, city: val }))}>
    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
    <SelectContent>
      {availableCities.map(c => <SelectItem key={c.id} value={c.displayName}>{c.displayName}</SelectItem>)}
      <SelectItem value="Other">Other city</SelectItem>
    </SelectContent>
  </Select>
Find the state input. Replace with:
tsx  <Select value={formData.stateCode} onValueChange={val => {
    const state = GST_STATE_OPTIONS.find(s => s.value === val);
    setFormData(prev => ({ ...prev, stateCode: val, state: state?.name || "" }));
  }}>
    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
    <SelectContent>
      {GST_STATE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
    </SelectContent>
  </Select>

CHANGE 5 — src/app/components/inventory/MaterialRequisition.tsx — Item select from stock (Finding 12)
Add imports and derive item options. In the "Create MRF" form, replace the free-text item name with:
tsx  const { getCentralStock } = useInventory();
  const { city } = useCity();
  const stockItems = getCentralStock(city);

  {/* Item selector */}
  <Select value={selectedItemId} onValueChange={val => {
    setSelectedItemId(val);
    const item = stockItems.find(i => i.itemId === val);
    if (item) {
      setSelectedItemName(item.itemName);
      setSelectedItemUnit(item.unit);
      setCurrentStock(item.centralStock);
      setReorderLevel(item.reorderLevel);
    }
  }}>
    <SelectTrigger><SelectValue placeholder="Select item from inventory" /></SelectTrigger>
    <SelectContent>
      {stockItems.map(item => (
        <SelectItem key={item.itemId} value={item.itemId}>
          {item.itemName} — Stock: {item.centralStock} {item.unit}
          {item.centralStock <= item.reorderLevel && " ⚠️ Low"}
        </SelectItem>
      ))}
      {stockItems.length === 0 && (
        <SelectItem value="" disabled>No items in central stock for {city}</SelectItem>
      )}
    </SelectContent>
  </Select>
  {selectedItemId && (
    <p className="text-xs text-gray-500 mt-1">
      Current stock: {currentStock} {selectedItemUnit} | Reorder at: {reorderLevel}
    </p>
  )}

CHANGE 6 — src/app/components/inventory/MonthEndVerification.tsx — Washer + month selects (Finding 13)
Add imports and replace the hardcoded worksheet load. Find the component top. Add:
ts  import { useEmployee } from "../../contexts/EmployeeContext";
  import { useInventory } from "../../contexts/InventoryContext";

  const { employees } = useEmployee();
  const { getWasherStock } = useInventory();
  const [selectedWasherId, setSelectedWasherId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const washers = employees.filter(e =>
    e.designation === "Car Washer" && e.status === "Active" &&
    (e.workLocation === city || e.cityId === city)
  );

  // Load worksheet when washer + month selected
  useEffect(() => {
    if (!selectedWasherId) return;
    const washerItems = getWasherStock(selectedWasherId, city);
    if (washerItems.length > 0) {
      setWorksheetData(washerItems.map(item => ({
        itemId: item.itemId, itemName: item.itemName, unit: item.unit,
        systemBalance: item.washerStock[selectedWasherId] || 0,
        physicalCount: item.washerStock[selectedWasherId] || 0, variance: 0,
      })));
    }
  }, [selectedWasherId, city]);
Add the washer and month selectors at the top of the page, before the worksheet table:
tsx  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <label className="block text-sm font-medium mb-1">Select Washer</label>
      <Select value={selectedWasherId} onValueChange={setSelectedWasherId}>
        <SelectTrigger><SelectValue placeholder="Choose washer to verify" /></SelectTrigger>
        <SelectContent>
          {washers.map(w => (
            <SelectItem key={w.id} value={w.id}>
              {w.fullName} — {w.pinCodes?.[0] || "No zone"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Month</label>
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
        <SelectContent>
          {["January","February","March","April","May","June",
            "July","August","September","October","November","December"]
            .map((m, i) => <SelectItem key={i} value={String(i+1)}>{m} 2026</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  </div>
  {!selectedWasherId && (
    <div className="text-center py-12 text-gray-400">Select a washer and month to load the verification worksheet.</div>
  )}
Do not change any other file in Phase 2.