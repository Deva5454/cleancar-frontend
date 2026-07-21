/**
 * branchStores — real registry of branch stores.
 *
 * A branch store is a second physical stock location within the same
 * city as the main/central store. It receives stock ONLY via internal
 * transfer from the main store — never directly from a vendor. This is
 * a real, explicit business rule, not a default assumption: procurement
 * and vendor-facing screens should never target a branch directly.
 *
 * Kept as a simple, real config rather than folded into CityContext,
 * since a branch is a sub-location within a city, not a city itself.
 */

export interface BranchStore {
  id: string;
  name: string;
  cityId: string;
  active: boolean;
}

export const BRANCH_STORES: BranchStore[] = [
  { id: "BRANCH-SURAT-01", name: "Surat Branch Store", cityId: "CITY-SURAT", active: true },
];

export function getBranchesForCity(cityId: string): BranchStore[] {
  return BRANCH_STORES.filter((b) => b.cityId === cityId && b.active);
}

export function getBranchById(branchId: string): BranchStore | undefined {
  return BRANCH_STORES.find((b) => b.id === branchId);
}
