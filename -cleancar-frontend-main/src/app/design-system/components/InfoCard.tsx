/**
 * InfoCard Component
 * 
 * Card for displaying detailed information with key-value pairs.
 * Perfect for details pages and profile information.
 * 
 * @component
 */

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface InfoCardProps {
  /** Card title */
  title: string;
  
  /** Card subtitle */
  subtitle?: string;
  
  /** Title icon */
  icon?: LucideIcon;
  
  /** Information items */
  items: Array<{
    label: string;
    value: ReactNode;
    fullWidth?: boolean;
  }>;
  
  /** Action buttons */
  actions?: ReactNode;
  
  /** Custom className */
  className?: string;
}

/**
 * InfoCard component for displaying structured information
 * 
 * @example
 * ```tsx
 * <InfoCard
 *   title="Employee Details"
 *   subtitle="Personal Information"
 *   icon={User}
 *   items={[
 *     { label: "Name", value: "John Doe" },
 *     { label: "Email", value: "john@example.com" },
 *     { label: "Phone", value: "+91 98765 43210" },
 *     { label: "Department", value: "Engineering" },
 *     { label: "Joining Date", value: "Jan 15, 2024" },
 *   ]}
 *   actions={
 *     <Button size="sm">Edit</Button>
 *   }
 * />
 * ```
 */
export function InfoCard({
  title,
  subtitle,
  icon: Icon,
  items,
  actions,
  className = "",
}: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-blue-50 rounded-lg">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className={item.fullWidth ? "col-span-2" : "col-span-1"}
            >
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <div className="text-sm font-medium text-gray-900">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default InfoCard;
