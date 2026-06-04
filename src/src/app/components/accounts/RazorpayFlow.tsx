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
  Zap, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2,
  AlertCircle, Eye, Info
} from "lucide-react";
import { toast } from "sonner";
import { useCity } from "../../contexts/CityContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import {
  accountingEntryService,
  type JournalEntry,
  type JournalLine
} from "../../services/accountingEntryService";
import { BackButton } from "../ui/back-button";

interface CustomerSale {
  id: string;
  customerName: string;
  customerId?: string;
  packageCode: string;
  packageName: string;
  amount: number;
}

interface SettlementBatch {
  id: string;
  salesDate: string;
  settlementDate: string;
  customers: CustomerSale[];
  totalSales: number;
  charges: number;
  gstRate: number;
  gstAmount: number;
  totalDeduction: number;
  netSettlement: number;
  voucherNumbers: string[];
  postedAt: string;
}

const SUBSCRIPTION_PACKAGES = [
  { code: "2W", name: "2W (Two Wheeler)" },
  { code: "4W", name: "4W (Four Wheeler)" },
  { code: "2W_WASH_SANITIZE", name: "2W + Wash + Sanitize" },
  { code: "2W_WASH_WASH_SANITIZE", name: "2W + Wash + Wash + Sanitize" },
];

