/**
 * Cloth Management Service
 * Handles batch rotation lifecycle with strict compliance
 */

export type BatchStatus = "FRESH" | "IN_USE" | "DUE" | "OVERDUE" | "COLLECTED" | "IN_TRANSIT";
export type BatchCondition = "NORMAL" | "DAMAGED";
export type BatchID = "BATCH_A" | "BATCH_B" | "BATCH_C" | "BATCH_D";

export interface ClothBatch {
  id: string;
  washerId: string;
  washerName: string;
  batchId: BatchID;
  status: BatchStatus;
  issuedDate?: Date;
  collectionDueDate?: Date;
  daysInUse: number;
  isSanitized: boolean;
  condition: BatchCondition;
  clothCount: number;
  isReservedForAbsent: boolean;
}

export interface BatchCollectionRecord {
  id: string;
  washerId: string;
  batchId: BatchID;
  collectedDate: Date;
  condition: BatchCondition;
  clothCount: number;
  collectedBy: string;
}

export interface HODispatchRecord {
  id: string;
  dispatchDate: Date;
  clothCount: number;
  transportMode: string;
  courierDetails?: string;
  status: "IN_TRANSIT" | "DELIVERED";
}

export interface LossDamageReport {
  id: string;
  washerId: string;
  washerName: string;
  clothCount: number;
  reason: string;
  photoUrl?: string;
  reportedDate: Date;
  reportedBy: string;
  isRepeatedLoss: boolean;
}

export interface InventorySummary {
  totalWashers: number;
  validBatches: number;
  dueForCollection: number;
  overdue: number;
  carryStock: number;
  isLowStock: boolean;
}

class ClothManagementService {
  private readonly COLLECTION_DAY = 3; // Day 3 collection
  private readonly LOW_STOCK_THRESHOLD = 3;
  private readonly REPEATED_LOSS_THRESHOLD = 2; // 2+ incidents = pattern

  // ========== BATCH VALIDATION ==========

