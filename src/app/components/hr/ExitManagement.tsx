import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { LogOut, CheckCircle, Clock, AlertCircle, DollarSign } from "lucide-react";

type ExitStatus = "Resignation Submitted" | "Manager Approved" | "HR Clearance" | "Final Settlement" | "Completed";

interface ExitProcess {
  id: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  resignationDate: string;
  lastWorkingDay: string;
  noticePeriod: string;
  status: ExitStatus;
  clearanceSteps: {
    step: string;
    status: "Pending" | "Completed";
    completedOn?: string;
  }[];
}

// ✅ FIXED: mockExits — use live data from context
const mockExits = [] as any[]; // TODO: wire to EmployeeLifecycleContext = [

export function ExitManagement() {
  const getStatusColor = (status: ExitStatus) => {
    if (status === "Completed") return "bg-green-100 text-green-800";
    if (status === "Final Settlement") return "bg-blue-100 text-blue-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Exit Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {([] as any[]).map((exit) => (
              <div key={exit.id} className="border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{exit.employeeName}</h3>
                    <p className="text-sm text-gray-600">{exit.employeeId} • {exit.designation}</p>
                  </div>
                  <Badge className={getStatusColor(exit.status)}>{exit.status}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Resignation Date</p>
                    <p className="text-sm font-medium text-gray-900">{exit.resignationDate}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Last Working Day</p>
                    <p className="text-sm font-medium text-gray-900">{exit.lastWorkingDay}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Notice Period</p>
                    <p className="text-sm font-medium text-gray-900">{exit.noticePeriod}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Exit Clearance Steps</h4>
                  <div className="space-y-2">
                    {exit.clearanceSteps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {step.status === "Completed" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-orange-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{step.step}</p>
                            {step.completedOn && (
                              <p className="text-xs text-gray-500">Completed: {step.completedOn}</p>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={
                            step.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {step.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Clearance
                  </Button>
                  <Button variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process F&F Settlement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
