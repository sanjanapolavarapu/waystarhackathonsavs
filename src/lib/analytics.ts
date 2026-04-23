import { getSupabaseClient } from "@/lib/supabase";

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export type PageInsightsMetrics = {
  conversionRate: number;
  mobileRate: number;
  failureRate: number;
  totalVisits: number;
  totalPaid: number;
  totalFailed: number;
  peakDay: string;
};

function isPaidStatus(status: string | null | undefined) {
  const s = String(status ?? "").toLowerCase();
  return s === "success" || s === "succeeded";
}

function isFailedStatus(status: string | null | undefined) {
  const s = String(status ?? "").toLowerCase();
  return s === "failed" || s === "canceled" || s === "cancelled";
}

/** Loads analytics for a payment page (DB metrics). Merge `avgFieldCount: page.fields.length` in the UI. */
export async function getPageInsights(pageId: string): Promise<PageInsightsMetrics> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { count: totalVisits, error: visitsErr } = await supabase
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .eq("page_id", pageId);
  if (visitsErr) throw visitsErr;

  const { count: mobileVisits, error: mobileErr } = await supabase
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .eq("page_id", pageId)
    .eq("device", "mobile");

  const tv = totalVisits ?? 0;
  const mv = mobileErr ? 0 : mobileVisits ?? 0;
  const mobileRate = tv > 0 ? (mv / tv) * 100 : 0;

  const { data: txRows, error: txErr } = await supabase
    .from("transactions")
    .select("id, status, created_at")
    .eq("page_id", pageId);
  if (txErr) throw txErr;

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

  return {
    conversionRate,
    mobileRate,
    failureRate,
    totalVisits: tv,
    totalPaid,
    totalFailed,
    peakDay,
  };
}
