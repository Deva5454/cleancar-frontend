/**
 * TSM LEAD POOL ASSIGNMENT
 * Morning screen for TSM to assign overnight/unassigned leads to TSEs.
 *
 * Shows all leads with assignedTo = null or empty, grouped by area/pincode.
 * TSM can assign individually or bulk-assign by area to a TSE.
 */

import { useState, useMemo } from "react";
import { useCustomers } from "../../contexts/CustomerContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Users, MapPin, Clock, CheckCircle2, AlertTriangle,
  Phone, Car, Filter, UserCheck, RefreshCw, Inbox
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 1) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

function slaBadge(createdAt: string): { label: string; cls: string } {
  const h = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (h > 8) return { label: "SLA Breached", cls: "bg-red-100 text-red-700" };
  if (h > 4) return { label: "At Risk", cls: "bg-orange-100 text-orange-700" };
  return { label: "Within SLA", cls: "bg-green-100 text-green-700" };
}

export function TSMLeadPoolAssignment() {
  const { leads, updateLead } = useCustomers();
  const { employees } = useEmployee();
  const { currentUser } = useRole();
  const { city } = useCity();

  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [areaFilter, setAreaFilter] = useState<string>("ALL");
  const [bulkTSEId, setBulkTSEId] = useState<string>("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [perLeadTSE, setPerLeadTSE] = useState<Record<string, string>>({});

  // Pool = leads with no assignedTo, in this city
  const poolLeads = useMemo(() =>
    leads.filter(l =>
      (!l.assignedTo || l.assignedTo.trim() === "") &&
      (l.cityId === city || !l.cityId) &&
      l.status !== "Converted" && l.status !== "Rejected"
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [leads, city]
  );

  // TSEs in this city
  const tseList = useMemo(() =>
    employees.filter(e =>
      (e as any).role === "TSE" &&
      ((e as any).cityId === city || (e as any).workLocation === city || (e as any).city === city)
    ),
    [employees, city]
  );

  // Areas in pool for filter
  const areas = useMemo(() => {
    const set = new Set(poolLeads.map(l => l.address?.area || "Unknown"));
    return ["ALL", ...Array.from(set).sort()];
  }, [poolLeads]);

  const filtered = areaFilter === "ALL" ? poolLeads : poolLeads.filter(l => (l.address?.area || "Unknown") === areaFilter);

  // ─── Assign single lead ────────────────────────────────────────────────────
  function assignLead(leadId: string, tseId: string) {
    const tse = tseList.find(t => (t as any).id === tseId || (t as any).employeeId === tseId);
    const tseName = tse ? `${(tse as any).firstName || ""} ${(tse as any).lastName || ""}`.trim() : tseId;
    setAssigningId(leadId);
    setTimeout(() => {
      updateLead(leadId, {
        assignedTo: tseId,
        assignedTSE: tseName,
        assignedAt: new Date().toISOString(),
        stage: "contacted" as any,
      });
      setAssigningId(null);
      toast.success(`Lead assigned to ${tseName}`);
    }, 300);
  }

  // ─── Bulk assign selected leads ────────────────────────────────────────────
  function bulkAssign() {
    if (!bulkTSEId) { toast.error("Select a TSE first"); return; }
    if (selectedLeads.size === 0) { toast.error("Select at least one lead"); return; }
    const tse = tseList.find(t => (t as any).id === bulkTSEId || (t as any).employeeId === bulkTSEId);
    const tseName = tse ? `${(tse as any).firstName || ""} ${(tse as any).lastName || ""}`.trim() : bulkTSEId;
    selectedLeads.forEach(leadId => {
      updateLead(leadId, {
        assignedTo: bulkTSEId,
        assignedTSE: tseName,
        assignedAt: new Date().toISOString(),
        stage: "contacted" as any,
      });
    });
    toast.success(`${selectedLeads.size} leads assigned to ${tseName}`);
    setSelectedLeads(new Set());
    setBulkTSEId("");
  }

  // ─── Toggle lead selection ─────────────────────────────────────────────────
  function toggleLead(id: string) {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedLeads(new Set(filtered.map(l => l.leadId)));
  }
  function clearAll() { setSelectedLeads(new Set()); }

  // ─── Summary counts ────────────────────────────────────────────────────────
  const breached = poolLeads.filter(l => (Date.now() - new Date(l.createdAt).getTime()) > 8 * 3600000).length;
  const atRisk = poolLeads.filter(l => {
    const h = (Date.now() - new Date(l.createdAt).getTime()) / 3600000;
    return h > 4 && h <= 8;
  }).length;

  if (poolLeads.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900">All leads assigned</h3>
          <p className="text-sm text-green-700 mt-1">No unassigned leads in the pool right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3 flex items-center gap-3">
            <Inbox className="w-8 h-8 text-orange-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-orange-700">{poolLeads.length}</div>
              <div className="text-xs text-orange-600">In Pool</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-red-700">{breached}</div>
              <div className="text-xs text-red-600">SLA Breached</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{atRisk}</div>
              <div className="text-xs text-yellow-600">At Risk</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{tseList.length}</div>
              <div className="text-xs text-blue-600">TSEs Available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Bulk assign toolbar */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          {/* Area filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="text-sm border rounded px-2 py-1"
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
            >
              {areas.map(a => (
                <option key={a} value={a}>{a === "ALL" ? "All Areas" : a}</option>
              ))}
            </select>
          </div>

          {/* Select controls */}
          <Button variant="outline" size="sm" onClick={selectAll}>Select All ({filtered.length})</Button>
          {selectedLeads.size > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>Clear ({selectedLeads.size})</Button>
          )}

          {/* Bulk TSE picker */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              className="text-sm border rounded px-2 py-1"
              value={bulkTSEId}
              onChange={e => setBulkTSEId(e.target.value)}
            >
              <option value="">Assign to TSE…</option>
              {tseList.map(t => (
                <option key={(t as any).id} value={(t as any).id}>
                  {(t as any).firstName} {(t as any).lastName}
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
        {filtered.map(lead => {
          const sla = slaBadge(lead.createdAt);
          const isSelected = selectedLeads.has(lead.leadId);
          const tseForThis = perLeadTSE[lead.leadId] || "";

          return (
            <Card
              key={lead.leadId}
              className={`transition-all cursor-pointer border-2 ${isSelected ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => toggleLead(lead.leadId)}
            >
              <CardContent className="p-3">
                <div className="flex flex-wrap items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLead(lead.leadId)}
                    onClick={e => e.stopPropagation()}
                    className="mt-1 w-4 h-4 accent-blue-600"
                  />

                  {/* Lead info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </span>
                      <Badge className={sla.cls}>{sla.label}</Badge>
                      {lead.temperature && (
                        <Badge className={
                          lead.temperature === "hot" ? "bg-red-100 text-red-700" :
                          lead.temperature === "warm" ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        }>
                          {lead.temperature}
                        </Badge>
                      )}
                      {lead.leadSource && (
                        <Badge variant="outline" className="text-xs">{lead.leadSource}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />{lead.phone}
                      </span>
                      {lead.address?.area && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{lead.address.area}
                          {lead.address.pinCode && ` — ${lead.address.pinCode}`}
                        </span>
                      )}
                      {lead.vehicleDetails?.category && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />{lead.vehicleDetails.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />{timeAgo(lead.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Per-lead TSE assign */}
                  <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={tseForThis}
                      onChange={e => setPerLeadTSE(prev => ({ ...prev, [lead.leadId]: e.target.value }))}
                    >
                      <option value="">Pick TSE…</option>
                      {tseList.map(t => (
                        <option key={(t as any).id} value={(t as any).id}>
                          {(t as any).firstName} {(t as any).lastName}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!tseForThis || assigningId === lead.leadId}
                      onClick={() => assignLead(lead.leadId, tseForThis)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {assigningId === lead.leadId ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
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
