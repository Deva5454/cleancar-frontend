/**
 * SCREEN 4: ACTIVE WASH SCREEN
 * Step-by-step job execution with checklist, consumables, and cloth tracking
 * Design Principle: One task at a time, sequential execution, mandatory completion
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  CheckCircle,
  Circle,
  Camera,
  Package as PackageIcon,
  Clock,
  AlertCircle,
  ChevronRight,
  Shirt,
} from "lucide-react";

export interface WashStep {
  id: string;
  name: string;
  isCompleted: boolean;
  isActive: boolean;
  requiresPhoto: boolean;
  photoTaken: boolean;
}

export interface ConsumableItem {
  name: string;
  quantity: string;
  isUsed: boolean;
}

export interface ActiveJobDetails {
  registrationNumber: string;
  ownerName: string;
  vehicleType: string;
  packageName: string;
  location: string;
}

export interface WasherActiveWashProps {
  job: ActiveJobDetails;
  steps: WashStep[];
  consumables: ConsumableItem[];
  clothBatchNumber?: string;
  
  // Timer
  startTime: Date;
  elapsedMinutes: number;
  
  // Actions
  onCompleteStep: (stepId: string) => void;
  onTakePhoto: (stepId: string) => void;
  onMarkConsumableUsed: (consumableName: string) => void;
  onMarkJobDone: () => void;
  
  // State
  canMarkDone: boolean;
}

export function WasherActiveWash({
  job,
  steps,
  consumables,
  clothBatchNumber,
  startTime,
  elapsedMinutes,
  onCompleteStep,
  onTakePhoto,
  onMarkConsumableUsed,
  onMarkJobDone,
  canMarkDone,
}: WasherActiveWashProps) {
  const completedSteps = steps.filter(s => s.isCompleted).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  const activeStep = steps.find(s => s.isActive);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{job.registrationNumber}</h1>
            <p className="text-green-100 text-sm">{job.ownerName}</p>
          </div>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            {job.packageName}
          </Badge>
        </div>

        {/* Vehicle & Location */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-green-100 text-xs">Vehicle Type</p>
              <p className="font-semibold">{job.vehicleType}</p>
            </div>
            <div>
              <p className="text-green-100 text-xs">Location</p>
              <p className="font-semibold truncate">{job.location}</p>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-100" />
            <div>
              <p className="text-xs text-green-100">Elapsed Time</p>
              <p className="text-xl font-bold">{elapsedMinutes} min</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-100">Started</p>
            <p className="text-sm font-semibold">
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Progress Card */}
        <Card className="border-2 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">Progress</p>
              <p className="text-sm font-bold text-green-600">
                {completedSteps} / {totalSteps} steps
              </p>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-right mt-1">
              {Math.round(progressPercentage)}% Complete
            </p>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Wash Checklist</CardTitle>
            <p className="text-xs text-gray-600">Complete steps in order</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((step, index) => {
              const isNextStep = !step.isCompleted && !step.isActive && 
                (index === 0 || steps[index - 1].isCompleted);

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border-2 ${
                    step.isCompleted ? 'bg-green-50 border-green-300' :
                    step.isActive ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' :
                    isNextStep ? 'bg-white border-gray-300' :
                    'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Step Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {step.isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className={`h-6 w-6 ${
                          step.isActive ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-semibold ${
                          step.isCompleted ? 'text-green-900' :
                          step.isActive ? 'text-blue-900' :
                          'text-gray-700'
                        }`}>
                          {step.name}
                        </p>
                        {step.isActive && (
                          <Badge className="bg-blue-600 text-white text-xs">
                            Active
                          </Badge>
                        )}
                      </div>

                      {/* Photo Requirement */}
                      {step.requiresPhoto && (
                        <div className="mt-2 flex items-center gap-2">
                          {step.photoTaken ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Photo captured
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => onTakePhoto(step.id)}
                              disabled={!step.isActive}
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                            >
                              <Camera className="h-3 w-3 mr-1" />
                              Take Photo
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Complete Button */}
                      {step.isActive && (
                        <Button
                          onClick={() => onCompleteStep(step.id)}
                          disabled={step.requiresPhoto && !step.photoTaken}
                          className="w-full mt-2 h-10 bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Step
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Consumables Reminder */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageIcon className="h-5 w-5 text-purple-600" />
              Consumables Used
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {consumables.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.quantity}</p>
                </div>
                <Button
                  onClick={() => onMarkConsumableUsed(item.name)}
                  disabled={item.isUsed}
                  size="sm"
                  variant={item.isUsed ? "outline" : "default"}
                  className={item.isUsed ? "bg-green-50 text-green-700 border-green-300" : ""}
                >
                  {item.isUsed ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Used
                    </>
                  ) : (
                    "Mark Used"
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cloth Batch Number */}
        {clothBatchNumber && (
          <Card className="border-2 border-teal-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Shirt className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Cloth Batch Number</p>
                  <p className="font-bold text-gray-900">{clothBatchNumber}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mark Done Button */}
        <Button
          onClick={onMarkJobDone}
          disabled={!canMarkDone}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50"
        >
          {canMarkDone ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Mark Job Done
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 mr-2" />
              Complete all steps first
            </>
          )}
        </Button>

        {!canMarkDone && (
          <p className="text-xs text-center text-gray-600">
            Finish all checklist steps to mark job as done
          </p>
        )}
      </div>
    </div>
  );
}
