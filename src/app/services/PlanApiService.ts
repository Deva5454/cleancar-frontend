/**
 * PlanApiService — connects plan management to Railway backend
 *
 * Replaces localStorage persistence with real API calls.
 * All other services (subscriptionPlansService, AdminPlanManagement)
 * use this as the persistence layer for plan tiers and add-ons.
 *
 * API base URL is read from VITE_API_URL env var (set in Vercel).
 * Falls back to localhost:3000 in development.
 *
 * Endpoints used:
 *   GET  /api/v1/plans/tiers     → all active plan tiers
 *   POST /api/v1/plans/tiers     → create or update a tier (admin, requires JWT)
 *   GET  /api/v1/plans/addons    → all active add-ons
 *   POST /api/v1/plans/addons    → create or update an add-on (admin, requires JWT)
 *   GET  /api/v1/plans/matrix    → pricing matrix by plan name → vehicle category
 */

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

// ── Auth token helper ─────────────────────────────────────────────────────────
// Reads the JWT from whatever key your auth context stores it under.
// Adjust the key name if needed.
function getToken(): string | null {
  try {
    return (
      localStorage.getItem("cleancar_auth_token") ||
      localStorage.getItem("cleancar_CITY-SURAT_auth_token") ||
      sessionStorage.getItem("cleancar_auth_token") ||
      null
    );
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiPlanTier {
  id: string;
  name: string;               // e.g. "EXPRESS_WASH"
  displayName: string;
  vehicleCategory: string;
  baseMonthlyPrice: number;
  costPerWash: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiPlanAddon {
  id: string;
  name: string;
  description: string;
  category: string;
  hatchbackPrice: number;
  suvPrice: number;
  luxuryPrice: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

class PlanApiServiceClass {
  private tiersCache: ApiPlanTier[] | null = null;
  private addonsCache: ApiPlanAddon[] | null = null;
  private cacheTs = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private apiUnreachable = false;  // Set true after first failure — stops hammering
  private lastFailTs = 0;
  private readonly RETRY_AFTER = 10 * 60 * 1000; // Retry after 10 min

  private isCacheStale(): boolean {
    return Date.now() - this.cacheTs > this.CACHE_TTL;
  }

  private shouldSkipApi(): boolean {
    if (!this.apiUnreachable) return false;
    // Allow retry after 10 minutes
    if (Date.now() - this.lastFailTs > this.RETRY_AFTER) {
      this.apiUnreachable = false;
      return false;
    }
    return true;
  }

  // ── TIERS ──────────────────────────────────────────────────────────────────

  async getTiers(): Promise<ApiPlanTier[]> {
    if (this.tiersCache && !this.isCacheStale()) return this.tiersCache;
    if (this.shouldSkipApi()) return this.tiersCache || [];
    try {
      const res = await fetch(`${BASE_URL}/plans/tiers`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`GET /plans/tiers failed: ${res.status}`);
      const data: ApiPlanTier[] = await res.json();
      this.tiersCache = data;
      this.cacheTs = Date.now();
      this.apiUnreachable = false;
      return data;
    } catch (err) {
      this.apiUnreachable = true;
      this.lastFailTs = Date.now();
      // Silent fallback — only log once, not every render
      if (!this.tiersCache) console.warn("[PlanApiService] API unavailable, using localStorage fallback");
      return this.tiersCache || [];
    }
  }

  async upsertTier(tier: Omit<ApiPlanTier, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ApiPlanTier | null> {
    try {
      const res = await fetch(`${BASE_URL}/plans/tiers`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(tier),
      });
      if (!res.ok) throw new Error(`POST /plans/tiers failed: ${res.status}`);
      const saved: ApiPlanTier = await res.json();
      // Bust cache so next read is fresh
      this.tiersCache = null;
      return saved;
    } catch (err) {
      console.error("[PlanApiService] Could not save tier:", err);
      return null;
    }
  }

  async updateTierPrice(
    name: string,
    vehicleCategory: string,
    baseMonthlyPrice: number,
    costPerWash: number,
    displayName?: string,
    sortOrder?: number
  ): Promise<ApiPlanTier | null> {
    return this.upsertTier({ name, vehicleCategory, baseMonthlyPrice, costPerWash, displayName: displayName || name, sortOrder: sortOrder || 0, isActive: true });
  }

  // ── ADD-ONS ────────────────────────────────────────────────────────────────

  async getAddons(): Promise<ApiPlanAddon[]> {
    if (this.addonsCache && !this.isCacheStale()) return this.addonsCache;
    if (this.shouldSkipApi()) return this.addonsCache || [];
    try {
      const res = await fetch(`${BASE_URL}/plans/addons`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`GET /plans/addons failed: ${res.status}`);
      const data: ApiPlanAddon[] = await res.json();
      this.addonsCache = data;
      this.cacheTs = Date.now();
      return data;
    } catch (err) {
      this.apiUnreachable = true;
      this.lastFailTs = Date.now();
      if (!this.addonsCache) console.warn("[PlanApiService] API unavailable, using localStorage fallback");
      return this.addonsCache || [];
    }
  }

  async upsertAddon(addon: Omit<ApiPlanAddon, "createdAt" | "updatedAt"> & { id?: string }): Promise<ApiPlanAddon | null> {
    try {
      const res = await fetch(`${BASE_URL}/plans/addons`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(addon),
      });
      if (!res.ok) throw new Error(`POST /plans/addons failed: ${res.status}`);
      const saved: ApiPlanAddon = await res.json();
      this.addonsCache = null;
      return saved;
    } catch (err) {
      console.error("[PlanApiService] Could not save addon:", err);
      return null;
    }
  }

  // ── PRICING MATRIX ─────────────────────────────────────────────────────────

  async getPricingMatrix(): Promise<Record<string, Record<string, number>>> {
    try {
      const res = await fetch(`${BASE_URL}/plans/matrix`);
      if (!res.ok) throw new Error(`GET /plans/matrix failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("[PlanApiService] Could not load pricing matrix:", err);
      return {};
    }
  }

  // ── CACHE CONTROL ─────────────────────────────────────────────────────────

  invalidateCache(): void {
    this.tiersCache = null;
    this.addonsCache = null;
    this.cacheTs = 0;
  }
}

export const PlanApiService = new PlanApiServiceClass();
