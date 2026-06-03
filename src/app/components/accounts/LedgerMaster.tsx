import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Search, Plus, Edit, Eye, Trash2, X, Layers,
  Users, TrendingUp, Building2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useCity } from "../../contexts/CityContext";
import {
  accountingEntryService,
  CHART_OF_ACCOUNTS_HEADS,
  type LedgerMaster as LedgerMasterType
} from "../../services/accountingEntryService";
import { BackButton } from "../ui/back-button";

export function LedgerMaster() {
  const { currentCity, currentCityId } = useCity();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingLedger, setEditingLedger] = useState<LedgerMasterType | null>(null);
  const [viewingLedger, setViewingLedger] = useState<LedgerMasterType | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<LedgerMasterType>>({
    name: "",
    accountHead: "",
    type: "other",
    openingBalance: 0,
    openingBalanceType: "Dr",
    status: "Active",
    gstin: "",
    mobile: "",
    email: "",
  });
  const [isNonGST, setIsNonGST] = useState(false);
  const [entityType, setEntityType] = useState("");

  const ledgers = accountingEntryService.getLedgers(currentCityId);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = ledgers.length;
    const customers = ledgers.filter(l => l.type === "customer").length;
    const sales = ledgers.filter(l => l.type === "sales").length;
    const banks = ledgers.filter(l => l.type === "bank" || l.type === "payment_gateway").length;
    return { total, customers, sales, banks };
  }, [ledgers]);

  // Filter ledgers
  const filteredLedgers = useMemo(() => {
    let filtered = ledgers;

    // Filter by tab
    if (selectedTab !== "all") {
      filtered = filtered.filter(l => l.accountHead === selectedTab);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.accountHeadLabel.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [ledgers, selectedTab, searchQuery]);

  const handleCreateLedger = () => {
    if (!formData.name?.trim()) {
      toast.error("Ledger name is required");
      return;
    }
    if (!formData.accountHead) {
      toast.error("Account head is required");
      return;
    }

    const accountHeadData = CHART_OF_ACCOUNTS_HEADS.find(h => h.value === formData.accountHead);
    if (!accountHeadData) {
      toast.error("Invalid account head");
      return;
    }

    const ledger: LedgerMasterType = {
      id: editingLedger?.id || `LEDGER-${Date.now()}`,
      name: formData.name!.trim(),
      accountHead: formData.accountHead!,
      accountHeadLabel: accountHeadData.label,
      nature: accountHeadData.nature as any,
      type: formData.type!,
      openingBalance: formData.openingBalance || 0,
      openingBalanceType: formData.openingBalanceType || "Dr",
      gstin: formData.gstin,
      mobile: formData.mobile,
      email: formData.email,
      city: currentCity,
      cityId: currentCityId,
      isSystem: false,
      status: formData.status || "Active",
      createdAt: editingLedger?.createdAt || new Date().toISOString(),
    };

    accountingEntryService.saveLedger(ledger);
    toast.success(editingLedger ? "Ledger updated" : "Ledger created successfully");

    setShowCreatePanel(false);
    setEditingLedger(null);
    setFormData({
      name: "",
      accountHead: "",
      type: "other",
      openingBalance: 0,
      openingBalanceType: "Dr",
      status: "Active",
      gstin: "",
      mobile: "",
      email: "",
    });
  };

  const handleEditLedger = (ledger: LedgerMasterType) => {
    setEditingLedger(ledger);
    setFormData({
      name: ledger.name,
      accountHead: ledger.accountHead,
      type: ledger.type,
      openingBalance: ledger.openingBalance,
      openingBalanceType: ledger.openingBalanceType,
      status: ledger.status,
      gstin: ledger.gstin,
      mobile: ledger.mobile,
      email: ledger.email,
    });
    setShowCreatePanel(true);
  };

  const handleDeleteLedger = (id: string) => {
    const success = accountingEntryService.deleteLedger(id);
    if (success) {
      toast.success("Ledger deleted successfully");
    } else {
      toast.error("Cannot delete system ledger");
    }
  };

  const getLedgerBalance = (ledger: LedgerMasterType) => {
    const balance = accountingEntryService.getLedgerBalance(ledger.id);
    return balance;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BackButton />
            <h2 className="text-2xl font-bold text-gray-900">Ledger Master</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Create and manage account ledgers — customers, banks, vendors, sales accounts.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-sm">{currentCity}</span>
        </Badge>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Ledgers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customer Ledgers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpis.customers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sales Ledgers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.sales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Bank & Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kpis.banks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Create */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-1">
              {/* Group selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Group:</label>
                <select
                  className="border rounded px-2 py-1.5 text-sm min-w-[200px]"
                  value={selectedTab}
                  onChange={e => setSelectedTab(e.target.value)}
                >
                  <option value="all">— ALL LEDGERS —</option>
                  <optgroup label="LIABILITIES">
                    <option value="accounts_payable">Accounts Payable (Vendors)</option>
                    <option value="other_liabilities">Other Liabilities</option>
                    <option value="creditors">Creditors</option>
                  </optgroup>
                  <optgroup label="ASSETS">
                    <option value="debtors">Debtors (Customers)</option>
                    <option value="bank_accounts">Bank Accounts</option>
                    <option value="fixed_assets">Fixed Assets</option>
                    <option value="current_assets">Current Assets</option>
                  </optgroup>
                  <optgroup label="INCOME">
                    <option value="sales_subscription">Sales / Subscription Revenue</option>
                    <option value="other_income">Other Income</option>
                  </optgroup>
                  <optgroup label="EXPENSES">
                    <option value="transaction_charges">Transaction Charges</option>
                    <option value="operating_expenses">Operating Expenses</option>
                    <option value="administrative_expenses">Administrative Expenses</option>
                  </optgroup>
                  <optgroup label="BANK & PAYMENT">
                    <option value="bank">Bank Ledgers</option>
                    <option value="sales_subscription">Sales Subscription</option>
                  </optgroup>
                </select>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search ledgers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={() => {
              setEditingLedger(null);
              setFormData({
                name: "",
                accountHead: "",
                type: "other",
                openingBalance: 0,
                openingBalanceType: "Dr",
                status: "Active",
                gstin: "",
                mobile: "",
                email: "",
              });
              setIsNonGST(false);
              setEntityType("");
              setShowCreatePanel(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ledger
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Account Head Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-6 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="debtors">Debtors</TabsTrigger>
              <TabsTrigger value="accounts_payable">Vendors</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
              <TabsTrigger value="fixed_assets">Fixed Assets</TabsTrigger>
              <TabsTrigger value="transaction_charges">Expenses</TabsTrigger>
            </TabsList>

            {/* Auto-create notice for Debtors tab */}
            {selectedTab === "debtors" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <strong>Auto-create Notice:</strong> Customer ledgers are created automatically
                  when a customer subscribes. You can also create them manually here.
                </div>
              </div>
            )}

            {/* Group ALL summary banner for Vendors and Fixed Assets */}
            {(selectedTab === "accounts_payable" || selectedTab === "fixed_assets") && filteredLedgers.length > 0 && (() => {
              const totalBal = filteredLedgers.reduce((sum, l) => {
                const b = getLedgerBalance(l);
                return sum + (b.balanceType === "Cr" ? b.balance : -b.balance);
              }, 0);
              const label = selectedTab === "accounts_payable" ? "All Vendors — Total Payable" : "All Fixed Assets — Total Value";
              return (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-semibold text-amber-900">{label}</span>
                  <span className={`font-bold text-lg ${totalBal >= 0 ? "text-red-600" : "text-green-600"}`}>
                    ₹{Math.abs(totalBal).toLocaleString()} {totalBal >= 0 ? "Cr" : "Dr"}
                  </span>
                </div>
              );
            })()}

            <TabsContent value={selectedTab} className="mt-0">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ledger Name</TableHead>
                      <TableHead>Account Head</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Opening Balance</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLedgers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No ledgers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLedgers.map((ledger) => {
                        const balance = getLedgerBalance(ledger);
                        const balanceColor = ledger.nature === "asset" || ledger.nature === "expense"
                          ? balance.balanceType === "Dr" ? "text-green-600" : "text-red-600"
                          : balance.balanceType === "Cr" ? "text-green-600" : "text-red-600";

                        return (
                          <TableRow key={ledger.id}>
                            <TableCell className="font-medium">{ledger.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{ledger.accountHeadLabel}</Badge>
                            </TableCell>
                            <TableCell className="capitalize">{ledger.type.replace(/_/g, " ")}</TableCell>
                            <TableCell>
                              ₹{(ledger?.openingBalance ?? 0).toLocaleString()} {ledger.openingBalanceType}
                            </TableCell>
                            <TableCell className={balanceColor}>
                              ₹{(balance?.balance ?? 0).toLocaleString()} {balance.balanceType}
                            </TableCell>
                            <TableCell>
                              <Badge variant={ledger.status === "Active" ? "default" : "secondary"}>
                                {ledger.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ledger.isSystem && (
                                <Badge variant="outline" className="text-xs">System</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewingLedger(ledger)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {!ledger.isSystem && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditLedger(ledger)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteLedger(ledger.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {ledger.isSystem && (
                                  <div className="relative group">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled
                                      className="opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                      System ledger — cannot be deleted
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Slide-in Panel */}
      {showCreatePanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="w-full max-w-md h-full bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingLedger ? "Edit Ledger" : "Create New Ledger"}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowCreatePanel(false);
                  setEditingLedger(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Ledger Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., HDFC Bank, Customer Name"
                />
              </div>

              <div>
                <Label htmlFor="accountHead">Account Head *</Label>
                <Select
                  value={formData.accountHead}
                  onValueChange={(value) => setFormData({ ...formData, accountHead: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account head" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_OF_ACCOUNTS_HEADS.map((head) => (
                      <SelectItem key={head.value} value={head.value}>
                        {head.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openingBalance">Opening Balance</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="openingBalanceType">Type</Label>
                  <Select
                    value={formData.openingBalanceType}
                    onValueChange={(value: any) => setFormData({ ...formData, openingBalanceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr">Dr (Debit)</SelectItem>
                      <SelectItem value="Cr">Cr (Credit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(formData.type === "customer" || formData.type === "vendor") && (
                <div className="space-y-3">
                  {/* Entity Type for TDS applicability */}
                  <div>
                    <Label htmlFor="entityType">Entity Type <span className="text-xs text-gray-500">(for TDS applicability)</span></Label>
                    <select
                      id="entityType"
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      className="w-full border rounded px-3 py-2 mt-1"
                    >
                      <option value="">Select entity type</option>
                      <option value="individual_huf">Individual / HUF (TDS @ 1%)</option>
                      <option value="proprietorship">Proprietorship (TDS @ 1%)</option>
                      <option value="partnership">Partnership Firm (TDS @ 2%)</option>
                      <option value="llp">LLP (TDS @ 2%)</option>
                      <option value="private_limited">Private Limited Company (TDS @ 2%)</option>
                      <option value="public_limited">Public Limited Company (TDS @ 2%)</option>
                      <option value="trust">Trust / Society (TDS @ 2%)</option>
                      <option value="government">Government / PSU (TDS @ 2%)</option>
                    </select>
                    {entityType && (
                      <p className="text-xs text-blue-600 mt-1">
                        TDS on contract payments: {entityType.includes("individual") || entityType.includes("proprietorship") ? "1%" : "2%"}
                      </p>
                    )}
                  </div>

                  {/* Non-GST toggle */}
                  {formData.type === "vendor" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="nonGST"
                        checked={isNonGST}
                        onChange={(e) => {
                          setIsNonGST(e.target.checked);
                          if (e.target.checked) setFormData({ ...formData, gstin: "" });
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor="nonGST" className="text-sm text-gray-700 cursor-pointer">
                        Non-GST Vendor (no GSTIN)
                      </label>
                    </div>
                  )}

                  {/* GSTIN - optional for non-GST vendors */}
                  {!isNonGST && (
                    <div>
                      <Label htmlFor="gstin">GSTIN {formData.type === "vendor" ? "(optional if non-GST)" : ""}</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  )}
                  {isNonGST && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                      Non-GST vendor — GSTIN not required. Purchases from this vendor will be treated as Non-GST expense.
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateLedger} className="flex-1">
                  {editingLedger ? "Update Ledger" : "Create Ledger"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreatePanel(false);
                    setEditingLedger(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Ledger Dialog */}
      {viewingLedger && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ledger Details</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewingLedger(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-medium">{viewingLedger.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Account Head</Label>
                <p>{viewingLedger.accountHeadLabel}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Type</Label>
                <p className="capitalize">{viewingLedger.type.replace(/_/g, " ")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Opening Balance</Label>
                  <p>₹{(viewingLedger?.openingBalance ?? 0).toLocaleString()} {viewingLedger.openingBalanceType}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p>{viewingLedger.status}</p>
                </div>
              </div>
              {viewingLedger.gstin && (
                <div>
                  <Label className="text-xs text-gray-500">GSTIN</Label>
                  <p>{viewingLedger.gstin}</p>
                </div>
              )}
              {viewingLedger.mobile && (
                <div>
                  <Label className="text-xs text-gray-500">Mobile</Label>
                  <p>{viewingLedger.mobile}</p>
                </div>
              )}
              {viewingLedger.email && (
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p>{viewingLedger.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default LedgerMaster;
