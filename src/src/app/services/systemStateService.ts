/**
 * System State Service
 * Handles offline mode, sync status, and system-level states
 */

export type SyncStatus = "SYNCED" | "PENDING" | "FAILED" | "OFFLINE";
export type ConnectionStatus = "ONLINE" | "OFFLINE";

export interface OfflineSubmission {
  id: string;
  type: "AUDIT" | "LEAD";
  data: any;
  timestamp: Date;
  syncStatus: SyncStatus;
  retryCount: number;
  flagged: boolean;
}

export interface SystemState {
  isOnline: boolean;
  lastSyncTime?: Date;
  pendingSyncs: number;
  failedSyncs: number;
  offlineSubmissions: OfflineSubmission[];
}

class SystemStateService {
  private isOnlineStatus: boolean = true;
  private offlineQueue: OfflineSubmission[] = [];

  // ========== CONNECTION STATUS ==========

  getConnectionStatus(): ConnectionStatus {
    // In production: Use navigator.onLine + backend health check
    return this.isOnlineStatus ? "ONLINE" : "OFFLINE";
  }

  setOfflineMode(isOffline: boolean): void {
    this.isOnlineStatus = !isOffline;
    console.log(
      isOffline ? "🟠 Offline Mode Active" : "🟢 Online Mode Restored"
    );
  }

  // ========== OFFLINE SUBMISSION HANDLING ==========

  saveOfflineSubmission(
    type: "AUDIT" | "LEAD",
    data: any
  ): OfflineSubmission {
    const submission: OfflineSubmission = {
      id: `OFFLINE-${Date.now()}`,
      type,
      data,
      timestamp: new Date(),
      syncStatus: "PENDING",
      retryCount: 0,
      flagged: true, // All offline submissions are flagged
    };

    this.offlineQueue.push(submission);
    console.log("💾 Saved Locally — Sync Pending", submission);

    // In production: Store in IndexedDB/LocalStorage
    return submission;
  }

  getPendingSubmissions(): OfflineSubmission[] {
    return this.offlineQueue.filter((s) => s.syncStatus === "PENDING");
  }

  getFailedSubmissions(): OfflineSubmission[] {
    return this.offlineQueue.filter((s) => s.syncStatus === "FAILED");
  }

  // ========== SYNC OPERATIONS ==========

  async syncPendingSubmissions(): Promise<{
    success: number;
    failed: number;
  }> {
    if (!this.isOnlineStatus) {
      console.log("⚠️ Cannot sync — Still offline");
      return { success: 0, failed: 0 };
    }

    console.log("🔄 Auto-sync started...");
    
    let successCount = 0;
    let failedCount = 0;

    for (const submission of this.offlineQueue) {
      if (submission.syncStatus !== "PENDING") continue;

      try {
        // Simulate API call
        await this.syncSubmission(submission);
        submission.syncStatus = "SYNCED";
        successCount++;
        console.log(`✅ Synced: ${submission.type} ${submission.id}`);
      } catch (error) {
        submission.syncStatus = "FAILED";
        submission.retryCount++;
        failedCount++;
        console.error(`⚠️ Failed Sync: ${submission.id}`, error);
      }
    }

    // Remove synced items
    this.offlineQueue = this.offlineQueue.filter(
      (s) => s.syncStatus !== "SYNCED"
    );

    return { success: successCount, failed: failedCount };
  }

