import { DataService } from "./DataService";
/**
 * Cloth Tracking Service
 * Manages cloth state, scanning, and exchange logic
 *
 * FIXES applied:
 *  1A. clothMap key: was c.barcode (undefined) → now c.id (correct)
 *  1B. seedMockData: was writing to discarded Map → now writes via DataService.setAll
 *  1C. saveClothMap/saveExchanges: were never called → now called after every mutation
 *  2.  Removed "LOCKED" from ClothStatus type (locking is isLocked boolean on ClothItem)
 *  6.  getClothCategory default: was returning "CLEAN" causing misleading error msg
 *      → now returns actual cloth status in error message
 */

import type {
  ClothItem,
  ClothType,
  ClothColor,
  ClothStatus,
  ClothLocation,
  ScanResult,
  MatchStatus,
  ClothExchange,
} from "../types/clothTracking";

class ClothTrackingService {
  private scanTimestamps: Map<string, number> = new Map(); // session-only scan timing

  // Real, confirmed business rule - a cloth is retired after 90 real
  // wash cycles, regardless of its physical condition.
  private readonly WASH_RETIREMENT_LIMIT = 90;

  // ── Persistence helpers ────────────────────────────────────────────────────

  /** Load all cloths from DataService as an id-keyed Map */
  private loadClothMap(): Map<string, ClothItem> {
    const stored = DataService.get<ClothItem>("CLOTH_ITEMS");
    return new Map(stored.map(c => [c.id, c])); // FIX 1A: was c.barcode
  }

  /** Persist cloth Map back to DataService */
  private saveClothMap(map: Map<string, ClothItem>): void {
    DataService.setAll("CLOTH_ITEMS", Array.from(map.values()));
  }

  /** Load all exchanges from DataService */
  private loadExchanges(): ClothExchange[] {
    return DataService.get<ClothExchange>("CLOTH_EXCHANGES");
  }

  /** Persist exchange list back to DataService */
  private saveExchanges(exchanges: ClothExchange[]): void {
    DataService.setAll("CLOTH_EXCHANGES", exchanges);
  }

  // ── Constructor ────────────────────────────────────────────────────────────

  constructor() {
    const existing = DataService.get<ClothItem>("CLOTH_ITEMS");
    if (existing.length === 0) {
      this.seedMockData(); // FIX 1B: seedMockData now writes via DataService.setAll
    }
  }

  // ── Core scan logic ────────────────────────────────────────────────────────

  /**
   * Scan a cloth barcode.
   * Auto-classifies as DIRTY or CLEAN based on current status.
   * Validates: NOT_FOUND → LOCKED → EXPIRED → INVALID_STAGE
   */
  scanCloth(barcode: string, expectedCategory: "DIRTY" | "CLEAN"): ScanResult {
    const startTime = Date.now();
    const clothMap = this.loadClothMap(); // FIX 1A: load from DataService with correct key
    const cloth = clothMap.get(barcode);

    if (!cloth) {
      return { success: false, error: { type: "NOT_FOUND", message: "Barcode not recognized", clothId: barcode } };
    }

    // FIX 2: locking uses isLocked boolean only ("LOCKED" removed from ClothStatus)
    if (cloth.isLocked) {
      return { success: false, error: { type: "LOCKED", message: `Cloth locked by ${cloth.lockedBy || "another process"}`, clothId: barcode } };
    }

    if (cloth.status === "EXPIRED" || this.isExpired(cloth)) {
      return { success: false, error: { type: "EXPIRED", message: "Cloth expired — replace with new batch", clothId: barcode } };
    }

    // FIX 6: getClothCategory now returns the actual status in the error message
    const scanCategory = this.getClothScanCategory(cloth);
    if (!scanCategory) {
      return { success: false, error: { type: "INVALID_STAGE", message: `Cloth not available for exchange (current status: ${cloth.status})`, clothId: barcode } };
    }
    if (scanCategory !== expectedCategory) {
      return { success: false, error: { type: "INVALID_STAGE", message: `Cloth is ${scanCategory} — scan on the ${scanCategory} panel`, clothId: barcode } };
    }

    // Record scan time (session-only)
    this.scanTimestamps.set(barcode, Date.now() - startTime);

    return { success: true, cloth };
  }

