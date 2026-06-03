import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { AlertTriangle, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Database, Settings, Copy, Save, Edit2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DEFAULT_PAY_COMPONENTS } from "./payroll-types";
import { useEmployeeData } from "../../hooks/useEmployeeData";

// Define system roles with their availability status
interface RoleConfig {
  id: string;
  label: string;
  available: boolean;
  defaults: { basic: string; hra: string; allowances: string; gross: string; pt: string; net: string };
}

// Define KPIs for all roles
const allRoleKPIs: Record<string, { label: string; placeholder: string }[]> = {
  "super-admin": [
    { label: "System Performance", placeholder: "95" },
    { label: "Strategic Goals Met", placeholder: "8" },
  ],
  "admin": [
    { label: "Tasks Completed", placeholder: "50" },
    { label: "Efficiency Score", placeholder: "88" },
  ],
  "city-manager": [
    { label: "Revenue Target", placeholder: "2000000" },
    { label: "Operating Margin %", placeholder: "15" },
    { label: "Customer Growth", placeholder: "12" },
  ],
  "cluster-manager": [
    { label: "Cluster Revenue", placeholder: "1500000" },
    { label: "Team Performance", placeholder: "88" },
  ],
  "sr-ops-manager": [
    { label: "Operational Efficiency", placeholder: "92" },
    { label: "Cost Reduction %", placeholder: "8" },
  ],
  "ops-manager": [
    { label: "Revenue Generated", placeholder: "250000" },
    { label: "Operating Margin %", placeholder: "12" },
  ],
  "supervisor": [
    { label: "Team Output", placeholder: "150" },
    { label: "Team Quality Score", placeholder: "85" },
  ],
  "car-washer": [
    { label: "Units Washed", placeholder: "25" },
    { label: "Add-ons Sold", placeholder: "8" },
    { label: "Customer Rating", placeholder: "4.5" },
  ],
  "tsm": [
    { label: "Team Revenue", placeholder: "500000" },
    { label: "Team Conversions", placeholder: "45" },
  ],
  "tse": [
    { label: "Revenue Generated", placeholder: "125000" },
    { label: "Conversions", placeholder: "15" },
  ],
  "cce": [
    { label: "Complaints Resolved", placeholder: "40" },
    { label: "Customer Satisfaction", placeholder: "4.5" },
  ],
  "store-manager": [
    { label: "Inventory Accuracy", placeholder: "98" },
    { label: "Stock Turnover", placeholder: "12" },
  ],
  "procurement-manager": [
    { label: "Cost Savings %", placeholder: "10" },
    { label: "Vendor Performance", placeholder: "90" },
  ],
  "accounts": [
    { label: "Invoices Processed", placeholder: "120" },
    { label: "Reconciliation Accuracy", placeholder: "99" },
  ],
  "hr": [
    { label: "Hiring Targets Met", placeholder: "8" },
    { label: "Employee Retention %", placeholder: "92" },
  ],
};

interface IncentiveRule {
  id: number;
  type: "Per Unit" | "Per Day" | "Performance Slab";
  valueType: "₹" | "%";
  value: string;
}

interface SalaryComponent {
  id: number;
  name: string;
  type: "Fixed" | "%";
  value: string;
  baseOn?: string; // For percentage calculations
}

interface SavedSalaryStructure {
  id: string;
  name: string;
  role: string;
  employmentType: "Full-Time" | "Part-Time" | "Contract";
  status: "Draft" | "Active";
  earningsComponents: SalaryComponent[];
  deductionComponents: SalaryComponent[];
  employerContributions: SalaryComponent[];
  incentiveRules: IncentiveRule[];
  createdAt: string;
  updatedAt: string;
}

