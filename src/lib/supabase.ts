import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function normalizeSupabaseUrl(raw?: string) {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

function getEnvConfig() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return { url, anonKey };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getEnvConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseClient() {
  const { url, anonKey } = getEnvConfig();
  if (!url || !anonKey) return null;
  if (client) return client;

  client = createClient(url, anonKey);

  return client;
}

// Backward-compatible export used by db helpers.
export const supabase = getSupabaseClient();
