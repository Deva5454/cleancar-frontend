/**
 * TSM Daily Tele-Sales Performance Report: pure calculation (no React, no storage).
 * All dates are India time. Definitions follow the spec (decisions 1-10, proposed answers).
 */

export type PeriodKey = "today" | "yesterday" | "last_week" | "last_month" | "custom";
export interface Period { key: PeriodKey; from: string; to: string; label: string }

const DAY = 86400000;
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parseD = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const addDays = (s: string, n: number) => fmt(new Date(parseD(s).getTime() + n * DAY));

/** ms of a timestamp; a value with no zone (e.g. "2026-10-22T15:00" or "2026-10-22") is read as India time. */
export function toMs(s: string | undefined): number {
  if (!s) return NaN;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00+05:30`).getTime();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s).getTime();
  return new Date(`${s}+05:30`.replace(/(\.\d+)?\+05:30$/, "+05:30")).getTime();
}
export function istDay(s: string | undefined): string {
  const t = toMs(s);
  return Number.isNaN(t) ? "" : fmt(new Date(t + 330 * 60000));
}
export function todayIst(now: number): string { return fmt(new Date(now + 330 * 60000)); }

const nice = (s: string) => parseD(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function periodFor(key: PeriodKey, now: number, custom?: { from: string; to: string }): Period {
  const today = todayIst(now);
  switch (key) {
    case "today": return { key, from: today, to: today, label: `Today, ${nice(today)}` };
    case "yesterday": { const y = addDays(today, -1); return { key, from: y, to: y, label: `Yesterday, ${nice(y)}` }; }
    case "last_week": {
      const dow = (parseD(today).getUTCDay() + 6) % 7; // Monday = 0
      const thisMon = addDays(today, -dow);
      const from = addDays(thisMon, -7), to = addDays(thisMon, -1);
      return { key, from, to, label: `Last week, ${nice(from)} to ${nice(to)}` };
    }
    case "last_month": {
      const t = parseD(today);
      const first = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1));
      const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0));
      return { key, from: fmt(first), to: fmt(last), label: `Last month, ${nice(fmt(first))} to ${nice(fmt(last))}` };
    }
    default: {
      const from = custom?.from || today, to = custom?.to || today;
      return { key: "custom", from, to, label: `${nice(from)} to ${nice(to)}` };
    }
  }
}

/** Returns an error message for a bad custom range, else null. */
export function validateCustom(from: string, to: string, now: number): string | null {
  if (!from || !to) return "Choose both From and To dates.";
  if (to < from) return "The To date cannot be before the From date.";
  if (to > todayIst(now)) return "The To date cannot be in the future.";
  return null;
}

// ── inputs ────────────────────────────────────────────────────────────────────
export interface TseIn { id: string; name: string; aliases: string[]; absent?: boolean }
export interface ActivityIn {
  timestamp: string; type: string; performedBy?: string; outcome?: string;
  metadata?: Record<string, any>; nextAction?: string;
}
export interface LeadIn {
  leadId: string; owner?: string; assignedAt?: string; createdAt?: string;
  stage?: string; status?: string; followUpDate?: string; lastContactedAt?: string;
  timeline?: ActivityIn[];
}
export interface JobIn {
  jobId: string; leadId?: string; bookedByTseId?: string; status?: string;
  amount?: number; finalAmount?: number; paymentStatus?: string;
  createdAt?: string; paidAt?: string; completedAt?: string; cancelledAt?: string;
}
export interface DrillItem { leadId: string; at?: string; note?: string }
export interface Row {
  tseId: string; name: string; absent: boolean;
  assigned: number; calls: number; connected: number; interested: number;
  followUpsDue: number; pendingFollowUps: number; bookings: number; lost: number;
  converted: number; sales: number; conversionPct: number | null;
  detail: Record<"assigned" | "calls" | "interested" | "followUps" | "lost", DrillItem[]>;
}
export interface Report { period: Period; asOf: string; rows: Row[]; total: Row }

export const pct = (converted: number, assigned: number): number | null =>
  assigned > 0 ? Math.round((converted / assigned) * 1000) / 10 : null;

const inRange = (day: string, p: { from: string; to: string }) => !!day && day >= p.from && day <= p.to;
const lc = (s?: string) => (s || "").trim().toLowerCase();
const toStage = (a: ActivityIn) => lc(String(a.metadata?.to ?? ""));

function resolveTse(ref: string | undefined, byKey: Map<string, string>): string | undefined {
  return ref ? byKey.get(lc(ref)) : undefined;
}

export function buildReport(input: {
  tses: TseIn[]; leads: LeadIn[]; jobs: JobIn[]; period: Period; now: number;
}): Report {
  const { tses, leads, jobs, period, now } = input;
  const byKey = new Map<string, string>();
  for (const t of tses) for (const k of [t.id, t.name, ...t.aliases]) if (k) byKey.set(lc(k), t.id);

  const rows = new Map<string, Row>();
  for (const t of tses) rows.set(t.id, emptyRow(t.id, t.name, !!t.absent));

  const periodEndMs = Math.min(now, toMs(`${period.to}T23:59:59.999`));
  const leadOwner = new Map<string, string>();

  for (const lead of leads) {
    const ownerId = resolveTse(lead.owner, byKey);
    if (ownerId) leadOwner.set(lead.leadId, ownerId);
    const tl = [...(lead.timeline || [])].sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));

    // Leads Assigned
    if (ownerId) {
      const assignedDay = istDay(lead.assignedAt || lead.createdAt);
      if (inRange(assignedDay, period)) bump(rows.get(ownerId)!, "assigned", { leadId: lead.leadId, at: lead.assignedAt || lead.createdAt });
    }

    // Calls Made / Connected: credited to whoever logged the call, else the lead owner
    for (const a of tl) {
      if (a.type !== "call" || !inRange(istDay(a.timestamp), period)) continue;
      const callerId = resolveTse(a.performedBy, byKey) ?? ownerId;
      if (!callerId || !rows.has(callerId)) continue;
      const r = rows.get(callerId)!;
      r.calls++;
      if (lc(a.outcome) === "connected") r.connected++;
      r.detail.calls.push({ leadId: lead.leadId, at: a.timestamp, note: a.outcome });
    }

    if (!ownerId) continue;
    const r = rows.get(ownerId)!;

    // Interested / Lost / Converted: stage moves in the period, once per lead
    const moved = (stage: string) => tl.find((a) => a.type === "stage_change" && toStage(a) === stage && inRange(istDay(a.timestamp), period));
    const mi = moved("interested");
    if (mi) bump(r, "interested", { leadId: lead.leadId, at: mi.timestamp });
    const ml = moved("lost");
    if (ml) bump(r, "lost", { leadId: lead.leadId, at: ml.timestamp });
    const convEvent = tl.find((a) => (a.type === "converted" || (a.type === "stage_change" && toStage(a) === "converted")) && inRange(istDay(a.timestamp), period));
    if (convEvent) r.converted++;

    // Follow-ups: each follow-up that was set and not replaced before it fell due
    const sets = tl.filter((a) => a.type === "follow_up_set" && a.metadata?.followUpDate);
    const dues: { due: string; setAt: string }[] = [];
    sets.forEach((a, i) => {
      const due = String(a.metadata!.followUpDate);
      const next = sets[i + 1];
      if (next && istDay(next.timestamp) <= istDay(due)) return; // replaced before it fell due
      dues.push({ due, setAt: a.timestamp });
    });
    if (lead.followUpDate && !dues.some((d) => istDay(d.due) === istDay(lead.followUpDate))) {
      const lastSet = sets[sets.length - 1];
      if (!lastSet || istDay(lastSet.metadata!.followUpDate) !== istDay(lead.followUpDate)) dues.push({ due: lead.followUpDate, setAt: lead.createdAt || lead.followUpDate });
    }
    const seen = new Set<string>();
    for (const d of dues) {
      const dayKey = istDay(d.due);
      if (seen.has(dayKey)) continue;
      seen.add(dayKey);
      if (inRange(dayKey, period)) bump(r, "followUps", { leadId: lead.leadId, at: d.due });
    }

    // Pending follow-ups: position at the end of the period, overdue only, lead still open, not actioned
    const closedAtEnd = tl.some((a) => ((a.type === "stage_change" && ["converted", "lost"].includes(toStage(a))) || a.type === "converted") && toMs(a.timestamp) <= periodEndMs);
    if (!closedAtEnd) {
      for (const d of dues) {
        const dueMs = toMs(d.due);
        if (Number.isNaN(dueMs) || dueMs > periodEndMs) continue; // not overdue yet
        const dueDay = istDay(d.due);
        const actioned = tl.some((a) => (a.type === "call" || a.type === "whatsapp") && istDay(a.timestamp) >= dueDay && toMs(a.timestamp) <= periodEndMs);
        if (!actioned) { r.pendingFollowUps++; r.detail.followUps.push({ leadId: lead.leadId, at: d.due, note: "pending" }); break; }
      }
    }
  }

  // Bookings and Sales ₹ from jobs
  for (const j of jobs) {
    const tseId = resolveTse(j.bookedByTseId, byKey) ?? (j.leadId ? leadOwner.get(j.leadId) : undefined);
    if (!tseId || !rows.has(tseId)) continue;
    const r = rows.get(tseId)!;
    const cancelled = lc(j.status) === "cancelled";
    if (!cancelled && inRange(istDay(j.createdAt), period)) r.bookings++;
    if (!cancelled && j.paymentStatus === "Paid") {
      const paidDay = istDay(j.paidAt || j.completedAt || j.createdAt);
      if (inRange(paidDay, period)) r.sales += Math.round(Number(j.finalAmount ?? j.amount ?? 0));
    }
  }

  const list = [...rows.values()];
  for (const r of list) r.conversionPct = pct(r.converted, r.assigned);
  list.sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name));
  return { period, asOf: new Date(now).toISOString(), rows: list, total: totalRow(list) };
}

function emptyRow(tseId: string, name: string, absent: boolean): Row {
  return {
    tseId, name, absent, assigned: 0, calls: 0, connected: 0, interested: 0, followUpsDue: 0,
    pendingFollowUps: 0, bookings: 0, lost: 0, converted: 0, sales: 0, conversionPct: null,
    detail: { assigned: [], calls: [], interested: [], followUps: [], lost: [] },
  };
}
function bump(r: Row, k: "assigned" | "interested" | "followUps" | "lost", item: DrillItem) {
  if (k === "followUps") r.followUpsDue++; else r[k]++;
  r.detail[k].push(item);
}

/** TOTAL row: counts and sales are added; Conversion % comes from the totals (never an average of percentages). */
export function totalRow(rows: Row[]): Row {
  const t = emptyRow("TOTAL", "TOTAL", false);
  for (const r of rows) {
    t.assigned += r.assigned; t.calls += r.calls; t.connected += r.connected; t.interested += r.interested;
    t.followUpsDue += r.followUpsDue; t.pendingFollowUps += r.pendingFollowUps; t.bookings += r.bookings;
    t.lost += r.lost; t.converted += r.converted; t.sales += r.sales;
  }
  t.conversionPct = pct(t.converted, t.assigned);
  return t;
}

export const COLUMNS = ["Telecaller", "Leads Assigned", "Calls Made", "Connected", "Interested", "Today's Follow-ups", "Pending Follow-ups", "Bookings", "Leads Lost", "Sales ₹", "Conversion %"];

export function rowCells(r: Row): string[] {
  return [
    r.absent ? `${r.name} (Absent)` : r.name, r.assigned, r.calls, r.connected, r.interested, r.followUpsDue,
    r.pendingFollowUps, r.bookings, r.lost, r.sales.toLocaleString("en-IN"),
    r.conversionPct === null ? "–" : `${r.conversionPct.toFixed(1)}%`,
  ].map(String);
}

/** Plain text, tab separated, with heading row and TOTAL row, for pasting into a spreadsheet or message. */
export function toTabText(rep: Report): string {
  return [COLUMNS, ...rep.rows.map(rowCells), rowCells(rep.total)].map((c) => c.join("\t")).join("\n");
}

/** Maps a TSE-screen call outcome to the common call record. */
export function normaliseCrmOutcome(o: string): { outcome: "Connected" | "Not Connected"; crmOutcome: string } {
  return { outcome: o === "NO_ANSWER" ? "Not Connected" : "Connected", crmOutcome: o };
}
