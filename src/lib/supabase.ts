import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw?: string) {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Keep the app usable in local/dev when env vars are not configured yet.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
