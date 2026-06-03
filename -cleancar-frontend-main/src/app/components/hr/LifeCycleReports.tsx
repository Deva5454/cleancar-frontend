// Employee Life Cycle Management - Filtered Reports with Selective Download
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { BackButton } from "../ui/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Download,
  Filter,
  X,
  FileText,
  Printer,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MASTER_EMPLOYEES } from "../../data/employeeData";

type ReportType =
  | ""
  | "joining"
  | "confirmation"
  | "promotion"
  | "transfer"
  | "salary_revision"
  | "resignation"
  | "exit"
  | "attrition";

interface JoiningRecord {
  empId: string;
  name: string;
  designation: string;
  department: string;
  location: string;
  joiningDate: string;
  reportingTo: string;
  status: string;
}

interface PromotionRecord {
  empId: string;
  name: string;
  fromDesignation: string;
  toDesignation: string;
  promotionDate: string;
  department: string;
  salaryIncrease: string;
}

interface SalaryRevisionRecord {
  empId: string;
  name: string;
  designation: string;
  department: string;
  revisionDate: string;
  oldSalary: number;
  newSalary: number;
  increasePercent: number;
  revisionType: string;
}

// ✅ FIXED: mockJoiningRecords — use live data from context
const mockJoiningRecords = [] as any[]; // TODO: wire to EmployeeLifecycleContext = [

// ✅ FIXED: mockPromotionRecords — use live data from context
const mockPromotionRecords = [] as any[]; // TODO: wire to EmployeeLifecycleContext = [

// ✅ FIXED: mockSalaryRevisionRecords — use live data from context
const mockSalaryRevisionRecords = [] as any[]; // TODO: wire to EmployeeLifecycleContext = [

