const QUEUE_KEY = "cleancar_offline_queue";

interface QueuedAction {
  id: string;
  action: string;
  payload: unknown;
  timestamp: string;
  retries: number;
}

export const offlineQueue = {
  add(action: string, payload: unknown): void {
    const queue = this.getAll();
    queue.push({ id: Date.now().toString(), action, payload, timestamp: new Date().toISOString(), retries: 0 });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  getAll(): QueuedAction[] {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
  },

  remove(id: string): void {
    const queue = this.getAll().filter(item => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  count(): number { return this.getAll().length; },

  async flush(handlers: Record<string, (payload: unknown) => Promise<void>>): Promise<void> {
    if (!navigator.onLine) return;
    const queue = this.getAll();
    for (const item of queue) {
      try {
        if (handlers[item.action]) {
          await handlers[item.action](item.payload);
          this.remove(item.id);
        }
      } catch {
        const updated = this.getAll().map(q => q.id === item.id ? { ...q, retries: q.retries + 1 } : q).filter(q => q.retries < 3);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
      }
    }
  },
};
