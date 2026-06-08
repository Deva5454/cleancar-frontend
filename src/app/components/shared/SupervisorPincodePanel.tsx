/**
 * SupervisorPincodePanel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows all supervisors serving a customer's pincode with:
 *   ✅ Idle washer count per supervisor (total - active jobs)
 *   ✅ "RECOMMENDED" badge on supervisor with most idle washers
 *   ✅ Used in TSM Lead Pool assignment + subscription assignment panels
 *
 * Usage:
 *   <SupervisorPincodePanel pincode="395009" onSelect={(sup) => assignSupervisor(sup)} />
 */

import { useMemo } from "react";
import { organizationHierarchyService } from "../../services/organizationHierarchyService";
import { useJobs } from "../../contexts/JobContext";
import { Badge } from "../ui/badge";
import { Users, MapPin, Star, CheckCircle2 } from "lucide-react";

export interface SupervisorInfo {
  supervisorId: string;
  supervisorName: string;
  teamId: string;
  teamName: string;
  pincode: string;
  areaName: string;
  totalWashers: number;
  activeWashers: number;   // washers with job In Progress or Assigned+In Transit
  idleWashers: number;     // totalWashers - activeWashers
  activeJobs: number;
  isRecommended: boolean;  // highest idle washer count
}

interface Props {
  pincode: string;          // e.g. "395009"
  selectedId?: string;      // currently selected supervisorId
  onSelect?: (sup: SupervisorInfo) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function SupervisorPincodePanel({ pincode, selectedId, onSelect, readOnly = false, compact = false }: Props) {
  const { jobs } = useJobs();

  const supervisors: SupervisorInfo[] = useMemo(() => {
    // Get pincode record
    const pin = organizationHierarchyService.getPincodeByNumber(pincode);
    if (!pin) return [];

    // Get all active teams for this pincode
    const teams = organizationHierarchyService.getActiveTeamsByPincode(pin.id);
    if (!teams.length) return [];

    // For each team, compute idle washers
    const infos: SupervisorInfo[] = teams.map(team => {
      const totalWashers = team.washerIds.length;

      // Active = washer has a job that is In Progress OR Assigned (accepted, in transit)
      const activeWasherSet = new Set(
        jobs
          .filter(j =>
            (j.status === "In Progress" || j.status === "Assigned") &&
            team.washerIds.includes(j.washerId || "")
          )
          .map(j => j.washerId)
      );

      const activeJobs = jobs.filter(j =>
        (j.status === "In Progress" || j.status === "Assigned") &&
        team.washerIds.includes(j.washerId || "")
      ).length;

      const activeWashers = activeWasherSet.size;
      const idleWashers = Math.max(0, totalWashers - activeWashers);

      return {
        supervisorId: team.supervisorId,
        supervisorName: team.name.replace(/Team [A-Z]$/, "").trim(), // clean team name
        teamId: team.id,
        teamName: team.name,
        pincode: team.pincode,
        areaName: team.areaName,
        totalWashers,
        activeWashers,
        idleWashers,
        activeJobs,
        isRecommended: false, // set below
      };
    });

    // Mark recommended (highest idle count)
    if (infos.length > 0) {
      const maxIdle = Math.max(...infos.map(s => s.idleWashers));
      infos.forEach(s => { s.isRecommended = s.idleWashers === maxIdle && maxIdle > 0; });
    }

    // Sort: most idle first
    return infos.sort((a, b) => b.idleWashers - a.idleWashers);
  }, [pincode, jobs]);

  if (!supervisors.length) {
    return (
      <div className="text-sm text-gray-400 text-center py-4 border rounded-lg bg-gray-50">
        <MapPin className="w-5 h-5 mx-auto mb-1 opacity-40" />
        No supervisors found for pincode {pincode}
      </div>
    );
  }

  if (compact) {
    // Minimal inline variant for list views
    return (
      <div className="flex flex-wrap gap-2">
        {supervisors.map(sup => (
          <button
            key={sup.supervisorId}
            disabled={readOnly}
            onClick={() => !readOnly && onSelect?.(sup)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selectedId === sup.supervisorId
                ? "bg-blue-600 text-white border-blue-600"
                : sup.isRecommended
                ? "bg-green-50 text-green-800 border-green-300 hover:bg-green-100"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {sup.isRecommended && <Star className="w-3 h-3" />}
            <span>{sup.areaName}</span>
            <span className={`font-bold ${sup.idleWashers === 0 ? "text-red-500" : "text-green-600"}`}>
              {sup.idleWashers} idle
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-gray-800">
          Supervisors for pincode {pincode}
        </span>
        <Badge variant="outline" className="text-xs">{supervisors.length} team{supervisors.length > 1 ? "s" : ""}</Badge>
      </div>

      {supervisors.map(sup => {
        const isSelected = selectedId === sup.supervisorId;
        const isFull = sup.idleWashers === 0;

        return (
          <div
            key={sup.supervisorId}
            onClick={() => !readOnly && !isFull && onSelect?.(sup)}
            className={`relative rounded-xl border-2 p-3 transition-all ${
              readOnly ? "cursor-default" :
              isFull   ? "cursor-not-allowed opacity-60" :
                         "cursor-pointer hover:shadow-md"
            } ${
              isSelected
                ? "border-blue-500 bg-blue-50 shadow-md"
                : sup.isRecommended && !isFull
                ? "border-green-400 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            {/* Recommended badge */}
            {sup.isRecommended && !isFull && (
              <span className="absolute -top-2.5 left-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5" /> RECOMMENDED
              </span>
            )}
            {isFull && (
              <span className="absolute -top-2.5 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                ALL BOOKED
              </span>
            )}

            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                isSelected ? "bg-blue-600 text-white" :
                sup.isRecommended ? "bg-green-600 text-white" :
                "bg-gray-200 text-gray-700"
              }`}>
                {sup.areaName.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{sup.teamName}</span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{sup.areaName} · Pincode {sup.pincode}</div>
              </div>

              {/* Washer stats */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end mb-0.5">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{sup.totalWashers} washers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    sup.idleWashers === 0 ? "text-red-600" :
                    sup.idleWashers >= 3  ? "text-green-600" :
                    "text-amber-600"
                  }`}>
                    {sup.idleWashers} idle
                  </span>
                  {sup.activeJobs > 0 && (
                    <span className="text-xs text-gray-400">{sup.activeJobs} active</span>
                  )}
                </div>
                {/* Mini bar */}
                <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sup.idleWashers === 0 ? "bg-red-500" :
                      sup.idleWashers / sup.totalWashers > 0.5 ? "bg-green-500" :
                      "bg-amber-400"
                    }`}
                    style={{ width: sup.totalWashers > 0 ? `${(sup.idleWashers / sup.totalWashers) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
