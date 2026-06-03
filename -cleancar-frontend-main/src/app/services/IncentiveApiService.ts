/**
 * IncentiveApiService.ts
 * Connects the TSE/TSM/SM/SH/Supervisor incentive screens to Railway PostgreSQL.
 * Replaces localStorage reads in incentiveStructureV6.ts.
 *
 * Drop-in: import { IncentiveApiService } from "./IncentiveApiService";
 */

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

function token(): string | null {
  try {
    const s = localStorage.getItem("cc360_session");
    if (s) {
      const parsed = JSON.parse(s);
      return parsed.token || parsed.accessToken || null;
    }
    return localStorage.getItem("cleancar_auth_token");
  } catch { return null; }
}

function headers(): Record<string, string> {
  const t = token();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

// ── Types matching backend ────────────────────────────────────────────────────

export interface ApiIncentiveTranche {
  id: string;
  checkMonth: string;           // "M1" | "M3" | "M6" | "M9" | "M12"
  dueDate: string;
  poolAmount: number;
  status: "PENDING" | "PAID" | "FORFEITED";
  paidDate?: string;
  forfeitedReason?: string;
  rolePayouts: {
    id: string;
    role: string;
    employeeId: string;
    employeeName: string;
    percentage: number;
    amount: number;
  }[];
}

export interface ApiIncentiveRecord {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  cityId: string;
  planType: string;
  vehicleCategory: string;
  monthlyAmount: number;
  term: number;
  source: "DIGITAL" | "BTL";
  activationDate: string;
  poolTotal: number;
  isZeroPool: boolean;
  status: "ACTIVE" | "CANCELLED";
  cancelledDate?: string;
  tseId?: string;
  tseName?: string;
  smId?: string;
  smName?: string;
  shId?: string;
  shName?: string;
  tsmId?: string;
  tsmName?: string;
  supervisorId?: string;
  supervisorName?: string;
  tranches: ApiIncentiveTranche[];
}

export interface CreateIncentiveDto {
  subscriptionId: string;
  customerId: string;
  customerName: string;
  cityId: string;
  planType: string;
  vehicleCategory: string;
  monthlyAmount: number;
  term: number;
  source: "DIGITAL" | "BTL";
  activationDate: string;
  tseId?: string;
  tseName?: string;
  smId?: string;
  smName?: string;
  shId?: string;
  shName?: string;
  tsmId?: string;
  tsmName?: string;
  supervisorId?: string;
  supervisorName?: string;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const _cache = new Map<string, { data: any; ts: number }>();
const TTL = 3 * 60 * 1000; // 3 minutes

function cached<T>(key: string): T | null {
  const c = _cache.get(key);
  if (c && Date.now() - c.ts < TTL) return c.data as T;
  return null;
}

function setCache(key: string, data: any): void {
  _cache.set(key, { data, ts: Date.now() });
}

// ── Service ───────────────────────────────────────────────────────────────────

class IncentiveApiServiceClass {

  /**
   * Get incentives for the currently logged-in employee.
   * Uses GET /api/v1/incentives/me
   */
  async getForMe(): Promise<ApiIncentiveRecord[]> {
    const key = "me";
    const hit = cached<ApiIncentiveRecord[]>(key);
    if (hit) return hit;
    try {
      const res = await fetch(`${BASE}/incentives/me`, { headers: headers() });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: ApiIncentiveRecord[] = await res.json();
      setCache(key, data);
      return data;
    } catch (e) {
      console.warn("[IncentiveApiService] getForMe failed:", e);
      return [];
    }
  }

  /**
   * Get incentives for a specific employee by ID and role.
   * Uses GET /api/v1/incentives/employee/:id?role=TSE
   */
  async getForEmployee(employeeId: string, role: string): Promise<ApiIncentiveRecord[]> {
    const key = `emp_${employeeId}_${role}`;
    const hit = cached<ApiIncentiveRecord[]>(key);
    if (hit) return hit;
    try {
      const res = await fetch(
        `${BASE}/incentives/employee/${employeeId}?role=${role}`,
        { headers: headers() }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data: ApiIncentiveRecord[] = await res.json();
      setCache(key, data);
      return data;
    } catch (e) {
      console.warn("[IncentiveApiService] getForEmployee failed:", e);
      return [];
    }
  }

  /**
   * Create an incentive record when a subscription is activated.
   * Call this from LeadConversionModal after successful conversion.
   * Uses POST /api/v1/incentives
   */
  async create(dto: CreateIncentiveDto): Promise<ApiIncentiveRecord | null> {
    try {
      const res = await fetch(`${BASE}/incentives`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`POST /incentives failed: ${res.status}`);
      const data: ApiIncentiveRecord = await res.json();
      // Bust cache for all involved employees
      [dto.tseId, dto.smId, dto.shId, dto.tsmId, dto.supervisorId]
        .filter(Boolean)
        .forEach(id => {
          _cache.delete(`emp_${id}_TSE`);
          _cache.delete(`emp_${id}_SM`);
          _cache.delete(`emp_${id}_SH`);
          _cache.delete(`emp_${id}_TSM`);
          _cache.delete(`emp_${id}_SUPERVISOR`);
        });
      _cache.delete("me");
      return data;
    } catch (e) {
      console.error("[IncentiveApiService] create failed:", e);
      return null;
    }
  }

  /**
   * Trigger processing of overdue tranches (marks PENDING → PAID if date passed).
   * Call on app startup or from admin panel.
   */
  async processOverdue(): Promise<void> {
    try {
      await fetch(`${BASE}/incentives/process-due`, {
        method: "POST",
        headers: headers(),
      });
      _cache.clear();
    } catch (e) {
      console.warn("[IncentiveApiService] processOverdue failed:", e);
    }
  }

  /**
   * Cancel an incentive record (subscription cancelled).
   * Uses PATCH /api/v1/incentives/:id/cancel
   */
  async cancel(incentiveId: string, cancelDate?: string): Promise<void> {
    try {
      await fetch(`${BASE}/incentives/${incentiveId}/cancel`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ cancelDate: cancelDate || new Date().toISOString().split("T")[0] }),
      });
      _cache.clear();
    } catch (e) {
      console.error("[IncentiveApiService] cancel failed:", e);
    }
  }

  /**
   * Convert API records to the shape incentiveStructureV6 expects.
   * This lets SubscriptionIncentiveTracker work with API data
   * without changing any of its internal logic.
   */
  toV6Format(records: ApiIncentiveRecord[]): any[] {
    return records.map(r => ({
      id: r.id,
      subscriptionId: r.subscriptionId,
      customerId: r.customerId,
      customerName: r.customerName,
      planType: r.planType,
      vehicleCategory: r.vehicleCategory,
      monthlyAmount: r.monthlyAmount,
      term: r.term,
      source: r.source,
      activationDate: r.activationDate,
      poolTotal: r.poolTotal,
      isZeroPool: r.isZeroPool,
      status: r.status,
      cancelledDate: r.cancelledDate,
      tranches: r.tranches.map(t => ({
        id: t.id,
        checkMonth: t.checkMonth,
        dueDate: t.dueDate,
        poolAmount: t.poolAmount,
        status: t.status,
        paidDate: t.paidDate,
        forfeitedReason: t.forfeitedReason,
        rolePayouts: t.rolePayouts.map(rp => ({
          role: rp.role,
          employeeId: rp.employeeId,
          employeeName: rp.employeeName,
          pct: rp.percentage,
          amount: rp.amount,
        })),
      })),
    }));
  }

  invalidateCache(): void {
    _cache.clear();
  }
}

export const IncentiveApiService = new IncentiveApiServiceClass();
