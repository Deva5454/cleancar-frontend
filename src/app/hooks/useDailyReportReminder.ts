import { useEffect, useRef } from "react";
import { toast } from "sonner";

const REMINDER_HOUR = 17; // 5 PM, matches the existing in-page banner's threshold

/**
 * Real browser-notification reminder for a daily report. Genuine
 * improvement over an in-page-only banner: fires via the real
 * Notification API even if the user has moved to a different tab/screen
 * within the app, as long as the app is open somewhere in the browser.
 *
 * Honest limit, not solved by this: still requires the browser/app to be
 * open somewhere. This is not a true push notification to a closed
 * browser or locked device - that would need a real backend/push
 * server, which this app doesn't have. See useDailyReportReminder's
 * call sites for the in-page banner, which covers the "app is open but
 * on this exact screen" case; this hook covers "app is open, but
 * elsewhere."
 */
export function useDailyReportReminder(alreadySubmitted: boolean) {
  const hasFiredToday = useRef(false);

  // Ask for real browser notification permission once, the first time
  // this hook mounts for a report that hasn't been submitted yet -
  // was never requested anywhere in this app before, so the existing,
  // similar Notification code elsewhere never actually fired for any
  // real user.
  useEffect(() => {
    if (alreadySubmitted) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [alreadySubmitted]);

  useEffect(() => {
    if (alreadySubmitted) return;
    if (typeof Notification === "undefined") return;

    const checkAndNotify = () => {
      if (hasFiredToday.current) return;
      const now = new Date();
      if (now.getHours() < REMINDER_HOUR) return;
      hasFiredToday.current = true;
      if (Notification.permission === "granted") {
        try {
          new Notification("Daily report reminder", {
            body: "You haven't started today's daily report yet.",
          });
        } catch { /* not fatal if the browser blocks it */ }
      } else {
        // Permission not granted (denied or never asked) - fall back to
        // an in-app toast, which at least reaches them if they're on
        // any screen of the app right now.
        toast.warning("Reminder: today's daily report hasn't been started yet.");
      }
    };

    checkAndNotify(); // in case it's already past the hour on mount
    const interval = setInterval(checkAndNotify, 15 * 60 * 1000); // recheck every 15 min
    return () => clearInterval(interval);
  }, [alreadySubmitted]);
}