export function LifeCycleReports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("");
  const [filters, setFilters] = useState({
    employeeName: "",
    department: "",
    location: "",
    dateFrom: "",
    dateTo: "",
    status: "all",
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);

  const handleEmployeeClick = (empId: string) => {
    const employee = MASTER_EMPLOYEES.find((emp) => emp.empCode === empId);
    if (employee) {
      setSelectedEmployee(employee);
      setShowEmployeeDetails(true);
    }
  };

  const applyFilters = () => {
    const active: string[] = [];
    if (filters.employeeName) active.push(`Name: ${filters.employeeName}`);
    if (filters.department && filters.department !== "all")
      active.push(`Dept: ${filters.department}`);
    if (filters.location && filters.location !== "all")
      active.push(`Location: ${filters.location}`);
    if (filters.dateFrom) active.push(`From: ${filters.dateFrom}`);
    if (filters.dateTo) active.push(`To: ${filters.dateTo}`);
    if (filters.status !== "all") active.push(`Status: ${filters.status}`);

    setActiveFilters(active);
    toast.success("Filters applied");
  };

  const clearFilters = () => {
    setFilters({
      employeeName: "",
      department: "",
      location: "",
      dateFrom: "",
      dateTo: "",
      status: "all",
    });
    setActiveFilters([]);
  };

  const removeFilter = (filter: string) => {
    const key = filter.split(":")[0].trim();
    const mapping: Record<string, keyof typeof filters> = {
      Name: "employeeName",
      Dept: "department",
      Location: "location",
      From: "dateFrom",
      To: "dateTo",
      Status: "status",
    };

    if (mapping[key]) {
      setFilters({
        ...filters,
        [mapping[key]]: mapping[key] === "status" ? "all" : "",
      });
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    }
  };

  const getFilteredData = () => {
    let data: any[] = [];

    if (selectedReport === "joining") {
      data = mockJoiningRecords;
    } else if (selectedReport === "promotion") {
      data = mockPromotionRecords;
    } else if (selectedReport === "salary_revision") {
      data = mockSalaryRevisionRecords;
    }

    // Apply filters
    if (filters.employeeName) {
      data = data.filter((d) =>
        d.name.toLowerCase().includes(filters.employeeName.toLowerCase())
      );
    }
    if (filters.department && filters.department !== "all") {
      data = data.filter((d) => d.department === filters.department);
    }
    if (filters.location && filters.location !== "all" && selectedReport === "joining") {
      data = data.filter((d: JoiningRecord) => d.location === filters.location);
    }

    return data;
  };

  const filteredData = getFilteredData();
  const hasFilters = activeFilters.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Life Cycle Reports</h2>
          <p className="text-gray-600">
            Generate filtered reports on employee lifecycle events
          </p>
        </div>
        <BackButton />
      </div>

      {/* Report Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedReport}
            onValueChange={(value) => setSelectedReport(value as ReportType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a report..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="joining">Joining Report</SelectItem>
              <SelectItem value="confirmation">Confirmation Report</SelectItem>
              <SelectItem value="promotion">Promotion History</SelectItem>
              <SelectItem value="transfer">Transfer History</SelectItem>
              <SelectItem value="salary_revision">
                Salary Revision History
              </SelectItem>
              <SelectItem value="resignation">Resignation Report</SelectItem>
              <SelectItem value="exit">Exit Report</SelectItem>
              <SelectItem value="attrition">Attrition Report</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Filter Panel - Only shows after report is selected */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Employee Name</Label>
                <Input
                  placeholder="Search by name..."
                  value={filters.employeeName}
                  onChange={(e) =>
                    setFilters({ ...filters, employeeName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Department</Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) =>
                    setFilters({ ...filters, department: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location / City</Label>
                <Select
                  value={filters.location}
                  onValueChange={(value) =>
                    setFilters({ ...filters, location: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Surat">Surat</SelectItem>
                    <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Employment Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Resigned">Resigned</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {activeFilters.map((filter) => (
                  <Badge
                    key={filter}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeFilter(filter)}
                  >
                    {filter}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Table - Shows filtered data */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedReport === "joining" && "Joining Report"}
                  {selectedReport === "promotion" && "Promotion History"}
                  {selectedReport === "salary_revision" &&
                    "Salary Revision History"}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredData.length} of{" "}
                  {
                    (selectedReport === "joining"
                      ? mockJoiningRecords
                      : selectedReport === "promotion"
                      ? mockPromotionRecords
                      : mockSalaryRevisionRecords
                    ).length
                  }{" "}
                  records (filtered)
                </p>
              </div>
              <Button
                onClick={() => setShowPreview(true)}
                disabled={!hasFilters}
                title={
                  !hasFilters ? "Please apply at least one filter to download" : ""
                }
              >
                <Download className="w-4 h-4 mr-2" />
                Download Filtered Results ({filteredData.length} records)
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!hasFilters && (
              <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-yellow-800">
                    <strong>Filter Required:</strong> Please apply at least one
                    filter before downloading the report.
                  </p>
                </div>
              </div>
            )}

            {selectedReport === "joining" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record: JoiningRecord) => (
                    <TableRow key={record.empId}>
                      <TableCell className="font-mono text-sm">
                        {record.empId}
                      </TableCell>
                      <TableCell
                        className="font-medium cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => handleEmployeeClick(record.empId)}
                      >
                        {record.name}
                      </TableCell>
                      <TableCell>{record.designation}</TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>
                        {new Date(record.joiningDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "Active" ? "default" : "secondary"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {selectedReport === "promotion" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>From Designation</TableHead>
                    <TableHead>To Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Promotion Date</TableHead>
                    <TableHead>Salary Increase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record: PromotionRecord, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {record.empId}
                      </TableCell>
                      <TableCell
                        className="font-medium cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => handleEmployeeClick(record.empId)}
                      >
                        {record.name}
                      </TableCell>
                      <TableCell>{record.fromDesignation}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {record.toDesignation}
                      </TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>
                        {new Date(record.promotionDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{record.salaryIncrease}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {selectedReport === "salary_revision" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Revision Date</TableHead>
                    <TableHead>Old Salary</TableHead>
                    <TableHead>New Salary</TableHead>
                    <TableHead>Increase %</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record: SalaryRevisionRecord, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {record.empId}
                      </TableCell>
                      <TableCell
                        className="font-medium cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => handleEmployeeClick(record.empId)}
                      >
                        {record.name}
                      </TableCell>
                      <TableCell>{record.designation}</TableCell>
                      <TableCell>
                        {new Date(record.revisionDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </TableCell>
                      <TableCell>₹{(record?.oldSalary ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₹{(record?.newSalary ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          +{(record?.increasePercent ?? 0).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{record.revisionType}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Download Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Report Preview</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => toast.success("Printing...")}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            <div className="p-8">
              {/* Report Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#00C896]">
                  CleanCar 360°
                </h1>
                <p className="text-lg font-semibold mt-2">
                  {selectedReport === "joining" && "Joining Report"}
                  {selectedReport === "promotion" && "Promotion History Report"}
                  {selectedReport === "salary_revision" &&
                    "Salary Revision Report"}
                </p>
                <p className="text-sm text-gray-600">
                  Generated on {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>

              {/* Filter Criteria */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Applied Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge key={filter} variant="secondary">
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Report Data */}
              <div className="text-sm">
                {selectedReport === "joining" && (
                  <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">Emp ID</th>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Designation</th>
                        <th className="border p-2 text-left">Department</th>
                        <th className="border p-2 text-left">Location</th>
                        <th className="border p-2 text-left">Joining Date</th>
                        <th className="border p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((record: JoiningRecord) => (
                        <tr key={record.empId}>
                          <td className="border p-2 font-mono text-xs">
                            {record.empId}
                          </td>
                          <td className="border p-2">{record.name}</td>
                          <td className="border p-2">{record.designation}</td>
                          <td className="border p-2">{record.department}</td>
                          <td className="border p-2">{record.location}</td>
                          <td className="border p-2">
                            {new Date(record.joiningDate).toLocaleDateString(
                              "en-IN"
                            )}
                          </td>
                          <td className="border p-2">{record.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedReport === "salary_revision" && (
                  <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">Emp ID</th>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Revision Date</th>
                        <th className="border p-2 text-left">Old Salary</th>
                        <th className="border p-2 text-left">New Salary</th>
                        <th className="border p-2 text-left">Increase %</th>
                        <th className="border p-2 text-left">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((record: SalaryRevisionRecord, idx) => (
                        <tr key={idx}>
                          <td className="border p-2 font-mono text-xs">
                            {record.empId}
                          </td>
                          <td className="border p-2">{record.name}</td>
                          <td className="border p-2">
                            {new Date(record.revisionDate).toLocaleDateString(
                              "en-IN"
                            )}
                          </td>
                          <td className="border p-2">
                            ₹{(record?.oldSalary ?? 0).toLocaleString()}
                          </td>
                          <td className="border p-2">
                            ₹{(record?.newSalary ?? 0).toLocaleString()}
                          </td>
                          <td className="border p-2">
                            +{(record?.increasePercent ?? 0).toFixed(1)}%
                          </td>
                          <td className="border p-2">{record.revisionType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Employee Details</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEmployeeDetails(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            <div className="p-8">
              {/* Employee Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#00C896]">
                  CleanCar 360°
                </h1>
                <p className="text-lg font-semibold mt-2">
                  Employee Details
                </p>
                <p className="text-sm text-gray-600">
                  Generated on {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>

              {/* Employee Data */}
              <div className="text-sm">
                {selectedEmployee && (
                  <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">Emp ID</th>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Designation</th>
                        <th className="border p-2 text-left">Department</th>
                        <th className="border p-2 text-left">Location</th>
                        <th className="border p-2 text-left">Joining Date</th>
                        <th className="border p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr key={selectedEmployee.empCode}>
                        <td className="border p-2 font-mono text-xs">
                          {selectedEmployee.empCode}
                        </td>
                        <td className="border p-2">{selectedEmployee.name}</td>
                        <td className="border p-2">{selectedEmployee.role}</td>
                        <td className="border p-2">{selectedEmployee.department}</td>
                        <td className="border p-2">{selectedEmployee.city}</td>
                        <td className="border p-2">
                          {new Date(selectedEmployee.joiningDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>
                        <td className="border p-2">{selectedEmployee.status}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}