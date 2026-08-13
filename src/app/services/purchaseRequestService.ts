/**
 * purchaseRequestService — the one real "Store/Supervisor wants to
 * restock from a vendor" pipeline.
 *
 * Previously this exact concept (raise a request → someone approves it
 * → a draft Purchase Order is created for Procurement to work) was
 * built three separate times, disconnectedly: inline in
 * MaterialRequisition.tsx (real, working), StoreRequisitions.tsx (its
 * own separate localStorage key, hardcoded requester/approver names),
 * and procurement/MaterialRequisitions.tsx (its own separate key, mock
 * inventory items, an approval action that never actually persisted
 * anything). This service is now the single real source all three
 * screens read and write through, backed by the same
 * cleancar_purchase_requests / cleancar_purchase_orders keys the
 * working implementation already used.
 */
import type { PurchaseRequest } from "../lib/materialRequisition";

const PR_KEY = "cleancar_purchase_requests";
const PO_KEY = "cleancar_purchase_orders";

function loadPRs(): PurchaseRequest[] {
  try {
    return JSON.parse(localStorage.getItem(PR_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePRs(prs: PurchaseRequest[]): void {
  try {
    localStorage.setItem(PR_KEY, JSON.stringify(prs));
  } catch {
    /* quota guard */
  }
}

export interface CreatePurchaseRequestInput {
  requestedBy: string;
  priority: "High" | "Medium" | "Low";
  items: PurchaseRequest["items"];
  remarks?: string;
}

class PurchaseRequestService {
  getAll(): PurchaseRequest[] {
    return loadPRs();
  }

  getById(id: string): PurchaseRequest | undefined {
    return loadPRs().find((r) => r.id === id);
  }

  create(input: CreatePurchaseRequestInput): PurchaseRequest {
    if (!input.items.length) {
      throw new Error("A purchase request needs at least one item");
    }
    const all = loadPRs();
    const newPR: PurchaseRequest = {
      id: `PR-${new Date().getFullYear()}-${String(all.length + 1).padStart(3, "0")}-${Date.now().toString().slice(-4)}`,
      requestedBy: input.requestedBy,
      dateRequested: new Date().toISOString().split("T")[0],
      priority: input.priority,
      status: "Pending",
      items: input.items,
      totalEstimatedCost: input.items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0),
      remarks: input.remarks,
    };
    savePRs([newPR, ...all]);
    return newPR;
  }

  /**
   * Approves a pending request and genuinely creates a draft Purchase
   * Order in the same real system Procurement and GRN already read
   * from — not a separate, disconnected record. Pricing starts at the
   * request's own estimated cost; Procurement fills in real vendor
   * rates from there, same as every other draft PO in this app.
   */
  approveAndIssuePO(id: string, approvedBy: string): { pr: PurchaseRequest; poNumber: string } | null {
    const all = loadPRs();
    const pr = all.find((r) => r.id === id);
    if (!pr || pr.status !== "Pending") return null;

    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    let existingPOs: any[] = [];
    try {
      existingPOs = JSON.parse(localStorage.getItem(PO_KEY) || "[]");
    } catch {
      existingPOs = [];
    }
    const newPO = {
      id: Date.now(),
      po: poNumber,
      mrRef: pr.id,
      vendor: pr.items[0]?.vendorSuggestion || "Multiple Vendors",
      items: pr.items.length,
      amount: pr.totalEstimatedCost,
      status: "Pending Procurement Review",
      date: new Date().toISOString().split("T")[0],
    };
    try {
      localStorage.setItem(PO_KEY, JSON.stringify([...existingPOs, newPO]));
    } catch {
      /* quota guard */
    }

    const updated = all.map((r) =>
      r.id === id
        ? { ...r, status: "PO Issued" as const, approvedByAdmin: approvedBy, poNumber, poIssuedOn: new Date().toISOString().split("T")[0] }
        : r
    );
    savePRs(updated);
    return { pr: updated.find((r) => r.id === id)!, poNumber };
  }

  reject(id: string, rejectedBy: string, reason: string): PurchaseRequest | null {
    const all = loadPRs();
    if (!all.some((r) => r.id === id)) return null;
    const updated = all.map((r) =>
      r.id === id ? { ...r, status: "Rejected" as const, approvedByAdmin: rejectedBy, remarks: reason } : r
    );
    savePRs(updated);
    return updated.find((r) => r.id === id)!;
  }
}

export const purchaseRequestService = new PurchaseRequestService();
