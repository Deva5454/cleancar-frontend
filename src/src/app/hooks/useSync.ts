/**
 * useSync — no-op hook (Supabase removed)
 * 
 * Data is already persisted to localStorage via DataService in each context.
 * This hook is a zero-cost stub so existing call sites compile unchanged.
 */

import type { EntityKey } from "../services/APIService";

export function useSync<T>(_entityKey: EntityKey, _data: T[]): void {
  // No-op: localStorage via DataService is the only persistence layer.
}
