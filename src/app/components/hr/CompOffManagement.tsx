/**
 * 🟪 COMP OFF MANAGEMENT - EMPLOYEE VIEW
 * Shows Comp Off balance with detailed breakdown, expiry tracking, and pending approvals
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AlertCircle, TrendingUp, RefreshCw, Calendar, Clock, Info } from "lucide-react";
import { compOffService, type CompOffBalance } from "../../services/compOffService";
import { useRole } from "../../contexts/RoleContext";

export function CompOffManagement() {
  const { currentUser } = useRole();
  const [balance, setBalance] = useState<CompOffBalance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBalance();
  }, [currentUser]);

  const loadBalance = () => {
    setLoading(true);
    // In real app, get employeeId from auth
    const employeeId = `EMP_${currentUser.name.replace(/\s+/g, "_")}`;
    const data = compOffService.getEmployeeCompOffBalance(employeeId);
    setBalance(data);
    setLoading(false);
  };

  const handleSeedSample = () => {
    const employeeId = `EMP_${currentUser.name.replace(/\s+/g, "_")}`;
    compOffService.seedSampleCompOffData(employeeId, currentUser.name);
    loadBalance();
  };

  if (!balance) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="text-center">
            <Button onClick={handleSeedSample} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Load Sample Comp Off Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card - Total Balance */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-600" />
              Compensatory Off Balance
            </CardTitle>
            <Button size="sm" variant="outline" onClick={loadBalance}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 mb-1">Total Available</p>
              <p className="text-4xl font-bold text-amber-900">{balance.total}</p>
              <p className="text-xs text-amber-600 mt-1">Days</p>
            </div>
            
            <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 mb-1">Active Entries</p>
              <p className="text-4xl font-bold text-orange-900">{balance.breakdown.length}</p>
              <p className="text-xs text-orange-600 mt-1">Comp Off Credits</p>
            </div>
            
            <div className="bg-white/70 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 mb-1">Expiring Soon</p>
              <p className="text-4xl font-bold text-red-900">{balance.expiringWithin7Days.length}</p>
              <p className="text-xs text-red-600 mt-1">Within 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiry Alerts */}
      {balance.expiringWithin7Days.length > 0 && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              ⚠️ Comp Off Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balance.expiringWithin7Days.map((entry) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(entry.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const available = entry.compOffDays - entry.consumed;

                return (
                  <div key={entry.id} className="bg-white p-3 rounded-lg border-2 border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-red-900">
                          {available} day{available !== 1 ? "s" : ""} expiring in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-red-700">
                          Earned on {new Date(entry.earnedDate).toLocaleDateString("en-IN")} • 
                          Expires on {new Date(entry.expiryDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <Badge variant="destructive">USE NOW</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Approval Requests */}
      {balance.pendingApproval.length > 0 && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Manager Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balance.pendingApproval.map((request) => (
                <div key={request.id} className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Worked on {request.workDayType}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(request.workDate).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                    <div>
                      <p className="text-gray-600">Work Hours</p>
                      <p className="font-semibold">{request.workHours} hours</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Comp Off Suggested</p>
                      <p className="font-semibold text-blue-600">+{request.suggestedCompOff} day{request.suggestedCompOff !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  {request.workEvidence && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      <strong>Evidence:</strong> {request.workEvidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Comp Off Breakdown (FIFO Order)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            When you apply Comp Off leave, the system will automatically use the oldest expiring entry first
          </p>
        </CardHeader>
        <CardContent>
          {balance.breakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No active Comp Off entries</p>
              <p className="text-sm mt-1">Comp Off is earned when you work on weekly offs or public holidays</p>
            </div>
          ) : (
            <div className="space-y-3">
              {balance.breakdown
                .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)) // FIFO order
                .map((entry, index) => {
                  const available = entry.compOffDays - entry.consumed;
                  const daysUntilExpiry = Math.ceil(
                    (new Date(entry.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysUntilExpiry <= 7;

                  return (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-lg border-2 ${
                        isExpiringSoon
                          ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1} • FIFO Priority
                            </Badge>
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-xs">
                                Expires in {daysUntilExpiry} days
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900">
                            +{entry.compOffDays} day{entry.compOffDays !== 1 ? "s" : ""} Comp Off
                          </p>
                          <p className="text-sm text-gray-600">
                            Worked on {entry.workDayType} • {entry.workHours} hours
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{available}</p>
                          <p className="text-xs text-gray-500">available</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Work Date</p>
                          <p className="font-semibold">
                            {new Date(entry.workDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Earned On</p>
                          <p className="font-semibold">
                            {new Date(entry.earnedDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expires On</p>
                          <p className={`font-semibold ${isExpiringSoon ? "text-red-600" : ""}`}>
                            {new Date(entry.expiryDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Approved By</p>
                          <p className="font-semibold text-green-600">{entry.approvedBy}</p>
                        </div>
                      </div>

                      {entry.consumed > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-600">
                            <strong>Usage:</strong> {entry.consumed} day{entry.consumed !== 1 ? "s" : ""} consumed • {available} day{available !== 1 ? "s" : ""} remaining
                          </p>
                        </div>
                      )}

                      {entry.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-700">
                            <strong>Note:</strong> {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Info */}
      <Card className="bg-purple-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="text-base text-purple-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Comp Off Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-purple-900">
            <div>
              <p className="font-semibold mb-1">🎯 How Comp Off is Earned</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>Work ≥5 hours on Weekly Off/Holiday → Earn 1 full day</li>
                <li>Work &lt;5 hours on Weekly Off/Holiday → Earn 0.5 day</li>
                <li>System detects work and creates approval request</li>
                <li>Manager approves → Comp Off credited to your account</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">⏰ Validity & Expiry</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>Each Comp Off is valid for 90 days from earned date</li>
                <li>System alerts you 7 days before expiry</li>
                <li>Expired Comp Off is automatically removed</li>
                <li>Cannot be carried forward after expiry</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">🔥 FIFO Usage (First In, First Out)</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>System automatically uses oldest expiring Comp Off first</li>
                <li>This ensures you don't lose any earned Comp Off</li>
                <li>You cannot choose which Comp Off to use</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">📌 Important Notes</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-purple-800">
                <li>You cannot manually apply for Comp Off</li>
                <li>Comp Off is system-generated based on attendance</li>
                <li>Manager approval is mandatory</li>
                <li>Use Comp Off before it expires to avoid loss</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}