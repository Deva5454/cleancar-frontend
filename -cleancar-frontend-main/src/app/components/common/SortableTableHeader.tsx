/**
 * Sortable Table Header Component
 * Makes any table column sortable with visual indicators
 */

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "../ui/table";

export type SortDirection = "asc" | "desc" | null;

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string | null; direction: SortDirection };
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className = "",
}: SortableTableHeaderProps) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    onSort(sortKey);
  };

  const getSortIcon = () => {
    if (isActive) {
      if (direction === "asc") {
        return <ArrowUp className="w-4 h-4 ml-1 text-teal-600" />;
      }
      if (direction === "desc") {
        return <ArrowDown className="w-4 h-4 ml-1 text-teal-600" />;
      }
    }
    return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-300 group-hover:text-gray-400" />;
  };

  return (
    <TableHead
      onClick={handleClick}
      className={`cursor-pointer select-none group transition-colors ${
        isActive ? "bg-teal-50" : "hover:bg-gray-50"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className={isActive ? "font-semibold text-teal-700" : ""}>{label}</span>
        {getSortIcon()}
      </div>
    </TableHead>
  );
}

/**
 * Hook for managing table sort state
 */
export function useTableSort(defaultSortKey: string, defaultDirection: SortDirection = "desc") {
  const [sortState, setSortState] = React.useState<{
    key: string | null;
    direction: SortDirection;
  }>({
    key: defaultSortKey,
    direction: defaultDirection,
  });

  const handleSort = (key: string) => {
    if (sortState.key === key) {
      // Same column - cycle through: asc -> desc -> null
      if (sortState.direction === "asc") {
        setSortState({ key, direction: "desc" });
      } else if (sortState.direction === "desc") {
        setSortState({ key: null, direction: null });
      } else {
        setSortState({ key, direction: "asc" });
      }
    } else {
      // New column - start with asc
      setSortState({ key, direction: "asc" });
    }
  };

  const sortData = <T,>(data: T[], accessor: (item: T) => any): T[] => {
    if (!sortState.key || !sortState.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = accessor(a);
      const bValue = accessor(b);

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  };

  return {
    sortState,
    handleSort,
    sortData,
  };
}

// Need to import React for the hook
import React from "react";
