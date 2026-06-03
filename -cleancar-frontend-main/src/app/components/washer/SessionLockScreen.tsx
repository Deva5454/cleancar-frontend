/**
 * Session Lock Screen
 * Shown when device is lost/stolen or session locked by supervisor
 * Design Principle: Clear security state + contact action
 */

import { Lock, Shield, Phone, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export type LockReason = "DEVICE_LOST" | "SUPERVISOR_LOCK" | "SECURITY" | "TEMPORARY_ACCESS";

export interface SessionLockScreenProps {
  reason: LockReason;
  supervisorPhone?: string;
  lockedAt?: Date;
  message?: string;
  isTemporaryAccess?: boolean;
}

export function SessionLockScreen({
  reason,
  supervisorPhone = "",
  lockedAt,
  message,
  isTemporaryAccess = false
}: SessionLockScreenProps) {
  const getLockInfo = () => {
    switch (reason) {
      case "DEVICE_LOST":
        return {
          icon: AlertTriangle,
          title: "Device Reported Lost",
          description: "This device has been reported lost or stolen",
          color: "red"
        };
      case "SUPERVISOR_LOCK":
        return {
          icon: Lock,
          title: "Session Locked by Supervisor",
          description: "Your session has been locked",
          color: "amber"
        };
      case "SECURITY":
        return {
          icon: Shield,
          title: "Security Lock",
          description: "This session has been locked for security reasons",
          color: "red"
        };
      case "TEMPORARY_ACCESS":
        return {
          icon: Shield,
          title: "Temporary Access Mode",
          description: "You are using a temporary device",
          color: "blue"
        };
    }
  };

  const lockInfo = getLockInfo();
  const Icon = lockInfo.icon;

  // Temporary access mode (different UI)
  if (isTemporaryAccess) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-blue-300 bg-white">
          <CardContent className="p-6">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>

              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Temporary Access Granted
              </h1>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                You are using a temporary device provided by your supervisor
              </p>

              {/* Badge */}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 mb-6">
                Limited Access Mode
              </Badge>

              {/* Restrictions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-left mb-6">
                <p className="text-xs font-medium text-gray-900 mb-2">Access Restrictions:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• View today's jobs only</li>
                  <li>• Cannot modify settings</li>
                  <li>• Limited profile access</li>
                  <li>• Session expires in 24 hours</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                  Continue with Limited Access
                </Button>
                <p className="text-xs text-gray-500">
                  Contact supervisor to restore full access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular lock screen
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      lockInfo.color === "red" ? "bg-red-50" : "bg-amber-50"
    }`}>
      <Card className={`max-w-md w-full border-2 ${
        lockInfo.color === "red" ? "border-red-300" : "border-amber-300"
      } bg-white`}>
        <CardContent className="p-6">
          <div className="text-center">
            {/* Lock Icon */}
            <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4 ${
              lockInfo.color === "red" ? "bg-red-100" : "bg-amber-100"
            }`}>
              <Icon className={`h-10 w-10 ${
                lockInfo.color === "red" ? "text-red-600" : "text-amber-600"
              }`} />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {lockInfo.title}
            </h1>

            {/* Description */}
            <p className="text-base text-gray-600 mb-4">
              {lockInfo.description}
            </p>

            {/* Custom message */}
            {message && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 text-left">
                <p className="text-sm text-gray-700">{message}</p>
              </div>
            )}

            {/* Lock time */}
            {lockedAt && (
              <p className="text-xs text-gray-500 mb-6">
                Locked at: {lockedAt.toLocaleString()}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-6" />

            {/* Contact section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                What to do next:
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700">
                    Contact your supervisor immediately
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700">
                    {reason === "DEVICE_LOST" 
                      ? "Report the device location or recovery"
                      : "Request session unlock approval"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700">
                    Wait for supervisor approval to unlock
                  </p>
                </div>
              </div>
            </div>

            {/* Contact button */}
            <Button 
              className={`w-full h-14 text-base ${
                lockInfo.color === "red" 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
              onClick={() => window.location.href = `tel:${supervisorPhone}`}
            >
              <Phone className="h-5 w-5 mr-2" />
              Call Supervisor
            </Button>

            {/* Supervisor phone */}
            <p className="text-sm text-gray-600 mt-2">
              {supervisorPhone}
            </p>

            {/* Security notice */}
            <div className={`mt-6 p-3 rounded-lg border text-left ${
              lockInfo.color === "red" 
                ? "bg-red-50 border-red-200" 
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-start gap-2">
                <Shield className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  lockInfo.color === "red" ? "text-red-600" : "text-amber-600"
                }`} />
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Security Notice:</span> This lock is for your protection. 
                  Do not attempt to bypass or share credentials.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
