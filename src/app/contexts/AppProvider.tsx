/**
 * AppProvider - Root provider that wraps ALL global contexts
 * This is the SINGLE point where all shared state is initialized
 *
 * PHASE 4: Modular domain-based architecture
 * - Replaced monolithic HRDataContext with domain contexts
 * - Each domain owns its data (Employee, Payroll, Incentive, Attendance, Org)
 *
 * PHASE 5: Business rules configuration layer added
 *
 * USAGE: Wrap your entire app with this provider in main.tsx or App.tsx
 */

import { ReactNode } from "react";
import { RoleProvider } from "./RoleContext";
import { CityProvider } from "./CityContext";
import { CustomRoleProvider } from "./CustomRoleContext";
import { CustomerProvider } from "./CustomerContext";
import { CustomerSubscriptionProvider } from "./CustomerSubscriptionContext";
import { PlanDefinitionProvider } from "./PlanDefinitionContext";
import { JobProvider } from "./JobContext";

// PHASE 4: Domain-specific contexts
import { OrgProvider } from "./OrgContext";
import { EmployeeProvider } from "./EmployeeContext";
import { AttendanceProvider } from "./AttendanceContext";
import { ShiftProvider } from "./ShiftContext"; // MC-10: Shift Management
import { PayrollProvider } from "./PayrollContext";
import { IncentiveProvider } from "./IncentiveContext";
import { HRDataProvider } from "./HRDataContext"; // Legacy: Still used by UserManagement

// Business rules configuration
import { BusinessRulesProvider } from "./BusinessRulesContext";

import { InventoryProvider } from "./InventoryContext";
import { FinanceProvider } from "./FinanceContext";
import { EventSystemProvider } from "./EventSystem";
import { WasherProvider } from "./WasherContext";
import { SupervisorProvider } from "./SupervisorContext";
import { DemoProvider } from "./DemoContext";
import { ApprovalProvider } from "./ApprovalContext";
import { SidebarProvider } from "./SidebarContext";
import { ScenarioProvider } from "./ScenarioContext";

// Inline stubs - no-op components to avoid missing file errors
const SyncInitializer = () => null;
const MigrationInitializer = () => null;



interface AppProviderProps {
  children: ReactNode;
}

/**
 * Global context provider tree
 * Order matters: Inner contexts can use outer contexts
 *
 * PHASE 4: Domain-based architecture
 * Each domain context owns its data - true single source of truth per domain
 *
 * PROVIDER ORDER (Top to Bottom):
 * 1. EventSystemProvider: Cross-module event bus (no dependencies)
 * 2. BusinessRulesProvider: Business configuration (salaries, targets, limits)
 * 3. OrgProvider: Organizational structure (roles, departments, holidays)
 * 4. RoleProvider: Global role/user state (no context dependencies)
 * 5. CityProvider: City selection and multi-city isolation (depends on RoleProvider)
 * 6. HRDataProvider: Legacy HR data
 * 7. EmployeeProvider: Employee core data (depends on CityProvider)
 * 8. AttendanceProvider: Attendance records and tracking
 * 9. ShiftProvider: Shift management
 * 10. PayrollProvider: Payroll runs and salary structures
 * 11. IncentiveProvider: Incentive plans and calculations
 * 12. CustomRoleProvider: Custom roles and permission overrides (depends on CityProvider)
 * 13. PlanDefinitionProvider: Plan templates and pricing definitions
 * 14. DemoProvider: Demo mode state
 * 15. ScenarioProvider: Scenario management
 * 16. CustomerProvider: Customer/Lead data
 * 17. CustomerSubscriptionProvider: Customer subscription instances (depends on CityProvider)
 * 18. JobProvider: Job pipeline (unassigned/assigned/completed)
 * 19. InventoryProvider: 3-level stock management
 * 20. FinanceProvider: MRR/Payables/Revenue
 * 21. ApprovalProvider: Centralized approval workflows
 * 22. WasherProvider: Washer-specific state (check-in, job execution)
 * 23. SupervisorProvider: Supervisor-specific state (team, audits)
 * 24. SidebarProvider: Sidebar UI state
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <EventSystemProvider>
      <BusinessRulesProvider>
        <OrgProvider>
          <RoleProvider>
            <CityProvider>
              <HRDataProvider>
                <EmployeeProvider>
                  <AttendanceProvider>
                    <ShiftProvider>
                      <PayrollProvider>
                        <IncentiveProvider>
                          <CustomRoleProvider>
                            <PlanDefinitionProvider>
                              <DemoProvider>
                                <ScenarioProvider>
                                  <CustomerProvider>
                                    <CustomerSubscriptionProvider>
                                      <JobProvider>
                                        <InventoryProvider>
                                          <FinanceProvider>
                                            <ApprovalProvider>
                                              <WasherProvider>
                                                <SupervisorProvider>
                                                  <SidebarProvider>
                                                    <MigrationInitializer />
                                                    <SyncInitializer />
                                                    {children}
                                                  </SidebarProvider>
                                                </SupervisorProvider>
                                              </WasherProvider>
                                            </ApprovalProvider>
                                          </FinanceProvider>
                                        </InventoryProvider>
                                      </JobProvider>
                                    </CustomerSubscriptionProvider>
                                  </CustomerProvider>
                                </ScenarioProvider>
                              </DemoProvider>
                            </PlanDefinitionProvider>
                          </CustomRoleProvider>
                        </IncentiveProvider>
                      </PayrollProvider>
                    </ShiftProvider>
                  </AttendanceProvider>
                </EmployeeProvider>
              </HRDataProvider>
            </CityProvider>
          </RoleProvider>
        </OrgProvider>
      </BusinessRulesProvider>
    </EventSystemProvider>
  );
}

/**
 * Re-export all hooks for convenience
 * SINGLE IMPORT: import { useCustomers, useJobs, ... } from "../contexts/AppProvider"
 *
 * PHASE 4: Export all domain hooks + unified useEmployeeData aggregator
 */
