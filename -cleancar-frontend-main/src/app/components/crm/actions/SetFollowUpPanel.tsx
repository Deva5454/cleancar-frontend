import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Clock, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useCustomers } from "../../../contexts/CustomerContext";
import { useRole } from "../../../contexts/RoleContext";
import type { Lead } from "../../../services/leadConversionService";

interface SetFollowUpPanelProps {
  lead: any;
  onClose: () => void;
  onComplete: () => void;
}

export function SetFollowUpPanel({
  lead,
  onClose,
  onComplete,
}: SetFollowUpPanelProps) {
  const { appendLeadActivity, updateLead } = useCustomers();
  const { currentUser } = useRole();
  const leadId = lead.leadId || lead.id;
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpType, setFollowUpType] = useState("call");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!followUpDate) {
      toast.error("Please select a follow-up date and time");
      return;
    }

    toast.success("Follow-up scheduled successfully!");

    updateLead(leadId, {
      followUpDate: followUpDate,
      followUpType: followUpType as Lead["followUpType"],
    });
    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "follow_up_set",
      description: `Follow-up set: ${followUpType} on ${new Date(followUpDate).toLocaleDateString("en-IN")}`,
      performedBy: currentUser?.name || "TSE",
      metadata: { followUpDate, followUpType, priority },
    });

    onComplete();
  };

  const setQuickDate = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    setFollowUpDate(date.toISOString().slice(0, 16));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          <h4 className="font-semibold text-gray-900">Set Follow-Up</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label>Follow-Up Date & Time *</Label>
          <Input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            required
          />
          
          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const today = new Date();
                today.setHours(today.getHours() + 2);
                setFollowUpDate(today.toISOString().slice(0, 16));
              }}
            >
              Today (2h later)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(10, 0, 0, 0);
                setFollowUpDate(tomorrow.toISOString().slice(0, 16));
              }}
            >
              Tomorrow 10 AM
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const twoDays = new Date();
                twoDays.setDate(twoDays.getDate() + 2);
                twoDays.setHours(10, 0, 0, 0);
                setFollowUpDate(twoDays.toISOString().slice(0, 16));
              }}
            >
              In 2 Days
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                nextWeek.setHours(10, 0, 0, 0);
                setFollowUpDate(nextWeek.toISOString().slice(0, 16));
              }}
            >
              Next Week
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Follow-Up Type</Label>
          <Select value={followUpType} onValueChange={setFollowUpType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="demo-checkin">Demo Check-in</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Note to Self (Optional)</Label>
          <Textarea
            placeholder="Reminder notes for this follow-up..."
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Follow-Up
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
