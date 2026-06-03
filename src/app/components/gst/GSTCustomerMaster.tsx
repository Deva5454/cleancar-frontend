import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Users, Plus, Search, Download, X, Check, AlertCircle } from "lucide-react";
import { gstComplianceService, type GSTCustomer } from "../../services/gstComplianceService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { GST_STATE_OPTIONS, GST_STATES } from "../../services/accountingEntryService";
import { useCity } from "../../contexts/CityContext";

export function GSTCustomerMaster() {
  const { city, cityInfo } = useCity();
  const [customers, setCustomers] = useState<GSTCustomer[]>(gstComplianceService.getCustomers(city));
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<GSTCustomer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchState = !filterState || c.state === filterState;
      const matchStatus = !filterStatus || c.status === filterStatus;
      const matchType = !filterType || c.customerType === filterType;
      return matchSearch && matchState && matchStatus && matchType;
    });
  }, [customers, searchTerm, filterState, filterStatus, filterType]);

  const states = useMemo(() => Array.from(new Set(customers.map(c => c.state))), [customers]);

  const handleExport = (e: React.MouseEvent) => {
    const data = filteredCustomers.map(c => ({
      Name: c.name,
      GSTIN: c.gstin || "N/A",
      PAN: c.pan || "N/A",
      State: c.state,
      "Customer Type": c.customerType,
      "Registration Type": c.registrationType,
      "Credit Limit": c.creditLimit,
      "Credit Days": c.creditDays,
      Status: c.status,
      Email: c.contactEmail
    }));
    showExportMenu(data, "gst-customer-master", e.currentTarget as HTMLElement);
  };

  const handleSaveCustomer = (customer: GSTCustomer) => {
    const customerWithCity = { ...customer, cityId: city, city: cityInfo.displayName };
    gstComplianceService.saveCustomer(customerWithCity);
    setCustomers(gstComplianceService.getCustomers(city));
    setShowAddForm(false);
    setEditingCustomer(null);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GST Customer Master</h1>
            <p className="text-sm text-gray-600">Manage customer information and GST type classification</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Customer</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or GSTIN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
            <option value="B2CL">B2CL</option>
            <option value="EXPORT">Export</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Customer Name</th>
                <th className="pb-3 font-medium">GSTIN</th>
                <th className="pb-3 font-medium">State</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Credit Limit</th>
                <th className="pb-3 font-medium">Credit Days</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-gray-100 text-sm">
                  <td className="py-3 font-medium text-gray-900">{customer.name}</td>
                  <td className="py-3 text-gray-700 font-mono text-xs">{customer.gstin || "—"}</td>
                  <td className="py-3 text-gray-700">{customer.state}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      customer.customerType === "B2B" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {customer.customerType}
                    </span>
                  </td>
                  <td className="py-3 text-gray-900">₹{(customer?.creditLimit ?? 0).toLocaleString()}</td>
                  <td className="py-3 text-gray-700">{customer.creditDays} days</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      customer.status === "Active" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddForm || editingCustomer) && (
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onClose={() => {
            setShowAddForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
}

function CustomerForm({ customer, onSave, onClose }: {
  customer: GSTCustomer | null;
  onSave: (c: GSTCustomer) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<GSTCustomer>>(customer || {
    id: crypto.randomUUID(),
    name: "",
    gstin: "",
    pan: "",
    state: "",
    stateCode: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    customerType: "B2C",
    registrationType: "Unregistered",
    creditLimit: 0,
    creditDays: 0,
    createdBy: "Current User",
    createdAt: new Date().toISOString(),
    status: "Active"
  });

  const [gstinError, setGstinError] = useState("");
  const [gstinValid, setGstinValid] = useState(false);

  const handleGSTINChange = (gstin: string) => {
    const upper = gstin.toUpperCase();
    setFormData(prev => ({ ...prev, gstin: upper }));

    if (!upper) {
      setGstinValid(true);
      setGstinError("");
      setFormData(prev => ({ ...prev, customerType: "B2C", registrationType: "Unregistered" }));
      return;
    }

    const validation = gstComplianceService.validateGSTIN(upper);
    if (validation.valid) {
      setGstinValid(true);
      setGstinError("");
      setFormData(prev => ({
        ...prev,
        stateCode: validation.stateCode,
        customerType: "B2B",
        registrationType: "Regular"
      }));
    } else {
      setGstinValid(false);
      setGstinError(validation.error || "Invalid GSTIN");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.gstin && !gstinValid) {
      toast.error("Please fix GSTIN validation errors");
      return;
    }
    onSave(formData as GSTCustomer);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? "Edit Customer" : "Add New Customer"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => handleGSTINChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm pr-10 ${
                    gstinError ? "border-red-500" : gstinValid ? "border-green-500" : "border-gray-300"
                  }`}
                />
                {gstinValid && formData.gstin && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />}
                {gstinError && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />}
              </div>
              {gstinError && <p className="text-xs text-red-600 mt-1">{gstinError}</p>}
              {gstinValid && (
                <p className="text-xs text-green-600 mt-1">
                  Customer type auto-detected: {formData.customerType}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN (Optional)</label>
              <input
                type="text"
                value={formData.pan}
                onChange={e => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.stateCode}
                onChange={e => setFormData(prev => ({ ...prev, stateCode: e.target.value, state: GST_STATES[e.target.value] || "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select state</option>
                {GST_STATE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={e => setFormData(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Days</label>
              <input
                type="number"
                value={formData.creditDays}
                onChange={e => setFormData(prev => ({ ...prev, creditDays: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              {customer ? "Update" : "Add"} Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
