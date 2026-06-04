import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Search, FileText, AlertCircle, Download, Users, Activity, DollarSign, Filter } from "lucide-react";
import { useEvents } from "../contexts/EventSystem";
import { useRole } from "../contexts/RoleContext";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { BackButton } from "./ui/back-button";

export function AuditTrail() {
  const { currentRole, currentUser } = useRole();
  const { getEventHistory } = useEvents();
  // PHASE 2: Migrated to useEmployeeData
  const { employees } = useEmployeeData();
  const [searchTerm, setSearchTerm] = useState("");

  // Restrict access to Super Admin and Admin only
  if (currentRole !== "Super Admin" && currentRole !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BackButton to="/" />
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              Audit Trail is restricted to Super Admin and Admin roles only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get all events from EventSystem
  const allEvents = getEventHistory(undefined, 1000);

  // Transform events to audit log format
  const auditLogs = useMemo(() => {
    return allEvents.map((event, index) => {
      const timestamp = new Date(event.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Map event types to modules and actions
      const getModuleAndAction = (type: string) => {
        if (type.includes("LEAD") || type.includes("DEMO")) return { module: "CRM", action: type.replace(/_/g, ' ') };
        if (type.includes("SUBSCRIPTION")) return { module: "CRM", action: type.replace(/_/g, ' ') };
        if (type.includes("JOB")) return { module: "Operations", action: type.replace(/_/g, ' ') };
        if (type.includes("WASHER")) return { module: "Operations", action: type.replace(/_/g, ' ') };
        if (type.includes("INVENTORY")) return { module: "Inventory", action: type.replace(/_/g, ' ') };
        if (type.includes("PAYROLL")) return { module: "Finance", action: type.replace(/_/g, ' ') };
        if (type.includes("PAYMENT")) return { module: "Finance", action: type.replace(/_/g, ' ') };
        if (type.includes("QA") || type.includes("AUDIT")) return { module: "Operations", action: type.replace(/_/g, ' ') };
        if (type.includes("HR")) return { module: "HR", action: type.replace(/_/g, ' ') };
        return { module: "System", action: type.replace(/_/g, ' ') };
      };

      const { module, action } = getModuleAndAction(event.type);

      return {
        id: `EVT${String(index + 1).padStart(3, '0')}`,
        timestamp,
        module,
        action,
        user: event.source || currentUser.name,
        details: JSON.stringify(event.data).slice(0, 100),
        ip: event.data.ip || "—"
      };
    });
  }, [allEvents, currentUser]);

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return auditLogs;
    const term = searchTerm.toLowerCase();
    return auditLogs.filter(log =>
      log.action.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      log.user.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  }, [auditLogs, searchTerm]);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "User Management": return Users;
      case "CRM": return Activity;
      case "Finance": return DollarSign;
      case "Operations": return FileText;
      case "Complaint Mgmt": return AlertCircle;
      default: return FileText;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("Created") || action.includes("Added")) return "text-green-600 bg-green-50";
    if (action.includes("Deleted") || action.includes("Rejected")) return "text-red-600 bg-red-50";
    if (action.includes("Updated") || action.includes("Modified")) return "text-blue-600 bg-blue-50";
    if (action.includes("Payment") || action.includes("Received")) return "text-purple-600 bg-purple-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-6">
      <BackButton to="/" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">Complete system activity log and history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold mt-1">{auditLogs.length}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Activities</p>
                <p className="text-2xl font-bold mt-1">
                  {auditLogs.filter(log => {
                    const logDate = new Date(log.timestamp).toDateString();
                    const today = new Date().toDateString();
                    return logDate === today;
                  }).length}
                </p>
                <p className="text-xs text-green-600 mt-1">Real-time tracking</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold mt-1">{employees.filter(e => e.status === "Active").length}</p>
                <p className="text-xs text-gray-500 mt-1">Total employees</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical Actions</p>
                <p className="text-2xl font-bold mt-1">
                  {auditLogs.filter(log =>
                    log.action.includes("DELETED") ||
                    log.action.includes("CANCELLED") ||
                    log.action.includes("PAYMENT")
                  ).length}
                </p>
                <p className="text-xs text-orange-600 mt-1">Total</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">System Activity Log</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No audit logs available</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? "No logs match your search criteria" : "System events will appear here as they occur"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.slice(0, 20).map((log) => {
              const Icon = getModuleIcon(log.module);
              const actionColor = getActionColor(log.action);
              
              return (
                <div key={log.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${actionColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{log.action}</p>
                        <Badge variant="outline" className="text-xs">{log.module}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {log.user}
                        </span>
                        <span>{log.timestamp}</span>
                        <span>IP: {log.ip}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {filteredLogs.length > 0 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detailed Activity Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">#{log.id}</TableCell>
                          <TableCell>{log.timestamp}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.module}</Badge>
                          </TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell className="max-w-md truncate">{log.details}</TableCell>
                          <TableCell>{log.ip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}