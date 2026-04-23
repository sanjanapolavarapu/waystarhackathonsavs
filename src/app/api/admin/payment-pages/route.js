import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPaymentPagesRow, toPaymentPagesRow } from "@/lib/paymentPagesDb";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase env vars on server." },
      { status: 500 },
    );
  }

  const result = await supabase
    .from("payment_pages")
    .select("*")
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
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase env vars on server." },
      { status: 500 },
    );
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
          "Missing admin_id. Set SUPABASE_DEFAULT_ADMIN_ID in .env.local to an existing auth.users id.",
      },
      { status: 500 },
    );
  }

  const insert = await supabase
    .from("payment_pages")
    .insert({ admin_id: adminId, ...toPaymentPagesRow(page) })
    .select("*")
    .single();

  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  return NextResponse.json({ page: fromPaymentPagesRow(insert.data) });
}

