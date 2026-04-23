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

  try {
    client = createClient(url, anonKey);
  } catch {
    // If env vars are malformed (common in deployments), don't crash builds.
    return null;
  }

  return client;
}

// Backward-compatible export used by older code paths.
// Note: intentionally NOT initialized at import-time to avoid build-time crashes.
export const supabase = null;
