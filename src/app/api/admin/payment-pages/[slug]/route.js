import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { fromPaymentPagesRow, toPaymentPagesRow } from "@/lib/paymentPagesDb";
import { fromCustomFieldRow, toCustomFieldRow } from "@/lib/customFieldsDb";

function requireOrgId(req) {
  const orgId = req.headers.get("x-org-id");
  if (!orgId || !String(orgId).trim()) return null;
  return String(orgId).trim();
}

export async function GET(_req, { params }) {
  const { slug } = await params;
  const orgId = requireOrgId(_req);
  if (!orgId) return NextResponse.json({ error: "Missing x-org-id header." }, { status: 400 });

  const supabase = getSupabaseServerClient();
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
    .eq("organization_id", orgId)
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

export async function PUT(req, { params }) {
  const { slug } = await params;
  const body = await req.json();
  const page = body?.page;
  if (!page) return NextResponse.json({ error: "Missing page" }, { status: 400 });

  const orgId = requireOrgId(req);
  if (!orgId) return NextResponse.json({ error: "Missing x-org-id header." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase env vars on server." },
      { status: 500 },
    );
  }

  // We need the page id to sync custom fields.
  const existing = await supabase
    .from("payment_pages")
    .select("id")
    .eq("slug", slug)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const update = await supabase
    .from("payment_pages")
    .update(toPaymentPagesRow({ ...page, slug, organizationId: orgId }))
    .eq("slug", slug)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (update.error) {
    return NextResponse.json({ error: update.error.message }, { status: 500 });
  }

  const pageId = existing.data.id;
  const desiredFields = Array.isArray(page.fields) ? page.fields : [];

  // Simplest sync strategy without schema changes:
  // delete all existing fields for page, then insert current list.
  const del = await supabase.from("custom_fields").delete().eq("page_id", pageId);
  if (del.error) {
    return NextResponse.json({ error: del.error.message }, { status: 500 });
  }

  if (desiredFields.length) {
    const insertFields = await supabase
      .from("custom_fields")
      .insert(desiredFields.map((f) => toCustomFieldRow(f, pageId)))
      .select("*");

    if (insertFields.error) {
      return NextResponse.json({ error: insertFields.error.message }, { status: 500 });
    }
  }

  const updatedPage = fromPaymentPagesRow(update.data);
  if (!updatedPage) return NextResponse.json({ page: null }, { status: 404 });

  const fieldsResult = await supabase
    .from("custom_fields")
    .select("*")
    .eq("page_id", pageId)
    .order("display_order", { ascending: true });
  if (fieldsResult.error) {
    return NextResponse.json({ error: fieldsResult.error.message }, { status: 500 });
  }

  updatedPage.fields = (fieldsResult.data ?? [])
    .map((r) => fromCustomFieldRow(r))
    .filter(Boolean);

  return NextResponse.json({ page: updatedPage });
}

export async function DELETE(req, { params }) {
  const { slug } = await params;
  const orgId = requireOrgId(req);
  if (!orgId) return NextResponse.json({ error: "Missing x-org-id header." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase env vars on server." },
      { status: 500 },
    );
  }

  const existing = await supabase
    .from("payment_pages")
    .select("id")
    .eq("slug", slug)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 });
  }
  if (!existing.data) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const pageId = existing.data.id;

  const relatedDeletes = [
    supabase.from("page_visits").delete().eq("page_id", pageId),
    supabase.from("transactions").delete().eq("page_id", pageId),
    supabase.from("custom_fields").delete().eq("page_id", pageId),
  ];

  for (const op of relatedDeletes) {
    const result = await op;
    if (result.error && !/does not exist|relation.*not found/i.test(result.error.message)) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }

  const removed = await supabase
    .from("payment_pages")
    .delete()
    .eq("id", pageId)
    .eq("organization_id", orgId);

  if (removed.error) {
    return NextResponse.json({ error: removed.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

