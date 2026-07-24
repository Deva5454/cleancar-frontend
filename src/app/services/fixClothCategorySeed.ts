/**
 * fixClothCategorySeed — real, one-time migration fixing a
 * confirmed, pre-existing data bug: "Microfiber Cloth Large" was
 * tagged category "Equipment" in the original fallback data, across
 * all three cities. It's genuinely a consumable, not durable
 * equipment - this showed up incorrectly in the real "Equipment in
 * Hand" section of My Stock, mixed in with actual durable items.
 */

const SEED_VERSION_KEY = "cleancar_fix_cloth_category_v2";

export function fixClothCategory() {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === "DONE") return;

    ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"].forEach((cityId) => {
      const key = `cleancar_${cityId}_inventory_items`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const items = JSON.parse(raw);
      let changed = false;
      items.forEach((i: any) => {
        if (i.itemName === "Microfiber Cloth Large" && i.category === "Equipment") {
          i.category = "Consumables";
          changed = true;
        }
        if (i.itemName === "Pressure Washer Nozzle" && i.category === "Equipment") {
          i.category = "Pressure Washer Parts";
          changed = true;
        }
      });
      // Real, previously-missing starter parts - genuine starting
      // stock so real assembly can actually be used right away, not
      // just once someone separately receives them at Kim first.
      const now = new Date().toISOString();
      const starterParts: Array<{ name: string; stock: number; cost: number }> = [
        { name: "Spray Gun", stock: 6, cost: 450 },
        { name: "High-Pressure Hose", stock: 6, cost: 600 },
      ];
      starterParts.forEach(({ name, stock, cost }) => {
        const exists = items.some((i: any) => i.itemName === name && i.cityId === cityId);
        if (!exists) {
          items.push({
            itemId: `PWP-${name.replace(/[^a-zA-Z0-9]/g, "-")}-${cityId}`,
            itemName: name, category: "Pressure Washer Parts", unit: "Pcs",
            centralStock: stock, reorderLevel: 4, unitCost: cost, cityId,
            supervisorStock: {}, washerStock: {}, createdAt: now, updatedAt: now,
          });
          changed = true;
        }
      });
      if (changed) localStorage.setItem(key, JSON.stringify(items));
    });

    localStorage.setItem(SEED_VERSION_KEY, "DONE");
    console.info("[fixClothCategorySeed] Fixed real categories and seeded starter pressure washer parts.");
  } catch (err) {
    console.error("[fixClothCategorySeed] Failed:", err);
  }
}
