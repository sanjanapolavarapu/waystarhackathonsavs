import { NextResponse } from "next/server";

import { assertOrgMembership, requireAdminAnalyticsAuth } from "@/lib/admin-analytics-auth";

function isPaidStatus(status: string | null | undefined) {
  const s = String(status ?? "").toLowerCase();
  return s === "success" || s === "succeeded";
}

function isFailedStatus(status: string | null | undefined) {
  const s = String(status ?? "").toLowerCase();
  return s === "failed" || s === "canceled" || s === "cancelled";
}

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export async function GET(req: Request) {
  const auth = await requireAdminAnalyticsAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const url = new URL(req.url);
  const pageId = url.searchParams.get("pageId")?.trim() ?? "";
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId." }, { status: 400 });
  }

  const { data: pageRow, error: pageErr } = await auth.admin
    .from("payment_pages")
    .select("id, organization_id, slug")
    .eq("id", pageId)
    .maybeSingle();

  if (pageErr) {
    return NextResponse.json({ error: pageErr.message }, { status: 500 });
  }
  if (!pageRow) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  const orgId = pageRow.organization_id as string | null;
  if (orgId) {
    const member = await assertOrgMembership(auth.admin, auth.userId, orgId);
    if (!member.ok) {
      return NextResponse.json({ error: member.message }, { status: member.status });
    }
  }

  const { count: totalVisits, error: visitsErr } = await auth.admin
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .eq("page_id", pageId);
  if (visitsErr) {
    return NextResponse.json({ error: visitsErr.message }, { status: 500 });
  }

  const { count: mobileVisits, error: mobileErr } = await auth.admin
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .eq("page_id", pageId)
    .eq("device", "mobile");

  let startedVisits = 0;
  const startedRes = await auth.admin
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .eq("page_id", pageId)
    .eq("form_started", true);
  if (!startedRes.error) {
    startedVisits = startedRes.count ?? 0;
  }

  const tv = totalVisits ?? 0;
  const mv = mobileErr ? 0 : mobileVisits ?? 0;
  const mobileRate = tv > 0 ? (mv / tv) * 100 : 0;

  const { data: txRows, error: txErr } = await auth.admin
    .from("transactions")
    .select("id, status, created_at")
    .eq("page_id", pageId);
  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  const rows = (txRows ?? []) as Array<{ id: string; status?: string | null; created_at?: string | null }>;
  let totalPaid = 0;
  let totalFailed = 0;
  const dowCounts = new Map<number, number>();

  for (const row of rows) {
    if (isPaidStatus(row.status)) totalPaid += 1;
    if (isFailedStatus(row.status)) totalFailed += 1;
    if (row.created_at) {
      const dow = new Date(row.created_at).getDay();
      dowCounts.set(dow, (dowCounts.get(dow) ?? 0) + 1);
    }
  }

  const totalTx = rows.length;
  const failureRate = totalTx > 0 ? (totalFailed / totalTx) * 100 : 0;

  let peakDay = "";
  let best = -1;
  for (const [dow, c] of dowCounts) {
    if (c > best) {
      best = c;
      peakDay = DOW_NAMES[dow] ?? "";
    }
  }

  const conversionRate = tv > 0 ? (totalPaid / tv) * 100 : 0;

  return NextResponse.json({
    conversionRate,
    mobileRate,
    failureRate,
    totalVisits: tv,
    checkoutStarted: startedVisits,
    totalPaid,
    totalFailed,
    peakDay,
  });
}