  /**
   * Returns "DIRTY" | "CLEAN" if the cloth can be scanned, null otherwise.
   * FIX 6: null instead of defaulting to "CLEAN" (which produced misleading errors)
   */
  private getClothScanCategory(cloth: ClothItem): "DIRTY" | "CLEAN" | null {
    switch (cloth.status) {
      case "USED_PENDING_COLLECTION": return "DIRTY";
      case "CLEAN_PACKED":            return "CLEAN";
      default:                        return null; // ISSUED, IN_LAUNDRY_PROCESS, EXPIRED → blocked
    }
  }

  private isExpired(cloth: ClothItem): boolean {
    if (!cloth.expiryDate) return false;
    return new Date(cloth.expiryDate) < new Date();
  }

  // ── Match calculation ──────────────────────────────────────────────────────

  calculateMatch(dirtyIds: string[], cleanIds: string[]): MatchStatus {
    const clothMap = this.loadClothMap();
    const count = (ids: string[], type: ClothType) =>
      ids.filter(id => clothMap.get(id)?.type === type).length;

    const dirtyExterior = count(dirtyIds, "EXTERIOR");
    const dirtyInterior = count(dirtyIds, "INTERIOR");
    const cleanExterior = count(cleanIds, "EXTERIOR");
    const cleanInterior = count(cleanIds, "INTERIOR");

    return {
      exterior: { dirty: dirtyExterior, clean: cleanExterior, matched: dirtyExterior === cleanExterior },
      interior: { dirty: dirtyInterior, clean: cleanInterior, matched: dirtyInterior === cleanInterior },
      allMatched: dirtyExterior === cleanExterior && dirtyInterior === cleanInterior,
    };
  }

  // ── Cloth operations ───────────────────────────────────────────────────────

  getCloth(id: string): ClothItem | undefined {
    return this.loadClothMap().get(id);
  }

  lockCloth(id: string, lockedBy: string): void {
    const map = this.loadClothMap();
    const cloth = map.get(id);
    if (cloth) {
      cloth.isLocked = true;
      cloth.lockedBy = lockedBy;
      cloth.updatedAt = new Date().toISOString();
      this.saveClothMap(map); // FIX 1C: always save after mutation
    }
  }

  unlockCloth(id: string): void {
    const map = this.loadClothMap();
    const cloth = map.get(id);
    if (cloth) {
      cloth.isLocked = false;
      cloth.lockedBy = undefined;
      cloth.updatedAt = new Date().toISOString();
      this.saveClothMap(map); // FIX 1C
    }
  }

  updateClothStatus(id: string, status: ClothStatus): void {
    const map = this.loadClothMap();
    const cloth = map.get(id);
    if (cloth) {
      cloth.status = status;
      cloth.updatedAt = new Date().toISOString();
      this.saveClothMap(map); // FIX 1C
    }
  }

  // ── Exchange operations ────────────────────────────────────────────────────

