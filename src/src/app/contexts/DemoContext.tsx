/**
 * Demo Context - Shared state for demo wash management
 * Enhanced with comprehensive demo workflow including demo types, deadlines, and visibility rules
 *
 * CRITICAL: Demo completion delegated to service via useBusinessActions hook
 * Version: 2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef} from "react";
import { DataService } from "../services/DataService";
// mockData removed — DemoContext now uses DataService

export type DemoType = "One-Time Service Demo" | "Subscription Package Demo";
export type AssignmentStatus = "Pending" | "Assigned" | "Acknowledged by Washer" | "In Progress" | "Completed" | "Escalated" | "Declined by Washer" | "Cancelled";
export type AcknowledgmentStatus = "Pending" | "Accepted" | "Declined";

export type DemoWash = {
  id: string;
  leadId: string;
  
  // Customer Details
  customerName: string;
  customerFirstName: string; // For washer/supervisor visibility
  mobile: string;
  email?: string;
  
  // Address
  addressLine1: string;
  area: string;
  city: string;
  pinCode: string;
  
  // Vehicle Details
  vehicleCategory: string;
  vehicleColor?: string;
  vehicleRegistrationNumber: string;
  
  // Demo Details
  demoType: DemoType;
  demoDate: string;
  demoTimeSlot: string;
  specificTimePreference?: string;
  
  // Plan Details
  planName: string;
  planPrice?: number; // Only visible to TSE/TL/OM
  planOfInterest: string;
  
  // Special Instructions
  specialInstructions?: string;
  
  // TSE Scheduling
  tseScheduled: boolean;
  tseScheduledBy: string;
  tseScheduledAt: string;
  
  // Supervisor Assignment
  assignedSupervisor: string;
  assignedSupervisorZone?: string;
  supervisorDemosOnDate?: number; // Count of demos already assigned
  
  // Washer Assignment
  washerAssigned: boolean;
  washerName: string | null;
  washerAssignedAt: string | null;
  washerAssignedBy: string | null;
  
  // Assignment Deadline (calculated based on demo type)
  assignmentDeadline: string;
  assignmentDeadlinePassed: boolean;
  
  // Washer Acknowledgment
  acknowledgmentStatus: AcknowledgmentStatus;
  acknowledgedAt: string | null;
  declineReason?: string;
  declineNotes?: string;
  declinedBy?: string[];
  
  // Demo Execution
  demoCompleted: boolean;
  demoCompletedAt: string | null;
  demoOutcome: string | null;
  
  // Job Execution Details (Part 4)
  jobStartedAt: string | null;
  servicesPerformed?: string[];
  servicesSkipped?: string;
  vehicleConditionBefore?: string;
  vehicleConditionAfter?: string;
  productsUsed?: string[];
  issuesEncountered?: string;
  customerPresentDuringWash: boolean;
  customerVerbalFeedback?: string;
  
  // Status Tracking
  status: string;
  assignmentStatus: AssignmentStatus;
  
  // One-time demo tracking
  isPreviousDemo: boolean;
  tlApprovalRequired: boolean;
  tlApprovalStatus?: "Pending" | "Approved" | "Rejected";
  tlApprovalReason?: string;
  
  // Notifications & Timeline
  notificationsSent: string[];
  timelineEntries: Array<{
    timestamp: string;
    actor: string;
    action: string;
  }>;
};

interface DemoContextType {
  demos: DemoWash[];
  addDemo: (demo: DemoWash) => void;
  updateDemo: (id: string, updates: Partial<DemoWash>) => void;
  assignWasher: (id: string, washerName: string, assignedBy?: string) => void;
  acknowledgeDemo: (id: string, status: "Accepted" | "Declined", reason?: string, notes?: string) => void;
  startDemo: (id: string) => void;
  completeDemo: (id: string, outcome: string, reportData?: Partial<DemoWash>) => void;
  checkPreviousDemos: (phoneNumber: string) => DemoWash[];
  requestTLApproval: (id: string) => void;
  approveTLRequest: (id: string, approved: boolean, reason?: string) => void;
  rescheduleDemo: (id: string, newDate: string, newTimeSlot: string, newSupervisor: string, rescheduleReason: string) => void;
  cancelDemo: (id: string, cancellationReason: string, cancelledBy: string) => void;
  cancelWasherAssignment: (id: string, washerName: string, cancellationReason: string, notes: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Ensure the provider is exported and used correctly
export function DemoProvider({ children }: { children: ReactNode }) {
  const _dbDemosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [demos, setDemos] = useState<DemoWash[]>(() => {
    const stored = DataService.get<DemoWash>("DEMOS");
    return stored.length > 0 ? stored : [];
  });

  // Persist demos to DataService on every change
  useEffect(() => {
    if (_dbDemosTimer.current) clearTimeout(_dbDemosTimer.current);
    _dbDemosTimer.current = setTimeout(() => DataService.setAll("DEMOS", demos), 500);
  }, [demos]);

  // Log to verify provider is mounting
  console.log("DemoProvider mounted with", demos.length, "demos");

  const addDemo = (demo: DemoWash) => {
    setDemos(prev => [demo, ...prev]);
  };

  const updateDemo = (id: string, updates: Partial<DemoWash>) => {
    setDemos(prev => prev.map(demo => 
      demo.id === id ? { ...demo, ...updates } : demo
    ));
  };

  const assignWasher = (id: string, washerName: string, assignedBy?: string) => {
    setDemos(prev => prev.map(demo => 
      demo.id === id 
        ? {
            ...demo,
            washerAssigned: true,
            washerName,
            washerAssignedBy: assignedBy,
            washerAssignedAt: new Date().toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            }),
            assignmentStatus: 'Assigned' as AssignmentStatus,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: assignedBy || 'Supervisor',
                action: `Washer ${washerName} assigned`
              }
            ]
          }
        : demo
    ));
  };

  const acknowledgeDemo = (id: string, status: "Accepted" | "Declined", reason?: string, notes?: string) => {
    setDemos(prev => prev.map(demo => {
      if (demo.id === id) {
        const newDemo = {
          ...demo,
          acknowledgmentStatus: status as AcknowledgmentStatus,
          acknowledgedAt: new Date().toISOString(),
          assignmentStatus: status === "Accepted" ? 'Acknowledged by Washer' as AssignmentStatus : 'Declined by Washer' as AssignmentStatus,
          timelineEntries: [
            ...demo.timelineEntries,
            {
              timestamp: new Date().toISOString(),
              actor: demo.washerName || 'Washer',
              action: status === "Accepted" 
                ? 'Demo acknowledged and accepted' 
                : `Demo declined - ${reason}`
            }
          ]
        };
        
        if (status === "Declined") {
          newDemo.declineReason = reason;
          newDemo.declineNotes = notes;
          newDemo.declinedBy = [...(demo.declinedBy || []), demo.washerName || ''];
          newDemo.washerAssigned = false;
          newDemo.washerName = null;
          newDemo.assignmentStatus = 'Pending' as AssignmentStatus;
        }
        
        return newDemo;
      }
      return demo;
    }));
  };

  const startDemo = (id: string) => {
    setDemos(prev => prev.map(demo =>
      demo.id === id
        ? {
            ...demo,
            jobStartedAt: new Date().toISOString(),
            assignmentStatus: 'In Progress' as AssignmentStatus,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: demo.washerName || 'Washer',
                action: 'Demo started'
              }
            ]
          }
        : demo
    ));
  };

  const completeDemo = (id: string, outcome: string, reportData?: Partial<DemoWash>) => {
    setDemos(prev => prev.map(demo =>
      demo.id === id
        ? {
            ...demo,
            demoCompleted: true,
            demoCompletedAt: new Date().toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            }),
            demoOutcome: outcome,
            assignmentStatus: 'Completed' as AssignmentStatus,
            status: outcome.includes('Converted') ? 'Completed & Converted' : 'Completed - No Conversion',
            ...reportData,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: demo.washerName || 'Washer',
                action: `Demo completed - ${outcome}`
              }
            ]
          }
        : demo
    ));
  };

  const checkPreviousDemos = (phoneNumber: string): DemoWash[] => {
    return demos.filter(demo => demo.mobile === phoneNumber && demo.demoCompleted);
  };

  const requestTLApproval = (id: string) => {
    setDemos(prev => prev.map(demo =>
      demo.id === id
        ? {
            ...demo,
            tlApprovalRequired: true,
            tlApprovalStatus: 'Pending' as const,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: demo.tseScheduledBy,
                action: 'TL approval requested for second demo'
              }
            ]
          }
        : demo
    ));
  };

  const approveTLRequest = (id: string, approved: boolean, reason?: string) => {
    setDemos(prev => prev.map(demo =>
      demo.id === id
        ? {
            ...demo,
            tlApprovalStatus: approved ? 'Approved' as const : 'Rejected' as const,
            tlApprovalReason: reason,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: 'Team Lead',
                action: approved ? 'Second demo approved' : `Second demo rejected - ${reason}`
              }
            ]
          }
        : demo
    ));
  };

  const rescheduleDemo = (id: string, newDate: string, newTimeSlot: string, newSupervisor: string, rescheduleReason: string) => {
    setDemos(prev => prev.map(demo =>
      demo.id === id
        ? {
            ...demo,
            demoDate: newDate,
            demoTimeSlot: newTimeSlot,
            assignedSupervisor: newSupervisor,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: 'Supervisor',
                action: `Demo rescheduled - New Date: ${newDate}, New Time Slot: ${newTimeSlot}, New Supervisor: ${newSupervisor}, Reason: ${rescheduleReason}`
              }
            ]
          }
        : demo
    ));
  };

  const cancelDemo = (id: string, cancellationReason: string, cancelledBy: string) => {
    setDemos(prev => prev.map(demo =>
      demo.id === id
        ? {
            ...demo,
            assignmentStatus: 'Cancelled' as AssignmentStatus,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: cancelledBy,
                action: `Demo cancelled - Reason: ${cancellationReason}`
              }
            ]
          }
        : demo
    ));
  };

  const cancelWasherAssignment = (id: string, washerName: string, cancellationReason: string, notes: string) => {
    setDemos(prev => prev.map(demo =>
      demo.id === id
        ? {
            ...demo,
            washerAssigned: false,
            washerName: null,
            assignmentStatus: 'Pending' as AssignmentStatus,
            timelineEntries: [
              ...demo.timelineEntries,
              {
                timestamp: new Date().toISOString(),
                actor: 'Supervisor',
                action: `Washer ${washerName} assignment cancelled - Reason: ${cancellationReason}, Notes: ${notes}`
              }
            ]
          }
        : demo
    ));
  };

  const contextValue = useMemo(() => ({
      demos,
      addDemo,
      updateDemo,
      assignWasher,
      acknowledgeDemo,
      startDemo,
      completeDemo,
      checkPreviousDemos,
      requestTLApproval,
      approveTLRequest,
      rescheduleDemo,
      cancelDemo,
      cancelWasherAssignment
    }),
  [demos, addDemo, updateDemo, assignWasher, acknowledgeDemo, startDemo, completeDemo, checkPreviousDemos, requestTLApproval, approveTLRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DemoContext.Provider value={contextValue}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemos() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    console.error("useDemos hook called outside DemoProvider. Make sure the component is wrapped in DemoProvider.");
    console.warn("[useDemos] outside DemoProvider - fallback"); return context as any;
  }
  return context;
}