import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPaymentPagesRow } from "@/lib/paymentPagesDb";
import { fromCustomFieldRow } from "@/lib/customFieldsDb";

// Public read-only endpoint for pay pages.
export async function GET(_req, { params }) {
  const { slug } = await params;

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
    .eq("slug", slug)
    .maybeSingle();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  if (!result.data) {
    return NextResponse.json({ page: null }, { status: 404 });
  }

  const page = fromPaymentPagesRow(result.data);
  if (!page) return NextResponse.json({ page: null }, { status: 404 });

  const fieldsResult = await supabase
    .from("custom_fields")
    .select("*")
    .eq("page_id", result.data.id)
    .order("display_order", { ascending: true });

  if (fieldsResult.error) {
    return NextResponse.json({ error: fieldsResult.error.message }, { status: 500 });
  }

  page.fields = (fieldsResult.data ?? [])
    .map((r) => fromCustomFieldRow(r))
    .filter(Boolean);

  return NextResponse.json({ page });
}

