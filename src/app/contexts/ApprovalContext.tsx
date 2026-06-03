import { employeeDatabaseService } from "../services/employeeDatabaseService";
/**
 * ApprovalContext - Centralized approval workflow management
 * Handles approvals across all modules: HR, Finance, Operations, Inventory
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo} from "react";
import { useEvents } from "./EventSystem";
import { useEmployeeData } from "../hooks/useEmployeeData";
// REMOVED: circular import useFinance from FinanceContext
import { useInventory } from "./InventoryContext";

export type ApprovalType =
  | "Cash Collection"
  | "Audit Approval"
  | "Vendor Payment"
  | "Leave Request - Manager"
  | "Leave Request - HR"
  | "Adhoc Payment"
  | "Payroll"
  | "Marketing Expense"
  | "Material Requisition"
  | "Purchase Request"
  | "Exit Settlement - HR"
  | "Exit Settlement - Finance"
  | "Onboarding Document Verification"
  | "Mobile Number Change";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface Approval {
  id: string;
  type: ApprovalType;
  requester: string;
  amount?: number;
  description: string;
  date: string;
  status: ApprovalStatus;
  approver?: string;
  approvedAt?: string;
  priority: "High" | "Medium" | "Low";
  relatedId?: string; // ID from related module (e.g., payrollRunId, employeeId, etc.)
}

// Define approval permissions mapping
export const approvalPermissions: Record<ApprovalType, string[]> = {
  "Cash Collection": ["Accounts", "Super Admin", "Admin"],
  "Audit Approval": ["Operations Manager", "Sr Operations Manager", "Super Admin", "Admin"],
  "Vendor Payment": ["Super Admin", "Admin"],
  "Leave Request - Manager": ["Supervisor", "Operations Manager", "Sr Operations Manager", "TSM", "City Manager", "Super Admin", "Admin"],
  "Leave Request - HR": ["HR", "Super Admin", "Admin"],
  "Adhoc Payment": ["Supervisor", "Operations Manager", "Super Admin", "Admin"],
  "Payroll": ["Accounts", "Super Admin", "Admin"],
  "Marketing Expense": ["City Manager", "Super Admin", "Admin"],
  "Material Requisition": ["Store Manager", "Procurement Manager", "Super Admin", "Admin"],
  "Purchase Request": ["Super Admin", "Admin"],
  "Exit Settlement - HR": ["HR", "Super Admin", "Admin"],
  "Exit Settlement - Finance": ["Accounts", "Super Admin", "Admin"],
  "Onboarding Document Verification": ["HR", "Super Admin", "Admin"],
  "Mobile Number Change": ["City Manager", "Super Admin", "Admin"],
};

interface ApprovalContextType {
  approvals: Approval[];
  addApproval: (approval: Omit<Approval, "id" | "status" | "date">) => void;
  approveApproval: (id: string, approver: string) => void;
  rejectApproval: (id: string, approver: string, reason?: string) => void;
  getApprovalsByType: (type: ApprovalType) => Approval[];
  getApprovalsByStatus: (status: ApprovalStatus) => Approval[];
  getPendingCount: () => number;
  canApprove: (type: ApprovalType, userRole: string) => boolean;
}

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const { emit } = useEvents();
  // PHASE 3: Using useEmployeeData (single source of truth)
  const { payrollRuns } = useEmployeeData();
  const payables: any[] = []; // useFinance removed — payables not needed here

  // Generate approvals from various modules on mount
  useEffect(() => {
    const generatedApprovals: Approval[] = [];

    // Payroll approvals
    payrollRuns.forEach((run, index) => {
      if (run.status === "Draft" || run.status === "Pending Approval") {
        generatedApprovals.push({
          id: `APR-PAY-${run.id}`,
          type: "Payroll",
          requester: "HR Department",
          amount: run.totalAmount,
          description: `Payroll for ${run.month} - ${run.employeeCount} employees`,
          date: run.processedDate,
          status: "Pending",
          priority: "High",
          relatedId: run.id,
        });
      }
    });

    // Vendor payment approvals
    payables
      .filter(p => p.status === "Pending")
      .forEach((payable, index) => {
        generatedApprovals.push({
          id: `APR-VEN-${payable.id}`,
          type: "Vendor Payment",
          requester: "Procurement",
          amount: payable.amount,
          description: `Payment to ${payable.vendor} - ${payable.category}`,
          date: payable.dueDate,
          status: "Pending",
          priority: payable.priority === "High" ? "High" : "Medium",
          relatedId: payable.id,
        });
      });

    setApprovals(generatedApprovals);
  }, [payrollRuns, payables]);

  const addApproval = useCallback((approval: Omit<Approval, "id" | "status" | "date">) => {
    const newApproval: Approval = {
      ...approval,
      id: `APR-${Date.now()}`,
      status: "Pending",
      date: new Date().toISOString(),
    };

    setApprovals(prev => [newApproval, ...prev]);
    emit("PAYMENT_RECEIVED", { approvalId: newApproval.id, type: approval.type }, "ApprovalSystem");
  }, [emit]);

  const approveApproval = useCallback((id: string, approver: string) => {
    setApprovals(prev =>
      prev.map(approval =>
        approval.id === id
          ? {
              ...approval,
              status: "Approved" as ApprovalStatus,
              approver,
              approvedAt: new Date().toISOString(),
            }
          : approval
      )
    );

    const approval = approvals.find(a => a.id === id);
    if (approval) {
      emit("PAYROLL_APPROVED", { approvalId: id, type: approval.type, approver }, "ApprovalSystem");

      // Handle Mobile Number Change approval
      if (approval.type === "Mobile Number Change") {
        // Extract new mobile from the description field
        const match = approval.description.match(/New: (\d{10})/);
        const newMobile = match ? match[1] : null;
        const employeeId = approval.relatedId;

        if (newMobile && employeeId) {
          employeeDatabaseService.update(employeeId, {
            loginMobile: newMobile,
            mobile: newMobile,
          });
          // In production: send WhatsApp to both old and new number confirming the change
          console.log(`[Approval] Mobile updated for ${employeeId} to ${newMobile}`);
        }
      }
    }
  }, [approvals, emit]);

  const rejectApproval = useCallback((id: string, approver: string, reason?: string) => {
    setApprovals(prev =>
      prev.map(approval =>
        approval.id === id
          ? {
              ...approval,
              status: "Rejected" as ApprovalStatus,
              approver,
              approvedAt: new Date().toISOString(),
            }
          : approval
      )
    );

    const approval = approvals.find(a => a.id === id);
    if (approval) {
      emit("PAYROLL_APPROVED", { approvalId: id, type: approval.type, approver, rejected: true, reason }, "ApprovalSystem");
    }
  }, [approvals, emit]);

  const getApprovalsByType = useCallback((type: ApprovalType) => {
    return approvals.filter(a => a.type === type);
  }, [approvals]);

  const getApprovalsByStatus = useCallback((status: ApprovalStatus) => {
    return approvals.filter(a => a.status === status);
  }, [approvals]);

  const getPendingCount = useCallback(() => {
    return approvals.filter(a => a.status === "Pending").length;
  }, [approvals]);

  const canApprove = useCallback((type: ApprovalType, userRole: string) => {
    const allowedRoles = approvalPermissions[type] || [];
    return allowedRoles.includes(userRole);
  }, []);

  const contextValue = useMemo(() => ({
        approvals,
        addApproval,
        approveApproval,
        rejectApproval,
        getApprovalsByType,
        getApprovalsByStatus,
        getPendingCount,
        canApprove,
      }),
  [approvals, addApproval, approveApproval, rejectApproval, getApprovalsByType, getApprovalsByStatus, getPendingCount, canApprove]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ApprovalContext.Provider
      value={contextValue}
    >
      {children}
    </ApprovalContext.Provider>
  );
}

export function useApprovals() {
  const context = useContext(ApprovalContext);
  if (!context) {
    console.warn("[useApprovals] Called outside ApprovalProvider — returning fallback"); return context as any;
  }
  return context;
}
