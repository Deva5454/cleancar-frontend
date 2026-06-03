import { DataService } from "./DataService";
/**
 * Cloth Tracking Service
 * Manages cloth state, scanning, and exchange logic
 */

import type {
  ClothItem,
  ClothType,
  ClothStatus,
  ScanResult,
  ScanError,
  ScanErrorType,
  MatchStatus,
  ClothExchange,
} from "../types/clothTracking";

class ClothTrackingService {
  private scanTimestamps: Map<string, number> = new Map(); // in-memory only (scan rate limiting)

  private get clothMap(): Map<string, ClothItem> {
    const stored = DataService.get<ClothItem>("CLOTH_ITEMS");
    return new Map(stored.map(c => [c.barcode, c]));
  }
  private get exchangeList(): ClothExchange[] {
    return DataService.get<ClothExchange>("CLOTH_EXCHANGES");
  }
  private saveClothMap(map: Map<string, ClothItem>): void {
    DataService.setAll("CLOTH_ITEMS", Array.from(map.values()));
  }
  private saveExchanges(exchanges: ClothExchange[]): void {
    DataService.setAll("CLOTH_EXCHANGES", exchanges);
  }

  constructor() {
    // Only seed if no data exists
    const existing = DataService.get<ClothItem>("CLOTH_ITEMS");
    if (existing.length === 0) {
      this.seedMockData();
    }
  }

  // === CORE SCAN LOGIC ===

  /**
   * Scan a cloth barcode
   * Auto-classifies as DIRTY or CLEAN based on status
   */
  scanCloth(barcode: string, expectedCategory: "DIRTY" | "CLEAN"): ScanResult {
    const startTime = Date.now();

    // Find cloth
    const cloth = this.clothMap.get(barcode);
    if (!cloth) {
      return {
        success: false,
        error: {
          type: "NOT_FOUND",
          message: "Barcode not recognized",
          clothId: barcode,
        },
      };
    }

    // Check if locked
    if (cloth.isLocked) {
      return {
        success: false,
        error: {
          type: "LOCKED",
          message: `Cloth in another process (${cloth.lockedBy})`,
          clothId: barcode,
        },
      };
    }

    // Check if expired
    if (cloth.status === "EXPIRED" || this.isExpired(cloth)) {
      return {
        success: false,
        error: {
          type: "EXPIRED",
          message: "Cloth expired – replace",
          clothId: barcode,
        },
      };
    }

    // Auto-classify based on status
    const actualCategory = this.getClothCategory(cloth);

    // Validate against expected category
    if (actualCategory !== expectedCategory) {
      return {
        success: false,
        error: {
          type: "INVALID_STAGE",
          message: `Cloth not allowed at this stage (is ${actualCategory})`,
          clothId: barcode,
        },
      };
    }

    // Record scan time
    const scanTime = Date.now() - startTime;
    this.scanTimestamps.set(barcode, scanTime);

    return {
      success: true,
      cloth,
    };
  }

  /**
   * Auto-classify cloth as DIRTY or CLEAN
   */
  private getClothCategory(cloth: ClothItem): "DIRTY" | "CLEAN" {
    switch (cloth.status) {
      case "USED_PENDING_COLLECTION":
        return "DIRTY";
      case "CLEAN_PACKED":
        return "CLEAN";
      default:
        // Block scan for other statuses
        return "CLEAN"; // Default to trigger error
    }
  }

  /**
   * Check if cloth is expired
   */
  private isExpired(cloth: ClothItem): boolean {
    if (!cloth.expiryDate) return false;
    return new Date(cloth.expiryDate) < new Date();
  }

  // === MATCH CALCULATION ===

  /**
   * Calculate match status for dirty/clean quantities
   */
  calculateMatch(dirtyIds: string[], cleanIds: string[]): MatchStatus {
    // Count by type
    const dirtyExterior = this.countByType(dirtyIds, "EXTERIOR");
    const dirtyInterior = this.countByType(dirtyIds, "INTERIOR");
    const cleanExterior = this.countByType(cleanIds, "EXTERIOR");
    const cleanInterior = this.countByType(cleanIds, "INTERIOR");

    return {
      exterior: {
        dirty: dirtyExterior,
        clean: cleanExterior,
        matched: dirtyExterior === cleanExterior,
      },
      interior: {
        dirty: dirtyInterior,
        clean: cleanInterior,
        matched: dirtyInterior === cleanInterior,
      },
      allMatched:
        dirtyExterior === cleanExterior && dirtyInterior === cleanInterior,
    };
  }

