export * from "./types";
export * from "./configService";
export { runIncentiveV7 } from "./run";
export { postToPayroll, lockMonth, payrollLabel, INCENTIVE_CATEGORIES } from "./ledger";
export * as engine from "./engine";
export * from "./store";

let started = false;
/** Called once from main.tsx. Runs shortly after load, then every 15 minutes. Failures never break the app. */
export function startIncentiveV7Scheduler(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  const tick = () => { import("./run").then((m) => { try { m.runIncentiveV7(); } catch { /* ignore */ } }).catch(() => {}); };
  setTimeout(tick, 8000);
  setInterval(tick, 15 * 60 * 1000);
}
