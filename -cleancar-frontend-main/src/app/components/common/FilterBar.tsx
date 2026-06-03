/**
 * Global Filter Bar Component
 * Reusable filter bar for all tables and lists
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, X, Filter } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "multi-select" | "date-range" | "search";
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  searchPlaceholder: string;
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  onClearAll: () => void;
  activeFilters: Record<string, any>;
  totalRecords: number;
  filteredRecords: number;
}

export function FilterBar({
  searchPlaceholder,
  filters,
  onFilterChange,
  onClearAll,
  activeFilters,
  totalRecords,
  filteredRecords,
}: FilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setTimeout(() => {
      const newFilters = { ...localFilters, search: value };
      setLocalFilters(newFilters);
    }, 300);
  };

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...localFilters, [filterId]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    const filtersToApply = {
      ...localFilters,
      dateFrom,
      dateTo,
      search: searchTerm,
    };
    onFilterChange(filtersToApply);
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setLocalFilters({});
    setDateFrom("");
    setDateTo("");
    onClearAll();
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (val) => val && val !== "" && (Array.isArray(val) ? val.length > 0 : true)
  );

  const activeFilterChips = Object.entries(activeFilters).filter(
    ([key, value]) => value && value !== "" && (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className="space-y-3 mb-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* Search Input */}
        <div className="flex-1 min-w-64">
          <Label htmlFor="search" className="text-xs text-gray-600 mb-1.5 block">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Dynamic Filter Dropdowns */}
        {filters.map((filter) => {
          if (filter.type === "select" || filter.type === "multi-select") {
            return (
              <div key={filter.id} className="min-w-48">
                <Label htmlFor={filter.id} className="text-xs text-gray-600 mb-1.5 block">
                  {filter.label}
                </Label>
                <Select
                  value={localFilters[filter.id] || ""}
                  onValueChange={(value) => handleFilterChange(filter.id, value)}
                >
                  <SelectTrigger id={filter.id}>
                    <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                        {option.count !== undefined && (
                          <span className="ml-2 text-xs text-gray-500">({option.count})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          return null;
        })}

        {/* Date Range Picker */}
        <div className="min-w-48">
          <Label className="text-xs text-gray-600 mb-1.5 block">From Date</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div className="min-w-48">
          <Label className="text-xs text-gray-600 mb-1.5 block">To Date</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="DD/MM/YYYY"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleApplyFilters}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Apply Filters
          </Button>
          <Button variant="outline" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-blue-50 rounded border border-blue-200">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          {activeFilterChips.map(([key, value]) => {
            if (key === "search" && value) {
              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  Search: {value}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => {
                      const newFilters = { ...activeFilters };
                      delete newFilters[key];
                      setSearchTerm("");
                      onFilterChange(newFilters);
                    }}
                  />
                </Badge>
              );
            }
            if (key === "dateFrom" || key === "dateTo") {
              return null; // Handle date range together
            }
            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key}: {value}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    const newFilters = { ...activeFilters };
                    delete newFilters[key];
                    onFilterChange(newFilters);
                  }}
                />
              </Badge>
            );
          })}
          {(activeFilters.dateFrom || activeFilters.dateTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date: {activeFilters.dateFrom || "Start"} – {activeFilters.dateTo || "End"}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  const newFilters = { ...activeFilters };
                  delete newFilters.dateFrom;
                  delete newFilters.dateTo;
                  setDateFrom("");
                  setDateTo("");
                  onFilterChange(newFilters);
                }}
              />
            </Badge>
          )}
          <button
            onClick={handleClearAll}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Record Count */}
      <div className="flex justify-between items-center text-sm text-gray-600 px-1">
        <span>
          Showing <span className="font-semibold text-gray-900">{filteredRecords}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalRecords}</span> records
        </span>
      </div>
    </div>
  );
}