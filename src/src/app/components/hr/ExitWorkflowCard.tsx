/**
 * Exit Workflow Card - Display exit workflow stages and progress
 *
 * Shows:
 * - Current stage
 * - Stage history
 * - Clearance items
 * - F&F settlement
 * - Lock status
 */

import React from "react";
import type { ExitWorkflow, ExitStage } from "../../services/ExitWorkflowService";

interface ExitWorkflowCardProps {
  workflow: ExitWorkflow;
  onMoveStage?: () => void;
  onUpdateClearance?: () => void;
  className?: string;
}

export function ExitWorkflowCard({
  workflow,
  onMoveStage,
  onUpdateClearance,
  className = "",
}: ExitWorkflowCardProps) {
  const stageOrder: ExitStage[] = [
    "Initiated",
    "Notice Period",
    "Clearance",
    "F&F Settlement",
    "Exited",
  ];

  const currentIndex = stageOrder.indexOf(workflow.currentStage);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Exit Workflow - {workflow.employeeName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {workflow.resignationType} • Last Working Date: {workflow.lastWorkingDate}
            </p>
          </div>
          {workflow.isLocked && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              🔒 Locked
            </span>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Stage Progress */}
        <section>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Exit Stages</h4>

          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200" />
            <div
              className="absolute left-4 top-8 w-0.5 bg-blue-600"
              style={{
                height: `${(currentIndex / (stageOrder.length - 1)) * 100}%`,
              }}
            />

            {/* Stages */}
            <div className="space-y-6">
              {stageOrder.map((stage, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const stageHistory = workflow.stageHistory.find(
                  (h) => h.stage === stage
                );

                return (
                  <div key={stage} className="relative flex items-start gap-4">
                    {/* Stage Dot */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                        isCompleted
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Stage Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <h5
                          className={`text-sm font-medium ${
                            isCompleted ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {stage}
                        </h5>
                        {isCurrent && !workflow.completedAt && (
                          <span className="text-xs font-medium text-blue-600">
                            Current
                          </span>
                        )}
                      </div>

                      {stageHistory && (
                        <div className="mt-1 text-xs text-gray-500">
                          <p>
                            Completed:{" "}
                            {new Date(stageHistory.completedAt).toLocaleDateString()}
                          </p>
                          {stageHistory.notes && (
                            <p className="mt-1 text-gray-600">{stageHistory.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Move to Next Stage Button */}
          {!workflow.completedAt && onMoveStage && (
            <button
              onClick={onMoveStage}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Move to Next Stage
            </button>
          )}
        </section>

        {/* Clearance Items */}
        {workflow.currentStage === "Clearance" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Clearance Items
              </h4>
              {onUpdateClearance && (
                <button
                  onClick={onUpdateClearance}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Update
                </button>
              )}
            </div>

            <div className="space-y-2">
              {workflow.clearanceItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-700">{item.item}</span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      item.status === "Returned"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Returned:{" "}
              {workflow.clearanceItems.filter((i) => i.status === "Returned").length}{" "}
              / {workflow.clearanceItems.filter((i) => i.status !== "Not Applicable").length}
            </div>
          </section>
        )}

        {/* F&F Settlement */}
        {workflow.settlement && (
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              F&F Settlement
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Pending Salary</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{(workflow?.settlement?.pendingSalary ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Leave Encashment</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{(workflow?.settlement?.leaveEncashment ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Bonus</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{(workflow?.settlement?.bonus ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Other Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{(workflow?.settlement?.otherPayments ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Deductions</span>
                <span className="text-sm font-medium text-red-600">
                  -₹{(workflow?.settlement?.deductions ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg">
                <span className="text-sm font-semibold text-green-900">
                  Net Settlement
                </span>
                <span className="text-lg font-bold text-green-900">
                  ₹{(workflow?.settlement?.netSettlement ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {workflow.settlement.paidDate && (
              <div className="mt-3 text-xs text-gray-500">
                Paid on: {new Date(workflow.settlement.paidDate).toLocaleDateString()}
              </div>
            )}
          </section>
        )}

        {/* Exit Details */}
        <section className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">
            Exit Details
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              <span className="font-medium">Employee ID:</span>{" "}
              {workflow.employeeId}
            </p>
            <p>
              <span className="font-medium">Initiated:</span>{" "}
              {new Date(workflow.initiatedDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">Notice Period:</span>{" "}
              {workflow.noticePeriodDays} days
            </p>
            <p>
              <span className="font-medium">Reason:</span> {workflow.exitReason}
            </p>
            <p>
              <span className="font-medium">Type:</span>{" "}
              {workflow.resignationType}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

interface ExitWorkflowListProps {
  workflows: ExitWorkflow[];
  onViewDetails?: (workflow: ExitWorkflow) => void;
  className?: string;
}

export function ExitWorkflowList({
  workflows,
  onViewDetails,
  className = "",
}: ExitWorkflowListProps) {
  if (workflows.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">No exit workflows found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {workflows.map((workflow) => (
        <div
          key={workflow.exitWorkflowId}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => onViewDetails?.(workflow)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {workflow.employeeName}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {workflow.employeeId} • {workflow.resignationType}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  workflow.completedAt
                    ? "bg-gray-100 text-gray-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {workflow.currentStage}
              </span>
              {workflow.isLocked && (
                <p className="text-xs text-red-600 mt-1">🔒 Locked</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>LWD: {workflow.lastWorkingDate}</span>
            <span>•</span>
            <span>Notice: {workflow.noticePeriodDays} days</span>
          </div>
        </div>
      ))}
    </div>
  );
}
