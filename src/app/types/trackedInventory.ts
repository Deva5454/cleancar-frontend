/**
 * Tracked Inventory Engine - Type Definitions
 *
 * Generalizes the proven cloth-tracking model (individually barcoded
 * units, real Kim -> Branch -> Supervisor -> Washer chain, scan-based
 * movement) to any item category a Super Admin defines - starting with
 * Bottles, Brushes, and Pressure Washer Parts, without requiring a code
 * change to add a new type.
 *
 * Existing InventoryContext (aggregate stock counts for reorder-level
 * alerts) is untouched and stays exactly as-is for items that don't need
 * per-unit traceability. For item types tracked here, an aggregate count
 * is just a live rollup - the count of real TrackedUnit records at a
 * given location - never a separately-maintained number, so there's no
 * second source of truth to drift out of sync.
 */

export type TrackingMode = "aggregate" | "individual";

export type ItemCategory = "Cloth" | "Bottle" | "Brush" | "Pressure Washer Part" | "Other";

export type RetirementRule = "none" | "manual" | "usage-count";

/**
 * Superadmin-managed definition of a trackable item type. Adding a new
 * brush type (or any new category) is a real data row here, not a code
 * change - this is what keeps brushes genuinely open-ended, per the
 * real, confirmed requirement that the brush list isn't fixed.
 */
export interface TrackedItemType {
  id: string;
  name: string;                    // e.g. "Yellow Cloth", "Shampoo Bottle", "Wash Mitt Brush"
  category: ItemCategory;
  cityId: string;
  trackingMode: TrackingMode;
  barcodePrefix: string;           // e.g. "CLO-YELLOW", "BOT-SHAMPOO" - used to generate real unit barcodes
  // Which real lifecycle stages this type genuinely uses. Cloths use all
  // of these (they go to Laundry); bottles/brushes have a simpler real
  // lifecycle (issued -> used -> retired), confirmed - no Laundry stage.
  usesLaundryStage: boolean;
  retirementRule: RetirementRule;
  retirementThreshold?: number;    // only meaningful when retirementRule is "usage-count"
  isComposite: boolean;            // true only for Pressure Washer Unit definitions - see PressureWasherUnit below
  active: boolean;                 // superadmin can retire a type without deleting its history
  // Real, confirmed approval workflow - Procurement Manager can propose a
  // new type, but it stays genuinely unusable (never returned by
  // getActiveItemTypes) until a Super Admin approves it.
  approvalStatus: "Approved" | "Pending" | "Rejected";
  proposedBy?: string;              // real employeeId of whoever proposed it, if not a Super Admin's own direct creation
  proposedByName?: string;
  reviewedBy?: string;              // real Super Admin employeeId who approved/rejected
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type TrackedUnitLocation = "Kim" | "Branch" | "Supervisor" | "Washer";

export type TrackedUnitStatus = "Active" | "Issued" | "UnderRepair" | "Retired" | "Scrapped";

/**
 * One real, individually-barcoded physical item. This is the
 * generalization of ClothItem - same real shape, same real chain,
 * usable for any TrackedItemType.
 */
export interface TrackedUnit {
  id: string;                      // the real barcode - e.g. "BOT-SHAMPOO-{timestamp}-{random}"
  shortId: string;                 // last 4 characters, for display
  typeId: string;                  // FK to TrackedItemType
  cityId: string;
  status: TrackedUnitStatus;
  currentLocation: TrackedUnitLocation;
  currentLocationId?: string;      // real branchId / supervisorId / washerId, whichever currentLocation applies to
  // Generic version of ClothItem's washCount - meaningful once a real
  // usage-count retirement rule is set for this type; otherwise just
  // recorded for future reference, per the confirmed decision to keep
  // retirement manual for these categories until real usage data exists.
  usageCount: number;
  // Only meaningful for Pressure Washer Part units - which composite
  // unit this part is currently serving in, vs. where it was originally
  // registered. Both real, confirmed requirements: track the part's
  // original home permanently, and know where it serves right now.
  originalUnitCode?: string;
  currentUnitCode?: string;
  currentSlot?: number;
  isLocked: boolean;
  lockedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** One real, scanned handover - the audit trail for every movement. */
export interface TrackedMovementEvent {
  id: string;
  unitId: string;                  // FK to TrackedUnit
  cityId: string;
  fromLocation: TrackedUnitLocation | "Supplier";
  fromLocationId?: string;
  toLocation: TrackedUnitLocation | "Repair";
  toLocationId?: string;
  scannedBy: string;                // employeeId
  scannedByName: string;
  timestamp: string;
  notes?: string;
}

/**
 * A real pressure washer unit - the composite model. Each slot holds the
 * barcode of whichever real part is currently serving in it. Starts as
 * {1: "AA1-1", 2: "AA1-2", ...} and genuinely drifts as parts get
 * swapped for repair - confirmed real requirement.
 */
export interface PressureWasherUnit {
  unitCode: string;                 // e.g. "AA1"
  cityId: string;
  currentLocationId?: string;       // travels with the washer/vehicle, not the Kim->Branch chain - confirmed
  slotCount: number;                // real, total number of slots this unit has, set at registration - needed so an empty slot (after a scrap) still shows up, rather than silently vanishing from the slots map
  slots: Record<number, string>;    // slot number -> real part barcode (TrackedUnit id) - only occupied slots are keys here
  createdAt: string;
  updatedAt: string;
}

export interface ScanResult {
  success: boolean;
  unit?: TrackedUnit;
  error?: { type: "NOT_FOUND" | "LOCKED" | "RETIRED" | "SCRAPPED" | "INVALID_TRANSITION"; message: string };
}
