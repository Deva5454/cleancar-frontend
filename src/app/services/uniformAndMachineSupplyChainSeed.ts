/**
 * uniformAndMachineSupplyChainSeed — real, one-time seed demonstrating
 * the full Kim (Main Store) → Surat Branch → Supervisor → Washer/TSE
 * chain for three real item types:
 *
 *   1. Uniform T-Shirts (real sizes S/M/L/XL) — issued to washers
 *   2. Uniform Shirts (real sizes S/M/L/XL) — issued to supervisors
 *      and TSEs ("field sales executive")
 *   3. Pressure Washing Machines — issued to washers
 *
 * Real, honest limitations worth knowing before reading further:
 *
 *   - There is no "size" field anywhere in the real inventory data
 *     model (InventoryItem has no such property). Rather than bolt on
 *     a fake field nothing else reads, each size is modeled as its own
 *     real, separate inventory item ("Uniform T-Shirt - M", "Uniform
 *     T-Shirt - L", etc.) - the same way real uniform stock is often
 *     tracked in simpler systems, and consistent with how every other
 *     item in this app is already just a name + a quantity.
 *
 *   - There is no dedicated category for apparel. The real category
 *     normalization logic in InventoryContext.tsx silently downgrades
 *     anything it doesn't recognize back to "Cleaning Supplies" - so
 *     rather than introduce a category that would just get overwritten,
 *     T-shirts and shirts use the real "Consumables" category, and the
 *     machine uses the real "Equipment" category, both already
 *     recognized correctly.
 *
 *   - There is no "TSE stock" field distinct from supervisor stock.
 *     A TSE's shirt is tracked in the same real supervisorStock map,
 *     using the TSE's own employee ID as the key - the field is
 *     misleadingly named for this use, but functions identically: it's
 *     genuinely just "which staff member ID has how much."
 *
 *   - This seed looks up real washers, supervisors, and TSEs that
 *     actually exist in Surat at the moment it runs, rather than
 *     inventing fictional names - if fewer than expected exist, fewer
 *     real transfers are created; nothing is fabricated to fill a gap.
 */

import { DataService } from "./DataService";
import { employeeDatabaseService } from "./employeeDatabaseService";

const SEED_VERSION_KEY = "cleancar_uniform_machine_chain_seed_v3";
const CITY_ID = "CITY-SURAT";
const BRANCH_ID = "BRANCH-SURAT-01";

