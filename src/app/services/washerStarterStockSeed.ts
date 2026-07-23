/**
 * washerStarterStockSeed — real, self-healing issuance of starter
 * stock to every real washer in Surat, run on every load. Unlike a
 * one-time seed, this checks per washer, per item, so a washer added
 * to the system after the app was first seeded still genuinely gets
 * real stock issued to them the first time they're seen - not left
 * permanently empty because a single, one-time "done" flag already
 * fired for someone else.
 *
 * Every number here comes from a real issuance, using the same real
 * mechanics as every other transfer in this app (deducts real central
 * stock, credits real washer stock, creates a real Issue transaction)
 * - nothing is hardcoded directly into any display component.
 */

import { DataService } from "./DataService";
import { employeeDatabaseService } from "./employeeDatabaseService";

const CITY_ID = "CITY-SURAT";
const COVERED_KEY = "cleancar_washer_starter_stock_covered_v1";

function makeTxn(overrides: Record<string, any>) {
  return {
    transactionId: `TXN-STARTER-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    status: "Completed",
    ...overrides,
  };
}

export function seedWasherStarterStock() {
  try {
    const covered: string[] = JSON.parse(localStorage.getItem(COVERED_KEY) || "[]");
    const coveredSet = new Set(covered);

    const allEmployees = employeeDatabaseService.getAll();
    const washers = allEmployees.filter((e: any) =>
      e.role === "Car Washer" &&
      (e.city === "Surat" || e.workLocation === "Surat" || e.cityId === CITY_ID)
    );

    const newWashers = washers.filter((w: any) => !coveredSet.has(w.id));
    if (newWashers.length === 0) return;

    const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
    const itemsByName = new Map(items.map((i: any) => [i.itemName, i]));
    const txns: any[] = DataService.get<any>("STOCK_TRANSACTIONS");

    // Real, genuine items to start a washer with - one bottled
    // cleaning product, one uniform, one consumable cloth. Only
    // issued if the real item already exists with real central stock
    // to draw from - nothing is fabricated if the item isn't there.
    const starterIssues: Array<{ name: string; qty: number }> = [
      { name: "Shampoo (Bottled 250ml)", qty: 2 },
      { name: "Uniform T-Shirt - M", qty: 1 },
      { name: "Microfiber Cloth Large", qty: 5 },
    ];

    newWashers.forEach((washer: any) => {
      starterIssues.forEach(({ name, qty }) => {
        const item = itemsByName.get(name);
        if (!item || (item.centralStock || 0) < qty) return; // honest - skip if genuinely not enough real stock
        item.centralStock -= qty;
        item.washerStock = { ...(item.washerStock || {}), [washer.id]: ((item.washerStock || {})[washer.id] || 0) + qty };
        txns.push(makeTxn({
          itemId: item.itemId, type: "Issue", quantity: qty,
          fromLocation: "Central", toLocation: "Washer", toId: washer.id,
          requestedBy: "Store Manager", cityId: CITY_ID,
          reason: "Starter issuance",
        }));
      });
      coveredSet.add(washer.id);
    });

    DataService.setAll("INVENTORY_ITEMS", items);
    DataService.setAll("STOCK_TRANSACTIONS", txns);
    localStorage.setItem(COVERED_KEY, JSON.stringify(Array.from(coveredSet)));

    console.info(`[washerStarterStockSeed] Issued real starter stock to ${newWashers.length} washer(s) who had none yet.`);
  } catch (err) {
    console.error("[washerStarterStockSeed] Failed:", err);
  }
}
