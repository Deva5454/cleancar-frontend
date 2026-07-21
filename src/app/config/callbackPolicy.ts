/**
 * callbackPolicy — real, adjustable rules for when a customer can
 * request a callback. Working days deliberately exclude Sunday, to stay
 * consistent with the real "Sunday is an absolute rest day" business
 * rule already enforced in createJob() — a TSE callback slot shouldn't
 * be offered on a day the business itself treats as fully closed.
 */

export const CALLBACK_POLICY = {
  officeStartHour: 9,  // 9:00 AM
  officeEndHour: 19,   // 7:00 PM
  workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat (0 = Sunday, excluded)
};

export function isWithinCallbackWindow(dateStr: string, hour: number): { valid: boolean; reason?: string } {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { valid: false, reason: "Please pick a valid date" };
  if (!CALLBACK_POLICY.workingDays.includes(date.getDay())) {
    return { valid: false, reason: "We're closed on Sundays — please pick a working day." };
  }
  if (hour < CALLBACK_POLICY.officeStartHour || hour >= CALLBACK_POLICY.officeEndHour) {
    return { valid: false, reason: `Please pick a time between ${CALLBACK_POLICY.officeStartHour}:00 AM and ${CALLBACK_POLICY.officeEndHour - 12}:00 PM.` };
  }
  const now = new Date();
  const requested = new Date(dateStr);
  requested.setHours(hour, 0, 0, 0);
  if (requested.getTime() < now.getTime()) {
    return { valid: false, reason: "Please pick a time in the future." };
  }
  return { valid: true };
}

export const CALLBACK_HOUR_OPTIONS = Array.from(
  { length: CALLBACK_POLICY.officeEndHour - CALLBACK_POLICY.officeStartHour },
  (_, i) => CALLBACK_POLICY.officeStartHour + i
);
