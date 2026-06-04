import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Play,
  History,
  Shield,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { toast } from "sonner";
import { BackButton } from "../ui/back-button";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  parentAccount: string | null;
  gstApplicable: boolean;
  tdsApplicable: boolean;
  balance: number;
  isActive: boolean;
  createdDate: string;
  children?: Account[];
}

interface AuditRecord {
  id: string;
  timestamp: string;
  auditedBy: string;
  role: string;
  status: "Balanced" | "Not Balanced";
  difference: number;
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    income: number;
    expenses: number;
  };
  accountSnapshot: Account[];
  notes: string;
}

// Complete Chart of Accounts following Indian accounting standards
const initialAccounts: Account[] = [
  // ASSETS
  {
    id: "1000",
    code: "1000",
    name: "Assets",
    type: "Header",
    category: "Assets",
    parentAccount: null,
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1100",
    code: "1100",
    name: "Bank Accounts",
    type: "Sub-Header",
    category: "Assets",
    parentAccount: "1000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1101",
    code: "1101",
    name: "HDFC Bank - Current Account",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1100",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 1250000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1102",
    code: "1102",
    name: "ICICI Bank - Current Account",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1100",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 850000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1200",
    code: "1200",
    name: "Cash in Hand",
    type: "Sub-Header",
    category: "Assets",
    parentAccount: "1000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1201",
    code: "1201",
    name: "Petty Cash",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 15000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1202",
    code: "1202",
    name: "Cash at Supervisors",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 45500,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1300",
    code: "1300",
    name: "Accounts Receivable",
    type: "Sub-Header",
    category: "Assets",
    parentAccount: "1000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1301",
    code: "1301",
    name: "Subscription Receivables",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1300",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 385000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1302",
    code: "1302",
    name: "Corporate Contract Receivables",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1300",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 245000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1400",
    code: "1400",
    name: "Fixed Assets",
    type: "Sub-Header",
    category: "Assets",
    parentAccount: "1000",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1401",
    code: "1401",
    name: "Washing Equipment & Machines",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1400",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 1850000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1402",
    code: "1402",
    name: "Vehicles",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1400",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 650000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1403",
    code: "1403",
    name: "Office Equipment & Furniture",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1400",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 285000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1500",
    code: "1500",
    name: "Security Deposits",
    type: "Sub-Header",
    category: "Assets",
    parentAccount: "1000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1501",
    code: "1501",
    name: "Office Rent Deposits",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1500",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 150000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1600",
    code: "1600",
    name: "Prepaid Expenses",
    type: "Sub-Header",
    category: "Assets",
    parentAccount: "1000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "1601",
    code: "1601",
    name: "Prepaid Insurance",
    type: "Ledger",
    category: "Assets",
    parentAccount: "1600",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 45000,
    isActive: true,
    createdDate: "2026-01-01",
  },

  // LIABILITIES
  {
    id: "2000",
    code: "2000",
    name: "Liabilities",
    type: "Header",
    category: "Liabilities",
    parentAccount: null,
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2100",
    code: "2100",
    name: "Accounts Payable",
    type: "Sub-Header",
    category: "Liabilities",
    parentAccount: "2000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2101",
    code: "2101",
    name: "Vendor Payables - Chemicals",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2100",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 185000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2102",
    code: "2102",
    name: "Vendor Payables - Equipment",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2100",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 285000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2200",
    code: "2200",
    name: "GST Payable",
    type: "Sub-Header",
    category: "Liabilities",
    parentAccount: "2000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2201",
    code: "2201",
    name: "CGST Payable",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 42500,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2202",
    code: "2202",
    name: "SGST Payable",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 42500,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2203",
    code: "2203",
    name: "IGST Payable",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 15200,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2300",
    code: "2300",
    name: "TDS Payable",
    type: "Sub-Header",
    category: "Liabilities",
    parentAccount: "2000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2301",
    code: "2301",
    name: "TDS on Contractor Payments",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2300",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 18500,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2302",
    code: "2302",
    name: "TDS on Professional Fees",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2300",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 12000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2400",
    code: "2400",
    name: "Loans & Borrowings",
    type: "Sub-Header",
    category: "Liabilities",
    parentAccount: "2000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2401",
    code: "2401",
    name: "Term Loan - HDFC Bank",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2400",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 1500000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2500",
    code: "2500",
    name: "Salary Payables",
    type: "Sub-Header",
    category: "Liabilities",
    parentAccount: "2000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2501",
    code: "2501",
    name: "Salary Payable - Wash Staff",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2500",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 285000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "2502",
    code: "2502",
    name: "Salary Payable - Admin Staff",
    type: "Ledger",
    category: "Liabilities",
    parentAccount: "2500",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 195000,
    isActive: true,
    createdDate: "2026-01-01",
  },

  // EQUITY
  {
    id: "3000",
    code: "3000",
    name: "Equity",
    type: "Header",
    category: "Equity",
    parentAccount: null,
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "3100",
    code: "3100",
    name: "Capital",
    type: "Ledger",
    category: "Equity",
    parentAccount: "3000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 5000000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "3200",
    code: "3200",
    name: "Retained Earnings",
    type: "Ledger",
    category: "Equity",
    parentAccount: "3000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 1250000,
    isActive: true,
    createdDate: "2026-01-01",
  },

  // INCOME
  {
    id: "4000",
    code: "4000",
    name: "Income",
    type: "Header",
    category: "Income",
    parentAccount: null,
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "4100",
    code: "4100",
    name: "Subscription Revenue",
    type: "Ledger",
    category: "Income",
    parentAccount: "4000",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 2850000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "4200",
    code: "4200",
    name: "Car Wash Service Revenue",
    type: "Ledger",
    category: "Income",
    parentAccount: "4000",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 1450000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "4300",
    code: "4300",
    name: "Add-on Services",
    type: "Ledger",
    category: "Income",
    parentAccount: "4000",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 385000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "4400",
    code: "4400",
    name: "Corporate Contracts",
    type: "Ledger",
    category: "Income",
    parentAccount: "4000",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 950000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "4500",
    code: "4500",
    name: "Franchise Fees",
    type: "Ledger",
    category: "Income",
    parentAccount: "4000",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 250000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "4600",
    code: "4600",
    name: "Other Income",
    type: "Ledger",
    category: "Income",
    parentAccount: "4000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 45000,
    isActive: true,
    createdDate: "2026-01-01",
  },

  // EXPENSES
  {
    id: "5000",
    code: "5000",
    name: "Expenses",
    type: "Header",
    category: "Expenses",
    parentAccount: null,
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5100",
    code: "5100",
    name: "Direct Expenses",
    type: "Sub-Header",
    category: "Expenses",
    parentAccount: "5000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5101",
    code: "5101",
    name: "Wash Staff Salaries",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5100",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 685000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5102",
    code: "5102",
    name: "Chemicals & Materials",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5100",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 285000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5103",
    code: "5103",
    name: "Electricity for Machines",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5100",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 125000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5104",
    code: "5104",
    name: "Water Consumption",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5100",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 85000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5105",
    code: "5105",
    name: "Equipment Maintenance",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5100",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 145000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5106",
    code: "5106",
    name: "Fuel & Transport",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5100",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 95000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5200",
    code: "5200",
    name: "Indirect Expenses",
    type: "Sub-Header",
    category: "Expenses",
    parentAccount: "5000",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 0,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5201",
    code: "5201",
    name: "Marketing",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 185000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5202",
    code: "5202",
    name: "Advertising",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 125000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5203",
    code: "5203",
    name: "Discounts to Customers",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 45000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5204",
    code: "5204",
    name: "Office Rent",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 150000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5205",
    code: "5205",
    name: "Software Subscriptions",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 35000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5206",
    code: "5206",
    name: "Internet",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: true,
    tdsApplicable: false,
    balance: 15000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5207",
    code: "5207",
    name: "Accounting Fees",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 45000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5208",
    code: "5208",
    name: "Legal Fees",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: true,
    tdsApplicable: true,
    balance: 65000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5209",
    code: "5209",
    name: "Admin Salaries",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 485000,
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5210",
    code: "5210",
    name: "HR Expenses",
    type: "Ledger",
    category: "Expenses",
    parentAccount: "5200",
    gstApplicable: false,
    tdsApplicable: false,
    balance: 85000,
    isActive: true,
    createdDate: "2026-01-01",
  },
];


