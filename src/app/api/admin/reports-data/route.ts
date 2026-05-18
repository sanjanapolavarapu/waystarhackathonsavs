import { NextResponse } from "next/server";

import { assertOrgMembership, requireAdminAnalyticsAuth } from "@/lib/admin-analytics-auth";
import {
  buildPageVisitsMultiOrgScope,
  buildPageVisitsOrgScope,
  buildTransactionMultiOrgScope,
  buildTransactionOrgScope,
} from "@/lib/org-scope-filter";

function attachContext<T extends { page_id?: string | null; organization_id?: string | null }>(
  rows: T[] | null,
  pages: Array<{ id: string; slug: string; organization_id: string | null }> | null,
  orgNameById: Map<string, string>,
): Array<T & { page_slug: string | null; organization_name: string | null }> {
  const pageById = new Map((pages ?? []).map((p) => [p.id, p]));
  return (rows ?? []).map((t) => {
    const page = t.page_id ? pageById.get(t.page_id) : undefined;
    const orgId = (t.organization_id ?? page?.organization_id ?? null) as string | null;
    const orgName = orgId ? orgNameById.get(orgId) ?? null : null;
    return {
      ...t,
      page_slug: page ? page.slug : null,
      organization_id: orgId,
      organization_name: orgName,
    };
  });
}

export async function GET(req: Request) {
  const auth = await requireAdminAnalyticsAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId")?.trim() ?? "";
    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId." }, { status: 400 });
    }

    const allOrgs = organizationId === "all";
  let orgIds: string[] = [];
  let orgNameById = new Map<string, string>();

  if (allOrgs) {
    // Resolve all orgs for this user.
    const { data, error } = await auth.admin
      .from("organization_members")
      .select("organization_id, organizations:organization_id ( id, name )")
      .eq("user_id", auth.userId);

    if (error) {
      return NextResponse.json({ error: `organization_members lookup failed: ${error.message}` }, { status: 500 });
    }

    const rows = (data ?? []) as Array<{
      organization_id: string | null;
      organizations: { id: string; name: string } | { id: string; name: string }[] | null;
    }>;

    orgIds = rows.map((r) => r.organization_id).filter((x): x is string => Boolean(x));
    const orgs = rows
      .flatMap((r) => (Array.isArray(r.organizations) ? r.organizations : r.organizations ? [r.organizations] : []))
      .filter((o): o is { id: string; name: string } => Boolean(o?.id));
    orgNameById = new Map(orgs.map((o) => [o.id, o.name]));
  } else {
    const member = await assertOrgMembership(auth.admin, auth.userId, organizationId);
    if (!member.ok) {
      return NextResponse.json({ error: member.message }, { status: member.status });
    }
    orgIds = [organizationId];
    // Fetch org name (nice-to-have for CSV + combined view consistency).
    const { data: orgRow } = await auth.admin.from("organizations").select("id, name").eq("id", organizationId).maybeSingle();
    if (orgRow?.id && orgRow.name) {
      orgNameById = new Map([[String(orgRow.id), String(orgRow.name)]]);
    }
  }

  if (orgIds.length === 0) {
    return NextResponse.json({ transactions: [], page_visits: [], visitsWarning: null });
  }

  const { data: orgPages, error: pagesErr } = await auth.admin
    .from("payment_pages")
    .select("id, slug, organization_id")
    .in("organization_id", orgIds);

  if (pagesErr) {
    return NextResponse.json({ error: pagesErr.message }, { status: 500 });
  }

  const typedOrgPages = (orgPages ?? []) as Array<{ id: string; slug: string; organization_id: string | null }>;
  const pageIds = typedOrgPages.map((r) => r.id).filter(Boolean);
  const slugs = typedOrgPages.map((r) => r.slug).filter(Boolean);
  const txOr = allOrgs
    ? buildTransactionMultiOrgScope(orgIds, pageIds)
    : buildTransactionOrgScope(organizationId, pageIds);
  const visitsOr = allOrgs
    ? buildPageVisitsMultiOrgScope(orgIds, pageIds, slugs)
    : buildPageVisitsOrgScope(organizationId, pageIds, slugs);

  const { data: transactions, error: txErr } = await auth.admin
    .from("transactions")
    .select("id, organization_id, page_id, created_at, status, payment_method, amount, payer_email, gl_codes")
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
    const msg = String(visitsRes.error.message ?? "").toLowerCase();
    const missingFormStarted =
      msg.includes("form_started") && (msg.includes("does not exist") || msg.includes("could not find"));

    // Older `page_visits` tables may not have `form_started` yet.
    if (missingFormStarted) {
      const fallback = await auth.admin
        .from("page_visits")
        .select("id, page_slug, visited_at")
        .or(visitsOr)
        .order("visited_at", { ascending: false });

      if (fallback.error) {
        visitsWarning = `Page visit tracking query failed: ${fallback.error.message}. Run scripts/migrate-page-visits.sql in Supabase.`;
        page_visits = [];
      } else {
        // Visits load; "Started form" stays 0 until form_started column exists.
        page_visits = (fallback.data ?? []).map((r) => ({ ...r, form_started: false }));
      }
    } else {
      visitsWarning = `Page visit tracking query failed: ${visitsRes.error.message}. Run scripts/migrate-page-visits.sql in Supabase.`;
      page_visits = [];
    }
  } else {
    page_visits = visitsRes.data ?? [];
  }

    return NextResponse.json({
      transactions: attachContext(transactions ?? [], typedOrgPages, orgNameById).map((t) => {
        const gls = (t as unknown as { gl_codes?: unknown }).gl_codes;
        const first =
          Array.isArray(gls) && gls.length > 0 && typeof gls[0] === "string" ? String(gls[0]) : null;
        return { ...t, gl_code: first };
      }),
      page_visits,
      visitsWarning,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: `reports-data failed: ${msg}` }, { status: 500 });
  }
}
