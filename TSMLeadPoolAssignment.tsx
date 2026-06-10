/**
 * TSM LEAD POOL ASSIGNMENT
 * Morning screen for TSM to assign overnight/unassigned leads to TSEs.
 *
 * SLA rules:
 * - Overnight leads show "Collected Xh ago" — NOT "SLA Breached"
 * - SLA clock (2 business hours) starts ONLY when the TSM assigns to a TSE
 * - No SLA ticking on Sundays or public holidays (from HR calendar)
 * - During business hours (Mon-Sat 09-19): leads created now → assign immediately
 * - Outside business hours: leads queue in pool for next working day assignment
 */

import { useState, useMemo } from "react";
import { useCustomers } from "../../contexts/CustomerContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Users, MapPin, Clock, CheckCircle2,
  Phone, Car, Filter, UserCheck, RefreshCw, Inbox,
  AlertTriangle, Sun, Info
} from "lucide-react";
import { toast } from "sonner";
import { calcPoolSLA, isBusinessHoursNow, SLA_CONFIG } from "../../utils/leadSLA";
import { SupervisorPincodePanel } from "../shared/SupervisorPincodePanel";

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  const m = Math.floor(((Date.now() - new Date(iso).getTime()) % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h ago`;
  if (h >= 1)  return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

export function TSMLeadPoolAssignment() {
  const { leads, updateLead } = useCustomers();
  const { employees } = useEmployee();
  const { city } = useCity();

  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [areaFilter, setAreaFilter] = useState<string>("ALL");
  const [bulkTSEId, setBulkTSEId] = useState<string>("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [perLeadTSE, setPerLeadTSE] = useState<Record<string, string>>({});
  const [expandedLead, setExpandedLead] = useState<string | null>(null); // show supervisor panel

  const bizHoursNow = isBusinessHoursNow();

  // Pool = leads with no assignedTo in this city
  const poolLeads = useMemo(() =>
    leads.filter((l: any) =>
      (!l.assignedTo || l.assignedTo.trim() === "") &&
      (l.cityId === city || !l.cityId) &&
      l.status !== "Converted" && l.status !== "Rejected"
    ).sort((a: any, b: any) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
    [leads, city]
  );

  // TSEs in this city
  const tseList = useMemo(() =>
    employees.filter((e: any) =>
      (e.role === "TSE" || e.designation === "TSE") &&
      (e.cityId === city || e.workLocation === city || e.city === city)
    ),
    [employees, city]
  );

  const areas = useMemo(() => {
    const set = new Set(poolLeads.map((l: any) => l.address?.area || "Unknown"));
    return ["ALL", ...Array.from(set).sort()];
  }, [poolLeads]);

  const filtered = areaFilter === "ALL"
    ? poolLeads
    : poolLeads.filter((l: any) => (l.address?.area || "Unknown") === areaFilter);

  // Counts
  const urgent = poolLeads.filter((l: any) => {
    const h = (Date.now() - new Date(l.createdAt).getTime()) / 3600000;
    return h > 12;
  }).length;

  const recent = poolLeads.filter((l: any) => {
    const h = (Date.now() - new Date(l.createdAt).getTime()) / 3600000;
    return h <= 6;
  }).length;

  function assignLead(leadId: string, tseId: string) {
    const tse = tseList.find((t: any) => t.id === tseId || t.employeeId === tseId);
    const tseName = tse
      ? `${(tse as any).firstName || ""} ${(tse as any).lastName || ""}`.trim()
      : tseId;

    setAssigningId(leadId);
    setTimeout(() => {
      updateLead(leadId, {
        assignedTo: tseId,
        assignedTSE: tseName,
        assignedAt: new Date().toISOString(), // SLA clock starts NOW
        stage: "contacted" as any,
      });
      setAssigningId(null);
      toast.success(`Lead assigned to ${tseName} — SLA clock started`);
    }, 300);
  }

  function bulkAssign() {
    if (!bulkTSEId) { toast.error("Select a TSE first"); return; }
    if (selectedLeads.size === 0) { toast.error("Select at least one lead"); return; }
    const tse = tseList.find((t: any) => t.id === bulkTSEId || t.employeeId === bulkTSEId);
    const tseName = tse
      ? `${(tse as any).firstName || ""} ${(tse as any).lastName || ""}`.trim()
      : bulkTSEId;
    const now = new Date().toISOString();
    selectedLeads.forEach(leadId => {
      updateLead(leadId, {
        assignedTo: bulkTSEId,
        assignedTSE: tseName,
        assignedAt: now, // SLA starts at assignment time, not creation
        stage: "contacted" as any,
      });
    });
    toast.success(`${selectedLeads.size} leads assigned to ${tseName} — SLA clocks started`);
    setSelectedLeads(new Set());
    setBulkTSEId("");
  }

  function toggleLead(id: string) {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (poolLeads.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900">All leads assigned</h3>
          <p className="text-sm text-green-700 mt-1">No unassigned leads in the pool.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* Business hours banner */}
      <div className={`rounded-lg p-3 flex items-center gap-3 text-sm ${
        bizHoursNow
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-amber-50 border border-amber-200 text-amber-800"
      }`}>
        {bizHoursNow
          ? <><CheckCircle2 className="w-4 h-4 shrink-0" /><span><strong>Business hours active</strong> ({SLA_CONFIG.WORKING_DAYS}). SLA clock starts immediately on assignment.</span></>
          : <><Sun className="w-4 h-4 shrink-0" /><span><strong>Outside business hours.</strong> When you assign leads now, the SLA clock will start at 09:00 next working day — not immediately.</span></>
        }
      </div>

      {/* SLA explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>SLA starts when you assign</strong> — not when the lead was collected.
          Overnight leads show collection time only. The 2-hour SLA timer (to first contact) begins the moment you click Assign.
          Sundays and public holidays are excluded from SLA counting.
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3 flex items-center gap-3">
            <Inbox className="w-7 h-7 text-orange-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-orange-700">{poolLeads.length}</div>
              <div className="text-xs text-orange-600">In Pool</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-red-700">{urgent}</div>
              <div className="text-xs text-red-600">Older than 12h — Assign now</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="w-7 h-7 text-blue-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{recent}</div>
              <div className="text-xs text-blue-600">Fresh (under 6h)</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="w-7 h-7 text-green-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-green-700">{tseList.length}</div>
              <div className="text-xs text-green-600">TSEs Available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="text-sm border rounded px-2 py-1"
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
          >
            {areas.map(a => (
              <option key={a} value={a}>{a === "ALL" ? "All Areas" : a}</option>
            ))}
          </select>

          <Button variant="outline" size="sm"
            onClick={() => setSelectedLeads(new Set(filtered.map((l: any) => l.leadId)))}>
            Select All ({filtered.length})
          </Button>
          {selectedLeads.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSelectedLeads(new Set())}>
              Clear ({selectedLeads.size})
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <select
              className="text-sm border rounded px-2 py-1"
              value={bulkTSEId}
              onChange={e => setBulkTSEId(e.target.value)}
            >
              <option value="">Assign to TSE…</option>
              {tseList.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={selectedLeads.size === 0 || !bulkTSEId}
              onClick={bulkAssign}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Assign {selectedLeads.size > 0 ? `(${selectedLeads.size})` : ""}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lead cards */}
      <div className="space-y-2">
        {filtered.map((lead: any) => {
          const sla = calcPoolSLA(lead.createdAt);
          const isSelected = selectedLeads.has(lead.leadId);
          const tseForThis = perLeadTSE[lead.leadId] || "";

          return (
            <Card
              key={lead.leadId}
              className={`transition-all cursor-pointer border-2 ${
                isSelected ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => toggleLead(lead.leadId)}
            >
              <CardContent className="p-3">
                <div className="flex flex-wrap items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLead(lead.leadId)}
                    onClick={e => e.stopPropagation()}
                    className="mt-1 w-4 h-4 accent-blue-600"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </span>
                      {/* Pool badge — never says "SLA Breached" */}
                      <Badge className={sla.badgeClass}>{sla.label}</Badge>
                      {lead.temperature && (
                        <Badge className={
                          lead.temperature === "hot"  ? "bg-red-100 text-red-700" :
                          lead.temperature === "warm" ? "bg-orange-100 text-orange-700" :
                                                        "bg-blue-100 text-blue-700"
                        }>{lead.temperature}</Badge>
                      )}
                      {lead.leadSource && (
                        <Badge variant="outline" className="text-xs">{lead.leadSource}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />{lead.phone}
                      </span>
                      {lead.address?.area && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {lead.address.area}
                          {lead.address.pinCode && ` — ${lead.address.pinCode}`}
                        </span>
                      )}
                      {lead.vehicleDetails?.category && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />{lead.vehicleDetails.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />Collected {timeAgo(lead.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Per-lead assign */}
                  <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={tseForThis}
                      onChange={e => setPerLeadTSE(prev => ({ ...prev, [lead.leadId]: e.target.value }))}
                    >
                      <option value="">Pick TSE…</option>
                      {tseList.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!tseForThis || assigningId === lead.leadId}
                      onClick={() => assignLead(lead.leadId, tseForThis)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {assigningId === lead.leadId
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <UserCheck className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && areaFilter !== "ALL" && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No unassigned leads in {areaFilter}
        </div>
      )}
    </div>
  );
}

export default TSMLeadPoolAssignment;
