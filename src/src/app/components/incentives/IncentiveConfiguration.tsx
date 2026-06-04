import { BackButton } from "../ui/back-button";
/**
 * Incentive Configuration Panel
 *
 * Allows HR/Finance admins to configure incentive rules per role.
 * Uses existing design system components with proper data binding.
 *
 * @component
 */

import { useState, useEffect } from "react";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Save,
  Plus,
  Trash2,
  Pencil,
  Lock,
  Unlock,
  Database,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  Clock,
  XCircle,
  Info,
  HelpCircle,
  Star,
} from "lucide-react";
import { StatCard } from "../../design-system/components/StatCard";
import { logger } from "../../services/logger";

// Types
interface TimeBand {
  shiftName: string;
  startTime: string;
  endTime: string;
  baseQuota: number;
}

interface KPIMetric {
  metricCode: string;
  metricName: string;
  weight: number;
  dataSource: "Manual" | "Biometric" | "CRM" | "Calculated";
  trackingFrequency: "Real-time" | "Daily" | "Weekly" | "Monthly";
}

interface IncentiveRule {
  ruleId: string;
  ruleName: string;
  ruleType: "Per Unit" | "Tier-Based" | "Threshold" | "Achievement-Based";
  applicableMetric: string;
  value: string;
  threshold?: string;
  capPerDay?: string;
  capPerMonth?: string;
}

interface ApprovalLevel {
  level: number;
  approverRole: string;
  condition: string;
}

interface WasherIncentiveRules {
  baseUnits: string;
  maxUnits: string;
  perUnitRate: string;
  twoWheelerFactor: string;
  addonFactor: string;
  timeBand: {
    startTime: string;
    endTime: string;
  };
  maxIncentiveCapPerDay: string;
  // Score Weightage (NEW)
  qualityScoreWeight: number; // 0-100, percentage weight for quality score
  complianceScoreWeight: number; // 0-100, percentage weight for compliance score
  scoreCalculationNote: string; // Note explaining score derivation
}

interface TSECommissionRules {
  revenueSlab1Max: string; // 0-1L
  revenueSlab1Commission: string; // %
  revenueSlab2Max: string; // 1-2L
  revenueSlab2Commission: string; // %
  revenueSlab3Commission: string; // 2L+
  renewalBonus: string; // Fixed amount
  crmPenalty: string; // % penalty
}

interface TSMIncentiveRules {
  // Team Revenue Bonus (tiered)
  revenueTier1Target: string; // ₹10L
  revenueTier1Bonus: string; // ₹10,000
  revenueTier2Target: string; // ₹15L
  revenueTier2Bonus: string; // ₹20,000
  revenueTier3Target: string; // ₹20L+
  revenueTier3Bonus: string; // ₹40,000

  // Conversion Bonus
  conversionRateThreshold: string; // 22%
  conversionBonus: string; // ₹15,000

  // Renewal Bonus
  renewalRateThreshold: string; // 75%
  renewalBonus: string; // ₹10,000

  // Eligibility & Penalties
  crmComplianceThreshold: string; // 100%
  crmPenaltyPercent: string; // 20% reduction
  maxVariablePotential: string; // ₹65,000
}

interface SupervisorIncentiveRules {
  // BtL Conversion Incentive (split payment)
  conversionIncentiveAmount: string; // Total per conversion
  conversionPayment70Percent: string; // 70% on conversion
  conversionPayment30Percent: string; // 30% after 90 days

  // Quality Multiplier
  retentionTier1Threshold: string; // >80% retention
  retentionTier1Multiplier: string; // 1.2x
  retentionTier2Min: string; // 60%
  retentionTier2Max: string; // 80%
  retentionTier2Multiplier: string; // 1.0x
  retentionTier3Threshold: string; // <60% (warning)
  retentionTier3Multiplier: string; // 1.0x (no bonus)

  // KPI Structure (Total = 100%)
  kpiConversionWeight: string; // 40%
  kpiRetentionWeight: string; // 30%
  kpiAuditComplianceWeight: string; // 20%
  kpiCustomerComplaintsWeight: string; // 10%

  // Alert Thresholds
  alertConversionRateThreshold: string; // <30% triggers lead quality alert
  alertRetentionThreshold: string; // <60% flags to Ops Manager
  alertAuditComplianceMin: string; // <4/day triggers failure

  // Rules
  conversionTimeWindow: string; // 30 days from T0
  retentionMeasurementPeriod: string; // 90 days
}

interface OMIncentiveRules {
  // KPI Achievement Scoring Tiers
  achievementTier1Min: string; // ≥100% → 100% score
  achievementTier1Score: string; // 100%
  achievementTier2Min: string; // 90-99% → 70% score
  achievementTier2Max: string; // 99%
  achievementTier2Score: string; // 70%
  achievementTier3Score: string; // <90% → 0%

  // KPI Weights (Total = 100%)
  revenueWeight: string; // 40%
  conversionQualityWeight: string; // 20%
  retentionWeight: string; // 20%
  operationsProductivityWeight: string; // 10%
  customerExperienceWeight: string; // 10%

  // Bonus Multiplier Conditions
  bonusRevenueThreshold: string; // ≥100%
  bonusRetentionThreshold: string; // ≥80%
  bonusMultiplier: string; // 1.2x (20% additional)

  // Base Incentive Amount (for calculation)
  baseIncentiveAmount: string; // Monthly target incentive
}

interface CMIncentiveRules {
  // Cluster Manager (CM) KPI-based incentive structure
  // KPI Weights (Total = 100%)
  revenueWeight: string; // 35%
  conversionRateWeight: string; // 15%
  customerRetentionWeight: string; // 20%
  omPerformanceWeight: string; // 15%
  operationalComplianceWeight: string; // 10%
  customerExperienceWeight: string; // 5%

  // Revenue KPI Payout Tiers
  revenueTier1Min: string; // ≥100%
  revenueTier1Payout: string; // 100%
  revenueTier2Min: string; // 90-99%
  revenueTier2Max: string; // 99%
  revenueTier2Payout: string; // 70%
  revenueTier3Payout: string; // <90% → 0%

  // Conversion Rate KPI Payout Tiers
  conversionTier1Payout: string; // ≥target → 100%
  conversionTier2Threshold: string; // 10% below target
  conversionTier2Payout: string; // 70%
  conversionTier3Payout: string; // >10% below → 0%

  // Customer Retention KPI Payout Tiers
  retentionTier1Min: string; // ≥80%
  retentionTier1Payout: string; // 100%
  retentionTier2Min: string; // 70-79%
  retentionTier2Max: string; // 79%
  retentionTier2Payout: string; // 70%
  retentionTier3Payout: string; // <70% → 0%

  // OM Performance KPI Payout Tiers
  omPerformanceTier1Min: string; // 100% of OMs ≥90%
  omPerformanceTier1Payout: string; // 100%
  omPerformanceTier2Min: string; // 75-99% of OMs
  omPerformanceTier2Max: string; // 99%
  omPerformanceTier2Payout: string; // 70%
  omPerformanceTier3Payout: string; // <75% → 0%

  // Operational Compliance KPI Payout Tiers
  opComplianceTier1Min: string; // ≥90%
  opComplianceTier1Payout: string; // 100%
  opComplianceTier2Min: string; // 80-89%
  opComplianceTier2Max: string; // 89%
  opComplianceTier2Payout: string; // 50%
  opComplianceTier3Payout: string; // <80% → 0%

  // CX KPI Payout Tiers
  cxTier1Min: string; // ≥85%
  cxTier1Payout: string; // 100%
  cxTier2Min: string; // 75-84%
  cxTier2Max: string; // 84%
  cxTier2Payout: string; // 50%
  cxTier3Payout: string; // <75% → 0%

  // Team Multiplier Bonus
  teamBonusOMThreshold: string; // All OMs ≥90%
  teamBonusRetentionThreshold: string; // Cluster retention ≥80%
  teamBonusMultiplier: string; // 25% additional (1.25x)

  // Base Incentive Amount
  baseIncentiveAmount: string; // Monthly target incentive
}

interface CityManagerIncentiveRules {
  // KPI Weights (Total = 100%)
  revenueWeight: string; // 30%
  ebitdaWeight: string; // 25%
  customerRetentionWeight: string; // 15%
  expansionWeight: string; // 10%
  clusterPerformanceWeight: string; // 10%
  customerExperienceWeight: string; // 10%

  // EBITDA Threshold (Prerequisite for all payouts)
  ebitdaMinimumThreshold: string; // e.g., 45%
  ebitdaTarget: string; // e.g., 50%

  // Revenue KPI Payout Tiers
  revenueTier1Min: string; // ≥100%
  revenueTier1Payout: string; // 100%
  revenueTier2Min: string; // 90-99%
  revenueTier2Max: string; // 99%
  revenueTier2Payout: string; // 70%
  revenueTier3Payout: string; // <90% → 0%

  // EBITDA KPI Payout (with threshold prerequisite)
  ebitdaTier1Payout: string; // ≥target → 100%
  ebitdaTier2Payout: string; // Above minimum but below target → pro-rated
  ebitdaTier3Payout: string; // Below minimum → 0% + suspends all other KPIs

  // Customer Retention KPI Payout Tiers
  retentionTier1Min: string; // ≥80%
  retentionTier1Payout: string; // 100%
  retentionTier2Min: string; // 70-79%
  retentionTier2Max: string; // 79%
  retentionTier2Payout: string; // 70%
  retentionTier3Payout: string; // <70% → 0%

  // Expansion KPI Payout Tiers
  expansionTier1Min: string; // ≥100% of planned
  expansionTier1Payout: string; // 100%
  expansionTier2Min: string; // 75-99%
  expansionTier2Max: string; // 99%
  expansionTier2Payout: string; // 70%
  expansionTier3Payout: string; // <75% → 0%

  // Cluster Performance KPI Payout Tiers
  clusterPerfTier1Min: string; // 100% of clusters ≥90%
  clusterPerfTier1Payout: string; // 100%
  clusterPerfTier2Min: string; // 75-99% of clusters
  clusterPerfTier2Max: string; // 99%
  clusterPerfTier2Payout: string; // 70%
  clusterPerfTier3Payout: string; // <75% → 0%

  // CX KPI Payout Tiers
  cxTier1Min: string; // ≥85%
  cxTier1Payout: string; // 100%
  cxTier2Min: string; // 75-84%
  cxTier2Max: string; // 84%
  cxTier2Payout: string; // 50%
  cxTier3Payout: string; // <75% → 0%

  // Triple Bonus (Revenue ≥100% AND EBITDA ≥target AND Retention ≥80%)
  tripleBonusRevenueThreshold: string; // 100%
  tripleBonusEbitdaThreshold: string; // EBITDA target
  tripleBonusRetentionThreshold: string; // 80%
  tripleBonusMultiplier: string; // 0.30 (30% additional)

  // Base Incentive Amount
  baseIncentiveAmount: string; // Monthly target incentive
}

interface IncentiveConfigState {
  configName: string;
  effectiveFrom: string;
  effectiveTo: string;
  employeeTypes: string[];
  fullTimeQuota: string;
  partTimeQuota: string;
  calculationMethod: "Fixed" | "Time-Proportional" | "Shift-Based";
  timeBands: TimeBand[];
  kpiMetrics: KPIMetric[];
  incentiveRules: IncentiveRule[];
  washerRules?: WasherIncentiveRules;
  tseRules?: TSECommissionRules;
  tsmRules?: TSMIncentiveRules;
  supervisorRules?: SupervisorIncentiveRules;
  omRules?: OMIncentiveRules;
  cmRules?: CMIncentiveRules;
  cityManagerRules?: CityManagerIncentiveRules;
  payoutCycle: "Daily" | "Weekly" | "Bi-Weekly" | "Monthly";
  payoutMode: "With Salary" | "Separate";
  minimumPayout: string;
  approvalRequired: boolean;
  approvalLevels: ApprovalLevel[];
  budgetAllocated: string;
  status: "Draft" | "Pending" | "Approved" | "Active";
  // Versioning (NEW)
  version?: string; // Version number (e.g., "1.0", "1.1", "2.0")
  previousVersionId?: string; // Reference to previous version
  isImmutable?: boolean; // If true, config cannot be edited
  createdAt?: string; // Timestamp when version was created
  createdBy?: string; // User who created this version
}

