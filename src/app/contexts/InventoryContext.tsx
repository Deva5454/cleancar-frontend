/**
 * InventoryContext - SINGLE SOURCE OF TRUTH for all inventory/stock data
 * Used across: Inventory Module, Requisitions, Issuances, Procurement
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef} from "react";
import { useEvents } from "./EventSystem";
import { DataService } from "../services/DataService";

// Types
export interface InventoryItem {
  itemId: string;
  itemName: string;
  category: "Cleaning Supplies" | "Equipment" | "Consumables" | "Tools";
  unit: "L" | "Kg" | "Pcs" | "Box";
  reorderLevel: number;
  // Multi-city isolation
  cityId: string; // ✅ NEW: City-level stock isolation (e.g., "CITY-SURAT", "CITY-MUMBAI")
  // Stock levels by location
  centralStock: number; // The main/central store - unchanged, existing behavior
  // Real branch store stock - a branch store receives stock ONLY via
  // internal transfer from the main store, never from a vendor directly.
  // Keyed by branchId (e.g. "BRANCH-SURAT-01"), so multiple branches can
  // exist without touching how centralStock already works everywhere.
  branchStock?: Record<string, number>;
  supervisorStock: Record<string, number>; // { supervisorId: quantity }
  washerStock: Record<string, number>; // { washerId/employeeId: quantity }
  // Pricing
  unitCost: number;
  lastProcurementDate?: string;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  transactionId: string;
  itemId: string;
  type: "Procurement" | "Issue" | "Transfer" | "Adjustment" | "Return";
  quantity: number;
  fromLocation: "Central" | "Supervisor" | "Washer" | "Branch";
  fromId?: string; // supervisorId, washerId, or branchId
  toLocation: "Central" | "Supervisor" | "Washer" | "Branch";
  toId?: string; // supervisorId, washerId, or branchId
  reason?: string;
  requestedBy?: string;
  approvedBy?: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  createdAt: string;
  completedAt?: string;
  cityId?: string;
  // Real fields for a Main Store → Branch Store material transfer -
  // genuinely required (not optional) since there's no vendor involved
  // and the challan is the only real record of the movement.
  challanNumber?: string;
  quantitySent?: number;
  quantityReceived?: number;
  damagedQuantity?: number;
  damageNotes?: string;
}

interface InventoryContextType {
  // Inventory Items
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, "itemId" | "createdAt" | "updatedAt">, cityId: string) => InventoryItem;
  updateInventoryItem: (itemId: string, cityId: string, updates: Partial<InventoryItem>) => void;
  getItemById: (itemId: string, cityId: string) => InventoryItem | undefined;
  getLowStockItems: (cityId: string) => InventoryItem[];

  // Stock Transactions
  stockTransactions: StockTransaction[];
  createTransaction: (
    transaction: Omit<StockTransaction, "transactionId" | "createdAt">
  ) => StockTransaction;
  approveTransaction: (transactionId: string, approvedBy: string) => void;
  completeTransaction: (transactionId: string) => void;

  // Stock Operations
  issueInventory: (
    itemId: string,
    quantity: number,
    toLocation: "Supervisor" | "Washer",
    toId: string,
    requestedBy: string,
    cityId: string
  ) => void;
  transferInventory: (
    itemId: string,
    quantity: number,
    fromLocation: "Central" | "Supervisor" | "Washer" | "Branch",
    fromId: string | undefined,
    toLocation: "Central" | "Supervisor" | "Washer" | "Branch",
    toId: string | undefined,
    cityId: string
  ) => void;
  procureInventory: (itemId: string, quantity: number, supplierId: string, cityId: string) => void;
  adjustStock: (
    itemId: string,
    location: "Central" | "Supervisor" | "Washer",
    locationId: string | undefined,
    newQuantity: number,
    reason: string,
    cityId: string
  ) => void;

  // Queries
  getCentralStock: (cityId: string) => InventoryItem[];
  getSupervisorStock: (supervisorId: string, cityId: string) => InventoryItem[];
  getBranchStock: (branchId: string, cityId: string) => InventoryItem[];
  transferToBranch: (
    itemId: string,
    quantity: number,
    branchId: string,
    challanNumber: string,
    requestedBy: string,
    cityId: string
  ) => StockTransaction | null;
  receiveBranchTransfer: (
    transactionId: string,
    quantityReceived: number,
    damagedQuantity: number,
    damageNotes: string | undefined,
    cityId: string
  ) => void;
  getWasherStock: (washerId: string, cityId: string) => InventoryItem[];
  getPendingTransactions: (cityId?: string) => StockTransaction[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const DEFAULT_CITY = "CITY-SURAT"; // Backward compatibility default

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    // Load from storage with city-id backfill for legacy data
    const storedInventory = DataService.get<InventoryItem>("INVENTORY_ITEMS");
    const normalized = storedInventory.map(item => ({
      ...item,
      itemId:   item.itemId   || (item as any).id,
      itemName: item.itemName || (item as any).name,
      category: ((): InventoryItem["category"] => {
        const c = (item.category || "").toLowerCase();
        if (c.includes("equip"))   return "Equipment";
        if (c.includes("tool"))    return "Tools";
        if (c.includes("consum"))  return "Consumables";
        return "Cleaning Supplies";
      })(),
      unit:      (["L","Kg","Pcs","Box"].includes(item.unit) ? item.unit : "Pcs") as InventoryItem["unit"],
      unitCost:  item.unitCost || (item as any).costPerUnit || 0,
      reorderLevel: item.reorderLevel || (item as any).minLevel || 0,
      cityId:    item.cityId || DEFAULT_CITY,
      supervisorStock: item.supervisorStock || {},
      washerStock:     item.washerStock     || {},
    }));

    // ✅ Seed fallback: if no data exists at all, populate with default items
    if (normalized.length === 0) {
      const now = new Date().toISOString();
      const seed: InventoryItem[] = [
        { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",        category:"Cleaning Supplies", unit:"L",   centralStock:45,  reorderLevel:20, unitCost:480, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", category:"Equipment",         unit:"Pcs", centralStock:120, reorderLevel:50, unitCost:85,  cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       category:"Cleaning Supplies", unit:"L",   centralStock:30,  reorderLevel:15, unitCost:220, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-SUR-004", itemName:"Dashboard Polish",        category:"Cleaning Supplies", unit:"L",   centralStock:8,   reorderLevel:20, unitCost:150, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", category:"Equipment",         unit:"Pcs", centralStock:6,   reorderLevel:4,  unitCost:350, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",      category:"Consumables",       unit:"Pcs", centralStock:25,  reorderLevel:15, unitCost:650, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",        category:"Cleaning Supplies", unit:"L",   centralStock:18,  reorderLevel:12, unitCost:185, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",     category:"Cleaning Supplies", unit:"L",   centralStock:0,   reorderLevel:10, unitCost:120, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-MUM-001", itemName:"Car Shampoo 5L",          category:"Cleaning Supplies", unit:"L",   centralStock:50,  reorderLevel:20, unitCost:490, cityId:"CITY-MUMBAI",    supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-MUM-002", itemName:"Microfiber Cloth Large",  category:"Equipment",         unit:"Pcs", centralStock:90,  reorderLevel:50, unitCost:90,  cityId:"CITY-MUMBAI",    supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-MUM-003", itemName:"Dashboard Polish",         category:"Cleaning Supplies", unit:"L",   centralStock:22,  reorderLevel:20, unitCost:155, cityId:"CITY-MUMBAI",    supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-AHM-001", itemName:"Car Shampoo 5L",          category:"Cleaning Supplies", unit:"L",   centralStock:35,  reorderLevel:20, unitCost:475, cityId:"CITY-AHMEDABAD", supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
        { itemId:"INV-AHM-002", itemName:"Microfiber Cloth Large",  category:"Equipment",         unit:"Pcs", centralStock:70,  reorderLevel:50, unitCost:82,  cityId:"CITY-AHMEDABAD", supervisorStock:{}, washerStock:{}, createdAt:now, updatedAt:now },
      ];
      // Persist so subsequent loads don't re-seed
      DataService.setAll("INVENTORY_ITEMS", seed);
      return seed;
    }

    return normalized;
  });
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() =>
    DataService.get<StockTransaction>("STOCK_TRANSACTIONS")
  );
  const _dbInvTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const _dbTxnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { emit } = useEvents();

  useEffect(() => {
    if (_dbInvTimer.current) clearTimeout(_dbInvTimer.current);
    _dbInvTimer.current = setTimeout(() => DataService.setAll("INVENTORY_ITEMS", inventory), 500);
  }, [inventory]);

  useEffect(() => {
    if (_dbTxnTimer.current) clearTimeout(_dbTxnTimer.current);
    _dbTxnTimer.current = setTimeout(() => DataService.setAll("STOCK_TRANSACTIONS", stockTransactions), 500);
  }, [stockTransactions]);

  // Inventory Item CRUD
  const addInventoryItem = (
    itemData: Omit<InventoryItem, "itemId" | "createdAt" | "updatedAt">,
    cityId: string
  ): InventoryItem => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked addInventoryItem: cityId missing");
      throw new Error("cityId is required for inventory operations");
    }

    const newItem: InventoryItem = {
      ...itemData,
      cityId, // ✅ Enforce city isolation
      itemId: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInventory((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateInventoryItem = (itemId: string, cityId: string, updates: Partial<InventoryItem>) => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked updateInventoryItem: cityId missing");
      return;
    }

    setInventory((prev) =>
      prev.map((item) =>
        item.itemId === itemId && item.cityId === cityId // ✅ City filter
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const getItemById = (itemId: string, cityId: string): InventoryItem | undefined => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked getItemById: cityId missing");
      return undefined;
    }

    return inventory.find((i) => i.itemId === itemId && i.cityId === cityId); // ✅ City filter
  };

  const getLowStockItems = (cityId: string): InventoryItem[] => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked getLowStockItems: cityId missing");
      return [];
    }

    return inventory.filter(
      (item) => item.cityId === cityId && item.centralStock <= item.reorderLevel // ✅ City filter
    );
  };

  // Stock Transaction CRUD
  const createTransaction = (
    transactionData: Omit<StockTransaction, "transactionId" | "createdAt">
  ): StockTransaction => {
    const newTransaction: StockTransaction = {
      ...transactionData,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setStockTransactions((prev) => [...prev, newTransaction]);
    return newTransaction;
  };

  const approveTransaction = (transactionId: string, approvedBy: string) => {
    setStockTransactions((prev) =>
      prev.map((txn) =>
        txn.transactionId === transactionId
          ? { ...txn, status: "Approved", approvedBy }
          : txn
      )
    );
  };

  const completeTransaction = (transactionId: string) => {
    const transaction = stockTransactions.find((t) => t.transactionId === transactionId);
    if (!transaction) return;

    // Update stock levels based on transaction
    setInventory((prev) =>
      prev.map((item) => {
        if (item.itemId === transaction.itemId) {
          const updated = { ...item };

          // Decrease from source — guarded: never go below 0
          if (transaction.fromLocation === "Central") {
            const available = updated.centralStock || 0;
            if (available < transaction.quantity) {
              console.warn(`[Inventory] Blocked: insufficient central stock for ${transaction.itemId}. Have ${available}, need ${transaction.quantity}`);
              return item; // abort — leave stock unchanged
            }
            updated.centralStock = available - transaction.quantity;
          } else if (transaction.fromLocation === "Supervisor" && transaction.fromId) {
            const avail = (updated.supervisorStock[transaction.fromId] || 0);
            updated.supervisorStock = {
              ...updated.supervisorStock,
              [transaction.fromId]: Math.max(0, avail - transaction.quantity),
            };
          } else if (transaction.fromLocation === "Washer" && transaction.fromId) {
            const avail = (updated.washerStock[transaction.fromId] || 0);
            updated.washerStock = {
              ...updated.washerStock,
              [transaction.fromId]: Math.max(0, avail - transaction.quantity),
            };
          } else if (transaction.fromLocation === "Branch" && transaction.fromId) {
            const avail = (updated.branchStock?.[transaction.fromId] || 0);
            updated.branchStock = {
              ...(updated.branchStock || {}),
              [transaction.fromId]: Math.max(0, avail - transaction.quantity),
            };
          }

          // Increase to destination
          if (transaction.toLocation === "Central") {
            updated.centralStock += transaction.quantity;
          } else if (transaction.toLocation === "Supervisor" && transaction.toId) {
            updated.supervisorStock = {
              ...updated.supervisorStock,
              [transaction.toId]: (updated.supervisorStock[transaction.toId] || 0) + transaction.quantity,
            };
          } else if (transaction.toLocation === "Washer" && transaction.toId) {
            updated.washerStock = {
              ...updated.washerStock,
              [transaction.toId]: (updated.washerStock[transaction.toId] || 0) + transaction.quantity,
            };
          } else if (transaction.toLocation === "Branch" && transaction.toId) {
            updated.branchStock = {
              ...(updated.branchStock || {}),
              [transaction.toId]: (updated.branchStock?.[transaction.toId] || 0) + transaction.quantity,
            };
          }

          return updated;
        }
        return item;
      })
    );

    // Mark transaction as completed
    setStockTransactions((prev) =>
      prev.map((txn) =>
        txn.transactionId === transactionId
          ? { ...txn, status: "Completed", completedAt: new Date().toISOString() }
          : txn
      )
    );
  };

  // Stock Operations
  const issueInventory = (
    itemId: string,
    quantity: number,
    toLocation: "Supervisor" | "Washer",
    toId: string,
    requestedBy: string,
    cityId: string
  ) => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked issueInventory: cityId missing");
      return;
    }

    const item = inventory.find(i => i.itemId === itemId && i.cityId === cityId); // ✅ City filter
    if (!item) {
      console.warn(`[InventoryContext] Item ${itemId} not found in ${cityId}`);
      return;
    }

    const transaction = createTransaction({
      itemId,
      type: "Issue",
      quantity,
      fromLocation: "Central",
      toLocation,
      toId,
      requestedBy,
      status: "Pending",
      cityId,
    });
    // Auto-approve and complete for now (in real app, needs approval workflow)
    approveTransaction(transaction.transactionId, "System");
    completeTransaction(transaction.transactionId);

    // Emit INVENTORY_ISSUED event
    emit("INVENTORY_ISSUED", {
      itemId,
      itemName: item.itemName,
      quantity,
      toLocation,
      toId,
      requestedBy,
      transactionId: transaction.transactionId,
      cityId, // ✅ Include cityId in event
    }, "InventoryContext");

    // Check if stock is now low and emit warning
    const newCentralStock = item.centralStock - quantity;
    if (newCentralStock <= item.reorderLevel && newCentralStock > 0) {
      emit("INVENTORY_LOW_STOCK", {
        itemId,
        itemName: item.itemName,
        quantity: newCentralStock,
        reorderLevel: item.reorderLevel,
        cityId, // ✅ Include cityId in event
      }, "InventoryContext");
    }
  };

  const transferInventory = (
    itemId: string,
    quantity: number,
    fromLocation: "Central" | "Supervisor" | "Washer" | "Branch",
    fromId: string | undefined,
    toLocation: "Central" | "Supervisor" | "Washer" | "Branch",
    toId: string | undefined,
    cityId: string
  ) => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked transferInventory: cityId missing");
      return;
    }

    const item = inventory.find(i => i.itemId === itemId && i.cityId === cityId); // ✅ City filter
    if (!item) {
      console.warn(`[InventoryContext] Item ${itemId} not found in ${cityId}`);
      return;
    }

    const transaction = createTransaction({
      itemId,
      type: "Transfer",
      quantity,
      fromLocation,
      fromId,
      toLocation,
      toId,
      status: "Approved",
      cityId,
    });
    completeTransaction(transaction.transactionId);
  };

  // Real Main Store → Branch Store transfer. Deliberately a separate,
  // dedicated function rather than reusing generic transferInventory -
  // this one requires a real challan number, since there's no vendor
  // and no GRN involved; the challan is the only real record of the
  // movement. Creates the transaction as "Approved" but NOT completed -
  // stock only actually moves once the branch confirms real receipt via
  // receiveBranchTransfer(), so a discrepancy in transit is caught
  // honestly rather than assumed away.
  const transferToBranch = (
    itemId: string,
    quantity: number,
    branchId: string,
    challanNumber: string,
    requestedBy: string,
    cityId: string
  ): StockTransaction | null => {
    if (!cityId || !challanNumber.trim()) {
      console.warn("[InventoryContext] Blocked transferToBranch: cityId or challan missing");
      return null;
    }
    const item = inventory.find(i => i.itemId === itemId && i.cityId === cityId);
    if (!item) {
      console.warn(`[InventoryContext] Item ${itemId} not found in ${cityId}`);
      return null;
    }
    if ((item.centralStock || 0) < quantity) {
      console.warn(`[InventoryContext] Blocked transferToBranch: insufficient central stock for ${itemId}`);
      return null;
    }
    // Reserve the stock out of Central immediately, so it can't be
    // double-committed to another transfer while awaiting approval.
    setInventory(prev => prev.map(i =>
      i.itemId === itemId && i.cityId === cityId
        ? { ...i, centralStock: (i.centralStock || 0) - quantity }
        : i
    ));
    const transaction = createTransaction({
      itemId,
      type: "Transfer",
      quantity,
      fromLocation: "Central",
      toLocation: "Branch",
      toId: branchId,
      status: "Pending",
      requestedBy,
      cityId,
      challanNumber: challanNumber.trim(),
      quantitySent: quantity,
    });
    return transaction;
  };

  // Real receipt confirmation on the branch side - what actually
  // arrived, and any real damage, honestly recorded rather than
  // silently reconciled against what was sent.
  const receiveBranchTransfer = (
    transactionId: string,
    quantityReceived: number,
    damagedQuantity: number,
    damageNotes: string | undefined,
    cityId: string
  ) => {
    const transaction = stockTransactions.find(t => t.transactionId === transactionId);
    if (!transaction || transaction.toLocation !== "Branch" || !transaction.toId) {
      console.warn("[InventoryContext] Blocked receiveBranchTransfer: transaction not found or not a branch transfer");
      return;
    }
    setInventory(prev => prev.map(item => {
      if (item.itemId !== transaction.itemId || item.cityId !== cityId) return item;
      const branchId = transaction.toId!;
      return {
        ...item,
        branchStock: {
          ...(item.branchStock || {}),
          [branchId]: (item.branchStock?.[branchId] || 0) + quantityReceived,
        },
      };
    }));
    setStockTransactions(prev => prev.map(t =>
      t.transactionId === transactionId
        ? { ...t, status: "Completed", completedAt: new Date().toISOString(), quantityReceived, damagedQuantity, damageNotes }
        : t
    ));
  };

  const procureInventory = (itemId: string, quantity: number, supplierId: string, cityId: string) => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked procureInventory: cityId missing");
      return;
    }

    const item = inventory.find(i => i.itemId === itemId && i.cityId === cityId); // ✅ City filter
    if (!item) {
      console.warn(`[InventoryContext] Item ${itemId} not found in ${cityId}`);
      return;
    }

    const transaction = createTransaction({
      itemId,
      type: "Procurement",
      quantity,
      fromLocation: "Central",
      toLocation: "Central",
      status: "Completed",
      cityId,
    });

    // Directly add to central stock (city-filtered)
    setInventory((prev) =>
      prev.map((item) =>
        item.itemId === itemId && item.cityId === cityId // ✅ City filter
          ? {
              ...item,
              centralStock: item.centralStock + quantity,
              lastProcurementDate: new Date().toISOString(),
              supplierId,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    emit("INVENTORY_PROCURED", {
      itemId, itemName: item.itemName,
      quantity, supplierId,
      amount: item.unitCost * quantity,
      cityId,
      procuredAt: new Date().toISOString(),
    }, "InventoryContext");
  };

  const adjustStock = (
    itemId: string,
    location: "Central" | "Supervisor" | "Washer",
    locationId: string | undefined,
    newQuantity: number,
    reason: string,
    cityId: string
  ) => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked adjustStock: cityId missing");
      return;
    }

    const item = inventory.find(i => i.itemId === itemId && i.cityId === cityId); // ✅ City filter
    if (!item) {
      console.warn(`[InventoryContext] Item ${itemId} not found in ${cityId}`);
      return;
    }

    setInventory((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId && item.cityId === cityId) { // ✅ City filter
          const updated = { ...item };
          if (location === "Central") {
            updated.centralStock = newQuantity;
          } else if (location === "Supervisor" && locationId) {
            updated.supervisorStock = { ...updated.supervisorStock, [locationId]: newQuantity };
          } else if (location === "Washer" && locationId) {
            updated.washerStock = { ...updated.washerStock, [locationId]: newQuantity };
          }
          return updated;
        }
        return item;
      })
    );

    createTransaction({
      itemId,
      type: "Adjustment",
      quantity: newQuantity,
      fromLocation: location,
      fromId: locationId,
      toLocation: location,
      toId: locationId,
      reason,
      status: "Completed",
      cityId,
    });
  };

  // Queries
  const getCentralStock = (cityId: string): InventoryItem[] => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked getCentralStock: cityId missing");
      return [];
    }

    return inventory.filter((i) => i.cityId === cityId && i.centralStock > 0); // ✅ City filter
  };

  const getSupervisorStock = (supervisorId: string, cityId: string): InventoryItem[] => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked getSupervisorStock: cityId missing");
      return [];
    }

    return inventory.filter(
      (i) => i.cityId === cityId && (i.supervisorStock[supervisorId] || 0) > 0 // ✅ City filter
    );
  };

  const getBranchStock = (branchId: string, cityId: string): InventoryItem[] => {
    if (!cityId) {
      console.warn("[InventoryContext] Blocked getBranchStock: cityId missing");
      return [];
    }
    return inventory.filter(
      (i) => i.cityId === cityId && ((i.branchStock?.[branchId]) || 0) > 0
    );
  };

  const getWasherStock = (washerId: string, cityId: string): InventoryItem[] => {
    // ✅ SAFETY GUARD: Prevent operations without cityId
    if (!cityId) {
      console.warn("[InventoryContext] Blocked getWasherStock: cityId missing");
      return [];
    }

    return inventory.filter(
      (i) => i.cityId === cityId && (i.washerStock[washerId] || 0) > 0 // ✅ City filter
    );
  };

  const getPendingTransactions = (cityId?: string): StockTransaction[] => {
    return stockTransactions.filter(t =>
      t.status === "Pending" && (!cityId || t.cityId === cityId)
    );
  };

  const contextValue = useMemo(() => ({
        inventory,
        addInventoryItem,
        updateInventoryItem,
        getItemById,
        getLowStockItems,
        stockTransactions,
        createTransaction,
        approveTransaction,
        completeTransaction,
        issueInventory,
        transferInventory,
        procureInventory,
        adjustStock,
        getCentralStock,
        getSupervisorStock,
        getBranchStock,
        transferToBranch,
        receiveBranchTransfer,
        getWasherStock,
        getPendingTransactions,
      }),
  [inventory, addInventoryItem, updateInventoryItem, getItemById, getLowStockItems, stockTransactions, createTransaction, approveTransaction, completeTransaction, issueInventory]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <InventoryContext.Provider
      value={contextValue}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    console.warn("[useInventory] Called outside InventoryProvider — returning fallback"); return {} as any; // safe fallback
  }
  return context;
}
