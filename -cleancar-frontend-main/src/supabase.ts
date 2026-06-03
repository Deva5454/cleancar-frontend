/**
 * supabase.ts — STUB (Supabase removed)
 * 
 * This app runs entirely on localStorage. No backend sync.
 * This file exists only so any accidental import doesn't break the build.
 */

export const supabase = {
  from: () => ({
    select: async () => [],
    insert: async () => ({ error: null }),
    update: async () => ({ error: null }),
    delete: async () => ({ error: null }),
    upsert: async () => ({ error: null }),
  }),
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
};
