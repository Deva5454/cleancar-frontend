// Create Salary Structure with Auto-Calculation
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { BackButton } from "../ui/back-button";
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
import { Save, Trash2, Eye, Edit, AlertCircle, Calculator, FileText, Settings, Plus, X, Database, Award, Download } from "lucide-react";
import { toast } from "sonner";
import { salaryStructureService, SalaryStructure } from "../../services/salaryStructureService";
import type { SalaryComponents } from "../../services/salaryStructureService";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { useRole } from "../../contexts/RoleContext";

// Interface for custom salary components
interface CustomComponent {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "slab" | "manual";
  value: number;
  baseOn?: "basic" | "gross" | "pf_gross" | "esic_gross" | "tds"; // For percentage types
  manualValue?: number; // For manual input components like TDS
  isStatutory?: boolean; // Marks statutory components
  tooltip?: string; // Explanation text
  category?: "taxation" | "statutory" | "standard"; // For UI grouping
  conditionalOn?: string; // ID of component this depends on
  monthlyApplicable?: number[]; // Months when this applies (1-12), for LWF
}

const ROLES = [
  { id: "ROLE-001", name: "Operations Manager" },
  { id: "ROLE-002", name: "Sales Executive" },
  { id: "ROLE-003", name: "Finance Manager" },
  { id: "ROLE-004", name: "HR Coordinator" },
  { id: "ROLE-005", name: "Car Washer" },
  { id: "ROLE-006", name: "Supervisor" },
  { id: "ROLE-007", name: "Tele Sales Executive" },
];

