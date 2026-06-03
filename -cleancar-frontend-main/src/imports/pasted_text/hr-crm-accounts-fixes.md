HR, CRM, Accounts (Findings 1–4, 7, 8)
This is Phase 1 of 3. Fix findings 1, 2, 3, 4, 7, and 8.

CHANGE 1 — src/app/components/hr/EmployeeDatabase.tsx — Live reporting manager dropdown (Finding 1)
Find the reportingManager field in the add/edit employee form. Currently it's auto-filled and locked. Replace the auto-fill logic:
Find the useEffect that sets reportingManager from organizationalHierarchy:
ts  useEffect(() => {
    if (formData.designation && formData.workLocation && isManagerFieldLocked) {
      const manager = organizationalHierarchy[formData.designation]?.[formData.workLocation];
      if (manager) {
        setFormData(prev => ({ ...prev, reportingManager: manager }));
      }
    }
  }, [formData.designation, formData.workLocation, isManagerFieldLocked]);
Replace with:
ts  // Manager hierarchy: who should manage each role
  const MANAGER_ROLE_FOR: Record<string, string[]> = {
    "Car Washer":             ["Supervisor"],
    "Supervisor":             ["Operations Manager", "Sr Operations Manager"],
    "Operations Manager":     ["Cluster Manager", "Sr Operations Manager"],
    "Sr Operations Manager":  ["Cluster Manager"],
    "Cluster Manager":        ["City Manager"],
    "TSE":                    ["TSM"],
    "TSM":                    ["City Manager"],
    "CCE":                    ["Admin", "City Manager"],
    "Store Manager":          ["City Manager", "Admin"],
    "HR":                     ["Admin"],
    "Accounts":               ["Admin"],
  };

  const eligibleManagers = useMemo(() => {
    if (!formData.designation || !formData.workLocation) return [];
    const managerRoles = MANAGER_ROLE_FOR[formData.designation] || [];
    return employees.filter(e =>
      managerRoles.includes(e.designation) &&
      e.status === "Active" &&
      (e.workLocation === formData.workLocation || e.cityId === city)
    );
  }, [formData.designation, formData.workLocation, employees, city]);
