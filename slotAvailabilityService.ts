/**
 * slotAvailabilityService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Computes available 1-hr time slots for one-time bookings.
 *
 * A slot is HIDDEN if ALL washers in the customer's pincode are booked.
 * A washer is BOOKED if their job status is "In Progress" OR "Assigned" (in transit).
 *
 * In production this would be a server-side API call:
 *   GET /api/slots/available?pincode=395009&date=2026-06-09
 *
 * Currently: computed client-side from JobContext state.
 */

import { DataService } from "./DataService";
import { organizationHierarchyService } from "./organizationHierarchyService";

export interface SlotInfo {
  hour: number;           // 5..21 (5AM..9PM)
  label: string;          // "5:00 AM – 6:00 AM"
  available: boolean;     // false = hide from customer
  idleWashers: number;    // how many idle in pincode for this slot
  totalWashers: number;
}

export interface SlotAvailabilityResult {
  date: string;           // YYYY-MM-DD
  pincode: string;
  slots: SlotInfo[];
  allBooked: boolean;     // true = show "no slots available" message
}

function getJobsForDateSlot(allJobs: any[], date: string, hour: number, washerIds: string[]): string[] {
  // Returns washerIds that are booked in the given 1-hr slot
  return allJobs
    .filter(j => {
      if (!washerIds.includes(j.washerId || "")) return false;
      if (j.status !== "In Progress" && j.status !== "Assigned") return false;
      // Check if job overlaps this slot
      const jobDate = (j.scheduledDate || j.date || "").slice(0, 10);
      if (jobDate !== date) return false;
      // If scheduledTime exists, check overlap
      if (j.scheduledTime) {
        const jobHour = parseInt(j.scheduledTime.split(":")[0]);
        return Math.abs(jobHour - hour) < 1;
      }
      return true; // no time info — conservatively mark as booked
    })
    .map(j => j.washerId);
}

export function getSlotAvailability(pincode: string, date: string): SlotAvailabilityResult {
  const pin = organizationHierarchyService.getPincodeByNumber(pincode);
  const teams = pin ? organizationHierarchyService.getActiveTeamsByPincode(pin.id) : [];
  const allWasherIds = teams.flatMap(t => t.washerIds);
  const totalWashers = allWasherIds.length;

  // Read all jobs from DataService
  const allJobs = DataService.get<any>("JOBS");

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const isToday = date === now.toISOString().slice(0, 10);

  const slots: SlotInfo[] = [];

  for (let h = 5; h <= 21; h++) {
    // Skip past hours for same-day bookings
    if (isToday && h <= nowHour + 3) continue; // 3-hr TAT

    const bookedWashers = new Set(getJobsForDateSlot(allJobs, date, h, allWasherIds));
    const idleWashers = Math.max(0, totalWashers - bookedWashers.size);
    const available = totalWashers === 0 || idleWashers > 0;

    const hStr = String(h).padStart(2, "0");
    const hNext = String(h + 1).padStart(2, "0");
    const ampm = (hr: number) => hr < 12 ? "AM" : "PM";
    const h12 = (hr: number) => hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;

    slots.push({
      hour: h,
      label: `${h12(h)}:00 ${ampm(h)} – ${h12(h+1)}:00 ${ampm(h+1)}`,
      available,
      idleWashers,
      totalWashers,
    });
  }

  return {
    date,
    pincode,
    slots,
    allBooked: slots.length > 0 && slots.every(s => !s.available),
  };
}

/**
 * Quick boolean check — used by CustomerPlanPage to filter slot list.
 * Returns set of available hours for a given date + pincode.
 */
export function getAvailableHours(pincode: string, date: string): Set<number> {
  if (!pincode) return new Set(Array.from({length: 17}, (_, i) => i + 5)); // all hours if no pincode
  const result = getSlotAvailability(pincode, date);
  return new Set(result.slots.filter(s => s.available).map(s => s.hour));
}
