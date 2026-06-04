// ID Card Design & Generation System
import { DataService } from "../../services/DataService";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { BackButton } from "../ui/back-button";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
import { Printer, Download, User, X } from "lucide-react";
import { toast } from "sonner";

export function IDCardGenerator() {
  const [employees, setEmployees] = useState<EmployeeDatabaseRecord[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployees = () => {
      const allEmployees = employeeDatabaseService.getAll();
      setEmployees(allEmployees);
    };

    loadEmployees();

    const unsubscribe = employeeDatabaseService.subscribe(() => {
      loadEmployees();
    });

    return unsubscribe;
  }, []);

  const confirmedEmployees = employees.filter(emp => emp.confirmationDate);
  const unconfirmedEmployees = employees.filter(emp => !emp.confirmationDate);

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
    );
  };

  const toggleAll = () => {
    if (selectedEmployees.length === confirmedEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(confirmedEmployees.map((e) => e.id));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedEmployeesList = confirmedEmployees.filter((e) =>
    selectedEmployees.includes(e.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ID Card Generator</h2>
          <p className="text-gray-600">
            Design and generate employee ID cards (CR80 standard size)
          </p>
        </div>
        <BackButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Employees for ID Card Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox
              checked={selectedEmployees.length === confirmedEmployees.length && confirmedEmployees.length > 0}
              onCheckedChange={toggleAll}
              disabled={confirmedEmployees.length === 0}
            />
            <span className="text-sm font-medium">Select All Confirmed</span>
            <Badge variant="secondary" className="ml-2">
              {selectedEmployees.length} selected
            </Badge>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left w-12">
                    <Checkbox
                      checked={
                        selectedEmployees.length === confirmedEmployees.length && confirmedEmployees.length > 0
                      }
                      onCheckedChange={toggleAll}
                      disabled={confirmedEmployees.length === 0}
                    />
                  </th>
                  <th className="p-3 text-left">Employee ID</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Designation</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Confirmed Employees */}
                {confirmedEmployees.length > 0 && (
                  <>
                    <tr className="bg-green-50">
                      <td colSpan={6} className="p-2 text-xs font-semibold text-green-800 uppercase">
                        Confirmed
                      </td>
                    </tr>
                    {confirmedEmployees.map((emp) => (
                      <tr key={emp.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <Checkbox
                            checked={selectedEmployees.includes(emp.id)}
                            onCheckedChange={() => toggleEmployee(emp.id)}
                          />
                        </td>
                        <td className="p-3 font-mono text-sm">{emp.id}</td>
                        <td className="p-3">{emp.fullName}</td>
                        <td className="p-3">{emp.designation}</td>
                        <td className="p-3">{emp.department}</td>
                        <td className="p-3">
                          <Badge variant="default">
                            {emp.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Unconfirmed Employees */}
                {unconfirmedEmployees.length > 0 && (
                  <>
                    <tr className="bg-gray-100">
                      <td colSpan={6} className="p-2 text-xs font-semibold text-gray-600 uppercase">
                        Not Yet Confirmed
                      </td>
                    </tr>
                    {unconfirmedEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="border-t bg-gray-50 text-gray-400 cursor-not-allowed"
                        title="ID card can be generated after confirmation letter is issued"
                      >
                        <td className="p-3">
                          <Checkbox disabled />
                        </td>
                        <td className="p-3 font-mono text-sm">{emp.id}</td>
                        <td className="p-3">{emp.fullName}</td>
                        <td className="p-3">{emp.designation}</td>
                        <td className="p-3">{emp.department}</td>
                        <td className="p-3">
                          <Badge className="bg-amber-100 text-amber-800">
                            Pending Confirmation
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {employees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => setShowPreview(true)}
              disabled={selectedEmployees.length === 0}
            >
              <Printer className="w-4 h-4 mr-2" />
              Generate ID Cards ({selectedEmployees.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("Downloading all ID cards...")}
              disabled={selectedEmployees.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ID Card Preview Grid */}
      {showPreview && selectedEmployeesList.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                ID Cards Preview ({selectedEmployeesList.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => toast.success("Printing all cards...")}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print All
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPreview(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {selectedEmployeesList.map((emp) => (
                  <div key={emp.id} className="space-y-4">
                    {/* Front and Back Side by Side */}
                    <div className="flex gap-4">
                      {/* Front Side */}
                      <div
                        className="relative bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
                        style={{
                          width: "342px",
                          height: "216px",
                          transformStyle: "preserve-3d",
                        }}
                        onMouseEnter={() => setHoveredCard(emp.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {/* Top Band */}
                        <div className="bg-[#1E3A5F] text-white text-center py-2">
                          <h4 className="font-bold text-lg">CleanCar 360°</h4>
                          <p className="text-[#00C896] text-xs">
                            Shine. Trust. Speed.
                          </p>
                        </div>

                        {/* Center Content */}
                        <div className="flex flex-col items-center justify-center py-4">
                          {/* Photo/Avatar */}
                          <div className="w-16 h-16 rounded-full bg-[#00C896] flex items-center justify-center text-white text-2xl font-bold mb-2">
                            {getInitials(emp.fullName)}
                          </div>

                          {/* Employee Details */}
                          <h5 className="font-bold text-sm text-center px-2">
                            {emp.fullName}
                          </h5>
                          <p className="text-xs text-gray-600 mt-1">{emp.designation}</p>
                          <p className="text-xs font-mono text-gray-800 mt-1">
                            {emp.id}
                          </p>
                        </div>

                        {/* Bottom Band */}
                        <div className="absolute bottom-0 w-full bg-[#00C896] text-white text-center py-1">
                          <p className="text-xs">cleancar360.in</p>
                        </div>
                      </div>

                      {/* Back Side */}
                      <div
                        className="relative bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
                        style={{
                          width: "342px",
                          height: "216px",
                        }}
                      >
                        <div className="p-4 h-full flex flex-col justify-between">
                          {/* Company Address & Emergency */}
                          <div className="flex justify-between text-xs">
                            <div>
                              <p className="font-semibold">CleanCar 360°</p>
                              <p className="text-gray-600">123, Business Park</p>
                              <p className="text-gray-600">Adajan, Surat - 395009</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">Emergency</p>
                              <p className="text-gray-600">+91-261-1234567</p>
                            </div>
                          </div>

                          {/* QR Code Placeholder */}
                          <div className="flex justify-center">
                            <div className="w-20 h-20 border-2 border-[#00C896] flex items-center justify-center">
                              <div className="grid grid-cols-5 gap-1">
                                {[...Array(25)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 ${
                                      Math.random() > 0.5
                                        ? "bg-[#00C896]"
                                        : "bg-white"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Footer Text */}
                          <div className="text-xs text-gray-600 text-center">
                            <p className="font-semibold mb-1">
                              In case of emergency, contact HR:
                            </p>
                            <p>+91-261-1234567</p>
                            <p className="mt-2 text-[10px]">
                              This card is property of CleanCar 360°.
                              <br />
                              If found, please contact +91 98765 43210
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Print Button */}
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast.success(`Printing ID card for ${emp.fullName}`)
                        }
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print This Card
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample ID Card Display (Always Visible) */}
      <Card>
        <CardHeader>
          <CardTitle>Sample ID Card Design (CR80 Standard: 85.6mm × 54mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 justify-center items-start">
            {/* Front Sample */}
            <div>
              <p className="text-sm font-medium mb-2 text-center">Front Side</p>
              <div
                className="relative bg-white rounded-lg shadow-xl overflow-hidden border-2 border-gray-200 hover:shadow-2xl transition-all"
                style={{
                  width: "342px",
                  height: "216px",
                }}
              >
                <div className="bg-[#1E3A5F] text-white text-center py-2">
                  <h4 className="font-bold text-lg">CleanCar 360°</h4>
                  <p className="text-[#00C896] text-xs">Shine. Trust. Speed.</p>
                </div>
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 rounded-full bg-[#00C896] flex items-center justify-center text-white text-2xl font-bold mb-2">
                    <User className="w-8 h-8" />
                  </div>
                  <h5 className="font-bold text-sm">Employee Name</h5>
                  <p className="text-xs text-gray-600 mt-1">Designation</p>
                  <p className="text-xs font-mono text-gray-800 mt-1">EMP-001</p>
                </div>
                <div className="absolute bottom-0 w-full bg-[#00C896] text-white text-center py-1">
                  <p className="text-xs">cleancar360.in</p>
                </div>
              </div>
            </div>

            {/* Back Sample */}
            <div>
              <p className="text-sm font-medium mb-2 text-center">Back Side</p>
              <div
                className="relative bg-white rounded-lg shadow-xl overflow-hidden border-2 border-gray-200 hover:shadow-2xl transition-all"
                style={{
                  width: "342px",
                  height: "216px",
                }}
              >
                <div className="p-4 h-full flex flex-col justify-between">
                  <div className="flex justify-between text-xs">
                    <div>
                      <p className="font-semibold">CleanCar 360°</p>
                      <p className="text-gray-600">123, Business Park</p>
                      <p className="text-gray-600">Adajan, Surat - 395009</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">Emergency</p>
                      <p className="text-gray-600">+91-261-1234567</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-20 h-20 border-2 border-[#00C896] flex items-center justify-center">
                      <div className="grid grid-cols-5 gap-1">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 ${
                              Math.random() > 0.5 ? "bg-[#00C896]" : "bg-white"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    <p className="font-semibold mb-1">
                      In case of emergency, contact HR:
                    </p>
                    <p>+91-261-1234567</p>
                    <p className="mt-2 text-[10px]">
                      This card is property of CleanCar 360°.
                      <br />
                      If found, please contact +91 98765 43210
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}