  createExchange(
    employeeId: string,
    employeeName: string,
    role: any,
    dirtyIds: string[],
    cleanIds: string[]
  ): ClothExchange {
    const match = this.calculateMatch(dirtyIds, cleanIds);

    const exchange: ClothExchange = {
      id: `EX-${Date.now()}`,
      employeeId,
      employeeName,
      role,
      dirtyClothIds:  dirtyIds,
      dirtyExterior:  match.exterior.dirty,
      dirtyInterior:  match.interior.dirty,
      cleanClothIds:  cleanIds,
      cleanExterior:  match.exterior.clean,
      cleanInterior:  match.interior.clean,
      exteriorMatched: match.exterior.matched,
      interiorMatched: match.interior.matched,
      isComplete:     match.allMatched,
      timestamp:      new Date().toISOString(),
    };

    // FIX 1C: load → push → save (not push to getter-returned temp array)
    const exchanges = this.loadExchanges();
    exchanges.push(exchange);
    this.saveExchanges(exchanges);

    // Update cloth statuses — each call loads, mutates, and saves the map
    // Batch them into a single load+save for performance
    const map = this.loadClothMap();
    dirtyIds.forEach(id => {
      const cloth = map.get(id);
      if (cloth) { cloth.status = "IN_LAUNDRY_PROCESS"; cloth.currentLocation = "Supervisor"; cloth.currentLocationId = employeeId; cloth.updatedAt = new Date().toISOString(); }
    });
    cleanIds.forEach(id => {
      const cloth = map.get(id);
      if (cloth) { cloth.status = "ISSUED"; cloth.currentLocation = "Washer"; cloth.issuedTo = employeeId; cloth.issuedAt = new Date().toISOString(); cloth.updatedAt = new Date().toISOString(); }
    });
    this.saveClothMap(map); // single save for all status updates

    return exchange;
  }

  getExchanges(): ClothExchange[] {
    return this.loadExchanges();
  }

  // ── Real Kim → Branch → Supervisor chain integration ───────────────────────

