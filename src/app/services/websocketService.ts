const WS_URL = (import.meta.env.VITE_WS_URL || "").trim();
type CC360Event = "cc360:reschedule_requested" | "cc360:reschedule_resolved" | "cc360:job_rescheduled" | "cc360:reschedule_limit_reached" | "cc360:pack_expiry_warning" | "cc360:job_completed";
interface WSMessage { type: "event"|"join"|"ping"|"pong"; event?: CC360Event; payload?: unknown; cityId?: string; }
class WebSocketService {
  private ws: WebSocket | null = null;
  private cityId = "CITY-SURAT";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private enabled = !!WS_URL;
  connect(cityId = "CITY-SURAT") { if (!this.enabled) return; this.cityId = cityId; this._connect(); }
  private _connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;
    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.onopen = () => { this.isConnecting = false; this.reconnectDelay = 2000; this._send({ type: "join", cityId: this.cityId }); };
      this.ws.onmessage = (e) => { try { const msg: WSMessage = JSON.parse(e.data); if (msg.type === "event" && msg.event) window.dispatchEvent(new CustomEvent(msg.event, { detail: msg.payload })); if (msg.type === "ping") this._send({ type: "pong" }); } catch (_) {} };
      this.ws.onerror = () => { this.isConnecting = false; };
      this.ws.onclose = () => { this.isConnecting = false; this.ws = null; this.reconnectTimer = setTimeout(() => { this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay); this._connect(); }, this.reconnectDelay); };
    } catch (_) { this.isConnecting = false; }
  }
  broadcast(event: CC360Event, payload: unknown) { window.dispatchEvent(new CustomEvent(event, { detail: payload })); if (this.ws && this.ws.readyState === WebSocket.OPEN) this._send({ type: "event", event, payload, cityId: this.cityId }); }
  private _send(msg: WSMessage) { try { this.ws?.send(JSON.stringify(msg)); } catch (_) {} }
  disconnect() { if (this.reconnectTimer) clearTimeout(this.reconnectTimer); this.ws?.close(); this.ws = null; }
  get isConnected() { return this.ws?.readyState === WebSocket.OPEN; }
  get isEnabled() { return this.enabled; }
}
export const wsService = new WebSocketService();
export function broadcastRescheduleResolved(jobId: string, newDate: string, newSlot: string, customerName?: string) {
  wsService.broadcast("cc360:reschedule_resolved", { jobId, newDate, newSlot, customerName });
  wsService.broadcast("cc360:job_rescheduled", { jobId, newDate, newSlot, customerName });
}
