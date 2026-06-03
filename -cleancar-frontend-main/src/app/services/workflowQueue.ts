/**
 * WorkflowQueue — Priority-based async task queue.
 * Handles payroll sync, report generation, and other background operations
 * without blocking the UI thread.
 */
import { logger } from "./logger";

type WorkflowPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

interface WorkflowJob {
  id: string;
  type: string;
  priority: WorkflowPriority;
  createdAt: string;
  attempts: number;
  maxAttempts: number;
  handler: () => Promise<void>;
}

const PRIORITY_ORDER: WorkflowPriority[] = ["CRITICAL", "HIGH", "NORMAL", "LOW"];

class WorkflowQueueService {
  private queue: WorkflowJob[] = [];
  private isProcessing = false;

  enqueue(
    type: string,
    priority: WorkflowPriority,
    handler: () => Promise<void>
  ): string {
    const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.queue.push({
      id, type, priority,
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
      handler,
    });
    // Sort by priority
    this.queue.sort(
      (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    );
    logger.log(`WorkflowQueue: Enqueued [${priority}] ${type} (queue: ${this.queue.length})`);
    if (!this.isProcessing) this.processNext();
    return id;
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    this.isProcessing = true;
    const job = this.queue.shift()!;
    try {
      await job.handler();
      logger.log(`WorkflowQueue: Completed ${job.type}`);
    } catch (err) {
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        logger.warn(`WorkflowQueue: Retrying ${job.type} (attempt ${job.attempts})`);
        setTimeout(() => {
          this.queue.unshift(job);
          this.processNext();
        }, 1000 * job.attempts); // exponential-ish backoff
        return;
      }
      logger.error(`WorkflowQueue: Failed ${job.type} after ${job.maxAttempts} attempts`, err as Error);
    }
    // Yield to browser event loop between jobs
    setTimeout(() => this.processNext(), 0);
  }

  getQueueLength(): number { return this.queue.length; }
  isIdle(): boolean { return !this.isProcessing && this.queue.length === 0; }
}

export const workflowQueue = new WorkflowQueueService();
