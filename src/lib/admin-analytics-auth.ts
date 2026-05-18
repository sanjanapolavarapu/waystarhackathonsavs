import "server-only";

import { cookies } from "next/headers";

import { adminCookieName, isValidAdminSession } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type AdminAnalyticsAuth =
  | { ok: true; admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>; userId: string }
  | { ok: false; status: number; message: string };

/**
 * Confirms the admin portal cookie and resolves the Supabase user id from the
 * caller's access token. Used before service-role reads so RLS does not block
 * reporting while still scoping data to org membership.
 */
export async function requireAdminAnalyticsAuth(req: Request): Promise<AdminAnalyticsAuth> {
  const jar = await cookies();
  const adminTok = jar.get(adminCookieName())?.value;
  if (!adminTok || !(await isValidAdminSession(adminTok))) {
    return { ok: false, status: 401, message: "Admin session required." };
  }

  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!bearer) {
    return { ok: false, status: 401, message: "Supabase session required. Sign in again." };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      message: "Server analytics unavailable (missing SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const { data, error } = await admin.auth.getUser(bearer);
  if (error || !data.user?.id) {
    return { ok: false, status: 401, message: "Invalid or expired Supabase session." };
  }

  return { ok: true, admin, userId: data.user.id };
}

export async function assertOrgMembership(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  userId: string,
  organizationId: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { data, error } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 500,
      message: `organization_members lookup failed: ${error.message}`,
    };
  }
  if (!data) {
    return { ok: false, status: 403, message: "You are not a member of this organization." };
  }
  return { ok: true };
}
