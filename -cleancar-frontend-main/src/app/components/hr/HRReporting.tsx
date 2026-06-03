import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  records: number;
  category: string;
}

export function HRReporting() {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const reports: Report[] = [
    { id: "1", name: "Employee List Report", description: "Complete employee master data", records: 156, category: "Employee" },
    { id: "2", name: "Joining Report", description: "New joiners by date range", records: 8, category: "Recruitment" },
    { id: "3", name: "Attendance Report", description: "Monthly attendance summary", records: 142, category: "Attendance" },
    { id: "4", name: "Leave Report", description: "Leave balance and history", records: 156, category: "Leave" },
    { id: "5", name: "Salary Structure Report", description: "CTC breakup for all employees", records: 156, category: "Payroll" },
    { id: "6", name: "Exit Report", description: "Resignation and exit details", records: 2, category: "Exit" },
    { id: "7", name: "Document Compliance Report", description: "Document verification status", records: 156, category: "Compliance" },
    { id: "8", name: "Training Report", description: "Training completion records", records: 45, category: "Training" },
    { id: "9", name: "Performance Report", description: "Employee performance ratings", records: 142, category: "Performance" },
    { id: "10", name: "Department Headcount", description: "Employee distribution by department", records: 5, category: "Analytics" },
  ];

  const handleExport = (reportName: string, format: "excel" | "csv") => {
    const filters = [];
    if (selectedDepartment !== "all") filters.push(`Department: ${selectedDepartment}`);
    if (selectedLocation !== "all") filters.push(`Location: ${selectedLocation}`);
    if (selectedStatus !== "all") filters.push(`Status: ${selectedStatus}`);

    const filterText = filters.length > 0 ? `\nFilters: ${filters.join(", ")}` : "";
    
    toast.info(
      `📊 Exporting Report...\n\n` +
      `Report: ${reportName}\n` +
      `Format: ${format.toUpperCase()}${filterText}\n\n` +
      `Export will start downloading shortly.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="sales">Sales & CRM</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="hr">HR & Admin</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="surat">Surat - Head Office</SelectItem>
                  <SelectItem value="zone-a">Surat - Zone A</SelectItem>
                  <SelectItem value="zone-b">Surat - Zone B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employee Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="exited">Exited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <FileText className="w-10 h-10 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {report.category}
                        </span>
                        <span className="text-xs text-gray-500">{report.records} records</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleExport(report.name, "excel")}
                    >
                      <FileSpreadsheet className="w-3 h-3 mr-2" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleExport(report.name, "csv")}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Custom Report Builder</h3>
              <p className="text-sm text-blue-700 mt-1">
                Create custom reports with advanced filters and analytics
              </p>
            </div>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Build Custom Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
