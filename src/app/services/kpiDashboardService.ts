/**
 * KPI Dashboard Service
 * Calculates and tracks 4-component KPI structure
 */

export interface KPIComponent {
  name: string;
  weight: number; // Percentage (e.g., 40 for 40%)
  currentValue: number;
  target: number;
  score: number; // Out of weight (e.g., 14/40)
  status: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
  statusColor: string;
  details: string[];
  actionRequired?: string;
}

export interface KPIDashboard {
  overallScore: number; // Out of 100
  overallStatus: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
  threshold: number; // Minimum required (e.g., 70)
  components: {
    leadConversion: KPIComponent;
    retention: KPIComponent;
    auditCompliance: KPIComponent;
    customerComplaints: KPIComponent;
  };
  monthlySnapshot: {
    currentMonth: string;
    averageScore: number;
    trend: "UP" | "DOWN" | "STABLE";
  };
  alerts: string[];
}

class KPIDashboardService {
  private readonly THRESHOLD = 70;

  // Component weights
  private readonly WEIGHTS = {
    CONVERSION: 40,
    RETENTION: 30,
    AUDIT: 20,
    COMPLAINTS: 10,
  };

  // Targets
  private readonly TARGETS = {
    CONVERSION_MIN: 0.3, // 30%
    RETENTION_MIN: 0.8, // 80%
    AUDIT_PER_DAY: 4,
    AUDIT_MAX_DAYS: 4,
    COMPLAINTS_MAX_UNRESOLVED_HOURS: 24,
  };

  // ========== KPI CALCULATION ==========

  getKPIDashboard(supervisorId: string): KPIDashboard {
    // In production: GET /api/supervisor/:id/kpi

    // Mock data
    const leadConversion = this.calculateLeadConversion(0.375); // 37.5%
    const retention = this.calculateRetention(0.75); // 75%
    const auditCompliance = this.calculateAuditCompliance(4.2, 5, 3); // Avg 4.2, today 5, max gap 3 days
    const customerComplaints = this.calculateCustomerComplaints(1, 18); // 1 complaint, unresolved 18 hours

    const overallScore =
      leadConversion.score + retention.score + auditCompliance.score + customerComplaints.score;

    const overallStatus = this.getOverallStatus(overallScore);

    const alerts: string[] = [];
    if (leadConversion.actionRequired) alerts.push(leadConversion.actionRequired);
    if (retention.actionRequired) alerts.push(retention.actionRequired);
    if (auditCompliance.actionRequired) alerts.push(auditCompliance.actionRequired);
    if (customerComplaints.actionRequired) alerts.push(customerComplaints.actionRequired);

    return {
      overallScore,
      overallStatus,
      threshold: this.THRESHOLD,
      components: {
        leadConversion,
        retention,
        auditCompliance,
        customerComplaints,
      },
      monthlySnapshot: {
        currentMonth: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        averageScore: 75,
        trend: "UP",
      },
      alerts,
    };
  }

  // ========== COMPONENT 1: LEAD CONVERSION (40%) ==========

  private calculateLeadConversion(conversionRate: number): KPIComponent {
    const target = this.TARGETS.CONVERSION_MIN;
    const weight = this.WEIGHTS.CONVERSION;

    // Calculate score: if >= 30%, full points; otherwise proportional
    let score = 0;
    if (conversionRate >= target) {
      score = weight; // Full 40 points
    } else {
      score = (conversionRate / target) * weight;
    }

    const status = this.getComponentStatus(conversionRate, target, ">=");
    const statusColor = this.getStatusColor(status);

    const details = [
      `Current Rate: ${(conversionRate * 100).toFixed(1)}%`,
      `Target: ≥${(target * 100).toFixed(0)}%`,
    ];

    let actionRequired: string | undefined;
    if (conversionRate < target) {
      actionRequired = "Lead Quality Review Required";
    }

    return {
      name: "Lead Conversion",
      weight,
      currentValue: conversionRate * 100,
      target: target * 100,
      score,
      status,
      statusColor,
      details,
      actionRequired,
    };
  }

  // ========== COMPONENT 2: RETENTION (30%) ==========

  private calculateRetention(retentionRate: number): KPIComponent {
    const target = this.TARGETS.RETENTION_MIN;
    const weight = this.WEIGHTS.RETENTION;

    // Calculate score
    let score = 0;
    if (retentionRate >= target) {
      score = weight; // Full 30 points
    } else {
      score = (retentionRate / target) * weight;
    }

    const status = this.getComponentStatus(retentionRate, target, ">=");
    const statusColor = this.getStatusColor(status);

    const details = [
      `Current Rate: ${(retentionRate * 100).toFixed(1)}%`,
      `Target: ≥${(target * 100).toFixed(0)}%`,
    ];

    let actionRequired: string | undefined;
    if (retentionRate < 0.6) {
      actionRequired = "Ops Manager Flag — Retention <60%";
    } else if (retentionRate < target) {
      actionRequired = "Retention Improvement Required";
    }

    return {
      name: "Retention",
      weight,
      currentValue: retentionRate * 100,
      target: target * 100,
      score,
      status,
      statusColor,
      details,
      actionRequired,
    };
  }

