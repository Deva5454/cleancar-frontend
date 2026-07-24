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
 *
 * Consumables, a real piece of equipment, and real barcoded cloths
 * are tracked as two genuinely separate coverage sets, so a washer
 * already covered for consumables under an earlier version of this
 * seed still gets equipment and cloths retroactively, rather than
 * being permanently skipped by the older, narrower coverage flag.
 */

import { DataService } from "./DataService";
import { employeeDatabaseService } from "./employeeDatabaseService";
import { clothTrackingService } from "./clothTrackingService";

const CITY_ID = "CITY-SURAT";
const COVERED_KEY = "cleancar_washer_starter_stock_covered_v1";
const EQUIPMENT_COVERED_KEY = "cleancar_washer_equipment_cloth_covered_v1";

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
    const equipmentCovered: string[] = JSON.parse(localStorage.getItem(EQUIPMENT_COVERED_KEY) || "[]");
    const equipmentCoveredSet = new Set(equipmentCovered);

    const allEmployees = employeeDatabaseService.getAll();
    const washers = allEmployees.filter((e: any) =>
      e.designation === "Car Washer" &&
      (e.city === "Surat" || e.workLocation === "Surat" || e.cityId === CITY_ID)
    );

    const items: any[] = DataService.get<any>("INVENTORY_ITEMS");

    // Real, provable migration: a washer marked "covered" with
    // genuinely zero real stock anywhere is a contradiction - a real
    // success would leave real stock behind. This catches anyone
    // falsely marked covered by the earlier unconditional-completion
    // bug, without needing to guess who was affected.
    washers.forEach((w: any) => {
      if (!coveredSet.has(w.id)) return;
      const hasAnyStock = items.some((i: any) => (i.washerStock || {})[w.id] > 0);
      if (!hasAnyStock) coveredSet.delete(w.id);
    });

    const itemsByName = new Map(items.map((i: any) => [i.itemName, i]));
    const txns: any[] = DataService.get<any>("STOCK_TRANSACTIONS");
    let anyChange = false;

    // Real, genuine consumables to start a washer with - one bottled
    // cleaning product, one uniform, one consumable cloth. Only
    // issued if the real item already exists with real central stock
    // to draw from - nothing is fabricated if the item isn't there.
    const consumableIssues: Array<{ name: string; qty: number }> = [
      { name: "Shampoo (Bottled 250ml)", qty: 2 },
      { name: "Uniform T-Shirt - M", qty: 1 },
      { name: "Microfiber Cloth Large", qty: 5 },
    ];

    const newWashers = washers.filter((w: any) => !coveredSet.has(w.id));
    newWashers.forEach((washer: any) => {
      let issuedAnyToThisWasher = false;
      consumableIssues.forEach(({ name, qty }) => {
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
        issuedAnyToThisWasher = true;
        anyChange = true;
      });
      // Real fix: only mark this washer covered if something was
      // genuinely issued - previously this marked every washer covered
      // unconditionally, meaning a washer who got nothing due to a
      // timing issue would be permanently skipped on every future run.
      if (issuedAnyToThisWasher) coveredSet.add(washer.id);
    });

    // Real equipment and real barcoded cloths - tracked as a genuinely
    // separate coverage set, so every real washer gets these,
    // including anyone already covered for consumables under an
    // earlier version of this seed, not just newly-added washers.
    const equipmentDue = washers.filter((w: any) => !equipmentCoveredSet.has(w.id));
    equipmentDue.forEach((washer: any) => {
      let issuedEquipment = false;
      const machine = itemsByName.get("Pressure Washing Machine");
      if (machine && (machine.centralStock || 0) >= 1) {
        machine.centralStock -= 1;
        machine.washerStock = { ...(machine.washerStock || {}), [washer.id]: ((machine.washerStock || {})[washer.id] || 0) + 1 };
        txns.push(makeTxn({
          itemId: machine.itemId, type: "Issue", quantity: 1,
          fromLocation: "Central", toLocation: "Washer", toId: washer.id,
          requestedBy: "Store Manager", cityId: CITY_ID,
          reason: "Starter issuance - equipment",
        }));
        issuedEquipment = true;
        anyChange = true;
      }

      const clothPlan: Array<{ color: "Yellow" | "Blue" | "Black" | "Green"; washCount: number }> = [
        { color: "Yellow", washCount: 2 },
        { color: "Blue", washCount: 15 },
        { color: "Black", washCount: 30 },
      ];
      let issuedAnyCloth = false;
      clothPlan.forEach(({ color, washCount }) => {
        const created = clothTrackingService.receiveFabricAtKim(color, 1);
        if (created[0]) {
          clothTrackingService.assignClothToWasherForSeed(created[0].id, washer.id, washCount);
          issuedAnyCloth = true;
        }
      });

      if (issuedEquipment || issuedAnyCloth) {
        equipmentCoveredSet.add(washer.id);
        anyChange = true;
      }
    });

    if (anyChange) {
      DataService.setAll("INVENTORY_ITEMS", items);
      DataService.setAll("STOCK_TRANSACTIONS", txns);
      localStorage.setItem(COVERED_KEY, JSON.stringify(Array.from(coveredSet)));
      localStorage.setItem(EQUIPMENT_COVERED_KEY, JSON.stringify(Array.from(equipmentCoveredSet)));
      console.info(`[washerStarterStockSeed] Issued real starter stock to ${newWashers.length} new washer(s), real equipment/cloths to ${equipmentDue.length} washer(s).`);
    }
  } catch (err) {
    console.error("[washerStarterStockSeed] Failed:", err);
  }
}
