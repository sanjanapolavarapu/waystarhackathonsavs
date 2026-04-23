import { NextResponse } from "next/server";

import { assertOrgMembership, requireAdminAnalyticsAuth } from "@/lib/admin-analytics-auth";
import { buildPageVisitsOrgScope, buildTransactionOrgScope } from "@/lib/org-scope-filter";

function attachPageSlug<T extends { page_id?: string | null }>(
  rows: T[] | null,
  orgPages: Array<{ id: string; slug: string }> | null,
): Array<T & { page_slug: string | null }> {
  const slugByPageId = new Map((orgPages ?? []).map((p) => [p.id, p.slug]));
  return (rows ?? []).map((t) => ({
    ...t,
    page_slug: t.page_id ? slugByPageId.get(t.page_id) ?? null : null,
  }));
}

export async function GET(req: Request) {
  const auth = await requireAdminAnalyticsAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId")?.trim() ?? "";
  if (!organizationId) {
    return NextResponse.json({ error: "Missing organizationId." }, { status: 400 });
  }

  const member = await assertOrgMembership(auth.admin, auth.userId, organizationId);
  if (!member.ok) {
    return NextResponse.json({ error: member.message }, { status: member.status });
  }

  const { data: orgPages, error: pagesErr } = await auth.admin
    .from("payment_pages")
    .select("id, slug")
    .eq("organization_id", organizationId);

  if (pagesErr) {
    return NextResponse.json({ error: pagesErr.message }, { status: 500 });
  }

  const typedOrgPages = (orgPages ?? []) as Array<{ id: string; slug: string }>;
  const pageIds = typedOrgPages.map((r) => r.id).filter(Boolean);
  const slugs = typedOrgPages.map((r) => r.slug).filter(Boolean);
  const txOr = buildTransactionOrgScope(organizationId, pageIds);
  const visitsOr = buildPageVisitsOrgScope(organizationId, pageIds, slugs);

  const { data: transactions, error: txErr } = await auth.admin
    .from("transactions")
    .select("id, page_id, created_at, status, payment_method, amount, amount_cents, payer_email, gl_code")
    .or(txOr)
    .order("created_at", { ascending: false });

  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  let visitsWarning: string | null = null;
  let page_visits: unknown[] = [];

  const visitsRes = await auth.admin
    .from("page_visits")
    .select("id, page_slug, visited_at, form_started")
    .or(visitsOr)
    .order("visited_at", { ascending: false });

  if (visitsRes.error) {
    visitsWarning =
      "Page visit tracking query failed. Ensure page_visits exists (scripts/create-page-visits-table.sql).";
    page_visits = [];
  } else {
    page_visits = visitsRes.data ?? [];
  }

  return NextResponse.json({
    transactions: attachPageSlug(transactions ?? [], typedOrgPages),
    page_visits,
    visitsWarning,
  });
}
