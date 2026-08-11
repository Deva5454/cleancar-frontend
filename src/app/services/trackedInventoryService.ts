import { DataService } from "./DataService";
import type {
  TrackedItemType,
  TrackedUnit,
  TrackedMovementEvent,
  PressureWasherUnit,
  TrackedUnitLocation,
  ScanResult,
} from "../types/trackedInventory";

class TrackedInventoryService {
  private cityId: string = "CITY-SURAT";

  setCityId(cityId: string): void {
    this.cityId = cityId;
  }

  // ── Item Type Management (superadmin-editable, no code change needed) ────

  getItemTypes(): TrackedItemType[] {
    return DataService.get<TrackedItemType>("TRACKED_ITEM_TYPES", this.cityId);
  }

  getActiveItemTypes(): TrackedItemType[] {
    return this.getItemTypes().filter(t => t.active);
  }

  createItemType(input: Omit<TrackedItemType, "id" | "cityId" | "createdAt" | "updatedAt">): TrackedItemType {
    const now = new Date().toISOString();
    const type: TrackedItemType = {
      ...input,
      id: `TYPE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cityId: this.cityId,
      createdAt: now,
      updatedAt: now,
    };
    const types = this.getItemTypes();
    types.push(type);
    DataService.setAll("TRACKED_ITEM_TYPES", types, this.cityId);
    return type;
  }

  updateItemType(typeId: string, updates: Partial<Omit<TrackedItemType, "id" | "cityId" | "createdAt">>): boolean {
    const types = this.getItemTypes();
    const idx = types.findIndex(t => t.id === typeId);
    if (idx < 0) return false;
    types[idx] = { ...types[idx], ...updates, updatedAt: new Date().toISOString() };
    DataService.setAll("TRACKED_ITEM_TYPES", types, this.cityId);
    return true;
  }

  // ── Unit Management ────────────────────────────────────────────────────

  getUnits(): TrackedUnit[] {
    return DataService.get<TrackedUnit>("TRACKED_UNITS", this.cityId);
  }

  getUnitById(unitId: string): TrackedUnit | undefined {
    return this.getUnits().find(u => u.id === unitId);
  }

  getUnitsByType(typeId: string): TrackedUnit[] {
    return this.getUnits().filter(u => u.typeId === typeId);
  }

  private saveUnits(units: TrackedUnit[]): void {
    DataService.setAll("TRACKED_UNITS", units, this.cityId);
  }

  /**
   * Real receipt of new stock at Kim, once purchased from a supplier -
   * generalizes clothTrackingService's receiveFabricAtKim to any item
   * type. Creates individually barcoded units, each starting a fresh
   * real life at Kim, usageCount 0.
   */
  receiveUnitsAtKim(typeId: string, quantity: number): TrackedUnit[] {
    const type = this.getItemTypes().find(t => t.id === typeId);
    if (!type) return [];
    const units = this.getUnits();
    const created: TrackedUnit[] = [];
    const now = new Date().toISOString();
    for (let i = 0; i < quantity; i++) {
      const id = `${type.barcodePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const unit: TrackedUnit = {
        id, shortId: id.slice(-4), typeId, cityId: this.cityId,
        status: "Active", currentLocation: "Kim",
        usageCount: 0, isLocked: false,
        createdAt: now, updatedAt: now,
      };
      units.push(unit);
      created.push(unit);
    }
    this.saveUnits(units);

    // Log the receipt itself as a real movement event, so the audit
    // trail genuinely starts at the supplier, not silently at Kim.
    const events = this.getMovementEvents();
    for (const unit of created) {
      events.push({
        id: `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        unitId: unit.id, cityId: this.cityId,
        fromLocation: "Supplier", toLocation: "Kim",
        scannedBy: "system", scannedByName: "Received at Kim",
        timestamp: now,
      });
    }
    DataService.setAll("TRACKED_MOVEMENT_EVENTS", events, this.cityId);
    return created;
  }

  // ── Movement / Scan ──────────────────────────────────────────────────────

  getMovementEvents(): TrackedMovementEvent[] {
    return DataService.get<TrackedMovementEvent>("TRACKED_MOVEMENT_EVENTS", this.cityId);
  }

  getMovementHistoryForUnit(unitId: string): TrackedMovementEvent[] {
    return this.getMovementEvents()
      .filter(e => e.unitId === unitId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Real, scanned handover - the core action for every real movement
   * (Kim -> Branch, Branch -> Supervisor, Supervisor -> Washer, and back).
   * One real scan updates the unit's real, current location and logs a
   * real, permanent movement event.
   */
  scanMovement(
    unitId: string,
    toLocation: TrackedUnitLocation | "Repair",
    toLocationId: string | undefined,
    scannedBy: string,
    scannedByName: string,
    notes?: string
  ): ScanResult {
    const units = this.getUnits();
    const idx = units.findIndex(u => u.id === unitId);
    if (idx < 0) {
      return { success: false, error: { type: "NOT_FOUND", message: `No item found with barcode ${unitId}` } };
    }
    const unit = units[idx];
    if (unit.status === "Retired") {
      return { success: false, error: { type: "RETIRED", message: `${unitId} has been retired and can no longer be moved` } };
    }
    if (unit.isLocked) {
      return { success: false, error: { type: "LOCKED", message: `${unitId} is locked by another process` } };
    }

    const now = new Date().toISOString();
    const fromLocation = unit.currentLocation;
    const fromLocationId = unit.currentLocationId;

    units[idx] = {
      ...unit,
      currentLocation: toLocation === "Repair" ? unit.currentLocation : toLocation,
      currentLocationId: toLocation === "Repair" ? unit.currentLocationId : toLocationId,
      status: toLocation === "Repair" ? "UnderRepair" : (toLocation === "Washer" ? "Issued" : "Active"),
      updatedAt: now,
    };
    this.saveUnits(units);

    const events = this.getMovementEvents();
    events.push({
      id: `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      unitId, cityId: this.cityId,
      fromLocation, fromLocationId,
      toLocation, toLocationId,
      scannedBy, scannedByName,
      timestamp: now, notes,
    });
    DataService.setAll("TRACKED_MOVEMENT_EVENTS", events, this.cityId);

    return { success: true, unit: units[idx] };
  }

  retireUnit(unitId: string, reason: string, retiredBy: string, retiredByName: string): boolean {
    const units = this.getUnits();
    const idx = units.findIndex(u => u.id === unitId);
    if (idx < 0) return false;
    units[idx] = { ...units[idx], status: "Retired", updatedAt: new Date().toISOString() };
    this.saveUnits(units);
    const events = this.getMovementEvents();
    events.push({
      id: `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      unitId, cityId: this.cityId,
      fromLocation: units[idx].currentLocation, toLocation: units[idx].currentLocation,
      scannedBy: retiredBy, scannedByName: retiredByName,
      timestamp: new Date().toISOString(), notes: `Retired: ${reason}`,
    });
    DataService.setAll("TRACKED_MOVEMENT_EVENTS", events, this.cityId);
    return true;
  }

  // ── Live aggregate rollup - replaces separately-maintained counts ────────
  // The count IS the real, current units at a location - nothing to keep
  // in sync, since there's no separate number stored anywhere.

  getAggregateCount(typeId: string, location: TrackedUnitLocation, locationId?: string): number {
    return this.getUnitsByType(typeId).filter(u =>
      u.status !== "Retired" &&
      u.currentLocation === location &&
      (locationId === undefined || u.currentLocationId === locationId)
    ).length;
  }

  // ── Pressure Washer composite units ──────────────────────────────────────

  getPressureWasherUnits(): PressureWasherUnit[] {
    return DataService.get<PressureWasherUnit>("PRESSURE_WASHER_UNITS", this.cityId);
  }

  getPressureWasherUnit(unitCode: string): PressureWasherUnit | undefined {
    return this.getPressureWasherUnits().find(u => u.unitCode === unitCode);
  }

  createPressureWasherUnit(unitCode: string, partTypeId: string, slotCount: number): PressureWasherUnit {
    const now = new Date().toISOString();
    const slots: Record<number, string> = {};
    for (let slot = 1; slot <= slotCount; slot++) {
      const id = `${unitCode}-${slot}`;
      const units = this.getUnits();
      const partUnit: TrackedUnit = {
        id, shortId: id.slice(-4), typeId: partTypeId, cityId: this.cityId,
        status: "Active", currentLocation: "Kim",
        usageCount: 0, isLocked: false,
        originalUnitCode: unitCode, currentUnitCode: unitCode, currentSlot: slot,
        createdAt: now, updatedAt: now,
      };
      units.push(partUnit);
      this.saveUnits(units);
      slots[slot] = id;
    }
    const pwUnit: PressureWasherUnit = { unitCode, cityId: this.cityId, slots, createdAt: now, updatedAt: now };
    const pwUnits = this.getPressureWasherUnits();
    pwUnits.push(pwUnit);
    DataService.setAll("PRESSURE_WASHER_UNITS", pwUnits, this.cityId);
    return pwUnit;
  }

  /**
   * Real part swap - the broken part comes out (still tracked, per the
   * confirmed requirement - moves to UnderRepair, keeps its own real
   * identity and originalUnitCode forever), and a replacement part
   * (which may carry a completely different originalUnitCode) goes into
   * the slot, carrying its own real identity with it - genuine
   * traceability both ways.
   */
  swapPart(unitCode: string, slot: number, replacementPartId: string, swappedBy: string, swappedByName: string): { success: boolean; error?: string } {
    const pwUnit = this.getPressureWasherUnit(unitCode);
    if (!pwUnit) return { success: false, error: `No pressure washer unit found with code ${unitCode}` };
    const oldPartId = pwUnit.slots[slot];
    const units = this.getUnits();
    const replacementIdx = units.findIndex(u => u.id === replacementPartId);
    if (replacementIdx < 0) return { success: false, error: `No part found with barcode ${replacementPartId}` };

    const now = new Date().toISOString();

    // Old part - real, confirmed requirement: keep tracking it. Sent for
    // repair, keeps its own originalUnitCode forever.
    if (oldPartId) {
      const oldIdx = units.findIndex(u => u.id === oldPartId);
      if (oldIdx >= 0) {
        units[oldIdx] = { ...units[oldIdx], status: "UnderRepair", currentUnitCode: undefined, currentSlot: undefined, updatedAt: now };
      }
    }

    // New part - takes over the slot, keeps its own real originalUnitCode.
    units[replacementIdx] = { ...units[replacementIdx], currentUnitCode: unitCode, currentSlot: slot, status: "Active", updatedAt: now };
    this.saveUnits(units);

    const pwUnits = this.getPressureWasherUnits();
    const pwIdx = pwUnits.findIndex(u => u.unitCode === unitCode);
    pwUnits[pwIdx] = { ...pwUnits[pwIdx], slots: { ...pwUnits[pwIdx].slots, [slot]: replacementPartId }, updatedAt: now };
    DataService.setAll("PRESSURE_WASHER_UNITS", pwUnits, this.cityId);

    const events = this.getMovementEvents();
    if (oldPartId) {
      events.push({
        id: `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        unitId: oldPartId, cityId: this.cityId,
        fromLocation: "Washer", toLocation: "Repair",
        scannedBy: swappedBy, scannedByName: swappedByName,
        timestamp: now, notes: `Swapped out of ${unitCode} slot ${slot}`,
      });
    }
    events.push({
      id: `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      unitId: replacementPartId, cityId: this.cityId,
      fromLocation: units[replacementIdx].currentLocation, toLocation: "Washer",
      scannedBy: swappedBy, scannedByName: swappedByName,
      timestamp: now, notes: `Swapped into ${unitCode} slot ${slot}`,
    });
    DataService.setAll("TRACKED_MOVEMENT_EVENTS", events, this.cityId);

    return { success: true };
  }
}

export const trackedInventoryService = new TrackedInventoryService();
