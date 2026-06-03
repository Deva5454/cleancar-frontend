Critical: Lead Interface, Action Panel Persistence, Kanban Stage Persistence

This is Phase 1 of 3. Fix only the 3 critical gaps.

CHANGE 1 — src/app/services/leadConversionService.ts — Extend Lead interface
Find the Lead interface. After createdAt: string; add:
ts  // City isolation
  cityId: string;
  city: string;

  // Pipeline stage — stored separately from Customer.status
  // Allows 8 granular stages without changing Customer status
  stage: "new" | "contacted" | "interested" | "demo_scheduled" |
          "demo_completed" | "proposal" | "converted" | "lost";

  // Assignment
  assignedTo?: string;      // employee ID
  assignedTSE?: string;     // TSE display name
  assignedAt?: string;

  // Follow-up tracking
  followUpDate?: string;    // ISO date
  followUpType?: "call" | "whatsapp" | "visit" | "demo";
  lastContactedAt?: string;

  // Lead quality
  temperature?: "hot" | "warm" | "cold";
  priority?: "high" | "medium" | "low";
  score?: number;           // 0-100 from leadAssignmentEngine

  // Activity log — replaces mock timeline
  timeline?: LeadActivity[];
}

export interface LeadActivity {
  id: string;
  timestamp: string;
  type: "call" | "whatsapp" | "demo_scheduled" | "demo_completed" |
        "note" | "stage_change" | "assigned" | "follow_up_set" |
        "price_sent" | "converted";
  description: string;
  performedBy: string;        // employee name
  outcome?: string;
  nextAction?: string;
  metadata?: Record<string, any>;
}

CHANGE 2 — src/app/contexts/CustomerContext.tsx — Add cityLeads computed property and appendLeadActivity
2A — Add cityLeads filter. Find the cityCustomers useMemo block. After its closing }, [customers, city, cityInfo]);, add:
ts  const cityLeads = useMemo(() => {
    const cityId   = city;
    const cityName = cityInfo.displayName.toLowerCase();
    return leads.filter(l =>
      l.cityId === cityId ||
      l.city?.toLowerCase() === cityName
    );
  }, [leads, city, cityInfo]);
Add cityLeads: Lead[] to the CustomerContextType interface and to the Provider value.
2B — Add appendLeadActivity helper. Add to the interface and implementation:
ts  const appendLeadActivity = (leadId: string, activity: Omit<LeadActivity, "id">) => {
    const newActivity: LeadActivity = {
      ...activity,
      id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };
    updateLead(leadId, {
      timeline: [...(leads.find(l => l.leadId === leadId)?.timeline || []), newActivity],
      lastContactedAt: new Date().toISOString(),
    });
  };
Add appendLeadActivity to the context interface and provider value.

CHANGE 3 — All 5 action panels — persist data to lead record
src/app/components/crm/actions/LogCallPanel.tsx:
Add imports:
tsimport { useCustomers } from "../../../contexts/CustomerContext";
Inside the component, add:
ts  const { appendLeadActivity, updateLead } = useCustomers();
In handleSave, after the toast.success call, add:
ts    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "call",
      description: `Call ${callOutcome === "connected" ? "connected" : "not connected"}. ${callNotes}`,
      performedBy: currentUser?.name || "TSE",
      outcome: callOutcome,
      nextAction: followUpAction,
    });
    if (temperature) {
      updateLead(leadId, { temperature, lastContactedAt: new Date().toISOString() });
    }
src/app/components/crm/actions/SetFollowUpPanel.tsx:
Add useCustomers import and call. In the submit handler, after toast.success:
ts    updateLead(leadId, {
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
src/app/components/crm/actions/ScheduleDemoPanel.tsx:
Add useCustomers import. In the submit handler, after toast.success:
ts    updateLead(leadId, {
      stage: "demo_scheduled",
      followUpDate: demoDate,
    });
    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "demo_scheduled",
      description: `Demo scheduled for ${new Date(demoDate).toLocaleDateString("en-IN")} at ${demoTimeSlot}`,
      performedBy: currentUser?.name || "TSE",
      metadata: { demoDate, demoTimeSlot, address: demoAddress },
    });
    // Sync to CustomerContext status
    const customer = customers.find(c => c.customerId === leadId);
    if (customer) {
      updateCustomer(leadId, { status: "Demo Scheduled" });
    }
src/app/components/crm/actions/SendMessagePanel.tsx:
Add useCustomers import. In the submit handler, after toast.success:
ts    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "whatsapp",
      description: `WhatsApp sent: "${templateName}" template`,
      performedBy: currentUser?.name || "TSE",
      metadata: { templateName, channel: "whatsapp" },
    });
src/app/components/crm/actions/SendPlanPricePanel.tsx:
Add useCustomers import. In the submit handler, after toast.success:
ts    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "price_sent",
      description: `Plan pricing sent: ${selectedPlan}`,
      performedBy: currentUser?.name || "TSE",
      metadata: { plan: selectedPlan, price: planPrice },
    });
Each action panel receives leadId as a prop. If it currently doesn't, add it to the props interface: leadId: string.

CHANGE 4 — src/app/components/crm/LeadPipelineKanban.tsx — Add stage persistence
4A — Fix assignedTo hardcode. Find:
ts          assignedTo: "Priya Sharma",
Replace with:
ts          assignedTo: customer.assignedTo || "Unassigned",
4B — Add handleStageChange function inside the component:
ts  const handleStageChange = (leadId: string, newStage: LeadStage) => {
    // Map stage to customer status
    const statusMap: Partial<Record<LeadStage, Customer["status"]>> = {
      demo_scheduled: "Demo Scheduled",
      converted: "Active",
      lost: "Inactive",
    };
    const newStatus = statusMap[newStage];

    // Update customer status if it maps to a Customer status
    if (newStatus) {
      updateCustomer(leadId, { status: newStatus });
    }

    // Persist stage to lead record (for intermediate stages)
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      updateLead(leadId, { stage: newStage });
      appendLeadActivity(leadId, {
        timestamp: new Date().toISOString(),
        type: "stage_change",
        description: `Stage changed to ${newStage.replace(/_/g, " ")}`,
        performedBy: currentUser?.name || "TSE",
        metadata: { from: lead.stage, to: newStage },
      });
    }
  };
4C — Wire up drag-and-drop by adding onDrop handlers to each Kanban column. Find the column render. Add to the column container div:
tsx  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    e.preventDefault();
    const draggedLeadId = e.dataTransfer.getData("leadId");
    if (draggedLeadId) handleStageChange(draggedLeadId, stage);
  }}
Add to each lead card:
tsx  draggable
  onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
Add updateLead and appendLeadActivity to the useCustomers() destructure.
Do not change any other file in Phase 1.