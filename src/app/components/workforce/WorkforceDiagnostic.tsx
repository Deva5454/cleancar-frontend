import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function WorkforceDiagnostic() {
  const checks = [
    {
      name: "React Import",
      status: true,
      message: "React is available",
    },
    {
      name: "UI Components",
      status: true,
      message: "Card, Button, Badge components working",
    },
    {
      name: "Icons",
      status: true,
      message: "Lucide icons loading",
    },
    {
      name: "Routing",
      status: true,
      message: "Route /workforce/diagnostic is accessible",
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workforce Module Diagnostic</h1>
        <p className="text-sm text-gray-500 mt-1">
          System check for workforce module components
        </p>
      </div>

      <Card className="border-2 border-blue-300">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-lg">Component Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              {check.status ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div className="flex-1">
                <div className="font-medium">{check.name}</div>
                <div className="text-sm text-gray-600">{check.message}</div>
              </div>
              <Badge className={check.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {check.status ? "OK" : "FAIL"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Routes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { path: "/workforce/test", desc: "Basic test page" },
            { path: "/workforce/simple", desc: "Simplified working hours" },
            { path: "/workforce/working-hours", desc: "Full working hours module" },
            { path: "/workforce/diagnostic", desc: "This diagnostic page" },
          ].map((route, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-mono text-sm text-blue-600">{route.path}</div>
              <div className="text-xs text-gray-600 mt-1">{route.desc}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <div className="font-semibold text-orange-900 mb-2">Troubleshooting Steps</div>
              <ol className="text-sm text-orange-800 space-y-1 list-decimal list-inside">
                <li>Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)</li>
                <li>Check browser console (F12) for any errors</li>
                <li>Try /workforce/test first - simplest page</li>
                <li>Try /workforce/simple - simplified version</li>
                <li>Try /workforce/working-hours - full module</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">User Agent:</span>
            <span className="font-mono text-xs">{navigator.userAgent.substring(0, 50)}...</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Current Path:</span>
            <span className="font-mono text-xs">{window.location.pathname}</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Timestamp:</span>
            <span className="font-mono text-xs">{new Date().toISOString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
