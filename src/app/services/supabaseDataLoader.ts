/**
 * supabaseDataLoader.ts — STUB (Supabase removed)
 * 
 * All data comes from localStorage seed (seedAllData.ts).
 * No remote fetch needed.
 */

export async function loadInitialData(): Promise<void> {
  // No-op: data already seeded to localStorage by main.tsx
  return Promise.resolve();
}

export async function syncToSupabase(_key: string, _data: unknown[]): Promise<void> {
  // No-op: localStorage is the single source of truth
  return Promise.resolve();
}
