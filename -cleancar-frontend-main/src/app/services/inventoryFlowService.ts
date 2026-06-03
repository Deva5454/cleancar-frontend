/**
 * Inventory Flow Service
 * FLOW 4: 3-Level Inventory Management (Central → Supervisor → Washer)
 *
 * CRITICAL: Auto-transfer from Central to Supervisor when insufficient stock
 * Maintain full transaction history for audit
 */

import type { InventoryItem, StockTransaction } from "../contexts/InventoryContext";

export interface InventoryIssueRequest {
  itemId: string;
  quantity: number;
  toLocation: "Supervisor" | "Washer";
  toId: string; // supervisorId or washerId
  requestedBy: string;
  reason?: string;
  cityId?: string;
}

export interface InventoryIssueResult {
  success: boolean;
  transaction?: StockTransaction;
  autoTransfer?: StockTransaction; // If auto-transfer from Central happened
  error?: string;
  lowStockAlert?: boolean;
}

export interface StockLevelAlert {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderLevel: number;
  deficit: number;
}

/**
 * FLOW 4: INVENTORY MANAGEMENT (3-LEVEL)
 *
 * Inventory Hierarchy:
 * 1. CentralStore (managed by Store Manager)
 * 2. SupervisorStock (managed by Supervisors)
 * 3. WasherStock (managed by Washers)
 *
 * When supervisor issues items to washer:
 * 1. Check if supervisor has sufficient stock
 * 2. IF insufficient:
 *    - Auto-transfer from CentralStore to SupervisorStock
 *    - Check if Central has enough
 *    - Emit LOW_STOCK alert if needed
 * 3. Issue from supervisor to washer
 * 4. Log both transactions (TRANSFER + ISSUE)
 * 5. Emit INVENTORY_ISSUED event
 *
 * CRITICAL RULES:
 * - CentralStore triggers MOQ alerts when low
 * - StoreManager reads ONLY CentralStore
 * - Maintain full transaction history
 * - Auto-transfer is atomic (both succeed or both fail)
 */
