/**
 * kraCatalogSeeder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single, shared place to seed every role's KPI catalog entries. Real fix:
 * this used to be a list of seed*KpiCatalogIfMissing() calls duplicated
 * only inside KraScorecardHub.tsx's mount effect — so HR authoring a new
 * role's KRA (KraAuthoringModule.tsx) before ever opening the Scorecard
 * screen saw an empty catalog: KPI names rendered as raw codes
 * (e.g. "SM_TERRITORY_EXPANSION") instead of "Territory Expansion", and
 * the KPI-picker dropdown had nothing real to offer. Both screens now
 * call this one function instead of keeping two independent, driftable
 * lists.
 */

import { seedWasherKpiCatalogIfMissing } from "./kraWasherPilot";
import { seedSupervisorKpiCatalogIfMissing } from "./kraSupervisorPilot";
import { seedOMKpiCatalogIfMissing } from "./kraOMPilot";
import { seedCityKpiCatalogIfMissing } from "./kraCityPilot";
import { seedCCEKpiCatalogIfMissing } from "./kraCCEPilot";
import { seedAccountsKpiCatalogIfMissing } from "./kraAccountsPilot";
import { seedStoreKpiCatalogIfMissing } from "./kraStorePilot";
import { seedProcurementKpiCatalogIfMissing } from "./kraProcurementPilot";
import { seedTSEKpiCatalogIfMissing } from "./kraTSEPilot";
import { seedTSMKpiCatalogIfMissing } from "./kraTSMPilot";
import { seedSalesHeadKpiCatalogIfMissing } from "./kraSalesHeadPilot";
import { seedSalesManagerKpiCatalogIfMissing } from "./kraSalesManagerPilot";
import { seedClusterManagerKpiCatalogIfMissing } from "./kraClusterManagerPilot";
import { seedHRKpiCatalogIfMissing } from "./kraHRPilot";

export function seedAllKraKpiCatalogs(): void {
  seedWasherKpiCatalogIfMissing();
  seedSupervisorKpiCatalogIfMissing();
  seedOMKpiCatalogIfMissing();
  seedCityKpiCatalogIfMissing();
  seedCCEKpiCatalogIfMissing();
  seedAccountsKpiCatalogIfMissing();
  seedStoreKpiCatalogIfMissing();
  seedProcurementKpiCatalogIfMissing();
  seedTSEKpiCatalogIfMissing();
  seedTSMKpiCatalogIfMissing();
  seedSalesHeadKpiCatalogIfMissing();
  seedSalesManagerKpiCatalogIfMissing();
  seedClusterManagerKpiCatalogIfMissing();
  seedHRKpiCatalogIfMissing();
}
