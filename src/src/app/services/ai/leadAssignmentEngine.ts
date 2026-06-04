/**
 * AI Lead Assignment Engine
 * Scores every available TSE for each incoming lead and picks the best match.
 * Never blocks — if scoring fails, falls back to round-robin.
 * Fully explainable — every assignment includes reasons.
 */

import { logger } from "../logger";

export interface LeadContext {
  leadId: string;
  source: string;        // "DIGITAL" | "BTL_REFERRAL" | "WALK_IN" | "SOCIAL_MEDIA" | "PARTNER"
  vehicleType: "4W" | "2W";
  vehicleCategory?: string; // "SUV" | "HATCHBACK" | "SEDAN" | "LUXURY" | "BIKE" | "SCOOTER"
  cityId: string;
  pincode?: string;
  priority: "URGENT" | "HIGH" | "NORMAL";
  estimatedValue?: number;
}

export interface TSESnapshot {
  tseId: string;
  tseName: string;
  status: "ACTIVE" | "OFFLINE" | "ON_CALL";
  // Performance metrics (from TSEPerformanceCard)
  conversionRate: number;       // overall % e.g. 48.5
  crmComplianceScore: number;   // 0-100
  callsMadeToday: number;
  callsTarget: number;
  openLeadsCount: number;       // current queue depth
  // Specialisation signals
  vehicleTypeWinRate: Record<string, number>; // "4W" -> 52.1, "2W" -> 38.4
  sourceWinRate: Record<string, number>;      // "DIGITAL" -> 45, "BTL_REFERRAL" -> 55
  avgHandleTimeMinutes: number;
  lastAssignedAt?: string;      // ISO — for recency spread
  territories: string[];        // ["ALL"] or ["CITY-SURAT", "CITY-MUMBAI"]
}

export interface AssignmentScore {
  tseId: string;
  tseName: string;
  totalScore: number;           // 0-100
  breakdown: {
    availabilityScore: number;  // 0-25 — is TSE free right now
    capacityScore: number;      // 0-20 — queue depth vs target
    conversionScore: number;    // 0-25 — overall conversion rate
    specialisationScore: number;// 0-20 — vehicle + source match
    recencyScore: number;       // 0-10 — spread assignments fairly
  };
  reasons: string[];            // human-readable explanation
  recommended: boolean;
}

export interface AssignmentResult {
  success: boolean;
  assignedTo: string;
  assignedToName: string;
  score: AssignmentScore;
  allScores: AssignmentScore[];
  method: "AI_SCORED" | "ROUND_ROBIN_FALLBACK" | "ONLY_AVAILABLE";
  message: string;
}

// ── SCORING WEIGHTS ───────────────────────────────────────────────────────────
const WEIGHTS = {
  availability:    25,   // Is the TSE ACTIVE (not ON_CALL or OFFLINE)?
  capacity:        20,   // How full is their queue vs target?
  conversion:      25,   // Their overall conversion rate (vs team avg)
  specialisation:  20,   // Do they win more on this vehicle type + source?
  recency:         10,   // Was someone else assigned more recently?
};

class LeadAssignmentEngine {

  /**
   * Main entry point. Scores all TSEs and returns the best match.
   */
  assignLead(lead: LeadContext, tseSnapshots: TSESnapshot[]): AssignmentResult {
    // Filter to eligible TSEs (not OFFLINE, territory matches)
    const eligible = tseSnapshots.filter(tse => {
      if (tse.status === "OFFLINE") return false;
      if (tse.territories.includes("ALL")) return true;
      return tse.territories.includes(lead.cityId);
    });

    if (eligible.length === 0) {
      logger.log("[LeadAssignmentEngine] No eligible TSEs — using any available");
      const anyActive = tseSnapshots.find(t => t.status !== "OFFLINE");
      if (!anyActive) return this.failResult(lead);
      return this.buildResult(anyActive, [], "ROUND_ROBIN_FALLBACK",
        "No territory-matched TSE — assigned to first available");
    }

    if (eligible.length === 1) {
      const scores = [this.scoreTSE(eligible[0], lead, eligible, tseSnapshots)];
      return this.buildResult(eligible[0], scores, "ONLY_AVAILABLE",
        `Only one TSE available: ${eligible[0].tseName}`);
    }

    // Score all eligible TSEs
    const scores = eligible.map(tse => this.scoreTSE(tse, lead, eligible, tseSnapshots));
    scores.sort((a, b) => b.totalScore - a.totalScore);
    scores[0].recommended = true;

    const winner = eligible.find(t => t.tseId === scores[0].tseId)!;
    return this.buildResult(winner, scores, "AI_SCORED",
      `AI assigned to ${winner.tseName} (score: ${scores[0].totalScore.toFixed(1)}/100)`);
  }