// Configuration hooks
export { useBusinessRules } from "./BusinessRulesContext"; // Business configuration

// Employee domain hooks
export { useEmployeeData } from "../hooks/useEmployeeData"; // Unified aggregator
export { useEmployee } from "./EmployeeContext"; // Direct employee access
export { useOrg } from "./OrgContext"; // Organizational structure
export { useAttendance } from "./AttendanceContext"; // Attendance management
export { useShift } from "./ShiftContext"; // Shift management (MC-10)
export { usePayroll } from "./PayrollContext"; // Payroll management
export { useIncentive } from "./IncentiveContext"; // Incentive management
export { useHRData } from "./HRDataContext"; // Legacy: Used by UserManagement

// Business Flow Orchestration (CRITICAL: Use this for multi-step operations)
export { useBusinessFlows } from "../hooks/useBusinessFlows";

// Feature hooks
export { useRole } from "./RoleContext";
export { useCity } from "./CityContext";
export { useCustomRoles } from "./CustomRoleContext"; // Custom roles and permission overrides
export { usePlanDefinitions } from "./PlanDefinitionContext"; // Plan templates and pricing
export { useDemos } from "./DemoContext";
export { useCustomers } from "./CustomerContext";
export { useCustomerSubscriptions } from "./CustomerSubscriptionContext"; // Customer subscription instances
export { useJobs } from "./JobContext";
export { useInventory } from "./InventoryContext";
export { useFinance } from "./FinanceContext";
export { useEvents, useEventListener } from "./EventSystem";
export { useWasher } from "./WasherContext";
export { useSupervisor } from "./SupervisorContext";
export { useApprovals } from "./ApprovalContext";
export { useSidebar } from "./SidebarContext";
export { useScenario } from "./ScenarioContext";

/**
 * Re-export all types
 * PHASE 4: Export types from domain contexts
 */
// Configuration types
export type {
  BusinessRules,
  ClusterManagerRules,
  OperationsManagerRules,
  CustomerCareRules
} from "./BusinessRulesContext";

// Employee domain
export type { Employee, EmployeeStatus } from "./EmployeeContext";
export type { EmployeeRole } from "./OrgContext";
export type { AttendanceRecord } from "./AttendanceContext";
export type { PayrollRun, SalaryStructure } from "./PayrollContext";
export type { IncentivePlan, EmployeeIncentive } from "./IncentiveContext";
export type { EnrichedEmployee } from "../hooks/useEmployeeData";

// Other domains
export type { Customer } from "./CustomerContext";
export type { CustomerSubscription } from "./CustomerSubscriptionContext"; // Customer subscription instances
export type { Job } from "./JobContext";
export type { InventoryItem, StockTransaction } from "./InventoryContext";
export type { MRRData, Payable, Revenue, LedgerEntry } from "./FinanceContext";
export type { SystemEvent, SystemEventType } from "./EventSystem";
