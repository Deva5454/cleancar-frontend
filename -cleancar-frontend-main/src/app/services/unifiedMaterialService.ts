/**
 * UNIFIED MATERIAL MANAGEMENT SERVICE
 * System-wide material tracking across all roles
 *
 * Flow: Procurement → Store → Supervisor → Washer → Return → Store → Repair → Cycle
 *
 * Material Types:
 * - CONSUMABLE: One-way flow, volume tracking (ml/L)
 * - REUSABLE: Return mandatory, lifecycle tracking (wash count)
 * - ASSET: Unique ID, status tracking, repair flow
 */

// ========== CORE TYPES ==========

export type MaterialCategory = "CONSUMABLE" | "REUSABLE" | "ASSET";

export type MaterialType =
  // Consumables
  | "FOAM_SHAMPOO"
  | "WHEEL_CLEANER"
  | "GLASS_CLEANER"
  | "TIRE_SHINE"
  | "AIR_FRESHENER"
  | "POLISH"
  // Reusable
  | "MICROFIBER_CLOTH"
  // Assets
  | "FOAM_GUN"
  | "VACUUM_CLEANER"
  | "PRESSURE_WASHER"
  | "POLISHER_MACHINE";

export type MaterialStatus =
  | "IN_PROCUREMENT"        // Being procured
  | "IN_STORE"              // In store inventory
  | "WITH_SUPERVISOR"       // In supervisor buffer
  | "WITH_WASHER"           // Assigned to washer
  | "IN_TRANSIT"            // Moving between locations
  | "BROKEN"                // Damaged/broken
  | "IN_REPAIR"             // Under repair
  | "RETIRED";              // End of lifecycle

export type TransactionType =
  | "PROCUREMENT_TO_STORE"
  | "STORE_TO_SUPERVISOR"
  | "SUPERVISOR_TO_WASHER"
  | "WASHER_RETURN"
  | "BREAKDOWN_REPORT"
  | "REPAIR_SEND"
  | "REPAIR_RETURN"
  | "REFILL_REQUEST"
  | "REFILL_COMPLETE"
  | "RETIREMENT";

export type AssetCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "BROKEN";
export type ReusableCondition = "NORMAL" | "WORN" | "DAMAGED" | "LOST";

// ========== MATERIAL MASTER ==========

export interface MaterialMaster {
  materialId: string;                 // e.g., "MAT-FOAM-001"
  materialType: MaterialType;
  category: MaterialCategory;
  name: string;
  description: string;
  unit: string;                       // ml, L, pcs, units
  defaultMinThreshold: number;        // For buffer stock
  defaultMaxThreshold: number;
  estimatedLifecycle?: number;        // For reusable (e.g., 90 washes)
  averageRepairTime?: number;         // For assets (days)
  isActive: boolean;
  createdDate: string;
  createdBy: string;                  // Procurement user
}

// ========== INDIVIDUAL ITEM TRACKING ==========

/**
 * For ASSETS and REUSABLE items - tracked individually
 */
export interface IndividualItem {
  itemId: string;                     // Unique ID (e.g., "FOAM-GUN-001", "CLOTH-A-045")
  materialId: string;                 // Reference to MaterialMaster
  materialType: MaterialType;
  category: MaterialCategory;
  name: string;

  // Lifecycle
  status: MaterialStatus;
  currentLocation: string;            // storeId, supervisorId, washerId
  currentLocationName: string;
  purchaseDate: string;

  // For REUSABLE (Cloths)
  usageCount?: number;                // Current wash count
  maxUsageCount?: number;             // Max washes (e.g., 90)
  reusableCondition?: ReusableCondition;

  // For ASSETS
  assetCondition?: AssetCondition;
  lastMaintenanceDate?: string;
  nextMaintenanceDue?: string;
  repairHistory?: RepairRecord[];

  isActive: boolean;
}

export interface RepairRecord {
  id: string;
  itemId: string;
  reportedBy: string;                 // washerId or supervisorId
  reportedDate: string;
  issue: string;
  repairVendor?: string;
  sentToRepairDate?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  repairCost?: number;
  status: "REPORTED" | "SENT_TO_REPAIR" | "REPAIRED" | "IRREPARABLE";
  notes?: string;
}

