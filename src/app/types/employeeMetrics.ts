/**
 * Employee Metrics Types (MC-12)
 *
 * Performance metrics for AI role suggestion engine
 * Tracks employee behavior patterns and performance indicators
 */

/**
 * Core performance metrics for an employee
 */
export interface EmployeeMetrics {
  employeeId: string;

  // Work output metrics
  jobsCompleted: number;          // Total jobs completed
  jobsAssigned: number;           // Total jobs assigned
  completionRate: number;         // % (jobsCompleted / jobsAssigned * 100)

  // Quality metrics
  customerRating: number;         // Average rating 1-5
  complaintCount: number;         // Number of complaints received
  errorRate: number;              // % of jobs with issues

  // Time metrics
  avgJobTime: number;             // Average minutes per job
  overtimeHours: number;          // Total overtime worked

  // Attendance metrics
  attendanceRate: number;         // % of days present
  lateCount: number;              // Number of late check-ins
  totalDaysWorked: number;        // Total days in employment

  // Financial metrics (for washer/supervisor roles)
  revenueGenerated?: number;      // Total revenue from completed jobs
  avgRevenuePerJob?: number;      // Average revenue per job

  // Team metrics (for supervisor/manager roles)
  teamSize?: number;              // Number of direct reports
  teamProductivity?: number;      // Average team productivity score
  approvalRate?: number;          // % of approvals granted vs rejected

  // Period for these metrics
  periodStart: string;            // Start date for metric calculation
  periodEnd: string;              // End date for metric calculation

  // Calculated scores
  performanceScore?: number;      // Overall performance (0-100)
  growthPotential?: number;       // Potential for promotion (0-100)

  // Metadata
  calculatedAt: string;
  lastUpdated: string;
}

/**
 * Trend data for employee metrics
 */
export interface EmployeeMetricsTrend {
  employeeId: string;
  currentPeriod: EmployeeMetrics;
  previousPeriod: EmployeeMetrics;
  changes: {
    jobsCompleted: number;        // Change from previous period
    customerRating: number;
    attendanceRate: number;
    errorRate: number;
    performanceScore: number;
  };
  trend: "IMPROVING" | "STABLE" | "DECLINING";
}

/**
 * Role-specific requirements
 */
export interface RoleRequirements {
  role: string;

  // Minimum thresholds
  minJobsCompleted?: number;
  minCustomerRating?: number;
  maxErrorRate?: number;
  minAttendanceRate?: number;
  minCompletionRate?: number;

  // Team requirements (for leadership roles)
  requiresTeamExperience?: boolean;
  minTeamSize?: number;

  // Experience requirements
  minDaysWorked?: number;
  minTotalRevenue?: number;

  // Behavioral requirements
  requiresLowComplaintRate?: boolean;
  requiresHighAccuracy?: boolean;
  maxLateCount?: number;
}

/**
 * Role suggestion with confidence score
 */
export interface RoleSuggestion {
  employeeId: string;
  currentRole: string;
  suggestedRole: string;
  confidence: number;             // 0-100%
  reasons: string[];              // Why this role is suggested
  gaps: string[];                 // What employee needs to improve
  readyForPromotion: boolean;
  estimatedReadinessDate?: string; // When employee might be ready
  generatedAt: string;
}

/**
 * Performance alert for anomaly detection
 */
export interface PerformanceAlert {
  employeeId: string;
  employeeName: string;
  type: "UNDERPERFORMING" | "OVERPERFORMING" | "MISMATCHED_ROLE" | "PROMOTION_READY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  metrics: Partial<EmployeeMetrics>;
  recommendedAction: string;
  flaggedAt: string;
}
