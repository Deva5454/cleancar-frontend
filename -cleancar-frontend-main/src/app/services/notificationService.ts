/**
 * NOTIFICATION SERVICE
 * Centralized notification system for user feedback
 */

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

class NotificationService {
  private listeners: ((notification: NotificationOptions) => void)[] = [];

  subscribe(listener: (notification: NotificationOptions) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(notification: NotificationOptions) {
    this.listeners.forEach(listener => listener(notification));
  }

  success(title: string, message: string) {
    this.notify({ title, message, type: "success", duration: 3000 });
  }

  error(title: string, message: string) {
    this.notify({ title, message, type: "error", duration: 5000 });
  }

  warning(title: string, message: string) {
    this.notify({ title, message, type: "warning", duration: 4000 });
  }

  info(title: string, message: string) {
    this.notify({ title, message, type: "info", duration: 3000 });
  }
}

export const notificationService = new NotificationService();
