import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { fromPaymentPagesRow, toPaymentPagesRow } from "@/lib/paymentPagesDb";

function requireOrgId(req) {
  const orgId = req.headers.get("x-org-id");
  if (!orgId || !String(orgId).trim()) return null;
  return String(orgId).trim();
}

export async function GET(req) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase env vars on server." },
      { status: 500 },
    );
  }

  const orgId = requireOrgId(req);
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header." }, { status: 400 });
  }

  const result = await supabase
    .from("payment_pages")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const pages = (result.data ?? [])
    .map((r) => fromPaymentPagesRow(r))
    .filter(Boolean);

  return NextResponse.json({ pages });
}

export async function POST(req) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase env vars on server." },
      { status: 500 },
    );
  }

  const orgId = requireOrgId(req);
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header." }, { status: 400 });
  }

  const body = await req.json();
  const page = body?.page;
  if (!page?.slug) {
    return NextResponse.json({ error: "Missing page.slug" }, { status: 400 });
  }

  // Your existing `payment_pages` schema requires `admin_id`.
  // Prefer explicit env var; fall back to reusing an existing page's admin_id.
  let adminId = process.env.SUPABASE_DEFAULT_ADMIN_ID || process.env.DEFAULT_ADMIN_ID;
  if (!adminId) {
    const existing = await supabase.from("payment_pages").select("admin_id").limit(1).maybeSingle();
    adminId = (existing.data && existing.data.admin_id) || null;
  }
  if (!adminId) {
    return NextResponse.json(
      {
        error:
          "Missing admin_id. Set SUPABASE_DEFAULT_ADMIN_ID (or DEFAULT_ADMIN_ID) to an existing auth.users id. On Vercel, also ensure SUPABASE_SERVICE_ROLE_KEY is set for server-side writes.",
      },
      { status: 500 },
    );
  }

  const insert = await supabase
    .from("payment_pages")
    .insert({ admin_id: adminId, organization_id: orgId, ...toPaymentPagesRow(page) })
    .select("*")
    .single();

  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  return NextResponse.json({ page: fromPaymentPagesRow(insert.data) });
}

