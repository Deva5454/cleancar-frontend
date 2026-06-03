/**
 * Domain Component - CustomerCard
 * Reusable customer card component
 */

import { Card, CardContent } from "../../app/components/ui/card";
import { Badge } from "../../app/components/ui/badge";
import { Button } from "../../app/components/ui/button";
import { StatusBadge } from "../../app/design-system/components/StatusBadge";
import {
  Mail,
  Phone,
  MapPin,
  Car,
  Calendar,
  Eye,
  Edit,
  MessageSquare,
} from "lucide-react";
import { cn } from "../../app/lib/utils";

export interface CustomerCardData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address?: string;
  subscriptionType?: string;
  subscriptionStatus?: "Active" | "Inactive" | "Pending" | "Expired";
  vehicleCount?: number;
  joinDate?: string;
  lastService?: string;
}

export interface CustomerCardProps {
  customer: CustomerCardData;
  onView?: (customer: CustomerCardData) => void;
  onEdit?: (customer: CustomerCardData) => void;
  onContact?: (customer: CustomerCardData) => void;
  variant?: "default" | "compact";
  className?: string;
}

export function CustomerCard({
  customer,
  onView,
  onEdit,
  onContact,
  variant = "default",
  className,
}: CustomerCardProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow",
          className
        )}
      >
        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
          {customer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{customer.name}</p>
          <p className="text-xs text-gray-500 truncate">{customer.mobile}</p>
        </div>
        {customer.subscriptionStatus && (
          <StatusBadge 
            status={customer.subscriptionStatus.toLowerCase().replace(/\s+/g, "-")} 
            size="sm" 
          />
        )}
      </div>
    );
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-sm text-gray-500">{customer.id}</p>
            </div>
          </div>
          {customer.subscriptionStatus && (
            <StatusBadge 
              status={customer.subscriptionStatus.toLowerCase().replace(/\s+/g, "-")} 
            />
          )}
        </div>

        {/* Subscription Badge */}
        {customer.subscriptionType && (
          <Badge className="mb-4 bg-purple-100 text-purple-800 border-purple-300">
            {customer.subscriptionType}
          </Badge>
        )}

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="truncate">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{customer.mobile}</span>
          </div>
          {customer.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{customer.address}</span>
            </div>
          )}
          {customer.vehicleCount !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Car className="w-4 h-4" />
              <span>{customer.vehicleCount} Vehicle{customer.vehicleCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {customer.joinDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Member since: {customer.joinDate}</span>
            </div>
          )}
        </div>

        {/* Last Service */}
        {customer.lastService && (
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-xs text-gray-500">Last Service</p>
            <p className="text-sm text-gray-900 font-medium">{customer.lastService}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView(customer)}
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
              onClick={() => onEdit(customer)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {onContact && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContact(customer)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
