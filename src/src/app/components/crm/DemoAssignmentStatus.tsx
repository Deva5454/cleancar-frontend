/**
 * Demo Assignment Status Stepper
 * Shows 3-step workflow: TSE Scheduled → Supervisor Assigned Washer → Demo Completed
 */

import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface DemoAssignment {
  tseScheduled: boolean;
  tseScheduledAt?: string;
  tseScheduledBy?: string;
  demoDate?: string;
  demoTimeSlot?: string;
  assignedSupervisor?: string;
  
  washerAssigned: boolean;
  washerAssignedAt?: string;
  washerName?: string;
  
  demoCompleted: boolean;
  demoCompletedAt?: string;
  demoOutcome?: string;
}

interface DemoAssignmentStatusProps {
  assignment: DemoAssignment;
}

export function DemoAssignmentStatus({ assignment }: DemoAssignmentStatusProps) {
  const steps = [
    {
      id: 1,
      title: "TSE Scheduled Demo",
      completed: assignment.tseScheduled,
      details: assignment.tseScheduled 
        ? `${assignment.demoDate} ${assignment.demoTimeSlot} • ${assignment.assignedSupervisor}`
        : "Pending scheduling"
    },
    {
      id: 2,
      title: "Supervisor Assigned Washer",
      completed: assignment.washerAssigned,
      details: assignment.washerAssigned
        ? `${assignment.washerName} • ${assignment.washerAssignedAt}`
        : "Pending washer assignment"
    },
    {
      id: 3,
      title: "Demo Completed",
      completed: assignment.demoCompleted,
      details: assignment.demoCompleted
        ? `${assignment.demoOutcome} • ${assignment.demoCompletedAt}`
        : "Pending completion"
    }
  ];

  return (
    <div className="bg-white border-2 border-teal-200 rounded-lg p-4">
      <h3 className="font-semibold text-sm text-gray-700 mb-4">Demo Assignment Status</h3>
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-teal-500 transition-all duration-500"
            style={{ 
              width: `${((steps.filter(s => s.completed).length - 1) / (steps.length - 1)) * 100}%` 
            }}
          />
        </div>

        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1 relative">
            {/* Step Circle */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 bg-white
              ${step.completed 
                ? 'border-teal-500 bg-teal-500' 
                : 'border-gray-300'
              }
            `}>
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Step Info */}
            <div className="text-center">
              <p className={`text-xs font-medium ${step.completed ? 'text-teal-700' : 'text-gray-500'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-[120px]">
                {step.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