  getBatchesByWashers(washerIds: string[]): ClothBatch[] {
    // In production: GET /api/supervisor/cloth/batches
    const batches: ClothBatch[] = [];
    const batchIds: BatchID[] = ["BATCH_A", "BATCH_B", "BATCH_C", "BATCH_D"];

    washerIds.forEach((washerId, index) => {
      const daysInUse = Math.floor(Math.random() * 5);
      const issuedDate = new Date(Date.now() - daysInUse * 24 * 60 * 60 * 1000);
      const collectionDueDate = new Date(issuedDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      let status: BatchStatus = "IN_USE";
      if (daysInUse === 0) status = "FRESH";
      else if (daysInUse === 3) status = "DUE";
      else if (daysInUse > 3) status = "OVERDUE";

      // Simulate some missing batches
      const hasBatch = index !== 16; // Last washer missing batch

      if (hasBatch) {
        batches.push({
          id: `CLOTH-${index + 1}`,
          washerId,
          washerName: `Washer ${index + 1}`,
          batchId: batchIds[index % 4],
          status,
          issuedDate,
          collectionDueDate,
          daysInUse,
          isSanitized: true,
          condition: "NORMAL",
          clothCount: 10,
          isReservedForAbsent: false,
        });
      }
    });

    return batches;
  }

  getInventorySummary(batches: ClothBatch[], carryStock: number): InventorySummary {
    return {
      totalWashers: batches.length + 1, // +1 for missing
      validBatches: batches.filter(b => b.status !== "COLLECTED" && b.status !== "IN_TRANSIT").length,
      dueForCollection: batches.filter(b => b.status === "DUE").length,
      overdue: batches.filter(b => b.status === "OVERDUE").length,
      carryStock,
      isLowStock: carryStock < this.LOW_STOCK_THRESHOLD,
    };
  }

  // ========== DAILY VALIDATION (5 AM) ==========

  validateDailyBatches(batches: ClothBatch[], totalWashers: number): {
    missingBatches: number;
    blockedWashers: string[];
  } {
    const validBatches = batches.filter(b => 
      b.status === "FRESH" || b.status === "IN_USE" || b.status === "DUE"
    ).length;

    const missingBatches = totalWashers - validBatches;
    const blockedWashers = batches
      .filter(b => !b.issuedDate || b.status === "COLLECTED" || b.status === "IN_TRANSIT")
      .map(b => b.washerId);

    return { missingBatches, blockedWashers };
  }

  // ========== BATCH COLLECTION (DAY 3) ==========

  collectBatch(
    washerId: string,
    batchId: BatchID,
    condition: BatchCondition,
    supervisorId: string
  ): { success: boolean; error?: string } {
    // Validation
    if (!washerId || !batchId) {
      return { success: false, error: "Washer ID and Batch ID are required" };
    }

    // In production: POST /api/supervisor/cloth/collect
    const record: BatchCollectionRecord = {
      id: `COLLECT-${Date.now()}`,
      washerId,
      batchId,
      collectedDate: new Date(),
      condition,
      clothCount: 10, // Would come from actual batch
      collectedBy: supervisorId,
    };

    console.log("Batch collected:", record);
    console.log(`Status updated: ${washerId} → No active batch`);

    return { success: true };
  }

  // ========== HO DISPATCH ==========

  dispatchToHO(
    clothCount: number,
    transportMode: string,
    courierDetails?: string,
    supervisorId?: string
  ): { success: boolean; dispatchId: string } {
    // In production: POST /api/supervisor/cloth/dispatch
    const dispatch: HODispatchRecord = {
      id: `DISPATCH-${Date.now()}`,
      dispatchDate: new Date(),
      clothCount,
      transportMode,
      courierDetails,
      status: "IN_TRANSIT",
    };

    console.log("Dispatched to HO:", dispatch);
    console.log(`Supervisor: ${supervisorId}`);

    return { success: true, dispatchId: dispatch.id };
  }

  // ========== FRESH BATCH ISSUANCE ==========

  issueBatch(
    washerId: string,
    batchId: BatchID,
    isSanitized: boolean,
    supervisorId: string
  ): { success: boolean; error?: string } {
    // Strict validation: Must be sanitized
    if (!isSanitized) {
      return { success: false, error: "Cannot issue batch without sanitization verification" };
    }

    if (!washerId || !batchId) {
      return { success: false, error: "Washer ID and Batch ID are required" };
    }

    // In production: POST /api/supervisor/cloth/issue
    const newBatch: ClothBatch = {
      id: `CLOTH-${Date.now()}`,
      washerId,
      washerName: "Washer Name", // Would come from lookup
      batchId,
      status: "FRESH",
      issuedDate: new Date(),
      collectionDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      daysInUse: 0,
      isSanitized: true,
      condition: "NORMAL",
      clothCount: 10,
      isReservedForAbsent: false,
    };

    console.log("Batch issued:", newBatch);
    console.log(`Supervisor: ${supervisorId}`);

    return { success: true };
  }

  // ========== ABSENT WASHER HANDLING ==========

  reserveBatchForAbsent(washerId: string): { success: boolean } {
    // In production: PATCH /api/supervisor/cloth/:washerId/reserve
    console.log(`Batch reserved for absent washer: ${washerId}`);
    console.log("Status: Reserved — Not Transferable");
    return { success: true };
  }

  unreserveBatch(washerId: string): { success: boolean } {
    // In production: PATCH /api/supervisor/cloth/:washerId/unreserve
    console.log(`Batch unreserved for returned washer: ${washerId}`);
    return { success: true };
  }

  // ========== LOSS / DAMAGE REPORTING ==========

  reportLossDamage(
    washerId: string,
    washerName: string,
    clothCount: number,
    reason: string,
    photoUrl: string | undefined,
    supervisorId: string,
    previousIncidents: number
  ): { success: boolean; isRepeatedLoss: boolean; replacementIssued: boolean } {
    const isRepeatedLoss = previousIncidents >= this.REPEATED_LOSS_THRESHOLD;

    const report: LossDamageReport = {
      id: `LOSS-${Date.now()}`,
      washerId,
      washerName,
      clothCount,
      reason,
      photoUrl,
      reportedDate: new Date(),
      reportedBy: supervisorId,
      isRepeatedLoss,
    };

    // In production: POST /api/supervisor/cloth/loss-damage
    console.log("Loss/Damage reported:", report);

    if (isRepeatedLoss) {
      console.log("⚠️ REPEATED LOSS PATTERN DETECTED");
      console.log("Escalating to Ops Manager");
    }

    // Auto-issue replacement
    console.log(`Replacement issued: ${clothCount} cloths from carry stock`);

    return { 
      success: true, 
      isRepeatedLoss,
      replacementIssued: true,
    };
  }

  // ========== STOCK REQUEST ==========

  requestStockFromHO(
    batchesNeeded: number,
    urgency: "NORMAL" | "URGENT",
    supervisorId: string
  ): { success: boolean } {
    // In production: POST /api/supervisor/cloth/request-stock
    console.log("Stock request sent to HO");
    console.log({
      batchesNeeded,
      urgency,
      requestedBy: supervisorId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  // ========== BATCH LIFECYCLE TRACKING ==========

  getBatchHistory(washerId: string): BatchCollectionRecord[] {
    // In production: GET /api/supervisor/cloth/:washerId/history
    // Returns all historical collections for traceability
    return [];
  }

  getDispatchHistory(supervisorId: string): HODispatchRecord[] {
    // In production: GET /api/supervisor/cloth/dispatches
    // Returns all HO dispatch records
    return [];
  }

  getLossDamageHistory(washerId: string): LossDamageReport[] {
    // In production: GET /api/supervisor/cloth/:washerId/incidents
    // Returns all loss/damage incidents for pattern detection
    return [];
  }
}

// Singleton instance
export const clothManagementService = new ClothManagementService();
