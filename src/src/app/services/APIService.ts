/**
 * APIService — localStorage-only stub (Supabase removed)
 *
 * All data is served from localStorage via DataService.
 * This stub exists so contexts that call useSync() compile cleanly.
 */

import { logger } from "./logger";

export type EntityKey =
  | "CUSTOMERS"
  | "JOBS"
  | "SUBSCRIPTIONS"
  | "FINANCE_MRR"
  | "FINANCE_PAYABLES"
  | "FINANCE_REVENUES"
  | "FINANCE_LEDGER"
  | "FINANCE_BUDGETS"
  | "FINANCE_ALERTS"
  | "FINANCE_RECOMMENDATIONS";

interface APIResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
}

class APIServiceClass {
  isEnabled(): boolean { return false; }
  setEnabled(_enabled: boolean) {}

  async get<T>(_entityKey: EntityKey): Promise<APIResponse<T>> {
    return { success: true, data: [] };
  }

  async set<T>(_entityKey: EntityKey, _data: T[]): Promise<APIResponse<T>> {
    return { success: true, data: [] };
  }

  async update<T>(_entityKey: EntityKey, _id: string, _data: Partial<T>): Promise<APIResponse<T>> {
    return { success: true, data: [] };
  }

  async delete(_entityKey: EntityKey, _id: string): Promise<APIResponse<never>> {
    return { success: true, data: [] };
  }
}

export const APIService = new APIServiceClass();
logger.log("[APIService] Running in localStorage-only mode");
