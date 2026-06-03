/**
 * Attendance Trust Score Service
 *
 * AI-based trust scoring for employee attendance patterns
 * Flags suspicious entries and tracks reliability
 */

import { DataService } from "./DataService";
import { attendanceMaster } from "./attendanceMaster";
import { logger } from "./logger";

// ========== TYPES ==========

export type TrustLevel = "High" | "Medium" | "Low" | "Critical";

export interface TrustScore {
  employeeId: string;
  employeeName: string;
  overallScore: number; // 0-100
  trustLevel: TrustLevel;
  lastCalculated: string;

  // Score components
  punctualityScore: number; // 0-100
  consistencyScore: number; // 0-100
  gpsAccuracyScore: number; // 0-100
  checkoutComplianceScore: number; // 0-100

  // Flags
  flags: SuspiciousFlag[];
  flagCount: number;

  // Statistics
  stats: {
    totalDays: number;
    lateDays: number;
    missingCheckouts: number;
    gpsMismatches: number;
    overtimeDays: number;
    averageCheckInTime: string; // "09:15"
  };
}

export interface SuspiciousFlag {
  flagId: string;
  date: string;
  type: FlagType;
  severity: "Low" | "Medium" | "High";
  description: string;
  impactOnScore: number;
}

export type FlagType =
  | "GPS_MISMATCH"
  | "LATE_PATTERN"
  | "MISSING_CHECKOUT"
  | "OVERTIME_ANOMALY"
  | "INCONSISTENT_HOURS"
  | "SUSPICIOUS_LOCATION";

// ========== SERVICE ==========

class AttendanceTrustScoreService {
  private readonly STORAGE_KEY = "ATTENDANCE_TRUST_SCORES";

  /**
   * Calculate trust score for employee
   */
  calculateTrustScore(employeeId: string, employeeName: string): TrustScore {
    const attendanceRecords = attendanceMaster.getByEmployee(employeeId);

    if (attendanceRecords.length === 0) {
      return this.createDefaultScore(employeeId, employeeName);
    }

    // Calculate score components
    const punctualityScore = this.calculatePunctualityScore(attendanceRecords);
    const consistencyScore = this.calculateConsistencyScore(attendanceRecords);
    const gpsAccuracyScore = this.calculateGPSAccuracyScore(attendanceRecords);
    const checkoutComplianceScore = this.calculateCheckoutComplianceScore(attendanceRecords);

    // Weighted overall score
    const overallScore = Math.round(
      punctualityScore * 0.3 +
      consistencyScore * 0.25 +
      gpsAccuracyScore * 0.25 +
      checkoutComplianceScore * 0.2
    );

    // Generate flags
    const flags = this.generateSuspiciousFlags(attendanceRecords);

    // Calculate statistics
    const stats = this.calculateStatistics(attendanceRecords);

    const trustScore: TrustScore = {
      employeeId,
      employeeName,
      overallScore,
      trustLevel: this.determineTrustLevel(overallScore, flags.length),
      lastCalculated: new Date().toISOString(),
      punctualityScore,
      consistencyScore,
      gpsAccuracyScore,
      checkoutComplianceScore,
      flags,
      flagCount: flags.length,
      stats,
    };

    this.saveTrustScore(trustScore);
    return trustScore;
  }

  /**
   * Get all trust scores
   */
  getAllScores(): TrustScore[] {
    return DataService.get<TrustScore>(this.STORAGE_KEY);
  }

  /**
   * Get trust score by employee
   */
  getByEmployee(employeeId: string): TrustScore | null {
    const scores = this.getAllScores();
    return scores.find(s => s.employeeId === employeeId) || null;
  }

  /**
   * Get employees by trust level
   */
  getByTrustLevel(level: TrustLevel): TrustScore[] {
    return this.getAllScores().filter(s => s.trustLevel === level);
  }

