/**
 * Global Filter Bar - Top navigation filters for ERP system
 *
 * Provides consistent city, date range, and business unit filtering across all modules
 * Filters persist across navigation and can be accessed by any component
 *
 * @component
 */

import { useState, createContext, useContext, ReactNode, useMemo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Calendar, MapPin, Building2, RefreshCw, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { useCity, type CityId } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";

// ============================================================================
// CONTEXT FOR GLOBAL FILTERS
// ============================================================================

interface GlobalFilters {
  city: string;
  startDate: string;
  endDate: string;
  businessUnit: string;
}

interface GlobalFiltersContextType {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextType | undefined>(undefined);

export function useGlobalFilters() {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    // Always return safe defaults — NEVER throw (B04 fix)
    // Throwing here causes a full React tree crash in production
    return {
      filters: {
        city: "ALL",
        startDate: "2026-01-01",
        endDate: "2026-04-30",
        businessUnit: "ALL",
      } as GlobalFilters,
      setFilters: (_f: GlobalFilters) => {},
      resetFilters: () => {},
      hasActiveFilters: false,
    };
  }
  return context;
}

// ============================================================================
// GLOBAL FILTERS PROVIDER
// ============================================================================

interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export function GlobalFiltersProvider({ children }: GlobalFiltersProviderProps) {
  const defaultFilters: GlobalFilters = {
    city: "ALL",
    startDate: "2026-01-01",  // Start of seeded data
    endDate: "2026-04-30",    // End of seeded data
    businessUnit: "ALL",
  };

  const [filters, setFilters] = useState<GlobalFilters>(() => {
    try {
      const saved = localStorage.getItem("cc360_global_filters");
      if (saved) {
        const p = JSON.parse(saved);
        // Only restore if dates are within seeded data range (Jan-Apr 2026)
        if (p.startDate >= "2026-01-01" && p.endDate <= "2026-04-30") return p;
      }
    } catch(e) {}
    return defaultFilters;
  });

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = useMemo(() =>
    filters.city !== "ALL" ||
    (filters.startDate !== "" && filters.startDate !== "2026-01-01") ||
    (filters.endDate !== "" && filters.endDate !== "2026-04-30") ||
    filters.businessUnit !== "ALL",
  [filters]);

  const filterContextValue = useMemo(() => ({
    filters, setFilters, resetFilters, hasActiveFilters,
  }), [filters, resetFilters, hasActiveFilters]);

  return (
    <GlobalFiltersContext.Provider value={filterContextValue}>
      {children}
    </GlobalFiltersContext.Provider>
  );
}

// ============================================================================
// GLOBAL FILTER BAR COMPONENT
// ============================================================================

interface GlobalFilterBarProps {
  showBusinessUnit?: boolean;
}

export function GlobalFilterBar({ showBusinessUnit = true }: GlobalFilterBarProps) {
  const { filters, setFilters, resetFilters, hasActiveFilters } = useGlobalFilters();
  const { city, cityInfo, setCity, availableCities, isLocked } = useCity();
  const { currentRole } = useRole();
  const showUnitFilter = currentRole ? ["Super Admin","Admin","City Manager","Cluster Manager",
    "Sr Operations Manager","Operations Manager","HR","Accounts","Marketing Agency"].includes(currentRole) : false;

  const handleFilterChange = (key: keyof GlobalFilters, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    try { localStorage.setItem("cc360_global_filters", JSON.stringify(updated)); } catch(e) {}
  };

  const activeFilterCount = [
    filters.startDate !== "",
    filters.endDate !== "",
    filters.businessUnit !== "ALL",
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
        {/* City Selector - Integrated with CityContext */}
        <div className="flex items-center gap-1 sm:gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <Label className="text-sm text-gray-600 min-w-fit">City:</Label>
          <Select
            value={city}
            onValueChange={(value) => setCity(value as CityId)}
            disabled={isLocked}
          >
            <SelectTrigger className="w-40">
              <SelectValue>{cityInfo.displayName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((cityOption) => (
                <SelectItem key={cityOption.id} value={cityOption.id}>
                  {cityOption.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLocked && (
            <Badge variant="outline" className="text-xs">
              Locked
            </Badge>
          )}
        </div>

        {/* Date Range */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Label className="text-sm text-gray-600 min-w-fit">From:</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="w-40"
          />
        </div>

        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          <Label className="text-sm text-gray-600 min-w-fit">To:</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="w-40"
          />
        </div>

        {/* Business Unit Filter */}
        {showUnitFilter && showBusinessUnit && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <Label className="text-sm text-gray-600 min-w-fit">Unit:</Label>
            <Select
              value={filters.businessUnit}
              onValueChange={(value) => handleFilterChange("businessUnit", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                <SelectItem value="OPERATIONS">Operations</SelectItem>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs">{activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {!hasActiveFilters && (
          <div className="ml-auto text-xs text-gray-500">
            Apply filters to refine results across all modules
          </div>
        )}
      </div>
    </div>
  );
}
