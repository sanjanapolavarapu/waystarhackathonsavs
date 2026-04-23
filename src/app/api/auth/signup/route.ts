import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { adminCookieName, createAdminSession } from "@/lib/admin-session";

async function upsertUserProfile({
  admin,
  userId,
  email,
  name,
}: {
  // NOTE: This route is intentionally untyped w.r.t. your Supabase schema.
  // If you add generated `Database` types later, wire them in here.
  admin: SupabaseClient<any>;
  userId: string;
  email: string;
  name: string;
}) {
  const res = await admin.from("user_profiles").upsert(
      {
        id: userId,
        email,
        full_name: name,
      },
      { onConflict: "id" },
    );

  if (res.error) throw new Error(res.error.message);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; name?: string }
    | null;

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) return NextResponse.json({ ok: false, error: "missing_name" }, { status: 400 });
  if (!email) return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
  if (!password) {
    return NextResponse.json({ ok: false, error: "missing_password" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  // Preferred: service role can auto-confirm users for hackathons.
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRole) {
    const admin = createClient<any>(supabaseUrl, serviceRole);
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (created.error || !created.data.user?.id) {
      return NextResponse.json(
        { ok: false, error: "supabase_signup_failed", detail: created.error?.message || "createUser failed" },
        { status: 400 },
      );
    }

    const profileUpsertError = await upsertUserProfile({
      admin,
      userId: created.data.user.id,
      email,
      name,
    }).catch((e) => e);
    if (profileUpsertError) {
      return NextResponse.json(
        {
          ok: false,
          error: "profile_upsert_failed",
          detail:
            profileUpsertError instanceof Error ? profileUpsertError.message : String(profileUpsertError),
        },
        { status: 500 },
      );
    }

    // Immediately sign in via anon key to return a session.
    const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, error: "supabase_auth_failed", detail: error?.message || "signIn failed" },
        { status: 401 },
      );
    }

    const token = await createAdminSession();
    const res = NextResponse.json({
      ok: true,
      session: data.session
        ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
        : null,
    });
    res.cookies.set(adminCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  // Fallback: client signup (may require email confirmation depending on project settings).
  const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: "supabase_signup_failed", detail: error.message },
      { status: 400 },
    );
  }

  if (serviceRole && data.user?.id) {
    const admin = createClient<any>(supabaseUrl, serviceRole);
    const profileUpsertError = await upsertUserProfile({
      admin,
      userId: data.user.id,
      email,
      name,
    }).catch((e) => e);
    if (profileUpsertError) {
      return NextResponse.json(
        {
          ok: false,
          error: "profile_upsert_failed",
          detail:
            profileUpsertError instanceof Error ? profileUpsertError.message : String(profileUpsertError),
        },
        { status: 500 },
      );
    }
  }

  // If a session is returned, treat the user as logged in.
  const token = await createAdminSession();
  const res = NextResponse.json({
    ok: true,
    session: data.session
      ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
      : null,
    note: data.session ? null : "Check your email to confirm your account before signing in.",
  });
  res.cookies.set(adminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

