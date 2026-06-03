/**
 * ============================================================================
 * CENTRALIZED LOGGING SERVICE
 * ============================================================================
 *
 * Purpose:
 * - Single point of control for all application logging
 * - Environment-based log suppression
 * - Structured logging support
 * - No sensitive data exposure in production
 *
 * Usage:
 * - logger.debug() - Development only, suppressed in production
 * - logger.log() - Info-level logs, development only
 * - logger.warn() - Warnings, shown in all environments
 * - logger.error() - Errors, shown in all environments
 *
 * Rule: Do NOT use console.log directly - always use this logger
 *
 * ============================================================================
 */

type LogLevel = 'debug' | 'log' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  }

  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    if (context) {
      console.log(`[DEBUG] ${message}`, this.sanitizeContext(context));
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }

  /**
   * Info-level logging (development only)
   * Use for general informational messages
   */
  log(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    if (context) {
      console.log(`[INFO] ${message}`, this.sanitizeContext(context));
    } else {
      console.log(`[INFO] ${message}`);
    }
  }

  /**
   * Warning-level logging (all environments)
   * Use for non-critical issues that should be investigated
   */
  warn(message: string, context?: LogContext): void {
    if (context) {
      console.warn(`[WARN] ${message}`, this.sanitizeContext(context));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Error-level logging (all environments)
   * Use for errors that need immediate attention
   */
  error(message: string, error?: Error | LogContext): void {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      });
    } else if (error) {
      console.error(`[ERROR] ${message}`, this.sanitizeContext(error));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Sanitize context to remove sensitive data
   * Redacts: names, IDs, personal information
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sensitiveKeys = [
      'employeeName',
      'name',
      'phoneNumber',
      'phone',
      'email',
      'address',
      'password',
      'token',
      'apiKey',
      'secret',
    ];

    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive keys
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Group logging for related messages (development only)
   */
  group(label: string): void {
    if (!this.isDevelopment) return;
    console.group(label);
  }

  /**
   * End grouped logging (development only)
   */
  groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogContext };

// ─── Storage Monitoring & Error Reporting ────────────────────────────────────

/** Check localStorage usage — warn when approaching 5MB browser limit */
export function checkStorageQuota(): {
  used: number; total: number; percentUsed: number; isNearLimit: boolean;
} {
  try {
    let used = 0;
    for (const key of Object.keys(localStorage)) {
      used += ((localStorage.getItem(key) || "").length) * 2; // UTF-16 = 2 bytes/char
    }
    const total = 5 * 1024 * 1024; // 5MB typical browser limit
    const percentUsed = (used / total) * 100;
    return { used, total, percentUsed, isNearLimit: percentUsed > 80 };
  } catch {
    return { used: 0, total: 5242880, percentUsed: 0, isNearLimit: false };
  }
}

/** Report an error to local error log (always, not just dev mode) */
export function reportError(error: Error, context?: Record<string, unknown>): void {
  // Always log to console.error
  console.error("[CleanCar360]", error.message, context || "");
  // Persist to localStorage for later retrieval
  try {
    const raw = localStorage.getItem("cc360_error_log");
    const log: unknown[] = raw ? JSON.parse(raw) : [];
    log.push({
      message: error.message,
      stack: error.stack?.slice(0, 500),
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 100),
    });
    // Keep only last 50 errors to avoid bloat
    if (log.length > 50) log.splice(0, log.length - 50);
    localStorage.setItem("cc360_error_log", JSON.stringify(log));
  } catch { /* storage full — silent fail */ }
}

/** Retrieve stored error log for support/debugging */
export function getErrorLog(): unknown[] {
  try { return JSON.parse(localStorage.getItem("cc360_error_log") || "[]"); }
  catch { return []; }
}
