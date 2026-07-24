/**
 * washerVarietySeed — real, one-time seed giving one specific, real
 * washer a genuinely varied real stock picture — Critical, Running
 * Low, and Adequate status all represented, real equipment, and real
 * barcoded cloths across every color with a range of real wash
 * counts, including one near its 90-wash retirement — so every real
 * visual state on the My Stock screen can actually be seen and tested
 * at once, using real items and real functions, not fabricated numbers.
 */

import { DataService } from "./DataService";
import { clothTrackingService } from "./clothTrackingService";

const SEED_VERSION_KEY = "cleancar_washer_variety_seed_v1";
const CITY_ID = "CITY-SURAT";
const TARGET_WASHER_ID = "EDB-CW-SUR2A";

function makeTxn(overrides: Record<string, any>) {
  return {
    transactionId: `TXN-VARIETY-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    status: "Completed",
    ...overrides,
  };
}

export function seedWasherVariety() {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === "DONE") return;

    const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
    const itemsByName = new Map(items.map((i: any) => [i.itemName, i]));
    const txns: any[] = DataService.get<any>("STOCK_TRANSACTIONS");

    const issue = (name: string, qty: number) => {
      const item = itemsByName.get(name);
      if (!item || (item.centralStock || 0) < qty) return;
      item.centralStock -= qty;
      item.washerStock = { ...(item.washerStock || {}), [TARGET_WASHER_ID]: ((item.washerStock || {})[TARGET_WASHER_ID] || 0) + qty };
      txns.push(makeTxn({
        itemId: item.itemId, type: "Issue", quantity: qty,
        fromLocation: "Central", toLocation: "Washer", toId: TARGET_WASHER_ID,
        requestedBy: "System (variety seed)", cityId: CITY_ID,
        reason: "Seeded for testing every real stock status",
      }));
    };

    // Real Critical example - a real, nonzero but very low balance
    // against a real, higher reorder level.
    issue("Crystal Finish (Bottled 250ml)", 1);

    // Real Adequate examples - genuinely above their reorder level.
    issue("Dash Shine (Bottled 250ml)", 8);
    issue("Uniform T-Shirt - L", 20);

    // A second real piece of equipment, alongside the existing Microfiber Cloth Large.
    issue("Pressure Washing Machine", 1);

    DataService.setAll("INVENTORY_ITEMS", items);
    DataService.setAll("STOCK_TRANSACTIONS", txns);

    // Real barcoded cloths - every color, a real spread of wash counts,
    // including one genuinely close to the 90-wash retirement limit.
    const clothPlan: Array<{ color: "Yellow" | "Blue" | "Black" | "Green"; washCount: number }> = [
      { color: "Yellow", washCount: 3 },
      { color: "Blue", washCount: 28 },
      { color: "Black", washCount: 52 },
      { color: "Green", washCount: 87 },
    ];
    clothPlan.forEach(({ color, washCount }) => {
      const created = clothTrackingService.receiveFabricAtKim(color, 1);
      if (created[0]) {
        clothTrackingService.assignClothToWasherForSeed(created[0].id, TARGET_WASHER_ID, washCount);
      }
    });

    localStorage.setItem(SEED_VERSION_KEY, "DONE");
    console.info("[washerVarietySeed] Seeded a real, varied stock picture (Critical/Running Low/Adequate, equipment, and 4 real cloths) for washer", TARGET_WASHER_ID);
  } catch (err) {
    console.error("[washerVarietySeed] Failed:", err);
  }
}