  // ========== COMPONENT 3: AUDIT COMPLIANCE (20%) ==========

  private calculateAuditCompliance(
    avgAuditsPerDay: number,
    todayAudits: number,
    maxGapDays: number
  ): KPIComponent {
    const targetPerDay = this.TARGETS.AUDIT_PER_DAY;
    const maxAllowedGap = this.TARGETS.AUDIT_MAX_DAYS;
    const weight = this.WEIGHTS.AUDIT;

    // Score calculation: 50% for daily count, 50% for gap compliance
    const dailyScore = (avgAuditsPerDay / targetPerDay) * (weight / 2);
    const gapScore = maxGapDays <= maxAllowedGap ? weight / 2 : 0;
    const score = Math.min(weight, dailyScore + gapScore);

    const status =
      avgAuditsPerDay >= targetPerDay && maxGapDays <= maxAllowedGap
        ? "EXCELLENT"
        : avgAuditsPerDay >= targetPerDay * 0.75
        ? "GOOD"
        : "WARNING";

    const statusColor = this.getStatusColor(status);

    const details = [
      `Average: ${avgAuditsPerDay.toFixed(1)} audits/day`,
      `Today: ${todayAudits} audits`,
      `Max Gap: ${maxGapDays} days`,
      `Target: ≥${targetPerDay}/day, Every washer ≤${maxAllowedGap} days`,
    ];

    let actionRequired: string | undefined;
    if (avgAuditsPerDay < targetPerDay) {
      actionRequired = "KPI Deduction Applied — Audit Target Missed";
    }

    return {
      name: "Audit Compliance",
      weight,
      currentValue: avgAuditsPerDay,
      target: targetPerDay,
      score,
      status,
      statusColor,
      details,
      actionRequired,
    };
  }

  // ========== COMPONENT 4: CUSTOMER COMPLAINTS (10%) ==========

  private calculateCustomerComplaints(
    unresolvedCount: number,
    oldestUnresolvedHours: number
  ): KPIComponent {
    const maxHours = this.TARGETS.COMPLAINTS_MAX_UNRESOLVED_HOURS;
    const weight = this.WEIGHTS.COMPLAINTS;

    // Score: Full points if no unresolved >24h complaints
    let score = weight;
    if (unresolvedCount > 0 && oldestUnresolvedHours > maxHours) {
      score = 0; // Zero points if any complaint is unresolved >24h
    } else if (unresolvedCount > 0) {
      score = weight / 2; // Half points if complaints exist but <24h
    }

    const status =
      unresolvedCount === 0
        ? "EXCELLENT"
        : oldestUnresolvedHours <= maxHours
        ? "GOOD"
        : "CRITICAL";

    const statusColor = this.getStatusColor(status);

    const details = [
      `Unresolved: ${unresolvedCount}`,
      unresolvedCount > 0
        ? `Oldest: ${oldestUnresolvedHours}h`
        : "Zero unresolved complaints",
      `Target: Zero >${maxHours}h`,
    ];

    let actionRequired: string | undefined;
    if (oldestUnresolvedHours > maxHours) {
      actionRequired = "Immediate Resolution Required — Complaint >24h";
    }

    return {
      name: "Customer Complaints",
      weight,
      currentValue: unresolvedCount,
      target: 0,
      score,
      status,
      statusColor,
      details,
      actionRequired,
    };
  }

  // ========== STATUS HELPERS ==========

  private getComponentStatus(
    current: number,
    target: number,
    comparison: ">=" | "<="
  ): "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL" {
    if (comparison === ">=") {
      if (current >= target * 1.1) return "EXCELLENT";
      if (current >= target) return "GOOD";
      if (current >= target * 0.8) return "WARNING";
      return "CRITICAL";
    } else {
      if (current <= target * 0.5) return "EXCELLENT";
      if (current <= target) return "GOOD";
      if (current <= target * 1.5) return "WARNING";
      return "CRITICAL";
    }
  }

  private getOverallStatus(score: number): "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL" {
    if (score >= 90) return "EXCELLENT";
    if (score >= this.THRESHOLD) return "GOOD";
    if (score >= 50) return "WARNING";
    return "CRITICAL";
  }

  private getStatusColor(status: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL"): string {
    switch (status) {
      case "EXCELLENT":
        return "green";
      case "GOOD":
        return "blue";
      case "WARNING":
        return "yellow";
      case "CRITICAL":
        return "red";
    }
  }
}

// Singleton instance
export const kpiDashboardService = new KPIDashboardService();