// ========== BULK TRACKING (Consumables) ==========

/**
 * For CONSUMABLE items - tracked by quantity
 */
export interface BulkInventory {
  id: string;
  materialId: string;
  materialType: MaterialType;
  materialName: string;
  location: "STORE" | "SUPERVISOR" | "WASHER";
  locationId: string;                 // storeId, supervisorId, washerId
  currentQuantity: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  lastUpdated: string;
  isLowStock: boolean;
}

// ========== TRANSACTIONS ==========

export interface MaterialTransaction {
  id: string;
  transactionDate: string;
  transactionType: TransactionType;

  materialId: string;
  materialType: MaterialType;
  materialName: string;
  category: MaterialCategory;

  // For individual items
  itemId?: string;

  // For bulk items
  quantity?: number;
  unit?: string;

  fromEntity: string;                 // "PROCUREMENT", storeId, supervisorId, washerId
  toEntity: string;
  fromName: string;
  toName: string;

  // Context
  condition?: AssetCondition | ReusableCondition;
  notes?: string;
  referenceDocument?: string;         // PO, DN, etc.

  // Breakdown specific
  breakdownReason?: string;
  photoUrl?: string;

  performedBy: string;
  approvedBy?: string;
}

// ========== REFILL REQUESTS ==========

export interface RefillRequest {
  id: string;
  requestDate: string;
  requestedBy: string;                // supervisorId
  requestedByName: string;

  materialId: string;
  materialType: MaterialType;
  materialName: string;
  category: MaterialCategory;

  requestedQuantity: number;
  unit: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  reason: string;

  status: "PENDING" | "APPROVED" | "DISPATCHED" | "COMPLETED" | "REJECTED";
  approvedBy?: string;
  approvedDate?: string;
  dispatchedDate?: string;
  completedDate?: string;

  deliveryNote?: string;
}

// ========== WASHER ASSIGNMENT ==========

export interface WasherMaterialAssignment {
  washerId: string;
  washerName: string;

  // Individual items assigned
  assignedItems: {
    itemId: string;
    materialType: MaterialType;
    materialName: string;
    assignedDate: string;
    returnDueDate?: string;
    isOverdue: boolean;
  }[];

  // Consumables received
  consumablesStock: {
    materialId: string;
    materialType: MaterialType;
    materialName: string;
    currentQuantity: number;
    unit: string;
  }[];

  // Restrictions
  canReceiveNewItems: boolean;        // false if unreturned items
  unreturned: string[];               // List of unreturned itemIds
}

// ========== SERVICE ==========

class UnifiedMaterialService {
  private materialMaster: Map<string, MaterialMaster> = new Map();
  private individualItems: Map<string, IndividualItem> = new Map();
  private bulkInventory: BulkInventory[] = [];
  private transactions: MaterialTransaction[] = [];
  private refillRequests: RefillRequest[] = [];
  private washerAssignments: Map<string, WasherMaterialAssignment> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Material Master
    const materials: MaterialMaster[] = [
      // Consumables
      {
        materialId: "MAT-FOAM-001",
        materialType: "FOAM_SHAMPOO",
        category: "CONSUMABLE",
        name: "Premium Foam Shampoo",
        description: "High-foam car wash shampoo",
        unit: "L",
        defaultMinThreshold: 20,
        defaultMaxThreshold: 100,
        isActive: true,
        createdDate: "2024-01-01",
        createdBy: "PROC-001"
      },
      {
        materialId: "MAT-WHEEL-001",
        materialType: "WHEEL_CLEANER",
        category: "CONSUMABLE",
        name: "Wheel & Rim Cleaner",
        description: "Non-acidic wheel cleaner",
        unit: "L",
        defaultMinThreshold: 10,
        defaultMaxThreshold: 50,
        isActive: true,
        createdDate: "2024-01-01",
        createdBy: "PROC-001"
      },
      {
        materialId: "MAT-GLASS-001",
        materialType: "GLASS_CLEANER",
        category: "CONSUMABLE",
        name: "Streak-Free Glass Cleaner",
        description: "Professional glass cleaner",
        unit: "L",
        defaultMinThreshold: 15,
        defaultMaxThreshold: 60,
        isActive: true,
        createdDate: "2024-01-01",
        createdBy: "PROC-001"
      },
      // Reusable
      {
        materialId: "MAT-CLOTH-001",
        materialType: "MICROFIBER_CLOTH",
        category: "REUSABLE",
        name: "Microfiber Cloth (Set)",
        description: "Premium microfiber cloths for car washing",
        unit: "set",
        defaultMinThreshold: 5,
        defaultMaxThreshold: 20,
        estimatedLifecycle: 90,
        isActive: true,
        createdDate: "2024-01-01",
        createdBy: "PROC-001"
      },
      // Assets
      {
        materialId: "MAT-FGUN-001",
        materialType: "FOAM_GUN",
        category: "ASSET",
        name: "Foam Gun Pro",
        description: "Professional foam lance gun",
        unit: "pcs",
        defaultMinThreshold: 2,
        defaultMaxThreshold: 10,
        averageRepairTime: 3,
        isActive: true,
        createdDate: "2024-01-01",
        createdBy: "PROC-001"
      },
      {
        materialId: "MAT-VAC-001",
        materialType: "VACUUM_CLEANER",
        category: "ASSET",
        name: "Industrial Vacuum Cleaner",
        description: "Heavy-duty wet/dry vacuum",
        unit: "pcs",
        defaultMinThreshold: 1,
        defaultMaxThreshold: 5,
        averageRepairTime: 5,
        isActive: true,
        createdDate: "2024-01-01",
        createdBy: "PROC-001"
      }
    ];

