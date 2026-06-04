/**
 * CLOTH LIFECYCLE SERVICE
 * Individual cloth tracking with full lifecycle management
 *
 * Flow: Store → Supervisor Buffer → Washer → Return → Laundry → Ready → Cycle
 * Rule: Return mandatory before new issue
 */

// ========== TYPES ==========

export type ClothStatus =
  | "IN_STORE"           // In store master inventory
  | "WITH_SUPERVISOR"    // In supervisor buffer stock
  | "WITH_WASHER"        // Currently assigned to washer
  | "IN_LAUNDRY"         // Sent to laundry for cleaning
  | "READY";             // Cleaned and ready to issue

export type ClothCondition = "NORMAL" | "DAMAGED" | "LOST";

export type TransactionType =
  | "STORE_TO_SUPERVISOR"    // Store → Supervisor buffer
  | "SUPERVISOR_TO_WASHER"   // Supervisor → Washer assignment
  | "WASHER_RETURN"          // Washer → Supervisor return
  | "SUPERVISOR_TO_LAUNDRY"  // Supervisor → Laundry
  | "LAUNDRY_RETURN"         // Laundry → Supervisor (cleaned)
  | "DAMAGE_LOG"             // Damage/Loss recorded
  | "SUPERVISOR_TO_STORE";   // Return to store (rare)

export interface IndividualCloth {
  clothId: string;                    // Unique identifier (e.g., "CLT-001")
  batchId: string;                    // Batch group (A/B/C/D) for organization
  status: ClothStatus;
  condition: ClothCondition;
  currentWashCount: number;           // Current usage (max 90)
  maxWashCount: number;               // Lifecycle limit (90 washes)
  currentHolder: string | null;       // supervisorId or washerId or "STORE" or "LAUNDRY"
  currentHolderName: string | null;
  lastTransactionDate: string;
  purchaseDate: string;
  isActive: boolean;                  // false if retired/lost
}

export interface ClothTransaction {
  id: string;
  clothId: string;
  transactionType: TransactionType;
  fromEntity: string;                 // "STORE" | supervisorId | washerId | "LAUNDRY"
  toEntity: string;
  fromName: string;
  toName: string;
  transactionDate: string;
  condition: ClothCondition;
  washCountAtTransaction: number;
  notes?: string;
  damageReason?: string;              // If DAMAGED or LOST
  photoUrl?: string;
}

export interface WasherClothAssignment {
  washerId: string;
  washerName: string;
  assignedClothId: string | null;
  assignedDate: string | null;
  returnDueDate: string | null;
  isOverdue: boolean;
  canIssueNew: boolean;                // false if has unreturned cloth
}

export interface LaundryBatch {
  id: string;
  supervisorId: string;
  clothIds: string[];
  sentDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: "SENT" | "CLEANED" | "RETURNED";
  laundryVendor: string;
}

export interface ClothInventorySummary {
  total: number;
  inStore: number;
  withSupervisors: number;
  withWashers: number;
  inLaundry: number;
  ready: number;
  damaged: number;
  lost: number;
  nearingLifecycleEnd: number;        // >80 washes
}

// ========== SERVICE ==========

