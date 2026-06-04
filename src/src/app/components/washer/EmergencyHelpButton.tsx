// Emergency Help Button
// Critical escalation feature for washers
import { useState } from "react";
import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export interface EmergencyHelpButtonProps {
  onEmergency?: () => void;
  compact?: boolean;
}

export function EmergencyHelpButton({ onEmergency, compact = false }: EmergencyHelpButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);

  const handleEmergencyClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmEmergency = () => {
    setEmergencySent(true);
    setShowConfirmDialog(false);

    // Trigger callback
    if (onEmergency) {
      onEmergency();
    }

    // Auto-reset after 5 seconds
    setTimeout(() => {
      setEmergencySent(false);
    }, 5000);
  };

  if (compact) {
    return (
      <>
        <Button
          onClick={handleEmergencyClick}
          variant="outline"
          size="sm"
          className="border-2 border-red-300 text-red-700 hover:bg-red-50"
          disabled={emergencySent}
        >
          <Phone className="w-4 h-4 mr-1.5" />
          {emergencySent ? "Help Sent" : "Emergency"}
        </Button>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Confirm Emergency Request
              </DialogTitle>
              <DialogDescription>
                This will immediately alert your supervisor. Use only for genuine emergencies.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmEmergency}
                className="bg-red-600 hover:bg-red-700"
              >
                Send Emergency Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleEmergencyClick}
        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold border-2 border-red-700"
        disabled={emergencySent}
      >
        <AlertTriangle className="w-5 h-5 mr-2" />
        {emergencySent ? "Help Request Sent" : "Emergency सहायता / Help"}
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Confirm Emergency Request
            </DialogTitle>
            <DialogDescription className="text-base">
              This will immediately alert your supervisor and trigger emergency protocols.
              <br />
              <br />
              <strong>Use only for genuine emergencies such as:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Medical emergency</li>
                <li>Safety hazard</li>
                <li>Customer conflict</li>
                <li>Vehicle damage</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmEmergency}
              className="bg-red-600 hover:bg-red-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Send Emergency Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
