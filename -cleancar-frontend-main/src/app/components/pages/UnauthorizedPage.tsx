/**
 * Unauthorized Page - Access Denied
 *
 * Shown when user tries to access a route they don't have permission for.
 * Can be reached via:
 * 1. Direct navigation to /unauthorized
 * 2. Redirect from ProtectedRoute (when showUnauthorized=false)
 * 3. Manual redirect from route guards
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { Shield, Home, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { getDefaultRoute } from "../../config/routeConfig";

export function UnauthorizedPage() {
  const { currentUser, currentRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the route they tried to access (from state if redirected)
  const attemptedRoute = (location.state as any)?.from?.pathname || "unknown";

  // Get smart redirect based on role
  const defaultRoute = getDefaultRoute(currentRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Access Denied
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-6">
          You don't have permission to access this page.
        </p>

        {/* User Info */}
        {currentUser && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Your Role:</span>
              <span className="text-gray-900">{currentUser.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">City:</span>
              <span className="text-gray-900">{currentUser.city}</span>
            </div>
            {attemptedRoute !== "unknown" && (
              <div className="pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-700 text-sm block mb-1">
                  Attempted to access:
                </span>
                <code className="bg-white px-3 py-1.5 rounded text-xs text-gray-900 border block break-all">
                  {attemptedRoute}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link to={defaultRoute} className="block">
            <Button className="w-full" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Go to My Dashboard
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            If you believe you should have access to this page, please contact your
            administrator to request the necessary permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
