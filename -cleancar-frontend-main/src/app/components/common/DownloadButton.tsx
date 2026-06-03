/**
 * Download Button Component
 * Shows filtered download with preview modal
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Download, X, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface DownloadButtonProps {
  disabled: boolean;
  recordCount: number;
  data: any[];
  columns: { key: string; label: string }[];
  filename: string;
}

export function DownloadButton({
  disabled,
  recordCount,
  data,
  columns,
  filename,
}: DownloadButtonProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleDownloadClick = () => {
    if (!disabled) {
      setShowPreview(true);
    }
  };

  const handleConfirmDownload = () => {
    // Generate CSV
    const headers = columns.map((col) => col.label).join(",");
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        // Escape values with commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowPreview(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handleDownloadClick}
        className={disabled ? "opacity-50 cursor-not-allowed" : ""}
      >
        <Download className="w-4 h-4 mr-2" />
        Download Filtered Results ({recordCount} records)
      </Button>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <FileText className="w-6 h-6 text-teal-600" />
                  <div>
                    <CardTitle>Download Preview</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Preview of {recordCount} filtered records
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key} className="bg-gray-50 font-semibold">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 100).map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map((col) => (
                          <TableCell key={col.key}>
                            {row[col.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {data.length > 100 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Showing first 100 of {recordCount} records. Download to see all.
                </p>
              )}
            </CardContent>
            <div className="border-t p-4 flex justify-end gap-3 flex-shrink-0">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDownload}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Confirm Download
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
