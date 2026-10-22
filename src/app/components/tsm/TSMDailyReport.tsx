/** TSM Daily Tele-Sales Performance Report. All figures come from services/tsmReport (single source of truth). */
import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useCustomers } from "../../contexts/CustomerContext";
import { useJobs } from "../../contexts/JobContext";
import { useRole } from "../../contexts/RoleContext";
import {
  buildReport, COLUMNS, loadTeam, periodFor, rowCells, toJobIn, toLeadIn, toTabText, validateCustom,
  type DrillItem, type PeriodKey, type Row,
} from "../../services/tsmReport";

const FILTERS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" }, { key: "yesterday", label: "Yesterday" },
  { key: "last_week", label: "Last week" }, { key: "last_month", label: "Last month" }, { key: "custom", label: "Custom" },
];
const DRILL: Record<number, "assigned" | "calls" | "interested" | "followUps" | "lost"> = { 1: "assigned", 2: "calls", 4: "interested", 5: "followUps", 6: "followUps", 8: "lost" };

export function TSMDailyReport() {
  const { leads = [] } = useCustomers() as any;
  const { allJobs = [] } = useJobs() as any;
  const { currentUser, currentRole } = useRole() as any;
  const [key, setKey] = useState<PeriodKey>("today");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [applied, setApplied] = useState<{ from: string; to: string } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [drill, setDrill] = useState<{ title: string; items: DrillItem[] } | null>(null);
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 }>({ col: 9, dir: -1 });

  useEffect(() => { if (key !== "today") return; const t = setInterval(() => setNow(Date.now()), 5 * 60000); return () => clearInterval(t); }, [key]);

  const period = useMemo(() => periodFor(key, now, applied ?? undefined), [key, now, applied]);
  const report = useMemo(() => buildReport({
    tses: loadTeam({ role: currentRole, employeeId: currentUser?.employeeId, name: currentUser?.name, cityId: currentUser?.cityId }),
    leads: leads.map(toLeadIn), jobs: allJobs.map(toJobIn), period, now,
  }), [leads, allJobs, period, now, currentRole, currentUser]);

  const value = (r: Row, c: number): number => (c === 10 ? r.conversionPct ?? -1 : Number(rowCells(r)[c].replace(/[^\d.-]/g, "")) || 0);
  const rows = [...report.rows].sort((a, b) => (sort.col === 0 ? a.name.localeCompare(b.name) * sort.dir : (value(a, sort.col) - value(b, sort.col)) * sort.dir));

  const applyCustom = () => {
    const err = validateCustom(from, to, Date.now());
    if (err) { toast.error(err); return; }
    setApplied({ from, to });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(toTabText({ ...report, rows })); toast.success("Table copied"); }
    catch { toast.error("Could not copy. Select the table and copy manually."); }
  };
  const open = (r: Row, c: number) => {
    const k = DRILL[c]; if (!k) return;
    let items = r.detail[k];
    if (c === 5) items = items.filter((i) => i.note !== "pending"); if (c === 6) items = items.filter((i) => i.note === "pending");
    if (items.length) setDrill({ title: `${r.name}: ${COLUMNS[c]}`, items });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Daily Tele-Sales Performance Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            {period.label}, as of {new Date(now).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={copy}><Copy className="w-4 h-4 mr-2" />Copy table</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button key={f.key} size="sm" variant={key === f.key ? "default" : "outline"} onClick={() => { setKey(f.key); setNow(Date.now()); }}>{f.label}</Button>
        ))}
        {key === "custom" && (
          <>
            <input type="date" className="border rounded px-2 py-1 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <input type="date" className="border rounded px-2 py-1 text-sm" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            <Button size="sm" onClick={applyCustom}>Apply</Button>
          </>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((c, i) => (
                <th key={c} onClick={() => setSort((s) => ({ col: i, dir: s.col === i ? (-s.dir as 1 | -1) : -1 }))}
                  className={`px-3 py-2 font-semibold text-gray-700 cursor-pointer whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={COLUMNS.length} className="px-3 py-6 text-center text-gray-500">No telecallers are linked to you. HR must set each TSE's reporting manager.</td></tr>}
            {rows.map((r) => (
              <tr key={r.tseId} className="border-t">
                {rowCells(r).map((cell, i) => (
                  <td key={i} onClick={() => open(r, i)}
                    className={`px-3 py-2 ${i === 0 ? "text-left font-medium" : "text-right"} ${DRILL[i] && cell !== "0" ? "text-teal-700 cursor-pointer underline-offset-2 hover:underline" : ""}`}>{cell}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 bg-gray-50 font-bold">
              {rowCells(report.total).map((cell, i) => <td key={i} className={`px-3 py-2 ${i === 0 ? "text-left" : "text-right"}`}>{cell}</td>)}
            </tr>
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-gray-500">Operational figures only. These are not the figures used to pay incentive. Calls, stage moves and follow-ups are counted from the day they were first logged.</p>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{drill?.title}</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto text-sm divide-y">
            {drill?.items.map((i, n) => (
              <div key={n} className="py-1.5 flex justify-between"><span>{i.leadId}{i.note ? ` · ${i.note}` : ""}</span><span className="text-gray-500">{i.at ? new Date(i.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}</span></div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default TSMDailyReport;
