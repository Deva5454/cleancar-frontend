Create a new file src/app/services/ai/complaintAssignmentEngine.ts with this content:

import { logger } from "../logger";

export interface ComplaintContext {
  complaintId: string;
  priority: "P1" | "P2" | "P3" | "P4";
  complaintType: string;
  channel: string;
  cityId: string;
  pincode?: string;
  customerId: string;
  slaHours: number;
}

export interface CCESnapshot {
  cceId: string;
  cceName: string;
  status: "ACTIVE" | "OFFLINE" | "ON_BREAK";
  openComplaintsCount: number;
  p1p2ActiveCount: number;
  resolutionRate: number;
  csatAverage: number;
  slaBreachRate: number;
  crmComplianceRate: number;
  complaintTypeWinRate: Record<string, number>;
  lastAssignedAt?: string;
  territories: string[];
}

export interface CCEAssignmentScore {
  cceId: string;
  cceName: string;
  totalScore: number;
  breakdown: {
    availabilityScore: number;
    capacityScore: number;
    qualityScore: number;
    specialisationScore: number;
    recencyScore: number;
  };
  reasons: string[];
  recommended: boolean;
}

export interface CCEAssignmentResult {
  success: boolean;
  assignedTo: string;
  assignedToName: string;
  score: CCEAssignmentScore;
  allScores: CCEAssignmentScore[];
  method: "AI_SCORED" | "ROUND_ROBIN_FALLBACK" | "ONLY_AVAILABLE";
  message: string;
}

const WEIGHTS = { availability: 25, capacity: 20, quality: 30, specialisation: 15, recency: 10 };

class ComplaintAssignmentEngine {

  assignComplaint(complaint: ComplaintContext, cceSnapshots: CCESnapshot[]): CCEAssignmentResult {
    const eligible = cceSnapshots.filter(cce => {
      if (cce.status === "OFFLINE") return false;
      if (complaint.priority === "P1" || complaint.priority === "P2") {
        if (cce.p1p2ActiveCount >= 5) return false;
      }
      return cce.territories.includes("ALL") || cce.territories.includes(complaint.cityId);
    });

    if (eligible.length === 0) {
      const any = cceSnapshots.filter(c => c.status !== "OFFLINE")
        .sort((a, b) => a.openComplaintsCount - b.openComplaintsCount)[0];
      if (!any) return this.failResult(complaint);
      return this.buildResult(any, [], "ROUND_ROBIN_FALLBACK",
        "No eligible CCE — assigned to least loaded available");
    }

    if (eligible.length === 1) {
      return this.buildResult(eligible[0],
        [this.scoreCCE(eligible[0], complaint, eligible)],
        "ONLY_AVAILABLE", `Only CCE available: ${eligible[0].cceName}`);
    }

    const scores = eligible.map(c => this.scoreCCE(c, complaint, eligible));
    scores.sort((a, b) => b.totalScore - a.totalScore);
    scores[0].recommended = true;
    const winner = eligible.find(c => c.cceId === scores[0].cceId)!;
    return this.buildResult(winner, scores, "AI_SCORED",
      `AI assigned to ${winner.cceName} — score ${scores[0].totalScore.toFixed(1)}/100`);
  }