    materials.forEach(m => this.materialMaster.set(m.materialId, m));

    // Individual Items (Assets)
    const items: IndividualItem[] = [
      {
        itemId: "FOAM-GUN-001",
        materialId: "MAT-FGUN-001",
        materialType: "FOAM_GUN",
        category: "ASSET",
        name: "Foam Gun Pro",
        status: "IN_STORE",
        currentLocation: "STORE-001",
        currentLocationName: "Main Store",
        purchaseDate: "2024-01-15",
        assetCondition: "EXCELLENT",
        isActive: true
      },
      {
        itemId: "FOAM-GUN-002",
        materialId: "MAT-FGUN-001",
        materialType: "FOAM_GUN",
        category: "ASSET",
        name: "Foam Gun Pro",
        status: "WITH_SUPERVISOR",
        currentLocation: "SUP-001",
        currentLocationName: "Rajesh Kumar",
        purchaseDate: "2024-01-15",
        assetCondition: "GOOD",
        isActive: true
      },
      {
        itemId: "FOAM-GUN-003",
        materialId: "MAT-FGUN-001",
        materialType: "FOAM_GUN",
        category: "ASSET",
        name: "Foam Gun Pro",
        status: "WITH_WASHER",
        currentLocation: "W001",
        currentLocationName: "Suresh Kumar",
        purchaseDate: "2024-01-15",
        assetCondition: "GOOD",
        isActive: true
      },
      {
        itemId: "FOAM-GUN-004",
        materialId: "MAT-FGUN-001",
        materialType: "FOAM_GUN",
        category: "ASSET",
        name: "Foam Gun Pro",
        status: "BROKEN",
        currentLocation: "STORE-001",
        currentLocationName: "Main Store",
        purchaseDate: "2024-01-15",
        assetCondition: "BROKEN",
        repairHistory: [{
          id: "REP-001",
          itemId: "FOAM-GUN-004",
          reportedBy: "W002",
          reportedDate: "2024-04-12",
          issue: "Nozzle not spraying, pressure leak",
          status: "REPORTED",
        }],
        isActive: false
      },
      // Vacuum Cleaners
      {
        itemId: "VAC-001",
        materialId: "MAT-VAC-001",
        materialType: "VACUUM_CLEANER",
        category: "ASSET",
        name: "Industrial Vacuum Cleaner",
        status: "WITH_SUPERVISOR",
        currentLocation: "SUP-001",
        currentLocationName: "Rajesh Kumar",
        purchaseDate: "2024-01-20",
        assetCondition: "EXCELLENT",
        lastMaintenanceDate: "2024-04-01",
        isActive: true
      },
      // Microfiber Cloths (Reusable)
      {
        itemId: "CLOTH-A-001",
        materialId: "MAT-CLOTH-001",
        materialType: "MICROFIBER_CLOTH",
        category: "REUSABLE",
        name: "Microfiber Cloth (Set)",
        status: "WITH_SUPERVISOR",
        currentLocation: "SUP-001",
        currentLocationName: "Rajesh Kumar",
        purchaseDate: "2024-01-15",
        usageCount: 25,
        maxUsageCount: 90,
        reusableCondition: "NORMAL",
        isActive: true
      },
      {
        itemId: "CLOTH-A-002",
        materialId: "MAT-CLOTH-001",
        materialType: "MICROFIBER_CLOTH",
        category: "REUSABLE",
        name: "Microfiber Cloth (Set)",
        status: "WITH_WASHER",
        currentLocation: "W001",
        currentLocationName: "Suresh Kumar",
        purchaseDate: "2024-01-15",
        usageCount: 45,
        maxUsageCount: 90,
        reusableCondition: "NORMAL",
        isActive: true
      }
    ];