// ── Persistence helpers (C1/C2/C3 fixes) ────────────────────────────────────
// Using namespaced localStorage directly (no DataService CHART_OF_ACCOUNTS key exists).
const COA_ACCOUNTS_KEY = "cleancar_coa_accounts_v1";
const COA_AUDIT_KEY    = "cleancar_coa_audit_history_v1";

function persistAccounts(accts: Account[]): void {
  try { localStorage.setItem(COA_ACCOUNTS_KEY, JSON.stringify(accts)); } catch {}
}
function loadPersistedAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(COA_ACCOUNTS_KEY);
    if (raw) { const p = JSON.parse(raw) as Account[]; if (p.length > 0) return p; }
  } catch {}
  return initialAccounts;
}
function persistAudit(history: AuditRecord[]): void {
  try { localStorage.setItem(COA_AUDIT_KEY, JSON.stringify(history)); } catch {}
}
function loadPersistedAudit(): AuditRecord[] {
  try {
    const raw = localStorage.getItem(COA_AUDIT_KEY);
    if (raw) return JSON.parse(raw) as AuditRecord[];
  } catch {}
  return [];
}

// ── Component ─────────────────────────────────────────────────────────────────
function ChartOfAccounts() {
  const { currentRole } = useRole();

  // C1 FIX: load from localStorage, fall back to initialAccounts on first visit
  const [accounts, setAccountsState] = useState<Account[]>(() => loadPersistedAccounts());

  // Wrapped setter that auto-persists on every change (C5 FIX)
  const setAccounts = (updater: Account[] | ((prev: Account[]) => Account[])) => {
    setAccountsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistAccounts(next);
      return next;
    });
  };

  const [searchTerm,       setSearchTerm]       = useState("");
  const [filterCategory,   setFilterCategory]   = useState("All");
  const [filterType,       setFilterType]       = useState("All");
  const [expandedNodes,    setExpandedNodes]    = useState<Set<string>>(new Set(["1000","2000","3000","4000","5000"]));
  const [isAddDialogOpen,  setIsAddDialogOpen]  = useState(false);
  const [editingAccount,   setEditingAccount]   = useState<Account | null>(null);

  // C2 FIX: load audit history from localStorage
  const [auditHistory, setAuditHistoryState] = useState<AuditRecord[]>(() => loadPersistedAudit());
  const setAuditHistory = (updater: AuditRecord[] | ((prev: AuditRecord[]) => AuditRecord[])) => {
    setAuditHistoryState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistAudit(next);
      return next;
    });
  };

  const [isAuditDialogOpen,   setIsAuditDialogOpen]   = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [auditNotes,          setAuditNotes]          = useState("");

  const [formData, setFormData] = useState({
    code: "", name: "", type: "Ledger", category: "Assets",
    parentAccount: "", gstApplicable: false, tdsApplicable: false,
  });

  const hasAccess   = ["Super Admin","Admin","Accounts"].includes(currentRole);
  const canRunAudit = ["Super Admin","Admin"].includes(currentRole);

  // C4 FIX: totals computed HERE (before runSystemAudit) so closure captures current values
  const totals = {
    assets:      accounts.filter(a => a.category === "Assets"      && a.type === "Ledger").reduce((s,a)=>s+a.balance,0),
    liabilities: accounts.filter(a => a.category === "Liabilities" && a.type === "Ledger").reduce((s,a)=>s+a.balance,0),
    equity:      accounts.filter(a => a.category === "Equity"      && a.type === "Ledger").reduce((s,a)=>s+a.balance,0),
    income:      accounts.filter(a => a.category === "Income"      && a.type === "Ledger").reduce((s,a)=>s+a.balance,0),
    expenses:    accounts.filter(a => a.category === "Expenses"    && a.type === "Ledger").reduce((s,a)=>s+a.balance,0),
  };
  const isBalanced    = totals.assets === (totals.liabilities + totals.equity);
  const difference    = totals.assets - (totals.liabilities + totals.equity);
  const absDifference = Math.abs(difference);

  // C4 FIX: runSystemAudit defined AFTER totals — closure now captures live values
  const runSystemAudit = () => {
    const rec: AuditRecord = {
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      auditedBy: currentRole === "Super Admin" ? "System Admin" : "Accounts Manager",
      role: currentRole,
      status: isBalanced ? "Balanced" : "Not Balanced",
      difference,
      totals: { ...totals },
      accountSnapshot: JSON.parse(JSON.stringify(accounts)),
      notes: auditNotes,
    };
    setAuditHistory(prev => [rec, ...prev]);   // C2 FIX: persists automatically
    setIsAuditDialogOpen(false);
    setAuditNotes("");
    toast.success(`System audit completed. Status: ${rec.status}`);
  };

  if (!hasAccess) {
    return (
      <div className="p-6">
        <BackButton to="/" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don{"'"}t have permission to access the Chart of Accounts.
              <br />Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const buildAccountHierarchy = (accounts: Account[]): Account[] => {
    const accountMap = new Map<string, Account>();
    const rootAccounts: Account[] = [];

    // First pass: create map
    accounts.forEach((account) => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Second pass: build hierarchy
    accounts.forEach((account) => {
      const node = accountMap.get(account.id)!;
      if (account.parentAccount === null) {
        rootAccounts.push(node);
      } else {
        const parent = accountMap.get(account.parentAccount);
        if (parent) {
          parent.children!.push(node);
        }
      }
    });

    return rootAccounts;
  };

  const renderAccountTree = (accounts: Account[], level: number = 0): JSX.Element[] => {
    return accounts.flatMap((account) => {
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedNodes.has(account.id);
      const indent = level * 24;

      const rows = [
        <TableRow key={account.id} className={level > 0 ? "bg-gray-50/50" : ""}>
          <TableCell style={{ paddingLeft: `${indent + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => toggleNode(account.id)}
                  className="hover:bg-gray-200 p-1 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              <span className={account.type === "Header" ? "font-bold" : account.type === "Sub-Header" ? "font-semibold" : ""}>
                {account.name}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{account.code}</code>
          </TableCell>
          <TableCell>
            <Badge variant="outline">{account.type}</Badge>
          </TableCell>
          <TableCell>
            <Badge
              variant={
                account.category === "Assets"
                  ? "default"
                  : account.category === "Liabilities"
                  ? "secondary"
                  : account.category === "Equity"
                  ? "outline"
                  : account.category === "Income"
                  ? "default"
                  : "secondary"
              }
            >
              {account.category}
            </Badge>
          </TableCell>
          <TableCell>
            {account.gstApplicable ? (
              <Badge className="bg-green-500">Yes</Badge>
            ) : (
              <Badge variant="outline">No</Badge>
            )}
          </TableCell>
          <TableCell>
            {account.tdsApplicable ? (
              <Badge className="bg-blue-500">Yes</Badge>
            ) : (
              <Badge variant="outline">No</Badge>
            )}
          </TableCell>
          <TableCell className="text-right font-medium">
            {account.type === "Ledger" ? `₹${(account?.balance ?? 0).toLocaleString("en-IN")}` : "—"}
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingAccount(account);
                  setFormData({
                    code: account.code,
                    name: account.name,
                    type: account.type,
                    category: account.category,
                    parentAccount: account.parentAccount || "",
                    gstApplicable: account.gstApplicable,
                    tdsApplicable: account.tdsApplicable,
                  });
                  setIsAddDialogOpen(true);
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              {account.type === "Ledger" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAccounts(accounts.filter((a) => a.id !== account.id));
                    toast.success("Account deleted successfully");
                  }}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      ];

      if (hasChildren && isExpanded) {
        rows.push(...renderAccountTree(account.children!, level + 1));
      }

      return rows;
    });
  };

  const handleAddAccount = () => {
    if (editingAccount) {
      // Update existing
      setAccounts(
        accounts.map((a) =>
          a.id === editingAccount.id
            ? {
                ...a,
                ...formData,
              }
            : a
        )
      );
      toast.success("Account updated successfully");
    } else {
      // Add new
      const newAccount: Account = {
        id: `${Date.now()}`,
        code: formData.code,
        name: formData.name,
        type: formData.type,
        category: formData.category,
        parentAccount: formData.parentAccount || null,
        gstApplicable: formData.gstApplicable,
        tdsApplicable: formData.tdsApplicable,
        balance: 0,
        isActive: true,
        createdDate: new Date().toISOString().split("T")[0],
      };
      setAccounts([...accounts, newAccount]);
      toast.success("Account added successfully");
    }
    setIsAddDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      code: "",
      name: "",
      type: "Ledger",
      category: "Assets",
      parentAccount: "",
      gstApplicable: false,
      tdsApplicable: false,
    });
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || account.category === filterCategory;
    const matchesType = filterType === "All" || account.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const accountHierarchy = buildAccountHierarchy(filteredAccounts);

  // Calculate totals by category

  // (totals, isBalanced, difference, absDifference already defined above — C4 fix)


  // Generate recommendations for unbalanced sheet
  const getRecommendations = () => {
    if (isBalanced) {
      return [];
    }

    const recommendations = [];

    // Recommendation 1: Check if it's P&L related
    const netProfitLoss = totals.income - totals.expenses;
    if (Math.abs(absDifference - Math.abs(netProfitLoss)) < 1) {
      recommendations.push({
        type: "profit-loss",
        severity: "high",
        title: "Profit & Loss Not Transferred to Balance Sheet",
        description: `Net ${netProfitLoss >= 0 ? 'Profit' : 'Loss'} of ₹${Math.abs(netProfitLoss).toLocaleString("en-IN")} needs to be transferred to Retained Earnings.`,
        action: "Transfer P&L balance to Retained Earnings account under Equity.",
        accounts: ["Retained Earnings", "P&L Account"],
      });
    }

    // Recommendation 2: Suspense account check
    if (difference > 0) {
      recommendations.push({
        type: "excess-assets",
        severity: "high",
        title: "Assets Exceed Liabilities + Equity",
        description: `Assets are higher by ₹${absDifference.toLocaleString("en-IN")}. This indicates missing liability or equity entries.`,
        action: "Create a 'Suspense Account' under Equity to temporarily hold the difference, then investigate and reclassify.",
        accounts: ["Suspense Account - Temporary"],
      });
    } else {
      recommendations.push({
        type: "excess-liabilities",
        severity: "high",
        title: "Liabilities + Equity Exceed Assets",
        description: `Liabilities + Equity are higher by ₹${absDifference.toLocaleString("en-IN")}. This indicates missing asset entries or overstated liabilities.`,
        action: "Create a 'Suspense Account' under Assets to temporarily hold the difference, then investigate source transactions.",
        accounts: ["Suspense Account - Debit Balance"],
      });
    }

    // Recommendation 3: Common causes
    recommendations.push({
      type: "common-errors",
      severity: "medium",
      title: "Common Causes to Investigate",
      description: "Review these typical scenarios that cause imbalance:",
      action: "Check the following:",
      accounts: [
        "• Unrecorded bank reconciliation items",
        "• Opening balance entries not completed",
        "• Pending GST input/output entries",
        "• Unclaimed expense reimbursements",
        "• Depreciation not posted",
        "• Provisions not created (salary, bonus, etc.)",
      ],
    });

    // Recommendation 4: Audit trail
    recommendations.push({
      type: "audit",
      severity: "low",
      title: "Run Account-Level Verification",
      description: "Perform detailed audit of each account category:",
      action: "Verify balances with source documents:",
      accounts: [
        "• Bank Accounts → Bank statements",
        " Debtors/Creditors → Ledger reconciliation",
        "• Inventory → Stock reports",
        "• Fixed Assets → Asset register",
        "• Loans → Loan statements",
        "• Capital → Investment documents",
      ],
    });

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete account hierarchy following Indian accounting standards
          </p>
        </div>
        <div className="flex gap-2">
          {canRunAudit && (
            <>
              <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-500 text-blue-700 hover:bg-blue-50">
                    <Shield className="w-4 h-4 mr-2" />
                    Run System Audit
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      System Audit Confirmation
                    </DialogTitle>
                    <DialogDescription>
                      This will create a timestamped snapshot of the current Chart of Accounts and Balance Sheet status. Only Super Admin and Admin roles can authorize this action.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-blue-900 mb-2">Current Status Summary:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Assets:</span>
                          <span className="font-semibold ml-2">₹{(totals?.assets ?? 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Liabilities:</span>
                          <span className="font-semibold ml-2">₹{(totals?.liabilities ?? 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Equity:</span>
                          <span className="font-semibold ml-2">₹{(totals?.equity ?? 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Balance Status:</span>
                          {isBalanced ? (
                            <Badge className="bg-green-500 ml-2">Balanced</Badge>
                          ) : (
                            <Badge className="bg-red-500 ml-2">Not Balanced</Badge>
                          )}
                        </div>
                      </div>
                      {!isBalanced && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Difference:</span>
                          <span className="font-semibold text-red-700 ml-2">₹{absDifference.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="auditNotes">Audit Notes (Optional)</Label>
                      <textarea
                        id="auditNotes"
                        className="w-full mt-1 p-2 border rounded-md min-h-[80px]"
                        placeholder="Add any notes or comments about this audit (e.g., 'Monthly closing audit', 'Pre-GST filing verification', etc.)"
                        value={auditNotes}
                        onChange={(e) => setAuditNotes(e.target.value)}
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <strong>Important:</strong> This action will create a permanent record in the audit history. The snapshot cannot be deleted or modified after creation.
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsAuditDialogOpen(false); setAuditNotes(""); }}>
                      Cancel
                    </Button>
                    <Button onClick={runSystemAudit} className="bg-blue-600 hover:bg-blue-700">
                      <Play className="w-4 h-4 mr-2" />
                      Confirm & Run Audit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsHistoryDialogOpen(true)}
                className="border-purple-500 text-purple-700 hover:bg-purple-50"
              >
                <History className="w-4 h-4 mr-2" />
                View History ({auditHistory.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                setEditingAccount(null);
                setFormData({
                  code: "",
                  name: "",
                  type: "Ledger",
                  category: "Assets",
                  parentAccount: "",
                  gstApplicable: false,
                  tdsApplicable: false,
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
                <DialogDescription>
                  {editingAccount ? "Update account details" : "Create a new account in the chart of accounts"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Account Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., 1101"
                  />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., HDFC Bank - Current Account"
                  />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Header">Header</SelectItem>
                      <SelectItem value="Sub-Header">Sub-Header</SelectItem>
                      <SelectItem value="Ledger">Ledger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assets">Assets</SelectItem>
                      <SelectItem value="Liabilities">Liabilities</SelectItem>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expenses">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Parent Account</Label>
                  <Select value={formData.parentAccount} onValueChange={(value) => setFormData({ ...formData, parentAccount: value === "none" ? "" : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent account (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Root Level)</SelectItem>
                      {accounts.filter(a => a.type !== "Ledger").map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="gst"
                    checked={formData.gstApplicable}
                    onChange={(e) => setFormData({ ...formData, gstApplicable: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="gst">GST Applicable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tds"
                    checked={formData.tdsApplicable}
                    onChange={(e) => setFormData({ ...formData, tdsApplicable: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="tds">TDS Applicable</Label>
                </div>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccount}>
                  {editingAccount ? "Update Account" : "Add Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Assets</div>
            <div className="text-2xl font-bold text-green-600">
              ₹{(totals?.assets ?? 0).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Liabilities</div>
            <div className="text-2xl font-bold text-red-600">
              ₹{(totals?.liabilities ?? 0).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Equity</div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{(totals?.equity ?? 0).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Income</div>
            <div className="text-2xl font-bold text-green-600">
              ₹{(totals?.income ?? 0).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Expenses</div>
            <div className="text-2xl font-bold text-orange-600">
              ₹{(totals?.expenses ?? 0).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search accounts by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Assets">Assets</SelectItem>
                <SelectItem value="Liabilities">Liabilities</SelectItem>
                <SelectItem value="Equity">Equity</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Expenses">Expenses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Header">Header</SelectItem>
                <SelectItem value="Sub-Header">Sub-Header</SelectItem>
                <SelectItem value="Ledger">Ledger</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Account Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>TDS</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountHierarchy.length > 0 ? (
                  renderAccountTree(accountHierarchy)
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No accounts found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Balance Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Assets Side</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Assets</span>
                  <span className="font-medium">₹{(totals?.assets ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="border-t mt-2 pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{(totals?.assets ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Liabilities & Equity Side</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Liabilities</span>
                  <span className="font-medium">₹{(totals?.liabilities ?? 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equity</span>
                  <span className="font-medium">₹{(totals?.equity ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="border-t mt-2 pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{(totals.liabilities + totals.equity).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`mt-4 p-4 border-2 rounded-lg ${isBalanced ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isBalanced ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Balance Verification:</span>
                  {isBalanced ? (
                    <Badge className="bg-green-500 text-white">✓ Books are Balanced</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white">✗ Books Not Balanced</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {isBalanced ? (
                    <>Assets = Liabilities + Equity (Perfect Balance!)</>
                  ) : (
                    <>Difference: <span className="font-semibold text-red-700">₹{absDifference.toLocaleString("en-IN")}</span> ({difference > 0 ? 'Assets Excess' : 'Liabilities + Equity Excess'})</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Section - Only shows when not balanced */}
      {!isBalanced && recommendations.length > 0 && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Info className="w-5 h-5" />
              Recommendations to Balance Your Books
            </CardTitle>
            <p className="text-sm text-orange-700 mt-1">
              Follow these steps to identify and rectify the imbalance of ₹{absDifference.toLocaleString("en-IN")}
            </p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-l-4 ${
                  rec.severity === 'high' ? 'bg-red-50 border-red-500' :
                  rec.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {rec.severity === 'high' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                  {rec.severity === 'medium' && <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                  {rec.severity === 'low' && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={
                          rec.severity === 'high' ? 'border-red-500 text-red-700' :
                          rec.severity === 'medium' ? 'border-yellow-500 text-yellow-700' :
                          'border-blue-500 text-blue-700'
                        }
                      >
                        {rec.severity.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    
                    <div className="bg-white bg-opacity-60 rounded p-3 mt-3">
                      <div className="text-sm font-medium text-gray-800 mb-2">
                        ✓ Action Required:
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{rec.action}</div>
                      
                      {rec.accounts && rec.accounts.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-600 mb-1">Accounts to Check:</div>
                          <div className="text-sm text-gray-700 space-y-0.5">
                            {rec.accounts.map((acc, accIndex) => (
                              <div key={accIndex} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-0.5">→</span>
                                <span>{acc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Audit History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              System Audit History
            </DialogTitle>
            <DialogDescription>
              View all previous system audits and compare account snapshots
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {auditHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500 text-lg font-semibold">No Audit History Available</div>
                <p className="text-sm text-gray-400 mt-2">
                  Run your first system audit to create a historical record
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditHistory.map((audit) => (
                  <Card key={audit.id} className={`border-2 ${audit.status === "Balanced" ? "border-green-200" : "border-red-200"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          {audit.status === "Balanced" ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{audit.id}</h4>
                              {audit.status === "Balanced" ? (
                                <Badge className="bg-green-500">Balanced</Badge>
                              ) : (
                                <Badge className="bg-red-500">Not Balanced</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div><strong>Timestamp:</strong> {new Date(audit.timestamp).toLocaleString("en-IN", { 
                                dateStyle: "medium", 
                                timeStyle: "short" 
                              })}</div>
                              <div><strong>Audited By:</strong> {audit.auditedBy} ({audit.role})</div>
                              {audit.notes && (
                                <div className="mt-2 p-2 bg-gray-50 rounded border text-gray-700">
                                  <strong>Notes:</strong> {audit.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3 mb-3">
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">Assets</div>
                          <div className="font-semibold text-green-700">
                            ₹{(audit?.totals?.assets ?? 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">Liabilities</div>
                          <div className="font-semibold text-red-700">
                            ₹{(audit?.totals?.liabilities ?? 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">Equity</div>
                          <div className="font-semibold text-blue-700">
                            ₹{(audit?.totals?.equity ?? 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">Income</div>
                          <div className="font-semibold text-purple-700">
                            ₹{(audit?.totals?.income ?? 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded p-3">
                          <div className="text-xs text-gray-600 mb-1">Expenses</div>
                          <div className="font-semibold text-orange-700">
                            ₹{(audit?.totals?.expenses ?? 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {audit.status === "Not Balanced" && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                          <strong className="text-red-900">Difference:</strong>{" "}
                          <span className="font-semibold text-red-700">
                            ₹{Math.abs(audit.difference).toLocaleString("en-IN")}
                          </span>{" "}
                          <span className="text-gray-600">
                            ({audit.difference > 0 ? "Assets Excess" : "Liabilities + Equity Excess"})
                          </span>
                        </div>
                      )}

                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                          View Complete Account Snapshot ({audit.accountSnapshot.filter(a => a.type === "Ledger").length} Ledger Accounts)
                        </summary>
                        <div className="mt-3 border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Account Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {audit.accountSnapshot
                                .filter(a => a.type === "Ledger")
                                .sort((a, b) => a.code.localeCompare(b.code))
                                .map((account) => (
                                  <TableRow key={account.id}>
                                    <TableCell>
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{account.code}</code>
                                    </TableCell>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{account.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      ₹{(account?.balance ?? 0).toLocaleString("en-IN")}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChartOfAccounts;
