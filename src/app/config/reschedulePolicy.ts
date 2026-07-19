/**
 * reschedulePolicy — real, adjustable rules for customer reschedule
 * requests. Previously, a customer could directly change their own
 * booking's date/time with no oversight. Corrected based on real
 * feedback: rescheduling should be a request the business approves,
 * governed by a real, configurable policy — not silent self-service.
 */

export const RESCHEDULE_POLICY = {
  // How many hours before the scheduled slot a request can still be made.
  minHoursBeforeSlot: 24,
  // How many times a single booking can be rescheduled before the
  // customer is asked to contact support directly instead.
  maxReschedulesPerBooking: 2,
};

export function isReschedulePermitted(
  scheduledDate: string,
  timeSlot: string,
  rescheduleCount: number
): { allowed: boolean; reason?: string } {
  if (rescheduleCount >= RESCHEDULE_POLICY.maxReschedulesPerBooking) {
    return { allowed: false, reason: `This booking has already been rescheduled ${rescheduleCount} time(s) — please contact support for further changes.` };
  }
  // Slot format is a text range like "6:00 AM - 8:00 AM"; use the start
  // time to compute a real hours-before check.
  const startTimeText = timeSlot.split("-")[0]?.trim();
  const slotDateTime = startTimeText ? new Date(`${scheduledDate} ${startTimeText}`) : new Date(scheduledDate);
  const hoursUntilSlot = (slotDateTime.getTime() - Date.now()) / 3600000;
  if (hoursUntilSlot < RESCHEDULE_POLICY.minHoursBeforeSlot) {
    return { allowed: false, reason: `Reschedule requests need to be made at least ${RESCHEDULE_POLICY.minHoursBeforeSlot} hours before your scheduled time.` };
  }
  return { allowed: true };
}