    items.forEach(i => this.individualItems.set(i.itemId, i));

    // Bulk Inventory (Consumables)
    this.bulkInventory = [
      // Store
      {
        id: "BULK-001",
        materialId: "MAT-FOAM-001",
        materialType: "FOAM_SHAMPOO",
        materialName: "Premium Foam Shampoo",
        location: "STORE",
        locationId: "STORE-001",
        currentQuantity: 80,
        unit: "L",
        minThreshold: 20,
        maxThreshold: 100,
        lastUpdated: new Date().toISOString(),
        isLowStock: false
      },
      // Supervisor Buffer
      {
        id: "BULK-002",
        materialId: "MAT-FOAM-001",
        materialType: "FOAM_SHAMPOO",
        materialName: "Premium Foam Shampoo",
        location: "SUPERVISOR",
        locationId: "SUP-001",
        currentQuantity: 15,
        unit: "L",
        minThreshold: 20,
        maxThreshold: 50,
        lastUpdated: new Date().toISOString(),
        isLowStock: true
      },
      {
        id: "BULK-003",
        materialId: "MAT-WHEEL-001",
        materialType: "WHEEL_CLEANER",
        materialName: "Wheel & Rim Cleaner",
        location: "SUPERVISOR",
        locationId: "SUP-001",
        currentQuantity: 8,
        unit: "L",
        minThreshold: 10,
        maxThreshold: 30,
        lastUpdated: new Date().toISOString(),
        isLowStock: true
      }
    ];

