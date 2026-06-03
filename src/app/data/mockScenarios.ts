/**
 * Mock Scenarios for Testing and Demo
 * Provides scenario-based data to make all features visible
 */

export type Scenario = "normal" | "cover" | "highPerformance" | "complaint" | "inventory";

export interface ScenarioData {
  name: string;
  description: string;
  washers?: any[];
  coverPlan?: {
    absentWasherId: string;
    absentWasherName: string;
    requiredUnits: number;
    availableCapacity: number;
    coverAssignments: Array<{ washerId: string; washerName: string; assignedUnits: number }>;
    remainingUnits: number;
    isCapacitySufficient: boolean;
  };
  complaints?: any[];
  inventory?: any[];
  revenue?: {
    today: number;
    mtd: number;
    target: number;
  };
  alerts?: any[];
}

// ==================== SCENARIO 1: NORMAL ====================
const normalScenario: ScenarioData = {
  name: "Normal Operations",
  description: "All washers present, balanced workload, no issues",
  washers: [
    { id: "W1", name: "Suresh Kumar", status: "CHECKED_IN", unitsCompleted: 18, unitsTarget: 25, area: "Vesu" },
    { id: "W2", name: "Ramesh K.", status: "CHECKED_IN", unitsCompleted: 20, unitsTarget: 25, area: "Adajan" },
    { id: "W3", name: "Mahesh S.", status: "CHECKED_IN", unitsCompleted: 19, unitsTarget: 25, area: "Piplod" },
    { id: "W4", name: "Dinesh P.", status: "CHECKED_IN", unitsCompleted: 17, unitsTarget: 25, area: "Varachha" },
    { id: "W5", name: "Kiran M.", status: "CHECKED_IN", unitsCompleted: 21, unitsTarget: 25, area: "Citylight" },
  ],
  complaints: [],
  revenue: {
    today: 45000,
    mtd: 850000,
    target: 1000000,
  },
  alerts: [],
};

// ==================== SCENARIO 2: COVER ISSUE ====================
const coverScenario: ScenarioData = {
  name: "Cover Redistribution - Critical",
  description: "1 washer absent (leave), 25 jobs need redistribution, capacity shortage",
  washers: [
    { id: "W1", name: "Suresh Kumar", status: "LEAVE", unitsCompleted: 0, unitsTarget: 25, area: "Vesu" },
    { id: "W2", name: "Ramesh K.", status: "CHECKED_IN", unitsCompleted: 18, unitsTarget: 25, area: "Adajan" },
    { id: "W3", name: "Mahesh S.", status: "CHECKED_IN", unitsCompleted: 15, unitsTarget: 25, area: "Piplod" },
    { id: "W4", name: "Dinesh P.", status: "CHECKED_IN", unitsCompleted: 12, unitsTarget: 25, area: "Varachha" },
    { id: "W5", name: "Kiran M.", status: "CHECKED_IN", unitsCompleted: 16, unitsTarget: 25, area: "Citylight" },
  ],
  coverPlan: {
    absentWasherId: "W1",
    absentWasherName: "Suresh Kumar",
    requiredUnits: 25, // Suresh's 25 jobs need redistribution
    availableCapacity: 24, // 4 washers × max 6 cover units each
    coverAssignments: [
      { washerId: "W2", washerName: "Ramesh K.", assignedUnits: 6 },
      { washerId: "W3", washerName: "Mahesh S.", assignedUnits: 6 },
      { washerId: "W4", washerName: "Dinesh P.", assignedUnits: 6 },
      { washerId: "W5", washerName: "Kiran M.", assignedUnits: 6 },
    ],
    remainingUnits: 1, // 25 - 24 = 1 unassigned
    isCapacitySufficient: false, // Triggers alert and escalation options
  },
  complaints: [],
  revenue: {
    today: 38000, // Lower due to absent washer
    mtd: 820000,
    target: 1000000,
  },
  alerts: [
    {
      id: "ALT-001",
      type: "COVER_CAPACITY",
      severity: "CRITICAL",
      message: "Insufficient cover capacity: 1 unit unassigned",
      washerId: "W1",
      timestamp: new Date(),
    },
  ],
};

