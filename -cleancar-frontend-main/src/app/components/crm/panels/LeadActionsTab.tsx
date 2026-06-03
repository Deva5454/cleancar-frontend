import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { LogCallPanel } from "../actions/LogCallPanel";
import { SendMessagePanel } from "../actions/SendMessagePanel";
import { SendPlanPricePanel } from "../actions/SendPlanPricePanel";
import { ScheduleDemoPanel } from "../actions/ScheduleDemoPanel";
import { SetFollowUpPanel } from "../actions/SetFollowUpPanel";
import { DemoOutcomeSelector } from "../DemoOutcomeSelector";
import { toast } from "sonner";
import { logger } from "../../../services/logger";

interface LeadActionsTabProps {
  lead: any;
}

export function LeadActionsTab({ lead }: LeadActionsTabProps) {
  const handleClose = () => {
    // Close handler
  };

  const handleComplete = () => {
    // Complete handler
  };

  const handleDemoOutcomeSelect = (outcome: any, notes: string) => {
    toast.success(`Demo Outcome: ${outcome.label}`, {
      description: `Event ${outcome.systemEvent} triggered. ${outcome.actions.length} automated actions initiated.`
    });
    // In real implementation, this would update the lead status and trigger workflow
    logger.log("Demo Outcome Selected:", outcome, "Notes:", notes);
  };

  return (
    <div className="space-y-6">
      {/* Log a Call */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log a Call</CardTitle>
        </CardHeader>
        <CardContent>
          <LogCallPanel
            lead={lead}
            onClose={handleClose}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>

      {/* Send Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send Message</CardTitle>
        </CardHeader>
        <CardContent>
          <SendMessagePanel
            lead={lead}
            onClose={handleClose}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>

      {/* Send Plan & Price */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send Plan & Price</CardTitle>
        </CardHeader>
        <CardContent>
          <SendPlanPricePanel
            lead={lead}
            onClose={handleClose}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>

      {/* Schedule Demo */}
      {!lead.demoScheduled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleDemoPanel
              lead={lead}
              onClose={handleClose}
              onComplete={handleComplete}
            />
          </CardContent>
        </Card>
      )}

      {/* Demo Outcome Selection (shows after demo is completed) */}
      {lead.demoCompleted && !lead.demoOutcomeSet && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
              Set Demo Outcome & Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DemoOutcomeSelector
              demoId={lead.demoId || "DEMO-001"}
              onSelect={handleDemoOutcomeSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Set Follow-Up */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Set Follow-Up</CardTitle>
        </CardHeader>
        <CardContent>
          <SetFollowUpPanel
            lead={lead}
            onClose={handleClose}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}