/**
 * DataTable Component
 * 
 * Reusable data table with sorting, filtering, and pagination.
 * Standardizes table UI across the application.
 * 
 * @component
 */

import { useState, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./LoadingState";

export interface Column<T> {
  /** Column key */
  key: keyof T | string;
  
  /** Column header label */
  label: string;
  
  /** Custom render function */
  render?: (value: any, row: T, index: number) => ReactNode;
  
  /** Is sortable */
  sortable?: boolean;
  
  /** Alignment */
  align?: "left" | "center" | "right";
  
  /** Width */
  width?: string;
}

export interface DataTableProps<T> {
  /** Table data */
  data: T[];
  
  /** Column definitions */
  columns: Column<T>[];
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Enable search */
  searchable?: boolean;
  
  /** Search placeholder */
  searchPlaceholder?: string;
  
  /** Custom search function */
  onSearch?: (query: string) => void;
  
  /** Enable pagination */
  paginated?: boolean;
  
  /** Items per page */
  pageSize?: number;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Empty state action */
  emptyAction?: {
    text: string;
    onClick: () => void;
  };
  
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  
  /** Custom className */
  className?: string;
}

/**
 * DataTable component for displaying tabular data
 * 
 * @example
 * ```tsx
 * <DataTable
 *   data={users}
 *   columns={[
 *     { key: "name", label: "Name", sortable: true },
 *     { key: "email", label: "Email" },
 *     { key: "status", label: "Status", render: (status) => <StatusBadge status={status} /> },
 *   ]}
 *   searchable
 *   paginated
 *   pageSize={10}
 *   emptyMessage="No users found"
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  paginated = false,
  pageSize = 10,
  emptyMessage = "No data found",
  emptyAction,
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  
  // Filter data based on search
  const filteredData = searchQuery
    ? data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;
  
  // Sort data
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : filteredData;
  
  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = paginated
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;
  
  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <TableSkeleton rows={pageSize} columns={columns.length} />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Search */}
        {searchable && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
        
        {/* Table */}
        {paginatedData.length === 0 ? (
          <EmptyState
            title={emptyMessage}
            actionText={emptyAction?.text}
            onAction={emptyAction?.onClick}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={String(column.key)}
                        style={{ width: column.width }}
                        className={`
                          ${column.align === "center" ? "text-center" : ""}
                          ${column.align === "right" ? "text-right" : ""}
                          ${column.sortable ? "cursor-pointer hover:bg-gray-50" : ""}
                        `}
                        onClick={() => column.sortable && handleSort(String(column.key))}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable && (
                            <ArrowUpDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                      onClick={() => onRowClick?.(row, rowIndex)}
                    >
                      {columns.map((column) => {
                        const value = row[column.key];
                        return (
                          <TableCell
                            key={String(column.key)}
                            className={`
                              ${column.align === "center" ? "text-center" : ""}
                              ${column.align === "right" ? "text-right" : ""}
                            `}
                          >
                            {column.render
                              ? column.render(value, row, rowIndex)
                              : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {paginated && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
                  {sortedData.length} results
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DataTable;
