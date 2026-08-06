/**
 * kraDefaultKrasRegistry.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central role → suggested-KRAs lookup, so KraAuthoringModule.tsx can offer
 * HR a real dropdown of each role's confirmed KRA structure instead of a
 * blank prompt() text box. Every *_DEFAULT_KRAS constant already existed
 * per pilot file (documenting each role's confirmed weights/targets) but
 * was never actually read by any UI until now — this is the missing
 * wiring, not new KRA data.
 */

import { WASHER_ROLE, WASHER_DEFAULT_KRAS } from "./kraWasherPilot";
import { SUPERVISOR_ROLE, SUPERVISOR_DEFAULT_KRAS } from "./kraSupervisorPilot";
import { OM_ROLE, OM_DEFAULT_KRAS } from "./kraOMPilot";
import { CITY_ROLE, CITY_DEFAULT_KRAS } from "./kraCityPilot";
import { CCE_ROLE, CCE_DEFAULT_KRAS } from "./kraCCEPilot";
import { ACCOUNTS_ROLE, ACCOUNTS_DEFAULT_KRAS } from "./kraAccountsPilot";
import { STORE_ROLE, STORE_DEFAULT_KRAS } from "./kraStorePilot";
import { PROCUREMENT_ROLE, PROCUREMENT_DEFAULT_KRAS } from "./kraProcurementPilot";
import { TSE_ROLE, TSE_DEFAULT_KRAS } from "./kraTSEPilot";
import { TSM_ROLE, TSM_DEFAULT_KRAS } from "./kraTSMPilot";
import { SALES_HEAD_ROLE, SALES_HEAD_DEFAULT_KRAS } from "./kraSalesHeadPilot";
import { SALES_MANAGER_ROLE, SALES_MANAGER_DEFAULT_KRAS } from "./kraSalesManagerPilot";
import { CLUSTER_MANAGER_ROLE, CLUSTER_MANAGER_DEFAULT_KRAS } from "./kraClusterManagerPilot";
import { HR_ROLE, HR_DEFAULT_KRAS } from "./kraHRPilot";
import type { KraDefinition } from "./kraEngineService";

const REGISTRY: Record<string, KraDefinition[]> = {
  [WASHER_ROLE]: WASHER_DEFAULT_KRAS,
  [SUPERVISOR_ROLE]: SUPERVISOR_DEFAULT_KRAS,
  [OM_ROLE]: OM_DEFAULT_KRAS,
  [CITY_ROLE]: CITY_DEFAULT_KRAS,
  [CCE_ROLE]: CCE_DEFAULT_KRAS,
  [ACCOUNTS_ROLE]: ACCOUNTS_DEFAULT_KRAS,
  [STORE_ROLE]: STORE_DEFAULT_KRAS,
  [PROCUREMENT_ROLE]: PROCUREMENT_DEFAULT_KRAS,
  [TSE_ROLE]: TSE_DEFAULT_KRAS,
  [TSM_ROLE]: TSM_DEFAULT_KRAS,
  [SALES_HEAD_ROLE]: SALES_HEAD_DEFAULT_KRAS,
  [SALES_MANAGER_ROLE]: SALES_MANAGER_DEFAULT_KRAS,
  [CLUSTER_MANAGER_ROLE]: CLUSTER_MANAGER_DEFAULT_KRAS,
  [HR_ROLE]: HR_DEFAULT_KRAS,
};

/** The confirmed, suggested KRA structure for a role, if one has been defined — empty array otherwise (role has no pilot yet, HR builds from scratch). */
export function getSuggestedKrasForRole(role: string): KraDefinition[] {
  return REGISTRY[role] || [];
}
