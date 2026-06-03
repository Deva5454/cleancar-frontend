import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars missing: create a no-op client instead of throwing at module load time
// This prevents the app from crashing on first paint when Supabase is not configured.
const _url = supabaseUrl || "https://placeholder.supabase.co";
const _key = supabaseKey || "placeholder-key";

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[CleanCar ERP] Supabase env vars missing. Running in localStorage-only mode.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Environment Variables.'
  );
}

export const supabase = createClient(_url, _key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-app-name': 'cleancar-360-erp' },
  },
});
