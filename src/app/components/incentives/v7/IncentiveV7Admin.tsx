/**
 * Incentive plan of 7 Oct (V7) — admin screen.
 * Tabs: Overview (mode, run, payroll, lock) · Rules (editable, versioned) · HR (calendar, holiday toggle) ·
 * Super Admin (TSM conversion formula) · Payable · Conversions · Provision · Audit.
 * The legacy incentive screens and engines are unchanged and remain available as the fallback.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../../contexts/RoleContext";
import {
  TSM_CONVERSION_FORMULAS, getActiveConfig, getCalendarOverride, getMode, getSettings, getVersions, lockMonth,
  postToPayroll, publishConfig, readAll, runIncentiveV7, setCalendarOverride, setHolidayUnitsToggle, setMode,
  setTsmConversionFormula, payrollLabel,
} from "../../../services/incentiveV7";
import type { IncentiveConfig, IncentiveMode } from "../../../services/incentiveV7";

type Tab = "overview" | "rules" | "hr" | "super" | "payable" | "sales" | "provision" | "audit";
const TABS: [Tab, string][] = [
  ["overview", "Overview"], ["rules", "Rules"], ["hr", "HR"], ["super", "Super Admin"],
  ["payable", "Payable"], ["sales", "Conversions"], ["provision", "Provision"], ["audit", "Audit"],
];
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

const box = "rounded-lg border border-gray-200 bg-white p-4";
const btn = "rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50";
const btn2 = "rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50";
const inp = "rounded border border-gray-300 px-2 py-1 text-sm w-28";

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead><tr className="border-b text-left text-gray-500">{head.map((h) => <th key={h} className="px-2 py-1.5 font-medium">{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td className="px-2 py-3 text-gray-400" colSpan={head.length}>Nothing yet.</td></tr>}
          {rows.map((r, i) => <tr key={i} className="border-b last:border-0">{r.map((c, j) => <td key={j} className="px-2 py-1.5">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function IncentiveV7Admin() {
  const { currentUser, currentRole } = useRole();
  const actor = currentUser?.name || "Unknown";
  const isSuper = String(currentRole) === "Super Admin";
  const isHR = isSuper || String(currentRole) === "HR" || String(currentRole) === "Admin";
  const [tab, setTab] = useState<Tab>("overview");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const settings = useMemo(() => getSettings(), [tick]);
  const mode = getMode();
  const [month, setMonth] = useState(today().slice(0, 7));

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Incentives — 7 Oct plan</h1>
        <p className="text-sm text-gray-500">
          Full-time and part-time washers, TSE and TSM. The earlier incentive structure is untouched and stays available:
          set the mode to “Legacy” to fall back at any time.
        </p>
      </div>
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm ${tab === k ? "border-b-2 border-blue-600 font-medium text-blue-700" : "text-gray-600"}`}>{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className={box}>
            <div className="mb-2 font-medium">Mode</div>
            <div className="flex flex-wrap items-center gap-3">
              {(["legacy", "shadow", "v7"] as IncentiveMode[]).map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="mode" checked={mode === m} disabled={!isSuper}
                    onChange={() => {
                      if (m === "v7" && !window.confirm("Switch to V7? Payroll posting for the new plan becomes possible. The legacy plan stays available.")) return;
                      setMode(m, actor); refresh(); toast.success(`Mode: ${m}`);
                    }} />
                  {m === "legacy" ? "Legacy (new plan idle)" : m === "shadow" ? "Shadow (calculate only, never pay)" : "V7 (pay through payroll)"}
                </label>
              ))}
            </div>
            {!isSuper && <p className="mt-2 text-xs text-gray-500">Only the Super Admin can change the mode.</p>}
            <p className="mt-2 text-xs text-gray-500">Last run: {settings.last_run_at ? new Date(settings.last_run_at).toLocaleString() : "never"} {settings.last_run_summary ? `· ${settings.last_run_summary}` : ""}</p>
            <div className="mt-3"><button className={btn} onClick={() => { const r = runIncentiveV7(); toast(r.message); refresh(); }}>Recalculate now</button></div>
          </div>
          <div className={box}>
            <div className="mb-2 font-medium">Payroll month</div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="month" className={inp} value={month} onChange={(e) => setMonth(e.target.value)} />
              <button className={btn} disabled={!isHR} onClick={() => {
                const r = postToPayroll(month, actor);
                if (r.skipped) toast.error(r.skipped); else toast.success(`Posted ${r.posted} rows, ${inr(r.total)} to ${payrollLabel(month)} payroll`);
                refresh();
              }}>Post eligible to payroll</button>
              <button className={btn2} disabled={!isSuper} onClick={() => {
                if (window.confirm(`Lock ${month}? Its figures freeze.`)) { lockMonth(month, actor); refresh(); }
              }}>Lock month</button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Posting creates approved “Other earning” adjustments that the payroll run picks up. It does nothing unless the mode is V7.</p>
          </div>
          <div className={box}>
            <div className="mb-2 font-medium">Month summaries</div>
            <Table head={["Role", "Employee", "Month", "Detail", "Amount", "Status"]}
              rows={readAll("INC7_MONTH_SUMMARIES").filter((s) => s.month === month).map((s) => [
                s.role, s.employee_name, s.month,
                s.role === "TSM" ? `${s.team_washes} washes, conv ${s.conversion_rate ?? "n/a"}` : `${s.days_counted ?? 0} days${s.cars_counted ? `, ${s.cars_counted} cars` : ""}`,
                inr(s.capped_amount), s.status])} />
          </div>
        </div>
      )}

      {tab === "rules" && <Rules actor={actor} canEdit={isSuper || isHR} onSaved={refresh} />}
      {tab === "hr" && <HR actor={actor} canEdit={isHR} onSaved={refresh} />}
      {tab === "super" && (
        <div className={box}>
          <div className="mb-2 font-medium">TSM conversion-rate formula</div>
          <p className="mb-2 text-sm text-gray-600">Until a formula is chosen the TSM conversion bonus is ₹0. The volume bonus is unaffected.</p>
          {(() => {
            const cur = getActiveConfig().tsm.conversion_rate_definition;
            return (
              <div className="space-y-2">
                {[{ key: "", label: "None (bonus ₹0)", description: "" }, ...TSM_CONVERSION_FORMULAS].map((f) => (
                  <label key={f.key} className="flex items-start gap-2 text-sm">
                    <input type="radio" name="formula" disabled={!isSuper} checked={(cur ?? "") === f.key}
                      onChange={() => { const r = setTsmConversionFormula(f.key || null, today(), actor); r.ok ? toast.success("Saved as a new config version") : toast.error(r.errors.join("; ")); refresh(); }} />
                    <span><span className="font-medium">{f.label}</span>{f.description && <span className="block text-xs text-gray-500">{f.description}</span>}</span>
                  </label>
                ))}
                {!isSuper && <p className="text-xs text-gray-500">Only the Super Admin can change this.</p>}
              </div>
            );
          })()}
        </div>
      )}

      {tab === "payable" && (
        <div className={box}>
          <Table head={["Payroll month", "Employee", "Role", "Component", "Amount", "Status", "Adjustment"]}
            rows={[...readAll("INC7_LEDGER")].sort((a, b) => b.payroll_month.localeCompare(a.payroll_month)).slice(0, 500).map((l) => [
              l.payroll_month, l.employee_name, l.role, l.component, inr(l.amount), l.status, l.adjustment_id ?? "-"])} />
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-4">
          <div className={box}>
            <div className="mb-2 font-medium">Conversion sales</div>
            <Table head={["Sale", "Customer", "TSE", "Class", "Plan", "Term", "Total", "Status"]}
              rows={readAll("INC7_SALES").slice(-300).reverse().map((s) => [s.id, s.customer_id, s.tse_id, s.classification, s.family, `${s.term_months}m`, inr(s.total_incentive), s.status])} />
          </div>
          <div className={box}>
            <div className="mb-2 font-medium">Instalments</div>
            <Table head={["Sale", "#", "Checkpoint", "Due", "Payroll", "Amount", "Status", "Reason"]}
              rows={readAll("INC7_INSTALMENTS").slice(-400).reverse().map((i) => [i.sale_id, i.seq, `month ${i.checkpoint_month}`, i.due_date, i.payroll_month, inr(i.amount), i.status, i.forfeit_reason ?? ""])} />
          </div>
        </div>
      )}

      {tab === "provision" && (
        <div className={box}>
          <Table head={["Date", "Event", "Debit", "Credit", "Amount", "Sale"]}
            rows={[...readAll("INC7_PROVISION")].sort((a, b) => b.posting_date.localeCompare(a.posting_date)).slice(0, 400).map((p) => [p.posting_date, p.event, p.debit_account, p.credit_account, inr(p.amount), p.sale_id])} />
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-4">
          <div className={box}>
            <div className="mb-2 font-medium">Config versions</div>
            <Table head={["Version", "Effective from", "By", "Reason"]}
              rows={getVersions().map((v) => [`v${v.version}`, v.effective_from, v.created_by, v.reason])} />
          </div>
          <div className={box}>
            <div className="mb-2 font-medium">Audit log</div>
            <Table head={["When", "Who", "Action", "Detail"]}
              rows={[...readAll("INC7_AUDIT")].reverse().slice(0, 300).map((a) => [new Date(a.at).toLocaleString(), a.actor, a.action, a.detail ?? ""])} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rules editor ─────────────────────────────────────────────────────────────
function setPath(obj: any, path: (string | number)[], value: unknown) {
  let o = obj;
  for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
  o[path[path.length - 1]] = value;
}

function Rules({ actor, canEdit, onSaved }: { actor: string; canEdit: boolean; onSaved: () => void }) {
  const [cfg, setCfg] = useState<IncentiveConfig>(() => clone(getActiveConfig()));
  const [effective, setEffective] = useState(today());
  const [reason, setReason] = useState("");
  const set = (path: (string | number)[], v: number | boolean | null) => { const c = clone(cfg); setPath(c, path, v); setCfg(c); };
  const N = ({ label, path, pct }: { label: string; path: (string | number)[]; pct?: boolean }) => {
    let v: any = cfg; for (const p of path) v = v?.[p];
    return (
      <label className="flex items-center justify-between gap-3 py-1 text-sm">
        <span>{label}</span>
        <input type="number" className={inp} disabled={!canEdit} step={pct ? 0.01 : 1}
          value={v ?? ""} onChange={(e) => set(path, e.target.value === "" ? null : Number(e.target.value))} />
      </label>
    );
  };
  const ft = cfg.washer.full_time;
  return (
    <div className="space-y-4">
      <div className={box}>
        <div className="mb-1 font-medium">Full-time washer (daily)</div>
        <N label="Slab starts at unit" path={["washer", "full_time", "slab", "start_unit"]} />
        <N label="₹ per unit (every unit from the first)" path={["washer", "full_time", "slab", "rate_per_unit"]} />
        <N label="One-time bonus at unit" path={["washer", "full_time", "slab", "bonus_unit"]} />
        <N label="One-time bonus ₹" path={["washer", "full_time", "slab", "bonus_amount"]} />
        <N label="Revenue guard: share of ex-GST revenue (0.30 = 30%)" path={["washer", "full_time", "guard", "pct_of_ex_gst_revenue"]} pct />
        <N label="Monthly cap per washer ₹ (blank = none)" path={["washer", "full_time", "guard", "monthly_cap_per_washer"]} />
        <N label="SLA window (± minutes)" path={["washer", "sla_minutes"]} />
        <N label="Deep clean weight (units)" path={["washer", "unit_weights", "interior_deep_clean_chemical"]} />
        <label className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" disabled={!canEdit} checked={ft.guard.enabled} onChange={(e) => set(["washer", "full_time", "guard", "enabled"], e.target.checked)} /> Revenue guard enabled</label>
      </div>
      <div className={box}>
        <div className="mb-1 font-medium">Part-time washer (monthly)</div>
        <N label="Threshold cars" path={["washer", "part_time", "threshold_cars"]} />
        <N label="₹ per car (all cars from the first)" path={["washer", "part_time", "rate_per_car"]} />
        <N label="Cap on cars" path={["washer", "part_time", "cap_cars"]} />
      </div>
      <div className={box}>
        <div className="mb-1 font-medium">TSE daily one-time slab</div>
        <N label="₹ per car starts at car" path={["tse", "daily_slab", "per_car_start"]} />
        <N label="₹ per car" path={["tse", "daily_slab", "per_car_rate"]} />
        {cfg.tse.daily_slab.milestones.map((m, i) => (
          <div key={i}><N label={`Milestone ${i + 1}: at car`} path={["tse", "daily_slab", "milestones", i, "at"]} /><N label="  bonus ₹" path={["tse", "daily_slab", "milestones", i, "bonus"]} /></div>
        ))}
      </div>
      <div className={box}>
        <div className="mb-1 font-medium">TSE conversion</div>
        <N label="Window (days from first paid one-time wash)" path={["tse", "conversion", "window_days"]} />
        {(Object.keys(cfg.tse.conversion.matrix) as (keyof typeof cfg.tse.conversion.matrix)[]).map((fam) =>
          ["1", "3", "6"].map((t) => <N key={fam + t} label={`${fam} · ${t} month`} path={["tse", "conversion", "matrix", fam, t]} />))}
        {cfg.tse.conversion.renewals.map((_, i) => <N key={i} label={`Renewal ${i + 1}${i === 2 ? " and later" : ""}`} path={["tse", "conversion", "renewals", i]} />)}
        {Object.keys(cfg.tse.conversion.wash_milestones).map((k) => <N key={k} label={`Wash milestone ${k} [open]`} path={["tse", "conversion", "wash_milestones", k]} />)}
        {Object.keys(cfg.tse.conversion.upgrades).map((k) => <N key={k} label={`Upgrade ${k}`} path={["tse", "conversion", "upgrades", k]} />)}
      </div>
      <div className={box}>
        <div className="mb-1 font-medium">TSM bonus tiers</div>
        {cfg.tsm.volume_tiers.map((_, i) => (<div key={i}><N label={`Volume tier ${i + 1}: washes`} path={["tsm", "volume_tiers", i, "washes"]} /><N label="  bonus ₹" path={["tsm", "volume_tiers", i, "bonus"]} /></div>))}
        {cfg.tsm.conversion_tiers.map((_, i) => (<div key={i}><N label={`Conversion tier ${i + 1}: rate %`} path={["tsm", "conversion_tiers", i, "rate_pct"]} /><N label="  bonus ₹" path={["tsm", "conversion_tiers", i, "bonus"]} /></div>))}
      </div>
      {canEdit ? (
        <div className={`${box} flex flex-wrap items-end gap-3`}>
          <label className="text-sm">Effective from<br /><input type="date" className={inp} min={today()} value={effective} onChange={(e) => setEffective(e.target.value)} /></label>
          <label className="flex-1 text-sm">Reason<br /><input className="w-full rounded border border-gray-300 px-2 py-1 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <button className={btn} onClick={() => {
            const r = publishConfig(cfg, effective, actor, reason);
            if (r.ok) { toast.success(`Published v${r.row.version}, effective ${effective}`); setReason(""); onSaved(); } else toast.error(r.errors.join("; "));
          }}>Publish new version</button>
        </div>
      ) : <p className="text-sm text-gray-500">You can view but not edit the rules.</p>}
      <p className="text-xs text-gray-500">Each publish creates a new version that applies from its date onward. Past payouts are never rewritten.</p>
    </div>
  );
}

// ── HR ───────────────────────────────────────────────────────────────────────
function HR({ actor, canEdit, onSaved }: { actor: string; canEdit: boolean; onSaved: () => void }) {
  const cfg = getActiveConfig();
  const [m, setM] = useState(today().slice(0, 7));
  const [days, setDays] = useState<string>(String(getCalendarOverride(m) ?? ""));
  const [from, setFrom] = useState(today());
  return (
    <div className="space-y-4">
      <div className={box}>
        <div className="mb-2 font-medium">Working days for the month</div>
        <p className="mb-2 text-sm text-gray-600">Default: days in the month minus 4 weekly offs (30-day month = 26). Enter a number to override.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" className={inp} value={m} onChange={(e) => { setM(e.target.value); setDays(String(getCalendarOverride(e.target.value) ?? "")); }} />
          <input type="number" className={inp} placeholder="auto" value={days} onChange={(e) => setDays(e.target.value)} />
          <button className={btn} disabled={!canEdit} onClick={() => { setCalendarOverride(m, days === "" ? null : Number(days), actor); toast.success("Saved"); onSaved(); }}>Save</button>
        </div>
      </div>
      <div className={box}>
        <div className="mb-2 font-medium">Units worked on a public holiday count toward the daily slab</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Now: <b>{cfg.washer.holiday_units_count_toward_slab ? "Applicable" : "Not Applicable"}</b></span>
          <input type="date" className={inp} min={today()} value={from} onChange={(e) => setFrom(e.target.value)} />
          <button className={btn} disabled={!canEdit} onClick={() => {
            const r = setHolidayUnitsToggle(!cfg.washer.holiday_units_count_toward_slab, from, actor);
            r.ok ? toast.success("New version published") : toast.error(r.errors.join("; ")); onSaved();
          }}>Switch</button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Holiday work earns a comp-off either way. There is no overtime.</p>
      </div>
    </div>
  );
}