export function RazorpayFlow() {
  const { currentCity, currentCityId } = useCity();
  const { cityCustomers } = useCustomers();
  const { subscriptions } = useCustomerSubscriptions();
  const [activeTab, setActiveTab] = useState("new");
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Sales Entry
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split('T')[0]);
  const [customers, setCustomers] = useState<CustomerSale[]>([]);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newPackageCode, setNewPackageCode] = useState("");
  const [newPackage, setNewPackage] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const filteredCustomers = (cityCustomers || []).filter(c =>
    c.status === "Active" &&
    (!customerSearch || `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Step 3 - Charges
  const [settlementDate, setSettlementDate] = useState("");
  const [charges, setCharges] = useState("");
  const [gstRate, setGstRate] = useState(18);

  // Settlement History
  const [batches, setBatches] = useState<SettlementBatch[]>([]);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  // Calculate totals
  const totalSales = useMemo(() => {
    return (customers || []).reduce((sum, c) => sum + c.amount, 0);
  }, [customers]);

  const gstAmount = useMemo(() => {
    const chargesNum = parseFloat(charges) || 0;
    return Math.round(chargesNum * gstRate) / 100;
  }, [charges, gstRate]);

  const totalDeduction = useMemo(() => {
    const chargesNum = parseFloat(charges) || 0;
    return chargesNum + gstAmount;
  }, [charges, gstAmount]);

  const netSettlement = useMemo(() => {
    return totalSales - totalDeduction;
  }, [totalSales, totalDeduction]);

  // Group customers by package for sales entry
  const salesByPackage = useMemo(() => {
    const grouped: Record<string, { packageName: string; total: number }> = {};
    (customers || []).forEach(c => {
      if (!grouped[c.packageCode]) {
        grouped[c.packageCode] = { packageName: c.packageName, total: 0 };
      }
      grouped[c.packageCode].total += c.amount;
    });
    return grouped;
  }, [customers]);

  const handleAddCustomer = () => {
    if (!newCustomerName.trim() || !newPackageCode || !newAmount) {
      toast.error("Please fill all customer details");
      return;
    }

    const pkg = SUBSCRIPTION_PACKAGES.find(p => p.code === newPackageCode);
    if (!pkg) return;

    const customer: CustomerSale = {
      id: `CUST-${Date.now()}`,
      customerName: newCustomerName.trim(),
      customerId: newCustomerId,
      packageCode: newPackageCode,
      packageName: pkg.name,
      amount: parseFloat(newAmount),
    };

    setCustomers([...customers, customer]);
    setNewCustomerName("");
    setNewCustomerId("");
    setNewPackageCode("");
    setNewPackage("");
    setNewAmount("");
    setCustomerSearch("");
  };

  const handleRemoveCustomer = (id: string) => {
    setCustomers((customers || []).filter(c => c.id !== id));
  };

  const handleNext = () => {
    if (currentStep === 1 && customers.length === 0) {
      toast.error("Please add at least one customer");
      return;
    }
    if (currentStep === 3) {
      if (!settlementDate || !charges) {
        toast.error("Please enter settlement date and charges");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handlePostAll = () => {
    // Create customer ledgers first
    (customers || []).forEach(c => {
      accountingEntryService.createCustomerLedger(
        c.id,
        c.customerName,
        c.packageName,
        currentCityId,
        currentCity
      );
    });

    const voucherNumbers: string[] = [];

    // Entry 1 - Sales Entry (Customers Dr, Sales Cr by package)
    const salesLines: JournalLine[] = [];
    (customers || []).forEach(c => {
      salesLines.push({
        accountHead: `CUST-LEDGER-${c.id}`,
        accountLabel: c.customerName,
        debit: c.amount,
        credit: 0,
      });
    });
    Object.entries(salesByPackage).forEach(([code, data]) => {
      const salesLedger = accountingEntryService.getLedgers(currentCityId)
        .find(l => l.packageCode === code && l.type === "sales");
      if (salesLedger) {
        salesLines.push({
          accountHead: salesLedger.id,
          accountLabel: salesLedger.name,
          debit: 0,
          credit: data.total,
        });
      }
    });
    const entry1 = accountingEntryService.createJournal({
      date: salesDate,
      narration: `Sales entry for ${customers.length} subscriptions on ${salesDate}`,
      lines: salesLines,
      city: currentCity,
      cityId: currentCityId,
      createdBy: "System",
    }, currentCity);
    voucherNumbers.push(entry1.voucherNumber);

    // Entry 2 - Collection Entry (Razorpay Dr, Customers Cr)
    const razorpayLedger = accountingEntryService.getLedgers(currentCityId)
      .find(l => l.name === "Razorpay" && l.type === "payment_gateway");
    const collectionLines: JournalLine[] = [
      {
        accountHead: razorpayLedger?.id || "Razorpay",
        accountLabel: "Razorpay",
        debit: totalSales,
        credit: 0,
      }
    ];
    (customers || []).forEach(c => {
      collectionLines.push({
        accountHead: `CUST-LEDGER-${c.id}`,
        accountLabel: c.customerName,
        debit: 0,
        credit: c.amount,
      });
    });
    const entry2 = accountingEntryService.createJournal({
      date: salesDate,
      narration: `Payment collected via Razorpay for ${customers.length} subscriptions on ${salesDate}`,
      lines: collectionLines,
      city: currentCity,
      cityId: currentCityId,
      createdBy: "System",
    }, currentCity);
    voucherNumbers.push(entry2.voucherNumber);

    // Entry 3 - Charges Entry (Expense Dr, GST Dr, Razorpay Charges Cr)
    const expenseLedger = accountingEntryService.getLedgers(currentCityId)
      .find(l => l.name === "Transaction Charges (Expense)");
    const gstLedger = accountingEntryService.getLedgers(currentCityId)
      .find(l => l.name === "IGST Payable");
    const chargesCreditorLedger = accountingEntryService.getLedgers(currentCityId)
      .find(l => l.name === "Razorpay Charges" && l.type === "vendor");
    const entry3 = accountingEntryService.createJournal({
      date: settlementDate,
      narration: `Transaction charges and GST for Razorpay settlement on ${settlementDate}`,
      lines: [
        {
          accountHead: expenseLedger?.id || "transaction_charges",
          accountLabel: "Transaction Charges (Expense)",
          debit: parseFloat(charges),
          credit: 0,
        },
        {
          accountHead: gstLedger?.id || "gst_input",
          accountLabel: "IGST Payable",
          debit: gstAmount,
          credit: 0,
        },
        {
          accountHead: chargesCreditorLedger?.id || "creditors",
          accountLabel: "Razorpay Charges",
          debit: 0,
          credit: totalDeduction,
        },
      ],
      city: currentCity,
      cityId: currentCityId,
      createdBy: "System",
    }, currentCity);
    voucherNumbers.push(entry3.voucherNumber);

    // Entry 4 - Bank Settlement (Bank Dr, Razorpay Cr)
    const bankLedger = accountingEntryService.getLedgers(currentCityId)
      .find(l => l.name === "Axis Bank" && l.type === "bank");
    const entry4 = accountingEntryService.createJournal({
      date: settlementDate,
      narration: `Net settlement from Razorpay to Bank on ${settlementDate}`,
      lines: [
        {
          accountHead: bankLedger?.id || "bank",
          accountLabel: "Axis Bank",
          debit: netSettlement,
          credit: 0,
        },
        {
          accountHead: razorpayLedger?.id || "payment_gateway",
          accountLabel: "Razorpay",
          debit: 0,
          credit: netSettlement,
        },
      ],
      city: currentCity,
      cityId: currentCityId,
      createdBy: "System",
    }, currentCity);
    voucherNumbers.push(entry4.voucherNumber);

    // Entry 5 - Charges Closure (Razorpay Charges Dr, Razorpay Cr)
    const entry5 = accountingEntryService.createJournal({
      date: settlementDate,
      narration: `Razorpay charges deduction closure on ${settlementDate}`,
      lines: [
        {
          accountHead: chargesCreditorLedger?.id || "creditors",
          accountLabel: "Razorpay Charges",
          debit: totalDeduction,
          credit: 0,
        },
        {
          accountHead: razorpayLedger?.id || "payment_gateway",
          accountLabel: "Razorpay",
          debit: 0,
          credit: totalDeduction,
        },
      ],
      city: currentCity,
      cityId: currentCityId,
      createdBy: "System",
    }, currentCity);
    voucherNumbers.push(entry5.voucherNumber);

    // Save batch to history
    const batch: SettlementBatch = {
      id: `BATCH-${Date.now()}`,
      salesDate,
      settlementDate,
      customers: [...customers],
      totalSales,
      charges: parseFloat(charges),
      gstRate,
      gstAmount,
      totalDeduction,
      netSettlement,
      voucherNumbers,
      postedAt: new Date().toISOString(),
    };
    setBatches([batch, ...batches]);

    toast.success(
      `✅ Settlement posted successfully!\n\n5 entries created:\n${voucherNumbers.join("\n")}`,
      { duration: 6000 }
    );

    // Reset form
    setCurrentStep(1);
    setCustomers([]);
    setSalesDate(new Date().toISOString().split('T')[0]);
    setSettlementDate("");
    setCharges("");
    setActiveTab("history");
  };

  // Auto-calculate settlement date when sales date changes
  useState(() => {
    const sales = new Date(salesDate);
    sales.setDate(sales.getDate() + 3);
    setSettlementDate(sales.toISOString().split('T')[0]);
  });

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: "Sales Entry" },
      { num: 2, label: "Collection" },
      { num: 3, label: "Charges" },
      { num: 4, label: "Settlement" },
      { num: 5, label: "Confirm" },
    ];

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep === step.num
                    ? "bg-blue-600 text-white"
                    : currentStep > step.num
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {currentStep > step.num ? <CheckCircle2 className="w-5 h-5" /> : step.num}
              </div>
              <div className="text-xs mt-2 text-center font-medium">{step.label}</div>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 transition-colors ${
                  currentStep > step.num ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BackButton />
            <h2 className="text-2xl font-bold text-gray-900">Razorpay Settlement Flow</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Record the complete payment cycle: Sales → Collection → Charges → Settlement → Closure
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-sm">{currentCity}</span>
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <strong>Automated Accounting:</strong> This screen automates the 5 accounting entries for
          every Razorpay settlement batch. Each batch covers all subscriptions collected on a date,
          the Razorpay settlement 2–3 days later, and the charge deduction.
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="new">New Settlement Batch</TabsTrigger>
          <TabsTrigger value="history">Settlement History</TabsTrigger>
        </TabsList>

        {/* New Settlement Batch Tab */}
        <TabsContent value="new" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Settlement Wizard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStepIndicator()}

              {/* Step 1 - Sales Entry */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 1: Sales Entry</h3>
                  <p className="text-sm text-gray-600">
                    Record customers who bought subscriptions on this date.
                  </p>

                  <div>
                    <Label>Sales Date</Label>
                    <Input
                      type="date"
                      value={salesDate}
                      onChange={(e) => {
                        setSalesDate(e.target.value);
                        const sales = new Date(e.target.value);
                        sales.setDate(sales.getDate() + 3);
                        setSettlementDate(sales.toISOString().split('T')[0]);
                      }}
                    />
                  </div>

                  {/* Add Customer Form */}
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <h4 className="font-medium text-sm">Add Customer</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <input
                          className="border rounded px-2 py-1 text-sm w-full"
                          placeholder="Search customer..."
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                        />
                        <select
                          className="border rounded px-2 py-1 text-sm w-full"
                          onChange={e => {
                            const c = cityCustomers.find(x => x.customerId === e.target.value);
                            if (!c) return;
                            const sub = subscriptions.find(s => s.customerId === c.customerId && s.status === "Active");
                            setNewCustomerName(`${c.firstName} ${c.lastName}`);
                            setNewCustomerId(c.customerId);
                            if (sub) {
                              setNewPackage(sub.packageType || "Silver Monthly");
                              setNewPackageCode(sub.packageCode || "4W");
                              setNewAmount(sub.monthlyAmount?.toString() || "0");
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
                      </div>
                      <Select value={newPackageCode} onValueChange={setNewPackageCode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Package" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBSCRIPTION_PACKAGES.map((pkg) => (
                            <SelectItem key={pkg.code} value={pkg.code}>
                              {pkg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Amount (₹)"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                      />
                      <Button onClick={handleAddCustomer}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Customers Table */}
                  {customers.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Package</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customers.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">{c.customerName}</TableCell>
                              <TableCell>{c.packageName}</TableCell>
                              <TableCell className="text-right">₹{(c?.amount ?? 0).toLocaleString()}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveCustomer(c.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Total */}
                  {customers.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-lg font-semibold text-green-900">
                        Total Sales: ₹{totalSales.toLocaleString()} across {customers.length}{" "}
                        customer{customers.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}

                  {/* Journal Preview */}
                  {customers.length > 0 && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-sm mb-3">Journal Entry Preview:</h4>
                      <div className="space-y-1 text-sm font-mono">
                        {customers.map((c) => (
                          <div key={c.id} className="text-blue-600">
                            {c.customerName} (Debtors) Dr ₹{(c?.amount ?? 0).toLocaleString()}
                          </div>
                        ))}
                        {Object.entries(salesByPackage).map(([code, data]) => (
                          <div key={code} className="text-green-600 ml-8">
                            To Sales — {data.packageName} Cr ₹{(data?.total ?? 0).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 - Collection */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 2: Razorpay Collection Entry</h3>
                  <p className="text-sm text-gray-600">
                    Auto-generated from Step 1 data. This records payment collection via Razorpay.
                  </p>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-sm mb-3">Journal Entry:</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div className="text-blue-600">
                        Razorpay (Payment Gateway) Dr ₹{totalSales.toLocaleString()}
                      </div>
                      {customers.map((c) => (
                        <div key={c.id} className="text-green-600 ml-8">
                          To {c.customerName} Cr ₹{(c?.amount ?? 0).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Narration:</strong> Payment collected via Razorpay for{" "}
                    {customers.length} subscriptions on {salesDate}.
                  </div>
                </div>
              )}

              {/* Step 3 - Charges */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 3: Razorpay Charges</h3>
                  <p className="text-sm text-gray-600">
                    Enter the transaction charges and GST deducted by Razorpay.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Settlement Date</Label>
                      <Input
                        type="date"
                        value={settlementDate}
                        onChange={(e) => setSettlementDate(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Typically 2-3 days after sales date
                      </p>
                    </div>
                    <div>
                      <Label>Transaction Charges (₹)</Label>
                      <Input
                        type="number"
                        value={charges}
                        onChange={(e) => setCharges(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>GST Rate on Charges</Label>
                      <Select
                        value={String(gstRate)}
                        onValueChange={(val) => setGstRate(parseFloat(val))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>GST Amount</Label>
                      <Input value={`₹${gstAmount.toFixed(2)}`} disabled />
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-semibold text-red-900">
                      Total Deduction: ₹{totalDeduction.toFixed(2)}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-sm mb-3">Journal Entry Preview:</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div className="text-blue-600">
                        Transaction Charges (Expense) Dr ₹{parseFloat(charges || "0").toFixed(2)}
                      </div>
                      <div className="text-blue-600">
                        IGST (GST Input) Dr ₹{gstAmount.toFixed(2)}
                      </div>
                      <div className="text-green-600 ml-8">
                        To Razorpay Charges Cr ₹{totalDeduction.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 - Settlement */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 4: Bank Settlement</h3>
                  <p className="text-sm text-gray-600">
                    Auto-calculated net settlement and charge closure entries.
                  </p>

                  {/* Summary Card */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs text-gray-600">Total Collected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">₹{totalSales.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs text-gray-600">Razorpay Charges</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-red-600">
                          ₹{parseFloat(charges || "0").toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs text-gray-600">IGST on Charges</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-red-600">
                          ₹{gstAmount.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs text-green-700">Net to Bank</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-green-700">
                          ₹{netSettlement.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Journal Entries */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-sm mb-3">Entry 4A: Bank Settlement</h4>
                      <div className="space-y-1 text-sm font-mono">
                        <div className="text-blue-600">
                          Axis Bank Dr ₹{netSettlement.toFixed(2)}
                        </div>
                        <div className="text-green-600 ml-8">
                          To Razorpay Cr ₹{netSettlement.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-sm mb-3">Entry 4B: Charges Closure</h4>
                      <div className="space-y-1 text-sm font-mono">
                        <div className="text-blue-600">
                          Razorpay Charges Dr ₹{totalDeduction.toFixed(2)}
                        </div>
                        <div className="text-green-600 ml-8">
                          To Razorpay Cr ₹{totalDeduction.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5 - Confirm */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 5: Confirm & Post</h3>
                  <p className="text-sm text-gray-600">
                    Review all 5 journal entries before posting. These will be posted to the ledger.
                  </p>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Narration</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold">1</TableCell>
                          <TableCell>{salesDate}</TableCell>
                          <TableCell>Sales Entry - {customers.length} customers</TableCell>
                          <TableCell className="text-right">₹{totalSales.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">2</TableCell>
                          <TableCell>{salesDate}</TableCell>
                          <TableCell>Razorpay Collection</TableCell>
                          <TableCell className="text-right">₹{totalSales.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">3</TableCell>
                          <TableCell>{settlementDate}</TableCell>
                          <TableCell>Transaction Charges + GST</TableCell>
                          <TableCell className="text-right">₹{totalDeduction.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">4</TableCell>
                          <TableCell>{settlementDate}</TableCell>
                          <TableCell>Bank Settlement (Net)</TableCell>
                          <TableCell className="text-right">₹{netSettlement.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">5</TableCell>
                          <TableCell>{settlementDate}</TableCell>
                          <TableCell>Charges Closure</TableCell>
                          <TableCell className="text-right">₹{totalDeduction.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-900">
                      <strong>Final Check:</strong> Please verify all amounts before posting. This
                      action will create 5 journal entries and update ledger balances.
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < 5 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handlePostAll} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Post All Entries
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settlement History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Settlement History</CardTitle>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No settlement batches posted yet</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Settlement Date</TableHead>
                        <TableHead>Customers</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Charges</TableHead>
                        <TableHead className="text-right">Net to Bank</TableHead>
                        <TableHead>Vouchers</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => (
                        <>
                          <TableRow key={batch.id}>
                            <TableCell>{batch.settlementDate}</TableCell>
                            <TableCell>{batch.customers.length}</TableCell>
                            <TableCell className="text-right">
                              ₹{(batch?.totalSales ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{(batch?.totalDeduction ?? 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              ₹{(batch?.netSettlement ?? 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge>{batch.voucherNumbers.length} entries</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setExpandedBatch(
                                    expandedBatch === batch.id ? null : batch.id
                                  )
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedBatch === batch.id && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-gray-50 p-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm mb-3">
                                    Voucher Numbers:
                                  </h4>
                                  <div className="grid grid-cols-5 gap-2">
                                    {batch.voucherNumbers.map((vn, idx) => (
                                      <div
                                        key={idx}
                                        className="p-2 bg-white border rounded text-xs font-mono"
                                      >
                                        <div className="text-gray-500">Entry {idx + 1}</div>
                                        <div className="font-semibold">{vn}</div>
                                      </div>
                                    ))}
                                  </div>
                                  <h4 className="font-semibold text-sm mt-4 mb-2">
                                    Customers ({batch.customers.length}):
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {batch.customers.map((c) => (
                                      <div
                                        key={c.id}
                                        className="p-2 bg-white border rounded text-xs"
                                      >
                                        <div className="font-medium">{c.customerName}</div>
                                        <div className="text-gray-500">
                                          {c.packageName} - ₹{(c?.amount ?? 0).toLocaleString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RazorpayFlow;
