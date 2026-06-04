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
import { Phone, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useCustomers } from "../../../contexts/CustomerContext";
import { useRole } from "../../../contexts/RoleContext";

interface LogCallPanelProps {
  lead: any;
  onClose: () => void;
  onComplete: () => void;
}

export function LogCallPanel({ lead, onClose, onComplete }: LogCallPanelProps) {
  const { appendLeadActivity, updateLead } = useCustomers();
  const { currentUser } = useRole();
  const leadId = lead.leadId || lead.id;
  const [callOutcome, setCallOutcome] = useState("");
  const [talkDuration, setTalkDuration] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [temperature, setTemperature] = useState("");
  const [demoOffered, setDemoOffered] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!callOutcome) {
      toast.error("Please select a call outcome");
      return;
    }

    if (callOutcome === "Connected" && !callNotes) {
      toast.error("Call notes are required for connected calls");
      return;
    }

    if (callOutcome === "Connected" && !temperature) {
      toast.error("Please set lead temperature after connected call");
      return;
    }

    toast.success("Call logged successfully!");

    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "call",
      description: `Call ${callOutcome === "Connected" ? "connected" : "not connected"}. ${callNotes}`,
      performedBy: currentUser?.name || "TSE",
      outcome: callOutcome,
      nextAction: followUpDate || undefined,
    });
    if (temperature) {
      updateLead(leadId, { temperature: temperature as "hot" | "warm" | "cold", lastContactedAt: new Date().toISOString() });
    }

    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-teal-600" />
          <h4 className="font-semibold text-gray-900">Log Call</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label>Call Date & Time</Label>
          <Input
            type="datetime-local"
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="space-y-2">
          <Label>Call Outcome *</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Connected",
              "Not Connected",
              "Busy",
              "Switched Off",
              "Call Back Requested",
              "Wrong Number",
            ].map((outcome) => (
              <button
                key={outcome}
                type="button"
                onClick={() => setCallOutcome(outcome)}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  callOutcome === outcome
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {outcome}
              </button>
            ))}
          </div>
        </div>

        {callOutcome === "Connected" && (
          <>
            <div className="space-y-2">
              <Label>Talk Duration (minutes)</Label>
              <Input
                type="number"
                min="1"
                step="0.5"
                placeholder="e.g., 4.5"
                value={talkDuration}
                onChange={(e) => setTalkDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Call Notes *</Label>
              <Textarea
                placeholder="Discuss conversation details..."
                rows={3}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Lead Temperature After Call *</Label>
              <div className="flex gap-2">
                {["Hot", "Warm", "Cold"].map((temp) => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setTemperature(temp)}
                    className={`flex-1 p-3 border-2 rounded-lg font-medium ${
                      temperature === temp
                        ? temp === "Hot"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : temp === "Warm"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200"
                    }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </div>

            {(temperature === "Hot" || temperature === "Warm") && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={demoOffered}
                    onChange={(e) => setDemoOffered(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Demo offered during call
                  </span>
                </label>
                {demoOffered && (
                  <p className="text-sm text-amber-700 mt-2">
                    ✓ You can schedule the demo immediately after logging this call
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="space-y-2">
          <Label>Next Follow-Up Date & Time *</Label>
          <Input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            required
          />
          <div className="flex gap-2 mt-2">
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
                const today = new Date();
                today.setHours(today.getHours() + 4);
                setFollowUpDate(today.toISOString().slice(0, 16));
              }}
            >
              4 Hours Later
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" />
            Save Call Log
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
