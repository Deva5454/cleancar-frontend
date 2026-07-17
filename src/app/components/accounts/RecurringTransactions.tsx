/**
 * RecurringTransactions — /accounts/recurring-transactions
 *
 * Real templates for monthly-repeating transactions (rent, a fixed
 * vendor bill). Honest about the real constraint: this app has no
 * background job or server-side cron, so "recurring" means checked
 * whenever this screen loads — anything due shows up ready to confirm,
 * and only posts a real entry once someone actually clicks Confirm.
 * Uses the exact same createEntry() every manual entry goes through.
 */

import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import {
  accountingEntryService,
  CHART_OF_ACCOUNTS_HEADS,
  type RecurringTemplate,
  type EntryType,
  type GSTEntryType,
  type PaymentMode,
} from "../../services/accountingEntryService";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Repeat, Plus, CheckCircle2, Pause, Play } from "lucide-react";
import { toast } from "sonner";

export function RecurringTransactions() {
  const { city, cityInfo } = useCity();
  const { currentUser } = useRole();
  const [templates, setTemplates] = useState<RecurringTemplate[]>(() =>
    accountingEntryService.getRecurringTemplates(city)
  );
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [expenseAccount, setExpenseAccount] = useState("");
  const [taxableValue, setTaxableValue] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Bank");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const refresh = () => setTemplates(accountingEntryService.getRecurringTemplates(city));

  const today = new Date().toISOString().split("T")[0];
  const dueNow = useMemo(
    () => templates.filter((t) => t.isActive && t.nextRunDate <= today),
    [templates, today]
  );
  const upcoming = useMemo(
    () => templates.filter((t) => t.isActive && t.nextRunDate > today),
    [templates, today]
  );
  const paused = useMemo(() => templates.filter((t) => !t.isActive), [templates]);

  const ledgers = accountingEntryService.getLedgers(city);
  const bankLedger = ledgers.find((l) => l.name === "Axis Bank" && l.type === "bank");
  const cashLedger = ledgers.find((l) => l.name === "Petty Cash");

  const handleCreate = () => {
    if (!name || !expenseAccount || !taxableValue || parseFloat(taxableValue) <= 0) {
      toast.error("Fill in the template name, expense category, and a valid amount");
      return;
    }
    const debitLedger = paymentMode === "Cash" ? cashLedger : bankLedger;
    if (!debitLedger) {
      toast.error("Could not find the required payment ledger");
      return;
    }
    const head = CHART_OF_ACCOUNTS_HEADS.find((h) => h.value === expenseAccount);
    accountingEntryService.saveRecurringTemplate(
      {
        name,
        entryType: "Expense" as EntryType,
        vendorName: vendorName || undefined,
        expenseAccount,
        expenseAccountLabel: head?.label || expenseAccount,
        taxableValue: parseFloat(taxableValue),
        gstRate: parseFloat(gstRate),
        gstEntryType: "B2B" as GSTEntryType,
        paymentMode,
        debitAccount: expenseAccount,
        creditAccount: debitLedger.id,
        dayOfMonth: parseInt(dayOfMonth, 10),
        isActive: true,
        city: cityInfo.displayName,
        cityId: city,
        createdBy: currentUser?.name || "Accounts",
      },
      city
    );
    toast.success(`"${name}" saved — first run scheduled`);
    setName(""); setVendorName(""); setExpenseAccount(""); setTaxableValue(""); setDayOfMonth("1");
    setShowForm(false);
    refresh();
  };

  const handleRun = (t: RecurringTemplate) => {
    const entry = accountingEntryService.runRecurringTemplate(t.id, city, cityInfo.displayName, currentUser?.name || "Accounts");
    if (!entry) {
      toast.error("Could not create this entry — please try again.");
      return;
    }
    toast.success(`Entry created: ${entry.voucherNumber}. Next run scheduled.`);
    refresh();
  };

  const handleToggle = (t: RecurringTemplate) => {
    accountingEntryService.toggleRecurringTemplate(t.id, !t.isActive, city);
    toast.info(t.isActive ? `"${t.name}" paused` : `"${t.name}" resumed`);
    refresh();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-purple-600" />
            Recurring Transactions
          </h1>
          <p className="text-sm text-gray-500">
            Set up a repeating expense once — confirm each month instead of re-entering it
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="w-4 h-4 mr-1" /> New Template
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Template Name *</Label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={name}
                onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Office Rent" />
            </div>
            <div>
              <Label className="mb-1 block">Vendor (optional)</Label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={vendorName}
                onChange={(e) => setVendorName(e.target.value)} placeholder="Vendor name" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1 block">Expense Category *</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={expenseAccount}
                onChange={(e) => setExpenseAccount(e.target.value)}>
                <option value="">Select...</option>
                {CHART_OF_ACCOUNTS_HEADS.filter((h) => h.nature === "expense").map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block">Amount (before GST) *</Label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={taxableValue}
                onChange={(e) => setTaxableValue(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="mb-1 block">GST Rate</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}>
                {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Payment Mode</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block">Due Every Month On</Label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={handleCreate}>Save Template</Button>
        </div>
      )}

      {dueNow.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Due Now ({dueNow.length})</h3>
          <div className="space-y-2">
            {dueNow.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 border border-amber-200 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">₹{t.taxableValue.toLocaleString("en-IN")} + GST · Due {t.nextRunDate}</p>
                </div>
                <Button size="sm" onClick={() => handleRun(t)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Confirm & Post Entry
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Upcoming ({upcoming.length})</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing scheduled beyond what's due now.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">₹{t.taxableValue.toLocaleString("en-IN")} + GST · Next {t.nextRunDate}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleToggle(t)}>
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {paused.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Paused ({paused.length})</h3>
          <div className="space-y-2">
            {paused.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">₹{t.taxableValue.toLocaleString("en-IN")} + GST</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleToggle(t)}>
                  <Play className="w-4 h-4 mr-1" /> Resume
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        This app doesn't run in the background — a template becomes "Due Now" whenever this screen is
        opened on or after its scheduled date. Nothing posts automatically; confirming is always a real,
        deliberate action, and creates the same kind of entry a manual one would.
      </p>
    </div>
  );
}

export default RecurringTransactions;
