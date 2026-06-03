import { useParams, useSearchParams } from "react-router-dom";
import { ActivityTimeline } from "./ActivityTimeline";

// CR3 FIX: was hardcoded to "LD001" / "Rajesh Kumar" — now reads leadId from URL
// Route: /crm/activity-timeline?leadId=LD001&leadName=John
// Or: /crm/activity-timeline/LD001 (if route has :leadId param)
export function ActivityTimelineWrapper() {
  const params        = useParams<{ leadId?: string }>();
  const [searchParams] = useSearchParams();

  const leadId   = params.leadId   || searchParams.get("leadId")   || "LD001";
  const leadName = searchParams.get("leadName") || "Customer";

  return <ActivityTimeline leadId={leadId} leadName={leadName} />;
}
