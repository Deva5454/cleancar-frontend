/**
 * supabaseClient.ts — STUB (Supabase removed)
 * 
 * The app runs in localStorage-only mode. isSupabaseEnabled is always false.
 */

export const isSupabaseEnabled = false;

export const supabase = {
  url: "",
  key: "",
  from: async (_table: string) => ({
    select: async () => [],
    selectAll: async () => [],
    upsert: async () => true,
  }),
};