class ClothLifecycleService {
  private cloths: Map<string, IndividualCloth> = new Map();
  private transactions: ClothTransaction[] = [];
  private washerAssignments: Map<string, WasherClothAssignment> = new Map();
  private laundryBatches: LaundryBatch[] = [];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample cloths in different states
    const sampleCloths: IndividualCloth[] = [
      // Store inventory
      { clothId: "CLT-001", batchId: "BATCH_A", status: "IN_STORE", condition: "NORMAL", currentWashCount: 0, maxWashCount: 90, currentHolder: "STORE", currentHolderName: "Main Store", lastTransactionDate: "2024-01-15", purchaseDate: "2024-01-15", isActive: true },
      { clothId: "CLT-002", batchId: "BATCH_A", status: "IN_STORE", condition: "NORMAL", currentWashCount: 0, maxWashCount: 90, currentHolder: "STORE", currentHolderName: "Main Store", lastTransactionDate: "2024-01-15", purchaseDate: "2024-01-15", isActive: true },
      // Supervisor buffer
      { clothId: "CLT-003", batchId: "BATCH_B", status: "WITH_SUPERVISOR", condition: "NORMAL", currentWashCount: 12, maxWashCount: 90, currentHolder: "SUP-001", currentHolderName: "Rajesh Kumar", lastTransactionDate: "2024-04-10", purchaseDate: "2024-01-15", isActive: true },
      { clothId: "CLT-004", batchId: "BATCH_B", status: "WITH_SUPERVISOR", condition: "NORMAL", currentWashCount: 15, maxWashCount: 90, currentHolder: "SUP-001", currentHolderName: "Rajesh Kumar", lastTransactionDate: "2024-04-10", purchaseDate: "2024-01-15", isActive: true },
      // With washers
      { clothId: "CLT-005", batchId: "BATCH_C", status: "WITH_WASHER", condition: "NORMAL", currentWashCount: 45, maxWashCount: 90, currentHolder: "W001", currentHolderName: "Suresh Kumar", lastTransactionDate: "2024-04-12", purchaseDate: "2024-01-15", isActive: true },
      { clothId: "CLT-006", batchId: "BATCH_C", status: "WITH_WASHER", condition: "NORMAL", currentWashCount: 32, maxWashCount: 90, currentHolder: "W002", currentHolderName: "Ramesh Patil", lastTransactionDate: "2024-04-12", purchaseDate: "2024-01-15", isActive: true },
      // In laundry
      { clothId: "CLT-007", batchId: "BATCH_D", status: "IN_LAUNDRY", condition: "NORMAL", currentWashCount: 67, maxWashCount: 90, currentHolder: "LAUNDRY", currentHolderName: "CleanPro Laundry", lastTransactionDate: "2024-04-13", purchaseDate: "2024-01-15", isActive: true },
      // Ready (cleaned)
      { clothId: "CLT-008", batchId: "BATCH_A", status: "READY", condition: "NORMAL", currentWashCount: 25, maxWashCount: 90, currentHolder: "SUP-001", currentHolderName: "Rajesh Kumar", lastTransactionDate: "2024-04-13", purchaseDate: "2024-01-15", isActive: true },
      // Damaged
      { clothId: "CLT-009", batchId: "BATCH_B", status: "WITH_SUPERVISOR", condition: "DAMAGED", currentWashCount: 50, maxWashCount: 90, currentHolder: "SUP-001", currentHolderName: "Rajesh Kumar", lastTransactionDate: "2024-04-11", purchaseDate: "2024-01-15", isActive: false },
    ];

    sampleCloths.forEach(cloth => this.cloths.set(cloth.clothId, cloth));

    // Sample washer assignments
    this.washerAssignments.set("W001", {
      washerId: "W001",
      washerName: "Suresh Kumar",
      assignedClothId: "CLT-005",
      assignedDate: "2024-04-12",
      returnDueDate: "2024-04-15",
      isOverdue: false,
      canIssueNew: false
    });

    this.washerAssignments.set("W002", {
      washerId: "W002",
      washerName: "Ramesh Patil",
      assignedClothId: "CLT-006",
      assignedDate: "2024-04-12",
      returnDueDate: "2024-04-15",
      isOverdue: false,
      canIssueNew: false
    });

