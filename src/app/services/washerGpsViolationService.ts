/**
 * Washer GPS Violation Service
 *
 * When a Car Washer's GPS/location is turned off during a checked-in day,
 * they're automatically checked out for the day (handled in
 * WasherCoreScreensConnected.tsx, which listens for the
 * "cc360:location_off_auto_checkout" event that washerLocationService.ts
 * already dispatched but nothing was listening for). This service tracks
 * that violation and the City Manager approval needed before the washer
 * can check in again the same day.
 */
import { DataService } from "./DataService";

export interface WasherGpsViolation {
  id: string;
  washerId: string;
  washerName: string;
  cityId: string;
  date: string; // YYYY-MM-DD — the day this violation applies to
  autoCheckoutAt: string; // ISO timestamp of the auto-checkout
  status: "Pending" | "Approved" | "Rejected";
  requestedAt?: string; // when the washer asked to be let back in
  requestReason?: string;
  reviewedBy?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

class WasherGpsViolationService {
  getAll(cityId: string): WasherGpsViolation[] {
    return DataService.get<WasherGpsViolation>("WASHER_GPS_VIOLATIONS", cityId);
  }

  /** The active (Pending or Rejected) violation blocking this washer's re-check-in today, if any. Approved ones no longer block. */
  getActiveViolationForToday(washerId: string, cityId: string, date: string): WasherGpsViolation | null {
    const all = this.getAll(cityId);
    return all.find(v => v.washerId === washerId && v.date === date && v.status !== "Approved") || null;
  }

  /** Called the moment GPS gets turned off mid-shift — records the violation immediately, before the washer has even asked to be let back in. */
  recordAutoCheckout(washerId: string, washerName: string, cityId: string): WasherGpsViolation {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const violation: WasherGpsViolation = {
      id: `GPSV-${washerId}-${Date.now()}`,
      washerId, washerName, cityId, date,
      autoCheckoutAt: now.toISOString(),
      status: "Pending",
    };
    DataService.insert("WASHER_GPS_VIOLATIONS", violation, cityId);
    return violation;
  }

  /** Washer explicitly asking to be let back in — separate from the violation being recorded, since they might not ask right away. */
  requestReinstatement(violationId: string, cityId: string, reason: string): { success: boolean; error?: string } {
    const all = this.getAll(cityId);
    const idx = all.findIndex(v => v.id === violationId);
    if (idx < 0) return { success: false, error: "Violation record not found" };
    all[idx] = { ...all[idx], requestedAt: new Date().toISOString(), requestReason: reason };
    DataService.setAll("WASHER_GPS_VIOLATIONS", all, cityId);
    return { success: true };
  }

  approve(violationId: string, cityId: string, reviewerName: string, reviewerRole: string, note?: string): { success: boolean; error?: string } {
    const all = this.getAll(cityId);
    const idx = all.findIndex(v => v.id === violationId);
    if (idx < 0) return { success: false, error: "Violation record not found" };
    all[idx] = { ...all[idx], status: "Approved", reviewedBy: reviewerName, reviewedByRole: reviewerRole, reviewedAt: new Date().toISOString(), reviewNote: note };
    DataService.setAll("WASHER_GPS_VIOLATIONS", all, cityId);
    return { success: true };
  }

  reject(violationId: string, cityId: string, reviewerName: string, reviewerRole: string, note?: string): { success: boolean; error?: string } {
    const all = this.getAll(cityId);
    const idx = all.findIndex(v => v.id === violationId);
    if (idx < 0) return { success: false, error: "Violation record not found" };
    all[idx] = { ...all[idx], status: "Rejected", reviewedBy: reviewerName, reviewedByRole: reviewerRole, reviewedAt: new Date().toISOString(), reviewNote: note };
    DataService.setAll("WASHER_GPS_VIOLATIONS", all, cityId);
    return { success: true };
  }

  getPendingForCity(cityId: string): WasherGpsViolation[] {
    return this.getAll(cityId).filter(v => v.status !== "Approved");
  }
}

export const washerGpsViolationService = new WasherGpsViolationService();
