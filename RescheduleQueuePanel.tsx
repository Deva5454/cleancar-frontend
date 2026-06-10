/**
 * RescheduleQueuePanel.tsx
 * Shows pending WhatsApp reschedule requests with Resolve button.
 * Used in SupervisorAppConnected (alerts tab) and TeleSalesManagerApp (pipeline tab).
 */
import { useState, useEffect } from "react";
import { rescheduleService, type RescheduleRequest } from "../../services/whatsappRescheduleHandler";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Phone, Clock, CheckCircle2, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export function RescheduleQueuePanel() {
  const { currentUser } = useRole();
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveForm, setResolveForm] = useState<{ id: string; date: string; slot: string } | null>(null);

  const load = () => setRequests(rescheduleService.getPendingRequests());

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("cc360:reschedule_requested", handler);
    window.addEventListener("cc360:reschedule_resolved", handler);
    const interval = setInterval(load, 15000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("cc360:reschedule_requested", handler);
      window.removeEventListener("cc360:reschedule_resolved", handler);
    };
  }, []);

  function handleResolve(req: RescheduleRequest) {
    setResolveForm({ id: req.id, date: "", slot: "" });
  }

  function confirmResolve() {
    if (!resolveForm || !resolveForm.date || !resolveForm.slot) {
      toast.error("Please fill in the new date and slot");
      return;
    }
    setResolvingId(resolveForm.id);
    setTimeout(() => {
      rescheduleService.resolveRequest(
        resolveForm.id,
        currentUser?.employeeId || "UNKNOWN",
        resolveForm.date,
        resolveForm.slot
      );
      toast.success("Reschedule confirmed — customer will be notified");
      setResolvingId(null);
      setResolveForm(null);
      load();
    }, 400);
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No pending reschedule requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-gray-800">
          Reschedule Requests
        </span>
        <Badge className="bg-orange-500 text-white text-xs">{requests.length} pending</Badge>
      </div>

      {requests.map(req => (
        <Card key={req.id} className="border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{req.customerName}</span>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    {req.source === "WHATSAPP_REPLY" ? "WhatsApp Reply" : req.source === "IVR" ? "IVR" : "App"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />{req.customerPhone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(req.requestedAt).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
                {req.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">{req.notes}</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleResolve(req)}
                className="bg-green-600 hover:bg-green-700 text-white shrink-0"
              >
                Resolve
              </Button>
            </div>

            {/* Resolve form — inline */}
            {resolveForm?.id === req.id && (
              <div className="mt-3 pt-3 border-t border-orange-100 space-y-2">
                <p className="text-xs font-medium text-gray-700">Assign new slot:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="text-sm border rounded px-2 py-1 flex-1"
                    value={resolveForm.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setResolveForm(f => f ? { ...f, date: e.target.value } : f)}
                  />
                  <select
                    className="text-sm border rounded px-2 py-1 flex-1"
                    value={resolveForm.slot}
                    onChange={e => setResolveForm(f => f ? { ...f, slot: e.target.value } : f)}
                  >
                    <option value="">Pick slot…</option>
                    {Array.from({ length: 17 }, (_, i) => i + 5).map(h => (
                      <option key={h} value={`${String(h).padStart(2,"0")}:00`}>
                        {h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h-12}:00 PM`} – {h+1 < 12 ? `${h+1}:00 AM` : h+1 === 12 ? "12:00 PM" : `${h+1-12}:00 PM`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={confirmResolve}
                    disabled={resolvingId === req.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {resolvingId === req.id
                      ? <><RefreshCw className="w-3 h-3 animate-spin mr-1" />Confirming…</>
                      : "Confirm New Slot"}
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setResolveForm(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