    this.washerAssignments.set("W003", {
      washerId: "W003",
      washerName: "Amit Singh",
      assignedClothId: null,
      assignedDate: null,
      returnDueDate: null,
      isOverdue: false,
      canIssueNew: true
    });
  }

  // ========== CLOTH QUERIES ==========

  getAllCloths(): IndividualCloth[] {
    return Array.from(this.cloths.values());
  }

  getClothById(clothId: string): IndividualCloth | null {
    return this.cloths.get(clothId) || null;
  }

  getClothsByStatus(status: ClothStatus): IndividualCloth[] {
    return this.getAllCloths().filter(c => c.status === status);
  }

  getClothsByHolder(holderId: string): IndividualCloth[] {
    return this.getAllCloths().filter(c => c.currentHolder === holderId);
  }

  getSupervisorBufferCloths(supervisorId: string): IndividualCloth[] {
    return this.getAllCloths().filter(
      c => c.currentHolder === supervisorId &&
           (c.status === "WITH_SUPERVISOR" || c.status === "READY")
    );
  }

  getInventorySummary(): ClothInventorySummary {
    const cloths = this.getAllCloths();
    return {
      total: cloths.length,
      inStore: cloths.filter(c => c.status === "IN_STORE").length,
      withSupervisors: cloths.filter(c => c.status === "WITH_SUPERVISOR").length,
      withWashers: cloths.filter(c => c.status === "WITH_WASHER").length,
      inLaundry: cloths.filter(c => c.status === "IN_LAUNDRY").length,
      ready: cloths.filter(c => c.status === "READY").length,
      damaged: cloths.filter(c => c.condition === "DAMAGED").length,
      lost: cloths.filter(c => c.condition === "LOST").length,
      nearingLifecycleEnd: cloths.filter(c => c.currentWashCount > 80 && c.isActive).length,
    };
  }

  // ========== STORE → SUPERVISOR ==========

  transferStoreToSupervisor(
    clothIds: string[],
    supervisorId: string,
    supervisorName: string,
    deliveryNote: string
  ): { success: boolean; error?: string } {
    const notInStore = clothIds.filter(id => {
      const cloth = this.cloths.get(id);
      return !cloth || cloth.status !== "IN_STORE";
    });

    if (notInStore.length > 0) {
      return { success: false, error: `Cloths not in store: ${notInStore.join(", ")}` };
    }

    clothIds.forEach(clothId => {
      const cloth = this.cloths.get(clothId)!;
      cloth.status = "WITH_SUPERVISOR";
      cloth.currentHolder = supervisorId;
      cloth.currentHolderName = supervisorName;
      cloth.lastTransactionDate = new Date().toISOString();

      this.transactions.push({
        id: `TXN-${Date.now()}-${clothId}`,
        clothId,
        transactionType: "STORE_TO_SUPERVISOR",
        fromEntity: "STORE",
        toEntity: supervisorId,
        fromName: "Main Store",
        toName: supervisorName,
        transactionDate: new Date().toISOString(),
        condition: cloth.condition,
        washCountAtTransaction: cloth.currentWashCount,
        notes: `Delivery Note: ${deliveryNote}`
      });
    });

    return { success: true };
  }

  // ========== SUPERVISOR → WASHER ==========

  issueClothToWasher(
    supervisorId: string,
    washerId: string,
    washerName: string,
    clothId: string
  ): { success: boolean; error?: string } {
    // Check if washer can receive new cloth
    const assignment = this.washerAssignments.get(washerId);
    if (assignment && !assignment.canIssueNew) {
      return { success: false, error: "Washer must return current cloth before receiving new one" };
    }

    const cloth = this.cloths.get(clothId);
    if (!cloth) {
      return { success: false, error: "Cloth not found" };
    }

    if (cloth.currentHolder !== supervisorId) {
      return { success: false, error: "Cloth not in supervisor's buffer stock" };
    }

    if (cloth.status !== "WITH_SUPERVISOR" && cloth.status !== "READY") {
      return { success: false, error: `Cloth not available for issue (status: ${cloth.status})` };
    }

    // Update cloth
    cloth.status = "WITH_WASHER";
    cloth.currentHolder = washerId;
    cloth.currentHolderName = washerName;
    cloth.lastTransactionDate = new Date().toISOString();

    // Update washer assignment
    const returnDueDate = new Date();
    returnDueDate.setDate(returnDueDate.getDate() + 3); // 3 days to return

    this.washerAssignments.set(washerId, {
      washerId,
      washerName,
      assignedClothId: clothId,
      assignedDate: new Date().toISOString(),
      returnDueDate: returnDueDate.toISOString(),
      isOverdue: false,
      canIssueNew: false
    });

    // Log transaction
    this.transactions.push({
      id: `TXN-${Date.now()}-${clothId}`,
      clothId,
      transactionType: "SUPERVISOR_TO_WASHER",
      fromEntity: supervisorId,
      toEntity: washerId,
      fromName: cloth.currentHolderName || supervisorId,
      toName: washerName,
      transactionDate: new Date().toISOString(),
      condition: cloth.condition,
      washCountAtTransaction: cloth.currentWashCount
    });

    return { success: true };
  }

  // ========== WASHER → SUPERVISOR (RETURN) ==========

  returnClothFromWasher(
    washerId: string,
    clothId: string,
    condition: ClothCondition,
    damageReason?: string,
    photoUrl?: string
  ): { success: boolean; error?: string } {
    const cloth = this.cloths.get(clothId);
    if (!cloth) {
      return { success: false, error: "Cloth not found" };
    }

    if (cloth.currentHolder !== washerId) {
      return { success: false, error: "Cloth not assigned to this washer" };
    }

    const assignment = this.washerAssignments.get(washerId);
    if (!assignment) {
      return { success: false, error: "No assignment record found" };
    }

    const supervisorId = assignment.washerName; // Get from assignment context

    // Update cloth
    cloth.status = "WITH_SUPERVISOR";
    cloth.currentHolder = supervisorId || "SUP-001"; // Fallback
    cloth.currentHolderName = "Supervisor"; // Update with actual supervisor name
    cloth.condition = condition;
    cloth.currentWashCount += 1; // Increment wash count on return
    cloth.lastTransactionDate = new Date().toISOString();

    if (condition === "DAMAGED" || condition === "LOST") {
      cloth.isActive = false;
    }

    // Update washer assignment
    this.washerAssignments.set(washerId, {
      ...assignment,
      assignedClothId: null,
      assignedDate: null,
      returnDueDate: null,
      isOverdue: false,
      canIssueNew: true
    });

    // Log transaction
    this.transactions.push({
      id: `TXN-${Date.now()}-${clothId}`,
      clothId,
      transactionType: "WASHER_RETURN",
      fromEntity: washerId,
      toEntity: supervisorId || "SUP-001",
      fromName: assignment.washerName,
      toName: "Supervisor",
      transactionDate: new Date().toISOString(),
      condition,
      washCountAtTransaction: cloth.currentWashCount,
      damageReason,
      photoUrl
    });

    return { success: true };
  }

  // ========== LAUNDRY FLOW ==========

  sendToLaundry(
    supervisorId: string,
    clothIds: string[],
    laundryVendor: string
  ): { success: boolean; batchId?: string; error?: string } {
    const invalidCloths = clothIds.filter(id => {
      const cloth = this.cloths.get(id);
      return !cloth || cloth.currentHolder !== supervisorId;
    });

    if (invalidCloths.length > 0) {
      return { success: false, error: `Invalid cloths: ${invalidCloths.join(", ")}` };
    }

    clothIds.forEach(clothId => {
      const cloth = this.cloths.get(clothId)!;
      cloth.status = "IN_LAUNDRY";
      cloth.currentHolder = "LAUNDRY";
      cloth.currentHolderName = laundryVendor;
      cloth.lastTransactionDate = new Date().toISOString();

      this.transactions.push({
        id: `TXN-${Date.now()}-${clothId}`,
        clothId,
        transactionType: "SUPERVISOR_TO_LAUNDRY",
        fromEntity: supervisorId,
        toEntity: "LAUNDRY",
        fromName: "Supervisor",
        toName: laundryVendor,
        transactionDate: new Date().toISOString(),
        condition: cloth.condition,
        washCountAtTransaction: cloth.currentWashCount
      });
    });

    const expectedReturnDate = new Date();
    expectedReturnDate.setDate(expectedReturnDate.getDate() + 2);

    const batch: LaundryBatch = {
      id: `LAUNDRY-${Date.now()}`,
      supervisorId,
      clothIds,
      sentDate: new Date().toISOString(),
      expectedReturnDate: expectedReturnDate.toISOString(),
      actualReturnDate: null,
      status: "SENT",
      laundryVendor
    };

    this.laundryBatches.push(batch);

    return { success: true, batchId: batch.id };
  }

  receiveLaundryReturn(
    batchId: string,
    supervisorId: string
  ): { success: boolean; error?: string } {
    const batch = this.laundryBatches.find(b => b.id === batchId);
    if (!batch) {
      return { success: false, error: "Laundry batch not found" };
    }

    batch.status = "RETURNED";
    batch.actualReturnDate = new Date().toISOString();

    batch.clothIds.forEach(clothId => {
      const cloth = this.cloths.get(clothId);
      if (cloth) {
        cloth.status = "READY";
        cloth.currentHolder = supervisorId;
        cloth.currentHolderName = "Supervisor";
        cloth.lastTransactionDate = new Date().toISOString();

        this.transactions.push({
          id: `TXN-${Date.now()}-${clothId}`,
          clothId,
          transactionType: "LAUNDRY_RETURN",
          fromEntity: "LAUNDRY",
          toEntity: supervisorId,
          fromName: batch.laundryVendor,
          toName: "Supervisor",
          transactionDate: new Date().toISOString(),
          condition: cloth.condition,
          washCountAtTransaction: cloth.currentWashCount
        });
      }
    });

    return { success: true };
  }

  getLaundryBatches(supervisorId: string): LaundryBatch[] {
    return this.laundryBatches.filter(b => b.supervisorId === supervisorId);
  }

  // ========== WASHER QUERIES ==========

  getWasherAssignment(washerId: string): WasherClothAssignment | null {
    return this.washerAssignments.get(washerId) || null;
  }

  getAllWasherAssignments(): WasherClothAssignment[] {
    return Array.from(this.washerAssignments.values());
  }

  // ========== TRANSACTION HISTORY ==========

  getClothTransactions(clothId: string): ClothTransaction[] {
    return this.transactions.filter(t => t.clothId === clothId);
  }

  getAllTransactions(): ClothTransaction[] {
    return this.transactions;
  }

  getTransactionsByEntity(entityId: string): ClothTransaction[] {
    return this.transactions.filter(
      t => t.fromEntity === entityId || t.toEntity === entityId
    );
  }
}

// Singleton instance
export const clothLifecycleService = new ClothLifecycleService();
