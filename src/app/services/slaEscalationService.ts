import { rescheduleService, type RescheduleRequest } from "./whatsappRescheduleHandler";
import { railwaySync } from "./railwaySyncService";
export interface SLABreach { requestId: string; customerName: string; customerPhone: string; pendingMinutes: number; requestedAt: string; source: RescheduleRequest["source"]; }
const SLA_MINUTES = 60;
const CHECK_INTERVAL_MS = 60 * 1000;
class SLAEscalationService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private notifiedIds = new Set<string>();
  start() { if (this.timer) return; this.check(); this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS); }
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  check() {
    try {
      const pending = rescheduleService.getPendingRequests();
      const now = Date.now();
      const breaches: SLABreach[] = [];
      for (const req of pending) {
        const pendingMinutes = Math.floor((now - new Date(req.requestedAt).getTime()) / 60000);
        if (pendingMinutes >= SLA_MINUTES && !this.notifiedIds.has(req.id)) {
          breaches.push({ requestId: req.id, customerName: req.customerName, customerPhone: req.customerPhone, pendingMinutes, requestedAt: req.requestedAt, source: req.source });
          this.notifiedIds.add(req.id);
        }
      }
      if (breaches.length > 0) {
        window.dispatchEvent(new CustomEvent("cc360:sla_breach", { detail: { breaches, totalBreached: breaches.length } }));
        breaches.forEach(breach => railwaySync.reschedule({ type: "SLA_BREACH", ...breach, detectedAt: new Date().toISOString() }));
      }
      const pendingIds = new Set(pending.map(r => r.id));
      for (const id of this.notifiedIds) { if (!pendingIds.has(id)) this.notifiedIds.delete(id); }
    } catch (_) {}
  }
  getBreachedRequests(): SLABreach[] {
    try {
      const now = Date.now();
      return rescheduleService.getPendingRequests()
        .filter(req => Math.floor((now - new Date(req.requestedAt).getTime()) / 60000) >= SLA_MINUTES)
        .map(req => ({ requestId: req.id, customerName: req.customerName, customerPhone: req.customerPhone, pendingMinutes: Math.floor((now - new Date(req.requestedAt).getTime()) / 60000), requestedAt: req.requestedAt, source: req.source }));
    } catch { return []; }
  }
}
export const slaEscalationService = new SLAEscalationService();
