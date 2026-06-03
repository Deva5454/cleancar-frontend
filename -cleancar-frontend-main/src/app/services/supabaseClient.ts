/**
 * Supabase Client
 * Single instance used across the entire app
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace("http://", "https://");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Lightweight fetch-based Supabase client (no SDK needed)
export const supabase = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,

  async from(table: string) {
    return {
      select: async (columns = "*", filter?: { column: string; value: string }) => {
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}`;
        if (filter) url += `&${filter.column}=eq.${filter.value}`;
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
        return res.json();
      },

      selectAll: async (filter?: { column: string; value: string }) => {
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=data`;
        if (filter) url += `&${filter.column}=eq.${encodeURIComponent(filter.value)}`;
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Accept-Profile": "public",
          },
        });
        if (!res.ok) throw new Error(`Supabase ${table} error: ${res.status}`);
        const rows = await res.json();
        return rows.map((r: any) => r.data);
      },

      upsert: async (record: any) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify(record),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Supabase upsert error: ${err}`);
        }
        return true;
      },
    };
  },
};