export function CreateSalaryStructure() {

  const [inputMode, setInputMode] = useState<"monthly" | "annual">("monthly");
  const [basicSalary, setBasicSalary] = useState<string>("");
  const [isMetro, setIsMetro] = useState<boolean>(true);
  const [applyPFCap, setApplyPFCap] = useState<boolean>(true);
  const [shiftType, setShiftType] = useState<string>("full_time");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [structureName, setStructureName] = useState<string>("");
  const [components, setComponents] = useState<SalaryComponents | null>(null);
  const [savedStructures, setSavedStructures] = useState<SalaryStructure[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uploadRef] = useState(() => ({ current: null as HTMLInputElement | null }));
  const [isUploading, setIsUploading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState<SalaryStructure | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>("");
  const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [validTill, setValidTill] = useState<string>('');

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Compliance state
  const [selectedState, setSelectedState] = useState<string>("Gujarat");
  const [enableComplianceValidation, setEnableComplianceValidation] = useState<boolean>(false); // DISABLED BY DEFAULT

  const { currentRole } = useRole();

  // HR, Super Admin, and Admin can edit all statutory deduction fields:
  // PF, ESIC, LWF, Professional Tax, TDS, and Surcharge.
  const canEditStatutory = currentRole === "HR" || currentRole === "Super Admin" || currentRole === "Admin";

  // STEP 3 - Simple validation functions (no complex logic) - WITH ERROR HANDLING
  const getValidationError = (componentId: string, value: number, type: string): string | null => {
    if (!enableComplianceValidation) return null; // DISABLED
    try {
      if (componentId === "pf" && value > 12) {
        return "PF cannot exceed 12%";
      }
      if (componentId === "esic" && value > 0.75) {
        return "ESIC cannot exceed 0.75%";
      }
      if (componentId === "lwf_emp" && type === "percentage") {
        return "LWF must be fixed amount";
      }
      return null;
    } catch (error) {
      console.error("Validation error:", error);
      return null;
    }
  };

  // STEP 4 - Check if any errors exist - WITH ERROR HANDLING
  const hasAnyErrors = (): boolean => {
    if (!enableComplianceValidation) return false; // DISABLED
    try {
      if (!customDeductions || !Array.isArray(customDeductions)) {
        return false;
      }
      for (const comp of customDeductions) {
        if (!comp) continue;
        const error = getValidationError(comp.id || "", comp.value || 0, comp.type || "");
        if (error) return true;
      }
      return false;
    } catch (error) {
      console.error("hasAnyErrors error:", error);
      return false;
    }
  };

  // Custom components state
  const [customEarnings, setCustomEarnings] = useState<CustomComponent[]>([
    { id: "hra", name: "HRA", type: "percentage", value: 50, baseOn: "basic" },
    { id: "conveyance", name: "Conveyance Allowance", type: "fixed", value: 1600 },
    { id: "medical", name: "Medical Allowance", type: "fixed", value: 1250 },
    { id: "special", name: "Special Allowance", type: "percentage", value: 20, baseOn: "basic" },
  ]);
  const [customDeductions, setCustomDeductions] = useState<CustomComponent[]>([
    {
      id: "pf",
      name: "Employee PF",
      type: "percentage",
      value: 12,
      baseOn: "pf_gross",
      isStatutory: true,
      category: "statutory",
      tooltip: "12% of PF Gross (Basic + DA + Retaining Allowance, capped at ₹15,000)"
    },
    {
      id: "esic",
      name: "Employee ESIC",
      type: "percentage",
      value: 0.75,
      baseOn: "esic_gross",
      isStatutory: true,
      category: "statutory",
      tooltip: "0.75% of ESIC Gross (Total Monthly Gross, applicable only if ≤ ₹21,000)"
    },
    {
      id: "pt",
      name: "Professional Tax",
      type: "slab",
      value: 0,
      isStatutory: true,
      category: "taxation",
      tooltip: "Auto-calculated based on State Slabs (e.g., ₹200 for Gross ≥ ₹12,000)"
    },
    {
      id: "lwf_emp",
      name: "LWF (Employee)",
      type: "fixed",
      value: 6,
      isStatutory: true,
      category: "statutory",
      monthlyApplicable: [6, 12], // June and December only
      tooltip: "₹6.00 (Gujarat Standard - Half Yearly, deducted in June and December)"
    },
    {
      id: "tds",
      name: "TDS (Income Tax)",
      type: "manual",
      value: 0,
      manualValue: 0,
      isStatutory: true,
      category: "taxation",
      tooltip: "Manual Input based on estimated annual tax liability"
    },
    {
      id: "surcharge",
      name: "Surcharge",
      type: "percentage",
      value: 10,
      baseOn: "tds",
      isStatutory: true,
      category: "taxation",
      conditionalOn: "tds",
      tooltip: "Only applicable if TDS > ₹50 Lakhs annually (calculated on TDS amount)"
    },
  ]);
  const [customEmployerContributions, setCustomEmployerContributions] = useState<CustomComponent[]>([
    {
      id: "empf",
      name: "Employer PF",
      type: "percentage",
      value: 12,
      baseOn: "pf_gross",
      isStatutory: true,
      category: "statutory",
      tooltip: "12% of PF Gross (Basic + DA + Retaining Allowance)"
    },
    {
      id: "emesic",
      name: "Employer ESIC",
      type: "percentage",
      value: 3.25,
      baseOn: "esic_gross",
      isStatutory: true,
      category: "statutory",
      tooltip: "3.25% of ESIC Gross (Total Monthly Gross, applicable only if ≤ ₹21,000)"
    },
    {
      id: "lwf_employer",
      name: "LWF (Employer)",
      type: "fixed",
      value: 12,
      isStatutory: true,
      category: "statutory",
      monthlyApplicable: [6, 12], // June and December only
      tooltip: "₹12.00 (Gujarat Standard - Half Yearly, deducted in June and December)"
    },
  ]);

  // Load saved structures on mount and subscribe to changes
  useEffect(() => {
    setSavedStructures(salaryStructureService.getAll());
    
    const unsubscribe = salaryStructureService.subscribe((structures) => {
      setSavedStructures(structures);
    });

    return unsubscribe;
  }, []);

  // Calculate PT based on gross
  // ✅ FIXED: Gujarat PT slabs — max ₹200 (was wrong: ₹175 slab and ₹300 max)
  const calculatePT = (gross: number): number => {
    if (gross < 6000)  return 0;    // ₹0-₹5,999
    if (gross < 9000)  return 80;   // ₹6,000-₹8,999
    if (gross < 12000) return 150;  // ₹9,000-₹11,999
    return 200;                     // ₹12,000+ → Gujarat max ₹200
  };

  // Get PT slab label
  const getPTSlabLabel = (gross: number): string => {
    if (gross < 6000)  return "₹0 (Gross < ₹6,000)";
    if (gross < 9000)  return "₹80 (₹6,000-₹8,999)";
    if (gross < 12000) return "₹150 (₹9,000-₹11,999)";
    return "₹200 (Gross ≥ ₹12,000) — Gujarat max";
  };

  // Helper function to calculate component value
  const calculateComponentValue = (
    component: CustomComponent,
    basic: number,
    gross: number,
    tdsValue: number = 0
  ): number => {
    // Check month-based applicability (for LWF)
    if (component.monthlyApplicable && !component.monthlyApplicable.includes(currentMonth)) {
      return 0;
    }

    // Handle different component types
    switch (component.type) {
      case "fixed":
        const shiftProrationFactor = shiftType === "full_time" ? 1.0 : 0.5;
        return component.value * shiftProrationFactor;

      case "manual":
        return component.manualValue || 0;

      case "slab":
        // For Professional Tax slab calculation
        if (component.id === "pt") {
          return calculatePT(gross);
        }
        return 0;

      case "percentage":
        // Determine the base amount
        let base = 0;
        switch (component.baseOn) {
          case "basic":
            base = basic;
            break;
          case "pf_gross":
            // PF Gross = Basic + DA + Retaining Allowance
            // For now, we'll use Basic as DA and Retaining Allowance aren't defined
            // TODO: Add DA and Retaining Allowance components if needed
            base = basic;
            break;
          case "esic_gross":
            // ESIC Gross = Total Monthly Gross (all cash components)
            base = gross;
            break;
          case "tds":
            base = tdsValue;
            break;
          case "gross":
          default:
            base = gross;
            break;
        }
        return (base * component.value) / 100;

      default:
        return 0;
    }
  };

  // Auto-calculate salary components from Basic Salary
  const calculateComponents = (basic: number): SalaryComponents => {
    // Apply shift-based proration to basic
    const shiftProrationFactor = shiftType === "full_time" ? 1.0 : 0.5;
    const proratedBasic = basic * shiftProrationFactor;

    // Calculate earnings (initially without HRA to get initial gross)
    let earningsTotal = proratedBasic;

    // First pass: calculate all earnings components
    const earningsBreakdown: Record<string, number> = {};
    customEarnings.forEach(comp => {
      // For first pass, use basic as base for all percentage calculations
      const value = calculateComponentValue(comp, proratedBasic, proratedBasic);
      earningsBreakdown[comp.id] = value;
      earningsTotal += value;
    });

    const gross = earningsTotal;

    // Calculate deductions
    let deductionsTotal = 0;
    const deductionsBreakdown: Record<string, number> = {};

    // First pass: calculate TDS (needed for surcharge)
    let tdsValue = 0;
    const tdsComp = customDeductions.find(c => c.id === "tds");
    if (tdsComp) {
      tdsValue = tdsComp.manualValue || 0;
      deductionsBreakdown.tds = tdsValue;
      deductionsTotal += tdsValue;
    }

    // Second pass: calculate all other deductions
    customDeductions.forEach(comp => {
      // Skip TDS (already calculated) and PT (calculated via slab)
      if (comp.id === "tds") return;

      // Check conditional components (e.g., Surcharge depends on TDS)
      if (comp.conditionalOn === "tds" && tdsValue === 0) {
        deductionsBreakdown[comp.id] = 0;
        return;
      }

      let value = calculateComponentValue(comp, proratedBasic, gross, tdsValue);

      // Apply PF cap if enabled
      if (comp.id === "pf" && applyPFCap) {
        const pfCap = 1800;
        value = Math.min(value, pfCap);
      }

      // ESIC only applicable if gross <= 21000
      if (comp.id === "esic" && gross > 21000) {
        value = 0;
      }

      // Surcharge only applicable if annual TDS > 50 lakhs
      if (comp.id === "surcharge" && (tdsValue * 12) <= 5000000) {
        value = 0;
      }

      deductionsBreakdown[comp.id] = value;
      deductionsTotal += value;
    });

    // Professional Tax is auto-calculated from slab (already included in deductions via PT component)
    const professionalTax = deductionsBreakdown.pt || calculatePT(gross);

    // Calculate employer contributions
    let employerCostTotal = 0;
    const employerBreakdown: Record<string, number> = {};

    customEmployerContributions.forEach(comp => {
      let value = calculateComponentValue(comp, proratedBasic, gross);

      // Apply PF cap if enabled
      if (comp.id === "empf" && applyPFCap) {
        const pfCap = 1800;
        value = Math.min(value, pfCap);
      }

      // ESIC only applicable if gross <= 21000
      if (comp.id === "emesic" && gross > 21000) {
        value = 0;
      }

      employerBreakdown[comp.id] = value;
      employerCostTotal += value;
    });

    const netTakeHome = gross - deductionsTotal;
    const totalCTC = gross + employerCostTotal;

    return {
      monthlyGross: gross,
      annualCTC: totalCTC * 12,
      basic: proratedBasic,
      hra: earningsBreakdown.hra || 0,
      conveyance: earningsBreakdown.conveyance || 0,
      medical: earningsBreakdown.medical || 0,
      specialAllowance: earningsBreakdown.special || 0,
      employeePF: deductionsBreakdown.pf || 0,
      employerPF: employerBreakdown.empf || 0,
      employeeESIC: deductionsBreakdown.esic || 0,
      employerESIC: employerBreakdown.emesic || 0,
      professionalTax,
      totalDeductions: deductionsTotal,
      netTakeHome,
      totalEmployerCost: employerCostTotal,
      totalCTC,
      // Legacy fields for backwards compatibility
      gross,
      pf: deductionsBreakdown.pf || 0,
      esic: deductionsBreakdown.esic || 0,
    };
  };

  // Update components when inputs change
  useEffect(() => {
    const basic = parseFloat(basicSalary);
    if (!isNaN(basic) && basic > 0) {
      setComponents(calculateComponents(basic));
    } else {
      setComponents(null);
    }
  }, [basicSalary, isMetro, applyPFCap, shiftType, currentMonth, customEarnings, customDeductions, customEmployerContributions]);

  // Component management functions
  const addCustomComponent = (category: "earnings" | "deductions" | "employer") => {
    const newComponent: CustomComponent = {
      id: Date.now().toString(),
      name: "",
      type: "fixed",
      value: 0,
    };

    if (category === "earnings") {
      setCustomEarnings([...customEarnings, newComponent]);
    } else if (category === "deductions") {
      setCustomDeductions([...customDeductions, newComponent]);
    } else {
      setCustomEmployerContributions([...customEmployerContributions, newComponent]);
    }
  };

  const removeCustomComponent = (category: "earnings" | "deductions" | "employer", id: string) => {
    if (category === "earnings") {
      setCustomEarnings(customEarnings.filter(c => c.id !== id));
    } else if (category === "deductions") {
      setCustomDeductions(customDeductions.filter(c => c.id !== id));
    } else {
      setCustomEmployerContributions(customEmployerContributions.filter(c => c.id !== id));
    }
  };

  const updateCustomComponent = (
    category: "earnings" | "deductions" | "employer",
    id: string,
    updates: Partial<CustomComponent>
  ) => {
    const updateArray = (arr: CustomComponent[]) =>
      arr.map(c => c.id === id ? { ...c, ...updates } : c);

    if (category === "earnings") {
      setCustomEarnings(updateArray(customEarnings));
    } else if (category === "deductions") {
      setCustomDeductions(updateArray(customDeductions));
    } else {
      setCustomEmployerContributions(updateArray(customEmployerContributions));
    }
  };

  const handleSave = () => {
    if (!selectedRole || !components) {
      toast.error("Please select a role and enter salary details");
      return;
    }

    if (!structureName || structureName.trim() === "") {
      toast.error("Please enter a structure name");
      return;
    }

    const role = ROLES.find((r) => r.id === selectedRole);
    if (!role) return;

    // Use the service to save
    const saved = salaryStructureService.add({
      roleId: selectedRole,
      roleName: role.name,
      structureName: structureName.trim(),
      monthlyGross: components.monthlyGross,
      basicSalary: components ? components.basic : parseFloat(basicSalary),
      shiftType: shiftType as "full_time" | "part_time",
      components,
      isMetro,
      applyPFCap,
      createdBy: "Priya Mehta",
      validFrom,
      validTill,
      isActive: true,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    const shiftLabel = shiftType === "part_time" ? " (Part-Time, prorated)" : "";
    toast.success(`✅ Salary structure saved!\n\n${structureName}\n${role.name}\nBasic: ₹${(components?.basic ?? 0).toLocaleString()}${shiftLabel} • Gross: ₹${(components?.monthlyGross ?? 0).toLocaleString()}`);

    // Reset form
    setSelectedRole("");
    setStructureName("");
    setBasicSalary("");
    setComponents(null);
    setValidFrom(new Date().toISOString().split('T')[0]);
    setValidTill('');
  };

  const handleDelete = (id: string) => {
    const structure = savedStructures.find(s => s.id === id);
    if (!structure) return;

    const structureDisplayName = structure.structureName || structure.roleName;
    setConfirmState({
      open: true,
      title: "Delete Salary Structure",
      description: `Are you sure you want to delete the salary structure "${structureDisplayName}"?`,
      onConfirm: () => {
        const deleted = salaryStructureService.delete(id);
        if (deleted) {
          toast.success(`🗑️ Salary structure "${structureDisplayName}" deleted successfully`);
        } else {
          toast.error("Failed to delete salary structure");
        }
        setConfirmState(s => ({ ...s, open: false }));
      }
    });
  };

  const handleToggleActive = (id: string) => {
    const structure = savedStructures.find(s => s.id === id);
    if (!structure) return;
    const updated = salaryStructureService.update(id, { isActive: !structure.isActive });
    if (updated) {
      setSavedStructures(salaryStructureService.getAll());
      toast.success(
        structure.isActive
          ? `"${structure.structureName || 'Structure'}" set to Inactive`
          : `"${structure.structureName || 'Structure'}" set to Active`
      );
    }
  };

  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) {
          toast.error("File must have a header row and at least one data row");
          setIsUploading(false);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        let imported = 0;
        let skipped = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || "0"; });

          const structureName = row["Structure Name"] || row["structureName"];
          const roleName = row["Role"] || row["roleName"];
          const basicSalary = parseFloat(row["Basic Salary"] || row["basic"] || "0");
          const monthlyGross = parseFloat(row["Monthly Gross"] || row["monthlyGross"] || "0");
          const today = new Date().toISOString().split('T')[0];
          const validFrom = row["Valid From"] || row["validFrom"] || today;
          const validTill = row["Valid Till"] || row["validTill"] || '';

          if (!structureName || !roleName || !monthlyGross) {
            skipped++;
            continue;
          }

          const components: SalaryComponents = {
            monthlyGross,
            annualCTC: parseFloat(row["Annual CTC"] || row["annualCTC"] || "0") || monthlyGross * 12,
            basic: basicSalary,
            hra: parseFloat(row["HRA"] || row["hra"] || "0"),
            conveyance: parseFloat(row["Conveyance"] || row["conveyance"] || "1600"),
            medical: parseFloat(row["Medical"] || row["medical"] || "1250"),
            specialAllowance: parseFloat(row["Special Allowance"] || row["specialAllowance"] || "0"),
            employeePF: parseFloat(row["Employee PF"] || row["employeePF"] || "0"),
            employerPF: parseFloat(row["Employer PF"] || row["employerPF"] || "0"),
            employeeESIC: parseFloat(row["Employee ESIC"] || row["employeeESIC"] || "0"),
            employerESIC: parseFloat(row["Employer ESIC"] || row["employerESIC"] || "0"),
            professionalTax: parseFloat(row["Professional Tax"] || row["professionalTax"] || "200"),
            totalDeductions: parseFloat(row["Total Deductions"] || row["totalDeductions"] || "0"),
            netTakeHome: parseFloat(row["Net Take Home"] || row["netTakeHome"] || "0"),
            totalEmployerCost: parseFloat(row["Total Employer Cost"] || row["totalEmployerCost"] || "0"),
            totalCTC: parseFloat(row["Total CTC"] || row["totalCTC"] || "0") || monthlyGross * 12,
          };

          salaryStructureService.add({
            roleId: `ROLE-${roleName.toUpperCase().replace(/\s/g, "-")}`,
            roleName,
            structureName,
            monthlyGross,
            basicSalary,
            shiftType: (row["Shift Type"] || "full_time") as "full_time" | "part_time",
            components,
            isMetro: (row["Location"] || "Metro").toLowerCase().includes("metro"),
            applyPFCap: (row["PF Cap"] || "Yes").toLowerCase() !== "no",
            createdBy: "Bulk Upload",
            validFrom,
            validTill,
            isActive: true,
            lastUpdated: new Date().toISOString(),
          });
          imported++;
        }

        setSavedStructures(salaryStructureService.getAll());
        toast.success(`Imported ${imported} structures${skipped > 0 ? `, skipped ${skipped} invalid rows` : ""}`);
      } catch (err) {
        toast.error("Failed to parse file. Please use the correct CSV format.");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadAll = () => {
    if (savedStructures.length === 0) {
      toast.error("No structures saved to download");
      return;
    }
    const headers = [
      "Structure Name", "Role", "Shift Type", "Location", "PF Cap",
      "Basic Salary", "Monthly Gross", "HRA", "Conveyance", "Medical",
      "Special Allowance", "Employee PF", "Employer PF", "Employee ESIC",
      "Employer ESIC", "Professional Tax", "Total Deductions",
      "Net Take Home", "Total CTC", "Annual CTC", "Created Date", "Valid From", "Valid Till", "Status", "Last Updated"
    ];
    const rows = savedStructures.map(s => [
      s.structureName || "Unnamed",
      s.roleName,
      s.shiftType === "part_time" ? "Part-Time" : "Full-Time",
      s.isMetro ? "Metro" : "Non-Metro",
      s.applyPFCap ? "Yes" : "No",
      s.basicSalary ?? s.components.basic,
      s.monthlyGross,
      s.components.hra,
      s.components.conveyance,
      s.components.medical,
      s.components.specialAllowance,
      s.components.employeePF,
      s.components.employerPF,
      s.components.employeeESIC,
      s.components.employerESIC,
      s.components.professionalTax,
      s.components.totalDeductions,
      s.components.netTakeHome,
      s.components.totalCTC,
      s.components.annualCTC,
      s.createdDate || '',
      s.validFrom || '',
      s.validTill || 'No expiry',
      s.isActive ? "Active" : "Inactive",
      new Date(s.lastUpdated).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Salary_Structures_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${savedStructures.length} salary structures`);
  };

  const handleStartEditName = (structure: SalaryStructure) => {
    setEditingNameId(structure.id);
    setEditingNameValue(structure.structureName || "");
  };

  const handleSaveEditName = (id: string) => {
    if (!editingNameValue.trim()) {
      toast.error("Structure name cannot be empty");
      return;
    }

    const structure = savedStructures.find(s => s.id === id);
    if (!structure) return;

    const updated = salaryStructureService.update(id, {
      ...structure,
      structureName: editingNameValue.trim(),
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    if (updated) {
      toast.success(`✏️ Structure name updated to "${editingNameValue.trim()}"`);
      setEditingNameId(null);
      setEditingNameValue("");
    } else {
      toast.error("Failed to update structure name");
    }
  };

  const handleCancelEditName = () => {
    setEditingNameId(null);
    setEditingNameValue("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Salary Structure Configuration</h2>
          <p className="text-gray-600 mt-1">Define role-based salary templates based on Basic Salary with shift proration</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <Settings className="w-4 h-4 text-purple-600" />
          <span className="text-sm">Salary Configuration</span>
        </Badge>
      </div>

      {/* Single Source of Truth Label */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <Database className="w-5 h-5 text-purple-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-purple-900">Single Source of Truth</p>
          <p className="text-xs text-purple-700">
            This is the ONLY place to configure salary structures, incentive rules, and compliance rules.
            All settings used by <span className="font-semibold">payrollEngine</span> and <span className="font-semibold">incentiveEngine</span>.
          </p>
        </div>
      </div>

      {/* Configuration Scope */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Award className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Configuration Includes</p>
          <p className="text-xs text-blue-700">
            <span className="font-semibold">roleId</span> • <span className="font-semibold">base salary</span> • <span className="font-semibold">incentiveRules</span> • <span className="font-semibold">complianceRules</span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">
            <Calculator className="w-4 h-4 mr-2" />
            Create Structure
          </TabsTrigger>
          <TabsTrigger value="saved">
            <FileText className="w-4 h-4 mr-2" />
            Saved Structures ({savedStructures.length})
          </TabsTrigger>
        </TabsList>

        {/* CREATE TAB */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Configuration Panel - Matching PayrollProcessingAdvanced design */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Salary Structure Configuration (HR Inputs)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Structure Name - MOVED TO TOP FOR VISIBILITY */}
                <div className="md:col-span-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    Structure Name * (Required)
                  </Label>
                  <Input
                    placeholder="e.g., Senior Manager Package, Entry Level 2024, Special HRA Package"
                    value={structureName}
                    onChange={(e) => setStructureName(e.target.value)}
                    className="font-semibold bg-white border-yellow-400"
                  />
                  <p className="text-xs text-gray-700 mt-1 font-medium">
                    ⚠️ Give this salary structure a descriptive name for easy identification
                  </p>
                </div>

                {/* Valid From */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Valid From <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={e => setValidFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-xs text-gray-500">Structure becomes active from this date</p>
                </div>

                {/* Valid Till */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Valid Till
                    <span className="ml-2 text-xs text-gray-400 font-normal">(leave blank = no expiry)</span>
                  </Label>
                  <input
                    type="date"
                    value={validTill}
                    min={validFrom}
                    onChange={e => setValidTill(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {validTill && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Structure will auto-deactivate after {new Date(validTill).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Select Job Role *
                  </Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Basic Salary */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Basic Salary (Monthly) *
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 8000"
                    value={basicSalary || ""}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    className="font-semibold"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Enter basic salary for this role
                  </p>
                </div>

                {/* Shift Type */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Shift Type
                  </Label>
                  <Select value={shiftType} onValueChange={setShiftType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-Time (8 hours)</SelectItem>
                      <SelectItem value="part_time">Part-Time (4 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    Part-time salary is 50% of full-time
                  </p>
                </div>

                {/* Location Type */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Location Type
                  </Label>
                  <Select value={isMetro ? "metro" : "non-metro"} onValueChange={(value) => setIsMetro(value === "metro")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metro">Metro City</SelectItem>
                      <SelectItem value="non-metro">Non-Metro City</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    HRA can be manually configured in Earnings section below
                  </p>
                </div>

                {/* Employee State - STEP 2 */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Employee State
                  </Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gujarat">Gujarat</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    State affects PT and LWF calculations
                  </p>
                </div>

                {/* PF Cap */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    PF Calculation
                  </Label>
                  <Select value={applyPFCap ? "capped" : "uncapped"} onValueChange={(value) => setApplyPFCap(value === "capped")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capped">Apply PF Cap (₹1,800/month)</SelectItem>
                      <SelectItem value="uncapped">No Cap (Full PF)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    PF capped when Basic exceeds ₹15,000
                  </p>
                </div>

                {/* Month Selection (for LWF calculation) */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Payroll Month
                  </Label>
                  <Select value={currentMonth.toString()} onValueChange={(value) => setCurrentMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June (LWF applicable)</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December (LWF applicable)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">
                    LWF deductions apply only in June and December
                  </p>
                </div>
              </div>

              {/* Component Configuration Section */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">Configure Salary Components</h3>
                </div>

                {/* Earnings Components */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-green-800">Earnings Components</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addCustomComponent("earnings")}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Tip: Standard HRA is 50% of Basic (Metro) or 40% (Non-Metro), but you can set any value
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {customEarnings.map((comp) => (
                      <div key={comp.id} className="flex gap-2 items-center bg-white p-2 rounded border">
                        <Input
                          placeholder="Component name"
                          value={comp.name || ""}
                          onChange={(e) => updateCustomComponent("earnings", comp.id, { name: e.target.value })}
                          className="flex-1 h-8 text-xs"
                        />
                        <Select
                          value={comp.type}
                          onValueChange={(value: "percentage" | "fixed") => updateCustomComponent("earnings", comp.id, { type: value })}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                        {comp.type === "percentage" && (
                          <Select
                            value={comp.baseOn || "basic"}
                            onValueChange={(value: "basic" | "gross") => updateCustomComponent("earnings", comp.id, { baseOn: value })}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="gross">Gross</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Input
                          type="number"
                          placeholder="Value"
                          value={comp.value || ""}
                          onChange={(e) => updateCustomComponent("earnings", comp.id, { value: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomComponent("earnings", comp.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Employee Deductions */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-orange-800">Employee Deductions</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addCustomComponent("deductions")}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Statutory Deductions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase">Statutory Deductions</h5>
                        {canEditStatutory && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                            HR Editable
                          </span>
                        )}
                        {!canEditStatutory && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-200 rounded-full">
                            View Only
                          </span>
                        )}
                      </div>
                      {customDeductions.filter(c => c && c.category === "statutory").map((comp) => {
                        if (!comp) return null;
                        const validationError = getValidationError(comp.id || "", comp.value || 0, comp.type || "");
                        return (
                        <div key={comp.id} className="space-y-1">
                          <div className={`bg-white p-2 rounded ${validationError ? 'border-2 border-red-500' : 'border'}`}>
                            <div className="flex gap-2 items-center">
                              <Input
                                placeholder="Component name"
                                value={comp.name || ""}
                                onChange={(e) => updateCustomComponent("deductions", comp.id, { name: e.target.value })}
                                className="flex-1 h-8 text-xs"
                                disabled={comp.isStatutory && !canEditStatutory}
                              />
                              <Select
                                value={comp.type}
                                onValueChange={(value: any) => updateCustomComponent("deductions", comp.id, { type: value })}
                                disabled={comp.isStatutory && !canEditStatutory}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="slab">Slab</SelectItem>
                                </SelectContent>
                              </Select>
                              {comp.type === "percentage" && (
                                <Select
                                  value={comp.baseOn || "basic"}
                                  onValueChange={(value: any) => updateCustomComponent("deductions", comp.id, { baseOn: value })}
                                  disabled={comp.isStatutory && !canEditStatutory}
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="gross">Gross</SelectItem>
                                    <SelectItem value="pf_gross">PF Gross</SelectItem>
                                    <SelectItem value="esic_gross">ESIC Gross</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {comp.type !== "slab" && (
                                <Input
                                  type="number"
                                  placeholder="Value"
                                  value={comp.value || ""}
                                  onChange={(e) => updateCustomComponent("deductions", comp.id, { value: parseFloat(e.target.value) || 0 })}
                                  className="w-20 h-8 text-xs"
                                  disabled={comp.isStatutory && comp.type === "slab" && !canEditStatutory}
                                />
                              )}
                              {comp.tooltip && (
                                <div className="relative group">
                                  <AlertCircle className="w-4 h-4 text-blue-500 cursor-help" />
                                  <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                    {comp.tooltip}
                                  </div>
                                </div>
                              )}
                              {!comp.isStatutory && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeCustomComponent("deductions", comp.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {validationError && (
                            <p className="text-xs text-red-600 font-medium px-2">⚠️ {validationError}</p>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    {/* Taxation */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase">Taxation</h5>
                        {canEditStatutory && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                            HR Editable
                          </span>
                        )}
                        {!canEditStatutory && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-200 rounded-full">
                            View Only
                          </span>
                        )}
                      </div>
                      {customDeductions.filter(c => c.category === "taxation").map((comp) => (
                        <div key={comp.id} className="bg-white p-2 rounded border">
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Component name"
                              value={comp.name || ""}
                              onChange={(e) => updateCustomComponent("deductions", comp.id, { name: e.target.value })}
                              className="flex-1 h-8 text-xs"
                              disabled={comp.isStatutory && !canEditStatutory}
                            />
                            {comp.type === "manual" ? (
                              <>
                                <span className="text-xs text-gray-500 whitespace-nowrap">Manual Input</span>
                                <Input
                                  type="number"
                                  placeholder="Monthly TDS"
                                  value={comp.manualValue || 0}
                                  onChange={(e) => updateCustomComponent("deductions", comp.id, { manualValue: parseFloat(e.target.value) || 0 })}
                                  className="w-28 h-8 text-xs"
                                  disabled={!canEditStatutory && comp.isStatutory}
                                />
                              </>
                            ) : (
                              <>
                                <Select
                                  value={comp.type}
                                  onValueChange={(value: any) => updateCustomComponent("deductions", comp.id, { type: value })}
                                  disabled={comp.isStatutory && !canEditStatutory}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">%</SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="slab">Slab</SelectItem>
                                  </SelectContent>
                                </Select>
                                {comp.type === "percentage" && (
                                  <>
                                    <Select
                                      value={comp.baseOn || "basic"}
                                      onValueChange={(value: any) => updateCustomComponent("deductions", comp.id, { baseOn: value })}
                                      disabled={comp.isStatutory && !canEditStatutory}
                                    >
                                      <SelectTrigger className="w-28 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="tds">TDS</SelectItem>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="gross">Gross</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      placeholder="Value"
                                      value={comp.value || ""}
                                      onChange={(e) => updateCustomComponent("deductions", comp.id, { value: parseFloat(e.target.value) || 0 })}
                                      className="w-20 h-8 text-xs"
                                      disabled={comp.isStatutory && comp.type === "slab" && !canEditStatutory}
                                    />
                                  </>
                                )}
                              </>
                            )}
                            {comp.tooltip && (
                              <div className="relative group">
                                <AlertCircle className="w-4 h-4 text-blue-500 cursor-help" />
                                <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                  {comp.tooltip}
                                </div>
                              </div>
                            )}
                            {!comp.isStatutory && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeCustomComponent("deductions", comp.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Other/Custom Deductions */}
                    {customDeductions.filter(c => !c.category || c.category === "standard").length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase">Custom Deductions</h5>
                        {customDeductions.filter(c => !c.category || c.category === "standard").map((comp) => (
                          <div key={comp.id} className="flex gap-2 items-center bg-white p-2 rounded border">
                            <Input
                              placeholder="Component name"
                              value={comp.name || ""}
                              onChange={(e) => updateCustomComponent("deductions", comp.id, { name: e.target.value })}
                              className="flex-1 h-8 text-xs"
                            />
                            <Select
                              value={comp.type}
                              onValueChange={(value: any) => updateCustomComponent("deductions", comp.id, { type: value })}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                            {comp.type === "percentage" && (
                              <Select
                                value={comp.baseOn || "basic"}
                                onValueChange={(value: any) => updateCustomComponent("deductions", comp.id, { baseOn: value })}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="gross">Gross</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <Input
                              type="number"
                              placeholder="Value"
                              value={comp.value || ""}
                              onChange={(e) => updateCustomComponent("deductions", comp.id, { value: parseFloat(e.target.value) || 0 })}
                              className="w-20 h-8 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCustomComponent("deductions", comp.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Employer Statutory Contributions */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-blue-800">Employer Statutory Contributions</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addCustomComponent("employer")}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {customEmployerContributions.map((comp) => (
                      <div key={comp.id} className="bg-white p-2 rounded border">
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Component name"
                            value={comp.name || ""}
                            onChange={(e) => updateCustomComponent("employer", comp.id, { name: e.target.value })}
                            className="flex-1 h-8 text-xs"
                            disabled={comp.isStatutory && !canEditStatutory}
                          />
                          <Select
                            value={comp.type}
                            onValueChange={(value: any) => updateCustomComponent("employer", comp.id, { type: value })}
                            disabled={comp.isStatutory && !canEditStatutory}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          {comp.type === "percentage" && (
                            <Select
                              value={comp.baseOn || "basic"}
                              onValueChange={(value: any) => updateCustomComponent("employer", comp.id, { baseOn: value })}
                              disabled={comp.isStatutory && !canEditStatutory}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="gross">Gross</SelectItem>
                                <SelectItem value="pf_gross">PF Gross</SelectItem>
                                <SelectItem value="esic_gross">ESIC Gross</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Input
                            type="number"
                            placeholder="Value"
                            value={comp.value || ""}
                            onChange={(e) => updateCustomComponent("employer", comp.id, { value: parseFloat(e.target.value) || 0 })}
                            className="w-20 h-8 text-xs"
                            disabled={comp.isStatutory && comp.type === "slab" && !canEditStatutory}
                          />
                          {comp.tooltip && (
                            <div className="relative group">
                              <AlertCircle className="w-4 h-4 text-blue-500 cursor-help" />
                              <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                {comp.tooltip}
                              </div>
                            </div>
                          )}
                          {!comp.isStatutory && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCustomComponent("employer", comp.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Calculation Strip */}
              {components && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 border-2 border-purple-300 mt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <span className="text-xs text-gray-600">Basic Salary:</span>
                        <span className="font-bold text-indigo-900 ml-2 block text-lg">
                          ₹{(components?.basic ?? 0).toLocaleString()} <span className="text-xs text-gray-500">({shiftType === "full_time" ? "FT" : "PT"})</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Monthly Gross:</span>
                        <span className="font-bold text-purple-900 ml-2 block text-lg">
                          ₹{(components?.monthlyGross ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Annual CTC:</span>
                        <span className="font-bold text-blue-900 ml-2 block text-lg">
                          ₹{(components?.annualCTC ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-600 block">Net Take Home:</span>
                      <span className="text-2xl font-bold text-green-900 block">
                        ₹{(components?.netTakeHome ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center gap-3 mt-4">
                {/* STEP 4 - Compliance Status Badge */}
                <div className="flex items-center gap-2">
                  {(() => {
                    try {
                      const hasErrors = hasAnyErrors();
                      return hasErrors ? (
                        <Badge className="bg-red-100 text-red-800 border-red-300 px-3 py-1">
                          <span className="mr-1">🔴</span>
                          Non-Compliant
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                          <span className="mr-1">🟢</span>
                          Compliant
                        </Badge>
                      );
                    } catch (error) {
                      console.error("Compliance badge error:", error);
                      return (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300 px-3 py-1">
                          <span className="mr-1">⚪</span>
                          Status Unknown
                        </Badge>
                      );
                    }
                  })()}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={!selectedRole || !components}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Salary Structure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Live Breakdown */}
          <Card className="lg:sticky lg:top-6">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
              <CardTitle className="text-lg">Live Salary Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                {components ? (
                  <div className="space-y-6">
                    {/* Info box about calculation */}
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="text-blue-800">
                            <p className="font-semibold mb-1">Dynamic Calculation:</p>
                            <ul className="text-xs space-y-1 ml-4 list-disc">
                              <li>All components calculated from Basic Salary using configurable formulas</li>
                              {shiftType === "part_time" && <li>Part-time fixed components are 50% of full-time values</li>}
                              <li><strong>PF Gross</strong> = Basic + DA + Retaining Allowance (currently = Basic only)</li>
                              <li><strong>ESIC Gross</strong> = Total Monthly Gross (all cash components)</li>
                              <li>Professional Tax is auto-calculated based on state salary slabs</li>
                              <li>LWF deductions apply only in June and December (half-yearly)</li>
                              <li>TDS Surcharge applies only if annual TDS exceeds ₹50 Lakhs</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Earnings Section */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">EARNINGS</h4>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Component</th>
                            <th className="text-right p-2">Monthly</th>
                            <th className="text-right p-2">Annual</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2">Basic Salary {shiftType === "part_time" ? "(Part-Time)" : "(Full-Time)"}</td>
                            <td className="text-right">₹{(components?.basic ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="text-right">₹{(components.basic * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                          </tr>
                          {customEarnings.map((comp, idx) => {
                            const value = calculateComponentValue(comp, components.basic, components.monthlyGross);
                            const label = comp.type === "percentage"
                              ? `${comp.name} (${comp.value}% of ${comp.baseOn === "basic" ? "Basic" : "Gross"})`
                              : comp.name;
                            return (
                              <tr key={comp.id} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                                <td className="p-2">{label || "Unnamed Component"}</td>
                                <td className="text-right">₹{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                                <td className="text-right">₹{(value * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-blue-50 font-semibold border-t-2">
                            <td className="p-2">Gross Salary</td>
                            <td className="text-right">₹{(components?.monthlyGross ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="text-right">₹{(components.monthlyGross * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Employee Deductions */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">EMPLOYEE DEDUCTIONS</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          {(() => {
                            // First, get TDS value for surcharge calculation
                            const tdsComp = customDeductions.find(c => c.id === "tds");
                            const tdsValue = tdsComp?.manualValue || 0;

                            return customDeductions.map((comp, idx) => {
                              let value = calculateComponentValue(comp, components.basic, components.monthlyGross, tdsValue);

                              // Apply PF cap if enabled
                              if (comp.id === "pf" && applyPFCap) {
                                value = Math.min(value, 1800);
                              }

                              // ESIC only applicable if gross <= 21000
                              if (comp.id === "esic" && components.monthlyGross > 21000) {
                                value = 0;
                              }

                              // Surcharge only applicable if annual TDS > 50 lakhs
                              if (comp.id === "surcharge" && (tdsValue * 12) <= 5000000) {
                                value = 0;
                              }

                              // Generate label based on type
                              let label = comp.name;
                              if (comp.type === "percentage") {
                                const baseLabel =
                                  comp.baseOn === "pf_gross" ? "PF Gross" :
                                  comp.baseOn === "esic_gross" ? "ESIC Gross" :
                                  comp.baseOn === "tds" ? "TDS" :
                                  comp.baseOn === "basic" ? "Basic" : "Gross";
                                label = `${comp.name} (${comp.value}% of ${baseLabel})`;
                              } else if (comp.type === "manual") {
                                label = `${comp.name} (Manual Input)`;
                              } else if (comp.type === "slab") {
                                label = `${comp.name} (Auto-calculated)`;
                              }

                              // Check if component is disabled by month (LWF)
                              const isDisabledByMonth = comp.monthlyApplicable && !comp.monthlyApplicable.includes(currentMonth);

                              return (
                                <tr key={comp.id} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
                                  <td className="p-2">
                                    {label || "Unnamed Component"}
                                    {isDisabledByMonth && <span className="text-xs text-gray-400 ml-2">(Not in {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][currentMonth - 1]})</span>}
                                  </td>
                                  <td className="text-right">
                                    {value > 0 ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "Not Applicable"}
                                  </td>
                                  <td className="text-right">
                                    {value > 0 ? `₹${(value * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-"}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                          <tr className="bg-red-50 font-semibold border-t">
                            <td className="p-2">Total Deductions</td>
                            <td className="text-right text-red-600">₹{(components?.totalDeductions ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="text-right text-red-600">₹{(components.totalDeductions * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                          </tr>
                          <tr className="bg-teal-50 font-bold border-t-2 text-base">
                            <td className="p-2 text-teal-800">NET TAKE HOME</td>
                            <td className="text-right text-teal-800">₹{(components?.netTakeHome ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="text-right text-teal-800">₹{(components.netTakeHome * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Employer Contributions */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-gray-700">EMPLOYER STATUTORY CONTRIBUTIONS</h4>
                        {canEditStatutory && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                            HR Editable
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">(Not part of employee take-home)</p>
                      <table className="w-full text-sm">
                        <tbody>
                          {customEmployerContributions.map((comp, idx) => {
                            let value = calculateComponentValue(comp, components.basic, components.monthlyGross, 0);

                            // Apply PF cap if enabled
                            if (comp.id === "empf" && applyPFCap) {
                              value = Math.min(value, 1800);
                            }

                            // ESIC only applicable if gross <= 21000
                            if (comp.id === "emesic" && components.monthlyGross > 21000) {
                              value = 0;
                            }

                            // Generate label based on type
                            let label = comp.name;
                            if (comp.type === "percentage") {
                              const baseLabel =
                                comp.baseOn === "pf_gross" ? "PF Gross" :
                                comp.baseOn === "esic_gross" ? "ESIC Gross" :
                                comp.baseOn === "basic" ? "Basic" : "Gross";
                              label = `${comp.name} (${comp.value}% of ${baseLabel})`;
                            }

                            // Check if component is disabled by month (LWF)
                            const isDisabledByMonth = comp.monthlyApplicable && !comp.monthlyApplicable.includes(currentMonth);

                            return (
                              <tr key={comp.id} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
                                <td className="p-2">
                                  {label || "Unnamed Component"}
                                  {isDisabledByMonth && <span className="text-xs text-gray-400 ml-2">(Not in {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][currentMonth - 1]})</span>}
                                </td>
                                <td className="text-right">
                                  {value > 0 ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "Not Applicable"}
                                </td>
                                <td className="text-right">
                                  {value > 0 ? `₹${(value * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-"}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-purple-50 font-semibold border-t">
                            <td className="p-2">Total Employer Cost</td>
                            <td className="text-right">₹{(components?.totalEmployerCost ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="text-right">₹{(components.totalEmployerCost * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                          </tr>
                          <tr className="bg-blue-900 text-white font-bold border-t-2 text-base">
                            <td className="p-2">TOTAL CTC</td>
                            <td className="text-right">₹{(components?.totalCTC ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="text-right">₹{(components.totalCTC * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="text-xs text-gray-400 italic">
                      ✓ All values are auto-calculated from Basic Salary input (with shift proration)
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Enter basic salary to see the breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SAVED STRUCTURES TAB */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle>Saved Salary Structures ({savedStructures.length})</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search by name or role..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {/* Upload CSV */}
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                    <Plus className="w-4 h-4" />
                    {isUploading ? "Uploading..." : "Upload CSV"}
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleUploadExcel}
                      disabled={isUploading}
                    />
                  </label>
                  {/* Download All */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="min-w-[800px] sm:min-w-0">
                  <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10">Structure Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Shift Type</TableHead>
                    <TableHead>Basic (Input)</TableHead>
                    <TableHead>Monthly Gross</TableHead>
                    <TableHead>HRA</TableHead>
                    <TableHead>Special Allowance</TableHead>
                    <TableHead>Net Take Home</TableHead>
                    <TableHead>CTC</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>PF Cap</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Valid From</TableHead>
                    <TableHead>Valid Till</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredStructures = savedStructures.filter(s => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        (s.structureName || "").toLowerCase().includes(q) ||
                        s.roleName.toLowerCase().includes(q)
                      );
                    });

                    return filteredStructures.map((structure) => {
                    // Use saved components directly instead of recalculating
                    const calc = structure.components;
                    return (
                      <TableRow key={structure.id} className="group">
                        <TableCell className="font-bold text-purple-700 sticky left-0 bg-white z-10">
                          {editingNameId === structure.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEditName(structure.id);
                                  if (e.key === "Escape") handleCancelEditName();
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveEditName(structure.id)}
                                className="h-8 px-2"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEditName}
                                className="h-8 px-2"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{structure.structureName || "Unnamed Structure"}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEditName(structure)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{structure.roleName}</TableCell>
                        <TableCell>
                          <Badge variant={(structure.shiftType || "full_time") === "full_time" ? "default" : "secondary"}>
                            {(structure.shiftType || "full_time") === "full_time" ? "Full-Time" : "Part-Time"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">₹{structure.basicSalary?.toLocaleString("en-IN") || calc.basic.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell>₹{(structure?.monthlyGross ?? 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{(calc?.hra ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell>₹{(calc?.specialAllowance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="font-semibold text-green-600">₹{(calc?.netTakeHome ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="font-semibold text-blue-600">₹{(calc?.totalCTC ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell>
                          <Badge variant={structure.isMetro ? "default" : "secondary"}>
                            {structure.isMetro ? "Metro" : "Non-Metro"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={structure.applyPFCap ? "outline" : "secondary"}>
                            {structure.applyPFCap ? "Applied" : "Not Applied"}
                          </Badge>
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {structure.createdDate
                            ? new Date(structure.createdDate).toLocaleDateString('en-IN')
                            : '—'}
                        </TableCell>

                        {/* Valid From */}
                        <TableCell className="text-sm whitespace-nowrap">
                          {structure.validFrom
                            ? new Date(structure.validFrom).toLocaleDateString('en-IN')
                            : '—'}
                        </TableCell>

                        {/* Valid Till */}
                        <TableCell className="text-sm whitespace-nowrap">
                          {structure.validTill ? (
                            <span className={
                              new Date(structure.validTill) < new Date()
                                ? 'text-red-600 font-medium'
                                : new Date(structure.validTill) <= new Date(Date.now() + 7 * 86400000)
                                ? 'text-amber-600 font-medium'
                                : 'text-gray-700'
                            }>
                              {new Date(structure.validTill).toLocaleDateString('en-IN')}
                              {new Date(structure.validTill) < new Date() && (
                                <span className="ml-1 text-xs bg-red-100 text-red-700 px-1 rounded">Expired</span>
                              )}
                              {new Date(structure.validTill) > new Date() &&
                               new Date(structure.validTill) <= new Date(Date.now() + 7 * 86400000) && (
                                <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1 rounded">Expiring soon</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No expiry</span>
                          )}
                        </TableCell>

                        {/* Status Toggle */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(structure.id)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                structure.isActive ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              title={structure.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                structure.isActive ? 'translate-x-5' : 'translate-x-0.5'
                              }`} />
                            </button>
                            <span className={`text-xs font-medium ${structure.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                              {structure.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Last Updated */}
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(structure.lastUpdated).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowBreakdown(structure);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(structure.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    });
                  })()}
                </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Breakdown Preview Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-purple-700">{showBreakdown.structureName || "Unnamed Structure"}</h3>
                <p className="text-sm text-gray-600">{showBreakdown.roleName}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowBreakdown(null)}>
                Close
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {(() => {
                  // Use saved components directly instead of recalculating
                  const calc = showBreakdown.components;
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Shift Type</p>
                          <p className="font-semibold">{(showBreakdown.shiftType || "full_time") === "full_time" ? "Full-Time (8hrs)" : "Part-Time (4hrs)"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location Type</p>
                          <p className="font-semibold">{showBreakdown.isMetro ? "Metro" : "Non-Metro"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">PF Cap</p>
                          <p className="font-semibold">{showBreakdown.applyPFCap ? "Applied" : "Not Applied"}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
                        <p className="font-semibold text-indigo-900">
                          Input Basic Salary: ₹{showBreakdown.basicSalary?.toLocaleString("en-IN") || "N/A"}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">All components calculated from this base value</p>
                      </div>

                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3">Component</th>
                            <th className="text-right p-3">Monthly</th>
                            <th className="text-right p-3">Annual</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={3} className="p-2 font-semibold bg-gray-50">EARNINGS</td></tr>
                          <tr><td className="p-2 pl-4">Basic</td><td className="text-right p-2">₹{(calc?.basic ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2">₹{(calc.basic * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                          <tr><td className="p-2 pl-4">HRA</td><td className="text-right p-2">₹{(calc?.hra ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2">₹{(calc.hra * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                          <tr><td className="p-2 pl-4">Conveyance</td><td className="text-right p-2">₹{(calc?.conveyance ?? 0).toLocaleString("en-IN")}</td><td className="text-right p-2">₹{(calc.conveyance * 12).toLocaleString("en-IN")}</td></tr>
                          <tr><td className="p-2 pl-4">Medical</td><td className="text-right p-2">₹{(calc?.medical ?? 0).toLocaleString("en-IN")}</td><td className="text-right p-2">₹{(calc.medical * 12).toLocaleString("en-IN")}</td></tr>
                          <tr><td className="p-2 pl-4">Special Allowance</td><td className="text-right p-2">₹{(calc?.specialAllowance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2">₹{(calc.specialAllowance * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                          <tr className="bg-blue-50 font-semibold"><td className="p-2">Gross Salary</td><td className="text-right p-2">₹{(calc?.monthlyGross ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2">₹{(calc.monthlyGross * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                          
                          <tr><td colSpan={3} className="p-2 font-semibold bg-gray-50">DEDUCTIONS</td></tr>
                          <tr><td className="p-2 pl-4">Employee PF</td><td className="text-right p-2">₹{(calc?.employeePF ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2">₹{(calc.employeePF * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                          <tr><td className="p-2 pl-4">Employee ESIC</td><td className="text-right p-2">{calc.employeeESIC > 0 ? `₹${(calc?.employeeESIC ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "N/A"}</td><td className="text-right p-2">{calc.employeeESIC > 0 ? `₹${(calc.employeeESIC * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-"}</td></tr>
                          <tr><td className="p-2 pl-4">Professional Tax</td><td className="text-right p-2">₹{(calc?.professionalTax ?? 0).toLocaleString("en-IN")}</td><td className="text-right p-2">₹{(calc.professionalTax * 12).toLocaleString("en-IN")}</td></tr>
                          <tr className="bg-teal-50 font-bold"><td className="p-2 text-teal-800">Net Take Home</td><td className="text-right p-2 text-teal-800">₹{(calc?.netTakeHome ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2 text-teal-800">₹{(calc.netTakeHome * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                          
                          <tr><td colSpan={3} className="p-2 font-semibold bg-gray-50">EMPLOYER CONTRIBUTIONS</td></tr>
                          <tr><td className="p-2 pl-4">Employer PF</td><td className="text-right p-2">₹{(calc?.employerPF ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2">₹{(calc.employerPF * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                          <tr><td className="p-2 pl-4">Employer ESIC</td><td className="text-right p-2">{calc.employerESIC > 0 ? `₹${(calc?.employerESIC ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "N/A"}</td><td className="text-right p-2">{calc.employerESIC > 0 ? `₹${(calc.employerESIC * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-"}</td></tr>
                          <tr className="bg-blue-900 text-white font-bold"><td className="p-2">TOTAL CTC</td><td className="text-right p-2">₹{(calc?.totalCTC ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td><td className="text-right p-2">₹{(calc.totalCTC * 12).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
        variant="destructive"
      />
    </div>
  );
}

export default CreateSalaryStructure;