/**
 * MonthlySnapshotService — Immutable monthly financial snapshots.
 * Prevents retroactive changes from affecting historical reporting.
 * Call createSnapshot() at month close, lockSnapshot() to make it immutable.
 */
import { logger } from "./logger";

interface SnapshotData {
  totalRevenue: number;
  mrrRevenue: number;
  oneTimeRevenue: number;
  totalExpenses: number;
  ebitdaAmount: number;
  ebitdaMargin: number;
  activeSubscriptions: number;
  totalCustomers: number;
  totalWashes: number;
  totalEmployees: number;
  payrollTotal: number;
}

export interface MonthlySnapshot {
  snapshotId: string;
  yearMonth: string;       // "2026-04"
  createdAt: string;
  createdBy: string;
  isLocked: boolean;
  lockedAt?: string;
  data: SnapshotData;
}

const STORAGE_KEY = "cc360_monthly_snapshots";

class MonthlySnapshotServiceClass {
  private getAll(): MonthlySnapshot[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }

  private saveAll(snapshots: MonthlySnapshot[]): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots)); }
    catch (e) { logger.error("MonthlySnapshotService: Failed to save", e as Error); }
  }

  createSnapshot(
    yearMonth: string,
    data: SnapshotData,
    createdBy: string
  ): MonthlySnapshot {
    const existing = this.getSnapshot(yearMonth);
    if (existing?.isLocked) {
      throw new Error(`Snapshot for ${yearMonth} is locked and cannot be replaced`);
    }

    const snapshot: MonthlySnapshot = {
      snapshotId: `SNAP-${yearMonth}-${Date.now()}`,
      yearMonth,
      createdAt: new Date().toISOString(),
      createdBy,
      isLocked: false,
      data,
    };

    const all = this.getAll();
    const idx = all.findIndex(s => s.yearMonth === yearMonth);
    if (idx >= 0) all[idx] = snapshot; else all.push(snapshot);
    this.saveAll(all);

    logger.log(`MonthlySnapshotService: Snapshot created for ${yearMonth}`, { createdBy });
    return snapshot;
  }

  lockSnapshot(yearMonth: string): void {
    const all = this.getAll().map(s =>
      s.yearMonth === yearMonth
        ? { ...s, isLocked: true, lockedAt: new Date().toISOString() }
        : s
    );
    this.saveAll(all);
    logger.log(`MonthlySnapshotService: Snapshot locked for ${yearMonth}`);
  }

  getSnapshot(yearMonth: string): MonthlySnapshot | undefined {
    return this.getAll().find(s => s.yearMonth === yearMonth);
  }

  getAllSnapshots(): MonthlySnapshot[] {
    return this.getAll().sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  }

  isMonthLocked(yearMonth: string): boolean {
    return this.getSnapshot(yearMonth)?.isLocked === true;
  }
}

export const monthlySnapshotService = new MonthlySnapshotServiceClass();