    // Washer Assignments
    this.washerAssignments.set("W001", {
      washerId: "W001",
      washerName: "Suresh Kumar",
      assignedItems: [
        {
          itemId: "FOAM-GUN-003",
          materialType: "FOAM_GUN",
          materialName: "Foam Gun Pro",
          assignedDate: "2024-04-12",
          returnDueDate: "2024-04-19",
          isOverdue: false
        },
        {
          itemId: "CLOTH-A-002",
          materialType: "MICROFIBER_CLOTH",
          materialName: "Microfiber Cloth (Set)",
          assignedDate: "2024-04-12",
          returnDueDate: "2024-04-15",
          isOverdue: false
        }
      ],
      consumablesStock: [
        {
          materialId: "MAT-FOAM-001",
          materialType: "FOAM_SHAMPOO",
          materialName: "Premium Foam Shampoo",
          currentQuantity: 5,
          unit: "L"
        }
      ],
      canReceiveNewItems: false,
      unreturned: ["FOAM-GUN-003", "CLOTH-A-002"]
    });
  }

  // ========== MATERIAL MASTER ==========

  getMaterialMaster(): MaterialMaster[] {
    return Array.from(this.materialMaster.values());
  }

  getMaterialById(materialId: string): MaterialMaster | null {
    return this.materialMaster.get(materialId) || null;
  }

  getMaterialsByCategory(category: MaterialCategory): MaterialMaster[] {
    return this.getMaterialMaster().filter(m => m.category === category);
  }

  createMaterial(material: Omit<MaterialMaster, "materialId" | "createdDate">): { success: boolean; materialId?: string; error?: string } {
    const materialId = `MAT-${material.materialType}-${Date.now()}`;
    const newMaterial: MaterialMaster = {
      ...material,
      materialId,
      createdDate: new Date().toISOString()
    };
    this.materialMaster.set(materialId, newMaterial);
    return { success: true, materialId };
  }

  // ========== INDIVIDUAL ITEMS (Assets & Reusable) ==========

  getIndividualItems(): IndividualItem[] {
    return Array.from(this.individualItems.values());
  }

  getItemById(itemId: string): IndividualItem | null {
    return this.individualItems.get(itemId) || null;
  }

  getItemsByLocation(locationId: string): IndividualItem[] {
    return this.getIndividualItems().filter(i => i.currentLocation === locationId);
  }

  getItemsByStatus(status: MaterialStatus): IndividualItem[] {
    return this.getIndividualItems().filter(i => i.status === status);
  }

  getBrokenItems(): IndividualItem[] {
    return this.getIndividualItems().filter(i => i.status === "BROKEN" || i.assetCondition === "BROKEN");
  }

  getItemsNearingEndOfLife(): IndividualItem[] {
    return this.getIndividualItems().filter(i => {
      if (i.category === "REUSABLE" && i.usageCount && i.maxUsageCount) {
        return i.usageCount > i.maxUsageCount * 0.8;
      }
      return false;
    });
  }

  // ========== BULK INVENTORY (Consumables) ==========

  getBulkInventory(location?: "STORE" | "SUPERVISOR" | "WASHER", locationId?: string): BulkInventory[] {
    let inventory = this.bulkInventory;
    if (location) {
      inventory = inventory.filter(i => i.location === location);
    }
    if (locationId) {
      inventory = inventory.filter(i => i.locationId === locationId);
    }
    return inventory;
  }

  getLowStockItems(locationId: string): BulkInventory[] {
    return this.getBulkInventory(undefined, locationId).filter(i => i.isLowStock || i.currentQuantity < i.minThreshold);
  }

  // ========== STORE → SUPERVISOR ==========

  transferStoreToSupervisor(
    storeId: string,
    supervisorId: string,
    supervisorName: string,
    items: {
      materialId: string;
      itemIds?: string[];        // For individual items
      quantity?: number;         // For consumables
    }[],
    deliveryNote: string
  ): { success: boolean; error?: string } {
    items.forEach(item => {
      const material = this.materialMaster.get(item.materialId);
      if (!material) return;

      if (material.category === "CONSUMABLE") {
        // Transfer bulk quantity
        const storeInv = this.bulkInventory.find(i => i.materialId === item.materialId && i.locationId === storeId);
        if (storeInv && item.quantity) {
          storeInv.currentQuantity -= item.quantity;

          let supInv = this.bulkInventory.find(i => i.materialId === item.materialId && i.locationId === supervisorId);
          if (supInv) {
            supInv.currentQuantity += item.quantity;
          } else {
            this.bulkInventory.push({
              id: `BULK-${Date.now()}`,
              materialId: item.materialId,
              materialType: material.materialType,
              materialName: material.name,
              location: "SUPERVISOR",
              locationId: supervisorId,
              currentQuantity: item.quantity,
              unit: material.unit,
              minThreshold: material.defaultMinThreshold,
              maxThreshold: material.defaultMaxThreshold,
              lastUpdated: new Date().toISOString(),
              isLowStock: item.quantity < material.defaultMinThreshold
            });
          }
        }
      } else {
        // Transfer individual items
        item.itemIds?.forEach(itemId => {
          const individualItem = this.individualItems.get(itemId);
          if (individualItem) {
            individualItem.status = "WITH_SUPERVISOR";
            individualItem.currentLocation = supervisorId;
            individualItem.currentLocationName = supervisorName;
          }
        });
      }

      // Log transaction
      this.transactions.push({
        id: `TXN-${Date.now()}-${item.materialId}`,
        transactionDate: new Date().toISOString(),
        transactionType: "STORE_TO_SUPERVISOR",
        materialId: item.materialId,
        materialType: material.materialType,
        materialName: material.name,
        category: material.category,
        itemId: item.itemIds?.[0],
        quantity: item.quantity,
        unit: material.unit,
        fromEntity: storeId,
        toEntity: supervisorId,
        fromName: "Main Store",
        toName: supervisorName,
        referenceDocument: deliveryNote,
        performedBy: storeId
      });
    });

    return { success: true };
  }

  // ========== SUPERVISOR → WASHER ==========

  issueToWasher(
    supervisorId: string,
    washerId: string,
    washerName: string,
    items: {
      materialId: string;
      itemId?: string;           // For individual items
      quantity?: number;         // For consumables
    }[]
  ): { success: boolean; error?: string } {
    const assignment = this.washerAssignments.get(washerId);

    // Check if washer can receive new items
    if (assignment && !assignment.canReceiveNewItems && items.some(i => i.itemId)) {
      return { success: false, error: "Washer must return unreturned items before receiving new ones" };
    }

    items.forEach(item => {
      const material = this.materialMaster.get(item.materialId);
      if (!material) return;

      if (material.category === "CONSUMABLE" && item.quantity) {
        // Transfer consumables
        const supInv = this.bulkInventory.find(i => i.materialId === item.materialId && i.locationId === supervisorId);
        if (supInv && supInv.currentQuantity >= item.quantity) {
          supInv.currentQuantity -= item.quantity;
          supInv.isLowStock = supInv.currentQuantity < supInv.minThreshold;

          // Add to washer's consumables
          if (assignment) {
            const washerConsumable = assignment.consumablesStock.find(c => c.materialId === item.materialId);
            if (washerConsumable) {
              washerConsumable.currentQuantity += item.quantity;
            } else {
              assignment.consumablesStock.push({
                materialId: item.materialId,
                materialType: material.materialType,
                materialName: material.name,
                currentQuantity: item.quantity,
                unit: material.unit
              });
            }
          }
        }
      } else if (item.itemId) {
        // Transfer individual item
        const individualItem = this.individualItems.get(item.itemId);
        if (individualItem) {
          individualItem.status = "WITH_WASHER";
          individualItem.currentLocation = washerId;
          individualItem.currentLocationName = washerName;

          // Add to washer assignment
          if (assignment) {
            const returnDueDate = new Date();
            returnDueDate.setDate(returnDueDate.getDate() + (material.category === "REUSABLE" ? 3 : 7));

            assignment.assignedItems.push({
              itemId: item.itemId,
              materialType: material.materialType,
              materialName: material.name,
              assignedDate: new Date().toISOString(),
              returnDueDate: returnDueDate.toISOString(),
              isOverdue: false
            });
            assignment.unreturned.push(item.itemId);
            assignment.canReceiveNewItems = false;
          }
        }
      }

      // Log transaction
      this.transactions.push({
        id: `TXN-${Date.now()}-${item.materialId}`,
        transactionDate: new Date().toISOString(),
        transactionType: "SUPERVISOR_TO_WASHER",
        materialId: item.materialId,
        materialType: material.materialType,
        materialName: material.name,
        category: material.category,
        itemId: item.itemId,
        quantity: item.quantity,
        unit: material.unit,
        fromEntity: supervisorId,
        toEntity: washerId,
        fromName: "Supervisor",
        toName: washerName,
        performedBy: supervisorId
      });
    });

    return { success: true };
  }

  // ========== WASHER → SUPERVISOR (RETURN) ==========

  returnToSupervisor(
    washerId: string,
    itemId: string,
    supervisorId: string,
    condition: AssetCondition | ReusableCondition,
    notes?: string
  ): { success: boolean; error?: string } {
    const item = this.individualItems.get(itemId);
    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (item.currentLocation !== washerId) {
      return { success: false, error: "Item not assigned to this washer" };
    }

    // Update item
    item.status = condition === "BROKEN" ? "BROKEN" : "WITH_SUPERVISOR";
    item.currentLocation = supervisorId;
    item.currentLocationName = "Supervisor";

    if (item.category === "ASSET") {
      item.assetCondition = condition as AssetCondition;
    } else if (item.category === "REUSABLE") {
      item.reusableCondition = condition as ReusableCondition;
      if (item.usageCount !== undefined) {
        item.usageCount += 1;
      }
    }

    if (condition === "BROKEN" || condition === "DAMAGED") {
      item.isActive = false;
    }

    // Update washer assignment
    const assignment = this.washerAssignments.get(washerId);
    if (assignment) {
      assignment.assignedItems = assignment.assignedItems.filter(a => a.itemId !== itemId);
      assignment.unreturned = assignment.unreturned.filter(id => id !== itemId);
      assignment.canReceiveNewItems = assignment.unreturned.length === 0;
    }

    // Log transaction
    const material = this.materialMaster.get(item.materialId);
    if (material) {
      this.transactions.push({
        id: `TXN-${Date.now()}-${itemId}`,
        transactionDate: new Date().toISOString(),
        transactionType: "WASHER_RETURN",
        materialId: item.materialId,
        materialType: material.materialType,
        materialName: material.name,
        category: material.category,
        itemId,
        fromEntity: washerId,
        toEntity: supervisorId,
        fromName: "Washer",
        toName: "Supervisor",
        condition,
        notes,
        performedBy: washerId
      });
    }

    return { success: true };
  }

  // ========== BREAKDOWN REPORTING ==========

  reportBreakdown(
    itemId: string,
    reportedBy: string,
    issue: string,
    photoUrl?: string
  ): { success: boolean; repairId?: string; error?: string } {
    const item = this.individualItems.get(itemId);
    if (!item) {
      return { success: false, error: "Item not found" };
    }

    const repairRecord: RepairRecord = {
      id: `REP-${Date.now()}`,
      itemId,
      reportedBy,
      reportedDate: new Date().toISOString(),
      issue,
      status: "REPORTED"
    };

    if (!item.repairHistory) {
      item.repairHistory = [];
    }
    item.repairHistory.push(repairRecord);

    item.status = "BROKEN";
    item.isActive = false;
    if (item.category === "ASSET") {
      item.assetCondition = "BROKEN";
    }

    // Log transaction
    const material = this.materialMaster.get(item.materialId);
    if (material) {
      this.transactions.push({
        id: `TXN-${Date.now()}-${itemId}`,
        transactionDate: new Date().toISOString(),
        transactionType: "BREAKDOWN_REPORT",
        materialId: item.materialId,
        materialType: material.materialType,
        materialName: material.name,
        category: material.category,
        itemId,
        fromEntity: reportedBy,
        toEntity: "STORE-001",
        fromName: "Reporter",
        toName: "Store",
        breakdownReason: issue,
        photoUrl,
        performedBy: reportedBy
      });
    }

    return { success: true, repairId: repairRecord.id };
  }

  // ========== REFILL REQUESTS ==========

  createRefillRequest(
    supervisorId: string,
    supervisorName: string,
    materialId: string,
    quantity: number,
    urgency: "NORMAL" | "URGENT" | "CRITICAL",
    reason: string
  ): { success: boolean; requestId?: string; error?: string } {
    const material = this.materialMaster.get(materialId);
    if (!material) {
      return { success: false, error: "Material not found" };
    }

    const request: RefillRequest = {
      id: `REF-${Date.now()}`,
      requestDate: new Date().toISOString(),
      requestedBy: supervisorId,
      requestedByName: supervisorName,
      materialId,
      materialType: material.materialType,
      materialName: material.name,
      category: material.category,
      requestedQuantity: quantity,
      unit: material.unit,
      urgency,
      reason,
      status: "PENDING"
    };

    this.refillRequests.push(request);
    return { success: true, requestId: request.id };
  }

  getRefillRequests(supervisorId?: string): RefillRequest[] {
    if (supervisorId) {
      return this.refillRequests.filter(r => r.requestedBy === supervisorId);
    }
    return this.refillRequests;
  }

  getPendingRefillRequests(): RefillRequest[] {
    return this.refillRequests.filter(r => r.status === "PENDING" || r.status === "APPROVED");
  }

  // ========== WASHER QUERIES ==========

  getWasherAssignment(washerId: string): WasherMaterialAssignment | null {
    return this.washerAssignments.get(washerId) || null;
  }

  // ========== TRANSACTIONS ==========

  getAllTransactions(): MaterialTransaction[] {
    return this.transactions;
  }

  getTransactionsByEntity(entityId: string): MaterialTransaction[] {
    return this.transactions.filter(t => t.fromEntity === entityId || t.toEntity === entityId);
  }

  getTransactionsByType(type: TransactionType): MaterialTransaction[] {
    return this.transactions.filter(t => t.transactionType === type);
  }
}

// Singleton instance
export const unifiedMaterialService = new UnifiedMaterialService();
