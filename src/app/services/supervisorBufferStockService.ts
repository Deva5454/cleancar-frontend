/**
 * Supervisor Buffer Stock Service
 * 3-Tier Inventory Flow: HO/Store → Supervisor Buffer → Washers
 *
 * IMPORTANT SEPARATION:
 * - This service handles CONSUMABLES ONLY (shampoo, wax, etc.)
 * - Consumables are one-way flow: Store → Supervisor → Washer → Consumed
 * - Consumption tracked against customer service packages
 *
 * RETURNABLE ITEMS (Cloths):
 * - Tracked individually via clothLifecycleService.ts
 * - Cloths have full lifecycle: Store → Supervisor → Washer → Return → Laundry → Cycle
 */

export type StockTransactionType = "INWARD" | "OUTWARD";
export type MaterialType = "SHAMPOO" | "WAX" | "VACUUM_BAG" | "AIR_FRESHENER" | "TIRE_SHINE" | "GLASS_CLEANER" | "OTHER";
export type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface BufferStockItem {
  id: string;
  materialType: MaterialType;
  materialName: string;
  currentQuantity: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string; // "batches", "liters", "pieces"
  lastUpdated: Date;
  isLowStock: boolean;
}

export interface InwardTransaction {
  id: string;
  transactionDate: Date;
  materialType: MaterialType;
  materialName: string;
  quantity: number;
  unit: string;
  receivedFrom: "HO" | "STORE";
  deliveryNote: string;
  receivedBy: string;
  supervisorId: string;
  status: TransactionStatus;
  remarks?: string;
}

export interface OutwardTransaction {
  id: string;
  transactionDate: Date;
  materialType: MaterialType;
  materialName: string;
  quantity: number;
  unit: string;
  issuedTo: string; // washerId
  issuedToName: string; // washerName
  issuedBy: string; // supervisorId
  purpose: string;
  status: TransactionStatus;
  acknowledgement?: {
    acknowledged: boolean;
    acknowledgedAt?: Date;
    signature?: string;
  };
}

export interface StockMovementReport {
  openingStock: number;
  inwardTotal: number;
  outwardTotal: number;
  closingStock: number;
  period: {
    from: Date;
    to: Date;
  };
}

export interface LowStockAlert {
  materialType: MaterialType;
  materialName: string;
  currentQuantity: number;
  minThreshold: number;
  shortfall: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

class SupervisorBufferStockService {
  private readonly DEFAULT_MIN_THRESHOLD = {
    SHAMPOO: 20,
    WAX: 10,
    VACUUM_BAG: 50,
    AIR_FRESHENER: 30,
    TIRE_SHINE: 15,
    GLASS_CLEANER: 25,
    OTHER: 10,
  };

  private readonly DEFAULT_MAX_THRESHOLD = {
    SHAMPOO: 100,
    WAX: 50,
    VACUUM_BAG: 200,
    AIR_FRESHENER: 100,
    TIRE_SHINE: 60,
    GLASS_CLEANER: 80,
    OTHER: 50,
  };

  // ========== BUFFER STOCK MANAGEMENT ==========

