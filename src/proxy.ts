import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function secret() {
  const s = process.env.ADMIN_AUTH_SECRET || process.env.AUTH_SECRET || "dev_only_change_me";
  return new TextEncoder().encode(s);
}

async function hasValidAdminCookie(req: NextRequest) {
  const token = req.cookies.get("qpp_admin")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth endpoints and auth pages without session.
  if (pathname === "/admin/login" || pathname === "/admin/signup") {
    const ok = await hasValidAdminCookie(req);
    if (ok) return NextResponse.redirect(new URL("/admin/pages", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Gate the rest of the app.
  const ok = await hasValidAdminCookie(req);
  if (!ok) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Treat "/" as a landing redirect into Pages.
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/admin/pages", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run for all pages except Next internals/static assets.
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