  private async syncSubmission(submission: OfflineSubmission): Promise<void> {
    // In production: POST to appropriate endpoint
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error("Network timeout"));
        }
      }, 1000);
    });
  }

  retrySingleSubmission(submissionId: string): void {
    const submission = this.offlineQueue.find((s) => s.id === submissionId);
    if (submission) {
      submission.syncStatus = "PENDING";
      console.log("🔄 Retry queued:", submissionId);
    }
  }

  // ========== SYSTEM STATE SUMMARY ==========

  getSystemState(): SystemState {
    const pendingSyncs = this.offlineQueue.filter(
      (s) => s.syncStatus === "PENDING"
    ).length;
    const failedSyncs = this.offlineQueue.filter(
      (s) => s.syncStatus === "FAILED"
    ).length;

    return {
      isOnline: this.isOnlineStatus,
      lastSyncTime: new Date(), // In production: track actual last sync
      pendingSyncs,
      failedSyncs,
      offlineSubmissions: this.offlineQueue,
    };
  }

  // ========== GPS VALIDATION ==========

  validateGPSDistance(distance: number): {
    isValid: boolean;
    requiresReason: boolean;
    status: "IDEAL" | "ACCEPTABLE_WITH_REASON" | "OUT_OF_RANGE";
  } {
    if (distance <= 10) {
      return { isValid: true, requiresReason: false, status: "IDEAL" };
    } else if (distance <= 25) {
      return {
        isValid: true,
        requiresReason: true,
        status: "ACCEPTABLE_WITH_REASON",
      };
    } else {
      return {
        isValid: false,
        requiresReason: true,
        status: "OUT_OF_RANGE",
      };
    }
  }

  // ========== PHOTO AUTHENTICITY ==========

  validatePhotoMetadata(
    photoTimestamp: Date,
    photoGPS: { lat: number; lng: number },
    submissionTime: Date,
    submissionGPS: { lat: number; lng: number }
  ): {
    isValid: boolean;
    timestampMismatch: boolean;
    gpsMismatch: boolean;
    requiresFlagging: boolean;
  } {
    // Check timestamp (5 minute threshold)
    const timeDiffMinutes =
      Math.abs(submissionTime.getTime() - photoTimestamp.getTime()) / 1000 / 60;
    const timestampMismatch = timeDiffMinutes > 5;

    // Check GPS (simplified - would use Haversine in production)
    const latDiff = Math.abs(photoGPS.lat - submissionGPS.lat);
    const lngDiff = Math.abs(photoGPS.lng - submissionGPS.lng);
    const gpsMismatch = latDiff > 0.001 || lngDiff > 0.001; // ~100m

    const isValid = !timestampMismatch && !gpsMismatch;
    const requiresFlagging = timestampMismatch || gpsMismatch;

    return {
      isValid,
      timestampMismatch,
      gpsMismatch,
      requiresFlagging,
    };
  }

  // ========== DUPLICATE DETECTION ==========

  checkDuplicateLead(mobile: string): {
    isDuplicate: boolean;
    leadId?: string;
    submittedDate?: Date;
  } {
    // In production: GET /api/leads/check-duplicate?mobile=X

    // Simulate duplicate detection
    const duplicateNumbers = ["9876543210", "8765432109"];
    const isDuplicate = duplicateNumbers.includes(mobile);

    if (isDuplicate) {
      return {
        isDuplicate: true,
        leadId: `LEAD-${mobile.slice(-4)}`,
        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      };
    }

    return { isDuplicate: false };
  }

  // ========== QR CODE SCANNING ==========

  scanQRCode(): Promise<{ success: boolean; batchId?: string; error?: string }> {
    // In production: Use camera API + QR scanner library
    return new Promise((resolve) => {
      console.log("📸 QR Code Scanner Activated");
      
      // Simulate successful scan after 1 second
      setTimeout(() => {
        const mockBatchIds = ["BATCH-A", "BATCH-B", "BATCH-C", "BATCH-D"];
        const scannedId = mockBatchIds[Math.floor(Math.random() * mockBatchIds.length)];
        
        resolve({
          success: true,
          batchId: scannedId,
        });
      }, 1000);
    });
  }

  verifyQRBatch(batchId: string): {
    isValid: boolean;
    batchInfo?: {
      id: string;
      status: string;
      issuedTo?: string;
      issuedDate?: Date;
    };
  } {
    // In production: GET /api/cloth/batch/:id/verify
    
    console.log("✅ Batch Verified:", batchId);
    return {
      isValid: true,
      batchInfo: {
        id: batchId,
        status: "ACTIVE",
        issuedTo: "Washer-005",
        issuedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    };
  }

  // ========== SLA TRACKING ==========

  calculateSLAStatus(
    issueCreatedAt: Date,
    currentTime: Date
  ): {
    elapsedMinutes: number;
    slaBreached: boolean;
    escalationLevel: "SUPERVISOR" | "OPS_MANAGER" | "CITY_MANAGER";
    urgency: "NORMAL" | "WARNING" | "CRITICAL";
  } {
    const elapsedMinutes = Math.floor(
      (currentTime.getTime() - issueCreatedAt.getTime()) / 1000 / 60
    );

    let escalationLevel: "SUPERVISOR" | "OPS_MANAGER" | "CITY_MANAGER" = "SUPERVISOR";
    let urgency: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
    let slaBreached = false;

    if (elapsedMinutes <= 15) {
      escalationLevel = "SUPERVISOR";
      urgency = "NORMAL";
    } else if (elapsedMinutes <= 30) {
      escalationLevel = "OPS_MANAGER";
      urgency = "WARNING";
    } else {
      escalationLevel = "CITY_MANAGER";
      urgency = "CRITICAL";
      slaBreached = true;
    }

    return {
      elapsedMinutes,
      slaBreached,
      escalationLevel,
      urgency,
    };
  }
}

// Singleton instance
export const systemStateService = new SystemStateService();