  /**
   * Get flagged employees
   */
  getFlaggedEmployees(minFlags: number = 1): TrustScore[] {
    return this.getAllScores()
      .filter(s => s.flagCount >= minFlags)
      .sort((a, b) => b.flagCount - a.flagCount);
  }

  /**
   * Recalculate all scores
   */
  recalculateAll(employees: Array<{ employeeId: string; name: string }>): void {
    employees.forEach(emp => {
      this.calculateTrustScore(emp.employeeId, emp.name);
    });
    logger.log("TrustScore: Recalculated all scores", { count: employees.length });
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Calculate punctuality score (0-100)
   */
  private calculatePunctualityScore(records: any[]): number {
    if (records.length === 0) return 100;

    const workingRecords = records.filter(r => r.status === "Present");
    if (workingRecords.length === 0) return 100;

    const lateCount = workingRecords.filter(r => {
      if (!r.checkInTime) return false;
      const checkIn = r.checkInTime.split(':');
      const checkInMinutes = parseInt(checkIn[0]) * 60 + parseInt(checkIn[1]);
      return checkInMinutes > 9 * 60 + 15; // After 9:15 AM is late
    }).length;

    const latePercentage = (lateCount / workingRecords.length) * 100;
    return Math.max(0, 100 - latePercentage * 2); // Penalty: -2 per % late
  }

  /**
   * Calculate consistency score (0-100)
   */
  private calculateConsistencyScore(records: any[]): number {
    if (records.length < 7) return 100; // Need at least 1 week

    const workingRecords = records.filter(r => r.status === "Present" && r.checkInTime);
    if (workingRecords.length < 5) return 80;

    // Calculate check-in time variance
    const checkInMinutes = workingRecords.map(r => {
      const parts = r.checkInTime.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    });

    const avg = checkInMinutes.reduce((a, b) => a + b, 0) / checkInMinutes.length;
    const variance = checkInMinutes.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / checkInMinutes.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = more consistent = higher score
    // StdDev of 30 minutes = 75 score, 60 minutes = 50 score
    return Math.max(0, Math.min(100, 100 - stdDev));
  }

  /**
   * Calculate GPS accuracy score (0-100)
   */
  private calculateGPSAccuracyScore(records: any[]): number {
    if (records.length === 0) return 100;

    const flaggedRecords = records.filter(r =>
      r.flag && r.flag !== "NONE" && r.flag.includes("GPS")
    );

    const flagPercentage = (flaggedRecords.length / records.length) * 100;
    return Math.max(0, 100 - flagPercentage * 3); // Penalty: -3 per % flagged
  }

  /**
   * Calculate checkout compliance score (0-100)
   */
  private calculateCheckoutComplianceScore(records: any[]): number {
    const workingRecords = records.filter(r => r.status === "Present");
    if (workingRecords.length === 0) return 100;

    const missingCheckouts = workingRecords.filter(r => !r.checkOutTime).length;
    const missingPercentage = (missingCheckouts / workingRecords.length) * 100;

    return Math.max(0, 100 - missingPercentage * 2.5); // Penalty: -2.5 per % missing
  }

  /**
   * Generate suspicious flags
   */
  private generateSuspiciousFlags(records: any[]): SuspiciousFlag[] {
    const flags: SuspiciousFlag[] = [];

    records.forEach(record => {
      // GPS mismatch flag
      if (record.flag === "GPS_MISMATCH") {
        flags.push({
          flagId: `FLAG-${record.attendanceId}`,
          date: record.date,
          type: "GPS_MISMATCH",
          severity: "High",
          description: "GPS location does not match designated work location",
          impactOnScore: -10,
        });
      }

      // Missing checkout flag
      if (record.status === "Present" && !record.checkOutTime) {
        flags.push({
          flagId: `FLAG-${record.attendanceId}-CHECKOUT`,
          date: record.date,
          type: "MISSING_CHECKOUT",
          severity: "Medium",
          description: "No checkout time recorded",
          impactOnScore: -5,
        });
      }

      // Late pattern (after 9:15 AM)
      if (record.checkInTime) {
        const parts = record.checkInTime.split(':');
        const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        if (minutes > 9 * 60 + 15) {
          const lateBy = minutes - (9 * 60);
          if (lateBy > 60) { // More than 1 hour late
            flags.push({
              flagId: `FLAG-${record.attendanceId}-LATE`,
              date: record.date,
              type: "LATE_PATTERN",
              severity: "High",
              description: `Check-in at ${record.checkInTime} (${Math.floor(lateBy / 60)}h ${lateBy % 60}m late)`,
              impactOnScore: -8,
            });
          }
        }
      }

      // Overtime anomaly (>12 hours)
      if (record.hoursWorked && record.hoursWorked > 12) {
        flags.push({
          flagId: `FLAG-${record.attendanceId}-OT`,
          date: record.date,
          type: "OVERTIME_ANOMALY",
          severity: "Medium",
          description: `Unusually high hours: ${record.hoursWorked}h`,
          impactOnScore: -3,
        });
      }
    });

    return flags.slice(0, 20); // Keep most recent 20 flags
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(records: any[]): TrustScore["stats"] {
    const workingRecords = records.filter(r => r.status === "Present");

    const lateDays = workingRecords.filter(r => {
      if (!r.checkInTime) return false;
      const parts = r.checkInTime.split(':');
      const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      return minutes > 9 * 60 + 15;
    }).length;

    const missingCheckouts = workingRecords.filter(r => !r.checkOutTime).length;

    const gpsMismatches = records.filter(r =>
      r.flag && r.flag !== "NONE" && r.flag.includes("GPS")
    ).length;

    const overtimeDays = workingRecords.filter(r => r.hoursWorked && r.hoursWorked > 9).length;

    // Calculate average check-in time
    const checkInTimes = workingRecords
      .filter(r => r.checkInTime)
      .map(r => {
        const parts = r.checkInTime.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      });

    const avgMinutes = checkInTimes.length > 0
      ? checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length
      : 9 * 60; // Default 9:00 AM

    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = Math.round(avgMinutes % 60);
    const averageCheckInTime = `${String(avgHours).padStart(2, '0')}:${String(avgMins).padStart(2, '0')}`;

    return {
      totalDays: records.length,
      lateDays,
      missingCheckouts,
      gpsMismatches,
      overtimeDays,
      averageCheckInTime,
    };
  }

  /**
   * Determine trust level
   */
  private determineTrustLevel(score: number, flagCount: number): TrustLevel {
    if (flagCount >= 10 || score < 50) return "Critical";
    if (flagCount >= 5 || score < 70) return "Low";
    if (score < 85) return "Medium";
    return "High";
  }

  /**
   * Create default score
   */
  private createDefaultScore(employeeId: string, employeeName: string): TrustScore {
    return {
      employeeId,
      employeeName,
      overallScore: 100,
      trustLevel: "High",
      lastCalculated: new Date().toISOString(),
      punctualityScore: 100,
      consistencyScore: 100,
      gpsAccuracyScore: 100,
      checkoutComplianceScore: 100,
      flags: [],
      flagCount: 0,
      stats: {
        totalDays: 0,
        lateDays: 0,
        missingCheckouts: 0,
        gpsMismatches: 0,
        overtimeDays: 0,
        averageCheckInTime: "09:00",
      },
    };
  }

  /**
   * Save trust score
   */
  private saveTrustScore(score: TrustScore): void {
    const scores = this.getAllScores();
    const index = scores.findIndex(s => s.employeeId === score.employeeId);

    if (index >= 0) {
      scores[index] = score;
    } else {
      scores.push(score);
    }

    DataService.setAll(this.STORAGE_KEY, scores);
  }
}

// ========== EXPORT ==========

export const attendanceTrustScoreService = new AttendanceTrustScoreService();
