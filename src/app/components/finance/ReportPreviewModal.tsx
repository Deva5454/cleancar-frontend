/**
 * Report Preview Modal
 * Full-screen formatted report preview with print functionality
 * Last Updated: 2026-03-17
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { X, Printer } from "lucide-react";
import { toast } from "sonner";

interface Column {
  key: string;
  label: string;
  format?: "currency" | "number" | "text";
}

interface ReportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  reportTitle: string;
  period: string;
  filters: Record<string, string>;
  data: any[];
  columns: Column[];
}

export function ReportPreviewModal({
  open,
  onClose,
  reportTitle,
  period,
  filters,
  data,
  columns,
}: ReportPreviewModalProps) {
  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return "—";
    
    switch (format) {
      case "currency":
        return `₹${typeof value === "number" ? value.toFixed(2) : value}`;
      case "number":
        return typeof value === "number" ? value.toLocaleString() : value;
      default:
        return value;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{reportTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Metadata */}
          <div className="bg-gray-50 p-4 rounded border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Period:</span> {period}
              </div>
              <div>
                <span className="font-medium">Generated:</span>{" "}
                {new Date().toLocaleString()}
              </div>
            </div>
            {Object.keys(filters).length > 0 && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Filters:</span>{" "}
                {Object.entries(filters)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ")}
              </div>
            )}
          </div>

          {/* Report Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="border p-2 text-left text-sm font-medium"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col.key} className="border p-2 text-sm">
                        {formatValue(row[col.key], col.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-medium">
                  <td className="border p-2 text-sm" colSpan={columns.length}>
                    Total Rows: {data.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
