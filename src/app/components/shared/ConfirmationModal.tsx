import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning" | "success";
  isLoading?: boolean;
  details?: Array<{ label: string; value: string | number }>;
}

const VARIANT_STYLES = {
  default: {
    icon: Info,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    confirmButton: "default" as const,
  },
  danger: {
    icon: AlertCircle,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    confirmButton: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-100",
    confirmButton: "default" as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    confirmButton: "default" as const,
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  details,
}: ConfirmationModalProps) {
  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className={`p-3 rounded-full ${style.iconBg}`}>
              <Icon className={`h-6 w-6 ${style.iconColor}`} />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-base pt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {details && details.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{detail.label}:</span>
                <span className="font-semibold">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {variant === "danger" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ⚠️ This action cannot be undone
            </p>
          </div>
        )}

        <DialogFooter className="sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={style.confirmButton}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
