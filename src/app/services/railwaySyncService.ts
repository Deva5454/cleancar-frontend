/**
 * railwaySyncService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-write service: localStorage is primary (instant UI), Railway is secondary
 * (persistent, multi-device). All writes are non-blocking — never halt the UI.
 *
 * Usage:
 *   railwaySync.customer(newCustomer);
 *   railwaySync.subscription(newSubscription);
 *   railwaySync.lead(newLead, "PATCH", leadId);
 *   railwaySync.job(updatedJob, "PATCH", jobId);
 */

// Confirmed directly: there is no real Railway backend for this project.
// If VITE_API_URL is still set to it in Vercel, treat that the same as
// not being configured at all, rather than attempting a doomed request.
const CONFIGURED_BASE = import.meta.env.VITE_API_URL;
const KNOWN_DEAD_BACKEND = "cleancar-backend-production.up.railway.app";
const BASE = (CONFIGURED_BASE && !CONFIGURED_BASE.includes(KNOWN_DEAD_BACKEND) ? CONFIGURED_BASE : "").replace(/\/$/, "");

function getToken(): string | null {
  try {
    const s = localStorage.getItem("cc360_session");
    if (s) {
      const p = JSON.parse(s);
      return p.token || p.accessToken || null;
    }
    return localStorage.getItem("cleancar_auth_token");
  } catch { return null; }
}

function headers(): Record<string, string> {
  const t = getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

type Method = "POST" | "PATCH" | "PUT";

async function push(
  endpoint: string,
  data: unknown,
  method: Method = "POST",
  id?: string
): Promise<void> {
  if (!BASE) return; // No Railway URL configured — skip silently
  const url = id ? `${BASE}${endpoint}/${id}` : `${BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.warn(`[Railway] ${method} ${url} failed: HTTP ${res.status}`);
    }
  } catch (err: any) {
    // Never throw — Railway writes are non-blocking background syncs
    console.warn(`[Railway] ${method} ${url} unreachable:`, err.message);
  }
}

export const railwaySync = {
  /** Write a new customer record to Railway after localStorage write */
  customer(customer: unknown, method: Method = "POST", id?: string) {
    push("/customers", customer, method, id);
  },

  /** Write a new subscription to Railway after localStorage write */
  subscription(subscription: unknown, method: Method = "POST", id?: string) {
    push("/subscriptions", subscription, method, id);
  },

  /** Write a lead to Railway (POST for new, PATCH for update) */
  lead(lead: unknown, method: Method = "POST", id?: string) {
    push("/leads", lead, method, id);
  },

  /** Write a job status update to Railway */
  job(job: unknown, method: Method = "POST", id?: string) {
    push("/jobs", job, method, id);
  },

  /** Write a TAT notification to Railway */
  tatNotification(record: unknown) {
    push("/tat-records", record, "POST");
  },

  /** Write a reschedule request to Railway */
  reschedule(request: unknown) {
    push("/reschedules", request, "POST");
  },
};