  private countByType(clothIds: string[], type: ClothType): number {
    return clothIds.filter((id) => {
      const cloth = this.clothMap.get(id);
      return cloth && cloth.type === type;
    }).length;
  }

  // === CLOTH OPERATIONS ===

  getCloth(id: string): ClothItem | undefined {
    return this.clothMap.get(id);
  }

  lockCloth(id: string, lockedBy: string): void {
    const cloth = this.clothMap.get(id);
    if (cloth) {
      cloth.isLocked = true;
      cloth.lockedBy = lockedBy;
      cloth.updatedAt = new Date().toISOString();
    }
  }

  unlockCloth(id: string): void {
    const cloth = this.clothMap.get(id);
    if (cloth) {
      cloth.isLocked = false;
      cloth.lockedBy = undefined;
      cloth.updatedAt = new Date().toISOString();
    }
  }

  updateClothStatus(id: string, status: ClothStatus): void {
    const cloth = this.clothMap.get(id);
    if (cloth) {
      cloth.status = status;
      cloth.updatedAt = new Date().toISOString();
    }
  }

  // === EXCHANGE OPERATIONS ===

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
      dirtyClothIds: dirtyIds,
      dirtyExterior: match.exterior.dirty,
      dirtyInterior: match.interior.dirty,
      cleanClothIds: cleanIds,
      cleanExterior: match.exterior.clean,
      cleanInterior: match.interior.clean,
      exteriorMatched: match.exterior.matched,
      interiorMatched: match.interior.matched,
      isComplete: match.allMatched,
      timestamp: new Date().toISOString(),
    };

    this.exchangeList.push(exchange);

    // Update cloth statuses
    dirtyIds.forEach((id) => this.updateClothStatus(id, "IN_LAUNDRY_PROCESS"));
    cleanIds.forEach((id) => this.updateClothStatus(id, "ISSUED"));

    return exchange;
  }

  getExchanges(): ClothExchange[] {
    return this.exchangeList;
  }

  // === ANALYTICS ===

  getAvgScanTime(): number {
    if (this.scanTimestamps.size === 0) return 0;
    const total = Array.from(this.scanTimestamps.values()).reduce(
      (sum, time) => sum + time,
      0
    );
    return Math.round(total / this.scanTimestamps.size);
  }

  getTotalScans(): number {
    return this.scanTimestamps.size;
  }

  // === MOCK DATA ===

  private seedMockData() {
    // Create 50 cloths (30 dirty, 20 clean)
    for (let i = 1; i <= 50; i++) {
      const id = `CLO${String(i).padStart(8, "0")}`;
      const type: ClothType = i % 2 === 0 ? "EXTERIOR" : "INTERIOR";
      const status: ClothStatus =
        i <= 30 ? "USED_PENDING_COLLECTION" : "CLEAN_PACKED";

      const cloth: ClothItem = {
        id,
        shortId: id.slice(-4),
        type,
        status,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.clothMap.set(id, cloth);
    }

    // Add some locked cloths
    this.lockCloth("CLO00000005", "EXCHANGE-001");
    this.lockCloth("CLO00000010", "LAUNDRY-BATCH-1");

    // Add some expired cloths
    const expiredCloth = this.clothMap.get("CLO00000015");
    if (expiredCloth) {
      expiredCloth.status = "EXPIRED";
      expiredCloth.expiryDate = "2026-01-01";
    }
  }

  // Get all cloths by status
  getClothsByStatus(status: ClothStatus): ClothItem[] {
    return Array.from(this.clothMap.values()).filter((c) => c.status === status);
  }

  // Get all cloths by type and status
  getClothsByTypeAndStatus(type: ClothType, status: ClothStatus): ClothItem[] {
    return Array.from(this.clothMap.values()).filter(
      (c) => c.type === type && c.status === status
    );
  }
}

// Singleton instance
export const clothTrackingService = new ClothTrackingService();
