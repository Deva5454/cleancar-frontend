// Material Requisition System

export interface MaterialRequisitionForm {
  id: string;
  requestedBy: string;
  requestedByRole: string;
  department: string;
  dateRequested: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "Approved" | "Issued" | "Rejected";
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    purpose: string;
  }[];
  approvedBy?: string;
  approvedOn?: string;
  issuedBy?: string;
  issuedOn?: string;
  remarks?: string;
}

export interface PurchaseRequest {
  id: string;
  requestedBy: string;
  dateRequested: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "Approved by Store" | "Approved by Super Admin" | "PO Issued" | "Rejected";
  items: {
    itemName: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    vendorSuggestion?: string;
  }[];
  approvedByStore?: string;
  approvedByAdmin?: string;
  poNumber?: string;
  poIssuedOn?: string;
  totalEstimatedCost: number;
  remarks?: string;
}

export interface PurchaseOrder {
  poNumber: string;
  vendorId: string;
  vendorName: string;
  dateIssued: string;
  expectedDelivery: string;
  status: "Issued" | "Partially Received" | "Fully Received" | "Cancelled";
  items: {
    itemName: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
    receivedQty?: number;
  }[];
  totalAmount: number;
  gst: number;
  grandTotal: number;
  approvedBy: string;
  remarks?: string;
}

export interface ConsumptionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  issuedOn: string;
  issuedBy: string;
  mrfId: string;
  purpose: string;
}

export interface PurchaseHistory {
  itemId: string;
  itemName: string;
  totalPurchased: number;
  totalConsumed: number;
  averageRate: number;
  lastPurchaseDate: string;
  lastPurchaseRate: number;
  monthlyConsumption: number;
  stockInHand: number;
  vendors: {
    vendorName: string;
    lastRate: number;
    totalPurchased: number;
  }[];
}

export const mockMRFs: MaterialRequisitionForm[] = [
  {
    id: "MRF-2026-001",
    requestedBy: "Suresh Yadav",
    requestedByRole: "Supervisor",
    department: "Operations",
    dateRequested: "2026-03-01",
    priority: "High",
    status: "Pending",
    items: [
      { itemId: "ITM-001", itemName: "Car Shampoo", quantity: 5, unit: "Litre", purpose: "Daily washing operations" },
      { itemId: "ITM-002", itemName: "Microfiber Cloth", quantity: 10, unit: "Pcs", purpose: "Replacement of worn cloths" },
    ],
  },
  {
    id: "MRF-2026-002",
    requestedBy: "Ramesh Kumar",
    requestedByRole: "Supervisor",
    department: "Operations",
    dateRequested: "2026-02-28",
    priority: "Medium",
    status: "Approved",
    items: [
      { itemId: "ITM-003", itemName: "Wax Polish", quantity: 3, unit: "Kg", purpose: "Premium car services" },
    ],
    approvedBy: "Sandeep Jain",
    approvedOn: "2026-02-28",
  },
];

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: "PR-2026-001",
    requestedBy: "Sandeep Jain",
    dateRequested: "2026-03-01",
    priority: "High",
    status: "Pending",
    items: [
      { itemName: "Car Shampoo", quantity: 50, unit: "Litre", estimatedCost: 15000, vendorSuggestion: "ChemSupply India" },
      { itemName: "Wax Polish", quantity: 20, unit: "Kg", estimatedCost: 12000, vendorSuggestion: "AutoCare Products" },
    ],
    totalEstimatedCost: 27000,
  },
];

export const mockConsumptionRecords: ConsumptionRecord[] = [
  {
    id: "CONS-001",
    employeeId: "EMP-012",
    employeeName: "Rahul Verma",
    role: "Car Washer",
    itemId: "ITM-001",
    itemName: "Car Shampoo",
    quantity: 0.5,
    unit: "Litre",
    issuedOn: "2026-03-01",
    issuedBy: "Sandeep Jain",
    mrfId: "MRF-2026-001",
    purpose: "Daily washing operations",
  },
];

export function calculateMaterialFlow(itemId: string): {
  issued: number;
  consumed: number;
  returnedToStock: number;
  wastage: number;
} {
  // Mock calculation
  return {
    issued: 50,
    consumed: 45,
    returnedToStock: 3,
    wastage: 2,
  };
}

export function getPurchasePattern(itemId: string, months: number): {
  monthlyAverage: number;
  trend: "Increasing" | "Decreasing" | "Stable";
  seasonalPeak?: string;
} {
  // Mock pattern analysis
  return {
    monthlyAverage: 45,
    trend: "Stable",
    seasonalPeak: "Summer months (Apr-Jun)",
  };
}
