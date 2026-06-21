import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { processIncomingMessage } from "../../services/whatsappRescheduleHandler";
import { toast } from "sonner";
interface Props { customerPhone: string; customerName?: string; jobId?: string; subscriptionId?: string; scheduledDate?: string; scheduledSlot?: string; onSuccess?: () => void; }
export function CustomerRescheduleWidget({ customerPhone, scheduledDate, scheduledSlot, onSuccess }: Props) {
  const [step, setStep] = useState<"idle"|"confirm"|"submitted">("idle");
  const [loading, setLoading] = useState(false);
  function handleRequest() {
    setLoading(true);
    setTimeout(() => {
      const result = processIncomingMessage(customerPhone, "RESCHEDULE", "APP");
      setLoading(false);
      if (result.intent === "reschedule") { setStep("submitted"); toast.success("Request sent! Our team will contact you within 1 hour."); onSuccess?.(); }
      else toast.error("Could not process. Please call 080 48 79 45 45.");
    }, 600);
  }
  if (step === "submitted") return (
    <Card className="border-green-200 bg-green-50"><CardContent className="p-4 flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
      <div><p className="font-semibold text-green-800 text-sm">Reschedule Request Received</p>
      <p className="text-xs text-green-700 mt-1">Our team will contact you within 1 hour on <strong>{customerPhone}</strong>.</p></div>
    </CardContent></Card>
  );
  return (
    <Card className="border-orange-200"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4 text-orange-500" />Request Reschedule</CardTitle></CardHeader>
    <CardContent className="p-4 pt-0 space-y-3">
      {scheduledDate && <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">Current: <strong>{scheduledDate}</strong>{scheduledSlot && <> at <strong>{scheduledSlot}</strong></>}</div>}
      <div className="bg-amber-50 border border-amber-200 rounded p-2"><p className="text-xs text-amber-800">Max 3 reschedules per booking. Our team will call to confirm the new slot.</p></div>
      {step === "idle" && <Button onClick={() => setStep("confirm")} variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50" size="sm"><RefreshCw className="w-3 h-3 mr-2" />Request a Different Slot</Button>}
      {step === "confirm" && <div className="space-y-2"><p className="text-xs text-gray-600">Confirm reschedule? We will call you on <strong>{customerPhone}</strong>.</p>
        <div className="flex gap-2">
          <Button onClick={handleRequest} disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" size="sm">{loading ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Sending…</> : "Yes, Reschedule"}</Button>
          <Button onClick={() => setStep("idle")} variant="outline" size="sm">Cancel</Button>
        </div></div>}
    </CardContent></Card>
  );
}
export default CustomerRescheduleWidget;
