/**
 * EventBus - Simple Pub/Sub Event System
 *
 * Used for real-time sync between contexts:
 * - HRDataContext (writer) publishes EMPLOYEES_UPDATED
 * - EmployeeContext (reader) subscribes and reloads data
 *
 * Benefits:
 * - EmployeeContext always reflects latest data
 * - No polling or manual refresh needed
 * - Decoupled architecture (writer doesn't know about readers)
 */

type Callback = () => void;

class EventBus {
  private events: Record<string, Callback[]> = {};

  subscribe(event: string, callback: Callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  publish(event: string) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb());
  }
}

export const eventBus = new EventBus();
