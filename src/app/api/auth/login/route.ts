import { NextResponse } from "next/server";

import { adminCookieName, createAdminSession } from "@/lib/admin-session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { password?: string; email?: string }
    | null;

  const password = typeof body?.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD || "admin";

  if (!password) {
    return NextResponse.json({ ok: false, error: "missing_password" }, { status: 400 });
  }
  if (password !== expected) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const token = await createAdminSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