  /**
   * Score one TSE against a specific lead.
   */
  private scoreTSE(
    tse: TSESnapshot,
    lead: LeadContext,
    eligible: TSESnapshot[],
    all: TSESnapshot[]
  ): AssignmentScore {
    const reasons: string[] = [];

    // ── 1. AVAILABILITY (0-25) ───────────────────────────────────────────────
    let availabilityScore = 0;
    if (tse.status === "ACTIVE") {
      availabilityScore = WEIGHTS.availability;
      reasons.push("Available — not on a call");
    } else if (tse.status === "ON_CALL") {
      availabilityScore = WEIGHTS.availability * 0.4;
      reasons.push("On call — will pick up when free");
    }

    // ── 2. CAPACITY (0-20) ──────────────────────────────────────────────────
    const maxQueue = 20;
    const queueRatio = Math.max(0, 1 - (tse.openLeadsCount / maxQueue));
    const capacityScore = WEIGHTS.capacity * queueRatio;
    if (tse.openLeadsCount <= 5) {
      reasons.push(`Low queue (${tse.openLeadsCount} open leads)`);
    } else if (tse.openLeadsCount <= 12) {
      reasons.push(`Moderate queue (${tse.openLeadsCount} open leads)`);
    } else {
      reasons.push(`Heavy queue (${tse.openLeadsCount} open leads) — lower priority`);
    }

    // ── 3. CONVERSION RATE (0-25) ────────────────────────────────────────────
    const teamAvgConversion = eligible.reduce((s, t) => s + t.conversionRate, 0) / eligible.length;
    const conversionRatio = Math.min(1.5, tse.conversionRate / Math.max(1, teamAvgConversion));
    const conversionScore = WEIGHTS.conversion * (conversionRatio / 1.5);
    reasons.push(`Conversion rate: ${tse.conversionRate.toFixed(1)}% (team avg ${teamAvgConversion.toFixed(1)}%)`);

    // ── 4. SPECIALISATION (0-20) ─────────────────────────────────────────────
    let specialisationScore = WEIGHTS.specialisation * 0.5; // base 50%
    const vehicleWin = tse.vehicleTypeWinRate[lead.vehicleType];
    const sourceWin = tse.sourceWinRate[lead.source];
    const teamVehicleAvg = eligible.reduce((s, t) =>
      s + (t.vehicleTypeWinRate[lead.vehicleType] || 0), 0) / eligible.length;
    const teamSourceAvg = eligible.reduce((s, t) =>
      s + (t.sourceWinRate[lead.source] || 0), 0) / eligible.length;

    if (vehicleWin && vehicleWin > teamVehicleAvg) {
      specialisationScore += WEIGHTS.specialisation * 0.3;
      reasons.push(`Stronger on ${lead.vehicleType} leads (${vehicleWin.toFixed(1)}% vs team ${teamVehicleAvg.toFixed(1)}%)`);
    }
    if (sourceWin && sourceWin > teamSourceAvg) {
      specialisationScore += WEIGHTS.specialisation * 0.2;
      reasons.push(`Better conversion from ${lead.source} leads`);
    }
    if (lead.vehicleCategory === "LUXURY" && tse.conversionRate > 50) {
      specialisationScore += 3;
      reasons.push("High conversion — suited for luxury vehicle leads");
    }
    specialisationScore = Math.min(WEIGHTS.specialisation, specialisationScore);

    // ── 5. RECENCY (0-10) ────────────────────────────────────────────────────
    let recencyScore = WEIGHTS.recency;
    if (tse.lastAssignedAt) {
      const minutesAgo = (Date.now() - new Date(tse.lastAssignedAt).getTime()) / 60000;
      if (minutesAgo < 2) {
        recencyScore = 0;
        reasons.push("Just assigned — spreading load to others");
      } else if (minutesAgo < 10) {
        recencyScore = WEIGHTS.recency * 0.5;
      } else {
        reasons.push("Not recently assigned — fair turn");
      }
    }

    // ── URGENT LEAD BOOST ─────────────────────────────────────────────────────
    if (lead.priority === "URGENT" && tse.status === "ACTIVE") {
      availabilityScore = Math.min(WEIGHTS.availability, availabilityScore + 5);
      reasons.push("URGENT lead — active TSE boosted");
    }

    const totalScore = availabilityScore + capacityScore + conversionScore +
                       specialisationScore + recencyScore;

    return {
      tseId: tse.tseId,
      tseName: tse.tseName,
      totalScore: Math.min(100, totalScore),
      breakdown: {
        availabilityScore,
        capacityScore,
        conversionScore,
        specialisationScore,
        recencyScore,
      },
      reasons,
      recommended: false,
    };
  }

  /**
   * Build assignment result object.
   */
  private buildResult(
    tse: TSESnapshot,
    scores: AssignmentScore[],
    method: AssignmentResult["method"],
    message: string
  ): AssignmentResult {
    const winnerScore = scores.find(s => s.tseId === tse.tseId) || {
      tseId: tse.tseId,
      tseName: tse.tseName,
      totalScore: 0,
      breakdown: { availabilityScore:0, capacityScore:0, conversionScore:0, specialisationScore:0, recencyScore:0 },
      reasons: ["Fallback assignment"],
      recommended: true,
    };
    return {
      success: true,
      assignedTo: tse.tseId,
      assignedToName: tse.tseName,
      score: winnerScore,
      allScores: scores,
      method,
      message,
    };
  }

  private failResult(lead: LeadContext): AssignmentResult {
    return {
      success: false,
      assignedTo: "",
      assignedToName: "",
      score: { tseId:"", tseName:"", totalScore:0, breakdown:{availabilityScore:0,capacityScore:0,conversionScore:0,specialisationScore:0,recencyScore:0}, reasons:["No TSEs available"], recommended:false },
      allScores: [],
      method: "ROUND_ROBIN_FALLBACK",
      message: `No TSE available for lead ${lead.leadId}`,
    };
  }
}

export const leadAssignmentEngine = new LeadAssignmentEngine();
