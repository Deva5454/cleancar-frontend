/**
 * Domain Component - EmployeeCard
 * Reusable employee card component
 */

import { Card, CardContent } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Button } from "../../app/components/ui/button";
import { StatusBadge } from "../../app/design-system/components/StatusBadge";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  Eye,
  Edit,
  MoreVertical,
} from "lucide-react";
import { cn } from "../../app/lib/utils";

export interface EmployeeCardData {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  status: "Active" | "On Leave" | "Inactive" | "Exited";
  dateOfJoining?: string;
  workLocation?: string;
  avatar?: string;
}

export interface EmployeeCardProps {
  employee: EmployeeCardData;
  onView?: (employee: EmployeeCardData) => void;
  onEdit?: (employee: EmployeeCardData) => void;
  onMore?: (employee: EmployeeCardData) => void;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export function EmployeeCard({
  employee,
  onView,
  onEdit,
  onMore,
  variant = "default",
  className,
}: EmployeeCardProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow",
          className
        )}
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
          {employee.fullName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{employee.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{employee.designation}</p>
        </div>
        <StatusBadge status={employee.status.toLowerCase().replace(/\s+/g, "-")} size="sm" />
      </div>
    );
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {employee.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{employee.fullName}</h3>
              <p className="text-sm text-gray-500">{employee.id}</p>
            </div>
          </div>
          <StatusBadge status={employee.status.toLowerCase().replace(/\s+/g, "-")} />
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span>{employee.designation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            <span>{employee.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{employee.mobile}</span>
          </div>
          {employee.workLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{employee.workLocation}</span>
            </div>
          )}
          {employee.dateOfJoining && variant === "detailed" && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Joined: {employee.dateOfJoining}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView(employee)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(employee)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {onMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMore(employee)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
