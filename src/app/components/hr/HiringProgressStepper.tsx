/**
 * Hiring Progress Stepper
 * Shows an employee's real position in the hiring lifecycle:
 * Added -> Offer Sent -> Offer Accepted -> Onboarding Complete -> Permanent (Active)
 *
 * Reads live data from offerLetterService + onboardingChecklistService so it can
 * never drift out of sync with what has actually happened for this employee.
 */
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import { offerLetterService } from "../../services/offerLetterService";
import { onboardingChecklistService } from "../../services/onboardingChecklistService";

export interface HiringProgressEmployee {
  id: string;
  tempId: string;
  employmentStage: "Temporary" | "Permanent" | "Not Converted";
}

type StepState = "done" | "current" | "pending";

interface Step {
  label: string;
  state: StepState;
}

function computeSteps(employee: HiringProgressEmployee): Step[] {
  const offers = offerLetterService
    .getAll()
    .filter((o) => o.employeeTempId === employee.tempId)
    .sort((a, b) => (a.issueDate < b.issueDate ? -1 : 1));
  const latestOffer = offers[offers.length - 1];
  const offerStatus = latestOffer?.status ?? "Not Started";

  const checklistId = employee.id === "PENDING" ? employee.tempId : employee.id;
  const tasks = onboardingChecklistService.getByEmployeeId(checklistId);
  const onboardingStarted = tasks.length > 0;
  const onboardingComplete =
    onboardingStarted && tasks.every((t) => t.status === "Completed" && t.verified);

  const isPermanent = employee.employmentStage === "Permanent";

  const offerSent = offerStatus === "Sent" || offerStatus === "Accepted" || offerStatus === "Rejected";
  const offerAccepted = offerStatus === "Accepted";

  const steps: Step[] = [
    { label: "Added", state: "done" },
    { label: "Offer Sent", state: offerSent ? "done" : offerStatus === "Draft" ? "current" : "pending" },
    { label: "Offer Accepted", state: offerAccepted ? "done" : offerSent ? "current" : "pending" },
    {
      label: "Onboarding Complete",
      state: onboardingComplete ? "done" : onboardingStarted ? "current" : "pending",
    },
    { label: "Permanent / Active", state: isPermanent ? "done" : onboardingComplete ? "current" : "pending" },
  ];

  return steps;
}

export function HiringProgressStepper({ employee }: { employee: HiringProgressEmployee }) {
  const steps = computeSteps(employee);
  const outOfOrder =
    steps[3].state === "done" && steps[2].state !== "done"; // onboarding done without accepted offer on file

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center overflow-x-auto">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1 w-28">
              {step.state === "done" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              {step.state === "current" && <Clock className="w-5 h-5 text-amber-500" />}
              {step.state === "pending" && <Circle className="w-5 h-5 text-gray-300" />}
              <span
                className={
                  "text-xs text-center " +
                  (step.state === "done"
                    ? "text-green-700 font-medium"
                    : step.state === "current"
                    ? "text-amber-700 font-medium"
                    : "text-gray-400")
                }
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={
                  "h-0.5 w-8 mx-1 " + (steps[idx + 1].state !== "pending" ? "bg-green-400" : "bg-gray-200")
                }
              />
            )}
          </div>
        ))}
      </div>

      {outOfOrder && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-orange-50 border border-orange-200 p-2 text-xs text-orange-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Onboarding tasks are complete but there is no Accepted offer on file for this employee.
            Check Letters &amp; Documents &gt; Offer Letter to confirm the correct sequence was followed.
          </span>
        </div>
      )}
    </div>
  );
}

export default HiringProgressStepper;