  /**
   * Real receipt of fabric at Kim, by color - matching an actual
   * delivery (e.g. from GT Exim Solutions). Creates real, individually
   * barcoded cloths, each starting a fresh real life at washCount 0.
   */
  receiveFabricAtKim(color: ClothColor, quantity: number, type: ClothType = "EXTERIOR"): ClothItem[] {
    const map = this.loadClothMap();
    const created: ClothItem[] = [];
    const now = new Date().toISOString();
    for (let i = 0; i < quantity; i++) {
      const id = `CLO-${color.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const cloth: ClothItem = {
        id, shortId: id.slice(-4), type, color,
        status: "CLEAN_PACKED", washCount: 0,
        currentLocation: "Kim",
        isLocked: false, createdAt: now, updatedAt: now,
      };
      map.set(id, cloth);
      created.push(cloth);
    }
    this.saveClothMap(map);
    return created;
  }

  /** Real Kim → Branch movement, by real barcode, not aggregate quantity. */
  moveClothsToBranch(clothIds: string[], branchId: string): void {
    const map = this.loadClothMap();
    clothIds.forEach((id) => {
      const cloth = map.get(id);
      if (cloth && cloth.currentLocation === "Kim") {
        cloth.currentLocation = "Branch";
        cloth.currentLocationId = branchId;
        cloth.updatedAt = new Date().toISOString();
      }
    });
    this.saveClothMap(map);
  }

  /** Real Branch → Supervisor movement, by real barcode. */
  moveClothsToSupervisor(clothIds: string[], supervisorId: string): void {
    const map = this.loadClothMap();
    clothIds.forEach((id) => {
      const cloth = map.get(id);
      if (cloth && cloth.currentLocation === "Branch") {
        cloth.currentLocation = "Supervisor";
        cloth.currentLocationId = supervisorId;
        cloth.updatedAt = new Date().toISOString();
      }
    });
    this.saveClothMap(map);
  }

  /** Real Supervisor → Branch → Kim return movement, for cloths already IN_LAUNDRY_PROCESS. */
  returnClothsTowardKim(clothIds: string[], toLocation: "Branch" | "Kim", toLocationId?: string): void {
    const map = this.loadClothMap();
    clothIds.forEach((id) => {
      const cloth = map.get(id);
      if (cloth) {
        cloth.currentLocation = toLocation;
        cloth.currentLocationId = toLocationId;
        cloth.updatedAt = new Date().toISOString();
      }
    });
    this.saveClothMap(map);
  }

  /**
   * Real, previously-missing piece: marks a cloth's real wash cycle
   * complete at Kim's laundry - the one transition that closes the
   * loop (IN_LAUNDRY_PROCESS → CLEAN_PACKED again). This is where the
   * real wash count actually increments, and where the confirmed
   * 90-wash retirement rule is enforced - a cloth crossing the limit
   * is automatically marked EXPIRED, not left for someone to notice.
   */
  markLaundryComplete(clothId: string): { cloth: ClothItem | null; retired: boolean } {
    const map = this.loadClothMap();
    const cloth = map.get(clothId);
    if (!cloth || cloth.status !== "IN_LAUNDRY_PROCESS") {
      return { cloth: null, retired: false };
    }
    const newWashCount = cloth.washCount + 1;
    const retired = newWashCount >= this.WASH_RETIREMENT_LIMIT;
    cloth.washCount = newWashCount;
    cloth.status = retired ? "EXPIRED" : "CLEAN_PACKED";
    cloth.currentLocation = "Kim";
    cloth.currentLocationId = undefined;
    cloth.laundryProcessedAt = new Date().toISOString();
    cloth.updatedAt = new Date().toISOString();
    this.saveClothMap(map);
    return { cloth, retired };
  }

  /** Real, honest view into how many real wash cycles a specific cloth has left. */
  getWashesRemaining(cloth: ClothItem): number {
    return Math.max(0, this.WASH_RETIREMENT_LIMIT - cloth.washCount);
  }

  /**
   * Real, fleet-wide query - every real, non-retired cloth, sorted by
   * how close it is to the confirmed 90-wash limit. Powers the Kim
   * dashboard so retirement is planned for ahead of time, not
   * discovered one cloth at a time.
   */
  getFleetByWashesRemaining(): Array<ClothItem & { washesRemaining: number }> {
    return Array.from(this.loadClothMap().values())
      .filter((c) => c.status !== "EXPIRED")
      .map((c) => ({ ...c, washesRemaining: this.getWashesRemaining(c) }))
      .sort((a, b) => a.washesRemaining - b.washesRemaining);
  }


  // ── Analytics ──────────────────────────────────────────────────────────────

  getAvgScanTime(): number {
    if (this.scanTimestamps.size === 0) return 0;
    const total = Array.from(this.scanTimestamps.values()).reduce((s, t) => s + t, 0);
    return Math.round(total / this.scanTimestamps.size);
  }

  getTotalScans(): number {
    return this.scanTimestamps.size;
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  getClothsByStatus(status: ClothStatus): ClothItem[] {
    return Array.from(this.loadClothMap().values()).filter(c => c.status === status);
  }

  getClothsByTypeAndStatus(type: ClothType, status: ClothStatus): ClothItem[] {
    return Array.from(this.loadClothMap().values()).filter(c => c.type === type && c.status === status);
  }

  // ── Seed data ──────────────────────────────────────────────────────────────

  /**
   * FIX 1B: Builds cloth array in memory then writes once via DataService.setAll.
   * Previous implementation used clothMap.set() on a getter-returned Map
   * that was immediately discarded — DataService was never written.
   */
  private seedMockData() {
    const cloths: ClothItem[] = [];

    for (let i = 1; i <= 50; i++) {
      const id = `CLO${String(i).padStart(8, "0")}`;
      cloths.push({
        id,
        shortId: id.slice(-4),
        type:    i % 2 === 0 ? "EXTERIOR" : "INTERIOR",
        status:  i === 15 ? "EXPIRED" : i <= 30 ? "USED_PENDING_COLLECTION" : "CLEAN_PACKED",
        washCount: i === 15 ? 90 : Math.floor(Math.random() * 60),
        currentLocation: "Supervisor",
        isLocked: i === 5 || i === 10,   // CLO00000005 and CLO00000010 locked
        lockedBy: i === 5 ? "EXCHANGE-001" : i === 10 ? "LAUNDRY-BATCH-1" : undefined,
        expiryDate: i === 15 ? "2026-01-01" : undefined, // CLO00000015 expired
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ClothItem);
    }

    DataService.setAll("CLOTH_ITEMS", cloths); // FIX 1B: write to DataService directly
  }
}

// Singleton
export const clothTrackingService = new ClothTrackingService();
