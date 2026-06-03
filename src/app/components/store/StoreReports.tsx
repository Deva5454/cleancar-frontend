import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { FileText, Download } from "lucide-react";

export function StoreReports() {
  const [reportType, setReportType] = useState("daily-stock");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Store Reports</h2>
        <p className="text-sm text-gray-500 mt-1">
          Quantity-only reports — no monetary values
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily-stock">Daily Stock Position</SelectItem>
                <SelectItem value="stock-movement">Stock Movement Report</SelectItem>
                <SelectItem value="issuance">Issuance Report</SelectItem>
                <SelectItem value="grn">GRN Receipt Report</SelectItem>
                <SelectItem value="expiry">Expiry Report</SelectItem>
                <SelectItem value="dead-stock">Dead Stock Report</SelectItem>
                <SelectItem value="washer-stock">Washer Stock Summary</SelectItem>
                <SelectItem value="equipment">Equipment Register</SelectItem>
                <SelectItem value="verification">Verification History Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            All reports show quantities only — no prices or values. Comprehensive reporting with filters and exports will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