  private scoreCCE(cce: CCESnapshot, complaint: ComplaintContext, eligible: CCESnapshot[]): CCEAssignmentScore {
    const reasons: string[] = [];

    let availabilityScore = cce.status === "ACTIVE" ? WEIGHTS.availability : WEIGHTS.availability * 0.5;
    if (cce.status === "ACTIVE") reasons.push("Available");
    else reasons.push("On break — queued");
    if ((complaint.priority === "P1") && cce.status === "ACTIVE") {
      availabilityScore = Math.min(WEIGHTS.availability, availabilityScore + 5);
      reasons.push("P1 complaint — active CCE boosted");
    }

    const maxQueue = complaint.priority === "P1" || complaint.priority === "P2" ? 5 : 10;
    const capacityScore = WEIGHTS.capacity * Math.max(0, 1 - cce.openComplaintsCount / maxQueue);
    reasons.push(`Queue: ${cce.openComplaintsCount} open complaints`);
    if (cce.p1p2ActiveCount > 0) reasons.push(`${cce.p1p2ActiveCount} P1/P2 active`);

    const teamAvgCsat = eligible.reduce((s, c) => s + c.csatAverage, 0) / eligible.length;
    const teamAvgRes = eligible.reduce((s, c) => s + c.resolutionRate, 0) / eligible.length;
    const csatRatio = Math.min(1.3, cce.csatAverage / Math.max(1, teamAvgCsat));
    const resRatio = Math.min(1.3, cce.resolutionRate / Math.max(1, teamAvgRes));
    const qualityScore = WEIGHTS.quality * ((csatRatio + resRatio) / 2) / 1.3;
    reasons.push(`CSAT ${cce.csatAverage.toFixed(1)}/5 · Resolution ${cce.resolutionRate.toFixed(0)}%`);
    if (cce.slaBreachRate > 10) reasons.push(`High SLA breach rate (${cce.slaBreachRate.toFixed(0)}%) — penalised`);

    const slaBreachPenalty = Math.max(0, (cce.slaBreachRate - 5) * 0.5);
    const adjustedQuality = Math.max(0, qualityScore - slaBreachPenalty);

    let specScore = WEIGHTS.specialisation * 0.5;
    const typeWin = cce.complaintTypeWinRate[complaint.complaintType] || 0;
    const teamTypeAvg = eligible.reduce((s, c) => s + (c.complaintTypeWinRate[complaint.complaintType] || 0), 0) / eligible.length;
    if (typeWin > teamTypeAvg) {
      specScore = WEIGHTS.specialisation;
      reasons.push(`Stronger at ${complaint.complaintType} complaints`);
    }
    if (cce.crmComplianceRate >= 95) {
      specScore = Math.min(WEIGHTS.specialisation, specScore + 2);
      reasons.push("High CRM compliance");
    }

    let recencyScore = WEIGHTS.recency;
    if (cce.lastAssignedAt) {
      const mins = (Date.now() - new Date(cce.lastAssignedAt).getTime()) / 60000;
      if (mins < 3) { recencyScore = 0; reasons.push("Just assigned — spreading load"); }
      else if (mins < 15) recencyScore = WEIGHTS.recency * 0.5;
      else reasons.push("Not recently assigned");
    }

    return {
      cceId: cce.cceId, cceName: cce.cceName,
      totalScore: Math.min(100, availabilityScore + capacityScore + adjustedQuality + specScore + recencyScore),
      breakdown: { availabilityScore, capacityScore, qualityScore: adjustedQuality, specialisationScore: specScore, recencyScore },
      reasons, recommended: false,
    };
  }

  private buildResult(cce: CCESnapshot, scores: CCEAssignmentScore[], method: CCEAssignmentResult["method"], message: string): CCEAssignmentResult {
    const s = scores.find(x => x.cceId === cce.cceId) || { cceId: cce.cceId, cceName: cce.cceName, totalScore: 0, breakdown: { availabilityScore:0, capacityScore:0, qualityScore:0, specialisationScore:0, recencyScore:0 }, reasons: ["Fallback"], recommended: true };
    return { success: true, assignedTo: cce.cceId, assignedToName: cce.cceName, score: s, allScores: scores, method, message };
  }

  private failResult(complaint: ComplaintContext): CCEAssignmentResult {
    return { success: false, assignedTo: "", assignedToName: "", score: { cceId:"", cceName:"", totalScore:0, breakdown:{availabilityScore:0,capacityScore:0,qualityScore:0,specialisationScore:0,recencyScore:0}, reasons:["No CCE available"], recommended:false }, allScores: [], method: "ROUND_ROBIN_FALLBACK", message: `No CCE available for complaint ${complaint.complaintId}` };
  }
}

export const complaintAssignmentEngine = new ComplaintAssignmentEngine();