// Component to display current role information
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useRole } from "../contexts/RoleContext";
import { Shield, CheckCircle, XCircle } from "lucide-react";

export function RoleInfo() {
  const { currentRole, roleConfig, currentUser } = useRole();

  // Safety check for missing roleConfig
  if (!roleConfig) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="bg-blue-600 text-white p-4 rounded-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Currently logged in as</p>
              <h3 className="text-2xl font-bold text-gray-900">{currentUser?.name || "User"}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="text-sm">{currentRole}</Badge>
                {currentUser?.email && <span className="text-sm text-gray-600">• {currentUser.email}</span>}
                {currentUser?.city && <span className="text-sm text-gray-600">• {currentUser.city}</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Module Access</p>
              <p className="text-xl font-bold text-blue-600">{roleConfig.modules?.length || 0}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Permissions</p>
              <div className="flex gap-1 mt-1 justify-center">
                {roleConfig.canApprove && <CheckCircle className="w-5 h-5 text-green-600" title="Can Approve" />}
                {roleConfig.canCreate && <CheckCircle className="w-5 h-5 text-blue-600" title="Can Create" />}
                {roleConfig.canExport && <CheckCircle className="w-5 h-5 text-purple-600" title="Can Export" />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
