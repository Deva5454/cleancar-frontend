/**
 * supervisorIncentiveService.ts
 * Supervisor Incentive Structure v3.0 — June 2026
 *
 * Structure:
 *   Fixed:    ₹16,400 net (not handled here — payroll)
 *   A — KPI Operations Bonus:    ₹0–₹3,000  (KPI score gate for BTL)
 *   B — BTL Lead Bonus:          ₹5–₹10/lead marginal slab  (GATED by KPI ≥70)
 *   C — BTL Lead Bonus Multiplier: 0.5×–1.3× based on churn  (replaces flat retention bonus)
 *   D — BTL Conversion Bonus:    8% of plan (min ₹15, max ₹250) — 60-day hold (GATED by KPI ≥70)
 *   E — Location Milestone:      ₹50/100/250/500 one-time (NOT gated)
 *   F — Attendance + Punctuality: ₹500 + ₹250 (NOT gated)
 *
 * KEY RULE: Components B and D only pay if KPI score ≥ 70 that month.
 * Churn multiplier is applied to Component B — retention directly affects BTL earnings.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KPIScore {
  washerRetention:    number;   // 0–30 pts (target: ≥80% retention)
  auditCompliance:    number;   // 0–20 pts (target: ≥4 audits/day, no washer >4 days gap)
  complaintSLA:       number;   // 0–10 pts (target: zero complaints unresolved >24h)
  btlConversionRate:  number;   // 0–40 pts (target: ≥30% conversion on submitted leads)
  total:              number;   // 0–100
  threshold:          number;   // 70 — gate for BTL components
  btlUnlocked:        boolean;  // total >= 70
}

export interface ChurnMultiplier {
  churnRate:      number;   // percentage e.g. 3.3
  multiplier:     number;   // 1.3 / 1.0 / 0.7 / 0.5
  label:          string;
  color:          "green" | "gray" | "amber" | "red";
  retentionBonus: boolean;  // multiplier > 1
}

export interface LeadBonus {
  totalLeads:        number;
  qualifiedLeads:    number;   // GPS validated + unique + complete
  slab1Leads:        number;   // 1–100  @ ₹5
  slab2Leads:        number;   // 101–200 @ ₹7
  slab3Leads:        number;   // 201–400 @ ₹8
  slab4Leads:        number;   // 401+    @ ₹10
  rawLeadBonus:      number;   // before multiplier
  churnMultiplier:   number;
  finalLeadBonus:    number;   // after multiplier — only paid if KPI≥70
  gateBlocked:       boolean;  // true if KPI < 70
}

export interface ConversionBonus {
  conversions:       ConversionRecord[];
  totalEligible:     number;   // conversions past 60-day hold
  totalPending:      number;   // within 60-day hold
  totalForfeited:    number;   // customer churned before 60 days
  gateBlocked:       boolean;  // true if KPI < 70 in submission month
}

export interface ConversionRecord {
  leadId:           string;
  customerName:     string;
  planName:         string;
  planValue:        number;
  bonusRate:        number;   // 0.08
  grossBonus:       number;   // planValue × 0.08
  cappedBonus:      number;   // min ₹15, max ₹250
  submissionDate:   Date;
  conversionDate?:  Date;
  holdClearDate?:   Date;     // submissionDate + 60 days
  status:           "PENDING" | "HOLD_ACTIVE" | "PAID" | "FORFEITED" | "GATE_BLOCKED";
}

export interface OpsKPIBonus {
  kpiScore:      number;
  bonus:         number;
  band:          "EXCELLENT" | "GOOD" | "ON_TRACK" | "NEEDS_IMPROVEMENT" | "AT_RISK";
}

export interface MilestoneBonus {
  locationId:    string;
  locationName:  string;
  milestone:     "M5" | "M15" | "M25" | "M25_SUSTAINED";
  payout:        number;
  triggeredAt:   Date;
  paid:          boolean;
}

export interface AttendanceBonus {
  ownAttendance:     boolean;   // zero unexcused absences
  btlPunctuality:    boolean;   // all sessions started within 15 min
  attendancePayout:  number;    // ₹500 if ownAttendance
  punctualityPayout: number;    // ₹250 if btlPunctuality
  total:             number;
}

export interface PerformanceAlert {
  type:     "KPI_GATE_BLOCKED" | "CHURN_WARNING" | "AUDIT_LOW" |
            "COMPLAINT_SLA" | "LEAD_QUALITY_AUDIT" | "CONVERSION_LOW";
  message:  string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface IncentiveDashboard {
  monthYear:          string;
  calculatedAt:       Date;
  kpiScore:           KPIScore;
  churnMultiplier:    ChurnMultiplier;
  opsKPIBonus:        OpsKPIBonus;
  leadBonus:          LeadBonus;
  conversionBonus:    ConversionBonus;
  milestones:         MilestoneBonus[];
  attendance:         AttendanceBonus;
  totals: {
    fixedNet:         number;
    opsKPI:           number;
    btlLeads:         number;
    btlConversions:   number;
    milestones:       number;
    attendance:       number;
    totalVariable:    number;
    totalTakeHome:    number;
  };
  alerts:             PerformanceAlert[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KPI_WEIGHTS = { retention: 30, audit: 20, complaints: 10, conversion: 40 };
const KPI_GATE    = 70;
const FIXED_NET   = 16400;

const KPI_OPS_BANDS: { min: number; max: number; bonus: number; band: OpsKPIBonus["band"] }[] = [
  { min: 90, max: 100, bonus: 3000, band: "EXCELLENT"         },
  { min: 80, max:  89, bonus: 2200, band: "GOOD"              },
  { min: 70, max:  79, bonus: 1400, band: "ON_TRACK"          },
  { min: 60, max:  69, bonus:  700, band: "NEEDS_IMPROVEMENT" },
  { min:  0, max:  59, bonus:    0, band: "AT_RISK"           },
];

const LEAD_SLABS = [
  { from:   1, to: 100, rate:  5 },
  { from: 101, to: 200, rate:  7 },
  { from: 201, to: 400, rate:  8 },
  { from: 401, to: Infinity, rate: 10 },
];

const CHURN_BANDS: { maxChurn: number; multiplier: number; label: string; color: ChurnMultiplier["color"] }[] = [
  { maxChurn:  0, multiplier: 1.3, label: "Zero churn — 1.3× uplift on BTL leads",  color: "green" },
  { maxChurn:  5, multiplier: 1.0, label: "Low churn — standard rate",               color: "gray"  },
  { maxChurn: 10, multiplier: 0.7, label: "Moderate churn — 30% BTL reduction",      color: "amber" },
  { maxChurn: 999,multiplier: 0.5, label: "High churn — 50% BTL reduction",          color: "red"   },
];

// ─── Service ──────────────────────────────────────────────────────────────────

class SupervisorIncentiveService {

  // Calculate KPI score from raw metrics
  calculateKPIScore(
    retentionRate: number,      // 0–1
    avgAuditsPerDay: number,    // e.g. 4.2
    unresolvedComplaints: number,
    oldestUnresolvedHours: number,
    btlConversionRate: number   // 0–1
  ): KPIScore {
    // Retention (30 pts) — target ≥80%
    const retPts = retentionRate >= 0.8
      ? 30
      : Math.round((retentionRate / 0.8) * 30);

    // Audit (20 pts) — target ≥4/day + no gap >4 days (simplified: score on daily rate)
    const auditPts = Math.min(20, Math.round((avgAuditsPerDay / 4) * 20));

    // Complaints (10 pts) — full if no unresolved >24h
    const compPts = (unresolvedComplaints === 0 || oldestUnresolvedHours <= 24) ? 10 : 0;

    // BTL conversion (40 pts) — target ≥30%
    const convPts = btlConversionRate >= 0.3
      ? 40
      : Math.round((btlConversionRate / 0.3) * 40);

    const total = retPts + auditPts + compPts + convPts;
    return {
      washerRetention:   retPts,
      auditCompliance:   auditPts,
      complaintSLA:      compPts,
      btlConversionRate: convPts,
      total,
      threshold: KPI_GATE,
      btlUnlocked: total >= KPI_GATE,
    };
  }

  // Calculate churn multiplier from churn rate
  calculateChurnMultiplier(cancellations: number, activeCustomers: number): ChurnMultiplier {
    const churnRate = activeCustomers > 0 ? (cancellations / activeCustomers) * 100 : 0;
    const band = CHURN_BANDS.find(b => churnRate <= b.maxChurn) || CHURN_BANDS[CHURN_BANDS.length - 1];
    return {
      churnRate: parseFloat(churnRate.toFixed(1)),
      multiplier: band.multiplier,
      label: band.label,
      color: band.color,
      retentionBonus: band.multiplier > 1,
    };
  }

  // Calculate ops KPI bonus
  calculateOpsKPIBonus(kpiScore: number): OpsKPIBonus {
    const band = KPI_OPS_BANDS.find(b => kpiScore >= b.min && kpiScore <= b.max)
      || KPI_OPS_BANDS[KPI_OPS_BANDS.length - 1];
    return { kpiScore, bonus: band.bonus, band: band.band };
  }

  // Calculate BTL lead bonus
  calculateLeadBonus(
    qualifiedLeads: number,
    totalLeads: number,
    churnMultiplier: ChurnMultiplier,
    kpiUnlocked: boolean
  ): LeadBonus {
    // Calculate marginal slab amounts
    let remaining = qualifiedLeads;
    let rawBonus  = 0;
    const slabLeads = [0, 0, 0, 0];
    LEAD_SLABS.forEach((slab, i) => {
      if (remaining <= 0) return;
      const slabSize   = slab.to === Infinity ? remaining : Math.min(remaining, slab.to - slab.from + 1);
      const inSlab     = Math.min(remaining, slabSize);
      slabLeads[i]     = inSlab;
      rawBonus        += inSlab * slab.rate;
      remaining       -= inSlab;
    });

    const multiplied   = Math.round(rawBonus * churnMultiplier.multiplier);
    const finalBonus   = kpiUnlocked ? multiplied : 0;

    return {
      totalLeads, qualifiedLeads,
      slab1Leads: slabLeads[0], slab2Leads: slabLeads[1],
      slab3Leads: slabLeads[2], slab4Leads: slabLeads[3],
      rawLeadBonus:    rawBonus,
      churnMultiplier: churnMultiplier.multiplier,
      finalLeadBonus:  finalBonus,
      gateBlocked:     !kpiUnlocked,
    };
  }

  // Calculate conversion bonus
  calculateConversionBonus(
    conversions: ConversionRecord[],
    kpiUnlocked: boolean
  ): ConversionBonus {
    const gateBlocked = !kpiUnlocked;
    const resolved = conversions.map(c => ({
      ...c,
      status: (gateBlocked ? "GATE_BLOCKED"
        : c.status === "FORFEITED" ? "FORFEITED"
        : c.holdClearDate && c.holdClearDate <= new Date() ? "PAID"
        : "HOLD_ACTIVE") as ConversionRecord["status"],
    }));
    return {
      conversions: resolved,
      totalEligible:  resolved.filter(c => c.status === "PAID").reduce((s, c) => s + c.cappedBonus, 0),
      totalPending:   resolved.filter(c => c.status === "HOLD_ACTIVE").reduce((s, c) => s + c.cappedBonus, 0),
      totalForfeited: resolved.filter(c => c.status === "FORFEITED").reduce((s, c) => s + c.cappedBonus, 0),
      gateBlocked,
    };
  }

  // Build conversion record from plan
  buildConversionRecord(
    leadId: string, customerName: string,
    planName: string, planValue: number,
    submissionDate: Date, conversionDate?: Date
  ): ConversionRecord {
    const grossBonus  = Math.round(planValue * 0.08);
    const cappedBonus = Math.max(15, Math.min(250, grossBonus));
    const holdClear   = conversionDate
      ? new Date(conversionDate.getTime() + 60 * 24 * 60 * 60 * 1000)
      : undefined;
    return {
      leadId, customerName, planName, planValue,
      bonusRate: 0.08, grossBonus, cappedBonus,
      submissionDate, conversionDate, holdClearDate: holdClear,
      status: "PENDING",
    };
  }

  // Generate full dashboard (seeded/demo data)
  getIncentiveDashboard(supervisorId: string): IncentiveDashboard {
    const now = new Date();

    // ── KPI inputs (would come from ERP live data in production) ─────────────
    const kpi = this.calculateKPIScore(
      0.87,   // 87% retention — good
      3.8,    // 3.8 audits/day — slightly below 4 target
      0,      // no unresolved complaints
      0,
      0.33    // 33% BTL conversion rate — just above 30% target
    );

    const churn = this.calculateChurnMultiplier(2, 28); // 2 cancellations, 28 customers

    // ── Ops KPI Bonus ─────────────────────────────────────────────────────────
    const opsBonus = this.calculateOpsKPIBonus(kpi.total);

    // ── BTL Lead Bonus ────────────────────────────────────────────────────────
    const leadBonus = this.calculateLeadBonus(138, 155, churn, kpi.btlUnlocked);

    // ── Conversion Bonus ──────────────────────────────────────────────────────
    const convRecords: ConversionRecord[] = [
      this.buildConversionRecord("L-001","Amit Patel",   "Hatchback — Smart Wash",  1599, new Date(now.getTime()-75*86400000), new Date(now.getTime()-70*86400000)),
      this.buildConversionRecord("L-002","Priya Shah",   "SUV — Express Wash",      1499, new Date(now.getTime()-68*86400000), new Date(now.getTime()-63*86400000)),
      this.buildConversionRecord("L-003","Rahul Desai",  "Hatchback — Express Wash",1249, new Date(now.getTime()-40*86400000), new Date(now.getTime()-35*86400000)),
      this.buildConversionRecord("L-004","Sneha Mehta",  "SUV — ELITE",             2499, new Date(now.getTime()-20*86400000), new Date(now.getTime()-15*86400000)),
      this.buildConversionRecord("L-005","Vikram Modi",  "Hatchback — ELITE",       1999, new Date(now.getTime()-10*86400000)),
      this.buildConversionRecord("L-006","Kavita Joshi", "Luxury — ELITE",          3499, new Date(now.getTime()-5*86400000)),
    ];
    const convBonus = this.calculateConversionBonus(convRecords, kpi.btlUnlocked);

    // ── Milestones ────────────────────────────────────────────────────────────
    const milestones: MilestoneBonus[] = [
      { locationId:"LOC-001", locationName:"Adajan Heights Society",  milestone:"M25", payout:250, triggeredAt:new Date(now.getTime()-5*86400000),  paid:false },
      { locationId:"LOC-002", locationName:"Reliance Corporate Park", milestone:"M15", payout:100, triggeredAt:new Date(now.getTime()-12*86400000), paid:true  },
    ];

    // ── Attendance ────────────────────────────────────────────────────────────
    const attendance: AttendanceBonus = {
      ownAttendance: true, btlPunctuality: false,
      attendancePayout: 500, punctualityPayout: 0, total: 500,
    };

    // ── Totals ────────────────────────────────────────────────────────────────
    const milestonePaid = milestones.filter(m => !m.paid).reduce((s, m) => s + m.payout, 0);
    const totalVariable =
      opsBonus.bonus +
      leadBonus.finalLeadBonus +
      convBonus.totalEligible +
      milestonePaid +
      attendance.total;

    // ── Alerts ────────────────────────────────────────────────────────────────
    const alerts: PerformanceAlert[] = [];
    if (!kpi.btlUnlocked) {
      alerts.push({ type:"KPI_GATE_BLOCKED", severity:"CRITICAL",
        message:`KPI score ${kpi.total}/100 is below 70. BTL Lead Bonus and Conversion Bonus are withheld this month. Fix operations to unlock BTL earnings.` });
    }
    if (churn.color === "red" || churn.color === "amber") {
      alerts.push({ type:"CHURN_WARNING", severity:churn.color === "red" ? "CRITICAL" : "WARNING",
        message:`Churn rate ${churn.churnRate}% is applying a ${churn.multiplier}× multiplier to your BTL lead earnings.` });
    }
    if (kpi.auditCompliance < 16) {
      alerts.push({ type:"AUDIT_LOW", severity:"WARNING",
        message:"Audit score below target. Complete ≥4 wash audits per day to hit the 20/20 KPI target." });
    }

    return {
      monthYear: now.toLocaleDateString("en-IN", { month:"long", year:"numeric" }),
      calculatedAt: now,
      kpiScore: kpi,
      churnMultiplier: churn,
      opsKPIBonus: opsBonus,
      leadBonus,
      conversionBonus: convBonus,
      milestones,
      attendance,
      totals: {
        fixedNet: FIXED_NET,
        opsKPI: opsBonus.bonus,
        btlLeads: leadBonus.finalLeadBonus,
        btlConversions: convBonus.totalEligible,
        milestones: milestonePaid,
        attendance: attendance.total,
        totalVariable,
        totalTakeHome: FIXED_NET + totalVariable,
      },
      alerts,
    };
  }
}

export const supervisorIncentiveService = new SupervisorIncentiveService();