export class InventoryFlowService {
  /**
   * Issue inventory with auto-transfer from Central if needed
   */
  static issueInventory(
    request: InventoryIssueRequest,
    contexts: {
      inventory: InventoryItem[];
      getItemById: (itemId: string, cityId?: string) => InventoryItem | undefined;
      issueInventory: (
        itemId: string,
        quantity: number,
        toLocation: "Supervisor" | "Washer",
        toId: string,
        requestedBy: string,
        cityId?: string
      ) => void;
      transferInventory: (
        itemId: string,
        quantity: number,
        fromLocation: "Central" | "Supervisor" | "Washer",
        fromId: string | undefined,
        toLocation: "Central" | "Supervisor" | "Washer",
        toId: string | undefined
      ) => void;
      stockTransactions: StockTransaction[];
      emit: (event: string, data: any, source?: string) => void;
    }
  ): InventoryIssueResult {
    try {
      const item = contexts.getItemById(request.itemId, request.cityId || "CITY-SURAT");
      if (!item) {
        return {
          success: false,
          error: "Item not found",
        };
      }

      let autoTransferTransaction: StockTransaction | undefined;
      let lowStockAlert = false;

      // FLOW 4: Check if issuing from Supervisor to Washer
      if (request.toLocation === "Washer") {
        // Extract supervisor ID from requestedBy (assuming format: "SUP-xxx")
        const supervisorId = request.requestedBy;
        const supervisorStock = item.supervisorStock[supervisorId] || 0;

        // CRITICAL: Check if supervisor has sufficient stock
        if (supervisorStock < request.quantity) {
          const deficit = request.quantity - supervisorStock;

          console.log(
            `[INVENTORY_ISSUE] Supervisor ${supervisorId} has insufficient stock for ${item.itemName} (has ${supervisorStock}, needs ${request.quantity})`
          );

          // Check if Central has enough for auto-transfer
          if (item.centralStock < deficit) {
            console.error(
              `[INVENTORY_ISSUE] Central stock insufficient. Central has ${item.centralStock}, needs ${deficit}`
            );

            // Emit LOW_STOCK alert
            contexts.emit(
              "LOW_STOCK_ALERT",
              {
                itemId: item.itemId,
                itemName: item.itemName,
                currentStock: item.centralStock,
                reorderLevel: item.reorderLevel,
                deficit: deficit - item.centralStock,
                location: "Central",
              },
              "InventoryFlowService"
            );

            return {
              success: false,
              error: `Insufficient stock. Central: ${item.centralStock}, Supervisor: ${supervisorStock}, Required: ${request.quantity}`,
              lowStockAlert: true,
            };
          }

          // FLOW 4.2: Auto-transfer from Central to Supervisor
          console.log(
            `[INVENTORY_AUTO_TRANSFER] Transferring ${deficit} units of ${item.itemName} from Central to Supervisor ${supervisorId}`
          );

          contexts.transferInventory(
            request.itemId,
            deficit,
            "Central",
            undefined,
            "Supervisor",
            supervisorId
          );

          // Get the auto-transfer transaction (last transaction created)
          autoTransferTransaction = contexts.stockTransactions[contexts.stockTransactions.length - 1];

          // Check if Central stock is now low
          const newCentralStock = item.centralStock - deficit;
          if (newCentralStock <= item.reorderLevel) {
            lowStockAlert = true;
            contexts.emit(
              "LOW_STOCK_ALERT",
              {
                itemId: item.itemId,
                itemName: item.itemName,
                currentStock: newCentralStock,
                reorderLevel: item.reorderLevel,
                deficit: item.reorderLevel - newCentralStock,
                location: "Central",
              },
              "InventoryFlowService"
            );
          }
        }
      }

      // FLOW 4.3: Issue inventory (now supervisor should have enough)
      contexts.issueInventory(
        request.itemId,
        request.quantity,
        request.toLocation,
        request.toId,
        request.requestedBy,
        request.cityId || "CITY-SURAT"
      );

      // Get the issue transaction (last transaction created)
      const issueTransaction = contexts.stockTransactions[contexts.stockTransactions.length - 1];

      console.log(
        `[INVENTORY_ISSUED] ${request.quantity} units of ${item.itemName} issued to ${request.toLocation} ${request.toId}${autoTransferTransaction ? " (with auto-transfer)" : ""}`
      );

      // Emit INVENTORY_ISSUED event
      contexts.emit(
        "INVENTORY_ISSUED",
        {
          itemId: request.itemId,
          itemName: item.itemName,
          quantity: request.quantity,
          fromLocation: request.toLocation === "Washer" ? "Supervisor" : "Central",
          fromId: request.toLocation === "Washer" ? request.requestedBy : undefined,
          toLocation: request.toLocation,
          toId: request.toId,
          autoTransfer: !!autoTransferTransaction,
          autoTransferQuantity: autoTransferTransaction?.quantity,
          transactionId: issueTransaction.transactionId,
        },
        "InventoryFlowService"
      );

      return {
        success: true,
        transaction: issueTransaction,
        autoTransfer: autoTransferTransaction,
        lowStockAlert,
      };
    } catch (error) {
      console.error("[INVENTORY_ISSUE] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Return inventory from washer to supervisor
   */
  static returnInventory(
    itemId: string,
    quantity: number,
    washerId: string,
    supervisorId: string,
    reason: string,
    cityId: string | undefined,
    contexts: {
      transferInventory: (
        itemId: string,
        quantity: number,
        fromLocation: "Central" | "Supervisor" | "Washer",
        fromId: string | undefined,
        toLocation: "Central" | "Supervisor" | "Washer",
        toId: string | undefined
      ) => void;
      getItemById: (itemId: string, cityId?: string) => InventoryItem | undefined;
      emit: (event: string, data: any, source?: string) => void;
    }
  ): { success: boolean; error?: string } {
    try {
      const item = contexts.getItemById(itemId, cityId || "CITY-SURAT");
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      contexts.transferInventory(itemId, quantity, "Washer", washerId, "Supervisor", supervisorId);

      console.log(
        `[INVENTORY_RETURN] ${quantity} units of ${item.itemName} returned from Washer ${washerId} to Supervisor ${supervisorId}. Reason: ${reason}`
      );

      contexts.emit(
        "INVENTORY_RETURNED",
        {
          itemId,
          itemName: item.itemName,
          quantity,
          fromWasherId: washerId,
          toSupervisorId: supervisorId,
          reason,
        },
        "InventoryFlowService"
      );

      return { success: true };
    } catch (error) {
      console.error("[INVENTORY_RETURN] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get low stock alerts for Store Manager
   */
  static getLowStockAlerts(contexts: {
    getLowStockItems: () => InventoryItem[];
  }): StockLevelAlert[] {
    const lowStockItems = contexts.getLowStockItems();

    return lowStockItems.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      currentStock: item.centralStock,
      reorderLevel: item.reorderLevel,
      deficit: item.reorderLevel - item.centralStock,
    }));
  }

  /**
   * Get stock summary for all 3 levels
   */
  static getStockSummary(
    itemId: string,
    cityId: string | undefined,
    contexts: {
      getItemById: (itemId: string, cityId?: string) => InventoryItem | undefined;
    }
  ): {
    itemId: string;
    itemName: string;
    central: number;
    supervisorTotal: number;
    washerTotal: number;
    grandTotal: number;
    supervisorBreakdown: Record<string, number>;
    washerBreakdown: Record<string, number>;
  } | null {
    const item = contexts.getItemById(itemId, cityId || "CITY-SURAT");
    if (!item) return null;

    const supervisorTotal = Object.values(item.supervisorStock).reduce((sum, qty) => sum + qty, 0);
    const washerTotal = Object.values(item.washerStock).reduce((sum, qty) => sum + qty, 0);

    return {
      itemId: item.itemId,
      itemName: item.itemName,
      central: item.centralStock,
      supervisorTotal,
      washerTotal,
      grandTotal: item.centralStock + supervisorTotal + washerTotal,
      supervisorBreakdown: item.supervisorStock,
      washerBreakdown: item.washerStock,
    };
  }

  /**
   * Validate stock levels before issue
   */
  static validateStockAvailability(
    itemId: string,
    quantity: number,
    location: "Central" | "Supervisor" | "Washer",
    locationId: string | undefined,
    cityId: string | undefined,
    contexts: {
      getItemById: (itemId: string, cityId?: string) => InventoryItem | undefined;
    }
  ): {
    available: boolean;
    currentStock: number;
    requested: number;
    deficit?: number;
  } {
    const item = contexts.getItemById(itemId, cityId || "CITY-SURAT");
    if (!item) {
      return {
        available: false,
        currentStock: 0,
        requested: quantity,
        deficit: quantity,
      };
    }

    let currentStock = 0;

    if (location === "Central") {
      currentStock = item.centralStock;
    } else if (location === "Supervisor" && locationId) {
      currentStock = item.supervisorStock[locationId] || 0;
    } else if (location === "Washer" && locationId) {
      currentStock = item.washerStock[locationId] || 0;
    }

    const available = currentStock >= quantity;

    return {
      available,
      currentStock,
      requested: quantity,
      deficit: available ? 0 : quantity - currentStock,
    };
  }
}
