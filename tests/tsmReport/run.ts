// Run: npm run test:tsmreport
import * as E from "../../src/app/services/tsmReport/engine";
let pass = 0, fail = 0;
const eq = (n: string, got: unknown, want: unknown) => { JSON.stringify(got) === JSON.stringify(want) ? pass++ : (fail++, console.log(`FAIL ${n}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)); };

// 22 Oct 2026 is a Thursday. 15:00 IST = 09:30Z
const NOW = Date.parse("2026-10-22T14:30:00+05:30");
eq("today", E.periodFor("today", NOW).from, "2026-10-22");
eq("yesterday", E.periodFor("yesterday", NOW).to, "2026-10-21");
const lw = E.periodFor("last_week", NOW); eq("last week", [lw.from, lw.to], ["2026-10-12", "2026-10-18"]);
const lm = E.periodFor("last_month", NOW); eq("last month", [lm.from, lm.to], ["2026-09-01", "2026-09-30"]);
eq("jan rollover", E.periodFor("last_month", Date.parse("2027-01-05T10:00:00+05:30")).from, "2026-12-01");
eq("custom bad", E.validateCustom("2026-10-10", "2026-10-05", NOW) !== null, true);
eq("custom future", E.validateCustom("2026-10-10", "2026-10-30", NOW) !== null, true);
eq("custom ok", E.validateCustom("2026-10-01", "2026-10-22", NOW), null);
eq("late night IST day", E.istDay("2026-10-21T20:00:00Z"), "2026-10-22");

const tses = [
  { id: "T1", name: "Executive 1", aliases: ["EMP-1"] },
  { id: "T2", name: "Executive 2", aliases: ["EMP-2"] },
  { id: "T3", name: "Idle", aliases: [] },
];
const today = E.periodFor("today", NOW);
const call = (by: string, outcome: string, ts = "2026-10-22T10:00:00+05:30") => ({ timestamp: ts, type: "call", performedBy: by, outcome });
const stage = (to: string, ts = "2026-10-22T11:00:00+05:30") => ({ timestamp: ts, type: "stage_change", metadata: { to } });
const mkLead = (id: string, owner: string, timeline: any[] = [], extra: any = {}) => ({ leadId: id, owner, assignedAt: "2026-10-22T09:00:00+05:30", timeline, ...extra });

// 1. nothing logged
let r = E.buildReport({ tses, leads: [], jobs: [], period: today, now: NOW });
eq("zeros", r.rows.every((x) => x.calls === 0 && x.sales === 0 && x.conversionPct === null), true);
eq("total zero dash", r.total.conversionPct, null);
eq("idle row present", r.rows.length, 3);

// 2/3. calls
r = E.buildReport({ tses, period: today, now: NOW, jobs: [], leads: [
  mkLead("L1", "Executive 1", [call("Executive 1", "Connected"), call("Executive 1", "Not Connected")]),
] });
const t1 = r.rows.find((x) => x.tseId === "T1")!;
eq("calls", [t1.calls, t1.connected], [2, 1]);
// call by alias id, owner by id
r = E.buildReport({ tses, period: today, now: NOW, jobs: [], leads: [mkLead("L1", "EMP-1", [call("EMP-1", "Connected")])] });
eq("alias match", r.rows.find((x) => x.tseId === "T1")!.connected, 1);

// 4. interested twice counts once
r = E.buildReport({ tses, period: today, now: NOW, jobs: [], leads: [mkLead("L1", "Executive 1", [stage("interested"), stage("contacted", "2026-10-22T12:00:00+05:30"), stage("interested", "2026-10-22T13:00:00+05:30")])] });
eq("interested once", r.rows.find((x) => x.tseId === "T1")!.interested, 1);

// 5/6. today vs yesterday windows
const lead5 = mkLead("L1", "Executive 1", [call("Executive 1", "Connected", "2026-10-22T10:00:00+05:30"), call("Executive 1", "Connected", "2026-10-21T10:00:00+05:30")]);
const at10 = E.buildReport({ tses, leads: [lead5], jobs: [], period: today, now: Date.parse("2026-10-22T10:30:00+05:30") });
eq("today 10:30", at10.rows.find((x) => x.tseId === "T1")!.calls, 1);
const yd = E.periodFor("yesterday", NOW);
const y1 = E.buildReport({ tses, leads: [lead5], jobs: [], period: yd, now: NOW });
const y2 = E.buildReport({ tses, leads: [lead5], jobs: [], period: yd, now: NOW + 3600000 });
eq("yesterday stable", [y1.rows[0].calls, y1.rows[0].calls], [y2.rows[0].calls, 1].slice(0, 1).concat([1]));

// worked example from the spec (Executive 1: 20 leads, 3 converted; Executive 2: 10 leads, 1 converted)
const leads: any[] = [];
for (let i = 0; i < 20; i++) leads.push(mkLead(`A${i}`, "Executive 1", i < 3 ? [stage("converted")] : []));
for (let i = 0; i < 10; i++) leads.push(mkLead(`B${i}`, "Executive 2", i < 1 ? [stage("converted")] : []));
r = E.buildReport({ tses, leads, jobs: [], period: today, now: NOW });
eq("e1 conv", r.rows.find((x) => x.tseId === "T1")!.conversionPct, 15);
eq("e2 conv", r.rows.find((x) => x.tseId === "T2")!.conversionPct, 10);
eq("total conv from totals", r.total.conversionPct, 13.3);
eq("total assigned", r.total.assigned, 30);
eq("total = sum", r.total.converted, r.rows.reduce((a, x) => a + x.converted, 0));

// jobs: bookings and sales, cancelled excluded, lead-owner link
r = E.buildReport({ tses, period: today, now: NOW,
  leads: [mkLead("L1", "Executive 1")],
  jobs: [
    { jobId: "J1", leadId: "L1", status: "Assigned", amount: 1000, paymentStatus: "Paid", createdAt: "2026-10-22T09:30:00+05:30", completedAt: "2026-10-22T12:00:00+05:30" },
    { jobId: "J2", bookedByTseId: "EMP-1", status: "Cancelled", amount: 500, paymentStatus: "Paid", createdAt: "2026-10-22T09:30:00+05:30" },
    { jobId: "J3", leadId: "L1", status: "Assigned", amount: 400, paymentStatus: "Pending", createdAt: "2026-10-22T09:30:00+05:30" },
  ] });
const j1 = r.rows.find((x) => x.tseId === "T1")!;
eq("bookings", j1.bookings, 2); eq("sales paid only", j1.sales, 1000);

// follow-ups
const fu = (due: string, setTs: string) => ({ timestamp: setTs, type: "follow_up_set", metadata: { followUpDate: due } });
r = E.buildReport({ tses, jobs: [], period: today, now: NOW, leads: [
  mkLead("F1", "Executive 1", [fu("2026-10-22T11:00", "2026-10-20T10:00:00+05:30")], { followUpDate: "2026-10-22T11:00" }),   // due today, overdue, not actioned
  mkLead("F2", "Executive 1", [fu("2026-10-22T11:00", "2026-10-20T10:00:00+05:30"), call("Executive 1", "Connected", "2026-10-22T11:30:00+05:30")]), // actioned
  mkLead("F3", "Executive 1", [fu("2026-10-22T18:00", "2026-10-20T10:00:00+05:30")]),  // due later today: not overdue
  mkLead("F4", "Executive 1", [fu("2026-10-21T11:00", "2026-10-20T10:00:00+05:30"), stage("lost", "2026-10-21T15:00:00+05:30")]), // closed
] });
const f = r.rows.find((x) => x.tseId === "T1")!;
eq("followups due today", f.followUpsDue, 3);
eq("pending overdue only", f.pendingFollowUps, 1);
// replaced follow-up: old date dropped
r = E.buildReport({ tses, jobs: [], period: today, now: NOW, leads: [mkLead("G1", "Executive 1", [fu("2026-10-22T11:00", "2026-10-20T10:00:00+05:30"), fu("2026-10-25T11:00", "2026-10-21T10:00:00+05:30")])] });
eq("replaced not counted", r.rows.find((x) => x.tseId === "T1")!.followUpsDue, 0);

// copy text
const txt = E.toTabText(r).split("\n");
eq("copy lines", txt.length, 1 + 3 + 1);
eq("copy cols", txt[0].split("\t").length, 11);
eq("copy total row", txt[txt.length - 1].startsWith("TOTAL\t"), true);
eq("outcome map", [E.normaliseCrmOutcome("NO_ANSWER").outcome, E.normaliseCrmOutcome("CALLBACK").outcome], ["Not Connected", "Connected"]);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