  getBufferStock(supervisorId: string): BufferStockItem[] {
    // In production: GET /api/supervisor/:id/buffer-stock
    // NOTE: This returns CONSUMABLES only. Returnable items (cloths) are tracked via clothLifecycleService
    const mockStock: BufferStockItem[] = [
      {
        id: "STOCK-001",
        materialType: "SHAMPOO",
        materialName: "Car Shampoo (5L)",
        currentQuantity: 15,
        minThreshold: this.DEFAULT_MIN_THRESHOLD.SHAMPOO,
        maxThreshold: this.DEFAULT_MAX_THRESHOLD.SHAMPOO,
        unit: "liters",
        lastUpdated: new Date(),
        isLowStock: true,
      },
      {
        id: "STOCK-002",
        materialType: "WAX",
        materialName: "Car Wax Polish",
        currentQuantity: 8,
        minThreshold: this.DEFAULT_MIN_THRESHOLD.WAX,
        maxThreshold: this.DEFAULT_MAX_THRESHOLD.WAX,
        unit: "bottles",
        lastUpdated: new Date(),
        isLowStock: true,
      },
      {
        id: "STOCK-003",
        materialType: "VACUUM_BAG",
        materialName: "Vacuum Cleaner Bags",
        currentQuantity: 45,
        minThreshold: this.DEFAULT_MIN_THRESHOLD.VACUUM_BAG,
        maxThreshold: this.DEFAULT_MAX_THRESHOLD.VACUUM_BAG,
        unit: "pieces",
        lastUpdated: new Date(),
        isLowStock: false,
      },
      {
        id: "STOCK-004",
        materialType: "AIR_FRESHENER",
        materialName: "Air Freshener Spray",
        currentQuantity: 28,
        minThreshold: this.DEFAULT_MIN_THRESHOLD.AIR_FRESHENER,
        maxThreshold: this.DEFAULT_MAX_THRESHOLD.AIR_FRESHENER,
        unit: "cans",
        lastUpdated: new Date(),
        isLowStock: false,
      },
      {
        id: "STOCK-005",
        materialType: "TIRE_SHINE",
        materialName: "Tire Shine Polish",
        currentQuantity: 12,
        minThreshold: this.DEFAULT_MIN_THRESHOLD.TIRE_SHINE,
        maxThreshold: this.DEFAULT_MAX_THRESHOLD.TIRE_SHINE,
        unit: "bottles",
        lastUpdated: new Date(),
        isLowStock: false,
      },
    ];

    return mockStock;
  }

  getLowStockAlerts(supervisorId: string): LowStockAlert[] {
    const stock = this.getBufferStock(supervisorId);

    return stock
      .filter((item) => item.isLowStock || item.currentQuantity < item.minThreshold)
      .map((item) => {
        const shortfall = item.minThreshold - item.currentQuantity;
        let priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

        const ratio = item.currentQuantity / item.minThreshold;
        if (ratio <= 0.25) priority = "CRITICAL";
        else if (ratio <= 0.5) priority = "HIGH";
        else if (ratio <= 0.75) priority = "MEDIUM";

        return {
          materialType: item.materialType,
          materialName: item.materialName,
          currentQuantity: item.currentQuantity,
          minThreshold: item.minThreshold,
          shortfall: Math.max(0, shortfall),
          priority,
        };
      });
  }

  // ========== INWARD TRANSACTIONS (Receiving from HO/Store) ==========

  recordInwardStock(
    supervisorId: string,
    materialType: MaterialType,
    materialName: string,
    quantity: number,
    unit: string,
    receivedFrom: "HO" | "STORE",
    deliveryNote: string
  ): { success: boolean; transactionId?: string; error?: string } {
    // Validation
    if (quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }

    const transactionId = `INW-${Date.now()}`;

    console.log("✅ Inward Stock Recorded:", {
      transactionId,
      supervisorId,
      materialType,
      materialName,
      quantity,
      unit,
      receivedFrom,
      deliveryNote,
    });

    // In production: POST /api/supervisor/:id/inward-stock
    // - Record transaction
    // - Update buffer stock
    // - Send notification to supervisor
    // - Generate receipt

    return { success: true, transactionId };
  }

  getInwardTransactions(
    supervisorId: string,
    fromDate?: Date,
    toDate?: Date
  ): InwardTransaction[] {
    // In production: GET /api/supervisor/:id/inward-transactions
    // NOTE: Consumables only. Cloth transfers tracked via clothLifecycleService
    const mockTransactions: InwardTransaction[] = [
      {
        id: "INW-001",
        transactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        materialType: "SHAMPOO",
        materialName: "Car Shampoo (5L)",
        quantity: 25,
        unit: "liters",
        receivedFrom: "HO",
        deliveryNote: "DN-2024-001",
        receivedBy: "SUP-001",
        supervisorId: "SUP-001",
        status: "COMPLETED",
      },
      {
        id: "INW-002",
        transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        materialType: "WAX",
        materialName: "Car Wax Polish",
        quantity: 20,
        unit: "bottles",
        receivedFrom: "STORE",
        deliveryNote: "DN-2024-002",
        receivedBy: "SUP-001",
        supervisorId: "SUP-001",
        status: "COMPLETED",
        remarks: "Urgent replenishment",
      },
    ];

    return mockTransactions;
  }

  // ========== OUTWARD TRANSACTIONS (Issuing to Washers) ==========