// ==================== SCENARIO 3: HIGH PERFORMANCE ====================
const highPerformanceScenario: ScenarioData = {
  name: "High Performance Day",
  description: "Multiple washers exceeding targets, high revenue",
  washers: [
    { id: "W1", name: "Suresh Kumar", status: "CHECKED_IN", unitsCompleted: 32, unitsTarget: 25, area: "Vesu" },
    { id: "W2", name: "Ramesh K.", status: "CHECKED_IN", unitsCompleted: 35, unitsTarget: 25, area: "Adajan" },
    { id: "W3", name: "Mahesh S.", status: "CHECKED_IN", unitsCompleted: 28, unitsTarget: 25, area: "Piplod" },
    { id: "W4", name: "Dinesh P.", status: "CHECKED_IN", unitsCompleted: 30, unitsTarget: 25, area: "Varachha" },
    { id: "W5", name: "Kiran M.", status: "CHECKED_IN", unitsCompleted: 33, unitsTarget: 25, area: "Citylight" },
  ],
  complaints: [],
  revenue: {
    today: 78000, // 158 units × avg ₹500
    mtd: 1250000,
    target: 1000000,
  },
  alerts: [
    {
      id: "ALT-002",
      type: "PERFORMANCE",
      severity: "INFO",
      message: "Team exceeded daily target by 33 units",
      timestamp: new Date(),
    },
  ],
};

// ==================== SCENARIO 4: COMPLAINT ====================
const complaintScenario: ScenarioData = {
  name: "Active Complaints",
  description: "Multiple open complaints, SLA breach, escalation required",
  washers: [
    { id: "W1", name: "Suresh Kumar", status: "CHECKED_IN", unitsCompleted: 18, unitsTarget: 25, area: "Vesu" },
    { id: "W2", name: "Ramesh K.", status: "CHECKED_IN", unitsCompleted: 20, unitsTarget: 25, area: "Adajan" },
    { id: "W3", name: "Mahesh S.", status: "CHECKED_IN", unitsCompleted: 19, unitsTarget: 25, area: "Piplod" },
    { id: "W4", name: "Dinesh P.", status: "CHECKED_IN", unitsCompleted: 17, unitsTarget: 25, area: "Varachha" },
    { id: "W5", name: "Kiran M.", status: "CHECKED_IN", unitsCompleted: 21, unitsTarget: 25, area: "Citylight" },
  ],
  complaints: [
    {
      id: "CMP-001",
      customerId: "CUST-123",
      customerName: "Rajesh Patel",
      type: "QUALITY",
      status: "OPEN",
      priority: "HIGH",
      description: "Car interior not cleaned properly, dashboard still dusty",
      washerId: "W3",
      washerName: "Mahesh S.",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      sla: {
        responseTime: 2, // hours
        resolutionTime: 24, // hours
        isBreached: true, // 3 hours > 2 hours response SLA
      },
      assignedCCE: "CCE-001",
      assignedCCEName: "Priya Sharma",
    },
    {
      id: "CMP-002",
      customerId: "CUST-456",
      customerName: "Neha Gupta",
      type: "BILLING",
      status: "OPEN",
      priority: "MEDIUM",
      description: "Charged for Elite package but received Premium service",
      washerId: "W2",
      washerName: "Ramesh K.",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      sla: {
        responseTime: 2,
        resolutionTime: 24,
        isBreached: false,
      },
      assignedCCE: "CCE-001",
      assignedCCEName: "Priya Sharma",
    },
    {
      id: "CMP-003",
      customerId: "CUST-789",
      customerName: "Amit Shah",
      type: "NO_SHOW",
      status: "ESCALATED",
      priority: "CRITICAL",
      description: "Washer did not arrive at scheduled time, no communication",
      washerId: "W1",
      washerName: "Suresh Kumar",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      sla: {
        responseTime: 2,
        resolutionTime: 24,
        isBreached: true,
      },
      assignedCCE: "CCE-001",
      assignedCCEName: "Priya Sharma",
      escalatedTo: "TSM",
      escalatedToName: "Vikram Singh",
    },
  ],
  revenue: {
    today: 45000,
    mtd: 850000,
    target: 1000000,
  },
  alerts: [
    {
      id: "ALT-003",
      type: "COMPLAINT_SLA",
      severity: "CRITICAL",
      message: "2 complaints breached SLA, immediate action required",
      timestamp: new Date(),
    },
  ],
};