export function SalaryStructureBuilder() {
  // PHASE 2: Migrated to useEmployeeData (dual-read from EmployeeContext + HRDataContext)
  const adapter = useEmployeeData();
  const roles = adapter?.roles || [];

  // Convert roles from HR context to component format
  const systemRoles: RoleConfig[] = roles.length > 0 ? roles.map((role) => {
    // Safety check for role data
    if (!role || !role.baseValues) {
      return {
        id: "unknown",
        label: "Unknown Role",
        available: false,
        defaults: {
          basic: "₹0",
          hra: "₹0",
          allowances: "₹0",
          gross: "₹0",
          pt: "₹0",
          net: "₹0",
        },
      };
    }

    return {
      id: role.code.toLowerCase().replace(/\s+/g, "-"),
      label: role.name,
      available: role.isActive,
      defaults: {
        basic: `₹${role.baseValues.basic.toLocaleString("en-IN")}`,
        hra: `₹${role.baseValues.hra.toLocaleString("en-IN")}`,
        allowances: `₹${role.baseValues.allowances.toLocaleString("en-IN")}`,
        gross: `₹${(role.baseValues.basic + role.baseValues.hra + role.baseValues.allowances).toLocaleString("en-IN")}`,
        pt: `₹${role.baseValues.pt.toLocaleString("en-IN")}`,
        net: `₹${(role.baseValues.basic + role.baseValues.hra + role.baseValues.allowances - role.baseValues.pt).toLocaleString("en-IN")}`,
      },
    };
  }) : [{
    id: "car-washer",
    label: "Car Washer",
    available: true,
    defaults: {
      basic: "₹13,330",
      hra: "₹6,665",
      allowances: "₹2,133",
      gross: "₹22,128",
      pt: "₹208",
      net: "₹21,920",
    },
  }];

  const availableRoles = systemRoles.filter((role) => role.available);
  const roleDefaults: Record<string, { basic: string; hra: string; allowances: string; gross: string; pt: string; net: string }> =
    availableRoles.reduce((acc, role) => {
      acc[role.id] = role.defaults;
      return acc;
    }, {} as Record<string, { basic: string; hra: string; allowances: string; gross: string; pt: string; net: string }>);

  // Filter KPIs for only available roles
  const roleKPIs: Record<string, { label: string; placeholder: string }[]> =
    availableRoles.reduce((acc, role) => {
      if (allRoleKPIs[role.id]) {
        acc[role.id] = allRoleKPIs[role.id];
      }
      return acc;
    }, {} as Record<string, { label: string; placeholder: string }[]>);

  const [selectedRole, setSelectedRole] = useState(() => availableRoles[0]?.id || "car-washer");
  const [employmentType, setEmploymentType] = useState<"Full-Time" | "Part-Time" | "Contract">("Full-Time");

  // Saved structures
  const [savedStructures, setSavedStructures] = useState<SavedSalaryStructure[]>([]);
  const [currentStructureName, setCurrentStructureName] = useState("");
  const [currentStructureStatus, setCurrentStructureStatus] = useState<"Draft" | "Active">("Draft");
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [showStructureBuilder, setShowStructureBuilder] = useState(false);

  // Part-Time fields - initialize with defaults
  const [ftReferenceSalary, setFtReferenceSalary] = useState("");
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState("4");
  const [standardFtHours, setStandardFtHours] = useState("8");

  // Contract fields
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [contractType, setContractType] = useState<"Fixed Pay" | "Per Unit" | "Hybrid (Fixed + Incentive)">("Fixed Pay");

  // Incentive rules
  const [incentiveRules, setIncentiveRules] = useState<IncentiveRule[]>([
    { id: 1, type: "Per Unit", valueType: "₹", value: "50" }
  ]);
  const [nextIncentiveId, setNextIncentiveId] = useState(2);

  // Add component dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingToSection, setAddingToSection] = useState<"earnings" | "deductions" | "employer">("earnings");

  // Editable Earnings Components
  const [earningsComponents, setEarningsComponents] = useState<SalaryComponent[]>([
    { id: 1, name: "Basic Salary", type: "Fixed", value: "18000" },
    { id: 2, name: "HRA", type: "%", value: "50", baseOn: "Basic" },
    { id: 3, name: "Allowances", type: "Fixed", value: "2850" },
  ]);
  const [nextEarningsId, setNextEarningsId] = useState(4);

  // Editable Deductions
  const [deductionComponents, setDeductionComponents] = useState<SalaryComponent[]>([
    { id: 1, name: "Professional Tax", type: "Fixed", value: "200" },
    { id: 2, name: "Employee PF", type: "%", value: "12", baseOn: "Basic" },
    { id: 3, name: "Employee ESIC", type: "%", value: "0.75", baseOn: "Gross" },
  ]);
  const [nextDeductionId, setNextDeductionId] = useState(4);

  // Employer contributions
  const [employerContributions, setEmployerContributions] = useState<SalaryComponent[]>([
    { id: 1, name: "Employer PF", type: "%", value: "12", baseOn: "Basic" },
    { id: 2, name: "Employer ESIC", type: "%", value: "3.25", baseOn: "Gross" },
    { id: 3, name: "Bonus Provision", type: "%", value: "8.33", baseOn: "Basic" },
    { id: 4, name: "Gratuity", type: "%", value: "4.81", baseOn: "Basic" },
  ]);
  const [nextEmployerContribId, setNextEmployerContribId] = useState(5);

  // KPI Inputs for incentive calculation
  const [kpiUnitsWashed, setKpiUnitsWashed] = useState("95");
  const [kpiAddOnsSold, setKpiAddOnsSold] = useState("8");
  const [kpiCustomerRating, setKpiCustomerRating] = useState("4.5");

  // Default fallback values
  const defaultBaseValues = {
    basic: "₹13,330",
    hra: "₹6,665",
    allowances: "₹2,133",
    gross: "₹22,128",
    pt: "₹208",
    net: "₹21,920",
  };

  const baseValues = roleDefaults[selectedRole] || roleDefaults["car-washer"] || defaultBaseValues;
  const kpis = roleKPIs[selectedRole] || roleKPIs["car-washer"] || [];

  // Calculate prorated salary for Part-Time
  const calculateProratedSalary = () => {
    if (employmentType !== "Part-Time" || !ftReferenceSalary || !workingHoursPerDay || !standardFtHours) {
      return null;
    }
    const hours = parseFloat(workingHoursPerDay);
    const standardHours = parseFloat(standardFtHours);
    const referenceSalary = parseFloat(ftReferenceSalary);

    if (hours > 0 && standardHours > 0 && referenceSalary > 0) {
      const ratio = hours / standardHours;
      return Math.round(ratio * referenceSalary);
    }
    return null;
  };

  const proratedSalary = calculateProratedSalary();

  // Calculate base units expected (no incentive for base units)
  const calculateBaseUnits = (): number => {
    if (selectedRole !== "car-washer") return 0;

    // For car washer: Full-time (8 hrs) = 50 units base, Part-time (4 hrs) = 25 units base
    if (employmentType === "Part-Time") {
      const hours = parseFloat(workingHoursPerDay) || 4;
      const standardHours = parseFloat(standardFtHours) || 8;
      // Prorate base units: (hours / standardHours) × 50
      return Math.round((hours / standardHours) * 50);
    } else if (employmentType === "Full-Time") {
      return 50; // Full-time base expectation
    }
    return 25; // Default
  };

  const baseUnitsExpected = calculateBaseUnits();

  // Auto-populate reference salary when switching to Part-Time
  useEffect(() => {
    if (employmentType === "Part-Time" && !ftReferenceSalary && baseValues && baseValues.basic) {
      const basicValue = baseValues.basic.replace(/[₹,]/g, '');
      setFtReferenceSalary(basicValue);
    }
  }, [employmentType, ftReferenceSalary, baseValues]);

  // Update component values when role or employment type changes
  useEffect(() => {
    if (!baseValues || !baseValues.basic) return;

    // Extract numeric values from baseValues
    const basicValue = parseFloat(baseValues.basic.replace(/[₹,]/g, ''));
    const hraValue = parseFloat(baseValues.hra.replace(/[₹,]/g, ''));
    const allowancesValue = parseFloat(baseValues.allowances.replace(/[₹,]/g, ''));
    const ptValue = parseFloat(baseValues.pt.replace(/[₹,]/g, ''));

    // Calculate HRA and Allowances as percentages of basic
    const hraPercent = Math.round((hraValue / basicValue) * 100);
    const allowancesPercent = Math.round((allowancesValue / basicValue) * 100);

    // Determine the actual basic salary to use
    let actualBasic = basicValue;

    // For Part-Time, use prorated salary if available
    if (employmentType === "Part-Time") {
      if (proratedSalary !== null && proratedSalary > 0) {
        actualBasic = proratedSalary;
      } else {
        // If no prorated salary yet, don't update (keep previous value)
        return;
      }
    }

    // Update earnings components based on role and employment type
    setEarningsComponents([
      { id: 1, name: "Basic Salary", type: "Fixed", value: actualBasic.toString() },
      { id: 2, name: "HRA", type: "%", value: hraPercent.toString(), baseOn: "Basic" },
      { id: 3, name: "Allowances", type: "%", value: allowancesPercent.toString(), baseOn: "Basic" },
    ]);

    // Update deductions based on role
    setDeductionComponents([
      { id: 1, name: "Professional Tax", type: "Fixed", value: ptValue.toString() },
      { id: 2, name: "Employee PF", type: "%", value: "12", baseOn: "Basic" },
      { id: 3, name: "Employee ESIC", type: "%", value: "0.75", baseOn: "Gross" },
    ]);
  }, [selectedRole, baseValues, employmentType, proratedSalary]);

  // Calculate actual component values dynamically
  const calculateComponentValue = (comp: SalaryComponent, baseAmount: number): number => {
    if (comp.type === "Fixed") {
      return parseFloat(comp.value || "0");
    } else {
      // For percentage, calculate based on baseOn field
      return Math.round((baseAmount * parseFloat(comp.value || "0")) / 100);
    }
  };

  // Calculate basic salary (first earnings component or prorated)
  const basicSalary = employmentType === "Part-Time" && proratedSalary
    ? proratedSalary
    : parseFloat(earningsComponents.find(c => c.name === "Basic Salary")?.value || "0");

  // Calculate total earnings with proper handling of Gross-based percentages and Part-Time
  const calculateTotalEarnings = (): number => {
    // Determine the effective basic salary
    const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;

    // Separate components by calculation type
    const fixedComponents = earningsComponents.filter(c => c.type === "Fixed");
    const basicPercentComponents = earningsComponents.filter(c => c.type === "%" && c.baseOn === "Basic");
    const grossPercentComponents = earningsComponents.filter(c => c.type === "%" && c.baseOn === "Gross");

    // Calculate Fixed components total
    // For Part-Time, Basic Salary should use prorated value
    const fixedTotal = fixedComponents.reduce((total, comp) => {
      if (employmentType === "Part-Time" && proratedSalary && comp.name === "Basic Salary") {
        return total + proratedSalary;
      }
      return total + parseFloat(comp.value || "0");
    }, 0);

    // Calculate Basic-based percentage components (using effective basic)
    const basicPercentTotal = basicPercentComponents.reduce((total, comp) => {
      return total + Math.round((effectiveBasic * parseFloat(comp.value || "0")) / 100);
    }, 0);

    // For Gross-based percentages, we need to solve:
    // Gross = Fixed + BasicPercent + GrossPercent
    // Gross = Fixed + BasicPercent + (Gross × sum of gross percentages)
    // Gross × (1 - sum of gross percentages) = Fixed + BasicPercent
    // Gross = (Fixed + BasicPercent) / (1 - sum of gross percentages)

    const grossPercentSum = grossPercentComponents.reduce((sum, comp) => {
      return sum + (parseFloat(comp.value || "0") / 100);
    }, 0);

    const baseAmount = fixedTotal + basicPercentTotal;

    if (grossPercentSum >= 1) {
      // Invalid configuration - percentages add up to 100% or more
      return baseAmount;
    }

    const calculatedGross = baseAmount / (1 - grossPercentSum);

    return Math.round(calculatedGross);
  };

  const grossSalary = calculateTotalEarnings();

  // Calculate total deductions
  const calculateTotalDeductions = (): number => {
    const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;

    return deductionComponents.reduce((total, comp) => {
      if (comp.type === "Fixed") return total + parseFloat(comp.value || "0");
      if (comp.baseOn === "Basic") return total + Math.round((effectiveBasic * parseFloat(comp.value || "0")) / 100);
      if (comp.baseOn === "Gross") return total + Math.round((grossSalary * parseFloat(comp.value || "0")) / 100);
      return total;
    }, 0);
  };

  const totalDeductions = calculateTotalDeductions();
  const netSalary = grossSalary - totalDeductions;

  // Calculate total employer cost
  const calculateTotalEmployerCost = (): number => {
    const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;

    return employerContributions.reduce((total, comp) => {
      if (comp.type === "Fixed") return total + parseFloat(comp.value || "0");
      if (comp.baseOn === "Basic") return total + Math.round((effectiveBasic * parseFloat(comp.value || "0")) / 100);
      if (comp.baseOn === "Gross") return total + Math.round((grossSalary * parseFloat(comp.value || "0")) / 100);
      return total;
    }, 0);
  };

  const totalEmployerCost = calculateTotalEmployerCost();
  const ctcAnnual = (netSalary + totalEmployerCost) * 12;

  // Use calculated values for display
  const values = {
    basic: `₹${basicSalary.toLocaleString('en-IN')}`,
    hra: earningsComponents.find(c => c.name === "HRA")?.value || "0",
    allowances: earningsComponents.find(c => c.name === "Allowances")?.value || "0",
    gross: `₹${grossSalary.toLocaleString('en-IN')}`,
    pt: `₹${deductionComponents.find(c => c.name === "Professional Tax")?.value || "200"}`,
    net: `₹${netSalary.toLocaleString('en-IN')}`,
  };

  const addIncentiveRule = () => {
    setIncentiveRules([...incentiveRules, { id: nextIncentiveId, type: "Per Unit", valueType: "₹", value: "" }]);
    setNextIncentiveId(nextIncentiveId + 1);
  };

  const removeIncentiveRule = (id: number) => {
    setIncentiveRules(incentiveRules.filter(rule => rule.id !== id));
  };

  const updateIncentiveRule = (id: number, field: keyof IncentiveRule, value: any) => {
    setIncentiveRules(incentiveRules.map(rule =>
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  // Helper functions for Earnings Components
  const addEarningsComponent = () => {
    setAddingToSection("earnings");
    setShowAddDialog(true);
  };

  const addComponentFromMaster = (masterComponentId: string) => {
    const masterComponent = DEFAULT_PAY_COMPONENTS.find(c => c.id === masterComponentId);
    if (!masterComponent) return;

    if (addingToSection === "earnings" && masterComponent.payType === "Earning") {
      // Check if already exists
      if (earningsComponents.some(c => c.name === masterComponent.name)) {
        return;
      }
      setEarningsComponents([...earningsComponents, {
        id: nextEarningsId,
        name: masterComponent.name,
        type: "Fixed",
        value: "0",
        baseOn: "Basic"
      }]);
      setNextEarningsId(nextEarningsId + 1);
    } else if (addingToSection === "deductions" && masterComponent.payType === "Deduction") {
      if (deductionComponents.some(c => c.name === masterComponent.name)) {
        return;
      }
      setDeductionComponents([...deductionComponents, {
        id: nextDeductionId,
        name: masterComponent.name,
        type: "Fixed",
        value: "0",
        baseOn: "Basic"
      }]);
      setNextDeductionId(nextDeductionId + 1);
    } else if (addingToSection === "employer" && masterComponent.payType === "Employer Contribution") {
      if (employerContributions.some(c => c.name === masterComponent.name)) {
        return;
      }
      setEmployerContributions([...employerContributions, {
        id: nextEmployerContribId,
        name: masterComponent.name,
        type: "%",
        value: "0",
        baseOn: "Basic"
      }]);
      setNextEmployerContribId(nextEmployerContribId + 1);
    }

    setShowAddDialog(false);
  };

  const updateEarningsComponent = (id: number, field: keyof SalaryComponent, value: any) => {
    setEarningsComponents(earningsComponents.map(comp =>
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  const deleteEarningsComponent = (id: number) => {
    setEarningsComponents(earningsComponents.filter(comp => comp.id !== id));
  };

  const moveEarningsComponent = (id: number, direction: "up" | "down") => {
    const index = earningsComponents.findIndex(comp => comp.id === id);
    if ((direction === "up" && index > 0) || (direction === "down" && index < earningsComponents.length - 1)) {
      const newComponents = [...earningsComponents];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newComponents[index], newComponents[swapIndex]] = [newComponents[swapIndex], newComponents[index]];
      setEarningsComponents(newComponents);
    }
  };

  // Helper functions for Deduction Components
  const addDeductionComponent = () => {
    setAddingToSection("deductions");
    setShowAddDialog(true);
  };

  const updateDeductionComponent = (id: number, field: keyof SalaryComponent, value: any) => {
    setDeductionComponents(deductionComponents.map(comp =>
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  const deleteDeductionComponent = (id: number) => {
    setDeductionComponents(deductionComponents.filter(comp => comp.id !== id));
  };

  const moveDeductionComponent = (id: number, direction: "up" | "down") => {
    const index = deductionComponents.findIndex(comp => comp.id === id);
    if ((direction === "up" && index > 0) || (direction === "down" && index < deductionComponents.length - 1)) {
      const newComponents = [...deductionComponents];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newComponents[index], newComponents[swapIndex]] = [newComponents[swapIndex], newComponents[index]];
      setDeductionComponents(newComponents);
    }
  };

  // Helper functions for Employer Contributions
  const addEmployerContribution = () => {
    setAddingToSection("employer");
    setShowAddDialog(true);
  };

  const updateEmployerContribution = (id: number, field: keyof SalaryComponent, value: any) => {
    setEmployerContributions(employerContributions.map(comp =>
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  const deleteEmployerContribution = (id: number) => {
    setEmployerContributions(employerContributions.filter(comp => comp.id !== id));
  };

  const moveEmployerContribution = (id: number, direction: "up" | "down") => {
    const index = employerContributions.findIndex(comp => comp.id === id);
    if ((direction === "up" && index > 0) || (direction === "down" && index < employerContributions.length - 1)) {
      const newComponents = [...employerContributions];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newComponents[index], newComponents[swapIndex]] = [newComponents[swapIndex], newComponents[index]];
      setEmployerContributions(newComponents);
    }
  };

  const handleDuplicateStructure = (structure: SavedSalaryStructure) => {
    // Create a copy of the structure
    const duplicatedStructure: SavedSalaryStructure = {
      ...structure,
      id: `struct-${Date.now()}`,
      name: `${structure.name} — Copy`,
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to saved structures
    setSavedStructures([...savedStructures, duplicatedStructure]);

    // Load the duplicated structure into the builder for editing
    setCurrentStructureName(duplicatedStructure.name);
    setCurrentStructureStatus(duplicatedStructure.status);
    setEditingStructureId(duplicatedStructure.id);
    setSelectedRole(duplicatedStructure.role);
    setEmploymentType(duplicatedStructure.employmentType);
    setEarningsComponents(duplicatedStructure.earningsComponents);
    setDeductionComponents(duplicatedStructure.deductionComponents);
    setEmployerContributions(duplicatedStructure.employerContributions);
    setIncentiveRules(duplicatedStructure.incentiveRules);
    setShowStructureBuilder(true);

    toast.success("Structure duplicated. You are now editing the copy.");
  };

  const handleSaveStructure = () => {
    if (!currentStructureName.trim()) {
      toast.error("Please enter a structure name");
      return;
    }

    const structureData: SavedSalaryStructure = {
      id: editingStructureId || `struct-${Date.now()}`,
      name: currentStructureName,
      role: selectedRole,
      employmentType,
      status: currentStructureStatus,
      earningsComponents,
      deductionComponents,
      employerContributions,
      incentiveRules,
      createdAt: editingStructureId
        ? savedStructures.find(s => s.id === editingStructureId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingStructureId) {
      // Update existing
      setSavedStructures(savedStructures.map(s => s.id === editingStructureId ? structureData : s));
      toast.success("Structure updated successfully");
    } else {
      // Create new
      setSavedStructures([...savedStructures, structureData]);
      toast.success("Structure saved successfully");
    }

    // Reset and go back to list
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setShowStructureBuilder(false);
    setCurrentStructureName("");
    setCurrentStructureStatus("Draft");
    setEditingStructureId(null);
  };

  const handleNewStructure = () => {
    setCurrentStructureName("");
    setCurrentStructureStatus("Draft");
    setEditingStructureId(null);
    setShowStructureBuilder(true);
  };

  const handleEditStructure = (structure: SavedSalaryStructure) => {
    setCurrentStructureName(structure.name);
    setCurrentStructureStatus(structure.status);
    setEditingStructureId(structure.id);
    setSelectedRole(structure.role);
    setEmploymentType(structure.employmentType);
    setEarningsComponents(structure.earningsComponents);
    setDeductionComponents(structure.deductionComponents);
    setEmployerContributions(structure.employerContributions);
    setIncentiveRules(structure.incentiveRules);
    setShowStructureBuilder(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Salary Structure Builder</h2>
          <p className="text-sm text-gray-500 mt-1">
            {showStructureBuilder
              ? "Configure salary structure components and rules"
              : "Manage salary structures for different roles"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {showStructureBuilder ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveStructure} className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Save Structure
              </Button>
            </>
          ) : (
            <>
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
                <Settings className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Salary Configuration</span>
              </Badge>
              <Button onClick={handleNewStructure} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Structure
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Structures List View */}
      {!showStructureBuilder && (
        <>
          {savedStructures.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Salary Structures Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first salary structure to get started
                </p>
                <Button onClick={handleNewStructure} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Structure
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedStructures.map((structure) => (
                <Card key={structure.id} className="border-2 hover:border-purple-300 transition-colors">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{structure.name}</h3>
                          <Badge
                            className={
                              structure.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {structure.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {availableRoles.find(r => r.id === structure.role)?.label || structure.role}
                            </Badge>
                          </span>
                          <span>•</span>
                          <span>{structure.employmentType}</span>
                          <span>•</span>
                          <span>{structure.earningsComponents.length} Earnings</span>
                          <span>•</span>
                          <span>{structure.deductionComponents.length} Deductions</span>
                          <span>•</span>
                          <span>{structure.incentiveRules.length} Incentive Rules</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {new Date(structure.updatedAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateStructure(structure)}
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStructure(structure)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Structure Builder Form */}
      {showStructureBuilder && (
        <>
          {/* Structure Name and Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Structure Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Structure Name *</Label>
                  <Input
                    value={currentStructureName}
                    onChange={(e) => setCurrentStructureName(e.target.value)}
                    placeholder="e.g., Car Washer - Full Time - Standard"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={currentStructureStatus} onValueChange={(val) => setCurrentStructureStatus(val as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {showStructureBuilder && (
        <>

      {/* Single Source of Truth Label */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <Database className="w-5 h-5 text-purple-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-purple-900">Single Source of Truth</p>
          <p className="text-xs text-purple-700">
            This is the ONLY place to configure salary structures and incentive rules.
            All settings used by <span className="font-semibold">payrollEngine</span> and <span className="font-semibold">incentiveEngine</span>.
          </p>
        </div>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: payrollEngine + incentiveEngine</p>
          <p className="text-xs text-blue-700">
            Role-based configuration • Calculations performed by payrollEngine
          </p>
        </div>
      </div>

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Auto-loaded from role defaults
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Salary Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salary Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employment Type Section */}
          <div className="pb-6 border-b">
            <h3 className="font-semibold text-gray-700 mb-4">Employment Type</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employment-type" className="flex items-center gap-1">
                  Employment Type <span className="text-red-500">*</span>
                </Label>
                <Select value={employmentType} onValueChange={(value) => setEmploymentType(value as any)}>
                  <SelectTrigger id="employment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Part-Time Conditional Fields */}
              {employmentType === "Part-Time" && (
                <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="space-y-2">
                    <Label htmlFor="ft-reference-salary">Full-Time Reference Salary</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        id="ft-reference-salary"
                        type="number"
                        placeholder="30000"
                        value={ftReferenceSalary}
                        onChange={(e) => setFtReferenceSalary(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="working-hours">Working Hours Per Day</Label>
                      <Input
                        id="working-hours"
                        type="number"
                        placeholder="4"
                        value={workingHoursPerDay}
                        onChange={(e) => setWorkingHoursPerDay(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="standard-hours">Standard Full-Time Hours</Label>
                      <Input
                        id="standard-hours"
                        type="number"
                        placeholder="8"
                        value={standardFtHours}
                        onChange={(e) => setStandardFtHours(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-amber-800 bg-amber-100 p-2 rounded border border-amber-300">
                    ℹ️ Salary will be auto-calculated based on hours ratio
                  </p>
                </div>
              )}

              {/* Contract Conditional Fields */}
              {employmentType === "Contract" && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contract-start">Contract Start Date</Label>
                      <Input
                        id="contract-start"
                        type="date"
                        value={contractStartDate}
                        onChange={(e) => setContractStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contract-end">Contract End Date</Label>
                      <Input
                        id="contract-end"
                        type="date"
                        value={contractEndDate}
                        onChange={(e) => setContractEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract-type">Contract Type</Label>
                    <Select value={contractType} onValueChange={(value) => setContractType(value as any)}>
                      <SelectTrigger id="contract-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed Pay">Fixed Pay</SelectItem>
                        <SelectItem value="Per Unit">Per Unit</SelectItem>
                        <SelectItem value="Hybrid (Fixed + Incentive)">Hybrid (Fixed + Incentive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1. Earnings Section - Editable */}
          <div className="p-4 bg-blue-50/30 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-blue-600">1.</span> Earnings
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEarningsComponent}
                className="h-8 gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="w-3 h-3" />
                Add Component
              </Button>
            </div>
            <div className="space-y-2">
              {earningsComponents.map((comp, index) => (
                <div key={comp.id} className="p-2 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveEarningsComponent(comp.id, "up")}
                        disabled={index === 0}
                        className="h-4 w-5 p-0 hover:bg-blue-100"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveEarningsComponent(comp.id, "down")}
                        disabled={index === earningsComponents.length - 1}
                        className="h-4 w-5 p-0 hover:bg-blue-100"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Component Name */}
                    <Input
                      value={comp.name}
                      onChange={(e) => updateEarningsComponent(comp.id, "name", e.target.value)}
                      className="h-8 flex-1"
                      placeholder="Component Name"
                    />

                    {/* Type Toggle */}
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={comp.type === "Fixed" ? "default" : "outline"}
                        onClick={() => updateEarningsComponent(comp.id, "type", "Fixed")}
                        className="h-8 px-2 text-xs"
                      >
                        ₹
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={comp.type === "%" ? "default" : "outline"}
                        onClick={() => updateEarningsComponent(comp.id, "type", "%")}
                        className="h-8 px-2 text-xs"
                      >
                        %
                      </Button>
                    </div>

                    {/* Base On (for percentage) */}
                    {comp.type === "%" && (
                      <Select
                        value={comp.baseOn || "Basic"}
                        onValueChange={(value) => updateEarningsComponent(comp.id, "baseOn", value)}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Gross">Gross</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Value Input */}
                    <Input
                      type="number"
                      value={comp.value}
                      onChange={(e) => updateEarningsComponent(comp.id, "value", e.target.value)}
                      className="h-8 w-24"
                      placeholder="0"
                    />

                    {/* Delete Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEarningsComponent(comp.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={comp.name === "Basic Salary"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {employmentType === "Part-Time" && comp.name === "Basic Salary" && proratedSalary && (
                    <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-700 border-amber-300 text-xs">
                      Auto-calculated from prorated salary (editable)
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Incentives Section - NEW */}
          <div className="p-4 bg-purple-50/30 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-purple-600">2.</span> Incentives
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addIncentiveRule}
                className="h-8 gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Plus className="w-3 h-3" />
                Add Rule
              </Button>
            </div>
            <div className="space-y-3">
              {incentiveRules.map((rule) => (
                <div key={rule.id} className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Incentive Type</Label>
                      <Select
                        value={rule.type}
                        onValueChange={(value) => updateIncentiveRule(rule.id, "type", value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Per Unit">Per Unit</SelectItem>
                          <SelectItem value="Per Day">Per Day</SelectItem>
                          <SelectItem value="Performance Slab">Performance Slab</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Value Type</Label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={rule.valueType === "₹" ? "default" : "outline"}
                          onClick={() => updateIncentiveRule(rule.id, "valueType", "₹")}
                          className="flex-1 h-9"
                        >
                          ₹
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={rule.valueType === "%" ? "default" : "outline"}
                          onClick={() => updateIncentiveRule(rule.id, "valueType", "%")}
                          className="flex-1 h-9"
                        >
                          %
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Value</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          placeholder="50"
                          value={rule.value}
                          onChange={(e) => updateIncentiveRule(rule.id, "value", e.target.value)}
                          className="h-9"
                        />
                        {incentiveRules.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeIncentiveRule(rule.id)}
                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Employer Contributions Section - Editable */}
          <div className="p-4 bg-green-50/30 rounded-lg border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-green-600">3.</span> Employer Contributions
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEmployerContribution}
                className="h-8 gap-1 border-green-300 text-green-700 hover:bg-green-50"
              >
                <Plus className="w-3 h-3" />
                Add Component
              </Button>
            </div>
            <div className="space-y-2">
              {employerContributions.map((comp, index) => (
                <div key={comp.id} className="p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveEmployerContribution(comp.id, "up")}
                        disabled={index === 0}
                        className="h-4 w-5 p-0 hover:bg-green-100"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveEmployerContribution(comp.id, "down")}
                        disabled={index === employerContributions.length - 1}
                        className="h-4 w-5 p-0 hover:bg-green-100"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Component Name */}
                    <Input
                      value={comp.name}
                      onChange={(e) => updateEmployerContribution(comp.id, "name", e.target.value)}
                      className="h-8 flex-1"
                      placeholder="Component Name"
                    />

                    {/* Type Toggle */}
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={comp.type === "Fixed" ? "default" : "outline"}
                        onClick={() => updateEmployerContribution(comp.id, "type", "Fixed")}
                        className="h-8 px-2 text-xs"
                      >
                        ₹
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={comp.type === "%" ? "default" : "outline"}
                        onClick={() => updateEmployerContribution(comp.id, "type", "%")}
                        className="h-8 px-2 text-xs"
                      >
                        %
                      </Button>
                    </div>

                    {/* Base On (for percentage) */}
                    {comp.type === "%" && (
                      <Select
                        value={comp.baseOn || "Basic"}
                        onValueChange={(value) => updateEmployerContribution(comp.id, "baseOn", value)}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Gross">Gross</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Value Input */}
                    <Input
                      type="number"
                      value={comp.value}
                      onChange={(e) => updateEmployerContribution(comp.id, "value", e.target.value)}
                      className="h-8 w-24"
                      placeholder="0"
                    />

                    {/* Delete Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEmployerContribution(comp.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Employee Deductions Section - Editable */}
          <div className="p-4 bg-red-50/30 rounded-lg border border-red-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-red-600">4.</span> Employee Deductions
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addDeductionComponent}
                className="h-8 gap-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                <Plus className="w-3 h-3" />
                Add Component
              </Button>
            </div>
            <div className="space-y-2">
              {deductionComponents.map((comp, index) => (
                <div key={comp.id} className="p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveDeductionComponent(comp.id, "up")}
                        disabled={index === 0}
                        className="h-4 w-5 p-0 hover:bg-red-100"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveDeductionComponent(comp.id, "down")}
                        disabled={index === deductionComponents.length - 1}
                        className="h-4 w-5 p-0 hover:bg-red-100"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Component Name */}
                    <Input
                      value={comp.name}
                      onChange={(e) => updateDeductionComponent(comp.id, "name", e.target.value)}
                      className="h-8 flex-1"
                      placeholder="Component Name"
                    />

                    {/* Type Toggle */}
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={comp.type === "Fixed" ? "default" : "outline"}
                        onClick={() => updateDeductionComponent(comp.id, "type", "Fixed")}
                        className="h-8 px-2 text-xs"
                      >
                        ₹
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={comp.type === "%" ? "default" : "outline"}
                        onClick={() => updateDeductionComponent(comp.id, "type", "%")}
                        className="h-8 px-2 text-xs"
                      >
                        %
                      </Button>
                    </div>

                    {/* Base On (for percentage) */}
                    {comp.type === "%" && (
                      <Select
                        value={comp.baseOn || "Basic"}
                        onValueChange={(value) => updateDeductionComponent(comp.id, "baseOn", value)}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Gross">Gross</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Value Input */}
                    <Input
                      type="number"
                      value={comp.value}
                      onChange={(e) => updateDeductionComponent(comp.id, "value", e.target.value)}
                      className="h-8 w-24"
                      placeholder="0"
                    />

                    {/* Delete Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteDeductionComponent(comp.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="border-t pt-6">
            <h3 className="font-bold text-gray-900 mb-4">Live Salary Breakdown</h3>

            {/* Part-Time Calculation Note */}
            {employmentType === "Part-Time" && proratedSalary && (
              <div className="mb-4 p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 text-sm mb-1">
                      Prorated Salary Calculation:
                    </p>
                    <p className="text-xs text-amber-800 font-mono bg-amber-100 p-2 rounded border border-amber-200">
                      ({workingHoursPerDay || "0"} hours / {standardFtHours} hours) × ₹{ftReferenceSalary ? parseFloat(ftReferenceSalary).toLocaleString('en-IN') : "0"}
                    </p>
                    <div className="mt-2 pt-2 border-t border-amber-300">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-amber-800 font-medium">Calculated Basic Salary:</span>
                        <span className="font-bold text-amber-900">₹{proratedSalary.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* 1. Earnings Summary */}
              <div className="p-4 bg-green-50/40 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 text-sm">Earnings Summary</h4>
                <div className="space-y-2">
                  {earningsComponents.map((comp) => {
                    let amount = 0;

                    // Determine effective basic for calculations
                    const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;

                    if (comp.type === "Fixed") {
                      // For Part-Time, Basic Salary uses prorated value
                      if (employmentType === "Part-Time" && proratedSalary && comp.name === "Basic Salary") {
                        amount = proratedSalary;
                      } else {
                        amount = parseFloat(comp.value || "0");
                      }
                    } else if (comp.type === "%" && comp.baseOn === "Basic") {
                      amount = Math.round((effectiveBasic * parseFloat(comp.value || "0")) / 100);
                    } else if (comp.type === "%" && comp.baseOn === "Gross") {
                      // For Gross-based percentages, use the calculated gross salary
                      amount = Math.round((grossSalary * parseFloat(comp.value || "0")) / 100);
                    }
                    return (
                      <div key={comp.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{comp.name}</span>
                        <span className="font-medium">₹{amount.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Incentives (Estimated)</span>
                    <span className="font-medium">
                      ₹{(() => {
                        const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                        return incentiveRules.reduce((total, rule) => {
                          const val = parseFloat(rule.value || "0");
                          return total + (rule.valueType === "₹" ? val : Math.round((effectiveBasic * val) / 100));
                        }, 0).toLocaleString('en-IN');
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span className="font-semibold text-green-900">Total Earnings</span>
                    <span className="font-bold text-green-700">₹{grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* 2. Deductions */}
              <div className="p-4 bg-red-50/40 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-3 text-sm">Deductions</h4>
                <div className="space-y-2">
                  {deductionComponents.map((comp) => {
                    let amount = 0;
                    const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;

                    if (comp.type === "Fixed") {
                      amount = parseFloat(comp.value || "0");
                    } else if (comp.baseOn === "Basic") {
                      amount = Math.round((effectiveBasic * parseFloat(comp.value || "0")) / 100);
                    } else if (comp.baseOn === "Gross") {
                      amount = Math.round((grossSalary * parseFloat(comp.value || "0")) / 100);
                    }
                    return (
                      <div key={comp.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {comp.name} {comp.type === "%" && `(${comp.value}%)`}
                        </span>
                        <span className="font-medium">₹{amount.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2 border-t border-red-300">
                    <span className="font-semibold text-red-900">Total Deductions</span>
                    <span className="font-bold text-red-700">₹{totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* 3. Employer Cost */}
              <div className="p-4 bg-orange-50/40 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3 text-sm">Employer Cost</h4>
                <div className="space-y-2">
                  {employerContributions.map((contrib) => {
                    let amount = 0;
                    const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;

                    if (contrib.type === "Fixed") {
                      amount = parseFloat(contrib.value || "0");
                    } else if (contrib.baseOn === "Basic") {
                      amount = Math.round((effectiveBasic * parseFloat(contrib.value || "0")) / 100);
                    } else if (contrib.baseOn === "Gross") {
                      amount = Math.round((grossSalary * parseFloat(contrib.value || "0")) / 100);
                    }
                    return (
                      <div key={contrib.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {contrib.name} ({contrib.type === "%" ? `${contrib.value}%` : `₹${contrib.value}`})
                        </span>
                        <span className="font-medium">₹{amount.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2 border-t border-orange-300">
                    <span className="font-semibold text-orange-900">Total Employer Cost</span>
                    <span className="font-bold text-orange-700">₹{totalEmployerCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* 4. Final Summary - Highlighted */}
              <div className="p-5 bg-blue-100 rounded-lg border-2 border-blue-400 shadow-sm">
                <h4 className="font-bold text-blue-900 mb-4 text-base">Final Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                    <span className="font-medium text-gray-700">Gross Salary</span>
                    <span className="font-bold text-gray-900">₹{grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-md">
                    <span className="font-medium text-gray-700">Net Salary</span>
                    <span className="font-bold text-gray-900">₹{netSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-600 rounded-md">
                    <span className="font-bold text-white text-lg">CTC (Annual)</span>
                    <span className="text-2xl font-bold text-white">
                      ₹{(ctcAnnual / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </div>

              {/* Contract Summary - Only for Contract Employment Type */}
              {employmentType === "Contract" && (
                <div className="p-4 bg-purple-50/40 rounded-lg border-2 border-purple-300">
                  <h4 className="font-semibold text-purple-900 mb-3 text-sm flex items-center gap-2">
                    <span>📄</span> Contract Summary
                  </h4>
                  <div className="space-y-3">
                    {/* Contract Duration */}
                    <div className="p-3 bg-white rounded-md border border-purple-200">
                      <p className="text-xs text-gray-500 mb-1">Contract Duration</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {contractStartDate || "Not set"}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-gray-900">
                          {contractEndDate || "Not set"}
                        </span>
                      </div>
                      {contractStartDate && contractEndDate && (
                        <p className="text-xs text-purple-600 mt-1">
                          {(() => {
                            const start = new Date(contractStartDate);
                            const end = new Date(contractEndDate);
                            const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
                            return `Duration: ${months} month${months !== 1 ? 's' : ''}`;
                          })()}
                        </p>
                      )}
                    </div>

                    {/* Contract Type */}
                    <div className="p-3 bg-white rounded-md border border-purple-200">
                      <p className="text-xs text-gray-500 mb-1">Contract Type</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                          {contractType}
                        </Badge>
                      </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="p-3 bg-white rounded-md border border-purple-200">
                      <p className="text-xs text-gray-500 mb-1">Payment Mode</p>
                      <p className="text-sm font-medium text-gray-900">
                        {contractType === "Fixed Pay" && "Fixed Monthly Payment"}
                        {contractType === "Per Unit" && "Per Unit Basis"}
                        {contractType === "Hybrid (Fixed + Incentive)" && "Fixed Base + Performance Incentive"}
                      </p>
                    </div>

                    {/* Estimated Monthly Earnings - Only for Per Unit */}
                    {contractType === "Per Unit" && (
                      <div className="p-3 bg-purple-100 rounded-md border-2 border-purple-300">
                        <p className="text-xs text-purple-700 font-semibold mb-2">
                          Estimated Monthly Earnings
                        </p>
                        <p className="text-xs text-purple-800 mb-2">
                          Based on average units (assumed: 500 units/month)
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-purple-300">
                          <span className="text-sm font-medium text-purple-900">Estimated Total:</span>
                          <span className="text-lg font-bold text-purple-700">
                            ₹{(() => {
                              const perUnitRule = incentiveRules.find(r => r.type === "Per Unit");
                              const ratePerUnit = perUnitRule ? parseFloat(perUnitRule.value || "50") : 50;
                              return (500 * ratePerUnit).toLocaleString('en-IN');
                            })()}
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 mt-2">
                          Calculation: 500 units × ₹{incentiveRules.find(r => r.type === "Per Unit")?.value || "50"}/unit
                        </p>
                      </div>
                    )}

                    {/* Estimated Monthly Earnings - Only for Hybrid */}
                    {contractType === "Hybrid (Fixed + Incentive)" && (
                      <div className="p-3 bg-purple-100 rounded-md border-2 border-purple-300">
                        <p className="text-xs text-purple-700 font-semibold mb-2">
                          Estimated Monthly Earnings
                        </p>
                        <div className="space-y-1 text-xs mb-2">
                          <div className="flex justify-between">
                            <span className="text-purple-800">Fixed Component:</span>
                            <span className="font-medium text-purple-900">₹{(() => {
                              const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                              return effectiveBasic.toLocaleString('en-IN');
                            })()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-purple-800">Variable Incentive (avg):</span>
                            <span className="font-medium text-purple-900">
                              ₹{(() => {
                                const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                                return incentiveRules.reduce((total, rule) => {
                                  const val = parseFloat(rule.value || "0");
                                  return total + (rule.valueType === "₹" ? val : Math.round((effectiveBasic * val) / 100));
                                }, 0).toLocaleString('en-IN');
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-purple-300">
                          <span className="text-sm font-medium text-purple-900">Estimated Total:</span>
                          <span className="text-lg font-bold text-purple-700">
                            ₹{(() => {
                              const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                              return (effectiveBasic + incentiveRules.reduce((total, rule) => {
                                const val = parseFloat(rule.value || "0");
                                return total + (rule.valueType === "₹" ? val : Math.round((effectiveBasic * val) / 100));
                              }, 0)).toLocaleString('en-IN');
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incentive Preview Section */}
      <Card className="border-2 border-orange-300">
        <CardHeader className="bg-orange-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-orange-900">
              Incentive Preview (Simulation Only)
            </CardTitle>
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              Monthly Projection
            </Badge>
          </div>
          {/* Warning Strip */}
          <div className="flex items-center gap-2 p-3 bg-orange-100 rounded-lg border border-orange-200 mt-3">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-sm text-orange-800 font-medium">
              This is a simulation. Not final payout.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: KPI Inputs */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">KPI Inputs</h3>
              <div className="space-y-4">
                {selectedRole === "car-washer" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="kpi-units">Units Washed</Label>
                      <Input
                        id="kpi-units"
                        type="number"
                        value={kpiUnitsWashed}
                        onChange={(e) => setKpiUnitsWashed(e.target.value)}
                        placeholder="95"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kpi-addons">Add-ons Sold</Label>
                      <Input
                        id="kpi-addons"
                        type="number"
                        value={kpiAddOnsSold}
                        onChange={(e) => setKpiAddOnsSold(e.target.value)}
                        placeholder="8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kpi-rating">Customer Rating</Label>
                      <Input
                        id="kpi-rating"
                        type="number"
                        step="0.1"
                        value={kpiCustomerRating}
                        onChange={(e) => setKpiCustomerRating(e.target.value)}
                        placeholder="4.5"
                      />
                    </div>
                  </>
                ) : (
                  kpis.map((kpi, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`kpi-${index}`}>{kpi.label}</Label>
                      <Input
                        id={`kpi-${index}`}
                        type="number"
                        placeholder={kpi.placeholder}
                        defaultValue={kpi.placeholder}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT: Output */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Output</h3>
              <div className="space-y-3">
                {incentiveRules.map((rule, idx) => {
                  let amount = 0;
                  let displayText = rule.type;

                  if (selectedRole === "car-washer" && rule.type === "Per Unit") {
                    // For car washer, show additional units only
                    const ratePerUnit = parseFloat(rule.value || "50");
                    const actualUnits = parseFloat(kpiUnitsWashed) || 0;
                    const additionalUnits = Math.max(0, actualUnits - baseUnitsExpected);
                    amount = additionalUnits * ratePerUnit;
                    displayText = "Per Unit";
                  } else if (rule.valueType === "₹") {
                    amount = parseFloat(rule.value || "0");
                  } else {
                    amount = Math.round((basicSalary * parseFloat(rule.value || "0")) / 100);
                  }

                  return (
                    <div key={idx} className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-gray-700">{displayText}</span>
                      <span className="font-semibold text-blue-700">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-gray-700">Bonus (Estimated)</span>
                  <span className="font-semibold text-green-700">₹{(() => {
                    if (selectedRole === "car-washer") {
                      const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                      const rating = parseFloat(kpiCustomerRating) || 0;
                      const addOns = parseFloat(kpiAddOnsSold) || 0;
                      const ratePerUnit = parseFloat(incentiveRules.find(r => r.type === "Per Unit")?.value || "50");
                      const ratingBonus = rating > 4.5 ? Math.round(effectiveBasic * 0.01) : 0;
                      const addOnsBonus = addOns * ratePerUnit;
                      return (ratingBonus + addOnsBonus).toLocaleString('en-IN');
                    } else {
                      const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                      return Math.round(effectiveBasic * 0.05).toLocaleString('en-IN');
                    }
                  })()}</span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-gray-700">Penalty</span>
                  <span className="font-semibold text-red-700">-₹0</span>
                </div>
                <div className="flex justify-between p-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                  <span className="font-bold text-purple-900">Final Incentive</span>
                  <span className="text-xl font-bold text-purple-700">
                    ₹{(() => {
                      if (selectedRole === "car-washer") {
                        const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                        const ratePerUnit = parseFloat(incentiveRules.find(r => r.type === "Per Unit")?.value || "50");
                        const actualUnits = parseFloat(kpiUnitsWashed) || 0;
                        const additionalUnits = Math.max(0, actualUnits - baseUnitsExpected);
                        const addOns = parseFloat(kpiAddOnsSold) || 0;
                        const rating = parseFloat(kpiCustomerRating) || 0;

                        const additionalUnitsIncentive = additionalUnits * ratePerUnit;
                        const addOnsIncentive = addOns * ratePerUnit;
                        const ratingBonus = rating > 4.5 ? Math.round(effectiveBasic * 0.01) : 0;

                        return (additionalUnitsIncentive + addOnsIncentive + ratingBonus).toLocaleString('en-IN');
                      } else {
                        const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                        return (incentiveRules.reduce((total, rule) => {
                          const val = parseFloat(rule.value || "0");
                          return total + (rule.valueType === "₹" ? val : Math.round((effectiveBasic * val) / 100));
                        }, 0) + Math.round(effectiveBasic * 0.05)).toLocaleString('en-IN');
                      }
                    })()}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown for Washer */}
              {selectedRole === "car-washer" && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 text-sm">
                    Detailed Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    {/* Base Units (No Incentive) */}
                    <div className="flex justify-between text-gray-500">
                      <span>Base Units (No Incentive): {baseUnitsExpected} units</span>
                      <span className="font-medium">₹0</span>
                    </div>

                    {/* Additional Units (Incentive Paid) */}
                    {incentiveRules.map((rule, idx) => {
                      if (rule.type !== "Per Unit") return null;

                      const ratePerUnit = parseFloat(rule.value || "50");
                      const actualUnits = parseFloat(kpiUnitsWashed) || 0;
                      const additionalUnits = Math.max(0, actualUnits - baseUnitsExpected);
                      const amount = additionalUnits * ratePerUnit;

                      return (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span>Additional Units ({additionalUnits} × ₹{ratePerUnit})</span>
                          <span className="font-medium">₹{amount.toLocaleString('en-IN')}</span>
                        </div>
                      );
                    })}

                    {/* Add-ons */}
                    <div className="flex justify-between text-gray-700">
                      <span>Add-ons ({kpiAddOnsSold} × ₹{incentiveRules.find(r => r.type === "Per Unit")?.value || "50"})</span>
                      <span className="font-medium">₹{(parseFloat(kpiAddOnsSold) * parseFloat(incentiveRules.find(r => r.type === "Per Unit")?.value || "50")).toLocaleString('en-IN')}</span>
                    </div>

                    {/* Rating Bonus */}
                    <div className="flex justify-between text-gray-700">
                      <span>Rating Bonus ({kpiCustomerRating} &gt; 4.5)</span>
                      <span className="font-medium">₹{(() => {
                        const rating = parseFloat(kpiCustomerRating) || 0;
                        const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                        return rating > 4.5 ? Math.round(effectiveBasic * 0.01).toLocaleString('en-IN') : "0";
                      })()}</span>
                    </div>

                    {/* Total Incentive */}
                    <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-semibold text-blue-900">
                      <span>Total Incentive</span>
                      <span>
                        ₹{(() => {
                          const effectiveBasic = (employmentType === "Part-Time" && proratedSalary) ? proratedSalary : basicSalary;
                          const ratePerUnit = parseFloat(incentiveRules.find(r => r.type === "Per Unit")?.value || "50");
                          const actualUnits = parseFloat(kpiUnitsWashed) || 0;
                          const additionalUnits = Math.max(0, actualUnits - baseUnitsExpected);
                          const addOns = parseFloat(kpiAddOnsSold) || 0;
                          const rating = parseFloat(kpiCustomerRating) || 0;

                          const additionalUnitsIncentive = additionalUnits * ratePerUnit;
                          const addOnsIncentive = addOns * ratePerUnit;
                          const ratingBonus = rating > 4.5 ? Math.round(effectiveBasic * 0.01) : 0;

                          return (additionalUnitsIncentive + addOnsIncentive + ratingBonus).toLocaleString('en-IN');
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

        </>
      )}

      {/* Add Component Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add Component to{" "}
              {addingToSection === "earnings" ? "Earnings" : addingToSection === "deductions" ? "Deductions" : "Employer Contributions"}
            </DialogTitle>
            <DialogDescription>
              Select a component from the master pay components list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {DEFAULT_PAY_COMPONENTS
              .filter(comp => {
                if (addingToSection === "earnings") return comp.payType === "Earning";
                if (addingToSection === "deductions") return comp.payType === "Deduction";
                if (addingToSection === "employer") return comp.payType === "Employer Contribution";
                return false;
              })
              .map(comp => {
                const alreadyAdded =
                  (addingToSection === "earnings" && earningsComponents.some(c => c.name === comp.name)) ||
                  (addingToSection === "deductions" && deductionComponents.some(c => c.name === comp.name)) ||
                  (addingToSection === "employer" && employerContributions.some(c => c.name === comp.name));

                return (
                  <div
                    key={comp.id}
                    className={`p-4 rounded-lg border transition-all ${
                      alreadyAdded
                        ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
                        : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer"
                    }`}
                    onClick={() => !alreadyAdded && addComponentFromMaster(comp.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{comp.name}</h4>
                          {alreadyAdded && (
                            <Badge className="bg-gray-200 text-gray-600">Already Added</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {comp.compliance.pf && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              PF
                            </Badge>
                          )}
                          {comp.compliance.esic && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              ESIC
                            </Badge>
                          )}
                          {comp.compliance.pt && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              PT
                            </Badge>
                          )}
                          {comp.operations.gratuity && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              Gratuity
                            </Badge>
                          )}
                          {comp.operations.bonus && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              Bonus
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          comp.tds === "100% Taxable"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : comp.tds === "Conditional"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {comp.tds}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