  issueStockToWasher(
    supervisorId: string,
    washerId: string,
    washerName: string,
    materialType: MaterialType,
    materialName: string,
    quantity: number,
    unit: string,
    purpose: string
  ): { success: boolean; transactionId?: string; error?: string } {
    // Check buffer stock availability
    const bufferStock = this.getBufferStock(supervisorId);
    const stockItem = bufferStock.find(
      (item) => item.materialType === materialType && item.materialName === materialName
    );

    if (!stockItem || stockItem.currentQuantity < quantity) {
      return {
        success: false,
        error: `Insufficient buffer stock. Available: ${stockItem?.currentQuantity || 0}, Requested: ${quantity}`,
      };
    }

    const transactionId = `OUT-${Date.now()}`;

    console.log("✅ Outward Stock Issued:", {
      transactionId,
      supervisorId,
      washerId,
      washerName,
      materialType,
      materialName,
      quantity,
      unit,
      purpose,
    });

    // In production: POST /api/supervisor/:id/outward-stock
    // - Record transaction
    // - Update buffer stock (reduce quantity)
    // - Send notification to washer
    // - Generate issuance receipt
    // - Require washer acknowledgement

    return { success: true, transactionId };
  }

  getOutwardTransactions(
    supervisorId: string,
    fromDate?: Date,
    toDate?: Date
  ): OutwardTransaction[] {
    // In production: GET /api/supervisor/:id/outward-transactions
    // NOTE: Consumables only. Cloth assignments tracked via clothLifecycleService
    const mockTransactions: OutwardTransaction[] = [
      {
        id: "OUT-001",
        transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        materialType: "SHAMPOO",
        materialName: "Car Shampoo (5L)",
        quantity: 5,
        unit: "liters",
        issuedTo: "W001",
        issuedToName: "Suresh Kumar",
        issuedBy: "SUP-001",
        purpose: "Weekly replenishment - consumption tracked per service",
        status: "COMPLETED",
        acknowledgement: {
          acknowledged: true,
          acknowledgedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          signature: "DIGITAL_SIGN_001",
        },
      },
      {
        id: "OUT-002",
        transactionDate: new Date(),
        materialType: "WAX",
        materialName: "Car Wax Polish",
        quantity: 3,
        unit: "bottles",
        issuedTo: "W002",
        issuedToName: "Ramesh K.",
        issuedBy: "SUP-001",
        purpose: "Monthly replenishment - tracked against premium packages",
        status: "PENDING",
        acknowledgement: {
          acknowledged: false,
        },
      },
    ];

    return mockTransactions;
  }

  // ========== STOCK MOVEMENT REPORT ==========

  getStockMovementReport(
    supervisorId: string,
    materialType: MaterialType,
    fromDate: Date,
    toDate: Date
  ): StockMovementReport {
    // In production: GET /api/supervisor/:id/stock-movement
    const inwardTransactions = this.getInwardTransactions(supervisorId, fromDate, toDate);
    const outwardTransactions = this.getOutwardTransactions(supervisorId, fromDate, toDate);

    const inwardTotal = inwardTransactions
      .filter((t) => t.materialType === materialType && t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.quantity, 0);

    const outwardTotal = outwardTransactions
      .filter((t) => t.materialType === materialType && t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.quantity, 0);

    const bufferStock = this.getBufferStock(supervisorId);
    const stockItem = bufferStock.find((item) => item.materialType === materialType);
    const closingStock = stockItem?.currentQuantity || 0;
    const openingStock = closingStock - inwardTotal + outwardTotal;

    return {
      openingStock,
      inwardTotal,
      outwardTotal,
      closingStock,
      period: { from: fromDate, to: toDate },
    };
  }

  // ========== STOCK REQUEST TO HO ==========

  requestStockFromHO(
    supervisorId: string,
    materialType: MaterialType,
    materialName: string,
    quantity: number,
    urgency: "NORMAL" | "URGENT",
    reason: string
  ): { success: boolean; requestId?: string; error?: string } {
    const requestId = `REQ-${Date.now()}`;

    console.log("📦 Stock Request to HO:", {
      requestId,
      supervisorId,
      materialType,
      materialName,
      quantity,
      urgency,
      reason,
    });

    // In production: POST /api/supervisor/:id/stock-request
    // - Create stock request
    // - Notify HO/Store
    // - Track request status
    // - Auto-create inward transaction when delivered

    return { success: true, requestId };
  }
}

// Singleton instance
export const supervisorBufferStockService = new SupervisorBufferStockService();
