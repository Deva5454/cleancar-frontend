/**
 * RetryQueue - Resilient Sync Queue
 *
 * Purpose:
 * - Store failed sync operations
 * - Automatic retry with exponential backoff
 * - Prevent data loss during network failures
 * - Persist queue across page refreshes
 *
 * Retry Strategy:
 * - Initial retry: 10 seconds
 * - Max retries: 5 attempts
 * - Backoff: exponential (10s, 20s, 40s, 80s, 160s)
 * - Abandoned after max retries (logged for manual review)
 */

import { logger } from "./logger";
import type { EntityKey } from "./APIService";

interface QueuedOperation<T = any> {
  id: string;
  entityKey: EntityKey;
  operation: "PUSH" | "PULL" | "DELETE";
  data?: T[];
  timestamp: string;
  retryCount: number;
  lastRetry?: string;
  error?: string;
}

class RetryQueueClass {
  private queue: QueuedOperation[] = [];
  private storageKey = "SYNC_RETRY_QUEUE";
  private retryInterval: NodeJS.Timeout | null = null;
  private maxRetries = 5;
  private baseDelay = 10000; // 10 seconds

  constructor() {
    this.loadQueue();
    this.startRetryProcess();
    // Flush queue immediately when network is restored
    window.addEventListener("online", () => {
      console.log("[RetryQueue] Network restored — flushing queued operations");
      this.processQueue();
    });
  }

  /**
   * Load retry queue from storage
   */
  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.debug("RetryQueue loaded", { count: this.queue.length });
      }
    } catch (error) {
      logger.error("RetryQueue: Failed to load queue", error as Error);
    }
  }

  /**
   * Save retry queue to storage
   */
  private saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      logger.error("RetryQueue: Failed to save queue", error as Error);
    }
  }

  /**
   * Add failed operation to retry queue
   */
  enqueue<T>(
    entityKey: EntityKey,
    operation: QueuedOperation["operation"],
    data?: T[],
    error?: string
  ): void {
    const queuedOp: QueuedOperation<T> = {
      id: `RETRY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityKey,
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      error,
    };

    this.queue.push(queuedOp);
    this.saveQueue();

    logger.warn("RetryQueue: Operation queued for retry", {
      id: queuedOp.id,
      entityKey,
      operation,
      error,
    });
  }

  /**
   * Remove operation from queue after success
   */
  dequeue(id: string): void {
    this.queue = this.queue.filter((op) => op.id !== id);
    this.saveQueue();
    logger.debug("RetryQueue: Operation removed", { id });
  }

  /**
   * Get all queued operations
   */
  getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear entire queue (use with caution)
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
    logger.log("RetryQueue: Queue cleared");
  }

  /**
   * Start automatic retry process
   * Runs every 10 seconds
   */
  private startRetryProcess() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }

    this.retryInterval = setInterval(() => {
      this.processRetries();
    }, this.baseDelay);

    logger.debug("RetryQueue: Retry process started");
  }

  /**
   * Stop retry process
   */
  stop() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      logger.debug("RetryQueue: Retry process stopped");
    }
  }

  /**
   * Process retry queue
   * Called automatically every 10 seconds
   */
  private async processRetries() {
    if (this.queue.length === 0) {
      return;
    }

    logger.debug("RetryQueue: Processing retries", { count: this.queue.length });

    // Process each queued operation
    for (const op of this.queue) {
      // Check if ready for retry (exponential backoff)
      if (!this.isReadyForRetry(op)) {
        continue;
      }

      // Check if max retries exceeded
      if (op.retryCount >= this.maxRetries) {
        logger.error("RetryQueue: Max retries exceeded, abandoning operation", {
          id: op.id,
          entityKey: op.entityKey,
          operation: op.operation,
          retryCount: op.retryCount,
        });
        this.dequeue(op.id);
        continue;
      }

      // Attempt retry
      await this.retryOperation(op);
    }
  }

  /**
   * Check if operation is ready for retry (exponential backoff)
   */
  private isReadyForRetry(op: QueuedOperation): boolean {
    if (!op.lastRetry) {
      return true; // First retry
    }

    const lastRetryTime = new Date(op.lastRetry).getTime();
    const now = Date.now();
    const delay = this.baseDelay * Math.pow(2, op.retryCount); // Exponential backoff
    const timeSinceLastRetry = now - lastRetryTime;

    return timeSinceLastRetry >= delay;
  }

  /**
   * Retry a single operation
   */
  private async retryOperation(op: QueuedOperation): Promise<void> {
    logger.debug("RetryQueue: Retrying operation", {
      id: op.id,
      entityKey: op.entityKey,
      operation: op.operation,
      attempt: op.retryCount + 1,
    });

    // Update retry count and timestamp
    const updatedOp = {
      ...op,
      retryCount: op.retryCount + 1,
      lastRetry: new Date().toISOString(),
    };

    const index = this.queue.findIndex((o) => o.id === op.id);
    if (index !== -1) {
      this.queue[index] = updatedOp;
      this.saveQueue();
    }

    // Emit custom event for SyncService to handle
    // SyncService will listen and process the retry
    window.dispatchEvent(
      new CustomEvent("retry-operation", {
        detail: updatedOp,
      })
    );
  }

  /**
   * Get statistics
   */
  getStats() {
    const byEntityKey = this.queue.reduce((acc, op) => {
      acc[op.entityKey] = (acc[op.entityKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byOperation = this.queue.reduce((acc, op) => {
      acc[op.operation] = (acc[op.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.queue.length,
      byEntityKey,
      byOperation,
      oldestRetry: this.queue.length > 0 ? this.queue[0].timestamp : null,
    };
  }
}

/**
 * Singleton instance
 */
export const RetryQueue = new RetryQueueClass();

/**
 * USAGE EXAMPLE
 *
 * ```typescript
 * // Add failed operation to queue
 * RetryQueue.enqueue("CUSTOMERS", "PUSH", customersData, "Network error");
 *
 * // Check queue status
 * const stats = RetryQueue.getStats();
 * console.log("Pending retries:", stats.total);
 *
 * // Clear queue (emergency)
 * RetryQueue.clear();
 * ```
 */
