High: Real Timeline, Real Follow-ups, Notifications, BTL Fix, Vehicle Details

This is Phase 2 of 3. All Phase 1 changes must be applied first.

CHANGE 1 — src/app/components/crm/ActivityTimeline.tsx — Replace mock with real timeline
Add imports:
tsimport { useCustomers } from "../../contexts/CustomerContext";
Inside the component, replace:
ts  const [activities, setActivities] = useState<Activity[]>(mockActivities);
With:
ts  const { leads } = useCustomers();
  const lead = leads.find(l => l.leadId === leadId);
  const realTimeline = lead?.timeline || [];

  // Map LeadActivity to Activity format for display
  const [activities, setActivities] = useState<Activity[]>(() =>
    realTimeline.map(t => ({
      id: t.id,
      type: t.type,
      title: t.description,
      description: t.outcome || t.nextAction || "",
      timestamp: t.timestamp,
      status: "completed" as const,
      performedBy: t.performedBy,
      reminderSent: false,
    }))
  );

  // Sync when lead timeline changes
  useEffect(() => {
    const updated = (lead?.timeline || []).map(t => ({
      id: t.id, type: t.type, title: t.description,
      description: t.outcome || "", timestamp: t.timestamp,
      status: "completed" as const, performedBy: t.performedBy, reminderSent: false,
    }));
    setActivities(updated);
  }, [lead?.timeline?.length]);
Keep the addActivity function so TSEs can still log quick notes inline — but save via appendLeadActivity:
ts  const { appendLeadActivity } = useCustomers();
  const addActivity = (text: string) => {
    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "note",
      description: text,
      performedBy: "TSE",
    });
  };

CHANGE 2 — src/app/components/crm/LeadHistory.tsx — Replace mock with real timeline
Same pattern as ActivityTimeline. Replace:
ts  const [history] = useState<HistoryEvent[]>(mockHistory.filter(h => h.leadId === leadId));
With:
ts  const { leads } = useCustomers();
  const lead = leads.find(l => l.leadId === leadId);
  const history = (lead?.timeline || []).map(t => ({
    id: t.id, leadId,
    eventType: t.type as any,
    timestamp: t.timestamp,
    performedBy: t.performedBy,
    description: t.description,
    systemGenerated: false,
    metadata: t.metadata,
  }));

CHANGE 3 — src/app/components/crm/MyFollowUps.tsx — Replace mock with real leads
Add imports:
tsimport { useCustomers } from "../../contexts/CustomerContext";
import { useCity } from "../../contexts/CityContext";
Replace the hardcoded allFollowUpLeads array:
ts  const { cityLeads } = useCustomers();
  const { city } = useCity();

  const allFollowUpLeads = cityLeads
    .filter(l => l.followUpDate && l.stage !== "converted" && l.stage !== "lost")
    .map(l => ({
      id: l.leadId,
      name: `${l.firstName} ${l.lastName}`,
      mobile: l.phone,
      area: l.address.area,
      stage: l.stage || "new",
      temperature: l.temperature || "cold",
      followUpDue: l.followUpDate || "",
      assignedTSE: l.assignedTSE || l.assignedTo || "Unassigned",
      source: l.leadSource,
      lastActivity: l.lastContactedAt
        ? new Date(l.lastContactedAt).toLocaleString("en-IN")
        : "No contact yet",
    }));

CHANGE 4 — src/app/components/crm/NotificationCenter.tsx — Wire to EventSystem
Add imports:
tsimport { useEventListener } from "../../contexts/EventSystem";
import { useCustomers } from "../../contexts/CustomerContext";
Replace useState(mockNotifications) with useState<Notification[]>([]). Add event listeners:
ts  const { leads } = useCustomers();

  useEventListener("LEAD_CONVERTED", (event) => {
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}`,
      type: "success" as const,
      title: "Lead Converted",
      message: `${event.data.customerName} is now an active subscriber — ₹${event.data.amount?.toLocaleString() || "0"}/month`,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false,
      link: "/crm",
    }, ...prev]);
  });

  useEventListener("JOB_COMPLETED", (event) => {
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}`,
      type: "info" as const,
      title: "Job Completed",
      message: `Job completed by ${event.data.washerName} for customer ${event.data.customerName || event.data.customerId}`,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false,
      link: "/operations",
    }, ...prev]);
  });

  // SLA breach: leads with followUpDate in the past
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const overdue = leads.filter(l =>
      l.followUpDate && l.followUpDate < today &&
      l.stage !== "converted" && l.stage !== "lost"
    );
    overdue.forEach(l => {
      setNotifications(prev => {
        if (prev.some(n => n.id === `SLA-${l.leadId}`)) return prev;
        return [{
          id: `SLA-${l.leadId}`,
          type: "warning" as const,
          title: "Follow-up Overdue",
          message: `${l.firstName} ${l.lastName} — follow-up was due ${l.followUpDate}`,
          timestamp: new Date().toISOString(),
          read: false,
          actionRequired: true,
          link: "/crm",
        }, ...prev];
      });
    });
  }, [leads]);

CHANGE 5 — src/app/services/btlLeadService.ts — Write to CustomerContext not MASTER_LEADS
The btlLeadService is a class-based service that cannot directly use React hooks. The fix is to make it emit an event that CustomerContext listens to.
Find the submitLead method. After building the crmLead object, replace:
ts  MASTER_LEADS.push(crmLead);
With:
ts  // Persist to localStorage under the same key CustomerContext reads from
  const STORAGE_KEY = "LEADS";
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const duplicate = existing.find((l: any) => l.phone === crmLead.phone);
    if (!duplicate) {
      existing.push({
        ...crmLead,
        leadId: crmLead.id || `BTL-${Date.now()}`,
        cityId: crmLead.cityId,
        city: crmLead.city,
        stage: "new",
        source: "BTL",
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.error("BTL lead persist failed", e);
  }
This writes directly to the DataService key that CustomerContext reads on mount, making BTL leads survive page refresh and appear in the CRM pipeline.
Do not change any other file in Phase 2.