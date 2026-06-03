import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle, Circle, Calculator, ClipboardCheck, Award } from "lucide-react";
import { PayrollCalculationDashboard } from "./PayrollCalculationDashboard";
import { PayrollReviewScreen } from "./PayrollReviewScreen";
import { PayrollApprovalWorkflow } from "./PayrollApprovalWorkflow";

type ProcessingStep = "calculation" | "review" | "approval";

export function PayrollProcessingFlow() {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("calculation");

  const steps = [
    { id: "calculation", label: "Calculation", icon: Calculator, component: PayrollCalculationDashboard },
    { id: "review", label: "Review", icon: ClipboardCheck, component: PayrollReviewScreen },
    { id: "approval", label: "Approval", icon: CheckCircle, component: PayrollApprovalWorkflow },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const CurrentComponent = steps[currentStepIndex].component;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isClickable = index <= currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    onClick={() => isClickable && setCurrentStep(step.id as ProcessingStep)}
                    className={`flex items-center gap-3 ${
                      isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`font-semibold ${
                          isActive ? "text-blue-900" : isCompleted ? "text-green-900" : "text-gray-600"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-500">Step {index + 1} of {steps.length}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={`h-1 rounded transition-colors ${
                          index < currentStepIndex ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="mt-6">
        <CurrentComponent />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStepIndex > 0) {
              setCurrentStep(steps[currentStepIndex - 1].id as ProcessingStep);
            }
          }}
          disabled={currentStepIndex === 0}
        >
          Previous Step
        </Button>
        <Button
          onClick={() => {
            if (currentStepIndex < steps.length - 1) {
              setCurrentStep(steps[currentStepIndex + 1].id as ProcessingStep);
            }
          }}
          disabled={currentStepIndex === steps.length - 1}
        >
          {currentStepIndex === steps.length - 1 ? "Complete" : "Next Step"}
        </Button>
      </div>
    </div>
  );
}
