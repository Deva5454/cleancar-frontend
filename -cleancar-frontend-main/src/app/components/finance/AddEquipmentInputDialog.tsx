// Equipment Actual Input Dialog - Placeholder
// Full implementation follows same pattern as AddConsumableInputDialog

import React from "react";
import { Dialog, DialogContent } from "../ui/dialog";

export function AddEquipmentInputDialog({ open, onOpenChange, onSave }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p>Equipment Input Dialog - Implementation Ready</p>
      </DialogContent>
    </Dialog>
  );
}
