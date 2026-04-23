import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { adminCookieName, createAdminSession } from "@/lib/admin-session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { password?: string; email?: string }
    | null;

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email) {
    return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ ok: false, error: "missing_password" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json(
      {
        ok: false,
        error: "supabase_auth_failed",
        detail: error?.message || "Unknown Supabase auth error",
      },
      { status: 401 },
    );
  }

  const token = await createAdminSession();
  const res = NextResponse.json({
    ok: true,
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
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