// Available KPI Metrics (centralized)
const AVAILABLE_METRICS = [
  { code: "UNITS_WASHED", name: "Units Washed", dataType: "number" },
  { code: "ADD_ONS_SOLD", name: "Add-ons Sold", dataType: "number" },
  { code: "CUSTOMER_RATING", name: "Customer Rating", dataType: "decimal" },
  { code: "REVENUE", name: "Revenue Generated", dataType: "currency" },
  { code: "CONVERSIONS", name: "Conversions", dataType: "number" },
  { code: "CUSTOMER_SATISFACTION", name: "Customer Satisfaction", dataType: "decimal" },
  { code: "TASKS_COMPLETED", name: "Tasks Completed", dataType: "number" },
  { code: "EFFICIENCY_SCORE", name: "Efficiency Score", dataType: "percentage" },
  { code: "TEAM_PERFORMANCE", name: "Team Performance", dataType: "percentage" },
  { code: "MARGIN_PERCENTAGE", name: "Operating Margin %", dataType: "percentage" },
];

function IncentiveConfiguration() {
  // PHASE 2: Migrated to useEmployeeData (dual-read from EmployeeContext + HRDataContext)
  const { roles, departments, employees } = useEmployeeData();

  // Deferred render — unblocks React scheduler for instant navigation feel
  // Heavy JSX (3400+ lines) is deferred by one animation frame
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);

  // State
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("");
  const [config, setConfig] = useState<IncentiveConfigState>({
    configName: "",
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: "",
    employeeTypes: ["Full-Time", "Part-Time"],
    fullTimeQuota: "",
    partTimeQuota: "",
    calculationMethod: "Fixed",
    timeBands: [],
    kpiMetrics: [],
    incentiveRules: [],
    washerRules: undefined, // Will be set based on selected role
    tseRules: undefined, // Will be set based on selected role
    payoutCycle: "Monthly",
    payoutMode: "With Salary",
    minimumPayout: "0",
    approvalRequired: true,
    approvalLevels: [
      { level: 1, approverRole: "Supervisor", condition: "All incentives" },
    ],
    budgetAllocated: "",
    status: "Draft",
  });

  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<IncentiveRule | null>(null);

  // Get selected role data
  const selectedRole = (roles || []).find(r => r.code === selectedRoleCode);


  // Calculate metrics (mock data for now - should come from backend)
  const activeEmployeesInRole = (employees || []).filter(e =>
    selectedRole &&
    e.employmentInfo.role === selectedRole.name &&
    e.status === "active"
  ).length;

  // TODO: Replace with actual API call to get historical data
  const avgIncentiveLast3Months = 5625; // Mock data
  const estimatedMonthlyCost = activeEmployeesInRole * avgIncentiveLast3Months;
  const budgetUtilization = config.budgetAllocated
    ? (estimatedMonthlyCost / parseFloat(config.budgetAllocated)) * 100
    : 0;

  // Auto-select first role when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleCode) {
      const firstActiveRole = (roles || []).find(r => r.isActive);
      if (firstActiveRole) {
        setSelectedRoleCode(firstActiveRole.code);
      }
    }
  }, [roles, selectedRoleCode]);

  // Auto-set config name and role-specific defaults when role changes
  useEffect(() => {
    if (selectedRole) {
      setConfig(prev => {
        const updates: any = {
          configName: `${selectedRole.name} Incentive - ${new Date().toLocaleDateString('en-IN')}`,
          washerRules: undefined,
          tseRules: undefined,
          tsmRules: undefined,
        };

        // Set role-specific washer rules for Part Time Car Washer
        if (selectedRole.name === "Car Washer Part Time") {
          updates.washerRules = {
            baseUnits: "25",
            maxUnits: "33",
            perUnitRate: "25",
            twoWheelerFactor: "0.4",
            addonFactor: "0.5",
            timeBand: {
              startTime: "05:00",
              endTime: "09:00",
            },
            maxIncentiveCapPerDay: "38",
            qualityScoreWeight: 50,
            complianceScoreWeight: 50,
            scoreCalculationNote: "Scores are derived from system checklist completion, photo quality analysis, customer feedback, and QA audit results. These scores are automatically calculated and cannot be manually edited.",
          };
          updates.partTimeQuota = "25";
        }
        // Set role-specific washer rules for Full Time Car Washer
        else if (selectedRole.name === "Car Washer Full Time") {
          updates.washerRules = {
            baseUnits: "45",
            maxUnits: "55",
            perUnitRate: "25",
            twoWheelerFactor: "0.4",
            addonFactor: "0.5",
            timeBand: {
              startTime: "05:00",
              endTime: "22:00",
            },
            maxIncentiveCapPerDay: "60",
            qualityScoreWeight: 50,
            complianceScoreWeight: 50,
            scoreCalculationNote: "Scores are derived from system checklist completion, photo quality analysis, customer feedback, and QA audit results. These scores are automatically calculated and cannot be manually edited.",
          };
          updates.fullTimeQuota = "45";
        }
        // Set role-specific TSE commission rules
        else if (selectedRole.name === "Tele Sales Executive") {
          updates.tseRules = {
            revenueSlab1Max: "100000",
            revenueSlab1Commission: "3",
            revenueSlab2Max: "200000",
            revenueSlab2Commission: "5",
            revenueSlab3Commission: "7",
            renewalBonus: "100",
            crmPenalty: "20",
          };
        }
        // Set role-specific TSM incentive rules
        else if (selectedRole.name === "Tele Sales Manager") {
          updates.tsmRules = {
            revenueTier1Target: "1000000", // ₹10L
            revenueTier1Bonus: "10000", // ₹10,000
            revenueTier2Target: "1500000", // ₹15L
            revenueTier2Bonus: "20000", // ₹20,000
            revenueTier3Target: "2000000", // ₹20L+
            revenueTier3Bonus: "40000", // ₹40,000
            conversionRateThreshold: "22", // 22%
            conversionBonus: "15000", // ₹15,000
            renewalRateThreshold: "75", // 75%
            renewalBonus: "10000", // ₹10,000
            crmComplianceThreshold: "100", // 100%
            crmPenaltyPercent: "20", // 20% reduction
            maxVariablePotential: "65000", // ₹65,000
          };
        }
        // Set role-specific Supervisor incentive rules (BtL conversion & retention)
        else if (selectedRole.name === "Operations Supervisor") {
          updates.supervisorRules = {
            // Conversion Incentive (split payment)
            conversionIncentiveAmount: "5000", // ₹5,000 per BtL conversion
            conversionPayment70Percent: "3500", // 70% on conversion
            conversionPayment30Percent: "1500", // 30% after 90-day retention

            // Quality Multiplier (Retention-based)
            retentionTier1Threshold: "80", // >80% retention
            retentionTier1Multiplier: "1.2", // 1.2x multiplier
            retentionTier2Min: "60", // 60-80% retention
            retentionTier2Max: "80",
            retentionTier2Multiplier: "1.0", // Normal payout
            retentionTier3Threshold: "60", // <60% retention
            retentionTier3Multiplier: "1.0", // No bonus, warning issued

            // KPI Structure (Total = 100%)
            kpiConversionWeight: "40", // 40%
            kpiRetentionWeight: "30", // 30%
            kpiAuditComplianceWeight: "20", // 20%
            kpiCustomerComplaintsWeight: "10", // 10%

            // Alert Thresholds
            alertConversionRateThreshold: "30", // <30% triggers alert
            alertRetentionThreshold: "60", // <60% flags to Ops Manager
            alertAuditComplianceMin: "4", // <4 audits/day fails compliance

            // Time-based Rules
            conversionTimeWindow: "30", // 30 days from T0
            retentionMeasurementPeriod: "90", // 90 days
          };
        }
        // Set role-specific OM (Operations Manager) incentive rules
        else if (selectedRole.name === "Operations Manager") {
          updates.omRules = {
            // KPI Achievement Scoring Tiers
            achievementTier1Min: "100", // ≥100% of target
            achievementTier1Score: "100", // 100% score
            achievementTier2Min: "90", // 90-99% of target
            achievementTier2Max: "99",
            achievementTier2Score: "70", // 70% score
            achievementTier3Score: "0", // <90% = 0%

            // KPI Weights (Total = 100%)
            revenueWeight: "40", // 40%
            conversionQualityWeight: "20", // 20%
            retentionWeight: "20", // 20%
            operationsProductivityWeight: "10", // 10%
            customerExperienceWeight: "10", // 10%

            // Bonus Multiplier Conditions
            bonusRevenueThreshold: "100", // ≥100%
            bonusRetentionThreshold: "80", // ≥80%
            bonusMultiplier: "1.2", // 1.2x (20% bonus)

            // Base Incentive Amount
            baseIncentiveAmount: "50000", // ₹50,000 base target
          };
        }
        // Set role-specific CM (Cluster Manager) incentive rules
        else if (selectedRole.name === "Cluster Manager") {
          updates.cmRules = {
            // KPI Weights (Total = 100%)
            revenueWeight: "35", // 35%
            conversionRateWeight: "15", // 15%
            customerRetentionWeight: "20", // 20%
            omPerformanceWeight: "15", // 15%
            operationalComplianceWeight: "10", // 10%
            customerExperienceWeight: "5", // 5%

            // Revenue KPI Payout Tiers
            revenueTier1Min: "100", // ≥100%
            revenueTier1Payout: "100", // 100% payout
            revenueTier2Min: "90", // 90-99%
            revenueTier2Max: "99",
            revenueTier2Payout: "70", // 70% payout
            revenueTier3Payout: "0", // <90% → 0%

            // Conversion Rate KPI Payout Tiers
            conversionTier1Payout: "100", // ≥target → 100%
            conversionTier2Threshold: "10", // 10% below target
            conversionTier2Payout: "70", // 70% payout
            conversionTier3Payout: "0", // >10% below → 0%

            // Customer Retention KPI Payout Tiers
            retentionTier1Min: "80", // ≥80%
            retentionTier1Payout: "100", // 100% payout
            retentionTier2Min: "70", // 70-79%
            retentionTier2Max: "79",
            retentionTier2Payout: "70", // 70% payout
            retentionTier3Payout: "0", // <70% → 0%

            // OM Performance KPI Payout Tiers
            omPerformanceTier1Min: "100", // 100% of OMs ≥90%
            omPerformanceTier1Payout: "100", // 100% payout
            omPerformanceTier2Min: "75", // 75-99% of OMs
            omPerformanceTier2Max: "99",
            omPerformanceTier2Payout: "70", // 70% payout
            omPerformanceTier3Payout: "0", // <75% → 0%

            // Operational Compliance KPI Payout Tiers
            opComplianceTier1Min: "90", // ≥90%
            opComplianceTier1Payout: "100", // 100% payout
            opComplianceTier2Min: "80", // 80-89%
            opComplianceTier2Max: "89",
            opComplianceTier2Payout: "50", // 50% payout
            opComplianceTier3Payout: "0", // <80% → 0%

            // CX KPI Payout Tiers
            cxTier1Min: "85", // ≥85%
            cxTier1Payout: "100", // 100% payout
            cxTier2Min: "75", // 75-84%
            cxTier2Max: "84",
            cxTier2Payout: "50", // 50% payout
            cxTier3Payout: "0", // <75% → 0%

            // Team Multiplier Bonus
            teamBonusOMThreshold: "90", // All OMs ≥90%
            teamBonusRetentionThreshold: "80", // Cluster retention ≥80%
            teamBonusMultiplier: "0.25", // 25% additional (stores as 0.25, displayed as +25%)

            // Base Incentive Amount
            baseIncentiveAmount: "60000", // ₹60,000 base target
          };
        }
        // Set role-specific City Manager incentive rules
        else if (selectedRole.name === "City Manager") {
          updates.cityManagerRules = {
            // KPI Weights (Total = 100%)
            revenueWeight: "30", // 30%
            ebitdaWeight: "25", // 25%
            customerRetentionWeight: "15", // 15%
            expansionWeight: "10", // 10%
            clusterPerformanceWeight: "10", // 10%
            customerExperienceWeight: "10", // 10%

            // EBITDA Threshold (Prerequisite)
            ebitdaMinimumThreshold: "45", // 45% minimum
            ebitdaTarget: "50", // 50% target

            // Revenue KPI Payout Tiers
            revenueTier1Min: "100", // ≥100%
            revenueTier1Payout: "100", // 100%
            revenueTier2Min: "90", // 90-99%
            revenueTier2Max: "99",
            revenueTier2Payout: "70", // 70%
            revenueTier3Payout: "0", // <90% → 0%

            // EBITDA KPI Payout
            ebitdaTier1Payout: "100", // ≥target → 100%
            ebitdaTier2Payout: "50", // Above min but below target → pro-rated
            ebitdaTier3Payout: "0", // Below min → 0% + suspends all

            // Customer Retention KPI Payout Tiers
            retentionTier1Min: "80", // ≥80%
            retentionTier1Payout: "100", // 100%
            retentionTier2Min: "70", // 70-79%
            retentionTier2Max: "79",
            retentionTier2Payout: "70", // 70%
            retentionTier3Payout: "0", // <70% → 0%

            // Expansion KPI Payout Tiers
            expansionTier1Min: "100", // ≥100% of plan
            expansionTier1Payout: "100", // 100%
            expansionTier2Min: "75", // 75-99%
            expansionTier2Max: "99",
            expansionTier2Payout: "70", // 70%
            expansionTier3Payout: "0", // <75% → 0%

            // Cluster Performance KPI Payout Tiers
            clusterPerfTier1Min: "100", // 100% clusters ≥90%
            clusterPerfTier1Payout: "100", // 100%
            clusterPerfTier2Min: "75", // 75-99% clusters
            clusterPerfTier2Max: "99",
            clusterPerfTier2Payout: "70", // 70%
            clusterPerfTier3Payout: "0", // <75% → 0%

            // CX KPI Payout Tiers
            cxTier1Min: "85", // ≥85%
            cxTier1Payout: "100", // 100%
            cxTier2Min: "75", // 75-84%
            cxTier2Max: "84",
            cxTier2Payout: "50", // 50%
            cxTier3Payout: "0", // <75% → 0%

            // Triple Bonus (Revenue ≥100% AND EBITDA ≥target AND Retention ≥80%)
            tripleBonusRevenueThreshold: "100", // 100%
            tripleBonusEbitdaThreshold: "50", // EBITDA target
            tripleBonusRetentionThreshold: "80", // 80%
            tripleBonusMultiplier: "0.30", // 30% additional

            // Base Incentive Amount
            baseIncentiveAmount: "80000", // ₹80,000 base target
          };
        }

        return { ...prev, ...updates };
      });
    }
  }, [selectedRole]);

  // Handlers
  const handleAddTimeBand = () => {
    setConfig(prev => ({
      ...prev,
      timeBands: [
        ...prev.timeBands,
        { shiftName: "", startTime: "09:00", endTime: "13:00", baseQuota: 0 },
      ],
    }));
  };

  const handleRemoveTimeBand = (index: number) => {
    setConfig(prev => ({
      ...prev,
      timeBands: prev.timeBands.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateTimeBand = (index: number, field: keyof TimeBand, value: any) => {
    setConfig(prev => ({
      ...prev,
      timeBands: prev.timeBands.map((band, i) =>
        i === index ? { ...band, [field]: value } : band
      ),
    }));
  };

  const handleAddKPI = (metricCode: string) => {
    const metric = AVAILABLE_METRICS.find(m => m.code === metricCode);
    if (!metric) return;

    setConfig(prev => ({
      ...prev,
      kpiMetrics: [
        ...prev.kpiMetrics,
        {
          metricCode: metric.code,
          metricName: metric.name,
          weight: 0,
          dataSource: "Manual",
          trackingFrequency: "Daily",
        },
      ],
    }));
  };

  const handleRemoveKPI = (metricCode: string) => {
    setConfig(prev => ({
      ...prev,
      kpiMetrics: prev.kpiMetrics.filter(m => m.metricCode !== metricCode),
    }));
  };

  const handleUpdateKPI = (metricCode: string, field: keyof KPIMetric, value: any) => {
    setConfig(prev => ({
      ...prev,
      kpiMetrics: prev.kpiMetrics.map(m =>
        m.metricCode === metricCode ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleAddRule = (rule: IncentiveRule) => {
    setConfig(prev => ({
      ...prev,
      incentiveRules: [...prev.incentiveRules, rule],
    }));
    setShowRuleDialog(false);
    setEditingRule(null);
  };

  const handleEditRule = (rule: IncentiveRule) => {
    setEditingRule(rule);
    setShowRuleDialog(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      incentiveRules: prev.incentiveRules.filter(r => r.ruleId !== ruleId),
    }));
  };

  const handleAddApprovalLevel = () => {
    setConfig(prev => ({
      ...prev,
      approvalLevels: [
        ...prev.approvalLevels,
        {
          level: prev.approvalLevels.length + 1,
          approverRole: "",
          condition: ""
        },
      ],
    }));
  };

  const handleRemoveApprovalLevel = (level: number) => {
    setConfig(prev => ({
      ...prev,
      approvalLevels: prev.approvalLevels.filter(a => a.level !== level),
    }));
  };

  const handleSaveDraft = () => {
    const saveData = {
      ...config,
      version: config.version || "1.0",
      createdAt: config.createdAt || new Date().toISOString(),
      createdBy: config.createdBy || "Current User", // In real app: currentUser.name
    };
    logger.log("Saving draft config:", { selectedRoleCode, config: saveData });
    // TODO: Save to HR context or backend
  };

  const handleSubmitForApproval = () => {
    setConfig(prev => ({
      ...prev,
      status: "Pending",
      version: prev.version || "1.0",
      isImmutable: true, // Lock config once submitted
      createdAt: prev.createdAt || new Date().toISOString(),
      createdBy: prev.createdBy || "Current User",
    }));
    logger.log("Submitting for approval:", { selectedRoleCode, config });
    // TODO: Submit to approval workflow
  };

  const handleCreateNewVersion = () => {
    const currentVersion = config.version || "1.0";
    const [major, minor] = currentVersion.split(".").map(Number);
    const newVersion = `${major}.${minor + 1}`;

    const newConfig = {
      ...config,
      version: newVersion,
      previousVersionId: config.version,
      isImmutable: false,
      status: "Draft" as const,
      createdAt: new Date().toISOString(),
      createdBy: "Current User",
    };

    setConfig(newConfig);
    logger.log("Created new version:", newVersion);
  };

  const isLocked = config.status !== "Draft";
  const availableKPIMetrics = AVAILABLE_METRICS.filter(
    m => !config.kpiMetrics.find(k => k.metricCode === m.code)
  );

  if (!mounted) return (
    <div className="flex items-center justify-center h-64 p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <BackButton />
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Incentive Configuration</h1>
              {config.version && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                  v{config.version}
                </Badge>
              )}
              {config.isImmutable && (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Configure incentive rules and approval workflows per role
            </p>
            {config.createdAt && (
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(config.createdAt).toLocaleString("en-IN")}
                {config.createdBy && ` by ${config.createdBy}`}
              </p>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md">
                <p className="text-sm font-semibold mb-2">Configuration Guide</p>
                <p className="text-xs text-gray-300">
                  1. Select a role from the tabs below<br />
                  2. Configure quotas, KPIs, and rules<br />
                  3. Set budget and payout settings<br />
                  4. Submit for approval when ready
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          {config.isImmutable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleCreateNewVersion}
                    className="transition-all duration-200 hover:bg-purple-50 hover:border-purple-400 focus:ring-2 focus:ring-purple-500 border-purple-300 text-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Version
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Create a new version from this locked configuration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isLocked}
                  className="transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Save changes without submitting for approval</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSubmitForApproval}
                  disabled={isLocked || !selectedRoleCode}
                  className="transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Submit configuration to approval workflow</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Status:</span>
        <Badge
          variant={
            config.status === "Draft" ? "outline" :
            config.status === "Pending" ? "warning" :
            config.status === "Approved" ? "success" : "default"
          }
        >
          {config.status === "Draft" && <Pencil className="w-3 h-3 mr-1" />}
          {config.status === "Pending" && <Clock className="w-3 h-3 mr-1" />}
          {config.status === "Approved" && <CheckCircle className="w-3 h-3 mr-1" />}
          {config.status === "Active" && <CheckCircle className="w-3 h-3 mr-1" />}
          {config.status}
        </Badge>

        {isLocked && (
          <Alert className="inline-flex items-center p-2 w-auto">
            <Lock className="w-4 h-4 mr-2" />
            <span className="text-xs">
              Configuration is locked. Create a new version to make changes.
            </span>
          </Alert>
        )}
      </div>

      {/* Role Selector (Tabs) */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-bold text-gray-900">Select Role</CardTitle>
              <CardDescription className="text-sm text-gray-600">Choose the role to configure incentive rules for</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Each role can have unique incentive rules and quotas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRoleCode} onValueChange={setSelectedRoleCode}>
            <TabsList className="grid grid-cols-7 w-full gap-1">
              {(roles || []).filter(r => r.isActive).slice(0, 15).map(role => (
                <TabsTrigger
                  key={role.id}
                  value={role.code}
                  className="transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-100 text-xs px-2"
                >
                  {role.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Main Configuration (only show when role selected) */}
      {selectedRole && (
        <>
          {/* System Stats (Read-Only) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Active Employees"
              value={activeEmployeesInRole.toString()}
              icon={Users}
              variant="info"
            />
            <StatCard
              label="Avg Incentive (3M)"
              value={`₹${avgIncentiveLast3Months.toLocaleString('en-IN')}`}
              icon={TrendingUp}
              variant="default"
            />
            <StatCard
              label="Est. Monthly Cost"
              value={`₹${estimatedMonthlyCost.toLocaleString('en-IN')}`}
              icon={DollarSign}
              variant="warning"
            />
            <StatCard
              label="Budget Utilization"
              value={`${budgetUtilization.toFixed(0)}%`}
              icon={AlertCircle}
              variant={budgetUtilization > 90 ? "danger" : "success"}
            />
          </div>

          {/* System Recommendation Box */}
          <Alert className="border-amber-200 bg-amber-50 transition-all duration-200 hover:shadow-md">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            <AlertTitle className="font-bold text-amber-900">AI Recommendation</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 text-sm mt-2">
                <p className="text-amber-900">
                  Based on historical data, consider setting the per-unit rate at{" "}
                  <strong className="text-amber-700">₹{Math.round(avgIncentiveLast3Months / 70)}</strong>{" "}
                  for optimal cost-efficiency.
                </p>
                <p className="text-xs text-amber-700 font-medium">
                  • Average additional units: 70/day • Budget impact: Within safe range
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100 transition-all duration-200 focus:ring-2 focus:ring-amber-500"
                      >
                        Apply Recommendation
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Auto-fill suggested values based on AI analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </AlertDescription>
          </Alert>

          {/* Dynamic Config Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Card 1: Basic Info (Read-Only from HR) */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    Basic Info
                    <Lock className="w-4 h-4 text-gray-400" />
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Read-only fields from HR master data</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500">Role Name</Label>
                  <Input
                    value={selectedRole.name}
                    disabled
                    className="mt-1"
                  />
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Database className="w-3 h-3" />
                    <span>From HR master data</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Department</Label>
                  <Input
                    value={selectedRole.department}
                    disabled
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Category</Label>
                  <Input
                    value={selectedRole.category}
                    disabled
                    className="mt-1"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Reference Base Salary</p>
                  <p className="text-lg font-semibold text-blue-900">
                    ₹{(selectedRole?.baseValues?.basic ?? 0).toLocaleString('en-IN')}/month
                  </p>
                  <p className="text-xs text-blue-600">From salary structure</p>
                </div>

                <div>
                  <Label>Effective From *</Label>
                  <Input
                    type="date"
                    value={config.effectiveFrom}
                    onChange={(e) => setConfig({...config, effectiveFrom: e.target.value})}
                    disabled={isLocked}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Effective To</Label>
                  <Input
                    type="date"
                    value={config.effectiveTo}
                    onChange={(e) => setConfig({...config, effectiveTo: e.target.value})}
                    disabled={isLocked}
                    className="mt-1"
                    placeholder="Leave empty for ongoing"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Quota Setup (Editable) */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    Quota Setup
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Set base quotas for full-time and part-time employees</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full-Time Base Quota *</Label>
                  <Input
                    type="number"
                    value={config.fullTimeQuota}
                    onChange={(e) => setConfig({...config, fullTimeQuota: e.target.value})}
                    disabled={isLocked}
                    placeholder="e.g., 50"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Units expected per day for full-time employees
                  </p>
                </div>

                <div>
                  <Label>Part-Time Base Quota *</Label>
                  <Input
                    type="number"
                    value={config.partTimeQuota}
                    onChange={(e) => setConfig({...config, partTimeQuota: e.target.value})}
                    disabled={isLocked}
                    placeholder="e.g., 25"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Units expected per day for part-time employees
                  </p>
                </div>

                <div>
                  <Label>Calculation Method</Label>
                  <Select
                    value={config.calculationMethod}
                    onValueChange={(value: any) => setConfig({...config, calculationMethod: value})}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="Time-Proportional">Time-Proportional</SelectItem>
                      <SelectItem value="Shift-Based">Shift-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Time Bands</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddTimeBand}
                      disabled={isLocked}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {config.timeBands.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No time bands configured. Using fixed quota.
                      </p>
                    ) : (
                      config.timeBands.map((band, index) => (
                        <div key={index} className="flex gap-2 items-center p-2 border rounded-md">
                          <Input
                            placeholder="Shift name"
                            value={band.shiftName}
                            onChange={(e) => handleUpdateTimeBand(index, 'shiftName', e.target.value)}
                            disabled={isLocked}
                            className="flex-1"
                          />
                          <Input
                            type="time"
                            value={band.startTime}
                            onChange={(e) => handleUpdateTimeBand(index, 'startTime', e.target.value)}
                            disabled={isLocked}
                            className="w-24"
                          />
                          <span className="text-gray-500">-</span>
                          <Input
                            type="time"
                            value={band.endTime}
                            onChange={(e) => handleUpdateTimeBand(index, 'endTime', e.target.value)}
                            disabled={isLocked}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            value={band.baseQuota}
                            onChange={(e) => handleUpdateTimeBand(index, 'baseQuota', Number(e.target.value))}
                            disabled={isLocked}
                            placeholder="Quota"
                            className="w-20"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveTimeBand(index)}
                            disabled={isLocked}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: KPI Metrics (Editable) */}
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    KPI Metrics
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Define KPIs and weights (must total 100%)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Add Metric</Label>
                  <Select
                    onValueChange={handleAddKPI}
                    disabled={isLocked || availableKPIMetrics.length === 0}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select metric to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableKPIMetrics.map(metric => (
                        <SelectItem key={metric.code} value={metric.code}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {config.kpiMetrics.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">
                      No KPI metrics configured yet.
                    </p>
                  ) : (
                    config.kpiMetrics.map(metric => (
                      <div key={metric.metricCode} className="p-3 border rounded-md space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{metric.metricName}</p>
                            <p className="text-xs text-gray-500">{metric.metricCode}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveKPI(metric.metricCode)}
                            disabled={isLocked}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Weight %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={metric.weight}
                              onChange={(e) => handleUpdateKPI(metric.metricCode, 'weight', Number(e.target.value))}
                              disabled={isLocked}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Data Source</Label>
                            <Select
                              value={metric.dataSource}
                              onValueChange={(value: any) => handleUpdateKPI(metric.metricCode, 'dataSource', value)}
                              disabled={isLocked}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Biometric">Biometric</SelectItem>
                                <SelectItem value="CRM">CRM</SelectItem>
                                <SelectItem value="Calculated">Calculated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {config.kpiMetrics.length > 0 && (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600">
                      Total Weight: {config.kpiMetrics.reduce((sum, m) => sum + m.weight, 0)}%
                    </p>
                    {config.kpiMetrics.reduce((sum, m) => sum + m.weight, 0) !== 100 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Weights should total 100%
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Washer Incentive Rules (Only for Car Washer role) */}
          {selectedRole && (selectedRole.name === "Car Washer Full Time" || selectedRole.name === "Car Washer Part Time" || selectedRole.name === "Car Washer / Technician" || selectedRole.name === "Car Washer") && config.washerRules && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    Washer Incentive Rules
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Car washer-specific incentive configuration</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {/* Base Units */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Base Units</Label>
                    <Input
                      type="number"
                      value={config.washerRules.baseUnits}
                      onChange={(e) => setConfig({
                        ...config,
                        washerRules: config.washerRules ? {
                          ...config.washerRules,
                          baseUnits: e.target.value
                        } : undefined
                      })}
                      disabled={isLocked}
                      className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Max Units */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Max Units</Label>
                    <Input
                      type="number"
                      value={config.washerRules.maxUnits}
                      onChange={(e) => setConfig({
                        ...config,
                        washerRules: config.washerRules ? {
                          ...config.washerRules,
                          maxUnits: e.target.value
                        } : undefined
                      })}
                      disabled={isLocked}
                      className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Per Unit Rate */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Per Unit Rate</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        type="number"
                        value={config.washerRules.perUnitRate}
                        onChange={(e) => setConfig({
                          ...config,
                          washerRules: config.washerRules ? {
                            ...config.washerRules,
                            perUnitRate: e.target.value
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 2W Factor */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">2W Factor</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={config.washerRules.twoWheelerFactor}
                      onChange={(e) => setConfig({
                        ...config,
                        washerRules: config.washerRules ? {
                          ...config.washerRules,
                          twoWheelerFactor: e.target.value
                        } : undefined
                      })}
                      disabled={isLocked}
                      className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Multiplier for 2-wheeler washes</p>
                  </div>

                  {/* Add-on Factor */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Add-on Factor</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={config.washerRules.addonFactor}
                      onChange={(e) => setConfig({
                        ...config,
                        washerRules: config.washerRules ? {
                          ...config.washerRules,
                          addonFactor: e.target.value
                        } : undefined
                      })}
                      disabled={isLocked}
                      className="mt-1.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Multiplier for add-on services</p>
                  </div>

                  {/* Time Band */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Time Band</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        type="time"
                        value={config.washerRules.timeBand.startTime}
                        onChange={(e) => setConfig({
                          ...config,
                          washerRules: config.washerRules ? {
                            ...config.washerRules,
                            timeBand: {
                              ...config.washerRules.timeBand,
                              startTime: e.target.value
                            }
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">–</span>
                      <Input
                        type="time"
                        value={config.washerRules.timeBand.endTime}
                        onChange={(e) => setConfig({
                          ...config,
                          washerRules: config.washerRules ? {
                            ...config.washerRules,
                            timeBand: {
                              ...config.washerRules.timeBand,
                              endTime: e.target.value
                            }
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedRole?.name === "Car Washer Full Time"
                        ? "8 hr shift working hours"
                        : "Peak hours for bonus multiplier"}
                    </p>
                  </div>
                </div>

                {/* Score Weightage Configuration (NEW) */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="mb-4">
                    <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-600" />
                      Score Weightage Configuration
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Configure how quality and compliance scores impact incentive calculations
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Quality Score Weight */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700">Quality Score Weight</Label>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {config.washerRules.qualityScoreWeight || 50}%
                        </Badge>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={config.washerRules.qualityScoreWeight || 50}
                        onChange={(e) => {
                          const qualityWeight = parseInt(e.target.value);
                          const complianceWeight = 100 - qualityWeight;
                          setConfig({
                            ...config,
                            washerRules: config.washerRules ? {
                              ...config.washerRules,
                              qualityScoreWeight: qualityWeight,
                              complianceScoreWeight: complianceWeight
                            } : undefined
                          });
                        }}
                        disabled={isLocked}
                        className="w-full cursor-pointer accent-blue-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Vehicle cleanliness, interior, timeliness</p>
                    </div>

                    {/* Compliance Score Weight */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700">Compliance Score Weight</Label>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {config.washerRules.complianceScoreWeight || 50}%
                        </Badge>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={config.washerRules.complianceScoreWeight || 50}
                        onChange={(e) => {
                          const complianceWeight = parseInt(e.target.value);
                          const qualityWeight = 100 - complianceWeight;
                          setConfig({
                            ...config,
                            washerRules: config.washerRules ? {
                              ...config.washerRules,
                              qualityScoreWeight: qualityWeight,
                              complianceScoreWeight: complianceWeight
                            } : undefined
                          });
                        }}
                        disabled={isLocked}
                        className="w-full cursor-pointer accent-purple-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Equipment handling, safety, protocols</p>
                    </div>
                  </div>

                  {/* Note about score derivation */}
                  <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-teal-900 mb-1">Score Derivation</p>
                        <p className="text-xs text-teal-700 leading-relaxed">
                          {config.washerRules.scoreCalculationNote ||
                           "Scores are derived from system checklist completion, photo quality analysis, customer feedback, and QA audit results. These scores are automatically calculated and cannot be manually edited."}
                        </p>
                        {!isLocked && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs text-teal-600 p-0 h-auto mt-1"
                            onClick={() => {
                              const note = prompt(
                                "Enter score calculation note:",
                                config.washerRules?.scoreCalculationNote ||
                                "Scores are derived from system checklist completion, photo quality analysis, customer feedback, and QA audit results."
                              );
                              if (note !== null) {
                                setConfig({
                                  ...config,
                                  washerRules: config.washerRules ? {
                                    ...config.washerRules,
                                    scoreCalculationNote: note
                                  } : undefined
                                });
                              }
                            }}
                          >
                            Edit Note
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 text-blue-500" />
                      <span>Max incentive capped at <strong className="text-gray-900">{config.washerRules.maxIncentiveCapPerDay}</strong> units/day</span>
                    </div>
                    {!isLocked && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-gray-600">Daily Cap:</Label>
                        <Input
                          type="number"
                          value={config.washerRules.maxIncentiveCapPerDay}
                          onChange={(e) => setConfig({
                            ...config,
                            washerRules: config.washerRules ? {
                              ...config.washerRules,
                              maxIncentiveCapPerDay: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-20 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TSE Revenue Commission (Only for Tele Sales Executive role) */}
          {selectedRole && selectedRole.name === "Tele Sales Executive" && config.tseRules && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    Revenue Commission
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">TSE-specific revenue commission structure</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Revenue Slab Table */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">Revenue Slab Commission</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">Revenue Slab</TableHead>
                        <TableHead className="text-right">Commission %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Slab 1: 0-1L */}
                      <TableRow>
                        <TableCell className="font-medium">
                          ₹0 – ₹{(parseInt(config.tseRules.revenueSlab1Max) / 100000).toFixed(1)}L
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={config.tseRules.revenueSlab1Commission}
                              onChange={(e) => setConfig({
                                ...config,
                                tseRules: config.tseRules ? {
                                  ...config.tseRules,
                                  revenueSlab1Commission: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-600">%</span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Slab 2: 1-2L */}
                      <TableRow>
                        <TableCell className="font-medium">
                          ₹{(parseInt(config.tseRules.revenueSlab1Max) / 100000).toFixed(1)}L – ₹{(parseInt(config.tseRules.revenueSlab2Max) / 100000).toFixed(1)}L
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={config.tseRules.revenueSlab2Commission}
                              onChange={(e) => setConfig({
                                ...config,
                                tseRules: config.tseRules ? {
                                  ...config.tseRules,
                                  revenueSlab2Commission: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-600">%</span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Slab 3: 2L+ */}
                      <TableRow>
                        <TableCell className="font-medium">
                          ₹{(parseInt(config.tseRules.revenueSlab2Max) / 100000).toFixed(1)}L+
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={config.tseRules.revenueSlab3Commission}
                              onChange={(e) => setConfig({
                                ...config,
                                tseRules: config.tseRules ? {
                                  ...config.tseRules,
                                  revenueSlab3Commission: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-600">%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Bonus and Penalty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Renewal Bonus */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Renewal Bonus</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input
                        type="number"
                        value={config.tseRules.renewalBonus}
                        onChange={(e) => setConfig({
                          ...config,
                          tseRules: config.tseRules ? {
                            ...config.tseRules,
                            renewalBonus: e.target.value
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Fixed amount per renewal</p>
                  </div>

                  {/* CRM Penalty */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">CRM Penalty</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type="number"
                        value={config.tseRules.crmPenalty}
                        onChange={(e) => setConfig({
                          ...config,
                          tseRules: config.tseRules ? {
                            ...config.tseRules,
                            crmPenalty: e.target.value
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="pr-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Penalty for CRM non-compliance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TSM Variable Incentive (Only for Tele Sales Manager role) */}
          {selectedRole && selectedRole.name === "Tele Sales Manager" && config.tsmRules && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    Variable Incentive — Team Revenue Bonus
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">TSM incentive tied to total team revenue, conversion, and renewal rates</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Focuses on team capability and pipeline health rather than individual deals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Team Revenue Bonus Table */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">Team Revenue Bonus (MTD)</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">Team Revenue (MTD)</TableHead>
                        <TableHead className="text-right">Monthly Bonus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Tier 1: ₹10 Lakh */}
                      <TableRow>
                        <TableCell className="font-medium">
                          ₹{(parseInt(config.tsmRules.revenueTier1Target) / 100000).toFixed(0)} Lakh
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-gray-500">₹</span>
                            <Input
                              type="number"
                              value={config.tsmRules.revenueTier1Bonus}
                              onChange={(e) => setConfig({
                                ...config,
                                tsmRules: config.tsmRules ? {
                                  ...config.tsmRules,
                                  revenueTier1Bonus: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-28 text-right transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Tier 2: ₹15 Lakh */}
                      <TableRow>
                        <TableCell className="font-medium">
                          ₹{(parseInt(config.tsmRules.revenueTier2Target) / 100000).toFixed(0)} Lakh
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-gray-500">₹</span>
                            <Input
                              type="number"
                              value={config.tsmRules.revenueTier2Bonus}
                              onChange={(e) => setConfig({
                                ...config,
                                tsmRules: config.tsmRules ? {
                                  ...config.tsmRules,
                                  revenueTier2Bonus: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-28 text-right transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Tier 3: ₹20 Lakh+ */}
                      <TableRow>
                        <TableCell className="font-medium">
                          ₹{(parseInt(config.tsmRules.revenueTier3Target) / 100000).toFixed(0)} Lakh+
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-gray-500">₹</span>
                            <Input
                              type="number"
                              value={config.tsmRules.revenueTier3Bonus}
                              onChange={(e) => setConfig({
                                ...config,
                                tsmRules: config.tsmRules ? {
                                  ...config.tsmRules,
                                  revenueTier3Bonus: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-28 text-right transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Conversion & Renewal Bonuses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Conversion Bonus */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-900">Conversion Bonus</Label>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                      <div>
                        <Label className="text-xs text-purple-700">Threshold</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-purple-900">Team conversion rate &gt;</span>
                          <Input
                            type="number"
                            value={config.tsmRules.conversionRateThreshold}
                            onChange={(e) => setConfig({
                              ...config,
                              tsmRules: config.tsmRules ? {
                                ...config.tsmRules,
                                conversionRateThreshold: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-900">%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-purple-700">Bonus Amount</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-700">₹</span>
                          <Input
                            type="number"
                            value={config.tsmRules.conversionBonus}
                            onChange={(e) => setConfig({
                              ...config,
                              tsmRules: config.tsmRules ? {
                                ...config.tsmRules,
                                conversionBonus: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Renewal Bonus */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-900">Renewal Bonus</Label>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                      <div>
                        <Label className="text-xs text-green-700">Threshold</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-green-900">Team renewal rate &gt;</span>
                          <Input
                            type="number"
                            value={config.tsmRules.renewalRateThreshold}
                            onChange={(e) => setConfig({
                              ...config,
                              tsmRules: config.tsmRules ? {
                                ...config.tsmRules,
                                renewalRateThreshold: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-900">%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-green-700">Bonus Amount</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700">₹</span>
                          <Input
                            type="number"
                            value={config.tsmRules.renewalBonus}
                            onChange={(e) => setConfig({
                              ...config,
                              tsmRules: config.tsmRules ? {
                                ...config.tsmRules,
                                renewalBonus: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="pl-7 transition-all duration-200 focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Maximum Variable Potential Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-blue-900">Maximum Variable Potential</h3>
                    <Badge variant="default" className="bg-blue-600">
                      ₹{parseInt(config.tsmRules.maxVariablePotential).toLocaleString('en-IN')}/month
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Team Revenue Bonus (max):</span>
                      <span className="font-semibold text-blue-900">₹{parseInt(config.tsmRules.revenueTier3Bonus).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Conversion Bonus:</span>
                      <span className="font-semibold text-blue-900">₹{parseInt(config.tsmRules.conversionBonus).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Renewal Bonus:</span>
                      <span className="font-semibold text-blue-900">₹{parseInt(config.tsmRules.renewalBonus).toLocaleString('en-IN')}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span className="text-blue-900">Total Variable Max:</span>
                      <span className="text-blue-900">₹{parseInt(config.tsmRules.maxVariablePotential).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-4 italic">
                    Total CTC potential at maximum variable: up to ₹1,15,000/month
                  </p>
                </div>

                <Separator />

                {/* Eligibility Rules */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-900">Incentive Eligibility Rules</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>CRM Compliance:</strong> Team CRM compliance must be {config.tsmRules.crmComplianceThreshold}% — any month with team compliance &lt; {config.tsmRules.crmComplianceThreshold}% results in a{' '}
                        <Input
                          type="number"
                          value={config.tsmRules.crmPenaltyPercent}
                          onChange={(e) => setConfig({
                            ...config,
                            tsmRules: config.tsmRules ? {
                              ...config.tsmRules,
                              crmPenaltyPercent: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="inline-block w-16 mx-1 text-center transition-all duration-200 focus:ring-2 focus:ring-amber-500"
                        />
                        % reduction in TSM variable payout
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Pricing Engine Bypass:</strong> Any pricing engine bypass (EBITDA breach) discovered in the month triggers a Finance review; TSM incentive is withheld on the affected deals pending investigation
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Renewal Validation:</strong> Renewal bonus is paid only on confirmed payment renewals — not on renewal calls logged as "Promised" but not completed
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Calculation Timing:</strong> Revenue and conversion KPIs calculated at midnight on the last working day of the month; communicated by the 2nd of the following month
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supervisor BtL Conversion Incentive (Only for Operations Supervisor role) */}
          {selectedRole && selectedRole.name === "Operations Supervisor" && config.supervisorRules && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    BtL Conversion & Retention Incentive
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Supervisor incentives driven by BtL lead conversion and retention quality</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Split-payment structure with quality multipliers — rewards both conversion and long-term retention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* BtL Conversion Incentive (Split Payment) */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-teal-900 mb-4">Per BtL Conversion Incentive</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-teal-700">Total Incentive per Conversion</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-teal-700">₹</span>
                        <Input
                          type="number"
                          value={config.supervisorRules.conversionIncentiveAmount}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              conversionIncentiveAmount: e.target.value,
                              conversionPayment70Percent: (parseInt(e.target.value) * 0.7).toString(),
                              conversionPayment30Percent: (parseInt(e.target.value) * 0.3).toString(),
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-28 text-right transition-all duration-200 focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white border border-teal-200 rounded p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-teal-600" />
                          <Label className="text-xs font-semibold text-teal-900">70% on Conversion</Label>
                        </div>
                        <p className="text-2xl font-bold text-teal-700">
                          ₹{parseInt(config.supervisorRules.conversionPayment70Percent).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-teal-600 mt-1">Paid in same month as conversion</p>
                      </div>
                      <div className="bg-white border border-cyan-200 rounded p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-cyan-600" />
                          <Label className="text-xs font-semibold text-cyan-900">30% after 90 days</Label>
                        </div>
                        <p className="text-2xl font-bold text-cyan-700">
                          ₹{parseInt(config.supervisorRules.conversionPayment30Percent).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-cyan-600 mt-1">Paid only if customer still active</p>
                      </div>
                    </div>
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs text-amber-900">
                        If customer churns before 90 days, the 30% portion is forfeited. No clawback on the 70%.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                {/* Quality Multiplier (Retention-based) */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">Quality Multiplier (Retention-Based)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Tier 1: >80% retention */}
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <Label className="text-xs font-semibold text-green-900">Tier 1: High Retention</Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-700">Retention &gt;</span>
                          <Input
                            type="number"
                            value={config.supervisorRules.retentionTier1Threshold}
                            onChange={(e) => setConfig({
                              ...config,
                              supervisorRules: config.supervisorRules ? {
                                ...config.supervisorRules,
                                retentionTier1Threshold: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-14 text-right text-xs transition-all duration-200 focus:ring-2 focus:ring-green-500"
                          />
                          <span className="text-xs text-green-700">%</span>
                        </div>
                        <div className="bg-green-100 border border-green-300 rounded p-2 text-center">
                          <p className="text-xs text-green-700 mb-1">Multiplier</p>
                          <p className="text-xl font-bold text-green-900">{config.supervisorRules.retentionTier1Multiplier}x</p>
                        </div>
                        <p className="text-xs text-green-600 italic">Bonus payout on total</p>
                      </div>
                    </div>

                    {/* Tier 2: 60-80% retention */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        <Label className="text-xs font-semibold text-blue-900">Tier 2: Normal</Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs text-blue-700">
                          <Input
                            type="number"
                            value={config.supervisorRules.retentionTier2Min}
                            onChange={(e) => setConfig({
                              ...config,
                              supervisorRules: config.supervisorRules ? {
                                ...config.supervisorRules,
                                retentionTier2Min: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-12 text-right text-xs"
                          />
                          <span>% -</span>
                          <Input
                            type="number"
                            value={config.supervisorRules.retentionTier2Max}
                            onChange={(e) => setConfig({
                              ...config,
                              supervisorRules: config.supervisorRules ? {
                                ...config.supervisorRules,
                                retentionTier2Max: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-12 text-right text-xs"
                          />
                          <span>%</span>
                        </div>
                        <div className="bg-blue-100 border border-blue-300 rounded p-2 text-center">
                          <p className="text-xs text-blue-700 mb-1">Multiplier</p>
                          <p className="text-xl font-bold text-blue-900">{config.supervisorRules.retentionTier2Multiplier}x</p>
                        </div>
                        <p className="text-xs text-blue-600 italic">Normal payout</p>
                      </div>
                    </div>

                    {/* Tier 3: <60% retention */}
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <Label className="text-xs font-semibold text-red-900">Tier 3: Low Retention</Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-700">Retention &lt;</span>
                          <Input
                            type="number"
                            value={config.supervisorRules.retentionTier3Threshold}
                            onChange={(e) => setConfig({
                              ...config,
                              supervisorRules: config.supervisorRules ? {
                                ...config.supervisorRules,
                                retentionTier3Threshold: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-14 text-right text-xs transition-all duration-200 focus:ring-2 focus:ring-red-500"
                          />
                          <span className="text-xs text-red-700">%</span>
                        </div>
                        <div className="bg-red-100 border border-red-300 rounded p-2 text-center">
                          <p className="text-xs text-red-700 mb-1">Multiplier</p>
                          <p className="text-xl font-bold text-red-900">{config.supervisorRules.retentionTier3Multiplier}x</p>
                        </div>
                        <p className="text-xs text-red-600 font-semibold">⚠️ Warning issued</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* KPI Structure */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-purple-900">KPI Performance Score (Total = 100%)</h3>
                    <Badge variant="default" className="bg-purple-600">Performance Weighted</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-purple-700">Conversion</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.supervisorRules.kpiConversionWeight}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              kpiConversionWeight: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-purple-700">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-purple-700">Retention</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.supervisorRules.kpiRetentionWeight}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              kpiRetentionWeight: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-purple-700">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-purple-700">Audit Compliance</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.supervisorRules.kpiAuditComplianceWeight}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              kpiAuditComplianceWeight: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-purple-700">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-purple-700">Customer Complaints</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.supervisorRules.kpiCustomerComplaintsWeight}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              kpiCustomerComplaintsWeight: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-purple-700">%</span>
                      </div>
                    </div>
                  </div>
                  <Alert className="mt-4 border-purple-200 bg-purple-100">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-xs text-purple-900">
                      KPI score below threshold triggers performance review with Ops Manager
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                {/* Alert Thresholds & Rules */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-900">Alert Thresholds & Business Rules</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Conversion Rate Alert:</strong> Conversion rate &lt;
                        <Input
                          type="number"
                          value={config.supervisorRules.alertConversionRateThreshold}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              alertConversionRateThreshold: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="inline-block w-14 mx-1 text-center transition-all duration-200 focus:ring-2 focus:ring-amber-500"
                        />
                        % triggers lead quality issue flag
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Retention Alert:</strong> Retention &lt;
                        <Input
                          type="number"
                          value={config.supervisorRules.alertRetentionThreshold}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              alertRetentionThreshold: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="inline-block w-14 mx-1 text-center transition-all duration-200 focus:ring-2 focus:ring-amber-500"
                        />
                        % flags supervisor to Ops Manager for review
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Audit Compliance:</strong> Daily audits &lt;
                        <Input
                          type="number"
                          value={config.supervisorRules.alertAuditComplianceMin}
                          onChange={(e) => setConfig({
                            ...config,
                            supervisorRules: config.supervisorRules ? {
                              ...config.supervisorRules,
                              alertAuditComplianceMin: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="inline-block w-14 mx-1 text-center transition-all duration-200 focus:ring-2 focus:ring-amber-500"
                        />
                        /day results in non-compliance KPI failure
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Conversion Window:</strong> Lead must be converted within {config.supervisorRules.conversionTimeWindow} days of T0 to qualify for incentive
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Retention Measurement:</strong> Customer retention measured at {config.supervisorRules.retentionMeasurementPeriod}-day mark from conversion
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>Employment Eligibility:</strong> Supervisor must be in active employment at time of payout (both 70% and 30% portions)
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>No Backdating:</strong> All lead timestamps are system-generated. No backdated entries accepted under any circumstance
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <p className="text-amber-900">
                        <strong>No Manual Override:</strong> Incentive calculations are fully system-driven. No manual adjustment at supervisor level. Disputes go to HR via Ops Manager
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operations Manager KPI-Based Incentive (Only for Operations Manager role) */}
          {selectedRole && selectedRole.name === "Operations Manager" && config.omRules && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    KPI-Based Performance Incentive
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">System-calculated KPI-weighted incentive with performance bonus</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Fully automated calculation • No manual override permitted • Calculated at month-end
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base Incentive Amount */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-semibold text-indigo-900">Base Monthly Incentive Target</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-700">₹</span>
                      <Input
                        type="number"
                        value={config.omRules.baseIncentiveAmount}
                        onChange={(e) => setConfig({
                          ...config,
                          omRules: config.omRules ? {
                            ...config.omRules,
                            baseIncentiveAmount: e.target.value
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="w-32 text-right font-bold text-lg transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <Alert className="border-indigo-200 bg-indigo-100">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <AlertDescription className="text-xs text-indigo-900">
                      Actual payout calculated using KPI achievement scores and weights below
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                {/* Step 1: KPI Achievement Score Tiers */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="bg-blue-600">Step 1</Badge>
                    <h3 className="text-sm font-semibold text-gray-900">KPI Achievement Score Tiers</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Achievement Level</TableHead>
                        <TableHead className="text-right">Score Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-green-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>≥ {config.omRules.achievementTier1Min}% of target</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={config.omRules.achievementTier1Score}
                              onChange={(e) => setConfig({
                                ...config,
                                omRules: config.omRules ? {
                                  ...config.omRules,
                                  achievementTier1Score: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow className="bg-amber-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={config.omRules.achievementTier2Min}
                                onChange={(e) => setConfig({
                                  ...config,
                                  omRules: config.omRules ? {
                                    ...config.omRules,
                                    achievementTier2Min: e.target.value
                                  } : undefined
                                })}
                                disabled={isLocked}
                                className="w-16 text-right"
                              />
                              <span>-</span>
                              <Input
                                type="number"
                                value={config.omRules.achievementTier2Max}
                                onChange={(e) => setConfig({
                                  ...config,
                                  omRules: config.omRules ? {
                                    ...config.omRules,
                                    achievementTier2Max: e.target.value
                                  } : undefined
                                })}
                                disabled={isLocked}
                                className="w-16 text-right"
                              />
                              <span>% of target</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={config.omRules.achievementTier2Score}
                              onChange={(e) => setConfig({
                                ...config,
                                omRules: config.omRules ? {
                                  ...config.omRules,
                                  achievementTier2Score: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow className="bg-red-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>&lt; {config.omRules.achievementTier2Min}% of target</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={config.omRules.achievementTier3Score}
                              onChange={(e) => setConfig({
                                ...config,
                                omRules: config.omRules ? {
                                  ...config.omRules,
                                  achievementTier3Score: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-red-500"
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Step 2: Apply Weights */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="bg-purple-600">Step 2</Badge>
                    <h3 className="text-sm font-semibold text-gray-900">KPI Area Weights (Total = 100%)</h3>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Revenue</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.omRules.revenueWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              omRules: config.omRules ? {
                                ...config.omRules,
                                revenueWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Conversion Quality</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.omRules.conversionQualityWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              omRules: config.omRules ? {
                                ...config.omRules,
                                conversionQualityWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Retention</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.omRules.retentionWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              omRules: config.omRules ? {
                                ...config.omRules,
                                retentionWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Operations — Unit Productivity</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.omRules.operationsProductivityWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              omRules: config.omRules ? {
                                ...config.omRules,
                                operationsProductivityWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between col-span-2">
                        <Label className="text-sm text-purple-700">Customer Experience (CX)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.omRules.customerExperienceWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              omRules: config.omRules ? {
                                ...config.omRules,
                                customerExperienceWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="bg-white border border-purple-300 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-900">Total Weight:</span>
                        <span className="text-lg font-bold text-purple-900">
                          {parseInt(config.omRules.revenueWeight || "0") +
                           parseInt(config.omRules.conversionQualityWeight || "0") +
                           parseInt(config.omRules.retentionWeight || "0") +
                           parseInt(config.omRules.operationsProductivityWeight || "0") +
                           parseInt(config.omRules.customerExperienceWeight || "0")}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 3: Incentive Formula */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="bg-teal-600">Step 3</Badge>
                    <h3 className="text-sm font-semibold text-gray-900">Final Incentive Calculation</h3>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-6">
                    <Label className="text-sm font-semibold text-teal-900 mb-3 block">Incentive Formula</Label>
                    <div className="bg-white border-2 border-teal-300 rounded-lg p-4 font-mono text-sm space-y-2">
                      <div className="text-teal-900">
                        <strong>Total Incentive =</strong>
                      </div>
                      <div className="ml-4 space-y-1 text-teal-700">
                        <div>(Revenue Score × {config.omRules.revenueWeight}%)</div>
                        <div>+ (Conversion Score × {config.omRules.conversionQualityWeight}%)</div>
                        <div>+ (Retention Score × {config.omRules.retentionWeight}%)</div>
                        <div>+ (Operations Score × {config.omRules.operationsProductivityWeight}%)</div>
                        <div>+ (CX Score × {config.omRules.customerExperienceWeight}%)</div>
                      </div>
                    </div>
                    <Alert className="mt-4 border-teal-200 bg-teal-100">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <AlertDescription className="text-xs text-teal-900">
                        <strong>Calculation Timing:</strong> KPIs calculated at midnight on the last working day of the month
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                {/* Bonus Multiplier */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-green-900">Performance Bonus Multiplier</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-green-700 mb-3 block">BONUS CONDITIONS (Both must be met)</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-900">Revenue Achievement ≥</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.omRules.bonusRevenueThreshold}
                              onChange={(e) => setConfig({
                                ...config,
                                omRules: config.omRules ? {
                                  ...config.omRules,
                                  bonusRevenueThreshold: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm text-green-900">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-green-600 font-bold">AND</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-900">Retention ≥</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.omRules.bonusRetentionThreshold}
                              onChange={(e) => setConfig({
                                ...config,
                                omRules: config.omRules ? {
                                  ...config.omRules,
                                  bonusRetentionThreshold: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm text-green-900">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 text-center">
                      <div className="text-xs text-green-700 mb-2">When both conditions met:</div>
                      <div className="text-2xl font-bold text-green-900">
                        Total Incentive × {config.omRules.bonusMultiplier}x
                      </div>
                      <div className="text-xs text-green-600 mt-2 italic">
                        (Additional {((parseFloat(config.omRules.bonusMultiplier) - 1) * 100).toFixed(0)}% bonus on total incentive payout)
                      </div>
                    </div>

                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-xs text-green-900">
                        Bonus applies regardless of when during the month the targets were achieved — only month-end values matter
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                {/* System Rules */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-semibold text-red-900">System Enforcement Rules</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>No Manual Override:</strong> Incentive is fully system-calculated. No manual override permitted at any level.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>Query Process:</strong> City Manager or MD can query a calculation but cannot change the output.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>Error Handling:</strong> Any calculation error must be raised as a payroll correction request through the formal approval chain.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>Calculation Lock:</strong> KPIs locked at midnight on the last working day of the month — no retroactive adjustments.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cluster Manager KPI-Based Incentive (Only for Cluster Manager role) */}
          {selectedRole && selectedRole.name === "Cluster Manager" && config.cmRules && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    Cluster Manager KPI System
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">System-driven cluster-level performance incentive with team multiplier</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  Entirely system-driven • No manual override • No per-OM incentive • Cluster-level outcomes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base Incentive Amount */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-semibold text-blue-900">Base Monthly Incentive Target</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700">₹</span>
                      <Input
                        type="number"
                        value={config.cmRules.baseIncentiveAmount}
                        onChange={(e) => setConfig({
                          ...config,
                          cmRules: config.cmRules ? {
                            ...config.cmRules,
                            baseIncentiveAmount: e.target.value
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="w-32 text-right font-bold text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <Alert className="border-blue-200 bg-blue-100">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-900">
                      Actual payout calculated using 6-component KPI structure below
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                {/* KPI Weights */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="bg-purple-600">6-Component KPI Structure</Badge>
                    <h3 className="text-sm font-semibold text-gray-900">KPI Area Weights (Total = 100%)</h3>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Revenue</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cmRules.revenueWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cmRules: config.cmRules ? {
                                ...config.cmRules,
                                revenueWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Conversion Rate</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cmRules.conversionRateWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cmRules: config.cmRules ? {
                                ...config.cmRules,
                                conversionRateWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Customer Retention</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cmRules.customerRetentionWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cmRules: config.cmRules ? {
                                ...config.cmRules,
                                customerRetentionWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">OM Performance</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cmRules.omPerformanceWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cmRules: config.cmRules ? {
                                ...config.cmRules,
                                omPerformanceWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Operational Compliance</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cmRules.operationalComplianceWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cmRules: config.cmRules ? {
                                ...config.cmRules,
                                operationalComplianceWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-purple-700">Customer Experience (CX)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cmRules.customerExperienceWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cmRules: config.cmRules ? {
                                ...config.cmRules,
                                customerExperienceWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-sm text-purple-700">%</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="bg-white border border-purple-300 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-900">Total Weight:</span>
                        <span className="text-lg font-bold text-purple-900">
                          {parseInt(config.cmRules.revenueWeight || "0") +
                           parseInt(config.cmRules.conversionRateWeight || "0") +
                           parseInt(config.cmRules.customerRetentionWeight || "0") +
                           parseInt(config.cmRules.omPerformanceWeight || "0") +
                           parseInt(config.cmRules.operationalComplianceWeight || "0") +
                           parseInt(config.cmRules.customerExperienceWeight || "0")}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* KPI Payout Logic - All 6 KPIs in grid */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="bg-teal-600">Payout Tiers</Badge>
                    <h3 className="text-sm font-semibold text-gray-900">KPI-Specific Payout Logic</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Revenue KPI */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-green-900 mb-3 block">1. Revenue (35% weight)</Label>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded px-2 py-1">
                          <span>≥ {config.cmRules.revenueTier1Min}% target</span>
                          <span className="font-bold">{config.cmRules.revenueTier1Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-100 border border-amber-300 rounded px-2 py-1">
                          <span>{config.cmRules.revenueTier2Min}-{config.cmRules.revenueTier2Max}%</span>
                          <span className="font-bold">{config.cmRules.revenueTier2Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-100 border border-red-300 rounded px-2 py-1">
                          <span>&lt; {config.cmRules.revenueTier2Min}%</span>
                          <span className="font-bold">{config.cmRules.revenueTier3Payout}% payout</span>
                        </div>
                      </div>
                    </div>

                    {/* Conversion Rate KPI */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-blue-900 mb-3 block">2. Conversion Rate (15%)</Label>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded px-2 py-1">
                          <span>≥ Target</span>
                          <span className="font-bold">{config.cmRules.conversionTier1Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-100 border border-amber-300 rounded px-2 py-1">
                          <span>{config.cmRules.conversionTier2Threshold}% below</span>
                          <span className="font-bold">{config.cmRules.conversionTier2Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-100 border border-red-300 rounded px-2 py-1">
                          <span>&gt; {config.cmRules.conversionTier2Threshold}% below</span>
                          <span className="font-bold">{config.cmRules.conversionTier3Payout}% payout</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Retention KPI */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-purple-900 mb-3 block">3. Customer Retention (20%)</Label>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded px-2 py-1">
                          <span>≥ {config.cmRules.retentionTier1Min}%</span>
                          <span className="font-bold">{config.cmRules.retentionTier1Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-100 border border-amber-300 rounded px-2 py-1">
                          <span>{config.cmRules.retentionTier2Min}-{config.cmRules.retentionTier2Max}%</span>
                          <span className="font-bold">{config.cmRules.retentionTier2Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-100 border border-red-300 rounded px-2 py-1">
                          <span>&lt; {config.cmRules.retentionTier2Min}%</span>
                          <span className="font-bold">{config.cmRules.retentionTier3Payout}% payout</span>
                        </div>
                      </div>
                    </div>

                    {/* OM Performance KPI */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-indigo-900 mb-3 block">4. OM Performance (15%)</Label>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded px-2 py-1">
                          <span>{config.cmRules.omPerformanceTier1Min}% OMs ≥90%</span>
                          <span className="font-bold">{config.cmRules.omPerformanceTier1Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-100 border border-amber-300 rounded px-2 py-1">
                          <span>{config.cmRules.omPerformanceTier2Min}-{config.cmRules.omPerformanceTier2Max}% OMs</span>
                          <span className="font-bold">{config.cmRules.omPerformanceTier2Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-100 border border-red-300 rounded px-2 py-1">
                          <span>&lt; {config.cmRules.omPerformanceTier2Min}% OMs</span>
                          <span className="font-bold">{config.cmRules.omPerformanceTier3Payout}% payout</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Compliance KPI */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-orange-900 mb-3 block">5. Ops Compliance (10%)</Label>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded px-2 py-1">
                          <span>≥ {config.cmRules.opComplianceTier1Min}%</span>
                          <span className="font-bold">{config.cmRules.opComplianceTier1Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-100 border border-amber-300 rounded px-2 py-1">
                          <span>{config.cmRules.opComplianceTier2Min}-{config.cmRules.opComplianceTier2Max}%</span>
                          <span className="font-bold">{config.cmRules.opComplianceTier2Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-100 border border-red-300 rounded px-2 py-1">
                          <span>&lt; {config.cmRules.opComplianceTier2Min}%</span>
                          <span className="font-bold">{config.cmRules.opComplianceTier3Payout}% payout</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Experience KPI */}
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-pink-900 mb-3 block">6. Customer Experience (5%)</Label>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded px-2 py-1">
                          <span>≥ {config.cmRules.cxTier1Min}%</span>
                          <span className="font-bold">{config.cmRules.cxTier1Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-100 border border-amber-300 rounded px-2 py-1">
                          <span>{config.cmRules.cxTier2Min}-{config.cmRules.cxTier2Max}%</span>
                          <span className="font-bold">{config.cmRules.cxTier2Payout}% payout</span>
                        </div>
                        <div className="flex items-center justify-between bg-red-100 border border-red-300 rounded px-2 py-1">
                          <span>&lt; {config.cmRules.cxTier2Min}%</span>
                          <span className="font-bold">{config.cmRules.cxTier3Payout}% payout</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Team Multiplier Bonus */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-yellow-900">Team Multiplier Bonus</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white border border-yellow-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-yellow-700 mb-3 block">BONUS CONDITIONS (Both must be met)</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-yellow-900">All OMs ≥</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.cmRules.teamBonusOMThreshold}
                              onChange={(e) => setConfig({
                                ...config,
                                cmRules: config.cmRules ? {
                                  ...config.cmRules,
                                  teamBonusOMThreshold: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-yellow-500"
                            />
                            <span className="text-sm text-yellow-900">% of target</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-yellow-600 font-bold">AND</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-yellow-900">Cluster Retention ≥</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.cmRules.teamBonusRetentionThreshold}
                              onChange={(e) => setConfig({
                                ...config,
                                cmRules: config.cmRules ? {
                                  ...config.cmRules,
                                  teamBonusRetentionThreshold: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-yellow-500"
                            />
                            <span className="text-sm text-yellow-900">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 text-center">
                      <div className="text-xs text-yellow-700 mb-2">When both conditions met:</div>
                      <div className="text-2xl font-bold text-yellow-900">
                        Total Incentive + {(parseFloat(config.cmRules.teamBonusMultiplier) * 100).toFixed(0)}% Bonus
                      </div>
                      <div className="text-xs text-yellow-600 mt-2 italic">
                        (Additional {(parseFloat(config.cmRules.teamBonusMultiplier) * 100).toFixed(0)}% on total incentive payout for the month)
                      </div>
                    </div>

                    <Alert className="border-yellow-200 bg-yellow-50">
                      <CheckCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-xs text-yellow-900">
                        Team bonus evaluated at month-end only — drives cluster-wide performance alignment
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <Separator />

                {/* System Rules */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-semibold text-red-900">System Enforcement Rules</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>Entirely System-Driven:</strong> KPI scores calculated at month-end by ERP based on verified data. No manual override permitted.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>No Per-OM Incentive:</strong> CM role is to drive cluster-level performance. System measures and rewards outcomes, not per-OM activities.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>Query Process:</strong> City Manager can query calculation but cannot manually change output.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>Error Handling:</strong> Any calculation error must be raised as payroll correction through formal approval chain.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <p className="text-red-900">
                        <strong>Calculation Timing:</strong> KPIs calculated at midnight on last working day. CM incentive communicated by 2nd, instated in payroll by 5th.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* City Manager KPI-Based Incentive with EBITDA Threshold (Only for City Manager role) */}
          {selectedRole && selectedRole.name === "City Manager" && config.cityManagerRules && (
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold text-gray-900">
                    City-Level KPI System with EBITDA Prerequisite
                    {!isLocked && <Unlock className="w-4 h-4 text-green-600 animate-pulse" />}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Fully system-calculated • EBITDA threshold prerequisite • Triple bonus</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription className="text-sm text-gray-600 mt-2">
                  System-calculated city KPIs • Finance-verified • No manual overrides • EBITDA minimum required
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* EBITDA Threshold Warning (Critical) */}
                <Alert className="border-2 border-red-400 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-900 font-bold">EBITDA Threshold Prerequisite</AlertTitle>
                  <AlertDescription className="text-sm text-red-900 space-y-2">
                    <p className="font-semibold">If city EBITDA falls below minimum threshold ({config.cityManagerRules.ebitdaMinimumThreshold}%):</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><strong>ALL incentive payouts suspended</strong> for that month (regardless of other KPIs)</li>
                      <li>City Manager must submit cost audit report to MD within 5 working days</li>
                      <li>Remediation plan required within 10 working days</li>
                    </ul>
                    <p className="text-xs mt-2 italic">EBITDA calculated by Finance — disputes require formal query to Finance through MD</p>
                  </AlertDescription>
                </Alert>

                {/* Base Incentive Amount */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-semibold text-violet-900">Base Monthly Incentive Target</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-violet-700">₹</span>
                      <Input
                        type="number"
                        value={config.cityManagerRules.baseIncentiveAmount}
                        onChange={(e) => setConfig({
                          ...config,
                          cityManagerRules: config.cityManagerRules ? {
                            ...config.cityManagerRules,
                            baseIncentiveAmount: e.target.value
                          } : undefined
                        })}
                        disabled={isLocked}
                        className="w-32 text-right font-bold text-lg transition-all duration-200 focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                  <Alert className="border-violet-200 bg-violet-100">
                    <Info className="h-4 w-4 text-violet-600" />
                    <AlertDescription className="text-xs text-violet-900">
                      Actual payout calculated using 6-component KPI structure. Max potential with triple bonus: ₹{(parseInt(config.cityManagerRules.baseIncentiveAmount) * 1.3).toLocaleString('en-IN')}
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                {/* EBITDA Threshold Configuration */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-semibold text-red-900">EBITDA Threshold Configuration</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm text-red-700 mb-2 block">Minimum Threshold (Prerequisite)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.cityManagerRules.ebitdaMinimumThreshold}
                          onChange={(e) => setConfig({
                            ...config,
                            cityManagerRules: config.cityManagerRules ? {
                              ...config.cityManagerRules,
                              ebitdaMinimumThreshold: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-red-500"
                        />
                        <span className="text-sm text-red-900">%</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">Below this = ALL payouts suspended</p>
                    </div>
                    <div>
                      <Label className="text-sm text-green-700 mb-2 block">EBITDA Target</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.cityManagerRules.ebitdaTarget}
                          onChange={(e) => setConfig({
                            ...config,
                            cityManagerRules: config.cityManagerRules ? {
                              ...config.cityManagerRules,
                              ebitdaTarget: e.target.value
                            } : undefined
                          })}
                          disabled={isLocked}
                          className="w-20 text-right transition-all duration-200 focus:ring-2 focus:ring-green-500"
                        />
                        <span className="text-sm text-green-900">%</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Above this = Full EBITDA payout</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* KPI Weights */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="bg-indigo-600">6-Component City KPI Structure</Badge>
                    <h3 className="text-sm font-semibold text-gray-900">KPI Area Weights (Total = 100%)</h3>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-indigo-700">Revenue</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cityManagerRules.revenueWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cityManagerRules: config.cityManagerRules ? {
                                ...config.cityManagerRules,
                                revenueWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right"
                          />
                          <span className="text-sm text-indigo-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-indigo-700">EBITDA</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cityManagerRules.ebitdaWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cityManagerRules: config.cityManagerRules ? {
                                ...config.cityManagerRules,
                                ebitdaWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right"
                          />
                          <span className="text-sm text-indigo-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-indigo-700">Customer Retention</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cityManagerRules.customerRetentionWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cityManagerRules: config.cityManagerRules ? {
                                ...config.cityManagerRules,
                                customerRetentionWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right"
                          />
                          <span className="text-sm text-indigo-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-indigo-700">Expansion</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cityManagerRules.expansionWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cityManagerRules: config.cityManagerRules ? {
                                ...config.cityManagerRules,
                                expansionWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right"
                          />
                          <span className="text-sm text-indigo-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-indigo-700">Cluster Performance</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cityManagerRules.clusterPerformanceWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cityManagerRules: config.cityManagerRules ? {
                                ...config.cityManagerRules,
                                clusterPerformanceWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right"
                          />
                          <span className="text-sm text-indigo-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-indigo-700">Customer Experience</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={config.cityManagerRules.customerExperienceWeight}
                            onChange={(e) => setConfig({
                              ...config,
                              cityManagerRules: config.cityManagerRules ? {
                                ...config.cityManagerRules,
                                customerExperienceWeight: e.target.value
                              } : undefined
                            })}
                            disabled={isLocked}
                            className="w-16 text-right"
                          />
                          <span className="text-sm text-indigo-700">%</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="bg-white border border-indigo-300 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-indigo-900">Total Weight:</span>
                        <span className="text-lg font-bold text-indigo-900">
                          {parseInt(config.cityManagerRules.revenueWeight || "0") +
                           parseInt(config.cityManagerRules.ebitdaWeight || "0") +
                           parseInt(config.cityManagerRules.customerRetentionWeight || "0") +
                           parseInt(config.cityManagerRules.expansionWeight || "0") +
                           parseInt(config.cityManagerRules.clusterPerformanceWeight || "0") +
                           parseInt(config.cityManagerRules.customerExperienceWeight || "0")}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Triple Bonus */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-emerald-900">Triple Bonus (+30%)</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white border border-emerald-200 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-emerald-700 mb-3 block">ALL THREE CONDITIONS MUST BE MET</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-900">Revenue ≥</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.cityManagerRules.tripleBonusRevenueThreshold}
                              onChange={(e) => setConfig({
                                ...config,
                                cityManagerRules: config.cityManagerRules ? {
                                  ...config.cityManagerRules,
                                  tripleBonusRevenueThreshold: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right"
                            />
                            <span className="text-sm text-emerald-900">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-emerald-600 font-bold">AND</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-900">EBITDA ≥</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.cityManagerRules.tripleBonusEbitdaThreshold}
                              onChange={(e) => setConfig({
                                ...config,
                                cityManagerRules: config.cityManagerRules ? {
                                  ...config.cityManagerRules,
                                  tripleBonusEbitdaThreshold: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right"
                            />
                            <span className="text-sm text-emerald-900">% (target)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-emerald-600 font-bold">AND</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-900">Retention ≥</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={config.cityManagerRules.tripleBonusRetentionThreshold}
                              onChange={(e) => setConfig({
                                ...config,
                                cityManagerRules: config.cityManagerRules ? {
                                  ...config.cityManagerRules,
                                  tripleBonusRetentionThreshold: e.target.value
                                } : undefined
                              })}
                              disabled={isLocked}
                              className="w-20 text-right"
                            />
                            <span className="text-sm text-emerald-900">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-100 border-2 border-emerald-400 rounded-lg p-4 text-center">
                      <div className="text-xs text-emerald-700 mb-2">When ALL three conditions met:</div>
                      <div className="text-2xl font-bold text-emerald-900">
                        Total Incentive + {(parseFloat(config.cityManagerRules.tripleBonusMultiplier) * 100).toFixed(0)}% Bonus
                      </div>
                      <div className="text-xs text-emerald-600 mt-2 italic">
                        Reflects unit-based business model: Revenue = Units × Price; Profitability = cost-per-unit efficiency
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Rules */}
                <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-slate-600" />
                    <h3 className="text-sm font-semibold text-slate-900">System & Finance Rules</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 mt-0.5">•</span>
                      <p className="text-slate-900">
                        <strong>Fully System-Calculated:</strong> KPIs calculated by Finance and confirmed at midnight on last working day of month.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 mt-0.5">•</span>
                      <p className="text-slate-900">
                        <strong>Communication Timeline:</strong> City Manager incentive communicated by 3rd of following month, instated in payroll by 7th.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 mt-0.5">•</span>
                      <p className="text-slate-900">
                        <strong>No Manual Overrides:</strong> MD can query calculation but cannot manually change output. Errors require formal payroll correction through Finance.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 mt-0.5">•</span>
                      <p className="text-slate-900">
                        <strong>Digital Channel Exclusion:</strong> Digital channel revenue handled separately — NOT included in City Manager's revenue KPI.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 mt-0.5">•</span>
                      <p className="text-slate-900">
                        <strong>EBITDA Disputes:</strong> City Manager cannot dispute EBITDA calculation without submitting formal query to Finance through MD.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incentive Rules Section */}
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-bold text-gray-900">Incentive Rules</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Define how incentives are calculated based on KPI performance
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowRuleDialog(true)}
                        disabled={isLocked}
                        className="transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rule
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Create a new incentive calculation rule</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              {config.incentiveRules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No incentive rules configured yet</p>
                  <p className="text-sm mt-1">Add your first rule to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {config.incentiveRules.map(rule => (
                      <TableRow key={rule.ruleId}>
                        <TableCell className="font-medium">{rule.ruleName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.ruleType}</Badge>
                        </TableCell>
                        <TableCell>{rule.applicableMetric}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {rule.value}
                          {rule.threshold && ` (threshold: ${rule.threshold})`}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRule(rule)}
                              disabled={isLocked}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRule(rule.ruleId)}
                              disabled={isLocked}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Payout Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Configuration</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label>Payout Cycle</Label>
                <Select
                  value={config.payoutCycle}
                  onValueChange={(value: any) => setConfig({...config, payoutCycle: value})}
                  disabled={isLocked}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payout Mode</Label>
                <Select
                  value={config.payoutMode}
                  onValueChange={(value: any) => setConfig({...config, payoutMode: value})}
                  disabled={isLocked}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="With Salary">With Salary</SelectItem>
                    <SelectItem value="Separate">Separate Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Minimum Payout</Label>
                <Input
                  type="number"
                  value={config.minimumPayout}
                  onChange={(e) => setConfig({...config, minimumPayout: e.target.value})}
                  disabled={isLocked}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  No payout if below this amount
                </p>
              </div>

              <div>
                <Label>Monthly Budget Allocated</Label>
                <Input
                  type="number"
                  value={config.budgetAllocated}
                  onChange={(e) => setConfig({...config, budgetAllocated: e.target.value})}
                  disabled={isLocked}
                  placeholder="e.g., 500000"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total budget for this role's incentives
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Approval Workflow Section */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                Configure approval levels and conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.approvalRequired}
                  onCheckedChange={(checked) => setConfig({...config, approvalRequired: checked})}
                  disabled={isLocked}
                />
                <Label>Approval Required</Label>
              </div>

              {config.approvalRequired && (
                <>
                  <Separator />

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label>Approval Levels</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddApprovalLevel}
                        disabled={isLocked}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Level
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Level</TableHead>
                          <TableHead>Approver Role</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {config.approvalLevels.map(approval => (
                          <TableRow key={approval.level}>
                            <TableCell className="font-semibold">
                              {approval.level}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={approval.approverRole}
                                onChange={(e) => {
                                  setConfig(prev => ({
                                    ...prev,
                                    approvalLevels: prev.approvalLevels.map(a =>
                                      a.level === approval.level
                                        ? {...a, approverRole: e.target.value}
                                        : a
                                    )
                                  }));
                                }}
                                disabled={isLocked}
                                placeholder="e.g., Supervisor"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={approval.condition}
                                onChange={(e) => {
                                  setConfig(prev => ({
                                    ...prev,
                                    approvalLevels: prev.approvalLevels.map(a =>
                                      a.level === approval.level
                                        ? {...a, condition: e.target.value}
                                        : a
                                    )
                                  }));
                                }}
                                disabled={isLocked}
                                placeholder="e.g., All incentives or If > ₹5000"
                              />
                            </TableCell>
                            <TableCell>
                              {approval.level > 1 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveApprovalLevel(approval.level)}
                                  disabled={isLocked}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Approval Status Flow */}
          {config.status !== "Draft" && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Draft</p>
                        <p className="text-xs text-gray-500">Created</p>
                      </div>
                    </div>

                    <div className="w-12 h-0.5 bg-gray-300"></div>

                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        config.status === "Pending" ? "bg-yellow-100" : "bg-gray-100"
                      }`}>
                        <Clock className={`w-4 h-4 ${
                          config.status === "Pending" ? "text-yellow-600" : "text-gray-400"
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pending</p>
                        <p className="text-xs text-gray-500">In review</p>
                      </div>
                    </div>

                    <div className="w-12 h-0.5 bg-gray-300"></div>

                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        config.status === "Approved" || config.status === "Active"
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}>
                        <CheckCircle className={`w-4 h-4 ${
                          config.status === "Approved" || config.status === "Active"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Approved</p>
                        <p className="text-xs text-gray-500">Ready to activate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Rule Dialog (placeholder - would need full implementation) */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Incentive Rule" : "Add Incentive Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure the rule parameters for incentive calculation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Full rule configuration form would go here with fields for:
              Rule name, type, metric selection, value inputs, thresholds, caps, etc.
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Add mock rule for demonstration
              const mockRule: IncentiveRule = {
                ruleId: `rule-${Date.now()}`,
                ruleName: "Sample Rule",
                ruleType: "Per Unit",
                applicableMetric: "UNITS_WASHED",
                value: "₹25/unit",
              };
              handleAddRule(mockRule);
            }}>
              {editingRule ? "Update" : "Add"} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default IncentiveConfiguration;
// Trigger rebuild: 1776659047