// ==================== SCENARIO 5: INVENTORY ====================
const inventoryScenario: ScenarioData = {
  name: "Inventory Issues",
  description: "Low stock alerts, reorder required, material shortage",
  washers: [
    { id: "W1", name: "Suresh Kumar", status: "CHECKED_IN", unitsCompleted: 18, unitsTarget: 25, area: "Vesu" },
    { id: "W2", name: "Ramesh K.", status: "CHECKED_IN", unitsCompleted: 20, unitsTarget: 25, area: "Adajan" },
    { id: "W3", name: "Mahesh S.", status: "CHECKED_IN", unitsCompleted: 19, unitsTarget: 25, area: "Piplod" },
    { id: "W4", name: "Dinesh P.", status: "CHECKED_IN", unitsCompleted: 17, unitsTarget: 25, area: "Varachha" },
    { id: "W5", name: "Kiran M.", status: "CHECKED_IN", unitsCompleted: 21, unitsTarget: 25, area: "Citylight" },
  ],
  complaints: [],
  inventory: [
    {
      id: "INV-001",
      itemName: "Foam Shampoo (5L)",
      category: "CLEANING_MATERIALS",
      currentStock: 8, // units
      threshold: 20, // minimum stock level
      reorderQuantity: 50,
      status: "LOW_STOCK",
      supplier: "ChemClean Supplies",
      lastOrdered: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      estimatedRunoutDays: 3,
    },
    {
      id: "INV-002",
      itemName: "Microfiber Cloths (Pack of 10)",
      category: "CONSUMABLES",
      currentStock: 12,
      threshold: 30,
      reorderQuantity: 100,
      status: "LOW_STOCK",
      supplier: "CarCare Direct",
      lastOrdered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      estimatedRunoutDays: 5,
    },
    {
      id: "INV-003",
      itemName: "Tire Shine (500ml)",
      category: "FINISHING_PRODUCTS",
      currentStock: 2,
      threshold: 15,
      reorderQuantity: 40,
      status: "CRITICAL",
      supplier: "AutoGloss India",
      lastOrdered: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      estimatedRunoutDays: 1,
    },
    {
      id: "INV-004",
      itemName: "Wheel Cleaner (1L)",
      category: "CLEANING_MATERIALS",
      currentStock: 25,
      threshold: 25,
      reorderQuantity: 50,
      status: "AT_THRESHOLD",
      supplier: "ChemClean Supplies",
      lastOrdered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      estimatedRunoutDays: 7,
    },
  ],
  revenue: {
    today: 45000,
    mtd: 850000,
    target: 1000000,
  },
  alerts: [
    {
      id: "ALT-004",
      type: "INVENTORY_CRITICAL",
      severity: "CRITICAL",
      message: "Tire Shine stock critical: 2 units remaining (1 day supply)",
      timestamp: new Date(),
    },
    {
      id: "ALT-005",
      type: "INVENTORY_LOW",
      severity: "WARNING",
      message: "2 items below threshold, reorder recommended",
      timestamp: new Date(),
    },
  ],
};

// ==================== SCENARIO SELECTOR ====================

export function getScenarioData(scenario: Scenario): ScenarioData {
  switch (scenario) {
    case "normal":
      return normalScenario;
    case "cover":
      return coverScenario;
    case "highPerformance":
      return highPerformanceScenario;
    case "complaint":
      return complaintScenario;
    case "inventory":
      return inventoryScenario;
    default:
      return normalScenario;
  }
}

// ==================== SCENARIO METADATA ====================

export const SCENARIOS: Array<{ value: Scenario; label: string; description: string; icon: string }> = [
  {
    value: "normal",
    label: "Normal",
    description: "Baseline operations, no issues",
    icon: "✅",
  },
  {
    value: "cover",
    label: "Cover Issue",
    description: "Absent washer, capacity shortage",
    icon: "🔴",
  },
  {
    value: "highPerformance",
    label: "High Performance",
    description: "Team exceeding targets",
    icon: "🚀",
  },
  {
    value: "complaint",
    label: "Complaints",
    description: "Active complaints, SLA breach",
    icon: "⚠️",
  },
  {
    value: "inventory",
    label: "Inventory",
    description: "Low stock, material shortage",
    icon: "📦",
  },
];

// ==================== HELPER: MERGE WITH EXISTING DATA ====================

export function mergeScenarioData<T>(scenarioData: T | undefined, existingData: T): T {
  // If scenario provides data, use it; otherwise use existing
  return scenarioData ?? existingData;
}

export function applyScenarioOverride<T extends object>(
  scenario: Scenario,
  dataKey: keyof ScenarioData,
  existingData: T
): T {
  const scenarioData = getScenarioData(scenario);
  const override = scenarioData[dataKey];
  return (override ?? existingData) as T;
}