Replace the reporting manager Input in the form with:
tsx  <Select
    value={formData.reportingManager}
    onValueChange={(val) => setFormData(prev => ({ ...prev, reportingManager: val }))}
  >
    <SelectTrigger>
      <SelectValue placeholder={eligibleManagers.length === 0 ? "No managers found for this role" : "Select reporting manager"} />
    </SelectTrigger>
    <SelectContent>
      {eligibleManagers.map(m => (
        <SelectItem key={m.id} value={m.fullName}>
          {m.fullName} — {m.designation} ({m.pinCodes?.[0] || "No pincode"})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {eligibleManagers.length === 0 && formData.designation && (
    <p className="text-xs text-amber-600 mt-1">No active managers found. You can type a name manually.</p>
  )}

CHANGE 2 — src/app/components/advance/ShortTermAdvanceForm.tsx and LongTermAdvanceForm.tsx — Employee picker for HR (Finding 2)
In both form files, add at the very top of the form JSX (before the amount field):
tsx  import { useEmployee } from "../../contexts/EmployeeContext";
  import { useRole } from "../../contexts/RoleContext";
  import { useCity } from "../../contexts/CityContext";

  const { employees } = useEmployee();
  const { currentRole } = useRole();
  const { city } = useCity();
  const [targetEmployeeId, setTargetEmployeeId] = useState(currentUser?.employeeId || "");
  const isHRView = currentRole === "HR" || currentRole === "Admin" || currentRole === "Super Admin";

  const targetEmployee = employees.find(e => e.id === targetEmployeeId);
Add this block at the very top of the form, visible only to HR/Admin:
tsx  {isHRView && (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <label className="block text-sm font-medium text-blue-800 mb-1">
        Processing advance for:
      </label>
      <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Select employee..." />
        </SelectTrigger>
        <SelectContent>
          {employees
            .filter(e => e.status === "Active" && (e.workLocation === city || e.cityId === city))
            .map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.fullName} — {e.designation} ({e.mobile})
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {targetEmployee && (
        <p className="text-xs text-blue-600 mt-1">
          Role: {targetEmployee.designation} | Gross: ₹{targetEmployee.gross?.toLocaleString() || "—"}
        </p>
      )}
    </div>
  )}

CHANGE 3 — src/app/components/crm/actions/ScheduleDemoPanel.tsx — City + PIN selects (Finding 3)
Add imports:
tsimport { useCity } from "../../../contexts/CityContext";
Inside the component:
ts  const { availableCities } = useCity();
  const [demoCity, setDemoCity] = useState(lead?.address?.city || "Surat");
  const [demoPinCode, setDemoPinCode] = useState(lead?.address?.pinCode || "");

  // Pincode options per city
  const CITY_PINCODES: Record<string, string[]> = {
    "Surat":  ["395001","395002","395003","395004","395005","395006","395007","395008","395009","395010"],
    "Mumbai": ["400001","400002","400003","400004","400005","400006","400007","400008","400009","400010"],
  };
  const availablePins = CITY_PINCODES[demoCity] || [];
Find:
tsx  <Input placeholder="City" defaultValue="Surat" />
  <Input placeholder="PIN Code" />
Replace with:
tsx  <Select value={demoCity} onValueChange={(val) => { setDemoCity(val); setDemoPinCode(""); }}>
    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
    <SelectContent>
      {availableCities.map(c => (
        <SelectItem key={c.id} value={c.displayName}>{c.displayName}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Select value={demoPinCode} onValueChange={setDemoPinCode}>
    <SelectTrigger><SelectValue placeholder="Select PIN code" /></SelectTrigger>
    <SelectContent>
      {availablePins.map(pin => (
        <SelectItem key={pin} value={pin}>{pin}</SelectItem>
      ))}
    </SelectContent>
  </Select>

CHANGE 4 — src/app/components/crm/panels/LeadOverviewTab.tsx — PIN + Area selects (Finding 4)
Same pattern as Change 3. Find:
tsx  <Input placeholder="Area" defaultValue={lead.area} />
  <Input placeholder="PIN Code" />
Replace with a PIN-first approach where area auto-fills:
tsx  const PIN_TO_AREA: Record<string, string> = {
    "395001": "Adajan", "395002": "Varachha", "395003": "Katargam",
    "395005": "Althan", "395006": "Dumas", "395007": "Vesu",
    "400001": "Bandra", "400002": "Andheri", "400003": "Dadar",
    "400004": "Thane", "400005": "Borivali",
  };

  <Select
    value={leadPinCode}
    onValueChange={(val) => {
      setLeadPinCode(val);
      updateLead(lead.leadId, { address: { ...lead.address, pinCode: val, area: PIN_TO_AREA[val] || "" } });
    }}
  >
    <SelectTrigger><SelectValue placeholder="Select PIN code" /></SelectTrigger>
    <SelectContent>
      {availablePins.map(pin => (
        <SelectItem key={pin} value={pin}>{pin} — {PIN_TO_AREA[pin] || "Area"}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Input
    value={PIN_TO_AREA[leadPinCode] || lead.area || ""}
    readOnly
    className="bg-gray-50"
    placeholder="Auto-filled from PIN code"
  />

CHANGE 5 — src/app/components/accounts/AccountingEntry.tsx — Searchable Combobox for Debit/Credit (Finding 7)
Replace the native <select> for debitAccount and creditAccount with a searchable component. Add state:
ts  const [debitSearch, setDebitSearch] = useState("");
  const [creditSearch, setCreditSearch] = useState("");
Replace the native <select value={debitAccount}> block with:
tsx  {/* Searchable Debit Account */}
  <div>
    <label className="block text-sm font-medium mb-1">Debit Account</label>
    <input
      className="w-full border rounded px-3 py-1.5 text-sm mb-1"
      placeholder="Type to search ledger..."
      value={debitSearch}
      onChange={e => setDebitSearch(e.target.value)}
    />
    <select
      value={debitAccount}
      onChange={e => setDebitAccount(e.target.value)}
      size={5}
      className="w-full border rounded px-3 py-1 text-sm"
    >
      <option value="">— Select —</option>
      {CHART_OF_ACCOUNTS_HEADS.map(head => {
        const ledgers = accountingEntryService.getLedgersByHead(head.value, city)
          .filter(l => !debitSearch || l.name.toLowerCase().includes(debitSearch.toLowerCase()));
        if (ledgers.length === 0) return null;
        return (
          <optgroup key={head.value} label={head.label}>
            {ledgers.map(ledger => {
              const bal = accountingEntryService.getLedgerBalance(ledger.id);
              return (
                <option key={ledger.id} value={ledger.id}>
                  {ledger.name} — Bal: ₹{bal.balance.toLocaleString()} {bal.balanceType}
                </option>
              );
            })}
          </optgroup>
        );
      })}
    </select>
    {debitAccount && (
      <p className="text-xs text-blue-600 mt-0.5">
        Selected: {accountingEntryService.getLedgers(city).find(l => l.id === debitAccount)?.name}
      </p>
    )}
  </div>
Apply the identical pattern to the creditAccount field using creditSearch.

CHANGE 6 — src/app/components/accounts/RazorpayFlow.tsx — Customer from subscription (Finding 8)
Add imports:
tsimport { useCustomers } from "../../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
Inside the component:
ts  const { cityCustomers } = useCustomers();
  const { subscriptions } = useCustomerSubscriptions();
  const [customerSearch, setCustomerSearch] = useState("");

  const filteredCustomers = cityCustomers.filter(c =>
    c.status === "Active" &&
    (!customerSearch || `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(customerSearch.toLowerCase()))
  );
Find the customer input row in Step 1. Replace <Input value={newCustomerName} onChange={...} /> with:
tsx  <input
    className="border rounded px-2 py-1 text-sm w-48"
    placeholder="Search customer..."
    value={customerSearch}
    onChange={e => setCustomerSearch(e.target.value)}
  />
  <select
    className="border rounded px-2 py-1 text-sm w-48"
    onChange={e => {
      const c = cityCustomers.find(x => x.customerId === e.target.value);
      if (!c) return;
      const sub = subscriptions.find(s => s.customerId === c.customerId && s.status === "Active");
      setNewCustomerName(`${c.firstName} ${c.lastName}`);
      setNewCustomerId(c.customerId);
      if (sub) {
        setNewPackage(sub.packageType || "Silver Monthly");
        setNewAmount(sub.monthlyAmount || 0);
      }
      setCustomerSearch("");
    }}
  >
    <option value="">— Pick customer —</option>
    {filteredCustomers.map(c => (
      <option key={c.customerId} value={c.customerId}>
        {c.firstName} {c.lastName} ({c.phone})
      </option>
    ))}
  </select>
When a customer is selected their subscription package and amount auto-populate the row. Add newCustomerId and newPackage to the component state. Update the addCustomer function to include customerId.
Do not change any other file in Phase 1.