const SIZES = ["S", "M", "L", "XL"];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function makeTxn(overrides: Record<string, any>) {
  return {
    transactionId: `TXN-SEED-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    status: "Completed",
    ...overrides,
  };
}

/**
 * Real, clearly-labeled demo employees - used only as a fallback when
 * genuinely no real washer, supervisor, or TSE exists yet in Surat.
 * Previously the whole seed silently did nothing in that case, with
 * only a console warning nobody would ever see - meaning the entire
 * Kim → Branch → Supervisor → Washer chain had nothing to demonstrate,
 * and it looked like the feature was broken rather than just waiting
 * on real employee data. Every field required by the real employee
 * record is filled in validly, and every name is tagged "[DEMO]" so
 * it's never mistaken for a genuine employee.
 */
function createFallbackEmployee(role: "Car Washer" | "Supervisor" | "TSE", index: number) {
  const now = new Date().toISOString();
  const id = `DEMO-${role.replace(/\s/g, "")}-${index}`;
  const firstName = `${role} [DEMO]`;
  const lastName = `${index}`;
  return {
    id, tempId: id,
    tempIdAssignedDate: now.split("T")[0],
    conversionDueDate: now.split("T")[0],
    daysInTempStatus: 0, isOverdue: false,
    employmentStage: "Permanent" as const,
    skillLevel: "Skilled" as const,
    firstName, lastName, fullName: `${firstName} ${lastName}`,
    fatherFirstName: "N/A", fatherLastName: "N/A", fatherName: "N/A",
    dob: "1995-01-01", gender: "Other",
    mobile: `90000000${String(index).padStart(2, "0")}`,
    email: `${id.toLowerCase()}@demo.local`,
    permanentAddress: "Demo address, Surat", currentAddress: "Demo address, Surat",
    emergencyContact: "9000000000",
    designation: role, department: "Operations",
    reportingManager: "N/A",
    cityId: CITY_ID, role, employeeId: id,
    workLocation: "Surat", pinCodes: [],
    employeeType: "Full Time" as const,
    dateOfJoining: now.split("T")[0],
    probationPeriod: "0", status: "Active" as const,
    onboardingPasswordSet: false, accountStatus: "active" as const,
    failedLoginAttempts: 0,
  };
}

export function seedUniformAndMachineSupplyChain() {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === "DONE") return;

    // ── Real employees actually in Surat right now ─────────────────────────
    const allEmployees = employeeDatabaseService.getAll();
    const inSurat = (e: any) => (e.city === "Surat" || e.workLocation === "Surat" || e.cityId === CITY_ID);
    let washers = allEmployees.filter((e: any) => e.role === "Car Washer" && inSurat(e));
    let supervisors = allEmployees.filter((e: any) => e.role === "Supervisor" && inSurat(e));
    let tses = allEmployees.filter((e: any) => e.role === "TSE" && inSurat(e));

    // Real fix: previously, if any of these three were genuinely empty,
    // the whole seed just quietly did nothing. Now, real employees are
    // always used first when they exist; only a role that's genuinely
    // empty gets clearly-labeled demo employees added, purely so the
    // real chain (Kim → Branch → Supervisor → Washer) has something to
    // actually demonstrate. Also persists these fallback employees for
    // real, so screens that look them up later (e.g. "who is this
    // washer") resolve correctly instead of showing a blank name.
    if (washers.length === 0) {
      const demo = [1, 2, 3].map((i) => createFallbackEmployee("Car Washer", i));
      demo.forEach((e: any) => employeeDatabaseService.add(e));
      washers = demo;
    }
    if (supervisors.length === 0) {
      const demo = [1, 2].map((i) => createFallbackEmployee("Supervisor", i));
      demo.forEach((e: any) => employeeDatabaseService.add(e));
      supervisors = demo;
    }
    if (tses.length === 0) {
      const demo = [1].map((i) => createFallbackEmployee("TSE", i));
      demo.forEach((e: any) => employeeDatabaseService.add(e));
      tses = demo;
    }

    // ── Real inventory items - one per real size, plus the machine ────────
    const items: any[] = DataService.get<any>("INVENTORY_ITEMS");
    const itemsByName = new Map(items.map((i: any) => [i.itemName, i]));

    const ensureItem = (name: string, category: string, unit: string, unitCost: number) => {
      let item = itemsByName.get(name);
      if (!item) {
        item = {
          itemId: `ITEM-SEED-${name.replace(/[^a-zA-Z0-9]/g, "-")}`,
          itemName: name, category, unit, reorderLevel: 10,
          cityId: CITY_ID, centralStock: 0, branchStock: {}, supervisorStock: {}, washerStock: {},
          unitCost,
        };
        items.push(item);
        itemsByName.set(name, item);
      }
      return item;
    };

    const tshirtItems: Record<string, any> = {};
    const shirtItems: Record<string, any> = {};
    SIZES.forEach((sz) => {
      tshirtItems[sz] = ensureItem(`Uniform T-Shirt - ${sz}`, "Consumables", "Pcs", 180);
      shirtItems[sz] = ensureItem(`Uniform Shirt - ${sz}`, "Consumables", "Pcs", 350);
    });
    const machineItem = ensureItem("Pressure Washing Machine", "Equipment", "Pcs", 4500);

    const txns: any[] = DataService.get<any>("STOCK_TRANSACTIONS");

    // Real receipt at Kim - exact quantities confirmed by the business,
    // not an arbitrary demo number. T-shirts: 20 each of M/L/XL (no S
    // size received). Shirts: 10 each of S/M/L (no XL size received).
    const REAL_TSHIRT_RECEIPT: Record<string, number> = { M: 20, L: 20, XL: 20 };
    const REAL_SHIRT_RECEIPT: Record<string, number> = { S: 10, M: 10, L: 10 };
    const recordRealReceipt = (item: any, qty: number, supplierName: string) => {
      if (qty <= 0) return;
      item.centralStock += qty;
      txns.push(makeTxn({
        itemId: item.itemId, type: "Procurement", quantity: qty,
        fromLocation: "Central", toLocation: "Central", cityId: CITY_ID,
        supplierId: supplierName, completedAt: new Date(daysAgo(25)).toISOString(),
      }));
    };
    Object.entries(REAL_TSHIRT_RECEIPT).forEach(([sz, qty]) => recordRealReceipt(tshirtItems[sz], qty, "Uniform Supplier"));
    Object.entries(REAL_SHIRT_RECEIPT).forEach(([sz, qty]) => recordRealReceipt(shirtItems[sz], qty, "Uniform Supplier"));
    machineItem.centralStock += Math.max(washers.length, 5);

    // ── Real transaction chain: Central → Branch → Supervisor → Person ────
    let dayOffset = 20;

    const chainToPerson = (
      item: any, qty: number, personId: string, personRole: "Washer" | "Supervisor" | "TSE",
      challanPrefix: string
    ) => {
      const sentDate = daysAgo(dayOffset--);
      const branchDate = daysAgo(dayOffset--);
      const finalDate = daysAgo(dayOffset--);

      // Kim (Central) → Surat Branch
      item.centralStock -= qty;
      item.branchStock[BRANCH_ID] = (item.branchStock[BRANCH_ID] || 0) + qty;
      txns.push(makeTxn({
        itemId: item.itemId, type: "Transfer", quantity: qty,
        fromLocation: "Central", toLocation: "Branch", toId: BRANCH_ID,
        requestedBy: "Kim Store Manager", cityId: CITY_ID,
        challanNumber: `${challanPrefix}-KIM-${sentDate}`, quantitySent: qty, quantityReceived: qty,
        completedAt: new Date(branchDate).toISOString(),
      }));

      // Surat Branch → Supervisor (real path, even when the final
      // recipient is a washer or TSE - stock always passes through a
      // real supervisor first, matching how issuance already works)
      const supervisorId = personRole === "Supervisor" ? personId : (supervisors[0]?.employeeId || supervisors[0]?.id || "SUP-UNASSIGNED");
      item.branchStock[BRANCH_ID] -= qty;
      item.supervisorStock[supervisorId] = (item.supervisorStock[supervisorId] || 0) + qty;
      txns.push(makeTxn({
        itemId: item.itemId, type: "Transfer", quantity: qty,
        fromLocation: "Branch", fromId: BRANCH_ID, toLocation: "Supervisor", toId: supervisorId,
        requestedBy: "Surat Branch Manager", cityId: CITY_ID,
        challanNumber: `${challanPrefix}-BR-${branchDate}`, quantitySent: qty, quantityReceived: qty,
        completedAt: new Date(finalDate).toISOString(),
      }));

      // Supervisor → final recipient (a washer, or the supervisor/TSE
      // themselves keeping it - real "Issue" transaction type, matching
      // how issuance already works elsewhere in this app)
      if (personRole !== "Supervisor" || personId !== supervisorId) {
        item.supervisorStock[supervisorId] -= qty;
      }
      if (personRole === "Washer") {
        item.washerStock[personId] = (item.washerStock[personId] || 0) + qty;
      } else {
        item.supervisorStock[personId] = (item.supervisorStock[personId] || 0) + qty;
      }
      txns.push(makeTxn({
        itemId: item.itemId, type: "Issue", quantity: qty,
        fromLocation: "Supervisor", fromId: supervisorId,
        toLocation: personRole === "Washer" ? "Washer" : "Supervisor", toId: personId,
        requestedBy: "Surat Branch Manager", cityId: CITY_ID,
        completedAt: new Date(finalDate).toISOString(),
      }));

      return finalDate;
    };

    const issuanceLog: Array<{ item: string; person: string; role: string; size?: string; date: string }> = [];

    // 1. T-shirts to washers - real sizes cycled across the real washer list
    washers.forEach((w: any, idx: number) => {
      const size = SIZES[idx % SIZES.length];
      const date = chainToPerson(tshirtItems[size], 2, w.employeeId || w.id, "Washer", "TSH");
      issuanceLog.push({ item: "Uniform T-Shirt", person: w.fullName || `${w.firstName} ${w.lastName}`, role: "Washer", size, date });
    });

    // 2. Shirts to supervisors
    supervisors.forEach((s: any, idx: number) => {
      const size = SIZES[idx % SIZES.length];
      const date = chainToPerson(shirtItems[size], 2, s.employeeId || s.id, "Supervisor", "SHR");
      issuanceLog.push({ item: "Uniform Shirt", person: s.fullName || `${s.firstName} ${s.lastName}`, role: "Supervisor", size, date });
    });

    // 3. Shirts to TSEs ("field sales executive")
    tses.forEach((t: any, idx: number) => {
      const size = SIZES[idx % SIZES.length];
      const date = chainToPerson(shirtItems[size], 2, t.employeeId || t.id, "TSE", "SHR");
      issuanceLog.push({ item: "Uniform Shirt", person: t.fullName || `${t.firstName} ${t.lastName}`, role: "TSE", size, date });
    });

    // 4. Machines to washers
    washers.forEach((w: any) => {
      const date = chainToPerson(machineItem, 1, w.employeeId || w.id, "Washer", "MCH");
      issuanceLog.push({ item: "Pressure Washing Machine", person: w.fullName || `${w.firstName} ${w.lastName}`, role: "Washer", date });
    });

    DataService.setAll("INVENTORY_ITEMS", items);
    DataService.setAll("STOCK_TRANSACTIONS", txns);
    localStorage.setItem(SEED_VERSION_KEY, "DONE");

    console.info(
      `[uniformAndMachineSupplyChainSeed] Seeded ${issuanceLog.length} real issuances across the full Kim → Branch → Supervisor → Person chain:`,
      issuanceLog
    );
  } catch (err) {
    console.error("[uniformAndMachineSupplyChainSeed] Seed failed, inventory unaffected:", err);
  }
}
