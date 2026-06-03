import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Package, Plus, Edit, Trash2, X } from "lucide-react";
import { accountingEntryService, type ItemMaster, CHART_OF_ACCOUNTS_HEADS } from "../../services/accountingEntryService";
import { useCity } from "../../contexts/CityContext";

const SEED_ITEMS: Omit<ItemMaster, "id"|"createdAt"|"defaultExpenseLedgerId">[] = [
  { itemName: "Car Wash Shampoo 5L",  hsnCode: "340290", defaultExpenseLedgerName: "Raw Materials And Consumables", defaultGSTRate: 18, unitOfMeasure: "Litre",  status: "Active" },
  { itemName: "Microfiber Cloth",      hsnCode: "630790", defaultExpenseLedgerName: "Raw Materials And Consumables", defaultGSTRate: 5,  unitOfMeasure: "Piece",  status: "Active" },
  { itemName: "Tyre Shine 500ml",      hsnCode: "340290", defaultExpenseLedgerName: "Raw Materials And Consumables", defaultGSTRate: 18, unitOfMeasure: "Bottle", status: "Active" },
  { itemName: "Professional Fees",     hsnCode: "999299", defaultExpenseLedgerName: "Consultant Expense",           defaultGSTRate: 18, unitOfMeasure: "Service",status: "Active" },
  { itemName: "Office Electricity",    hsnCode: "271600", defaultExpenseLedgerName: "Electricity Expense",          defaultGSTRate: 18, unitOfMeasure: "Unit",   status: "Active" },
  { itemName: "Rent - Office Space",   hsnCode: "997212", defaultExpenseLedgerName: "Rent Expense",                 defaultGSTRate: 18, unitOfMeasure: "Month",  status: "Active" },
];

export function ItemMaster() {
  const { cityId } = useCity();
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);
  const [formData, setFormData] = useState<Omit<ItemMaster, "id"|"createdAt">>({
    itemName: "",
    hsnCode: "",
    defaultExpenseLedgerId: "",
    defaultExpenseLedgerName: "",
    defaultGSTRate: 18,
    unitOfMeasure: "",
    description: "",
    status: "Active",
  });

  useEffect(() => {
    // Ensure system ledgers are seeded before resolving item-master ledger IDs
    // getLedgers() triggers ensureSystemLedgers() internally
    const expenseLedgers = accountingEntryService.getLedgers(cityId)
      .filter(l => {
        const head = CHART_OF_ACCOUNTS_HEADS.find(h => h.value === l.accountHead);
        return head?.nature === "expense";
      });

    const all = accountingEntryService.getItems();

    if (all.length === 0) {
      SEED_ITEMS.forEach(seed => {
        const ledger = expenseLedgers.find(l => l.name === seed.defaultExpenseLedgerName);
        accountingEntryService.saveItem({
          ...seed,
          defaultExpenseLedgerId: ledger?.id || "",
          id: `ITEM-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          createdAt: new Date().toISOString(),
        });
      });
    } else {
      // Heal any existing items with empty ledger IDs
      const healed = all.map(item => {
        if (item.defaultExpenseLedgerId) return item;
        const ledger = expenseLedgers.find(l => l.name === item.defaultExpenseLedgerName);
        return ledger ? { ...item, defaultExpenseLedgerId: ledger.id } : item;
      });
      const changed = healed.filter((h, i) => h.defaultExpenseLedgerId !== all[i].defaultExpenseLedgerId);
      changed.forEach(item => accountingEntryService.saveItem(item));
    }

    setItems(accountingEntryService.getItems());
  }, [cityId]); // Re-run when city changes

  const expenseLedgers = accountingEntryService
    .getLedgers(cityId)
    .filter(l => {
      const head = CHART_OF_ACCOUNTS_HEADS.find(h => h.value === l.accountHead);
      return head?.nature === "expense";
    });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      itemName: "",
      hsnCode: "",
      defaultExpenseLedgerId: "",
      defaultExpenseLedgerName: "",
      defaultGSTRate: 18,
      unitOfMeasure: "",
      description: "",
      status: "Active",
    });
    setShowPanel(true);
  };

  const handleEdit = (item: ItemMaster) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      hsnCode: item.hsnCode,
      defaultExpenseLedgerId: item.defaultExpenseLedgerId,
      defaultExpenseLedgerName: item.defaultExpenseLedgerName,
      defaultGSTRate: item.defaultGSTRate,
      unitOfMeasure: item.unitOfMeasure || "",
      description: item.description || "",
      status: item.status,
    });
    setShowPanel(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this item?")) {
      accountingEntryService.deleteItem(id);
      setItems(accountingEntryService.getItems());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ledger = expenseLedgers.find(l => l.id === formData.defaultExpenseLedgerId);
    if (!ledger) {
      toast.info("Please select a default expense ledger");
      return;
    }

    const item: ItemMaster = {
      ...formData,
      id: editingItem?.id || `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      defaultExpenseLedgerName: ledger.name,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };
    accountingEntryService.saveItem(item);
    setShowPanel(false);
    setItems(accountingEntryService.getItems());
  };

  const activeItems = items.filter(i => i.status === "Active");
  const hsnMapped = items.filter(i => i.hsnCode && i.hsnCode.trim().length > 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Item Master</h1>
            <p className="text-sm text-gray-600">Manage items with HSN codes for expense vouchers</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeItems.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">HSN Codes Mapped</p>
          <p className="text-2xl font-bold text-blue-600">{hsnMapped.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Item Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">HSN Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Default Expense Ledger</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">GST Rate</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">UOM</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No items yet. Click "+ Add Item" to create your first item.
                  </td>
                </tr>
              )}
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.itemName}</td>
                  <td className="px-4 py-3 text-gray-600">{item.hsnCode}</td>
                  <td className="px-4 py-3 text-gray-600">{item.defaultExpenseLedgerName}</td>
                  <td className="px-4 py-3 text-gray-600">{item.defaultGSTRate}%</td>
                  <td className="px-4 py-3 text-gray-600">{item.unitOfMeasure || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs rounded ${
                      item.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in Panel */}
      {showPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h2>
              <button onClick={() => setShowPanel(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={formData.hsnCode}
                  onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="6 or 8 digits"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Expense Ledger <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.defaultExpenseLedgerId}
                  onChange={e => setFormData({ ...formData, defaultExpenseLedgerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select ledger...</option>
                  {expenseLedgers.map(ledger => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name} ({ledger.accountHeadLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default GST Rate <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.defaultGSTRate}
                  onChange={e => setFormData({ ...formData, defaultGSTRate: Number(e.target.value) as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                  <option value={40}>40%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  value={formData.unitOfMeasure}
                  onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. Litre, Kg, Piece, Box"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPanel(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
